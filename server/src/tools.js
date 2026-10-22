import { tool } from "@langchain/core/tools";
import { z } from "zod";

const fail = (error) => JSON.stringify({ success: false, error });

export function createTradeTools(npc, protagonist) {
  const buyItem = tool(
    ({ itemName, quantity, unitPrice }) => {
      // Validações feitas aqui porque o Gemini não aceita
      // restrições como exclusiveMinimum no schema da tool.
      if (!Number.isInteger(quantity) || quantity <= 0)
        return fail("Quantidade inválida: deve ser um número inteiro maior que zero.");

      if (!Number.isFinite(unitPrice) || unitPrice <= 0)
        return fail("Preço inválido: deve ser maior que zero.");

      const item = npc.inventory.find(
        (i) => i.name.toLowerCase() === String(itemName).trim().toLowerCase()
      );

      if (!item) return fail("Item não existe no inventário do NPC.");
      if (item.stock <= 0) return fail("Item esgotado.");
      if (item.stock < quantity)
        return fail(`Estoque insuficiente. Disponível: ${item.stock}.`);
      if (unitPrice < item.min_price)
        return fail(`Preço abaixo do mínimo permitido (${item.min_price} por unidade).`);

      const total = unitPrice * quantity;

      if (protagonist.goldCoins < total)
        return fail(
          `Moedas insuficientes. Custo total: ${total}, jogador tem: ${protagonist.goldCoins}.`
        );

      // Alterações de estado (única fonte de verdade: o servidor)
      item.stock -= quantity;
      npc.goldCoins += total;
      protagonist.goldCoins -= total;

      const owned = protagonist.inventory.find((i) => i.name === item.name);
      if (owned) owned.stock += quantity;
      else protagonist.inventory.push({ ...item, stock: quantity });

      return JSON.stringify({
        success: true,
        itemName: item.name,
        quantity,
        unitPrice,
        total,
        npcGold: npc.goldCoins,
        playerGold: protagonist.goldCoins,
      });
    },
    {
      name: "buy_item",
      description:
        "Efetiva a compra de um item pelo protagonista. Chame SOMENTE quando o jogador tiver confirmado explicitamente o item, a quantidade (inteiro maior que zero) e o preço unitário acordado (maior que zero).",
      // Schema simples, sem .int(), .positive(), .min() etc.
      schema: z.object({
        itemName: z.string().describe("Nome exato do item no inventário do NPC"),
        quantity: z.number().describe("Quantidade de unidades, inteiro maior que zero"),
        unitPrice: z.number().describe("Preço acordado por unidade, em moedas de ouro"),
      }),
    }
  );

  return [buyItem];
}