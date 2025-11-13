# **🛠️ Guia Prático: Construção da Aplicação Monolítica (SSR)**

Este guia prático contém todos os passos necessários para configurar e construir o sistema de estoque usando Node.js, Express, EJS (Server-Side Rendering) e PostgreSQL.

## **Etapa 1: Preparação do Ambiente Node.js e Estrutura de Pastas**

### **1.1 Configuração Inicial no Terminal**

Abra o Terminal ou o Prompt de Comando dentro do VS Code.

1. **Crie a pasta do projeto e navegue até ela:**  
   Bash

```
mkdir prova-estoque
cd prova-estoque
```

2.   
3. **Inicialize o projeto Node.js:** (Cria o arquivo `package.json`)  
   Bash

```
npm init -y
```

4.   
5. **Instale as dependências essenciais:** (Os três pilares da nossa aplicação)  
   Bash

```
npm install express ejs pg express-session
```

6.   
7. **Crie o arquivo principal e a estrutura de diretórios:**  
   Bash

```
touch server.js
mkdir views
mkdir public
mkdir public/styles
```

8. 

### **1.2 Estrutura Final de Pastas**

Ao final da Etapa 1, seu projeto deve ter a seguinte organização de arquivos:

```
prova-estoque/
├── node_modules/       
├── public/             
│   └── styles/         
│       └── (main.css - A ser criado) 
├── views/              
│   └── (Arquivos .ejs - A serem criados) 
├── package.json        
└── server.js           
```

## **Etapa 2: Criação e Preenchimento do Banco de Dados (PostgreSQL)**

### **2.1 Crie a Tabela no Banco**

Execute os comandos SQL abaixo no seu cliente PostgreSQL (pgAdmin, DBeaver, etc.).

SQL

```
-- 1. Tabela Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    login VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    senha VARCHAR(5) NOT NULL
);

-- 2. Tabela Produtos
CREATE TABLE produtos (
    idp SERIAL PRIMARY KEY,
    nomep VARCHAR(100) NOT NULL
);

-- 3. Tabela Saldos (Relaciona com Produtos)
CREATE TABLE saldos (
    idp INTEGER PRIMARY KEY,
    saldo INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (idp) REFERENCES produtos(idp) ON DELETE CASCADE
);

-- 4. Tabela Movimento (Guarda o Histórico)
CREATE TABLE movimento (
    idm SERIAL PRIMARY KEY,
    idp INTEGER NOT NULL,
    tipom CHAR(1) NOT NULL, -- 'E' (Entrada) ou 'S' (Saída)
    qtd INTEGER NOT NULL,
    data_movimento TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idp) REFERENCES produtos(idp)
);

-- 5. DADOS INICIAIS (Obrigatório para Teste)

INSERT INTO usuarios (login, nome, senha) VALUES
('aluno', 'Aluno Teste', '12345');

INSERT INTO produtos (nomep) VALUES
('Caneta Vermelha'),
('Caderno Grande');

-- 6. Inicializa o saldo
INSERT INTO saldos (idp, saldo) VALUES
(1, 100), 
(2, 50);
```

## **Etapa 3: Configuração Base do Servidor (`server.js`)**

Edite o arquivo `server.js` com a configuração inicial do Express, do EJS, da Sessão e do Banco de Dados.

**ATENÇÃO:** Lembre-se de substituir `seu_usuario`, `seu_banco` e `sua_senha` por suas credenciais reais do PostgreSQL.

JavaScript

