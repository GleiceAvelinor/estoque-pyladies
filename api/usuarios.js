import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL não configurada no servidor.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Garante que as colunas status e perfil existam
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente'`;
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil VARCHAR(20) DEFAULT 'membro'`;

    // Listar usuárias
    if (req.method === 'GET') {
      const usuarios = await sql`
        SELECT id, nome, email, perfil, status, criado_em 
        FROM usuarios 
        ORDER BY criado_em DESC
      `;
      return res.status(200).json(usuarios);
    }

    // Atualizar status (aprovado / bloqueado / pendente) ou perfil (admin / membro)
    if (req.method === 'PUT') {
      const { id, status, perfil } = req.body || {};
      const idNum = Number(id);

      if (!id || isNaN(idNum)) {
        return res.status(400).json({ error: 'ID da usuária não informado ou inválido.' });
      }

      const statusValidos = ['pendente', 'aprovado', 'bloqueado'];
      const perfisValidos = ['admin', 'membro'];

      if (status && !statusValidos.includes(status)) {
        return res.status(400).json({ error: 'Status inválido.' });
      }
      if (perfil && !perfisValidos.includes(perfil)) {
        return res.status(400).json({ error: 'Perfil inválido.' });
      }

      let atualizado;
      if (status && perfil) {
        const rows = await sql`
          UPDATE usuarios 
          SET status = ${status}, perfil = ${perfil} 
          WHERE id = ${idNum} 
          RETURNING id, nome, email, perfil, status
        `;
        atualizado = rows[0];
      } else if (status) {
        const rows = await sql`
          UPDATE usuarios 
          SET status = ${status} 
          WHERE id = ${idNum} 
          RETURNING id, nome, email, perfil, status
        `;
        atualizado = rows[0];
      } else if (perfil) {
        const rows = await sql`
          UPDATE usuarios 
          SET perfil = ${perfil} 
          WHERE id = ${idNum} 
          RETURNING id, nome, email, perfil, status
        `;
        atualizado = rows[0];
      } else {
        return res.status(400).json({ error: 'Informe status ou perfil para atualizar.' });
      }

      if (!atualizado) {
        return res.status(404).json({ error: 'Usuária não encontrada.' });
      }

      return res.status(200).json(atualizado);
    }

    // Excluir usuária
    if (req.method === 'DELETE') {
      const { id } = req.query;
      const idNum = Number(id);

      if (!id || isNaN(idNum)) {
        return res.status(400).json({ error: 'ID da usuária não informado ou inválido.' });
      }

      const rows = await sql`DELETE FROM usuarios WHERE id = ${idNum} RETURNING id`;
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Usuária não encontrada.' });
      }

      return res.status(200).json({ ok: true, message: 'Usuária removida com sucesso.' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro em usuarios:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}
