import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'GET') {
      const vendas = await sql`SELECT * FROM vendas ORDER BY data_venda DESC`;
      return res.status(200).json(vendas);
    }

    if (req.method === 'POST') {
      const { produto_id, quantidade, cliente, pagamento } = req.body;
      const qtd = Number(quantidade);

      const [produto] = await sql`SELECT * FROM produtos WHERE id = ${Number(produto_id)}`;
      if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
      if (produto.estoque < qtd) return res.status(400).json({ error: 'Estoque insuficiente' });

      const valorTotal = Number(produto.preco) * qtd;
      const nomeCompleto = `${produto.nome} (Tam: ${produto.tamanho})`;

      const [venda] = await sql`
        INSERT INTO vendas (produto_id, produto_nome, quantidade, valor_total, cliente, pagamento)
        VALUES (${produto.id}, ${nomeCompleto}, ${qtd}, ${valorTotal}, ${cliente || 'Não informado'}, ${pagamento})
        RETURNING *
      `;

      await sql`
        UPDATE produtos SET estoque = estoque - ${qtd} WHERE id = ${produto.id}
      `;

      return res.status(201).json(venda);
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}