const API_URL = "/api/chat";
const STATE_URL = "/api/state";

function getSessionId() {
    let id = localStorage.getItem("sessionId");

    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("sessionId", id);
    }

    return id;
}

function createHttpError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
}

export default async function chat(text, npcId = "griznak") {
    let response;

    try {
        response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                message: text.trim(),
                npcId: npcId.trim().toLowerCase(),
                sessionId: getSessionId()
            })
        });
    } catch {
        throw createHttpError("Não foi possível falar com o servidor.", 0);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw createHttpError(
            data.error || `Erro HTTP ${response.status}`,
            response.status
        );
    }

    if (typeof data.reply !== "string") {
        throw createHttpError("Resposta inválida do servidor.", 502);
    }

    return data;
}

export async function fetchState(npcId = "griznak") {
    let response;

    try {
        response = await fetch(
            `${STATE_URL}/${encodeURIComponent(npcId.trim().toLowerCase())}`,
            { headers: { "Accept": "application/json" } }
        );
    } catch {
        throw createHttpError("Não foi possível falar com o servidor.", 0);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw createHttpError(
            data.error || `Erro HTTP ${response.status}`,
            response.status
        );
    }

    return data;
}