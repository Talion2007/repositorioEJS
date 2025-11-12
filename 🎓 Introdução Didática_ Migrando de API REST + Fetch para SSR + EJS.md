# **🎓 Introdução Didática: Migrando de API REST \+ Fetch para SSR \+ EJS**

Olá, pessoal\! Para possibilitar a construção de uma aplicação web de forma mais rápida, vamos adotar uma arquitetura de desenvolvimento diferente da que usamos nos nossos projetos com API REST e fetch. O objetivo desta mudança é **maximizar a velocidade de entrega do projeto** no tempo limitado que teremos.

Nos projetos que fizemos, usamos a arquitetura moderna de **Frontend e Backend separados (SPA/REST)**.

| Modelo Anterior (REST \+ Fetch) | Novo Modelo (SAEP \- SSR) |
| :---- | :---- |
| 🌍 **Duas Aplicações** (Frontend JS/HTML \+ Backend API/JSON). | 📦 **Uma Aplicação Monolítica** (Backend gera o HTML). |
| 📡 O Frontend faz chamadas fetch para trocar dados JSON. | 🚀 O servidor **envia o HTML completo** para o navegador. |
| ⏳ Demora mais para codificar. | ✅ É o caminho mais **rápido** para projetos de CRUD simples. |

## **1\. O Conceito Central: Server-Side Rendering (SSR)**

O SSR, ou **Renderização no Lado do Servidor**, é o oposto exato do que vocês estavam fazendo com o fetch.

### **Como o SSR Funciona (Modelo Monolítico):**

1. **Requisição:** O navegador (cliente) solicita uma página (ex: /produtos).  
2. **Processamento no Servidor (Node.js):** O Node.js/Express:  
   * Se conecta ao PostgreSQL.  
   * Executa a consulta SQL (SELECT \* FROM produtos).  
   * **Pega o resultado dos dados** (a lista de produtos).  
   * **Combina** esses dados com um *template* HTML.  
   * **Gera o HTML final** (uma *string* completa, com a tabela pronta).  
3. **Resposta:** O servidor envia o **HTML completo** e já pronto para o navegador.  
4. **No Navegador:** O navegador apenas exibe o HTML. **Não há necessidade de escrever código JavaScript complexo** para manipular a DOM, criar tabelas ou formatar dados com fetch.

**Ganhos na Prova:** Eliminamos a necessidade de escrever dezenas de linhas de JavaScript de Frontend (fetch, tratamento de JSON, manipulação da DOM) para cada operação de CRUD. O servidor faz todo o trabalho\!

## **2\. A Ferramenta de Template: EJS (Embedded JavaScript)**

Se no nosso modelo REST o Node.js enviava JSON puro, no SSR, ele precisa de uma maneira de **misturar dados com HTML**. É aí que entra o **EJS**.

O EJS é o nosso **motor de *view***. Ele permite que escrevamos tags de JavaScript dentro do HTML.

| HTML Simples (Estático) | HTML com EJS (Dinâmico) | Explicação |
| :---- | :---- | :---- |
| \<h1\>Lista de Produtos\</h1\> | \<h1\>Lista de Produtos\</h1\> | HTML normal. |
| *Não existe repetição* | \<% produtos.forEach(p \=\> { %\> ... \<% }); %\> | **Looping:** A tag \<% ... %\> permite executar comandos JavaScript (como um *loop* forEach) para repetir linhas da tabela. |
| *Não exibe dados do servidor* | \<td\>\<%= p.nomep %\>\</td\> | **Exibir Dados:** A tag \<%= ... %\> permite imprimir variáveis (os dados que vieram do PostgreSQL) diretamente no HTML. |

**Em Resumo:** O EJS é o *template* que o Node.js preenche com as informações do banco de dados, gerando a página final.

## **3\. Gerenciamento de Estado: express-session (O Login)**

No modelo REST \+ Fetch, o gerenciamento de *sessão* e *login* é complexo: o servidor envia um *token* (JWT) e o cliente o armazena e o envia em cada fetch.

No modelo monolítico SSR, usamos a biblioteca **express-session**, que torna o login muito mais fácil e seguro para esta prova.

### **Como a Sessão Funciona:**

1. **Login Válido:** Quando o usuário digita o Login e Senha corretos, o Node.js cria um objeto de **Sessão** (um pequeno pedaço de memória no servidor) e armazena informações importantes lá:  
   JavaScript

```
req.session.userId = 1; // ID do usuário logado
req.session.userName = 'Aluno Teste'; 
```

   

2. **Identificação:** O servidor envia um pequeno código único (um *cookie*) de volta para o navegador do aluno.  
3. **Navegação:** Em qualquer página subsequente (Menu, Produtos, Saldo), o navegador envia esse *cookie* de volta. O express-session usa esse *cookie* para **recuperar o objeto de sessão** e saber quem está logado.

**Ganhos na Prova:** Podemos usar uma função simples (requireLogin) para proteger qualquer rota, garantindo que o usuário só acesse o Menu se $ \\text{req.session.userId}$ estiver preenchido. É a forma mais rápida de implementar a segurança básica exigida pela prova.

## **🎯 Conclusão e Plano de Ação**

Vocês estão migrando temporariamente de uma arquitetura de mercado (REST) para uma arquitetura de **"prototipação rápida" (SSR)**.

* **REST \+ Fetch:** Ótimo para escalabilidade, mas exige muito código em duas pontas.  
* **SSR \+ EJS:** Ótimo para **agilidade**. O servidor gera todo o HTML, minimizando o código JavaScript de Frontend.

Essa abordagem não elimina o que vocês aprenderam; ela apenas move o foco. Seu conhecimento de **SQL** e **Node.js/Express** será usado para construir a lógica de *renderização* do HTML em vez de apenas enviar JSON.

Com essa introdução, eles terão o contexto e a motivação para se engajarem rapidamente no novo projeto. Você pode começar mostrando o server.js e a rota de login para exemplificar o uso de req.session.

