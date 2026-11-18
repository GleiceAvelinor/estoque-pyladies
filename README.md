# PyLadies Fortaleza | Sistema de Controle de Estoque & Vendas

<div align="center">
  <img src="public/logo.png" alt="PyLadies Fortaleza" width="130">
  <p><strong>Sistema de gestão de estoque e registro de vendas para produtos e brindes da comunidade PyLadies Fortaleza.</strong></p>
</div>

---

## 📌 Sumário
- [Sobre o Projeto](#-sobre-o-projeto)
- [Manual de Uso do Usuário (Guia Rápido)](MANUAL_DO_USUARIO.md)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura do Banco de Dados](#-estrutura-do-banco-de-dados)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Como Executar Localmente](#-como-executar-localmente)
- [Como Fazer o Deploy (Vercel + Neon)](#-como-fazer-o-deploy-vercel--neon)
- [Endpoints da API](#-endpoints-da-api)
- [Contribuindo](#-contribuindo)

---

## 📖 Sobre o Projeto

O **Estoque PyLadies Fortaleza** é uma aplicação web desenvolvida para facilitar o controle de inventário de itens da comunidade (camisas, ecobags, adesivos, etc.) e registrar transações financeiras (vendas via Pix, dinheiro ou cartão) durante eventos e encontros.

A aplicação foi projetada no modelo **JAMstack / Serverless**, garantindo:
- Custo zero de hospedagem (Free Tier na Vercel e Neon).
- Baixíssima latência e alta disponibilidade.
- Simplicidade de manutenção, sem frameworks pesados no frontend.

---

## ✨ Funcionalidades Principais

- 🔐 **Autenticação Segura & Controle de Acesso:** Cadastro de usuárias, login com hash via `bcryptjs`, recuperação de senha, persistência de sessão e **sistema de aprovação prévia** (novas contas ficam pendentes até aprovação por uma administradora).
- 👥 **Gestão de Usuárias (Exclusivo Admin):** Painel interativo para administradoras aprovarem cadastros pendentes, bloquearem contas, alternarem permissões (Admin / Membro) ou excluírem acessos.
- 📦 **Gestão de Estoque:** Cadastro completo de itens (nome, categoria, tamanho, preço e quantidade inicial), filtragem em tempo real e atualização atômica de estoque (+1 / -1).
- 💰 **Registro de Vendas:** Seleção de produtos com validação de disponibilidade, cálculo automático do valor total, registro do cliente e método de pagamento.
- ⚡ **Prevenção de Condições de Corrida:** Dedução atômica em nível de banco de dados (`UPDATE ... RETURNING`), evitando estoque negativo em compras simultâneas.
- 📈 **Painel de Indicadores (KPIs):** Total de itens em estoque, valor patrimonial acumulado, faturamento total e alerta de estoque baixo (< 5 unidades).
- 📄 **Exportações Rápidas:**
  - Exportação da planilha de estoque em **CSV**.
  - Exportação do histórico de vendas em **CSV** formatado.
  - Emissão de relatório consolidado em **PDF** formatado com cabeçalho personalizado e logotipo do PyLadies.

---

## 🏛 Arquitetura do Sistema

A solução adota uma arquitetura desacoplada e baseada em microsserviços/funções serverless:

```mermaid
flowchart TD
    subgraph Client["Cliente / Navegador (Frontend)"]
        UI["Interface Single Page Application (HTML5 + Tailwind CSS)"]
        State["Gerenciador de Estado e Cache de Sessão (LocalStorage)"]
        Export["Módulos de Exportação (jsPDF + CSV UTF-8)"]
        UI <--> State
        UI <--> Export
    end

    subgraph CDN["Edge & Roteamento (Vercel)"]
        Static["Arquivos Estáticos (HTML, PNG)"]
        Router["Vercel Edge Rewrites (/api/*)"]
    end

    subgraph Serverless["Backend Serverless (Node.js ESM)"]
        AuthAPI["api/auth.js (Login, Cadastro, Recuperação)"]
        ProdAPI["api/produtos.js (CRUD & Ajuste de Estoque)"]
        VendAPI["api/vendas.js (Registro Atômico de Vendas)"]
    end

    subgraph Database["Banco de Dados Relacional (Neon Serverless PostgreSQL)"]
        NeonDriver["@neondatabase/serverless (HTTP / WebSockets Connection Pool)"]
        Tables[("Tabelas: usuarios, produtos, vendas")]
        NeonDriver <--> Tables
    end

    UI -- Requisições HTTP (Fetch JSON) --> Router
    Router --> Static
    Router --> AuthAPI
    Router --> ProdAPI
    Router --> VendAPI

    AuthAPI --> NeonDriver
    ProdAPI --> NeonDriver
    VendAPI --> NeonDriver
```

### Detalhes dos Componentes:
1. **Frontend (SPA nativa):** Construído com HTML5 semântico, Tailwind CSS para estilização ágil e responsiva, e JavaScript Vanilla estruturado com proteção contra ataques XSS.
2. **Camada Serverless:** Funções serverless isoladas executadas sob demanda no runtime Node.js da Vercel. Cada rota responde a métodos HTTP específicos (`GET`, `POST`, `PUT`, `DELETE`).
3. **Persistência de Dados (Neon):** PostgreSQL Serverless hospedado na nuvem, conectado via `@neondatabase/serverless` utilizando requisições otimizadas para ambientes serverless (evitando problemas de limite de conexões simultâneas).

---

## 💻 Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Tailwind CSS, Vanilla JS | Interface rápida, responsiva e com identidade visual do cangaço/PyLadies |
| **Relatórios** | jsPDF, AutoTable | Geração de PDFs estilizados no lado do cliente |
| **Backend** | Node.js (ES Modules) | Funções Serverless Vercel |
| **Segurança** | bcryptjs | Hash salgado para proteção de senhas de usuárias |
| **Banco de Dados** | PostgreSQL (Neon) | Banco relacional escalável serverless |
| **Driver BD** | `@neondatabase/serverless` | Comunicação rápida com PostgreSQL via HTTP/REST |
| **Hospedagem** | Vercel | Hospedagem de ponta para frontend e funções serverless |

---

## 🗄 Estrutura do Banco de Dados

O banco de dados contém 3 tabelas principais com integridade referencial:

```mermaid
erDiagram
    USUARIOS {
        int id PK
        varchar nome
        varchar email UK
        varchar senha_hash
        timestamp criado_em
    }

    PRODUTOS {
        int id PK
        varchar nome
        varchar categoria
        varchar tamanho
        numeric preco
        numeric preco_custo
        int estoque
        timestamp criado_em
    }

    VENDAS {
        int id PK
        int produto_id FK
        varchar produto_nome
        int quantidade
        numeric valor_total
        numeric preco_custo
        varchar cliente
        varchar pagamento
        timestamp data_venda
    }

    PRODUTOS ||--o{ VENDAS : "possui"
```

O script completo de criação das tabelas e índices está disponível no arquivo [`schema.sql`](schema.sql).

---

## 📁 Estrutura de Pastas

```text
estoque-pyladies/
├── api/                     # Funções Serverless (Backend)
│   ├── auth.js             # Autenticação e gestão de usuárias
│   ├── produtos.js         # Endpoints para consulta e manutenção do estoque
│   └── vendas.js           # Endpoint para registro atômico de transações
├── public/                  # Arquivos estáticos servidos no frontend
│   ├── index.html          # Aplicação Single Page (Interface do usuário)
│   └── logo.png            # Logotipo oficial do PyLadies Fortaleza
├── .gitignore               # Arquivos ignorados pelo Git
├── package.json             # Dependências e metadados do projeto
├── schema.sql               # Estrutura DDL do banco de dados (Neon / Postgres)
├── vercel.json              # Configurações de roteamento para a Vercel
└── README.md                # Documentação do projeto
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Instância do PostgreSQL ou conta no [Neon Console](https://neon.tech/)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/GleiceAvelinor/estoque-pyladies.git
   cd estoque-pyladies
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Crie as tabelas no Banco de Dados:**
   - Acesse o Console SQL do seu banco Neon.
   - Execute o script [`schema.sql`](schema.sql).

4. **Execução com Vercel CLI (Recomendado):**
   A ferramenta oficial da Vercel executa tanto os arquivos estáticos quanto as funções serverless locais:
   ```bash
   # Instale a CLI da Vercel caso ainda não a tenha
   npm i -g vercel

   # Inicie o ambiente de desenvolvimento local
   vercel dev
   ```
   A CLI solicitará o login e você poderá configurar a variável `DATABASE_URL` no arquivo `.env.local`:
   ```env
   DATABASE_URL="postgres://usuario:senha@ep-exemplo.neon.tech/neondb?sslmode=require"
   ```

---

## ☁️ Como Fazer o Deploy (Vercel + Neon)

1. Faça o fork ou envie este repositório para o seu GitHub.
2. Acesse o painel da [Vercel](https://vercel.com/) e clique em **Add New Project**.
3. Selecione o repositório `estoque-pyladies`.
4. Em **Environment Variables**, adicione:
   - **Key:** `DATABASE_URL`
   - **Value:** *sua connection string do Neon* (ex: `postgres://...sslmode=require`)
5. Clique em **Deploy**. A Vercel construirá e publicará a aplicação com certificado SSL automático.

---

## 📡 Endpoints da API

### Autenticação (`/api/auth`)
- **`POST /api/auth`**
  - **Login:** `{ "acao": "login", "email": "...", "senha": "..." }`
  - **Cadastro:** `{ "acao": "cadastro", "nome": "...", "email": "...", "senha": "..." }`
  - **Recuperação:** `{ "acao": "recuperar", "email": "...", "novaSenha": "..." }`

### Produtos (`/api/produtos`)
- **`GET /api/produtos`**: Retorna lista de produtos ordenados por nome e tamanho.
- **`POST /api/produtos`**: Cadastra novo item no estoque (`nome`, `categoria`, `tamanho`, `preco`, `preco_custo`, `estoque`).
- **`PUT /api/produtos`**: Atualiza estoque de forma direta ou incremental via `{ "id": 1, "delta": 1 }`, ou valores unitários (`preco`, `preco_custo`).
- **`DELETE /api/produtos?id=1`**: Remove o produto (com validação de vendas vinculadas).

### Usuárias (`/api/usuarios`)
- **`GET /api/usuarios`**: Retorna lista de usuárias cadastradas com status e perfil.
- **`PUT /api/usuarios`**: Atualiza status (`aprovado`, `bloqueado`, `pendente`) ou perfil (`admin`, `membro`).
- **`DELETE /api/usuarios?id=1`**: Remove o cadastro de uma usuária.

### Vendas (`/api/vendas`)
- **`GET /api/vendas`**: Retorna histórico completo de vendas ordenado por data decrescente.
- **`POST /api/vendas`**: Registra nova venda e realiza baixa atômica no estoque do produto informado (`produto_id`, `quantidade`, `pagamento`, `cliente`).

---

## 💜 Contribuindo

Contribuições são super bem-vindas! Se você deseja reportar um bug, sugerir melhorias ou adicionar novas funcionalidades:

1. Abra uma **Issue** explicando a melhoria desejada.
2. Crie uma branch para sua funcionalidade: `git checkout -b feature/minha-melhoria`.
3. Faça o commit das suas alterações: `git commit -m 'feat: adiciona nova funcionalidade'`.
4. Envie para o GitHub: `git push origin feature/minha-melhoria`.
5. Abra um **Pull Request**.

---

<div align="center">
  Feito com 💜 pela comunidade <strong>PyLadies Fortaleza</strong>
</div>
