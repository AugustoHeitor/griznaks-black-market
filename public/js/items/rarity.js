const itemRarities = [
  {
    name: "Lixo",
    description: "Itens comuns sem valor ou com valor muito baixo.",
    colors: { num: 0x8a8a8a, css: "#a0a0a0" }
  },
  {
    name: "Comum",
    description: "Itens comuns que são fáceis de encontrar.",
    colors: { num: 0xd8d0c0, css: "#d8d0c0" }
  },
  {
    name: "Incomum",
    description: "Itens menos comuns e ligeiramente mais valiosos.",
    colors: { num: 0x6aa84f, css: "#8fd07a" }
  },
  {
    name: "Raro",
    description: "Itens valiosos e difíceis de encontrar.",
    colors: { num: 0x4a8fd8, css: "#7ab4f0" }
  },
  {
    name: "Épico",
    description: "Itens excepcionais, muito valiosos e altamente cobiçados.",
    colors: { num: 0xa855d8, css: "#c98af0" }
  },
  {
    name: "Lendário",
    description: "Itens extremamente raros e de valor extraordinário.",
    colors: { num: 0xe8b43c, css: "#ffd36a" }
  }
];

export default itemRarities;