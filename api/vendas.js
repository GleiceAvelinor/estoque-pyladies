import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL não configurada no servidor.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  // Auto-migração: adiciona coluna preco_custo na tabela vendas se não existir
  await sql`ALTER TABLE vendas ADD COLUMN IF NOT EXISTS preco_custo NUMERIC(10,2) NOT NULL DEFAULT 0.00`;

  try {
    if (req.method === 'GET') {
      const vendas = await sql`SELECT * FROM vendas ORDER BY data_venda DESC`;
      return res.status(200).json(vendas);
    }

    if (req.method === 'POST') {
      const { produto_id, quantidade, cliente, pagamento } = req.body || {};
      const produtoIdNum = Number(produto_id);
      const qtd = Number(quantidade);

      if (!produto_id || isNaN(produtoIdNum)) {
        return res.status(400).json({ error: 'Selecione um produto válido.' });
      }
      if (!qtd || isNaN(qtd) || qtd <= 0 || !Number.isInteger(qtd)) {
        return res.status(400).json({ error: 'A quantidade deve ser um número inteiro positivo maior que zero.' });
      }
      if (!pagamento || !String(pagamento).trim()) {
        return res.status(400).json({ error: 'Selecione a forma de pagamento.' });
      }

      // Atualização atômica do estoque para evitar concorrência e estoque negativo
      const [produtoAtualizado] = await sql`
        UPDATE produtos 
        SET estoque = estoque - ${qtd} 
        WHERE id = ${produtoIdNum} AND estoque >= ${qtd}
        RETURNING *
      `;

      if (!produtoAtualizado) {
        const [existe] = await sql`SELECT estoque FROM produtos WHERE id = ${produtoIdNum}`;
        if (!existe) {
          return res.status(404).json({ error: 'Produto não encontrado.' });
        }
        return res.status(400).json({ 
          error: `Estoque insuficiente. Quantidade disponível atualmente: ${existe.estoque} un.` 
        });
      }

      const valorTotal = Number(produtoAtualizado.preco) * qtd;
      const precoCustoUnitario = Number(produtoAtualizado.preco_custo || 0);
      const nomeCompleto = `${produtoAtualizado.nome} (Tam: ${produtoAtualizado.tamanho})`;
      const clienteLimpo = cliente && String(cliente).trim() ? String(cliente).trim() : 'Não informado';
      const pagamentoLimpo = String(pagamento).trim();

      try {
        const [venda] = await sql`
          INSERT INTO vendas (produto_id, produto_nome, quantidade, valor_total, preco_custo, cliente, pagamento)
          VALUES (${produtoAtualizado.id}, ${nomeCompleto}, ${qtd}, ${valorTotal}, ${precoCustoUnitario}, ${clienteLimpo}, ${pagamentoLimpo})
          RETURNING *
        `;
        return res.status(201).json(venda);
      } catch (insertError) {
        // Rollback defensivo da dedução do estoque caso o insert falhe
        await sql`UPDATE produtos SET estoque = estoque + ${qtd} WHERE id = ${produtoAtualizado.id}`.catch(console.error);
        throw insertError;
      }
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro em vendas:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}
