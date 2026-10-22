# 🪙 Griznak's Black Market

> Um RPG de negociação em que você barganha, no chat, com um goblin comerciante movido por IA. Quando o acordo é fechado, o NPC **executa funções reais do jogo**: desconta o estoque, atualiza as moedas dele e as suas.

Projeto pessoal criado para **praticar o LangChain.js**, com foco em *tool calling* (chamada de ferramentas) e em como manter o estado do jogo seguro e consistente quando um modelo de linguagem participa da lógica.

---

## 📚 Sobre o LangChain.js

O **LangChain.js** é uma biblioteca JavaScript que facilita a criação de aplicações que utilizam Inteligência Artificial (IA), conectando modelos de linguagem a dados, ferramentas e sistemas externos. Ela oferece abstrações para mensagens, modelos, ferramentas e fluxos de conversa, de modo que o código da aplicação não fique preso aos detalhes de cada provedor de IA.

Neste projeto ele é usado para:

- Conversar com o modelo **Google Gemini** por meio do pacote `@langchain/google-genai`.
- Montar o histórico de mensagens (`SystemMessage`, `HumanMessage`, `AIMessage`, `ToolMessage`).
- Declarar **ferramentas** (`tool`) que o modelo pode pedir para executar.
- Conduzir o ciclo de *tool calling*: o modelo pede uma função, o servidor executa e devolve o resultado, e só então o modelo escreve a resposta final ao jogador.

---

## 🎮 O jogo

Você controla **Gaspar**, um jovem comerciante ambicioso (e inexperiente). No mercado negro de uma caverna subterrânea, ele encontra **Griznak**, um goblin ganancioso, sarcástico e teatral que vende mercadorias raras.

- Clique no Griznak para abrir o painel de negociação.
- Veja as mercadorias por categoria, com raridade, descrição e estoque.
- Converse em linguagem natural: pergunte, barganhe, peça desconto.
- Quando você confirma item, quantidade e preço, o Griznak fecha a venda e o painel atualiza na hora.

## 🚀 Como executar

**1. Clone o repositório e instale as dependências**

```bash
git clone <url-do-repositorio>
cd the_clever_trader
npm install
```

**2. Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
GOOGLE_API_KEY=sua_chave_aqui
GEMINI_MODEL=nome-do-modelo-gemini
GEMINI_FALLBACK_MODEL=nome-de-outro-modelo-opcional
PORT=3000
```

| Variável | Descrição |
| --- | --- |
| `GOOGLE_API_KEY` | Chave da API do Google AI Studio (obrigatória). |
| `GEMINI_MODEL` | Modelo principal usado nas conversas. |
| `GEMINI_FALLBACK_MODEL` | Modelo reserva, usado se o principal falhar (opcional). |
| `PORT` | Porta do servidor (padrão `3000`). |

**3. Inicie o servidor**

```bash
npm start        # execução normal
npm run dev      # reinicia automaticamente ao salvar arquivos
```

**5. Jogue**

Abra **http://localhost:3000**, clique no Griznak e comece a negociar. Por exemplo: *"Quero 2 adagas, que tal 30 moedas cada?"* e, quando ele aceitar, confirme: *"Fechado!"*

