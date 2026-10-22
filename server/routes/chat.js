import { Router } from "express";
import { handleChat, getState } from "../src/chatService.js"; // ajuste o caminho se necessário

const router = Router();

router.post("/chat", async (req, res) => {
  const { message, npcId, sessionId } = req.body ?? {};

  if (
    typeof message !== "string" || !message.trim() ||
    typeof npcId !== "string" || !npcId.trim() ||
    typeof sessionId !== "string" || !sessionId.trim()
  ) {
    return res
      .status(400)
      .json({ error: "message, npcId e sessionId são obrigatórios." });
  }

  const result = await handleChat({
    sessionId,
    npcId: npcId.trim().toLowerCase(),
    message: message.trim(),
  });

  res.json(result); // { reply, state }
});

router.get("/state/:npcId", (req, res) => {
  res.json(getState(req.params.npcId.trim().toLowerCase()));
});

export default router;