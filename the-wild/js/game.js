const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const screens = {
    start: document.getElementById("start-menu"),
    cutscene: document.getElementById("cutscene"),
    battle: document.getElementById("battle"),
    inventory: document.getElementById("inventory")
};

const ui = {
    startGame: document.getElementById("start-game"),
    resetSave: document.getElementById("reset-save"),
    speaker: document.getElementById("speaker"),
    dialogueText: document.getElementById("dialogue-text"),
    nextDialogue: document.getElementById("next-dialogue"),
    inventoryButton: document.getElementById("inventory-button"),
    closeInventory: document.getElementById("close-inventory"),
    itemList: document.getElementById("item-list"),
    animalList: document.getElementById("animal-list"),
    partnerName: document.getElementById("partner-name"),
    partnerLevel: document.getElementById("partner-level"),
    captureCount: document.getElementById("capture-count"),
    toast: document.getElementById("toast"),
    allyName: document.getElementById("ally-name"),
    allyHp: document.getElementById("ally-hp"),
    allyStats: document.getElementById("ally-stats"),
    enemyName: document.getElementById("enemy-name"),
    enemyHp: document.getElementById("enemy-hp"),
    enemyStats: document.getElementById("enemy-stats"),
    battleLog: document.getElementById("battle-log"),
    allySprite: document.getElementById("ally-sprite"),
    enemySprite: document.getElementById("enemy-sprite")
};

const TILE = 40;
const MAP_WIDTH = 24;
const MAP_HEIGHT = 16;
const SAVE_KEY = "owlex_the_wild_save_v1";

const palette = {
    outline: "#153243",
    skin: "#f1bd8d",
    hair: "#243447",
    shirt: "#1e6f4e",
    pants: "#243447",
    grass: "#7fe38c",
    grassDark: "#48b86b",
    path: "#d7bd83",
    pathDark: "#b9965e",
    water: "#68b7ef",
    waterDark: "#3f8ed0",
    ridge: "#84705d",
    ridgeDark: "#5f5146",
    fence: "#8b5e34",
    flower: "#fcdf4c"
};

const pixelSprites = {
    spriglet: [
        "00011000",
        "00133100",
        "01333310",
        "13366331",
        "13666631",
        "01366310",
        "00133100",
        "01100110"
    ],
    mossjaw: [
        "00111100",
        "01333310",
        "13344331",
        "13444431",
        "13444431",
        "01355310",
        "00111100",
        "01000010"
    ],
    pebblit: [
        "00011000",
        "00122100",
        "01222210",
        "12255221",
        "12222221",
        "01222210",
        "00122100",
        "01000010"
    ],
    flarekit: [
        "00066000",
        "00666100",
        "01666610",
        "16633561",
        "16633661",
        "01666610",
        "00166100",
        "01000010"
    ],
    riverbun: [
        "01000010",
        "01211210",
        "12222221",
        "12255221",
        "12222221",
        "01222210",
        "00122100",
        "01000010"
    ]
};

const spriteColors = {
    0: null,
    1: palette.outline,
    2: "#7dd3fc",
    3: "#86efac",
    4: "#58cc82",
    5: "#0b1c30",
    6: "#fcdf4c"
};

const cutsceneLines = [
    {
        speaker: "Ranger Mira",
        text: "There you are. The field gates just opened, and the wild animals are already restless."
    },
    {
        speaker: "You",
        text: "I brought the starter kit. Snacks, field rope, and one very nervous Spriglet."
    },
    {
        speaker: "Ranger Mira",
        text: "Good. Battle to earn trust, tame when they are weak, and keep your team healthy."
    },
    {
        speaker: "Ranger Mira",
        text: "Use the D-pad or arrow keys to move. Tap the backpack whenever you need to check your animals."
    }
];

