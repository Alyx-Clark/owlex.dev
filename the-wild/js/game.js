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
        trait: "Leaf",
        maxHp: 28,
        attack: 7,
        defense: 3
    },
    {
        name: "Mossjaw",
        color: "#58cc82",
        trait: "Bite",
        maxHp: 24,
        attack: 8,
        defense: 2
    },
    {
        name: "Pebblit",
        color: "#bcc7de",
        trait: "Stone",
        maxHp: 32,
        attack: 6,
        defense: 5
    },
    {
        name: "Flarekit",
        color: "#fcdf4c",
        trait: "Spark",
        maxHp: 22,
        attack: 9,
        defense: 2
    },
    {
        name: "Riverbun",
        color: "#7dd3fc",
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
    drawFieldUi();
    requestAnimationFrame(draw);
}

function drawMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = terrain[y][x];
            const px = x * TILE;
            const py = y * TILE;
            if (tile === "~") ctx.fillStyle = "#72c4ef";
            else if (tile === "g") ctx.fillStyle = "#63d985";
            else if (tile === "^") ctx.fillStyle = "#8d7b68";
            else if (tile === "#") ctx.fillStyle = "#d8e3fb";
            else ctx.fillStyle = "#bdf2bd";
            ctx.fillRect(px, py, TILE, TILE);

            ctx.strokeStyle = "rgba(11, 28, 48, 0.06)";
            ctx.strokeRect(px, py, TILE, TILE);

            if (tile === "g") {
                ctx.fillStyle = "rgba(0, 109, 62, 0.22)";
                for (let blade = 0; blade < 4; blade++) {
                    const bx = px + 8 + blade * 8;
                    ctx.fillRect(bx, py + 16 - blade % 2 * 4, 4, 18);
                }
            }
        }
    }

    drawSign(4, 12, "FIELD");
    drawSign(18, 2, "RIDGE");
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

function drawPlayer() {
    const x = state.player.x * TILE;
    const y = state.player.y * TILE;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x + 10, y + 15, 20, 20);
    ctx.fillStyle = "#f3bf8e";
    ctx.beginPath();
    ctx.arc(x + 20, y + 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fcdf4c";
    ctx.fillRect(x + 10, y + 30, 8, 8);
    ctx.fillRect(x + 22, y + 30, 8, 8);
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
    ui.allySprite.style.background = ally.color;
    ui.enemyName.textContent = enemy.name;
    ui.enemyStats.textContent = `Lv ${enemy.level} // ${enemy.hp}/${enemy.maxHp} HP`;
    ui.enemyHp.style.width = `${Math.max(0, enemy.hp / enemy.maxHp * 100)}%`;
    ui.enemySprite.style.background = enemy.color;
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
