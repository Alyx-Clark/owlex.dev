import { ITEM_TYPE, createItem } from './items.js';

const BASE_STATS = {
    hp: 50,
    maxHp: 50,
    atk: 3,
    def: 1,
    spd: 5,
};

const MAX_INVENTORY_SLOTS = 8;
const ACTIONS_PER_DAY = 20;
const MAX_DAYS = 3;

class Player {
    constructor(spawnX, spawnY) {
        this.x = spawnX;
        this.y = spawnY;
        this.baseStats = { ...BASE_STATS };
        this.inventory = []; // Array of item instances
        this.equipped = {
            weapon: null,
            armor: null,
            offhand: null,
            trinket1: null,
            trinket2: null,
        };

        this.day = 1;
        this.actionsLeft = ACTIONS_PER_DAY;
        this.totalActions = ACTIONS_PER_DAY;

        // Temporary buffs from shrines
        this.tempBuffs = { atk: 0, def: 0, spd: 0, hp: 0 };

        // Combat stats (calculated before each fight)
        this.combatStats = null;
    }

    move(dx, dy, map) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        if (!map.isPassable(newX, newY)) return false;
        if (this.actionsLeft <= 0) return false;

        this.x = newX;
        this.y = newY;
        this.actionsLeft--;

        // Check if day ends
        if (this.actionsLeft <= 0 && this.day < MAX_DAYS) {
            this.day++;
            this.actionsLeft = ACTIONS_PER_DAY;
        }

        return true;
    }

    isDaysOver() {
        return this.day >= MAX_DAYS && this.actionsLeft <= 0;
    }

    canPickup() {
        return this.inventory.length < MAX_INVENTORY_SLOTS;
    }

    addItem(item) {
        if (this.inventory.length >= MAX_INVENTORY_SLOTS) return false;
        this.inventory.push(item);
        return true;
    }

    removeItem(index) {
        if (index < 0 || index >= this.inventory.length) return null;
        // Unequip if equipped
        for (const slot of Object.keys(this.equipped)) {
            if (this.equipped[slot] === this.inventory[index]) {
                this.equipped[slot] = null;
            }
        }
        return this.inventory.splice(index, 1)[0];
    }

    equipItem(index) {
        const item = this.inventory[index];
        if (!item) return false;

        let slot = null;
        switch (item.type) {
            case ITEM_TYPE.WEAPON: slot = 'weapon'; break;
            case ITEM_TYPE.ARMOR: slot = 'armor'; break;
            case ITEM_TYPE.OFFHAND: slot = 'offhand'; break;
            case ITEM_TYPE.TRINKET:
                // Use first available trinket slot
                slot = this.equipped.trinket1 === null ? 'trinket1' :
                       this.equipped.trinket2 === null ? 'trinket2' :
                       'trinket1'; // Replace first
                break;
            case ITEM_TYPE.CONSUMABLE:
                // Consumables don't equip, they're auto-used in combat
                return false;
        }

        if (!slot) return false;

        // Unequip current item in that slot (stays in inventory)
        this.equipped[slot] = item;
        return true;
    }

    unequipItem(slot) {
        if (!this.equipped[slot]) return false;
        this.equipped[slot] = null;
        return true;
    }

    isEquipped(item) {
        return Object.values(this.equipped).includes(item);
    }

    getEquipSlot(item) {
        for (const [slot, eq] of Object.entries(this.equipped)) {
            if (eq === item) return slot;
        }
        return null;
    }

    // Calculate total stats from base + equipment + buffs
    calculateCombatStats() {
        const stats = {
            hp: this.baseStats.maxHp,
            maxHp: this.baseStats.maxHp,
            atk: this.baseStats.atk,
            def: this.baseStats.def,
            spd: this.baseStats.spd,
        };

        // Add equipment stats
        for (const item of Object.values(this.equipped)) {
            if (!item) continue;
            for (const [stat, value] of Object.entries(item.stats)) {
                if (stat in stats) stats[stat] += value;
            }
        }

        // Add HP from items to maxHp too
        stats.maxHp = stats.hp;

        // Add shrine buffs
        stats.atk += this.tempBuffs.atk;
        stats.def += this.tempBuffs.def;
        stats.spd += this.tempBuffs.spd;
        stats.hp += this.tempBuffs.hp;
        stats.maxHp += this.tempBuffs.hp;

        // Minimums
        stats.atk = Math.max(1, stats.atk);
        stats.def = Math.max(0, stats.def);
        stats.spd = Math.max(1, stats.spd);
        stats.hp = Math.max(1, stats.hp);
        stats.maxHp = Math.max(1, stats.maxHp);

        this.combatStats = stats;
        return stats;
    }

    // Collect all active effects from equipped items + consumables in inventory
    getActiveEffects() {
        const effects = [];
        for (const item of Object.values(this.equipped)) {
            if (!item) continue;
            effects.push(...item.effects);
        }
        // Also include consumables in inventory (auto-used)
        for (const item of this.inventory) {
            if (item.type === ITEM_TYPE.CONSUMABLE) {
                effects.push(...item.effects);
            }
        }
        return effects;
    }

    // Remove consumed items after combat
    removeConsumedItems() {
        this.inventory = this.inventory.filter(item => {
            if (item.type === ITEM_TYPE.CONSUMABLE && item._consumed) return false;
            return true;
        });
    }

    reset(spawnX, spawnY) {
        this.x = spawnX;
        this.y = spawnY;
        this.baseStats = { ...BASE_STATS };
        this.inventory = [];
        this.equipped = { weapon: null, armor: null, offhand: null, trinket1: null, trinket2: null };
        this.day = 1;
        this.actionsLeft = ACTIONS_PER_DAY;
        this.tempBuffs = { atk: 0, def: 0, spd: 0, hp: 0 };
        this.combatStats = null;
    }
}

export { Player, ACTIONS_PER_DAY, MAX_DAYS, MAX_INVENTORY_SLOTS };
