import sceneConfig from "../sceneConfig.js";
import { addSpriteHoverEffect } from "../utils.js";
import protagonistGaspar from "../protagonist/character.js";
import NpcPanel from "./npcPanel.js";

export default class Scene {
    constructor(character, background) {
        this.character = character;
        this.background = background;
    }

    load(phaser) {
        phaser.load.image(
            this.background.name,
            this.background.src
        );

        phaser.load.spritesheet(
            this.character.name,
            this.character.src,
            {
                frameWidth: this.character.frameWidth,
                frameHeight: this.character.frameHeight
            }
        );
    }

    create(phaser) {
        const shadowOffsetY = this.character.frameHeight * 0.42;
        const animationKey = `${this.character.name}-animation`;

        // 1. Background
        this.backgroundSprite = phaser.add
            .image(0, 0, this.background.name)
            .setOrigin(0, 0)
            .setDisplaySize(sceneConfig.width, sceneConfig.height)
            .setDepth(0);

        // 2. Sombra no chão
        this.spriteShadow = phaser.add
            .ellipse(
                this.character.positionX,
                this.character.positionY + shadowOffsetY,
                this.character.frameWidth * 0.55,
                this.character.frameHeight * 0.12,
                0x000000,
                0.3
            )
            .setDepth(1);

        // 3. Personagem
        this.sprite = phaser.add
            .sprite(
                this.character.positionX,
                this.character.positionY,
                this.character.name
            )
            .setDepth(2)
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true });

        // 4. Animação (só cria se ainda não existir)
        if (!phaser.anims.exists(animationKey)) {
            phaser.anims.create({
                key: animationKey,
                frames: phaser.anims.generateFrameNumbers(
                    this.character.name,
                    {
                        start: 0,
                        end: this.character.frameCount - 1
                    }
                ),
                frameRate: this.character.frameRate,
                repeat: -1
            });
        }

        this.sprite.play(animationKey);

        // 5. Abre o painel do NPC ao clicar
        this.sprite.on("pointerdown", () => {
            NpcPanel.open(phaser, this.character);
        });

        // 6. Atualiza o ouro do protagonista quando uma compra é concluída.
        //    O NpcPanel emite este evento em scene.events.
        this.onPlayerGoldChanged = (gold) => {
            protagonistGaspar.goldCoins = gold;

            // Atualize aqui o texto da HUD, se você tiver uma.
            this.goldText?.setText(`Ouro: ${gold}`);
        };

        phaser.events.on("player-gold-changed", this.onPlayerGoldChanged);

        // 7. Efeito de hover
        addSpriteHoverEffect(this.sprite);

        // 8. Atualiza a sombra durante a animação
        this.onUpdate = () => {
            this.spriteShadow.setPosition(
                this.sprite.x,
                this.sprite.y + shadowOffsetY
            );
        };

        phaser.events.on("update", this.onUpdate);

        phaser.events.once("shutdown", () => {
            phaser.events.off("update", this.onUpdate);
            phaser.events.off("player-gold-changed", this.onPlayerGoldChanged);
        });

        // 9. Escurecimento do fundo
        this.backgroundOverlay = phaser.add
            .rectangle(
                0,
                0,
                sceneConfig.width,
                sceneConfig.height,
                0x000000,
                0.2
            )
            .setOrigin(0, 0)
            .setDepth(0.5);
    }
}