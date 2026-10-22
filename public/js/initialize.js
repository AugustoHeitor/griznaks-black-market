import Scene from "./Classes/Scene.js";
import blackMarketBackground from "./backgrounds/blackMarket.js";
import npcGriznak from "./npcs/griznak/character.js";
import sceneConfig from "./sceneConfig.js"

document.addEventListener("DOMContentLoaded", () => {

    const blackMarketScene = new Scene(npcGriznak, blackMarketBackground);

    const config = {
        type: Phaser.AUTO,
        width: sceneConfig.width,
        height: sceneConfig.height,
        pixelArt: true,
        backgroundColor: sceneConfig.backgroundColor,
        antialias: false,
        roundPixels: true,
        parent: document.querySelector("#game-container"),
        dom: {
            createContainer: true
        },
        physics: {
            default: "arcade",
            arcade: {
                debug: true
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

    function preload() {
        blackMarketScene.load(this);
    }

    function create() {
        blackMarketScene.create(this);
    };

    function update() {
        
    }

    new Phaser.Game(config);
});


