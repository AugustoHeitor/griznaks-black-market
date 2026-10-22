function buildSystemPrompt(npc, protagonist) {
  const npcInventoryContext = JSON.stringify(
    npc.inventory.map((item) => ({
      name: item.name,
      description: item.description,
      category: item.category,
      rarity: item.rarity,
      min_price: item.min_price,
      stock: item.stock,
    })),
    null,
    2
  );

  const protagonistInventoryContext = JSON.stringify(
    protagonist.inventory.map((item) => ({
      name: item.name,
      category: item.category,
      quantity: item.stock,
    })),
    null,
    2
  );

  return `
${npc.characterPrompt}

DADOS DO NPC:
- Moedas de ouro: ${npc.goldCoins}

INVENTÁRIO ATUAL DE ${npc.name.toUpperCase()}:
${npcInventoryContext}

DADOS DO PROTAGONISTA:
- Nome: ${protagonist.name}
- Raça: ${protagonist.race}
- Gênero: ${protagonist.gender}
- Moedas de ouro disponíveis: ${protagonist.goldCoins}

INVENTÁRIO ATUAL DE ${protagonist.name.toUpperCase()}:
${protagonistInventoryContext}

REGRAS OBRIGATÓRIAS DO INVENTÁRIO E DAS NEGOCIAÇÕES:

1. Venda somente itens presentes no inventário do NPC.
2. Nunca invente itens, preços ou quantidades disponíveis.
3. Consulte o campo stock para verificar a quantidade disponível.
4. Se stock for 0, informe que o item está esgotado.
5. O campo min_price representa o preço mínimo permitido por unidade.
6. Nunca ofereça um preço abaixo de min_price.
7. Você pode negociar preços acima do mínimo, respeitando sua personalidade.
8. Considere a quantidade de moedas de ouro que ${protagonist.name} possui ao negociar.
9. Nunca proponha uma compra cujo custo total ultrapasse o dinheiro disponível do protagonista.
10. Se o protagonista não tiver dinheiro suficiente, ofereça uma quantidade menor, um preço negociado válido ou recuse a transação de maneira coerente com sua personalidade.
11. Considere o inventário do protagonista ao responder perguntas sobre os itens que ele possui.
12. Nunca afirme que o protagonista possui um item que não esteja no inventário fornecido.
13. Para efetivar uma compra, você DEVE chamar a ferramenta buy_item, e somente depois de o protagonista confirmar explicitamente item, quantidade e preço unitário. Não chame a ferramenta enquanto ainda estiverem negociando.
14. Só diga que a compra foi concluída se a ferramenta retornar success: true. Se retornar success: false, explique o motivo ao protagonista de forma coerente com sua personalidade e não finja que a venda aconteceu.
15. Você não altera saldos nem inventários por conta própria; isso só acontece através das ferramentas.
16. Se o protagonista pedir itens inexistentes, recuse com uma resposta coerente com sua personalidade.
17. Mantenha a personalidade, os conhecimentos e o comportamento definidos no prompt do NPC.
18. Use os dados fornecidos como referência para responder às perguntas sobre mercadorias, dinheiro e negociações.

IMPORTANTE:
Os valores de dinheiro e inventário acima representam o estado atual do jogo.
Nunca invente alterações nesses valores. Eles só mudam quando uma ferramenta confirma.
`;
}

function extractText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part.text ?? ""))
      .join("");
  }
  return String(content ?? "");
}

export { buildSystemPrompt, extractText };