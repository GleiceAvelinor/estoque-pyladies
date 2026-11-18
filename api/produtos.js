import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'GET') {
      const produtos = await sql`SELECT * FROM produtos ORDER BY nome ASC, tamanho ASC`;
      return res.status(200).json(produtos);
    }

    if (req.method === 'POST') {
      const { nome, categoria, tamanho, preco, estoque } = req.body;
      const [novo] = await sql`
        INSERT INTO produtos (nome, categoria, tamanho, preco, estoque)
        VALUES (${nome}, ${categoria}, ${tamanho}, ${Number(preco)}, ${Number(estoque)})
        RETURNING *
      `;
      return res.status(201).json(novo);
    }

    if (req.method === 'PUT') {
      const { id, estoque } = req.body;
      const [atualizado] = await sql`
        UPDATE produtos SET estoque = ${Number(estoque)} WHERE id = ${Number(id)} RETURNING *
      `;
      return res.status(200).json(atualizado);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM produtos WHERE id = ${Number(id)}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}