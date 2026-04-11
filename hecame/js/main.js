import { Renderer } from './renderer.js';
import { GameMap } from './map.js';
import { Player } from './player.js';
import { InventoryManager } from './inventory.js';
import { CombatEngine } from './combat.js';
import { getRandomBoss } from './bosses.js';
import { createItem } from './items.js';
import { UI } from './ui.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SCALE } from './renderer.js';
import { TILE_SIZE } from './sprites.js';

// Game states
const STATE = {
    TITLE: 'title',
    EXPLORE: 'explore',
    INVENTORY: 'inventory',
    SHOP: 'shop',
    BOSS_APPROACH: 'boss_approach',
    COMBAT: 'combat',
    CYCLE_COMPLETE: 'cycle_complete',
    GAME_OVER: 'game_over',
};

class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.renderer = new Renderer(this.canvas);
        this.ui = new UI(this.renderer);

        this.state = STATE.TITLE;
        this.map = null;
        this.player = null;
        this.invManager = null;
        this.combat = null;
        this.currentBoss = null;
        this.cycle = 1;

        // Combat animation state
        this.combatTurnTimer = 0;
        this.combatTurnDelay = 1200; // ms between turns
        this.combatCurrentTurn = null;
        this.flashPlayer = false;
        this.flashBoss = false;
        this.flashTimer = 0;
        this.combatStarted = false;

        // Input
        this.keys = {};
        this.keyJustPressed = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseClicked = false;

        this.setupInput();

        // Timing
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.key]) {
                this.keyJustPressed[e.key] = true;
            }
            this.keys[e.key] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
            this.mouseY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
        });
        this.canvas.addEventListener('click', (e) => {
            this.mouseClicked = true;
        });
    }

    startNewGame() {
        this.map = new GameMap();
        const spawn = this.map.getSpawnPoint();
        this.player = new Player(spawn.x, spawn.y);
        this.invManager = new InventoryManager(this.player);
        this.cycle = 1;
        this.state = STATE.EXPLORE;
    }

    startNewCycle() {
        this.map = new GameMap();
        const spawn = this.map.getSpawnPoint();
        this.player.x = spawn.x;
        this.player.y = spawn.y;
        this.player.day = 1;
        this.player.actionsLeft = 20;
        this.player.tempBuffs = { atk: 0, def: 0, spd: 0, hp: 0 };
        this.player.removeConsumedItems();
        this.cycle++;
        this.state = STATE.EXPLORE;
    }

    loop(now) {
        const dt = now - this.lastTime;
        this.lastTime = now;

        this.update(dt);
        this.render();

        // Clear per-frame input
        this.keyJustPressed = {};
        this.mouseClicked = false;

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.renderer.updateShake(dt);

        switch (this.state) {
            case STATE.TITLE:
                this.updateTitle();
                break;
            case STATE.EXPLORE:
                this.updateExplore(dt);
                break;
            case STATE.INVENTORY:
                this.updateInventory();
                break;
            case STATE.SHOP:
                this.updateShop();
                break;
            case STATE.BOSS_APPROACH:
                this.updateBossApproach();
                break;
            case STATE.COMBAT:
                this.updateCombat(dt);
                break;
            case STATE.CYCLE_COMPLETE:
                this.updateCycleComplete();
                break;
            case STATE.GAME_OVER:
                this.updateGameOver();
                break;
        }
    }

    render() {
        switch (this.state) {
            case STATE.TITLE:
                this.ui.drawTitle();
                break;
            case STATE.EXPLORE:
                this.renderExplore();
                break;
            case STATE.INVENTORY:
                this.renderExplore();
                this.ui.drawInventory(this.player, this.invManager);
                this.ui.drawMessage(this.invManager);
                break;
            case STATE.SHOP:
                this.ui.drawShop(this.player, this.invManager);
                this.ui.drawMessage(this.invManager);
                break;
            case STATE.BOSS_APPROACH:
                this.ui.drawBossApproach(this.currentBoss);
                break;
            case STATE.COMBAT:
                if (this.combat) {
                    this.ui.drawCombat(this.combat, this.currentBoss, 'player',
                        this.combatTurnTimer, this.combatCurrentTurn,
                        this.flashPlayer, this.flashBoss);
                }
                break;
            case STATE.CYCLE_COMPLETE:
                this.ui.drawCycleComplete(this.cycle, this.currentBoss.name);
                break;
            case STATE.GAME_OVER:
                this.ui.drawGameOver(this.cycle, this.currentBoss.name);
                break;
        }
    }

    // ---- TITLE ----
    updateTitle() {
        if (this.keyJustPressed['Enter']) {
            this.startNewGame();
        }
    }

    // ---- EXPLORE ----
    updateExplore(dt) {
        if (this.invManager) this.invManager.update(dt);

        // Movement
        let dx = 0, dy = 0;
        if (this.keyJustPressed['ArrowUp'] || this.keyJustPressed['w'] || this.keyJustPressed['W']) dy = -1;
        if (this.keyJustPressed['ArrowDown'] || this.keyJustPressed['s'] || this.keyJustPressed['S']) dy = 1;
        if (this.keyJustPressed['ArrowLeft'] || this.keyJustPressed['a'] || this.keyJustPressed['A']) dx = -1;
        if (this.keyJustPressed['ArrowRight'] || this.keyJustPressed['d'] || this.keyJustPressed['D']) dx = 1;

        if (dx !== 0 || dy !== 0) {
            const moved = this.player.move(dx, dy, this.map);
            if (moved) {
                // Check for auto-interactions on the new tile
                this.checkTileInteraction();
            }
        }

        // Interact key
        if (this.keyJustPressed['e'] || this.keyJustPressed['E']) {
            this.interact();
        }

        // Open inventory
        if (this.keyJustPressed['i'] || this.keyJustPressed['I']) {
            this.state = STATE.INVENTORY;
            this.invManager.selectedSlot = -1;
        }

        // Check if days are over -> boss time
        if (this.player.isDaysOver()) {
            this.currentBoss = getRandomBoss(this.cycle);
            this.state = STATE.BOSS_APPROACH;
        }
    }

    checkTileInteraction() {
        const tile = this.map.getTile(this.player.x, this.player.y);
        if (!tile.poi) return;

        // Auto-pickup chests
        if (tile.poi.type === 'chest' && !tile.poi.looted) {
            // Show prompt instead of auto-pickup
        }
    }

    interact() {
        const tile = this.map.getTile(this.player.x, this.player.y);
        if (!tile.poi) return;

        const poi = tile.poi;

        if (poi.type === 'chest' && !poi.looted) {
            const item = createItem(poi.itemId);
            if (item && this.player.canPickup()) {
                this.player.addItem(item);
                poi.looted = true;
                this.invManager.showMessage(`Found: ${item.name}!`);
            } else if (!this.player.canPickup()) {
                this.invManager.showMessage('Inventory full!');
            }
        } else if (poi.type === 'shrine' && !poi.used) {
            this.player.tempBuffs[poi.buffType] += poi.buffAmount;
            poi.used = true;
            this.invManager.showMessage(`+${poi.buffAmount} ${poi.buffType.toUpperCase()}!`);
        } else if (poi.type === 'shop') {
            this.invManager.openShop(poi);
            this.state = STATE.SHOP;
        }
    }

    renderExplore() {
        this.renderer.clear('#0a0a0a');
        this.renderer.centerCamera(this.player.x, this.player.y);
        this.renderer.drawMap(this.map);
        this.renderer.drawEntity(this.player.x, this.player.y, 'player');
        this.ui.drawHUD(this.player, this.cycle);

        // Interaction prompts
        const tile = this.map.getTile(this.player.x, this.player.y);
        if (tile.poi) {
            if (tile.poi.type === 'chest' && !tile.poi.looted) {
                this.ui.drawInteractionPrompt('[E] Open chest');
            } else if (tile.poi.type === 'shrine' && !tile.poi.used) {
                this.ui.drawShrinePrompt(tile.poi);
            } else if (tile.poi.type === 'shop') {
                this.ui.drawInteractionPrompt('[E] Enter shop');
            }
        }

        this.ui.drawMessage(this.invManager);
    }

    // ---- INVENTORY ----
    updateInventory() {
        this.invManager.update(0);

        if (this.keyJustPressed['i'] || this.keyJustPressed['I'] || this.keyJustPressed['Escape']) {
            this.state = STATE.EXPLORE;
            return;
        }

        // Number keys to select slots
        for (let i = 1; i <= 8; i++) {
            if (this.keyJustPressed[`${i}`]) {
                this.invManager.clickSlot(i - 1);
            }
        }

        // Drop
        if (this.keyJustPressed['d'] || this.keyJustPressed['D']) {
            this.invManager.dropSelected();
        }

        // Mouse click on slots
        if (this.mouseClicked) {
            const slotSize = 48;
            const cols = 4;
            const startX = CANVAS_WIDTH / 2 - (cols * (slotSize + 8)) / 2;
            const startY = 60;

            for (let i = 0; i < 8; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = startX + col * (slotSize + 8);
                const y = startY + row * (slotSize + 8);

                if (this.mouseX >= x && this.mouseX <= x + slotSize &&
                    this.mouseY >= y && this.mouseY <= y + slotSize) {
                    this.invManager.clickSlot(i);
                    break;
                }
            }
        }
    }

    // ---- SHOP ----
    updateShop() {
        this.invManager.update(0);

        if (this.keyJustPressed['Escape']) {
            this.invManager.closeShop();
            this.state = STATE.EXPLORE;
            return;
        }

        // Number keys to take items
        for (let i = 1; i <= 3; i++) {
            if (this.keyJustPressed[`${i}`]) {
                this.invManager.takeShopItem(i - 1);
            }
        }
    }

    // ---- BOSS APPROACH ----
    updateBossApproach() {
        if (this.keyJustPressed['Enter']) {
            this.startCombat();
        }
    }

    // ---- COMBAT ----
    startCombat() {
        const playerStats = this.player.calculateCombatStats();
        const playerEffects = this.player.getActiveEffects();
        this.combat = new CombatEngine(playerStats, playerEffects, this.currentBoss);
        this.combatTurnTimer = 0;
        this.combatCurrentTurn = null;
        this.flashPlayer = false;
        this.flashBoss = false;
        this.combatStarted = false;
        this.state = STATE.COMBAT;
    }

    updateCombat(dt) {
        // Initial delay before first turn
        if (!this.combatStarted) {
            this.combatTurnTimer += dt;
            if (this.combatTurnTimer >= 800) {
                this.combatStarted = true;
                this.combatTurnTimer = 0;
            }
            return;
        }

        // Flash timer
        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
            if (this.flashTimer <= 0) {
                this.flashPlayer = false;
                this.flashBoss = false;
            }
        }

        // Progress through turns
        this.combatTurnTimer += dt;
        if (this.combatTurnTimer >= this.combatTurnDelay && !this.combat.isFinished()) {
            this.combatTurnTimer = 0;
            const turn = this.combat.getNextTurn();
            if (turn) {
                this.combatCurrentTurn = turn;
                // Add turn events to combat log
                for (const event of turn.events) {
                    this.combat.log.push(event);

                    // Flash effects
                    if (event.type === 'attack') {
                        if (event.attacker === 'player') {
                            this.flashBoss = true;
                            this.renderer.shake(3, 200);
                        } else {
                            this.flashPlayer = true;
                            this.renderer.shake(4, 200);
                        }
                        this.flashTimer = 300;
                    }
                }
            }
        }

        // After all turns played, wait for Enter
        if (this.combat.isFinished() && this.keyJustPressed['Enter']) {
            if (this.combat.winner === 'player') {
                this.state = STATE.CYCLE_COMPLETE;
            } else {
                this.state = STATE.GAME_OVER;
            }
        }
    }

    // ---- CYCLE COMPLETE ----
    updateCycleComplete() {
        if (this.keyJustPressed['Enter']) {
            this.startNewCycle();
        }
    }

    // ---- GAME OVER ----
    updateGameOver() {
        if (this.keyJustPressed['Enter']) {
            this.state = STATE.TITLE;
        }
    }
}

// Start the game
const game = new Game();
