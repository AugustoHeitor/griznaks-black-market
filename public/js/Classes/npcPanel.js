import chat, { fetchState } from "../chat.js";
import itemRarities from "../items/rarity.js";
import settingsPanel from "../settingsPanel.js";
import itemCategories from "../items/categories.js";

const COLORS = settingsPanel.colors;
const FONT_BODY = settingsPanel.fontBody;
const FONT_TITLE = settingsPanel.fontTitle;
const FONT_SIZES = settingsPanel.fontSizes;

const DEFAULT_RARITY_COLORS = {
    num: 0x888888,
    css: "#888888"
};

class NpcPanel {

    static instances = new WeakMap();
    static imageLoads = new WeakMap();

    static open(scene, npc) {
        let panelsByNpc = NpcPanel.instances.get(scene);

        if (!panelsByNpc) {
            panelsByNpc = new Map();
            NpcPanel.instances.set(scene, panelsByNpc);
        }

        let panel = panelsByNpc.get(npc);

        if (!panel) {
            panel = new NpcPanel(scene, npc);
            panelsByNpc.set(npc, panel);
        }

        panel.open();

        return panel;
    }

    constructor(scene, npc) {
        this.scene = scene;
        this.npc = npc;

        this.built = false;
        this.isOpen = false;
        this.isBusy = false;

        this.categories = itemCategories.map(
            (category) => category.name
        );

        this.currentCategoryIndex = 0;
        this.selectedItem = null;
        this.hoveredItem = null;
        this.slotRedrawFunctions = [];

        this.messageContentHeight = 0;
        this.chatScrollOffset = 0;

        this.onEscape = null;
        this.onWheel = null;
    }

    rarityOf(name) {
        const rarity = itemRarities.find(
            (item) => item.name === name
        );

        return rarity?.colors || DEFAULT_RARITY_COLORS;
    }

    inside(point, rectangle) {
        return (
            point.x >= rectangle.x &&
            point.x <= rectangle.x + rectangle.width &&
            point.y >= rectangle.y &&
            point.y <= rectangle.y + rectangle.height
        );
    }

    getLoadState() {
        let state = NpcPanel.imageLoads.get(this.scene);

        if (!state) {
            state = {
                pending: new Map(),
                failed: new Set()
            };

            NpcPanel.imageLoads.set(this.scene, state);
        }

        return state;
    }

    loadTexture(src, onReady) {
        if (!src || typeof src !== "string") return;

        const scene = this.scene;

        if (scene.textures.exists(src)) {
            onReady(src);
            return;
        }

        const key = `npc-img:${src}`;

        if (scene.textures.exists(key)) {
            onReady(key);
            return;
        }

        const state = this.getLoadState();

        if (state.failed.has(key)) return;

        if (state.pending.has(key)) {
            state.pending.get(key).push(onReady);
            return;
        }

        state.pending.set(key, [onReady]);

        const finish = (success) => {
            const callbacks = state.pending.get(key) || [];

            state.pending.delete(key);

            scene.load.off(`filecomplete-image-${key}`, onComplete);
            scene.load.off("loaderror", onError);

            if (!success) {
                state.failed.add(key);
                console.warn(`Não foi possível carregar a imagem: ${src}`);
                return;
            }

            callbacks.forEach((callback) => callback(key));
        };

        const onComplete = () => finish(true);

        const onError = (file) => {
            if (file.key === key) {
                finish(false);
            }
        };

        scene.load.once(`filecomplete-image-${key}`, onComplete);
        scene.load.on("loaderror", onError);

        scene.load.image(key, src);

        if (!scene.load.isLoading()) {
            scene.load.start();
        }
    }

    pixelPanel(
        parent,
        posX,
        posY,
        width,
        height,
        {
            fill = COLORS.panel,
            border = COLORS.border
        } = {}
    ) {
        const borderThickness = 4;
        const panel = this.scene.add.graphics();

        panel.fillStyle(COLORS.shadow, 1);

        panel.fillRect(
            posX - borderThickness,
            posY - borderThickness,
            width + borderThickness * 2,
            height + borderThickness * 2
        );

        panel.fillStyle(border, 1);
        panel.fillRect(posX, posY, width, height);

        panel.fillStyle(fill, 1);

        panel.fillRect(
            posX + borderThickness,
            posY + borderThickness,
            width - borderThickness * 2,
            height - borderThickness * 2
        );

        panel.fillStyle(0xffffff, 0.06);

        panel.fillRect(
            posX + borderThickness,
            posY + borderThickness,
            width - borderThickness * 2,
            2
        );

        parent.add(panel);

        return panel;
    }