const species = [
    {
        name: "Spriglet",
        color: "#86efac",
        sprite: "spriglet",
        trait: "Leaf",
        maxHp: 28,
        attack: 7,
        defense: 3
    },
    {
        name: "Mossjaw",
        color: "#58cc82",
        sprite: "mossjaw",
        trait: "Bite",
        maxHp: 24,
        attack: 8,
        defense: 2
    },
    {
        name: "Pebblit",
        color: "#bcc7de",
        sprite: "pebblit",
        trait: "Stone",
        maxHp: 32,
        attack: 6,
        defense: 5
    },
    {
        name: "Flarekit",
        color: "#fcdf4c",
        sprite: "flarekit",
        trait: "Spark",
        maxHp: 22,
        attack: 9,
        defense: 2
    },
    {
        name: "Riverbun",
        color: "#7dd3fc",
        sprite: "riverbun",
        trait: "Flow",
        maxHp: 26,
        attack: 7,
        defense: 4
    }
];

const terrain = [
    "~~~~~~~~~~~~~~~~~~~~~~~~",
    "~....gggg......gggg....~",
    "~..######..gg..####..g.~",
    "~..#....#......#..#....~",
    "~gg#....####...#..#..g.~",
    "~..............#..#....~",
    "~..gggg..^^^^..####.gg.~",
    "~........^^^^..........~",
    "~...####........####...~",
    "~...#..#..gggg..#..#...~",
    "~...#..#........#..#...~",
    "~...####..^^^^..####...~",
    "~gg.......^^^^.......gg~",
    "~....gggg......gggg....~",
    "~......................~",
    "~~~~~~~~~~~~~~~~~~~~~~~~"
].map(row => row.split(""));

const state = {
    mode: "menu",
    player: { x: 3, y: 13, facing: "down" },
    dialogueIndex: 0,
    steps: 0,
    inventoryOpen: false,
    items: {
        snacks: 4,
        fieldRopes: 5
    },
    animals: [],
    battle: null,
    message: "Use the D-pad or arrow keys to explore."
};

