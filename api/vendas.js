import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL não configurada no servidor.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  // Auto-migrações da tabela vendas
  await sql`ALTER TABLE vendas ADD COLUMN IF NOT EXISTS preco_custo NUMERIC(10,2) NOT NULL DEFAULT 0.00`;
  await sql`ALTER TABLE vendas ADD COLUMN IF NOT EXISTS itens JSONB DEFAULT '[]'`;
  await sql`ALTER TABLE vendas ALTER COLUMN produto_nome TYPE TEXT`;

  try {
    if (req.method === 'GET') {
      const vendas = await sql`SELECT * FROM vendas ORDER BY data_venda DESC`;
      return res.status(200).json(vendas);
    }

    if (req.method === 'POST') {
      const { itens, produto_id, quantidade, cliente, pagamento } = req.body || {};

      let itensParaProcessar = [];
      if (Array.isArray(itens) && itens.length > 0) {
        itensParaProcessar = itens.map(i => ({
          produto_id: Number(i.produto_id),
          quantidade: Number(i.quantidade)
        }));
      } else if (produto_id && quantidade) {
        itensParaProcessar = [{
          produto_id: Number(produto_id),
          quantidade: Number(quantidade)
        }];
      }

      if (itensParaProcessar.length === 0) {
        return res.status(400).json({ error: 'Adicione pelo menos um produto ao pedido antes de finalizar a venda.' });
      }

      for (const item of itensParaProcessar) {
        if (!item.produto_id || isNaN(item.produto_id)) {
          return res.status(400).json({ error: 'Identificação de produto inválida na venda.' });
        }
        if (!item.quantidade || isNaN(item.quantidade) || item.quantidade <= 0 || !Number.isInteger(item.quantidade)) {
          return res.status(400).json({ error: 'A quantidade de cada produto deve ser um número inteiro positivo maior que zero.' });
        }
      }

      if (!pagamento || !String(pagamento).trim()) {
        return res.status(400).json({ error: 'Selecione a forma de pagamento.' });
      }

      // Dedução atômica do estoque de cada item com rollback em caso de falha
      const itensDeduzidos = [];
      for (const item of itensParaProcessar) {
        const [produtoAtualizado] = await sql`
          UPDATE produtos 
          SET estoque = estoque - ${item.quantidade} 
          WHERE id = ${item.produto_id} AND estoque >= ${item.quantidade}
          RETURNING *
        `;

        if (!produtoAtualizado) {
          // Reverte o estoque dos itens já deduzidos nesta transação
          for (const revert of itensDeduzidos) {
            await sql`UPDATE produtos SET estoque = estoque + ${revert.quantidade} WHERE id = ${revert.produto.id}`.catch(console.error);
          }
          const [existe] = await sql`SELECT nome, tamanho, estoque FROM produtos WHERE id = ${item.produto_id}`;
          if (!existe) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
          }
          return res.status(400).json({ 
            error: `Estoque insuficiente para "${existe.nome} (Tam: ${existe.tamanho})". Disponível: ${existe.estoque} un.` 
          });
        }

        itensDeduzidos.push({
          produto: produtoAtualizado,
          quantidade: item.quantidade
        });
      }

      const valorTotal = itensDeduzidos.reduce((acc, d) => acc + (Number(d.produto.preco) * d.quantidade), 0);
      const custoTotal = itensDeduzidos.reduce((acc, d) => acc + (Number(d.produto.preco_custo || 0) * d.quantidade), 0);
      const quantidadeTotal = itensDeduzidos.reduce((acc, d) => acc + d.quantidade, 0);
      const resumoNomes = itensDeduzidos.map(d => `${d.produto.nome} (${d.produto.tamanho}) x${d.quantidade}`).join(', ');
      const itensDetalhados = itensDeduzidos.map(d => ({
        produto_id: d.produto.id,
        nome: d.produto.nome,
        tamanho: d.produto.tamanho,
        preco: Number(d.produto.preco),
        preco_custo: Number(d.produto.preco_custo || 0),
        quantidade: d.quantidade,
        subtotal: Number(d.produto.preco) * d.quantidade
      }));

      const primeiroProdutoId = itensDeduzidos.length === 1 ? itensDeduzidos[0].produto.id : null;
      const clienteLimpo = cliente && String(cliente).trim() ? String(cliente).trim() : 'Não informado';
      const pagamentoLimpo = String(pagamento).trim();

      try {
        const [venda] = await sql`
          INSERT INTO vendas (produto_id, produto_nome, quantidade, valor_total, preco_custo, itens, cliente, pagamento)
          VALUES (${primeiroProdutoId}, ${resumoNomes}, ${quantidadeTotal}, ${valorTotal}, ${custoTotal}, ${JSON.stringify(itensDetalhados)}, ${clienteLimpo}, ${pagamentoLimpo})
          RETURNING *
        `;
        return res.status(201).json(venda);
      } catch (insertError) {
        // Rollback defensivo da dedução do estoque caso o insert falhe
        for (const revert of itensDeduzidos) {
          await sql`UPDATE produtos SET estoque = estoque + ${revert.quantidade} WHERE id = ${revert.produto.id}`.catch(console.error);
        }
        throw insertError;
      }
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro em vendas:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}
