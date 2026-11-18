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
    // Garante que as colunas status e perfil existam (migração transparente)
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente'`;
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil VARCHAR(20) DEFAULT 'membro'`;

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

      // Verificação de autorização e status de aprovação
      const status = user.status || 'aprovado';
      if (status === 'pendente') {
        return res.status(403).json({ 
          error: 'Sua conta está aguardando aprovação de uma administradora do PyLadies Fortaleza.' 
        });
      }
      if (status === 'bloqueado') {
        return res.status(403).json({ 
          error: 'Sua conta foi desativada. Entre em contato com a coordenação do PyLadies.' 
        });
      }

      return res.status(200).json({ 
        id: user.id, 
        nome: user.nome, 
        email: user.email,
        perfil: user.perfil || 'membro',
        status: status
      });
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

      // Se for a primeira usuária do sistema, vira administradora aprovada automaticamente
      const countResult = await sql`SELECT COUNT(*)::int as total FROM usuarios`;
      const isPrimeiraUsuaria = Number(countResult[0]?.total || 0) === 0;

      const statusInicial = isPrimeiraUsuaria ? 'aprovado' : 'pendente';
      const perfilInicial = isPrimeiraUsuaria ? 'admin' : 'membro';

      const salt = await bcrypt.genSalt(10);
      const senha_hash = await bcrypt.hash(senhaStr, salt);

      const [novoUser] = await sql`
        INSERT INTO usuarios (nome, email, senha_hash, status, perfil)
        VALUES (${nomeLimpo}, ${emailNormalizado}, ${senha_hash}, ${statusInicial}, ${perfilInicial})
        RETURNING id, nome, email, status, perfil
      `;

      if (isPrimeiraUsuaria) {
        return res.status(201).json({
          id: novoUser.id,
          nome: novoUser.nome,
          email: novoUser.email,
          status: novoUser.status,
          perfil: novoUser.perfil,
          mensagem: 'Primeira administradora cadastrada com sucesso!'
        });
      }

      return res.status(201).json({
        pendente: true,
        nome: novoUser.nome,
        email: novoUser.email,
        mensagem: 'Cadastro realizado com sucesso! Aguarde a aprovação de uma administradora para acessar o sistema.'
      });
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
