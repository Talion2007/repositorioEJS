// server.js

const express = require('express');
const { Client } = require('pg');
const session = require('express-session'); // Nova dependência

const app = express();
const PORT = 3000;

// --- 1. CONFIGURAÇÃO DO BANCO DE DADOS (POSTGRESQL) ---
const client = new Client({
    user: 'postgres',     // MUDAR!
    host: 'localhost',
    database: 'prova',   // MUDAR!
    password: '12345',   // MUDAR!
    port: 5434,
});

client.connect()
    .then(() => console.log('Conectado ao PostgreSQL com sucesso!'))
    .catch(err => console.error('Erro de conexão com o DB', err.stack));


// --- 2. CONFIGURAÇÃO E MIDDLEWARES ---
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.urlencoded({ extended: true }));

// Configuração de Sessão (Obrigatória para Login)
app.use(session({
    secret: 'chave_secreta_para_assinatura', // Mude para uma string longa e aleatória
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hora
}));

// Middleware para verificar autenticação nas rotas protegidas
function requireLogin(req, res, next) {
    if (req.session.userId) {
        next(); // Usuário logado, continua para a próxima função da rota
    } else {
        res.redirect('/login'); // Usuário não logado, redireciona para o login
    }
}

// --- 3. ROTAS DE AUTENTICAÇÃO ---

// Rota inicial: Redireciona para a tela de login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// GET: Exibe o formulário de login
app.get('/login', (req, res) => {
    // Passa uma mensagem de erro, se houver, para o EJS
    res.render('login', { error: req.session.error, message: null });
    req.session.error = null; // Limpa o erro após exibir
});

// POST: Processa o login e valida credenciais
app.post('/login', async (req, res) => {
    const { login, senha } = req.body;
    try {
        const query = 'SELECT id, nome FROM usuarios WHERE login = $1 AND senha = $2';
        const result = await client.query(query, [login, senha]);

        if (result.rows.length === 1) {
            // Login BEM-SUCEDIDO: Armazena o ID e Nome na sessão
            req.session.userId = result.rows[0].id;
            req.session.userName = result.rows[0].nome;
            res.redirect('/menu');
        } else {
            // Login FALHOU: Define a mensagem de erro
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
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/menu');
        }
        res.redirect('/login');
    });
});


// --- 4. ROTA DO MENU PRINCIPAL (PROTEGIDA) ---

app.get('/menu', requireLogin, (req, res) => {
    // Renderiza a tela do menu, passando o nome do usuário logado
    res.render('menu', { userName: req.session.userName });
});


// --- 5. INICIALIZAÇÃO DO SERVIDOR ---

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// --- 6. ROTAS DE PRODUTOS, MOVIMENTO E SALDO (SERÃO ADICIONADAS NAS PRÓXIMAS ETAPAS) ---



// --- 6. ROTAS DE PRODUTOS (CRUD) ---

// Rota 6.1: LISTAR PRODUTOS (SELECT) e RENDERIZAR TELA DE CADASTRO/CONSULTA
app.get('/produtos', requireLogin, async (req, res) => {
    try {
        // Seleciona todos os produtos (apenas ID e Nome)
        const result = await client.query('SELECT idp, nomep FROM produtos ORDER BY idp DESC');

        // Renderiza a view de produtos
        res.render('produtos', {
            produtos: result.rows,
            error: req.session.produtoError || null, // Passa mensagem de erro, se houver
        });
        req.session.produtoError = null; // Limpa o erro

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao listar produtos.');
    }
});

// Rota 6.2: CADASTRAR NOVO PRODUTO (INSERT)
app.post('/produtos', requireLogin, async (req, res) => {
    const { nomep } = req.body;

    if (!nomep) {
        req.session.produtoError = 'O nome do produto não pode ser vazio.';
        return res.redirect('/produtos');
    }

    try {
        // SQL Injection-safe: insere apenas o nomep
        const query = 'INSERT INTO produtos (nomep) VALUES ($1)';
        await client.query(query, [nomep]);

        // Redireciona de volta para a lista principal
        res.redirect('/produtos');
    } catch (err) {
        console.error(err);
        req.session.produtoError = 'Erro ao tentar cadastrar o produto.';
        res.redirect('/produtos');
    }
});

