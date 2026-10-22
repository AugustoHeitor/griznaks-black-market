import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
export default function createModel(
  modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash"
) {
  return new ChatGoogleGenerativeAI({
    model: modelName,
    temperature: 0.8,
    maxRetries: 1,
  });
}



