import characterPrompt from "./characterPrompt.js";
import inventory from "./inventory.js"

const npcGriznak = {
  name: "Griznak",
  description: "Um goblin comerciante que vende mercadorias raras no mercado negro.",
  age: 42,
  race: "Goblin",
  gender: "Masculino",
  profession: "Comerciante",
  role: "NPC",
  characterPrompt: characterPrompt,
  frameWidth: 99,
  frameHeight: 155,
  frameRate: 1.5,
  positionX: 570,
  positionY: 340,
  frameCount: 3,
  goldCoins: 1000,
  inventory: structuredClone(inventory),
  src: "../imgs/npcs/griznak.png",
  profilePicture: "../imgs/npcs/griznakProfilePicture.png",
};

export default npcGriznak;