```
// server.js

const express = require('express');
const { Client } = require('pg');
const session = require('express-session'); 

const app = express();
const PORT = 3000;

// --- 1. CONFIGURAÇÃO DO BANCO DE DADOS (POSTGRESQL) ---
const client = new Client({
    user: 'seu_usuario',     // <-- ALTERAR
    host: 'localhost',
    database: 'seu_banco',   // <-- ALTERAR
    password: 'sua_senha',   // <-- ALTERAR
    port: 5432,
});

client.connect()
    .then(() => console.log('Conectado ao PostgreSQL com sucesso!'))
    .catch(err => console.error('Erro de conexão com o DB', err.stack));


// --- 2. CONFIGURAÇÃO E MIDDLEWARES ---
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.urlencoded({ extended: true })); // Para ler dados de formulário (POST)
app.use(express.static('public')); // Para servir arquivos CSS/JS estáticos

// Configuração de Sessão
app.use(session({
    secret: 'chave_secreta_para_assinatura',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hora
}));

// Middleware de Proteção de Rotas
function requireLogin(req, res, next) {
    if (req.session.userId) {
        next(); 
    } else {
        res.redirect('/login'); 
    }
}


// --- 3. ROTAS DE AUTENTICAÇÃO E MENU ---

app.get('/', (req, res) => {
    res.redirect('/login');
});

// GET: Exibe o formulário de login
app.get('/login', (req, res) => {
    res.render('login', { error: req.session.error, message: null });
    req.session.error = null;
});

// POST: Valida credenciais e Inicia a sessão
app.post('/login', async (req, res) => {
    const { login, senha } = req.body;
    try {
        const query = 'SELECT id, nome FROM usuarios WHERE login = $1 AND senha = $2';
        const result = await client.query(query, [login, senha]);

        if (result.rows.length === 1) {
            req.session.userId = result.rows[0].id;
            req.session.userName = result.rows[0].nome;
            res.redirect('/menu');
        } else {
            req.session.error = 'Login ou Senha inválidos.';
            res.redirect('/login');
        }
    } catch (err) {
        console.error(err);
        req.session.error = 'Ocorreu um erro ao tentar fazer login.';
        res.redirect('/login');
    }
});

// Rota de Logout
app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Rota do Menu (Protegida)
app.get('/menu', requireLogin, (req, res) => {
    res.render('menu', { userName: req.session.userName });
});


// --- 4. ROTAS DE CRUD DE PRODUTOS (OPÇÃO 1) - ADICIONAR NA ETAPA 5 ---

// --- 5. ROTAS DE MOVIMENTO DE ESTOQUE (OPÇÃO 2) - ADICIONAR NA ETAPA 5 ---

// --- 6. ROTA DE CONSULTA DE SALDO (OPÇÃO 3) - ADICIONAR NA ETAPA 5 ---


// --- 7. INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

## **Etapa 4: Criação das Views de Navegação (`views/`)**

Crie os seguintes arquivos dentro da pasta `views/`.

### **4.1 `views/login.ejs`**

HTML

```
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>PROVA - Login</title>
    <style>
        /* Estilos básicos para a prova */
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f4f4f4;}
        .login-box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .error-message { color: red; margin-bottom: 10px; text-align: center; }
        .input-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input[type="text"], input[type="password"] { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
        button { width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="login-box">
        <h1>Login SAEP Estoque</h1>
        
        <% if (error) { %>
            <p class="error-message"><%= error %></p>
        <% } %>

        <form action="/login" method="POST">
            <div class="input-group">
                <label for="login">Login:</label>
                <input type="text" id="login" name="login" required>
            </div>
            <div class="input-group">
                <label for="senha">Senha:</label>
                <input type="password" id="senha" name="senha" required>
            </div>
            <button type="submit">Entrar</button>
        </form>
    </div>
</body>
</html>
```

### **4.2 `views/menu.ejs`**

HTML

```
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>PROVA - Menu Principal</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        .menu-options { margin-top: 30px; }
        .menu-options a { display: block; margin: 10px 0; padding: 15px; background-color: #e9ecef; border-radius: 5px; text-decoration: none; color: #333; font-weight: bold; }
        .menu-options a:hover { background-color: #ced4da; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .logout-form button { background: none; border: none; color: #dc3545; cursor: pointer; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Bem-vindo, <%= userName %>!</h1>
        <form class="logout-form" action="/logout" method="POST">
            <button type="submit">Sair (Logout)</button>
        </form>
    </div>

    <hr>

    <h2>Opções do Sistema de Estoque</h2>
    
    <div class="menu-options">
        <a href="/produtos">1. Edição e Cadastro de Produtos</a>
        <a href="/movimento">2. Movimento de Estoque (Entrada/Saída)</a>
        <a href="/saldo">3. Consultar Saldo do Estoque</a>
    </div>
</body>
</html>
```

## **Etapa 5: Implementação das 3 Opções de Sistema (Lógica e Views)**

Agora, copie e cole o código das três seções de rotas no seu arquivo `server.js` e crie as views correspondentes.

### **5.1 Opção 1: CRUD de Produtos (Rotas)**

Cole o código das rotas a seguir no `server.js`, na seção **"4. ROTAS DE CRUD DE PRODUTOS"**:

JavaScript

```
// server.js (Continuação)

// --- 4. ROTAS DE CRUD DE PRODUTOS (OPÇÃO 1) ---

app.get('/produtos', requireLogin, async (req, res) => {
    try {
        const result = await client.query('SELECT idp, nomep FROM produtos ORDER BY idp DESC');
        res.render('produtos', { 
            produtos: result.rows,
            error: req.session.produtoError || null, 
        });
        req.session.produtoError = null;
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao listar produtos.');
    }
});

app.post('/produtos', requireLogin, async (req, res) => {
    const { nomep } = req.body;
    if (!nomep) {
        req.session.produtoError = 'O nome do produto não pode ser vazio.';
        return res.redirect('/produtos');
    }
    try {
        const query = 'INSERT INTO produtos (nomep) VALUES ($1) RETURNING idp';
        const result = await client.query(query, [nomep]);
        const newIdp = result.rows[0].idp;
        // Inicializa o saldo do novo produto
        await client.query('INSERT INTO saldos (idp, saldo) VALUES ($1, 0)', [newIdp]);
        res.redirect('/produtos');
    } catch (err) {
        console.error(err);
        req.session.produtoError = 'Erro ao tentar cadastrar o produto.';
        res.redirect('/produtos');
    }
});

app.get('/produtos/editar/:idp', requireLogin, async (req, res) => {
    const { idp } = req.params;
    try {
        const result = await client.query('SELECT idp, nomep FROM produtos WHERE idp = $1', [idp]);
        if (result.rows.length === 0) {
            return res.status(404).send('Produto não encontrado.');
        }
        res.render('editar_produto', { produto: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar produto para edição.');
    }
});

app.post('/produtos/atualizar/:idp', requireLogin, async (req, res) => {
    const { idp } = req.params;
    const { nomep } = req.body;
    try {
        const query = 'UPDATE produtos SET nomep = $1 WHERE idp = $2';
        await client.query(query, [nomep, idp]);
        res.redirect('/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar produto.');
    }
});

app.post('/produtos/excluir/:idp', requireLogin, async (req, res) => {
    const { idp } = req.params;
    try {
        // Exclusão (o CASCADE no DB cuida do Saldo, mas esta abordagem é mais clara)
        await client.query('DELETE FROM saldos WHERE idp = $1', [idp]);
        await client.query('DELETE FROM produtos WHERE idp = $1', [idp]);
        res.redirect('/produtos');
    } catch (err) {
        console.error(err);
        req.session.produtoError = 'Erro ao excluir. Verifique se existem MOVIMENTOS associados.';
        res.redirect('/produtos');
    }
});
```

#### **Views de Produto (`views/`):**

Crie `views/produtos.ejs` e `views/editar_produto.ejs` (use os códigos da resposta anterior, que já foram testados e corrigidos).

### **5.2 Opção 2: Movimento de Estoque (Transação)**

Cole o código das rotas a seguir no `server.js`, na seção **"5. ROTAS DE MOVIMENTO DE ESTOQUE"**:

JavaScript

```
// server.js (Continuação)

// --- 5. ROTAS DE MOVIMENTO DE ESTOQUE (OPÇÃO 2) ---

app.get('/movimento', requireLogin, async (req, res) => {
    try {
        const produtos = await client.query('SELECT idp, nomep FROM produtos ORDER BY nomep ASC');
        res.render('movimento', { 
            produtos: produtos.rows,
            message: req.session.movimentoMessage || null,
            error: req.session.movimentoError || null,
        });
        req.session.movimentoMessage = null; 
        req.session.movimentoError = null;
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar a tela de movimento.');
    }
});

app.post('/movimento', requireLogin, async (req, res) => {
    const { idp, tipo_movimento, qtd } = req.body;
    const quantidade = parseInt(qtd);
    const tipoM = tipo_movimento === 'ENTRADA' ? 'E' : 'S';

    if (!idp || !tipo_movimento || isNaN(quantidade) || quantidade <= 0) {
        req.session.movimentoError = 'Preencha todos os campos corretamente.';
        return res.redirect('/movimento');
    }

    await client.query('BEGIN'); // INÍCIO DA TRANSAÇÃO

    try {
        let saldoAtualizacaoQuery;

        if (tipoM === 'S') {
            const saldoResult = await client.query('SELECT saldo FROM saldos WHERE idp = $1 FOR UPDATE', [idp]);
            const saldoExistente = saldoResult.rows[0] ? parseInt(saldoResult.rows[0].saldo) : 0;

            if (quantidade > saldoExistente) {
                await client.query('ROLLBACK'); // DESFAZ EM CASO DE SALDO INSUFICIENTE
                req.session.movimentoError = `Saldo insuficiente (${saldoExistente}) para a saída de ${quantidade}.`;
                return res.redirect('/movimento');
            }
            saldoAtualizacaoQuery = 'UPDATE saldos SET saldo = saldo - $1 WHERE idp = $2';
        } else {
            saldoAtualizacaoQuery = 'UPDATE saldos SET saldo = saldo + $1 WHERE idp = $2';
        }

        // 1. REGISTRA O MOVIMENTO
        const movimentoQuery = 'INSERT INTO movimento (idp, tipom, qtd) VALUES ($1, $2, $3)';
        await client.query(movimentoQuery, [idp, tipoM, quantidade]);

        // 2. ATUALIZA O SALDO
        await client.query(saldoAtualizacaoQuery, [quantidade, idp]);

        await client.query('COMMIT'); // CONFIRMA A TRANSAÇÃO
        
        req.session.movimentoMessage = 'Movimento registrado e saldo atualizado com sucesso!';
        res.redirect('/movimento');

    } catch (err) {
        await client.query('ROLLBACK'); // DESFAZ EM CASO DE ERRO
        console.error("Erro na Transação de Movimento:", err);
        req.session.movimentoError = 'Erro crítico ao processar o movimento. A transação foi desfeita.';
        res.redirect('/movimento');
    }
});
```

#### **Views de Movimento (`views/`):**

Crie `views/movimento.ejs` (use o código da resposta anterior).

### **5.3 Opção 3: Consulta de Saldo**

Cole o código das rotas a seguir no `server.js`, na seção **"6. ROTA DE CONSULTA DE SALDO"**:

JavaScript

```
// server.js (Continuação)

// --- 6. ROTA DE CONSULTA DE SALDO (OPÇÃO 3) ---

app.get('/saldo', requireLogin, async (req, res) => {
    try {
        // SQL com JOIN
        const query = `
            SELECT 
                p.idp, 
                p.nomep, 
                s.saldo
            FROM 
                produtos p
            JOIN 
                saldos s ON p.idp = s.idp
            ORDER BY 
                p.nomep ASC;
        `;
        const result = await client.query(query);
        res.render('saldo', { saldos: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao consultar saldos.');
    }
});
```

#### **Views de Saldo (`views/`):**

Crie `views/saldo.ejs` (use o código da resposta anterior).

## **Etapa 6: Teste Final da Aplicação**

1. **Verifique as credenciais do PostgreSQL** na Etapa 3\.  
2. **Verifique a existência de todos os arquivos EJS** na pasta `views/`.  
3. No terminal do VS Code, execute o servidor:  
   Bash

```
node server.js
```

4.   
5. Abra o navegador e acesse: `http://localhost:3000`  
6. Faça login com: **Login: aluno** | **Senha: 12345**  
7. Teste as três opções do menu para validar todas as funcionalidades:  
   * **Opção 1:** Cadastre um novo produto e verifique se ele aparece na lista.  
   * **Opção 2:** Faça uma entrada de 10 unidades em um produto e confira se a mensagem de sucesso aparece.  
   * **Opção 3:** Consulte o saldo e verifique se a entrada de 10 unidades foi somada ao saldo inicial.

