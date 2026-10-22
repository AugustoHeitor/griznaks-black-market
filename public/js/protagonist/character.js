import inventory from "./inventory.js";

const protagonistGaspar = {
  name: "Gaspar",
  description:
    "Gaspar é um jovem comerciante inexperiente e inconsequente, movido pela ambição e curiosidade. Compra mercadorias estranhas, cria produtos improvisados e tenta revendê-los com lucro. Apesar dos erros e das decisões precipitadas, é carismático, otimista e sonha em construir seu próprio império comercial.",
  age: 20,
  race: "Humano",
  gender: "Masculino",
  profession: "Comerciante e artesão itinerante",
  role: "Protagonist",
  goldCoins: 300,
  inventory: structuredClone(inventory),
};

export default protagonistGaspar;