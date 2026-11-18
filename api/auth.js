import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL não configurada no servidor.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { acao } = req.body || {};

    if (acao === 'login') {
      const { email, senha } = req.body || {};
      if (!email || !senha) {
        return res.status(400).json({ error: 'Informe e-mail e senha.' });
      }

      const emailNormalizado = String(email).trim().toLowerCase();
      const [user] = await sql`SELECT * FROM usuarios WHERE LOWER(email) = ${emailNormalizado}`;
      if (!user) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }

      const senhaValida = await bcrypt.compare(String(senha), user.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }

      return res.status(200).json({ id: user.id, nome: user.nome, email: user.email });
    }

    if (acao === 'cadastro') {
      const { nome, email, senha } = req.body || {};
      const nomeLimpo = nome ? String(nome).trim() : '';
      const emailNormalizado = email ? String(email).trim().toLowerCase() : '';
      const senhaStr = senha ? String(senha) : '';

      if (!nomeLimpo || !emailNormalizado || !senhaStr) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
        return res.status(400).json({ error: 'Formato de e-mail inválido.' });
      }

      if (senhaStr.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      }

      const [existente] = await sql`SELECT id FROM usuarios WHERE LOWER(email) = ${emailNormalizado}`;
      if (existente) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      }

      const salt = await bcrypt.genSalt(10);
      const senha_hash = await bcrypt.hash(senhaStr, salt);

      const [novoUser] = await sql`
        INSERT INTO usuarios (nome, email, senha_hash)
        VALUES (${nomeLimpo}, ${emailNormalizado}, ${senha_hash})
        RETURNING id, nome, email
      `;
      return res.status(201).json(novoUser);
    }

    if (acao === 'recuperar') {
      const { email, novaSenha } = req.body || {};
      const emailNormalizado = email ? String(email).trim().toLowerCase() : '';
      const senhaStr = novaSenha ? String(novaSenha) : '';

      if (!emailNormalizado || !senhaStr) {
        return res.status(400).json({ error: 'Informe o e-mail e a nova senha.' });
      }

      if (senhaStr.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
      }

      const [user] = await sql`SELECT id FROM usuarios WHERE LOWER(email) = ${emailNormalizado}`;
      if (!user) {
        return res.status(404).json({ error: 'E-mail não encontrado no sistema.' });
      }

      const salt = await bcrypt.genSalt(10);
      const senha_hash = await bcrypt.hash(senhaStr, salt);

      await sql`UPDATE usuarios SET senha_hash = ${senha_hash} WHERE id = ${user.id}`;
      return res.status(200).json({ ok: true, message: 'Senha redefinida com sucesso!' });
    }

    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (error) {
    console.error('Erro em auth:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}