function createAnimal(template, level = 1, wild = false) {
    const maxHp = template.maxHp + level * 5;
    return {
        id: `${template.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: template.name,
        trait: template.trait,
        color: template.color,
        sprite: template.sprite,
        level,
        xp: 0,
        hp: maxHp,
        maxHp,
        attack: template.attack + level * 2,
        defense: template.defense + level,
        wild
    };
}

function newGame() {
    Object.assign(state, {
        mode: "cutscene",
        player: { x: 3, y: 13, facing: "down" },
        dialogueIndex: 0,
        steps: 0,
        items: { snacks: 4, fieldRopes: 5 },
        animals: [createAnimal(species[0], 1)],
        battle: null,
        message: "Ranger Mira waits by the field gate."
    });
    saveGame();
    showScreen("cutscene");
    renderDialogue();
    updateHud();
}

function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    try {
        const saved = JSON.parse(raw);
        state.player = saved.player || state.player;
        state.steps = saved.steps || 0;
        state.items = saved.items || state.items;
        state.animals = saved.animals?.length ? saved.animals : [createAnimal(species[0], 1)];
        state.message = "Save loaded. Keep exploring.";
        state.mode = "field";
        updateHud();
        return true;
    } catch {
        localStorage.removeItem(SAVE_KEY);
        return false;
    }
}

function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
        player: state.player,
        steps: state.steps,
        items: state.items,
        animals: state.animals
    }));
}

function showScreen(name) {
    for (const screen of Object.values(screens)) {
        screen.classList.remove("active");
    }
    if (screens[name]) screens[name].classList.add("active");
}

function renderDialogue() {
    const line = cutsceneLines[state.dialogueIndex];
    ui.speaker.textContent = line.speaker;
    ui.dialogueText.textContent = line.text;
}

function advanceDialogue() {
    state.dialogueIndex += 1;
    if (state.dialogueIndex >= cutsceneLines.length) {
        state.mode = "field";
        showScreen(null);
        toast("Expedition started. Walk through tall grass to find animals.");
        saveGame();
        return;
    }
    renderDialogue();
}

function activeAnimal() {
    return state.animals.find(animal => animal.hp > 0) || state.animals[0];
}

function updateHud() {
    const partner = activeAnimal();
    ui.partnerName.textContent = partner?.name || "None";
    ui.partnerLevel.textContent = partner?.level || 0;
    ui.captureCount.textContent = state.animals.length;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    drawPlayer();
    drawCompanion();
    drawFieldUi();
    requestAnimationFrame(draw);
}

function drawMap() {
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = terrain[y][x];
            const px = x * TILE;
            const py = y * TILE;
            drawTile(tile, px, py, x, y);
        }
    }

    drawSign(4, 12, "FIELD");
    drawSign(18, 2, "RIDGE");
    drawFence(2, 2, 4);
    drawFence(14, 3, 3);
    drawTree(7, 5);
    drawTree(20, 12);
    drawFlowerPatch(3, 10);
    drawFlowerPatch(15, 9);
}

function drawTile(tile, px, py, x, y) {
    if (tile === "~") {
        ctx.fillStyle = palette.water;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = palette.waterDark;
        const offset = (x + y) % 2 === 0 ? 8 : 18;
        ctx.fillRect(px + 6, py + offset, 12, 4);
        ctx.fillRect(px + 22, py + 28 - offset / 2, 14, 4);
    } else if (tile === "g") {
        ctx.fillStyle = palette.grass;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = palette.grassDark;
        for (let blade = 0; blade < 5; blade++) {
            const bx = px + 5 + blade * 7;
            const by = py + 12 + ((x + y + blade) % 3) * 5;
            ctx.fillRect(bx, by, 3, 16);
            ctx.fillRect(bx + 3, by + 4, 3, 10);
        }
    } else if (tile === "^") {
        ctx.fillStyle = palette.ridge;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = palette.ridgeDark;
        ctx.fillRect(px, py + 26, TILE, 14);
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(px + 5, py + 7, 18, 4);
    } else if (tile === "#") {
        ctx.fillStyle = palette.path;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = palette.pathDark;
        ctx.fillRect(px + 6 + (x % 2) * 8, py + 12, 8, 4);
        ctx.fillRect(px + 18, py + 28, 10, 4);
    } else {
        ctx.fillStyle = "#bdf2bd";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "rgba(72,184,107,0.24)";
        if ((x + y) % 4 === 0) ctx.fillRect(px + 8, py + 28, 8, 4);
        if ((x * y) % 7 === 0) ctx.fillRect(px + 26, py + 10, 6, 4);
    }

    ctx.strokeStyle = "rgba(21, 50, 67, 0.08)";
    ctx.strokeRect(px, py, TILE, TILE);
}

function drawSign(x, y, label) {
    ctx.fillStyle = "#8b5e34";
    ctx.fillRect(x * TILE + 18, y * TILE + 20, 4, 20);
    ctx.fillStyle = "#fcdf4c";
    ctx.fillRect(x * TILE + 4, y * TILE + 4, 32, 18);
    ctx.fillStyle = "#0b1c30";
    ctx.font = "7px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, x * TILE + 20, y * TILE + 16);
}

function drawFence(x, y, length) {
    ctx.fillStyle = palette.fence;
    for (let i = 0; i < length; i++) {
        const px = (x + i) * TILE;
        const py = y * TILE;
        ctx.fillRect(px + 3, py + 14, 34, 5);
        ctx.fillRect(px + 3, py + 25, 34, 5);
        ctx.fillRect(px + 8, py + 8, 6, 28);
        ctx.fillRect(px + 26, py + 8, 6, 28);
    }
}

function drawTree(x, y) {
    const px = x * TILE;
    const py = y * TILE;
    ctx.fillStyle = "#76513a";
    ctx.fillRect(px + 16, py + 18, 8, 20);
    ctx.fillStyle = "#267b47";
    ctx.fillRect(px + 8, py + 8, 24, 12);
    ctx.fillRect(px + 4, py + 16, 32, 12);
    ctx.fillRect(px + 12, py, 16, 12);
    ctx.fillStyle = "#38a85f";
    ctx.fillRect(px + 12, py + 6, 8, 6);
    ctx.fillRect(px + 22, py + 18, 8, 6);
}

function drawFlowerPatch(x, y) {
    const px = x * TILE;
    const py = y * TILE;
    for (let i = 0; i < 5; i++) {
        const fx = px + 7 + i * 6;
        const fy = py + 12 + (i % 2) * 9;
        ctx.fillStyle = palette.grassDark;
        ctx.fillRect(fx + 1, fy + 6, 2, 7);
        ctx.fillStyle = i % 2 ? "#f472b6" : palette.flower;
        ctx.fillRect(fx, fy, 4, 4);
    }
}

function drawPlayer() {
    const x = state.player.x * TILE;
    const y = state.player.y * TILE;
    drawPlayerSprite(x + 4, y + 2, state.player.facing);
}

function drawPlayerSprite(x, y, facing) {
    const sprite = [
        "0001111000",
        "0012222100",
        "0122222210",
        "0125555210",
        "0012222100",
        "0003333000",
        "0033333300",
        "0033333300",
        "0004440000",
        "0040440400",
        "0040000400",
        "0000000000"
    ];
    const colors = {
        0: null,
        1: palette.outline,
        2: palette.skin,
        3: facing === "up" ? "#236049" : palette.shirt,
        4: palette.pants,
        5: facing === "up" ? palette.hair : "#0b1c30"
    };
    drawMatrix(sprite, colors, x, y, 3);
}

function drawCompanion() {
    const partner = activeAnimal();
    if (!partner) return;
    const offsets = {
        up: [0, 1],
        down: [0, -1],
        left: [1, 0],
        right: [-1, 0]
    };
    const [ox, oy] = offsets[state.player.facing] || [1, 0];
    const x = (state.player.x + ox) * TILE + 4;
    const y = (state.player.y + oy) * TILE + 4;
    if (canMove(state.player.x + ox, state.player.y + oy)) {
        drawAnimalSpriteCanvas(partner, x, y, 4);
    }
}

function drawAnimalSpriteCanvas(animal, x, y, scale = 4) {
    drawMatrix(pixelSprites[animal.sprite] || pixelSprites.spriglet, animalSpritePalette(animal), x, y, scale);
}

function drawMatrix(matrix, colors, x, y, scale) {
    matrix.forEach((row, rowIndex) => {
        [...row].forEach((cell, colIndex) => {
            const color = colors[cell];
            if (!color) return;
            ctx.fillStyle = color;
            ctx.fillRect(x + colIndex * scale, y + rowIndex * scale, scale, scale);
        });
    });
}

function shade(hex, amount) {
    const clean = hex.replace("#", "");
    const num = parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
    const b = Math.max(0, Math.min(255, (num & 255) + amount));
    return `rgb(${r}, ${g}, ${b})`;
}

function animalSpritePalette(animal) {
    return {
        ...spriteColors,
        2: shade(animal.color, 22),
        3: animal.color,
        4: shade(animal.color, -24),
        6: animal.trait === "Spark" ? "#fcdf4c" : "#ffffff"
    };
}

function renderAnimalSpriteElement(element, animal) {
    const matrix = pixelSprites[animal.sprite] || pixelSprites.spriglet;
    const colors = animalSpritePalette(animal);
    element.replaceChildren();
    element.style.setProperty("--animal-color", animal.color);
    element.style.backgroundColor = shade(animal.color, 72);
    matrix.forEach(row => {
        [...row].forEach(cell => {
            const pixel = document.createElement("i");
            pixel.style.backgroundColor = colors[cell] || "transparent";
            element.append(pixel);
        });
    });
}

function drawFieldUi() {
    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.fillRect(16, canvas.height - 60, canvas.width - 32, 44);
    ctx.strokeStyle = "rgba(11, 28, 48, 0.16)";
    ctx.strokeRect(16, canvas.height - 60, canvas.width - 32, 44);
    ctx.fillStyle = "#0b1c30";
    ctx.font = "16px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(state.message, 32, canvas.height - 32);
}

function canMove(x, y) {
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return false;
    return terrain[y][x] !== "~" && terrain[y][x] !== "^";
}

function move(direction) {
    if (state.mode !== "field" || state.inventoryOpen) return;
    const delta = {
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0]
    }[direction];
    if (!delta) return;

    state.player.facing = direction;
    const nextX = state.player.x + delta[0];
    const nextY = state.player.y + delta[1];
    if (!canMove(nextX, nextY)) {
        state.message = "Blocked path. Try another route.";
        return;
    }

    state.player.x = nextX;
    state.player.y = nextY;
    state.steps += 1;
    state.message = "The grass rustles around you.";
    saveGame();

    if (terrain[nextY][nextX] === "g" && Math.random() < 0.28) {
        startBattle();
    }
}

function startBattle() {
    const template = species[1 + Math.floor(Math.random() * (species.length - 1))];
    const partner = activeAnimal();
    const level = Math.max(1, partner.level + Math.floor(Math.random() * 2));
    state.battle = {
        ally: partner,
        enemy: createAnimal(template, level, true),
        turnLocked: false
    };
    state.mode = "battle";
    showScreen("battle");
    ui.battleLog.textContent = `A wild ${state.battle.enemy.name} appears.`;
    updateBattleUi();
}

function updateBattleUi() {
    const { ally, enemy } = state.battle;
    ui.allyName.textContent = ally.name;
    ui.allyStats.textContent = `Lv ${ally.level} // ${ally.hp}/${ally.maxHp} HP`;
    ui.allyHp.style.width = `${Math.max(0, ally.hp / ally.maxHp * 100)}%`;
    renderAnimalSpriteElement(ui.allySprite, ally);
    ui.enemyName.textContent = enemy.name;
    ui.enemyStats.textContent = `Lv ${enemy.level} // ${enemy.hp}/${enemy.maxHp} HP`;
    ui.enemyHp.style.width = `${Math.max(0, enemy.hp / enemy.maxHp * 100)}%`;
    renderAnimalSpriteElement(ui.enemySprite, enemy);
}

function damage(attacker, defender) {
    const variance = Math.floor(Math.random() * 4);
    return Math.max(2, attacker.attack + variance - Math.floor(defender.defense / 2));
}

function battleAction(action) {
    if (state.mode !== "battle" || state.battle.turnLocked) return;
    const { ally, enemy } = state.battle;

    if (action === "attack") {
        const hit = damage(ally, enemy);
        enemy.hp = Math.max(0, enemy.hp - hit);
        ui.battleLog.textContent = `${ally.name} hits ${enemy.name} for ${hit}.`;
        if (enemy.hp <= 0) {
            winBattle(false);
            return;
        }
        enemyTurn();
    }

    if (action === "capture") {
        if (state.items.fieldRopes <= 0) {
            ui.battleLog.textContent = "No field ropes left.";
            return;
        }
        state.items.fieldRopes -= 1;
        const missingHp = 1 - enemy.hp / enemy.maxHp;
        const chance = 0.28 + missingHp * 0.55;
        if (Math.random() < chance) {
            enemy.wild = false;
            enemy.hp = Math.max(1, enemy.hp);
            state.animals.push(enemy);
            ui.battleLog.textContent = `${enemy.name} trusts you now. Captured.`;
            winBattle(true);
            return;
        }
        ui.battleLog.textContent = `${enemy.name} breaks free.`;
        enemyTurn();
    }

    if (action === "item") {
        if (state.items.snacks <= 0) {
            ui.battleLog.textContent = "No trail snacks left.";
            return;
        }
        state.items.snacks -= 1;
        const healed = Math.min(16, ally.maxHp - ally.hp);
        ally.hp += healed;
        ui.battleLog.textContent = `${ally.name} eats a snack and recovers ${healed} HP.`;
        enemyTurn();
    }

    if (action === "run") {
        if (Math.random() < 0.72) {
            endBattle("You slipped back into the field.");
            return;
        }
        ui.battleLog.textContent = "Could not get away.";
        enemyTurn();
    }

    updateBattleUi();
    updateInventory();
    updateHud();
    saveGame();
}

function enemyTurn() {
    const { ally, enemy } = state.battle;
    const hit = damage(enemy, ally);
    ally.hp = Math.max(0, ally.hp - hit);
    ui.battleLog.textContent += ` ${enemy.name} counters for ${hit}.`;
    if (ally.hp <= 0) {
        const next = activeAnimal();
        if (next && next.hp > 0) {
            state.battle.ally = next;
            ui.battleLog.textContent += ` ${next.name} steps in.`;
        } else {
            state.animals.forEach(animal => {
                animal.hp = Math.ceil(animal.maxHp * 0.55);
            });
            endBattle("Your team retreated and patched up at camp.");
        }
    }
    updateBattleUi();
}

function winBattle(captured) {
    const { ally, enemy } = state.battle;
    const xp = captured ? 8 + enemy.level * 3 : 12 + enemy.level * 4;
    ally.xp += xp;
    let levelMessage = "";
    while (ally.xp >= ally.level * 20) {
        ally.xp -= ally.level * 20;
        ally.level += 1;
        ally.maxHp += 6;
        ally.attack += 2;
        ally.defense += 1;
        ally.hp = ally.maxHp;
        levelMessage = ` ${ally.name} reached level ${ally.level}.`;
    }
    endBattle(`${ally.name} earned ${xp} XP.${levelMessage}`);
}

function endBattle(message) {
    state.message = message;
    state.battle = null;
    state.mode = "field";
    showScreen(null);
    updateHud();
    updateInventory();
    saveGame();
    toast(message);
}

function toggleInventory(open = !state.inventoryOpen) {
    state.inventoryOpen = open;
    screens.inventory.classList.toggle("active", open);
    if (open) updateInventory();
}

function updateInventory() {
    ui.itemList.innerHTML = `
        <li><strong>Trail Snacks:</strong> ${state.items.snacks}<br><span>Restore HP during battle.</span></li>
        <li><strong>Field Ropes:</strong> ${state.items.fieldRopes}<br><span>Used to tame weakened wild animals.</span></li>
    `;

    ui.animalList.innerHTML = state.animals.map((animal, index) => `
        <li>
            <strong>${index === 0 ? "Partner: " : ""}${animal.name}</strong>
            <br><span>${animal.trait} // Lv ${animal.level} // HP ${animal.hp}/${animal.maxHp} // XP ${animal.xp}/${animal.level * 20}</span>
        </li>
    `).join("");
}

let toastTimer = null;
function toast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("active");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove("active"), 2400);
}

