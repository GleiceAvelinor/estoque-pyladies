-- Schema do Banco de Dados PostgreSQL (Neon)
-- PyLadies Fortaleza - Controle de Estoque & Vendas

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  tamanho VARCHAR(50) NOT NULL,
  preco NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  estoque INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendas (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  produto_nome VARCHAR(255) NOT NULL,
  quantidade INTEGER NOT NULL,
  valor_total NUMERIC(10, 2) NOT NULL,
  cliente VARCHAR(255) DEFAULT 'Não informado',
  pagamento VARCHAR(100) NOT NULL,
  data_venda TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data_venda DESC);