// Rota 6.3: EXIBIR FORMULÁRIO DE EDIÇÃO (SELECT by ID)
app.get('/produtos/editar/:idp', requireLogin, async (req, res) => {
    const { idp } = req.params;
    try {
        const result = await client.query('SELECT idp, nomep FROM produtos WHERE idp = $1', [idp]);
        if (result.rows.length === 0) {
            return res.status(404).send('Produto não encontrado.');
        }

        // RENDERIZAÇÃO SSR: Passa o produto para o EJS renderizar o formulário
        res.render('editar_produtos', { produto: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar produto para edição.');
    }
});

// Rota 6.4: ATUALIZAR PRODUTO (UPDATE)
app.post('/produtos/atualizar/:idp', requireLogin, async (req, res) => {
    const { idp } = req.params;
    const { nomep } = req.body;

    if (!nomep) {
        // Embora não seja a melhor UX, para fins de prova, a validação é simples
        return res.status(400).send('Nome do produto não pode ser vazio.');
    }

    try {
        const query = 'UPDATE produtos SET nomep = $1 WHERE idp = $2';
        await client.query(query, [nomep, idp]);
        res.redirect('/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar produto.');
    }
});

// Rota 6.5: EXCLUIR PRODUTO (DELETE)
app.post('/produtos/excluir/:idp', requireLogin, async (req, res) => {
    const { idp } = req.params;

    try {
        // Importante: ON DELETE CASCADE garante que a linha de Saldos relacionada será excluída,
        // mas é mais seguro excluir manualmente para evitar problemas com outras FKs.

        // 1. Tenta excluir o saldo primeiro (para manter integridade, embora o CASCADE ajude)
        await client.query('DELETE FROM saldos WHERE idp = $1', [idp]);

        // 2. Exclui o produto
        await client.query('DELETE FROM produtos WHERE idp = $1', [idp]);

        res.redirect('/produtos');
    } catch (err) {
        // NOTA: Se houver movimentos na tabela 'movimento', o DELETE RESTRICT irá falhar,
        // o que é um comportamento correto de sistema de estoque.
        console.error(err);
        req.session.produtoError = 'Erro ao excluir. Verifique se existem MOVIMENTOS associados a este produto.';
        res.redirect('/produtos');
    }
});
// server.js (Adicionar este bloco na Seção 7)

// --- 7. ROTAS DE MOVIMENTO DE ESTOQUE ---

// Rota 7.1: Exibir Formulário de Movimento
app.get('/movimento', requireLogin, async (req, res) => {
    try {
        // Busca a lista de produtos para o <select> do formulário
        const produtos = await client.query('SELECT idp, nomep FROM produtos ORDER BY nomep ASC');

        res.render('movimento', {
            produtos: produtos.rows,
            message: req.session.movimentoMessage || null,
            error: req.session.movimentoError || null,
        });
        req.session.movimentoMessage = null; // Limpa mensagens
        req.session.movimentoError = null;

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar a tela de movimento.');
    }
});

// Rota 7.2: Processar Novo Movimento (A Lógica Transacional)
app.post('/movimento', requireLogin, async (req, res) => {
    const { idp, tipo_movimento, qtd } = req.body;
    const quantidade = parseInt(qtd);
    const tipoM = tipo_movimento === 'ENTRADA' ? 'E' : 'S'; // 'E' ou 'S'

    // Validações básicas
    if (!idp || !tipo_movimento || isNaN(quantidade) || quantidade <= 0) {
        req.session.movimentoError = 'Preencha todos os campos corretamente.';
        return res.redirect('/movimento');
    }

    // --- INÍCIO DA TRANSAÇÃO ---
    await client.query('BEGIN');

    try {
        let saldoAtualizacaoQuery;
        let saldoNovo;

        // 1. VERIFICAÇÃO DE SALDO (Apenas para SAÍDA)
        if (tipoM === 'S') {
            const saldoResult = await client.query('SELECT saldo FROM saldos WHERE idp = $1 FOR UPDATE', [idp]);
            const saldoExistente = saldoResult.rows[0] ? parseInt(saldoResult.rows[0].saldo) : 0;

            if (quantidade > saldoExistente) {
                await client.query('ROLLBACK'); // Desfaz tudo
                req.session.movimentoError = `Saldo insuficiente (${saldoExistente}) para realizar a saída de ${quantidade}.`;
                return res.redirect('/movimento');
            }
            // Calcula o novo saldo: Subtrai a quantidade
            saldoNovo = saldoExistente - quantidade;
            saldoAtualizacaoQuery = 'UPDATE saldos SET saldo = saldo - $1 WHERE idp = $2';
        } else {
            // Se for ENTRADA: Apenas soma a quantidade
            saldoAtualizacaoQuery = 'UPDATE saldos SET saldo = saldo + $1 WHERE idp = $2';
        }

        // 2. REGISTRA O MOVIMENTO na Tabela 4 (Movimento)
        const movimentoQuery = 'INSERT INTO movimento (idp, tipom, qtd) VALUES ($1, $2, $3)';
        await client.query(movimentoQuery, [idp, tipoM, quantidade]);

        // 3. ATUALIZA O SALDO na Tabela 3 (Saldos)
        await client.query(saldoAtualizacaoQuery, [quantidade, idp]);

        // 4. Se tudo deu certo, CONFIRMA a Transação
        await client.query('COMMIT');

        req.session.movimentoMessage = 'Movimento registrado e saldo atualizado com sucesso!';
        res.redirect('/movimento');

    } catch (err) {
        // Se algo falhar (erro no DB, erro de FK, etc.), desfaz tudo
        await client.query('ROLLBACK');
        console.error("Erro na Transação de Movimento:", err);
        req.session.movimentoError = 'Erro crítico ao processar o movimento. A transação foi desfeita.';
        res.redirect('/movimento');
    }
});



// --- 8. ROTA DE CONSULTA DE SALDO ---

// Rota 8.1: Listar Saldos (SELECT com JOIN)
app.get('/saldo', requireLogin, async (req, res) => {
    try {
        // SQL com JOIN para listar nome do produto e seu saldo
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

        // Renderiza a view de saldos
        res.render('saldo', { saldos: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao consultar saldos.');
    }
});