    makeText(parent, posX, posY, string, style = {}) {
        const text = this.scene.add.text(
            posX,
            posY,
            string ?? "",
            {
                fontFamily: FONT_BODY,
                fontSize: FONT_SIZES.body,
                color: COLORS.text,
                ...style
            }
        );

        parent.add(text);

        return text;
    }

    makeButton(
        parent,
        posX,
        posY,
        width,
        height,
        label,
        onClick,
        {
            primary = false,
            align = "center",
            size = 22
        } = {}
    ) {
        const scene = this.scene;
        const buttonGraphics = scene.add.graphics();

        const drawButton = (isHovered) => {
            buttonGraphics.clear();

            buttonGraphics
                .fillStyle(
                    isHovered ? COLORS.gold : COLORS.bronze,
                    1
                )
                .fillRect(posX, posY, width, height);

            buttonGraphics
                .fillStyle(
                    primary
                        ? 0xa8742c
                        : isHovered
                            ? 0x4a3520
                            : 0x3a2a1a,
                    1
                )
                .fillRect(
                    posX + 4,
                    posY + 4,
                    width - 8,
                    height - 8
                );

            buttonGraphics
                .fillStyle(0x000000, 0.3)
                .fillRect(
                    posX + 4,
                    posY + height - 8,
                    width - 8,
                    4
                );
        };

        drawButton(false);

        const buttonText = scene.add
            .text(
                align === "left"
                    ? posX + 14
                    : posX + width / 2,
                posY + height / 2 - 1,
                label,
                {
                    fontFamily: FONT_BODY,
                    fontSize: `${size}px`,
                    color: primary
                        ? "#14100c"
                        : COLORS.text
                }
            )
            .setOrigin(
                align === "left" ? 0 : 0.5,
                0.5
            );

        const buttonZone = scene.add
            .zone(
                posX + width / 2,
                posY + height / 2,
                width,
                height
            )
            .setInteractive({
                useHandCursor: true
            });

        buttonZone.on("pointerover", () => {
            drawButton(true);
        });

        buttonZone.on("pointerout", () => {
            drawButton(false);
        });

        buttonZone.on("pointerdown", () => {
            onClick();
        });

        parent.add([
            buttonGraphics,
            buttonText,
            buttonZone
        ]);

        return {
            graphics: buttonGraphics,
            text: buttonText,
            zone: buttonZone
        };
    }

    fitImage(
        parent,
        src,
        posX,
        posY,
        boxWidth,
        boxHeight
    ) {
        if (!src) return null;

        const holder = this.scene.add.container(0, 0);

        parent.add(holder);

        this.loadTexture(src, (textureKey) => {
       
            if (!this.built || !holder.active || !holder.scene) {
                return;
            }

            const image = this.scene.add.image(
                posX,
                posY,
                textureKey
            );

            const scale = Math.min(
                boxWidth / image.width,
                boxHeight / image.height
            );

            image
                .setScale(scale)
                .setPosition(posX, posY);

            holder.add(image);
        });

        return holder;
    }

    open() {
        if (!this.built) {
            this.build();
        }

        this.root.setVisible(true);
        this.dom.setVisible(true);

        this.isOpen = true;
        this.dom.node.focus();

        // Busca no servidor o estoque e o ouro atuais.
        this.syncState();
    }
    
    close() {
        if (!this.built) return;

        this.root.setVisible(false);
        this.dom.setVisible(false);
        this.dom.node.blur();

        this.isOpen = false;
        this.hoveredItem = null;
    }

