# 📚 Manual de Uso do Sistema | PyLadies Fortaleza
### Controle de Estoque, Caixa & Vendas

<div align="center">
  <img src="public/logo.png" alt="Logotipo PyLadies Fortaleza" width="110">
  <p><strong>Guia prático e oficial para organizadoras e voluntárias da comunidade.</strong></p>
</div>

---

## 📌 Sumário
1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Acesso, Cadastro e Aprovação de Contas](#2-acesso-cadastro-e-aprovação-de-contas)
3. [Navegação por Abas](#3-navegação-por-abas)
4. [Aba 1: Painel Geral (Dashboard)](#4-aba-1-painel-geral-dashboard)
5. [Aba 2: Vendas & Caixa (PDV)](#5-aba-2-vendas--caixa-pdv)
6. [Aba 3: Gestão de Estoque](#6-aba-3-gestão-de-estoque)
7. [Aba 4: Gestão de Usuárias (Apenas Administradoras)](#7-aba-4-gestão-de-usuárias-apenas-administradoras)
8. [Exportações (Planilhas CSV e Relatórios PDF)](#8-exportações-planilhas-csv-e-relatórios-pdf)
9. [Perguntas Frequentes (FAQ)](#9-perguntas-frequentes-faq)

---

## 1. Visão Geral do Sistema

O **Sistema de Estoque & Vendas do PyLadies Fortaleza** foi desenvolvido para centralizar a gestão de produtos da comunidade (camisetas, ecobags, adesivos, copos e bottons) durante encontros, workshops e conferências.

### Principais Objetivos:
- Registrar saídas e pagamentos de forma ágil durante os eventos.
- Evitar que produtos esgotados continuem sendo vendidos.
- Dar visibilidade do faturamento e valor patrimonial em tempo real.
- Garantir segurança: **apenas voluntárias autorizadas** pela liderança têm acesso às operações.

---

## 2. Acesso, Cadastro e Aprovação de Contas

O sistema está disponível em: **[https://estoque-pyladies.vercel.app](https://estoque-pyladies.vercel.app)**

### 2.1 Criando uma Nova Conta (Solicitação de Cadastro)
1. Na tela inicial, clique no link **"Não tem conta? Cadastre-se"**.
2. Preencha os campos:
   - **Seu Nome Completo** (ex: *Maria da Silva*).
   - **E-mail** (seu e-mail de uso habitual).
   - **Senha** (mínimo de 6 caracteres).
3. Clique em **Solicitar Cadastro**.
4. Uma mensagem de confirmação será exibida:  
   > *"🎉 Cadastro Realizado! Sua conta foi enviada com sucesso e está aguardando aprovação de uma administradora do PyLadies."*

> [!IMPORTANT]
> Por questões de segurança, **novas contas não entram direto no sistema**. Uma das organizadoras administradoras precisa aprovar sua entrada antes do primeiro login.

### 2.2 Fazendo Login
1. Digite seu **e-mail** e **senha**.
2. Clique em **Entrar no Sistema**.
3. Se sua conta já foi aprovada, você será direcionada automaticamente para o painel principal.
4. Se sua conta ainda estiver em análise, o sistema avisará:  
   > *"Sua conta está aguardando aprovação de uma administradora do PyLadies Fortaleza."*

### 2.3 Esqueci Minha Senha
1. Clique em **"Esqueci minha senha"**.
2. Digite seu e-mail cadastrado.
3. Digite sua nova senha desejada (mínimo de 6 caracteres) e confirme.

---

## 3. Navegação por Abas

Após entrar no sistema, o menu superior exibe a identidade visual do cangaço e uma barra de navegação em abas:

| Aba | Descrição |
| :--- | :--- |
| **📊 Painel Geral** | Visão executiva com indicadores (KPIs), atalhos e alertas de reposição. |
| **🛍️ Vendas & Caixa** | Ponto de venda para registrar saídas rápidas e consultar o histórico de transações. |
| **📦 Gestão de Estoque** | Tabela detalhada de produtos, filtros por categoria e botão para cadastrar novos itens. |
| **👥 Usuárias** | *(Visível apenas para Administradoras)* Aprovação de contas e controle de permissões. |

---

## 4. Aba 1: Painel Geral (Dashboard)

Essa aba oferece uma visão panorâmica e em tempo real da saúde do estoque e das finanças.

### 4.1 Indicadores de Desempenho (KPIs)
- **Itens em Estoque:** Quantidade total de unidades físicas somadas de todos os produtos.
- **Valor em Estoque:** Quanto a comunidade possui em patrimônio físico (Preço x Quantidade).
- **Faturamento Total:** Soma de todas as vendas já realizadas no sistema.
- **Estoque Crítico:** Quantidade de produtos que possuem **menos de 5 unidades** disponíveis.

### 4.2 Lista de Alerta de Reposição
Exibe os produtos que estão com estoque zerado (**Esgotado**) ou abaixo de 5 unidades, indicando à equipe que é hora de encomendar novos lotes com fornecedores.

---

## 5. Aba 2: Vendas & Caixa (PDV)

Esta é a aba mais utilizada durante os eventos. Foi desenhada para ser rápida e evitar filas.

### 5.1 Como Registrar uma Venda Passo a Passo
1. No campo **Produto**, selecione o item desejado no menu suspenso.
   - *Itens esgotados aparecem desabilitados com a tag `ESGOTADO`.*
   - Ao selecionar, o sistema exibe a quantidade disponível ao lado (ex: `Disp: 14 un.`).
2. No campo **Quantidade**, digite quantas unidades a pessoa compradora está levando.
   - *O sistema impede digitar um número maior do que o estoque físico disponível.*
3. O painel calcula instantaneamente o **Total a Pagar** em verde.
4. Selecione a **Forma de Pagamento**:
   - `Pix`
   - `Dinheiro`
   - `Cartão de Crédito`
   - `Cartão de Débito`
5. *(Opcional)* No campo **Cliente / Compradora**, digite o nome da pessoa para controle interno.
6. Clique no botão marrom **"Confirmar Venda e Baixar Estoque"**.
7. O estoque do item é abatido automaticamente no banco de dados e a venda é registrada no histórico.

### 5.2 Histórico de Vendas
Na coluna direita, a tabela lista todas as transações realizadas com Data, Hora, Produto, Quantidade, Valor e Forma de Pagamento.

---

## 6. Aba 3: Gestão de Estoque

Destinada à conferência de mercadorias, contagem de inventário e cadastro de novos itens.

### 6.1 Barra de Ferramentas e Filtros
- **Campo de Busca:** Digite qualquer termo (ex: `"P"`, `"Camiseta"`, `"Caneca"`) para filtrar a tabela instantaneamente.
- **Filtros por Categoria:** Clique nas pílulas para filtrar rapidamente por:
  - `Todas`
  - `Vestuário`
  - `Acessórios`
  - `Papelaria`
  - `Outros`

### 6.2 Como Cadastrar um Novo Produto (Modal)
1. Clique no botão de destaque **`➕ Novo Produto`** no topo da aba.
2. O formulário em modal abrirá sobre a tela. Preencha:
   - **Nome do Produto:** ex: *Camiseta YCSM - You Can Sit with Me*.
   - **Categoria:** Selecione a categoria adequada.
   - **Tamanho:** Escolha entre `PP`, `P`, `M`, `G`, `GG`, `XG` ou `Único`.
   - **Preço (R$):** Valor unitário de venda (ex: `55.00` ou `55,00`).
   - **Estoque Inicial:** Quantidade de peças que chegaram do fornecedor.
3. Clique em **Cadastrar Produto**.
4. O item aparecerá imediatamente no estoque e na lista de vendas.

### 6.3 Ajustes Rápidos de Estoque (+1 / -1)
Ao lado de cada produto na tabela:
- Clique em **`+1`** para adicionar uma unidade (ex: devolução ou peça encontrada).
- Clique em **`-1`** para subtrair uma unidade (ex: peça com defeito ou brinde concedido).
- Clique em **`Excluir`** para remover o item do catálogo *(só é permitido caso o produto não possua histórico de vendas vinculado)*.

---

## 7. Aba 4: Gestão de Usuárias (Apenas Administradoras)

Esta aba só é visível para quem possui perfil de **Administradora** (`Admin`).

### 7.1 Como Aprovar Novas Voluntárias
1. Quando uma pessoa nova se cadastrar, a aba **Usuárias** exibirá um selo amarelo com a quantidade de pendências (ex: `👥 Usuárias [1]`).
2. Acesse a aba **Usuárias**.
3. Na linha da usuária com status amarelo **Pendente**:
   - Clique em **🟢 Aprovar** para liberar o acesso dela imediatamente.
   - Clique em **🔴 Recusar** para descartar a solicitação.

### 7.2 Gerenciando Permissões
- **Bloquear:** Suspende temporariamente o acesso de uma usuária sem apagar os dados dela.
- **Reativar:** Devolve o acesso normal à usuária que estava bloqueada.
- **Tornar Admin / Tornar Membro:** Concede ou remove privilégios administrativos.
- **Excluir:** Remove o registro da usuária do sistema.

---

## 8. Exportações (Planilhas CSV e Relatórios PDF)

O sistema permite extrair relatórios completos para prestação de contas da comunidade.

### 8.1 Exportar CSV (Excel / Google Sheets)
- **CSV Estoque:** Gera um arquivo `.csv` com o inventário completo (ID, Produto, Categoria, Tamanho, Preço, Qtd. em Estoque e Valor Total Acumulado).
- **CSV Vendas:** Gera um arquivo `.csv` com todas as transações, datas, clientes e métodos de pagamento.
- *Ambos os arquivos são exportados em formato com codificação UTF-8 e delimitador compatível com o Excel em português.*

### 8.2 Relatório Consolidado em PDF
1. No menu superior direito, clique em **`📄 Relatório PDF`**.
2. O sistema gerará um documento oficial com:
   - Cabeçalho nas cores do PyLadies e logotipo oficial.
   - Data e hora exata da emissão.
   - Tabela 1: Inventário atual completo.
   - Tabela 2: Histórico de vendas realizadas.
3. O arquivo `relatorio_pyladies_fortaleza.pdf` é baixado automaticamente.

---

## 9. Perguntas Frequentes (FAQ)

### P: Tentei me cadastrar e não consigo entrar. O que houve?
**R:** Sua conta foi criada, mas fica com o status **Pendente**. Peça para uma das organizadoras administradoras entrar na aba **Usuárias** e clicar em **Aprovar**.

### P: Como cadastrar um produto sem tamanho (ex: Ecobag ou Caneca)?
**R:** No campo **Tamanho**, selecione a opção **`Único`**.

### P: Posso usar o sistema pelo celular no evento?
**R:** Sim! O sistema é 100% responsivo e funciona normalmente no navegador do smartphone ou tablet.

### P: Tentei excluir um produto e apareceu um aviso de erro. Por quê?
**R:** Se o produto já possui vendas registradas no histórico, o banco de dados impede a exclusão para não distorcer o faturamento passado. A recomendação é **zerar o estoque** do produto ou ajustar para `0`.

---

<div align="center">
  💜 Desenvolvido com carinho para o <strong>PyLadies Fortaleza</strong>
</div>
