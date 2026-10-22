import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
} from "@langchain/core/messages";
import createModel from "./model.js";
import npcGriznak from "../../public/js/npcs/griznak/character.js";
import protagonistGaspar from "../../public/js/protagonist/character.js";

import { buildSystemPrompt, extractText } from "./utils.js";
import { createTradeTools } from "./tools.js";

const primaryModel = createModel();

const fallbackModel = process.env.GEMINI_FALLBACK_MODEL
  ? createModel(process.env.GEMINI_FALLBACK_MODEL)
  : null;

const npcs = { griznak: npcGriznak };

const MAX_HISTORY = 20;
const MAX_TOOL_ROUNDS = 5;
const RETRY_DELAYS_MS = [1500, 3000]; // esperas entre tentativas em caso de 503/500
const sessions = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findNpc(npcId) {
  const npc = npcs[npcId];

  if (!npc) {
    const error = new Error("NPC não encontrado.");
    error.status = 404;
    error.expose = true;
    throw error;
  }

  return npc;
}

function buildState(npc, protagonist) {
  return {
    npcGold: npc.goldCoins,
    playerGold: protagonist.goldCoins,
    npcStock: npc.inventory.map(({ name, stock }) => ({ name, stock })),
  };
}

// Chama o modelo com tratamento de falhas temporárias:
// - 503/500: espera um pouco e tenta de novo no mesmo modelo
// - 429 (cota) e outros erros: passa direto para o modelo reserva (se houver)
// - esgotadas as opções: lança o último erro
async function invokeModel(tools, messages) {
  const candidates = [primaryModel, fallbackModel].filter(Boolean);
  let lastError;

  for (const candidate of candidates) {
    const boundModel = candidate.bindTools(tools);

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        return await boundModel.invoke(messages);
      } catch (error) {
        lastError = error;

        const isTemporary = error?.status === 503 || error?.status === 500;

        // 429, 400 etc.: repetir no mesmo modelo não adianta.
        if (!isTemporary) break;

        if (attempt < RETRY_DELAYS_MS.length) {
          console.warn(
            `[Chat] Erro ${error.status} no modelo, nova tentativa em ${RETRY_DELAYS_MS[attempt]}ms...`
          );
          await sleep(RETRY_DELAYS_MS[attempt]);
        }
      }
    }

    console.warn(
      `[Chat] Modelo falhou (${lastError?.status ?? "sem status"}).` +
        (candidate === primaryModel && fallbackModel ? " Tentando o modelo reserva." : "")
    );
  }

  throw lastError;
}

// Transforma erros enormes do Google em mensagens curtas para o jogador.
// A flag "expose" avisa o tratador global que a mensagem pode ir para o front.
function toFriendlyError(error) {
  if (error?.status === 429) {
    const friendly = new Error(
      "O Griznak está sem fôlego agora (limite de uso da IA atingido). Tente de novo mais tarde."
    );
    friendly.status = 429;
    friendly.expose = true;
    return friendly;
  }

  if (error?.status === 503 || error?.status === 500) {
    const friendly = new Error(
      "O Griznak está ocupado atendendo outros clientes. Tente de novo em alguns instantes."
    );
    friendly.status = 503;
    friendly.expose = true;
    return friendly;
  }

  return error;
}

export function getState(npcId) {
  return buildState(findNpc(npcId), protagonistGaspar);
}

export async function handleChat({ sessionId, npcId, message }) {
  const npc = findNpc(npcId);

  const tools = createTradeTools(npc, protagonistGaspar);
  const toolsByName = Object.fromEntries(tools.map((t) => [t.name, t]));

  const key = `${sessionId}:${npcId}`;
  const history = sessions.get(key) ?? [];

  history.push(new HumanMessage(message));

  // Indica se alguma tool já alterou o estado do jogo neste turno.
  let toolsRan = false;

  try {
    const messages = [
      new SystemMessage(buildSystemPrompt(npc, protagonistGaspar)),
      ...history,
    ];

    let response = await invokeModel(tools, messages);
    let rounds = 0;

    while (response.tool_calls?.length && rounds < MAX_TOOL_ROUNDS) {
      rounds++;
      messages.push(response);

      for (const call of response.tool_calls) {
        const selectedTool = toolsByName[call.name];

        if (!selectedTool) {
          messages.push(
            new ToolMessage({
              tool_call_id: call.id,
              content: JSON.stringify({
                success: false,
                error: "Ferramenta desconhecida.",
              }),
            })
          );
          continue;
        }

        // Passar o tool_call inteiro devolve um ToolMessage pronto.
        messages.push(await selectedTool.invoke(call));
        toolsRan = true;
      }

      response = await invokeModel(tools, messages);
    }

    const reply = extractText(response.content);

    // O histórico guarda só a fala do jogador e a resposta final.
    // O system prompt é reconstruído a cada turno com o estado atual.
    history.push(new AIMessage(reply));
    sessions.set(key, history.slice(-MAX_HISTORY));

    return { reply, state: buildState(npc, protagonistGaspar) };
  } catch (error) {
    // Se uma tool já rodou, o estado do jogo mudou (estoque e ouro).
    // Devolve o estado atualizado mesmo que a fala final tenha falhado,
    // para o painel não ficar desatualizado.
    if (toolsRan) {
      const reply =
        "*pigarreia* Perdi a linha do raciocínio... confira seu inventário e suas moedas.";

      history.push(new AIMessage(reply));
      sessions.set(key, history.slice(-MAX_HISTORY));

      return { reply, state: buildState(npc, protagonistGaspar) };
    }

    history.pop();
    throw toFriendlyError(error);
  }
}