ui.startGame.addEventListener("click", () => {
    if (loadGame()) {
        showScreen(null);
        toast("Save loaded.");
    } else {
        newGame();
    }
});

ui.resetSave.addEventListener("click", () => {
    localStorage.removeItem(SAVE_KEY);
    toast("Save cleared.");
});

ui.nextDialogue.addEventListener("click", advanceDialogue);
ui.inventoryButton.addEventListener("click", () => toggleInventory(true));
ui.closeInventory.addEventListener("click", () => toggleInventory(false));

document.querySelectorAll("[data-move]").forEach(button => {
    button.addEventListener("click", () => move(button.dataset.move));
});

document.querySelectorAll("[data-battle-action]").forEach(button => {
    button.addEventListener("click", () => battleAction(button.dataset.battleAction));
});

window.addEventListener("keydown", event => {
    const keyMap = {
        ArrowUp: "up",
        w: "up",
        W: "up",
        ArrowDown: "down",
        s: "down",
        S: "down",
        ArrowLeft: "left",
        a: "left",
        A: "left",
        ArrowRight: "right",
        d: "right",
        D: "right"
    };
    if (keyMap[event.key]) {
        event.preventDefault();
        move(keyMap[event.key]);
    }
    if (event.key === "b" || event.key === "B") toggleInventory();
    if (event.key === "Escape") toggleInventory(false);
    if (event.key === "Enter" && state.mode === "cutscene") advanceDialogue();
});

if (loadGame()) {
    showScreen("start");
} else {
    state.animals = [createAnimal(species[0], 1)];
}

updateHud();
updateInventory();
draw();