    destroy() {
        if (!this.built) return;

        if (this.onEscape) {
            this.scene.input.keyboard?.off(
                "keydown-ESC",
                this.onEscape
            );
        }

        if (this.onWheel) {
            this.scene.input.off(
                "wheel",
                this.onWheel
            );
        }

        this.root.destroy(true);
        this.dom.destroy();

        this.built = false;
        this.isOpen = false;

        NpcPanel.instances
            .get(this.scene)
            ?.delete(this.npc);
    }

    formatGold(amount) {
        return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    setGold(goldAmount) {
        this.npc.goldCoins = goldAmount;
        this.goldText?.setText(this.formatGold(goldAmount));
    }

    build() {
        const scene = this.scene;

        const {
            width: screenWidth,
            height: screenHeight
        } = scene.scale;

        this.scaleFactor = Math.max(
            0.6,
            Math.min(
                screenWidth / 1280,
                screenHeight / 720
            )
        );

        const scaleSize = (value) =>
            Math.round(value * this.scaleFactor);

        this.scaleSize = scaleSize;

        this.built = true;

        this.root = scene.add
            .container(0, 0)
            .setDepth(1000)
            .setScrollFactor(0)
            .setVisible(false);

        const backgroundOverlay = scene.add
            .rectangle(
                0,
                0,
                screenWidth,
                screenHeight,
                0x000000,
                0.78
            )
            .setOrigin(0)
            .setInteractive();

        this.root.add(backgroundOverlay);

        const panelPadding = scaleSize(24);

        const availableWidth =
            screenWidth - panelPadding * 2;

        const availableHeight =
            screenHeight - panelPadding * 2;

        const profilePanelWidth = Math.round(
            availableWidth * 0.24
        );

        const chatPanelWidth = Math.round(
            availableWidth * 0.34
        );

        const inventoryPanelWidth =
            availableWidth -
            profilePanelWidth -
            chatPanelWidth -
            panelPadding * 2;

        const profilePanelX = panelPadding;

        const inventoryPanelX =
            profilePanelX +
            profilePanelWidth +
            panelPadding;

        const chatPanelX =
            inventoryPanelX +
            inventoryPanelWidth +
            panelPadding;

        this.buildProfile(
            profilePanelX,
            panelPadding,
            profilePanelWidth,
            availableHeight
        );

        this.buildInventory(
            inventoryPanelX,
            panelPadding,
            inventoryPanelWidth,
            availableHeight
        );

        this.buildChat(
            chatPanelX,
            panelPadding,
            chatPanelWidth,
            availableHeight
        );

        this.onEscape = () => {
            if (this.isOpen) {
                this.close();
            }
        };

        scene.input.keyboard.on(
            "keydown-ESC",
            this.onEscape
        );

        this.onWheel = (
            pointer,
            _over,
            _deltaX,
            scrollDeltaY
        ) => {
            if (
                this.isOpen &&
                this.inside(pointer, this.chatArea)
            ) {
                this.scrollChat(-scrollDeltaY * 0.5);
            }
        };

        scene.input.on("wheel", this.onWheel);

        scene.events.once("shutdown", () => {
            this.destroy();
        });
    }

    buildProfile(posX, posY, width, height) {
        const {
            scaleSize,
            root,
            npc
        } = this;

        const padding = scaleSize(16);

        this.pixelPanel(
            root,
            posX,
            posY,
            width,
            height
        );

        const portraitWidth = width - padding * 2;
        const portraitHeight = scaleSize(190);

        const portraitX = posX + padding;
        const portraitY = posY + padding;

        const portraitBackground = this.scene.add.rectangle(
            portraitX + portraitWidth / 2,
            portraitY + portraitHeight / 2,
            portraitWidth,
            portraitHeight,
            0x1a1410
        );

        root.add(portraitBackground);

        this.fitImage(
            root,
            this.npc.profilePicture,
            portraitX + portraitWidth / 2,
            portraitY + portraitHeight / 2,
            portraitWidth,
            portraitHeight
        );

        let textPosY =
            portraitY +
            portraitHeight +
            scaleSize(18);

        this.makeText(
            root,
            posX + padding,
            textPosY,
            npc.name,
            {
                fontFamily: FONT_TITLE,
                fontSize: `${scaleSize(26)}px`,
                color: COLORS.green
            }
        );

        textPosY += scaleSize(32);

        this.makeText(
            root,
            posX + padding,
            textPosY,
            npc.profession,
            {
                fontSize: `${scaleSize(22)}px`,
                color: COLORS.goldCss
            }
        );

        textPosY += scaleSize(30);

        const descriptionText = this.makeText(
            root,
            posX + padding,
            textPosY,
            npc.description,
            {
                fontSize: `${scaleSize(20)}px`,
                color: COLORS.soft,
                wordWrap: {
                    width: portraitWidth
                }
            }
        );

        textPosY +=
            descriptionText.height +
            scaleSize(14);

        const profileDetails = [
            ["Raça", npc.race],
            ["Idade", `${npc.age} anos`],
            ["Gênero", npc.gender],
            ["Ouro", this.formatGold(npc.goldCoins)]
        ];

        profileDetails.forEach(
            ([detailLabel, detailValue]) => {
                this.makeText(
                    root,
                    posX + padding,
                    textPosY,
                    detailLabel,
                    {
                        fontSize: `${scaleSize(20)}px`,
                        color: COLORS.muted
                    }
                );

                const valueText = this.makeText(
                    root,
                    posX + padding + scaleSize(90),
                    textPosY,
                    detailValue,
                    {
                        fontSize: `${scaleSize(20)}px`
                    }
                );

                // Guarda a referência para o setGold conseguir atualizar.
                if (detailLabel === "Ouro") {
                    this.goldText = valueText;
                }

                textPosY += scaleSize(26);
            }
        );
    }

    buildInventory(posX, posY, width, height) {
        const {
            scene,
            scaleSize,
            root
        } = this;

        const padding = scaleSize(16);

        this.pixelPanel(
            root,
            posX,
            posY,
            width,
            height
        );

        this.makeText(
            root,
            posX + padding,
            posY + padding + scaleSize(10),
            "Mercadorias",
            {
                fontFamily: FONT_TITLE,
                fontSize: `${scaleSize(22)}px`,
                color: COLORS.goldCss
            }
        );

        this.makeButton(
            root,
            posX + width - padding - scaleSize(110),
            posY + padding,
            scaleSize(110),
            scaleSize(40),
            "Fechar",
            () => this.close(),
            {
                size: scaleSize(22)
            }
        );

        const categorySelectorY =
            posY + padding + scaleSize(56);

        const categorySelectorHeight = scaleSize(44);

        this.makeButton(
            root,
            posX + padding,
            categorySelectorY,
            scaleSize(44),
            categorySelectorHeight,
            "<",
            () => this.changeCategory(-1),
            {
                size: scaleSize(24)
            }
        );

        this.makeButton(
            root,
            posX + width - padding - scaleSize(44),
            categorySelectorY,
            scaleSize(44),
            categorySelectorHeight,
            ">",
            () => this.changeCategory(1),
            {
                size: scaleSize(24)
            }
        );

        this.categoryLabel = this.makeText(
            root,
            posX + width / 2,
            categorySelectorY + categorySelectorHeight / 2,
            "",
            {
                fontSize: `${scaleSize(23)}px`,
                color: COLORS.goldCss
            }
        ).setOrigin(0.5);

        const columnCount = 5;
        const slotGap = scaleSize(10);

        const inventoryContentWidth =
            width - padding * 2;

        const slotSize = Math.floor(
            (
                inventoryContentWidth -
                slotGap * (columnCount - 1)
            ) / columnCount
        );

        const largestCategoryItemCount = Math.max(
            0,
            ...this.categories.map(
                (categoryName) =>
                    this.npc.inventory.filter(
                        (item) =>
                            item.category === categoryName
                    ).length
            )
        );

        const rowCount = Math.ceil(
            largestCategoryItemCount / columnCount
        );

        const gridPosY =
            categorySelectorY +
            categorySelectorHeight +
            scaleSize(16);

        const gridHeight =
            rowCount > 0
                ? rowCount * slotSize +
                    (rowCount - 1) * slotGap
                : 0;

        this.grid = {
            posX: posX + padding,
            posY: gridPosY,
            slotSize,
            slotGap,
            columnCount
        };

        this.gridContainer = scene.add.container(0, 0);

        root.add(this.gridContainer);

        const detailPosY =
            gridPosY +
            gridHeight +
            scaleSize(16);

        const askSellerButtonHeight = scaleSize(44);

        const detailHeight = Math.max(
            scaleSize(60),
            posY +
                height -
                padding -
                askSellerButtonHeight -
                scaleSize(12) -
                detailPosY
        );

        this.detailBox = {
            posX: posX + padding,
            posY: detailPosY,
            width: inventoryContentWidth,
            height: detailHeight
        };

        this.detailContainer = scene.add.container(0, 0);

        root.add(this.detailContainer);

        this.renderGrid();
    }

    changeCategory(direction) {
        const categoryCount = this.categories.length;

        if (categoryCount === 0) return;

        this.currentCategoryIndex =
            (
                this.currentCategoryIndex +
                direction +
                categoryCount
            ) % categoryCount;

        this.renderGrid();
    }

    renderGrid() {
        const {
            scene,
            scaleSize
        } = this;

        const categoryName =
            this.categories[this.currentCategoryIndex];

        const categoryItems = this.npc.inventory.filter(
            (item) => item.category === categoryName
        );

        const {
            posX: gridPosX,
            posY: gridPosY,
            slotSize,
            slotGap,
            columnCount
        } = this.grid;

        this.gridContainer.removeAll(true);

        this.slotRedrawFunctions = [];
        this.hoveredItem = null;

        const previousSelectedName = this.selectedItem?.name;

        this.selectedItem =
            categoryItems.find((item) => item.name === previousSelectedName) ||
            categoryItems[0] ||
            null;

        this.categoryLabel.setText(
            `${categoryName} (${categoryItems.length})`
        );

        categoryItems.forEach((item, itemIndex) => {
            const slotPosX =
                gridPosX +
                (itemIndex % columnCount) *
                    (slotSize + slotGap);

            const slotPosY =
                gridPosY +
                Math.floor(itemIndex / columnCount) *
                    (slotSize + slotGap);

            const slotGraphics = scene.add.graphics();

            const isOutOfStock = item.stock <= 0;
            const rarityColors = this.rarityOf(item.rarity);

            const redrawSlot = () => {
                const isSelected =
                    this.selectedItem === item;

                const isHovered =
                    this.hoveredItem === item;

                slotGraphics.clear();

                const backgroundColor = isSelected
                    ? 0x33260f
                    : isHovered
                        ? 0x241a12
                        : 0x1a1410;

                slotGraphics
                    .fillStyle(backgroundColor, 1)
                    .fillRect(
                        slotPosX,
                        slotPosY,
                        slotSize,
                        slotSize
                    );

                slotGraphics
                    .fillStyle(rarityColors.num, 1)
                    .fillRect(
                        slotPosX,
                        slotPosY + slotSize - 4,
                        slotSize,
                        4
                    );
            };

            redrawSlot();

            slotGraphics.setAlpha(
                isOutOfStock ? 0.5 : 1
            );

            this.gridContainer.add(slotGraphics);

            const itemImageHolder = this.fitImage(
                this.gridContainer,
                item.src,
                slotPosX + slotSize / 2,
                slotPosY + slotSize / 2 - 4,
                slotSize - 12,
                slotSize - 16
            );

            if (itemImageHolder && isOutOfStock) {
                itemImageHolder.setAlpha(0.5);
            }

            const stockText = scene.add
                .text(
                    slotPosX + slotSize - 5,
                    slotPosY + slotSize - 7,
                    isOutOfStock
                        ? "Esgotado"
                        : `x${item.stock}`,
                    {
                        fontFamily: FONT_BODY,
                        fontSize: `${scaleSize(19)}px`,
                        color: isOutOfStock
                            ? COLORS.red
                            : COLORS.muted
                    }
                )
                .setOrigin(1, 1);

            this.gridContainer.add(stockText);

            const slotInteractionZone = scene.add
                .zone(
                    slotPosX + slotSize / 2,
                    slotPosY + slotSize / 2,
                    slotSize,
                    slotSize
                )
                .setInteractive({
                    useHandCursor: true
                });

            slotInteractionZone.on("pointerover", () => {
                this.hoveredItem = item;
                this.refreshSlots();
                this.updateDetail();
            });

            slotInteractionZone.on("pointerout", () => {
                this.hoveredItem = null;
                this.refreshSlots();
                this.updateDetail();
            });

            slotInteractionZone.on("pointerdown", () => {
                this.selectedItem = item;
                this.refreshSlots();
                this.updateDetail();
            });

            this.gridContainer.add(slotInteractionZone);

            this.slotRedrawFunctions.push(redrawSlot);
        });

        this.updateDetail();
    }

    refreshSlots() {
        this.slotRedrawFunctions.forEach(
            (redrawSlot) => redrawSlot()
        );
    }

    updateDetail() {
        const {
            scaleSize,
            detailContainer,
            detailBox
        } = this;

        const item =
            this.hoveredItem || this.selectedItem;

        detailContainer.removeAll(true);

        if (!item) {
            this.makeText(
                detailContainer,
                detailBox.posX + scaleSize(14),
                detailBox.posY + scaleSize(14),
                "Selecione um item.",
                {
                    color: COLORS.muted
                }
            );

            return;
        }

        const itemRarity = this.rarityOf(item.rarity);

        const padding = scaleSize(14);
        const itemIconSize = scaleSize(96);

        this.fitImage(
            detailContainer,
            item.src,
            detailBox.posX +
                padding +
                itemIconSize / 2,
            detailBox.posY +
                padding +
                itemIconSize / 2,
            itemIconSize,
            itemIconSize
        );

        const itemTextPosX =
            detailBox.posX +
            padding +
            itemIconSize +
            padding;

        this.makeText(
            detailContainer,
            itemTextPosX,
            detailBox.posY + padding,
            item.name,
            {
                fontFamily: FONT_TITLE,
                fontSize: `${scaleSize(12)}px`,
                color: itemRarity.css,
                wordWrap: {
                    width:
                        detailBox.width -
                        itemIconSize -
                        padding * 3
                },
                lineSpacing: 6
            }
        );

        this.makeText(
            detailContainer,
            itemTextPosX,
            detailBox.posY +
                padding +
                itemIconSize -
                scaleSize(50),
            `${item.rarity}  |  ${item.category}`,
            {
                fontSize: `${scaleSize(20)}px`,
                color: COLORS.muted
            }
        );

        this.makeText(
            detailContainer,
            itemTextPosX,
            detailBox.posY +
                padding +
                itemIconSize -
                scaleSize(26),
            item.stock > 0
                ? `Estoque: ${item.stock}`
                : "Esgotado",
            {
                fontSize: `${scaleSize(21)}px`,
                color: item.stock > 0
                    ? COLORS.green
                    : COLORS.red
            }
        );

        this.makeText(
            detailContainer,
            detailBox.posX + padding,
            detailBox.posY +
                padding +
                itemIconSize +
                padding,
            item.description || "",
            {
                fontSize: `${scaleSize(22)}px`,
                color: COLORS.soft,
                wordWrap: {
                    width: detailBox.width - padding * 2
                }
            }
        );
    }

    buildChat(posX, posY, width, height) {
        const {
            scene,
            scaleSize,
            root,
            npc
        } = this;

        const padding = scaleSize(16);

        this.pixelPanel(
            root,
            posX,
            posY,
            width,
            height
        );

        const headerSize = scaleSize(48);

        const avatarPlaceholder = scene.add.rectangle(
            posX + padding + headerSize / 2,
            posY + padding + headerSize / 2,
            headerSize,
            headerSize,
            0x1a1410
        );

        root.add(avatarPlaceholder);

        this.fitImage(
            root,
            this.npc.profilePicture,
            posX + padding + headerSize / 2,
            posY + padding + headerSize / 2,
            headerSize,
            headerSize
        );

        this.makeText(
            root,
            posX + padding + headerSize + scaleSize(14),
            posY + padding + scaleSize(4),
            npc.name,
            {
                fontFamily: FONT_TITLE,
                fontSize: `${scaleSize(18)}px`,
                color: COLORS.goldCss
            }
        );

        this.statusText = this.makeText(
            root,
            posX + padding + headerSize + scaleSize(14),
            posY + padding + scaleSize(28),
            npc.profession,
            {
                fontSize: `${scaleSize(18)}px`,
                color: COLORS.green
            }
        );

        const dividerPosY =
            posY +
            padding +
            headerSize +
            scaleSize(12);

        const dividerGraphics = scene.add.graphics();

        dividerGraphics
            .fillStyle(COLORS.slotBorder, 1)
            .fillRect(
                posX + padding,
                dividerPosY,
                width - padding * 2,
                4
            );

        root.add(dividerGraphics);

        const chatContentWidth = width - padding * 2;
        const inputHeight = scaleSize(44);

        const inputPosY =
            posY +
            height -
            padding -
            inputHeight;

        const messageAreaPosY =
            dividerPosY + scaleSize(16);

        const messageAreaHeight = Math.max(
            0,
            inputPosY -
                messageAreaPosY -
                scaleSize(12)
        );

        this.chatArea = {
            x: posX + padding,
            y: messageAreaPosY,
            width: chatContentWidth,
            height: messageAreaHeight
        };

        this.messageContainer = scene.add.container(
            posX + padding,
            messageAreaPosY
        );

        root.add(this.messageContainer);

        const messageMaskGraphics =
            scene.make.graphics({}, false);

        messageMaskGraphics
            .setScrollFactor(0)
            .fillStyle(0xffffff, 1)
            .fillRect(
                posX + padding,
                messageAreaPosY,
                chatContentWidth,
                messageAreaHeight
            );

        this.messageContainer.setMask(
            messageMaskGraphics.createGeometryMask()
        );

        const sendButtonWidth = scaleSize(96);

        const inputWidth =
            chatContentWidth -
            sendButtonWidth -
            scaleSize(8);

        this.dom = scene.add
            .dom(posX + padding, inputPosY, "input")
            .setOrigin(0, 0);

        const inputElement = this.dom.node;

        inputElement.className = "pixel-input";
        inputElement.type = "text";
        inputElement.maxLength = 200;
        inputElement.placeholder = "Diga algo...";
        inputElement.autocomplete = "off";
        inputElement.style.width = `${inputWidth}px`;
        inputElement.style.height = `${inputHeight}px`;
        inputElement.style.fontSize = `${scaleSize(22)}px`;

        inputElement.addEventListener("keydown", (event) => {
            event.stopPropagation();

            if (event.key === "Enter") {
                this.send(inputElement.value);
            } else if (event.key === "Escape") {
                this.close();
            }
        });

        inputElement.addEventListener("keyup", (event) => {
            event.stopPropagation();
        });

        this.dom.setVisible(false);

        this.makeButton(
            root,
            posX +
                padding +
                inputWidth +
                scaleSize(8),
            inputPosY,
            sendButtonWidth,
            inputHeight,
            "Enviar",
            () => this.send(inputElement.value),
            {
                primary: true,
                size: scaleSize(22)
            }
        );
    }

    addMessage(role, messageText) {
        const {
            scene,
            scaleSize
        } = this;

        const isNpcMessage = role === "npc";
        const messagePadding = scaleSize(10);
        const borderThickness = 4;

        const maximumBubbleWidth = Math.floor(
            this.chatArea.width * 0.86
        );

        const messageLabel = scene.add.text(
            0,
            0,
            isNpcMessage ? this.npc.name : "Você",
            {
                fontFamily: FONT_BODY,
                fontSize: `${scaleSize(20)}px`,
                color: isNpcMessage
                    ? COLORS.goldCss
                    : COLORS.player
            }
        );

        const messageBody = scene.add.text(
            0,
            0,
            messageText,
            {
                fontFamily: FONT_BODY,
                fontSize: `${scaleSize(22)}px`,
                color: COLORS.text,
                wordWrap: {
                    width:
                        maximumBubbleWidth -
                        (messagePadding + borderThickness) * 2
                },
                lineSpacing: 2
            }
        );

        const bubbleWidth = Math.min(
            maximumBubbleWidth,
            Math.max(
                messageLabel.width,
                messageBody.width
            ) +
                (messagePadding + borderThickness) * 2
        );

        const bubbleHeight =
            messageLabel.height +
            messageBody.height +
            (messagePadding + borderThickness) * 2 +
            scaleSize(2);

        const bubblePosX = isNpcMessage
            ? 0
            : this.chatArea.width - bubbleWidth;

        const bubblePosY = this.messageContentHeight;

        const bubbleGraphics = scene.add.graphics();

        bubbleGraphics
            .fillStyle(
                isNpcMessage
                    ? COLORS.bronze
                    : COLORS.playerBorder,
                1
            )
            .fillRect(
                bubblePosX,
                bubblePosY,
                bubbleWidth,
                bubbleHeight
            );

        bubbleGraphics
            .fillStyle(
                isNpcMessage
                    ? COLORS.npcBubble
                    : COLORS.playerBubble,
                1
            )
            .fillRect(
                bubblePosX + borderThickness,
                bubblePosY + borderThickness,
                bubbleWidth - borderThickness * 2,
                bubbleHeight - borderThickness * 2
            );

        messageLabel.setPosition(
            bubblePosX +
                borderThickness +
                messagePadding,
            bubblePosY +
                borderThickness +
                messagePadding
        );

        messageBody.setPosition(
            bubblePosX +
                borderThickness +
                messagePadding,
            bubblePosY +
                borderThickness +
                messagePadding +
                messageLabel.height +
                scaleSize(2)
        );

        const messageObjects = [
            bubbleGraphics,
            messageLabel,
            messageBody
        ];

        this.messageContainer.add(messageObjects);

        const totalMessageHeight =
            bubbleHeight + scaleSize(10);

        this.messageContentHeight += totalMessageHeight;

        this.scrollChat(0, true);

        return {
            objects: messageObjects,
            totalHeight: totalMessageHeight
        };
    }

    removeMessage(message) {
        message.objects.forEach((messageObject) => {
            messageObject.destroy();
        });

        this.messageContentHeight -= message.totalHeight;

        this.scrollChat(0, true);
    }

    scrollChat(scrollDelta, scrollToBottom = false) {
        const minimumScrollOffset = Math.min(
            0,
            this.chatArea.height - this.messageContentHeight
        );

        this.chatScrollOffset = scrollToBottom
            ? minimumScrollOffset
            : Phaser.Math.Clamp(
                this.chatScrollOffset + scrollDelta,
                minimumScrollOffset,
                0
            );

        this.messageContainer.y =
            this.chatArea.y + this.chatScrollOffset;
    }

    setStatus(statusText, statusColor) {
        this.statusText
            .setText(statusText)
            .setColor(statusColor);
    }

    applyState(state) {
        if (!this.built || !state) return;

        this.setGold(state.npcGold);

        state.npcStock.forEach(({ name, stock }) => {
            const item = this.npc.inventory.find((i) => i.name === name);
            if (item) item.stock = stock;
        });

        this.renderGrid();

        // Avisa o resto do jogo (HUD, cena) sobre o ouro do protagonista.
        this.scene.events.emit("player-gold-changed", state.playerGold);
    }

    async syncState() {
        try {
            const state = await fetchState(this.npc.name);
            this.applyState(state);
        } catch (error) {
            console.warn("Não foi possível sincronizar o estado:", error);
        }
    }

    async send(rawMessage) {
        const messageText = (rawMessage || "").trim();

        if (!messageText || this.isBusy) {
            return;
        }

        this.isBusy = true;

        this.dom.node.value = "";

        this.addMessage("player", messageText);

        const pendingMessage = this.addMessage(
            "npc",
            "..."
        );

        this.setStatus("Pensando...", COLORS.muted);

        try {
            const { reply, state } = await chat(messageText, this.npc.name);

            this.removeMessage(pendingMessage);
            this.addMessage("npc", reply);

            this.applyState(state);
        } catch (error) {
            console.error(error);

            this.removeMessage(pendingMessage);

            this.addMessage(
                "npc",
                "*resmunga* Algo deu errado... tente de novo."
            );
        } finally {
            this.isBusy = false;

            if (this.built) {
                this.setStatus("Online", COLORS.green);

                if (this.isOpen) {
                    this.dom.node.focus();
                }
            }
        }
    }
}

export default NpcPanel;