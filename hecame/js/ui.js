import { TILE_SIZE } from './sprites.js';
import { SCALE, CANVAS_WIDTH, CANVAS_HEIGHT } from './renderer.js';
import { MAX_INVENTORY_SLOTS, ACTIONS_PER_DAY, MAX_DAYS } from './player.js';

class UI {
    constructor(renderer) {
        this.r = renderer;
        this.tooltipItem = null;
    }

    // ---- TITLE SCREEN ----
    drawTitle() {
        this.r.clear('#0a0a0a');

        // Title
        this.r.drawText('HE IS COMING', CANVAS_WIDTH / 2, 80, '#cc3333', 48, 'center');
        this.r.drawText('A Roguelite Auto-Battler', CANVAS_WIDTH / 2, 140, '#888888', 16, 'center');

        // Decorative line
        this.r.drawRect(CANVAS_WIDTH / 2 - 120, 170, 240, 2, '#cc3333');

        // Lore
        this.r.drawText('The Demon King approaches.', CANVAS_WIDTH / 2, 195, '#aaaaaa', 14, 'center');
        this.r.drawText('You have 3 days to prepare.', CANVAS_WIDTH / 2, 215, '#aaaaaa', 14, 'center');

        // Instructions
        this.r.drawText('[ Press ENTER to begin ]', CANVAS_WIDTH / 2, 300, '#ffffff', 20, 'center');

        // Controls
        this.r.drawText('Controls:', CANVAS_WIDTH / 2, 370, '#666666', 14, 'center');
        this.r.drawText('WASD / Arrow Keys - Move', CANVAS_WIDTH / 2, 390, '#555555', 12, 'center');
        this.r.drawText('E - Interact / Pickup', CANVAS_WIDTH / 2, 406, '#555555', 12, 'center');
        this.r.drawText('I - Inventory', CANVAS_WIDTH / 2, 422, '#555555', 12, 'center');
        this.r.drawText('ESC - Close menus', CANVAS_WIDTH / 2, 438, '#555555', 12, 'center');
    }

    // ---- HUD ----
    drawHUD(player, cycle) {
        const pad = 8;

        // Top-left: Day and actions
        this.r.drawRect(0, 0, 220, 56, 'rgba(0,0,0,0.7)');
        this.r.drawText(`Day ${player.day}/${MAX_DAYS}`, pad, pad, '#ffffff', 14);
        this.r.drawText(`Actions: ${player.actionsLeft}/${ACTIONS_PER_DAY}`, pad, 26, '#aaaaaa', 12);
        this.r.drawText(`Cycle: ${cycle}`, pad, 40, '#cc8833', 12);

        // Top-right: Stats
        const statsX = CANVAS_WIDTH - 180;
        this.r.drawRect(statsX - 8, 0, 188, 72, 'rgba(0,0,0,0.7)');
        const stats = player.calculateCombatStats();
        this.r.drawText(`HP: ${stats.hp}/${stats.maxHp}`, statsX, pad, '#33cc33', 12);
        this.r.drawBar(statsX, 24, 160, 8, stats.hp, stats.maxHp, '#33cc33');
        this.r.drawText(`ATK: ${stats.atk}`, statsX, 36, '#cc6633', 12);
        this.r.drawText(`DEF: ${stats.def}`, statsX + 60, 36, '#3366cc', 12);
        this.r.drawText(`SPD: ${stats.spd}`, statsX + 120, 36, '#cccc33', 12);

        // Bottom: Quick inventory bar
        this.drawQuickBar(player);

        // Warning when days are almost over
        if (player.day === MAX_DAYS && player.actionsLeft <= 5) {
            const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
            const alpha = 0.3 + pulse * 0.7;
            this.r.drawText('HE IS COMING...', CANVAS_WIDTH / 2, 70,
                `rgba(204, 51, 51, ${alpha})`, 24, 'center');
        }
    }

