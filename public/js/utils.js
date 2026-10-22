function addSpriteHoverEffect(sprite) {
    sprite.setInteractive({ useHandCursor: true });

    sprite.on("pointerover", () => {
        if (sprite.preFX) {
            sprite.preFX.addGlow(
                0x7cfc00, 
                0,       
                0,      
                false,  
                1,     
                8        
            ).outerStrength = 2;
        }
    });

    sprite.on("pointerout", () => {
        if (sprite.preFX) {
            sprite.preFX.clear();
        }
    });
}

export { addSpriteHoverEffect };