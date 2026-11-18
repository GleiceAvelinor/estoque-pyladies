import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL não configurada no servidor.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  // Auto-migração: adiciona coluna preco_custo se não existir
  await sql`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS preco_custo NUMERIC(10,2) NOT NULL DEFAULT 0.00`;

  try {
    if (req.method === 'GET') {
      const produtos = await sql`SELECT * FROM produtos ORDER BY nome ASC, tamanho ASC`;
      return res.status(200).json(produtos);
    }

    if (req.method === 'POST') {
      const { nome, categoria, tamanho, preco, preco_custo, estoque } = req.body || {};

      const nomeLimpo = nome ? String(nome).trim() : '';
      const categoriaLimpa = categoria ? String(categoria).trim() : 'Outros';
      const tamanhoLimpo = tamanho ? String(tamanho).trim() : 'Único';
      const precoNum = Number(String(preco ?? '').replace(',', '.'));
      const precoCustoNum = Number(String(preco_custo ?? '0').replace(',', '.'));
      const estoqueNum = Number(estoque);

      if (!nomeLimpo) {
        return res.status(400).json({ error: 'O nome do produto é obrigatório.' });
      }
      if (isNaN(precoNum) || precoNum < 0) {
        return res.status(400).json({ error: 'O preço informado é inválido.' });
      }
      if (isNaN(precoCustoNum) || precoCustoNum < 0) {
        return res.status(400).json({ error: 'O preço de custo informado é inválido.' });
      }
      if (isNaN(estoqueNum) || estoqueNum < 0 || !Number.isInteger(estoqueNum)) {
        return res.status(400).json({ error: 'A quantidade em estoque deve ser um número inteiro maior ou igual a zero.' });
      }

      const [novo] = await sql`
        INSERT INTO produtos (nome, categoria, tamanho, preco, preco_custo, estoque)
        VALUES (${nomeLimpo}, ${categoriaLimpa}, ${tamanhoLimpo}, ${precoNum}, ${precoCustoNum}, ${estoqueNum})
        RETURNING *
      `;
      return res.status(201).json(novo);
    }

    if (req.method === 'PUT') {
      const { id, estoque, delta, preco, preco_custo } = req.body || {};
      const idNum = Number(id);

      if (!id || isNaN(idNum)) {
        return res.status(400).json({ error: 'ID do produto não informado ou inválido.' });
      }

      let atualizado;
      if (delta !== undefined) {
        const deltaNum = Number(delta);
        if (isNaN(deltaNum) || !Number.isInteger(deltaNum)) {
          return res.status(400).json({ error: 'Variação de estoque inválida.' });
        }
        const rows = await sql`
          UPDATE produtos 
          SET estoque = GREATEST(0, estoque + ${deltaNum}) 
          WHERE id = ${idNum} 
          RETURNING *
        `;
        atualizado = rows[0];
      } else if (estoque !== undefined) {
        const estoqueNum = Number(estoque);
        if (isNaN(estoqueNum) || estoqueNum < 0 || !Number.isInteger(estoqueNum)) {
          return res.status(400).json({ error: 'Estoque inválido. Deve ser um número inteiro maior ou igual a zero.' });
        }
        const rows = await sql`
          UPDATE produtos 
          SET estoque = ${estoqueNum} 
          WHERE id = ${idNum} 
          RETURNING *
        `;
        atualizado = rows[0];
      } else if (preco !== undefined || preco_custo !== undefined) {
        const precoNum = preco !== undefined ? Number(String(preco).replace(',', '.')) : null;
        const precoCustoNum = preco_custo !== undefined ? Number(String(preco_custo).replace(',', '.')) : null;

        if (precoNum !== null && (isNaN(precoNum) || precoNum < 0)) {
          return res.status(400).json({ error: 'Preço de venda informado é inválido.' });
        }
        if (precoCustoNum !== null && (isNaN(precoCustoNum) || precoCustoNum < 0)) {
          return res.status(400).json({ error: 'Preço de custo informado é inválido.' });
        }

        const rows = await sql`
          UPDATE produtos
          SET 
            preco = COALESCE(${precoNum}, preco),
            preco_custo = COALESCE(${precoCustoNum}, preco_custo)
          WHERE id = ${idNum}
          RETURNING *
        `;
        atualizado = rows[0];
      } else {
        return res.status(400).json({ error: 'Nenhum campo para atualização foi informado.' });
      }

      if (!atualizado) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      return res.status(200).json(atualizado);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const idNum = Number(id);

      if (!id || isNaN(idNum)) {
        return res.status(400).json({ error: 'ID do produto não informado ou inválido.' });
      }

      try {
        const rows = await sql`DELETE FROM produtos WHERE id = ${idNum} RETURNING id`;
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Produto não encontrado.' });
        }
        return res.status(200).json({ ok: true });
      } catch (dbError) {
        if (dbError.code === '23503' || String(dbError.message).includes('violates foreign key constraint')) {
          return res.status(400).json({ 
            error: 'Não é possível excluir este produto pois já existem vendas registradas para ele. Sugestão: zere o estoque.' 
          });
        }
        throw dbError;
      }
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro em produtos:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}
