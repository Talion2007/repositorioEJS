-- 1. Tabela Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    login VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    senha VARCHAR(5) NOT NULL -- Senha armazenada de forma simples (para fins didáticos da prova)
);

-- 2. Tabela Produtos
CREATE TABLE produtos (
    idp SERIAL PRIMARY KEY,
    nomep VARCHAR(100) NOT NULL
);

-- 3. Tabela Saldos
CREATE TABLE saldos (
    idp INTEGER PRIMARY KEY,
    saldo INTEGER NOT NULL DEFAULT 0,
    -- Garante que o ID do saldo seja um produto válido
    FOREIGN KEY (idp) REFERENCES produtos (idp) ON DELETE CASCADE
);

-- 4. Tabela Movimento
CREATE TABLE movimento (
    idm SERIAL PRIMARY KEY,
    idp INTEGER NOT NULL,
    tipom CHAR(1) NOT NULL, -- 'E' para Entrada, 'S' para Saída
    qtd INTEGER NOT NULL,
    data_movimento TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Garante que o ID do movimento seja um produto válido
    FOREIGN KEY (idp) REFERENCES produtos (idp) ON DELETE RESTRICT
);

-- INSERÇÃO DE DADOS INICIAIS (TESTE)

INSERT INTO
    usuarios (login, nome, senha)
VALUES (
        'aluno',
        'Aluno Teste',
        '12345'
    ),
    (
        'professor',
        'Professor Avaliador',
        'prova'
    );

INSERT INTO
    produtos (nomep)
VALUES ('Caneta Azul'),
    ('Caderno 10 Matérias'),
    ('Borracha');

-- Inicializa o saldo para os produtos
INSERT INTO
    saldos (idp, saldo)
VALUES (1, 100), -- Caneta Azul começa com 100
    (2, 50), -- Caderno começa com 50
    (3, 0);
-- Borracha começa com 0