    drawQuickBar(player) {
        const barY = CANVAS_HEIGHT - 44;
        const slotSize = 36;
        const totalWidth = MAX_INVENTORY_SLOTS * (slotSize + 4) + 4;
        const startX = (CANVAS_WIDTH - totalWidth) / 2;

        this.r.drawRect(startX - 4, barY - 4, totalWidth + 8, slotSize + 12, 'rgba(0,0,0,0.7)');

        for (let i = 0; i < MAX_INVENTORY_SLOTS; i++) {
            const x = startX + i * (slotSize + 4) + 4;
            const item = player.inventory[i];
            const isEquipped = item && player.isEquipped(item);

            // Slot background
            this.r.drawRect(x, barY, slotSize, slotSize, isEquipped ? '#334433' : '#1a1a1a');
            this.r.drawRect(x, barY, slotSize, slotSize, isEquipped ? '#33aa33' : '#444444', false);

            // Item sprite
            if (item) {
                this.r.drawSprite(x + 2, barY + 2, item.sprite, 2);
            }
        }
    }

    // ---- INVENTORY SCREEN ----
    drawInventory(player, invManager) {
        // Semi-transparent overlay
        this.r.drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 'rgba(0,0,0,0.85)');

        this.r.drawText('INVENTORY', CANVAS_WIDTH / 2, 20, '#ffffff', 24, 'center');

        const slotSize = 48;
        const cols = 4;
        const startX = CANVAS_WIDTH / 2 - (cols * (slotSize + 8)) / 2;
        const startY = 60;

        // Draw slots
        for (let i = 0; i < MAX_INVENTORY_SLOTS; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (slotSize + 8);
            const y = startY + row * (slotSize + 8);
            const item = player.inventory[i];
            const isEquipped = item && player.isEquipped(item);
            const isSelected = i === invManager.selectedSlot;

            // Slot bg
            let bg = '#1a1a1a';
            if (isSelected) bg = '#3a3a1a';
            else if (isEquipped) bg = '#1a3a1a';
            this.r.drawRect(x, y, slotSize, slotSize, bg);

            // Border
            let border = '#444444';
            if (isSelected) border = '#cccc33';
            else if (isEquipped) border = '#33aa33';
            this.r.drawRect(x, y, slotSize, slotSize, border, false);

            if (item) {
                this.r.drawSprite(x + 8, y + 8, item.sprite, 2);
                if (isEquipped) {
                    this.r.drawText('E', x + 2, y + 2, '#33aa33', 10);
                }
            }

            // Slot number
            this.r.drawText(`${i + 1}`, x + slotSize - 10, y + slotSize - 14, '#555555', 10);
        }

        // Item details panel
        const detailY = startY + Math.ceil(MAX_INVENTORY_SLOTS / cols) * (slotSize + 8) + 16;
        this.r.drawRect(startX - 8, detailY - 8, cols * (slotSize + 8) + 16, 180, '#111111');

        if (invManager.selectedSlot >= 0 && player.inventory[invManager.selectedSlot]) {
            const item = player.inventory[invManager.selectedSlot];
            const isEquipped = player.isEquipped(item);

            this.r.drawText(item.name, startX, detailY, '#ffffff', 16);
            this.r.drawText(`[${item.type.toUpperCase()}]`, startX, detailY + 20, '#888888', 12);
            this.r.drawText(item.description, startX, detailY + 38, '#aaaaaa', 12);

            // Stats
            let statY = detailY + 58;
            for (const [stat, val] of Object.entries(item.stats)) {
                const color = val > 0 ? '#33cc33' : '#cc3333';
                const sign = val > 0 ? '+' : '';
                this.r.drawText(`${stat.toUpperCase()}: ${sign}${val}`, startX, statY, color, 12);
                statY += 16;
            }

            // Effects
            for (const effect of item.effects) {
                let text = '';
                if (effect.type === 'burn') text = `Burn: ${effect.damage} dmg/turn`;
                else if (effect.type === 'lifesteal') text = `Lifesteal: ${Math.round(effect.percent * 100)}%`;
                else if (effect.type === 'heal_on_low') text = `Heal ${effect.amount} HP when below ${Math.round(effect.threshold * 100)}%`;
                this.r.drawText(text, startX, statY, '#cc8833', 12);
                statY += 16;
            }

            // Actions
            this.r.drawText(isEquipped ? '[CLICK] Unequip  [D] Drop' : '[CLICK] Equip  [D] Drop',
                startX, detailY + 155, '#666666', 12);
        } else {
            this.r.drawText('Select an item (click or 1-8)', startX, detailY + 8, '#555555', 14);
        }

