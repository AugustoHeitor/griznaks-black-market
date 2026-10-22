import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chatRouter from "./server/routes/chat.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

// Configuração para receber requisições JSON.
app.use(express.json({ limit: "10kb" }));

// API de conversação com os NPCs.
app.use("/api", chatRouter);

// Retorna JSON para rotas inexistentes da API.
app.use("/api", (req, res) => {
    res.status(404).json({
        error: "Rota da API não encontrada."
    });
});

// Arquivos estáticos do frontend.
app.use(express.static(PUBLIC_DIR));

// Tratamento para páginas inexistentes.
app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
    }

    res.status(404).send("Página não encontrada.");
});

// Tratamento global de erros.
app.use((error, req, res, next) => {
    // Erros esperados (cota, sobrecarga, NPC inexistente) já trazem uma
    // mensagem própria para o jogador e são marcados com "expose".
    // O log completo fica reservado para erros inesperados.
    if (error.expose) {
        console.warn(`[Servidor] ${error.status}: ${error.message}`);
    } else {
        console.error("[Servidor]", error);
    }

    if (res.headersSent) {
        return next(error);
    }

    const status = error.status || 500;

    res.status(status).json({
        error: error.expose
            ? error.message
            : status === 400
                ? "Requisição JSON inválida."
                : "Erro interno do servidor."
    });
});

// Inicialização do servidor.
app.listen(PORT, () => {
    console.log("----------------------------------------");
    console.log(" The Clever Trader");
    console.log(` Servidor: http://localhost:${PORT}`);
    console.log(` Frontend: ${PUBLIC_DIR}`);
    console.log(` API:      http://localhost:${PORT}/api/chat`);
    console.log("----------------------------------------");
});