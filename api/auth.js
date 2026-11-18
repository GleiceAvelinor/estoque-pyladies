import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { acao } = req.body;

    if (acao === 'login') {
      const { email, senha } = req.body;
      const [user] = await sql`SELECT * FROM usuarios WHERE email = ${email}`;
      if (!user) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });

      const senhaValida = await bcrypt.compare(senha, user.senha_hash);
      if (!senhaValida) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });

      return res.status(200).json({ id: user.id, nome: user.nome, email: user.email });
    }

    if (acao === 'cadastro') {
      const { nome, email, senha } = req.body;
      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos.' });
      }
      const [existente] = await sql`SELECT id FROM usuarios WHERE email = ${email}`;
      if (existente) return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });

      const salt = await bcrypt.genSalt(10);
      const senha_hash = await bcrypt.hash(senha, salt);

      const [novoUser] = await sql`
        INSERT INTO usuarios (nome, email, senha_hash)
        VALUES (${nome}, ${email}, ${senha_hash})
        RETURNING id, nome, email
      `;
      return res.status(201).json(novoUser);
    }

    if (acao === 'recuperar') {
      const { email, novaSenha } = req.body;
      const [user] = await sql`SELECT id FROM usuarios WHERE email = ${email}`;
      if (!user) return res.status(404).json({ error: 'E-mail não encontrado no sistema.' });

      const salt = await bcrypt.genSalt(10);
      const senha_hash = await bcrypt.hash(novaSenha, salt);

      await sql`UPDATE usuarios SET senha_hash = ${senha_hash} WHERE email = ${email}`;
      return res.status(200).json({ ok: true, message: 'Senha redefinida com sucesso!' });
    }

    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}