        // Controls hint
        this.r.drawText('[I / ESC] Close Inventory', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30, '#555555', 12, 'center');
    }

    // ---- SHOP SCREEN ----
    drawShop(player, invManager) {
        this.r.drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 'rgba(0,0,0,0.85)');
        this.r.drawText('SHOP', CANVAS_WIDTH / 2, 20, '#daa520', 24, 'center');
        this.r.drawText('Take what you need.', CANVAS_WIDTH / 2, 48, '#888888', 14, 'center');

        if (!invManager.shopItems) return;

        const slotSize = 48;
        const startX = CANVAS_WIDTH / 2 - (invManager.shopItems.length * (slotSize + 16)) / 2;
        const y = 100;

        for (let i = 0; i < invManager.shopItems.length; i++) {
            const item = invManager.shopItems[i];
            const x = startX + i * (slotSize + 16);

            this.r.drawRect(x, y, slotSize, slotSize, item ? '#1a1a1a' : '#0a0a0a');
            this.r.drawRect(x, y, slotSize, slotSize, item ? '#daa520' : '#333333', false);

            if (item) {
                this.r.drawSprite(x + 8, y + 8, item.sprite, 2);
                this.r.drawText(item.name, x + slotSize / 2, y + slotSize + 4, '#ffffff', 10, 'center');
                this.r.drawText(`[${i + 1}]`, x + slotSize / 2, y + slotSize + 18, '#666666', 10, 'center');
            } else {
                this.r.drawText('TAKEN', x + slotSize / 2, y + slotSize / 2 - 5, '#555555', 10, 'center');
            }
        }

        // Show item details on hover
        if (invManager.shopHovered >= 0 && invManager.shopItems[invManager.shopHovered]) {
            const item = invManager.shopItems[invManager.shopHovered];
            const detailY = y + slotSize + 50;
            this.r.drawText(item.name, CANVAS_WIDTH / 2, detailY, '#ffffff', 16, 'center');
            this.r.drawText(item.description, CANVAS_WIDTH / 2, detailY + 22, '#aaaaaa', 12, 'center');
            let statText = Object.entries(item.stats).map(([k, v]) => `${k.toUpperCase()}: ${v > 0 ? '+' : ''}${v}`).join('  ');
            this.r.drawText(statText, CANVAS_WIDTH / 2, detailY + 40, '#33cc33', 12, 'center');
        }

        // Current inventory
        this.r.drawText(`Inventory: ${player.inventory.length}/${MAX_INVENTORY_SLOTS}`, CANVAS_WIDTH / 2, 300, '#aaaaaa', 12, 'center');

        this.r.drawText('[1-3] Take item  [ESC] Leave shop', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30, '#555555', 12, 'center');
    }

    // ---- SHRINE INTERACTION ----
    drawShrinePrompt(shrine) {
        const y = CANVAS_HEIGHT - 100;
        this.r.drawRect(CANVAS_WIDTH / 2 - 160, y, 320, 50, 'rgba(0,0,0,0.9)');
        this.r.drawRect(CANVAS_WIDTH / 2 - 160, y, 320, 50, '#5a5aaa', false);
        this.r.drawText(`Shrine of ${shrine.buffType.toUpperCase()}`, CANVAS_WIDTH / 2, y + 6, '#aaaaff', 14, 'center');
        this.r.drawText(`[E] Gain +${shrine.buffAmount} ${shrine.buffType.toUpperCase()}`, CANVAS_WIDTH / 2, y + 26, '#ffffff', 12, 'center');
    }

    // ---- COMBAT SCREEN ----
    drawCombat(combat, boss, playerSprite, turnTimer, currentTurn, flashPlayer, flashBoss) {
        this.r.clear('#0a0a0a');

        // Battle header
        this.r.drawText('BATTLE', CANVAS_WIDTH / 2, 10, '#cc3333', 28, 'center');
        this.r.drawText(boss.name, CANVAS_WIDTH / 2, 42, '#ff6633', 16, 'center');
        if (boss.mechanicDesc) {
            this.r.drawText(`Special: ${boss.mechanicDesc}`, CANVAS_WIDTH / 2, 62, '#cc8833', 12, 'center');
        }

        // Player (left side)
        const pX = 120, pY = 140;
        if (!flashPlayer || Math.floor(Date.now() / 100) % 2 === 0) {
            this.r.drawSprite(pX, pY, 'player', 4);
        }
        this.r.drawText('Hero', pX + 32, pY - 20, '#ffffff', 14, 'center');
        this.r.drawBar(pX - 16, pY + 72, 96, 12, combat.player.hp, combat.player.maxHp, '#33cc33');
        this.r.drawText(`${Math.max(0, combat.player.hp)}/${combat.player.maxHp}`,
            pX + 32, pY + 88, '#ffffff', 10, 'center');

        // Stats under player
        this.r.drawText(`ATK:${combat.player.atk} DEF:${combat.player.def} SPD:${combat.player.spd}`,
            pX + 32, pY + 104, '#888888', 10, 'center');

        // Boss (right side)
        const bX = CANVAS_WIDTH - 200, bY = 140;
        if (!flashBoss || Math.floor(Date.now() / 100) % 2 === 0) {
            this.r.drawSprite(bX, bY, boss.sprite, 4);
        }
        this.r.drawText(boss.name, bX + 32, bY - 20, '#cc3333', 14, 'center');
        this.r.drawBar(bX - 16, bY + 72, 96, 12, combat.boss.hp, combat.boss.maxHp, '#cc3333');
        this.r.drawText(`${Math.max(0, combat.boss.hp)}/${combat.boss.maxHp}`,
            bX + 32, bY + 88, '#ffffff', 10, 'center');

        this.r.drawText(`ATK:${combat.boss.atk} DEF:${combat.boss.def} SPD:${combat.boss.spd}`,
            bX + 32, bY + 104, '#888888', 10, 'center');

        // VS
        this.r.drawText('VS', CANVAS_WIDTH / 2, 180, '#cc3333', 32, 'center');

        // Combat log
        const logY = 280;
        this.r.drawRect(40, logY, CANVAS_WIDTH - 80, 170, 'rgba(20,20,20,0.9)');
        this.r.drawRect(40, logY, CANVAS_WIDTH - 80, 170, '#333333', false);
        this.r.drawText('Combat Log', CANVAS_WIDTH / 2, logY + 4, '#888888', 12, 'center');

        // Show recent log entries
        const startIdx = Math.max(0, combat.log.length - 7);
        for (let i = startIdx; i < combat.log.length; i++) {
            const entry = combat.log[i];
            let color = '#aaaaaa';
            if (entry.type === 'mechanic') color = '#cc8833';
            else if (entry.type === 'victory') color = '#33cc33';
            else if (entry.type === 'defeat') color = '#cc3333';
            else if (entry.type === 'burn') color = '#cc7722';
            else if (entry.type === 'heal') color = '#33cc33';
            else if (entry.type === 'dodge') color = '#cccc33';

            const lineY = logY + 22 + (i - startIdx) * 18;
            this.r.drawText(entry.text, 56, lineY, color, 12);
        }

        // Result
        if (combat.isFinished()) {
            const resultEntry = combat.log[combat.log.length - 1];
            if (resultEntry) {
                const color = resultEntry.type === 'victory' ? '#33cc33' : '#cc3333';
                this.r.drawText(resultEntry.text, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40, color, 20, 'center');
            }
            this.r.drawText('[ENTER] Continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 16, '#555555', 12, 'center');
        }
    }

    // ---- GAME OVER ----
    drawGameOver(cycle, bossName) {
        this.r.clear('#0a0a0a');
        this.r.drawText('GAME OVER', CANVAS_WIDTH / 2, 120, '#cc3333', 48, 'center');
        this.r.drawText(`Defeated by ${bossName}`, CANVAS_WIDTH / 2, 180, '#888888', 16, 'center');
        this.r.drawText(`Survived ${cycle - 1} cycle${cycle - 1 !== 1 ? 's' : ''}`, CANVAS_WIDTH / 2, 210, '#aaaaaa', 14, 'center');

        this.r.drawText('The Demon King claims another soul...', CANVAS_WIDTH / 2, 270, '#555555', 14, 'center');

        this.r.drawText('[ Press ENTER to try again ]', CANVAS_WIDTH / 2, 350, '#ffffff', 20, 'center');
    }

    // ---- VICTORY / CYCLE COMPLETE ----
    drawCycleComplete(cycle, bossName) {
        this.r.clear('#0a0a0a');
        this.r.drawText('VICTORY!', CANVAS_WIDTH / 2, 120, '#33cc33', 48, 'center');
        this.r.drawText(`${bossName} has been slain!`, CANVAS_WIDTH / 2, 180, '#aaaaaa', 16, 'center');
        this.r.drawText(`Cycle ${cycle} complete`, CANVAS_WIDTH / 2, 210, '#cc8833', 14, 'center');

        this.r.drawText('But something darker stirs...', CANVAS_WIDTH / 2, 270, '#cc3333', 14, 'center');

        this.r.drawText('[ Press ENTER to continue ]', CANVAS_WIDTH / 2, 350, '#ffffff', 20, 'center');
    }

    // ---- BOSS APPROACH WARNING ----
    drawBossApproach(boss) {
        this.r.clear('#0a0a0a');

        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        this.r.drawText('HE IS COMING', CANVAS_WIDTH / 2, 80,
            `rgba(204, 51, 51, ${pulse})`, 36, 'center');

        this.r.drawSprite(CANVAS_WIDTH / 2 - 48, 140, boss.sprite, 6);

        this.r.drawText(boss.name, CANVAS_WIDTH / 2, 250, '#ff6633', 20, 'center');
        this.r.drawText(boss.description, CANVAS_WIDTH / 2, 280, '#aaaaaa', 14, 'center');
        this.r.drawText(`Special: ${boss.mechanicDesc}`, CANVAS_WIDTH / 2, 305, '#cc8833', 14, 'center');

        this.r.drawText(boss.lore, CANVAS_WIDTH / 2, 350, '#555555', 12, 'center');

        this.r.drawText('[ Press ENTER to fight ]', CANVAS_WIDTH / 2, 420, '#ffffff', 20, 'center');
    }

    // ---- INTERACTION PROMPT ----
    drawInteractionPrompt(text) {
        const y = CANVAS_HEIGHT - 80;
        this.r.drawRect(CANVAS_WIDTH / 2 - 140, y, 280, 30, 'rgba(0,0,0,0.9)');
        this.r.drawRect(CANVAS_WIDTH / 2 - 140, y, 280, 30, '#555555', false);
        this.r.drawText(text, CANVAS_WIDTH / 2, y + 8, '#ffffff', 12, 'center');
    }

    // ---- FLOATING MESSAGE ----
    drawMessage(invManager) {
        if (invManager.message) {
            const y = CANVAS_HEIGHT / 2 - 20;
            this.r.drawRect(CANVAS_WIDTH / 2 - 120, y, 240, 30, 'rgba(0,0,0,0.9)');
            this.r.drawText(invManager.message, CANVAS_WIDTH / 2, y + 8, '#ffffff', 14, 'center');
        }
    }
}

export { UI };
