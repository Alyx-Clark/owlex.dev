// Auto-battle engine
// Resolves turn-by-turn combat between player and boss

class CombatEngine {
    constructor(playerStats, playerEffects, boss) {
        // Clone stats so combat doesn't mutate originals
        this.player = {
            name: 'Hero',
            hp: playerStats.hp,
            maxHp: playerStats.maxHp,
            atk: playerStats.atk,
            def: playerStats.def,
            spd: playerStats.spd,
        };
        this.boss = {
            name: boss.name,
            hp: boss.stats.hp,
            maxHp: boss.stats.maxHp,
            atk: boss.stats.atk,
            def: boss.stats.def,
            spd: boss.stats.spd,
            mechanic: boss.mechanic,
            dodgeChance: boss.dodgeChance || 0,
            absorbPercent: boss.absorbPercent || 0,
        };

        this.playerEffects = playerEffects;
        this.log = [];
        this.turns = [];
        this.turnIndex = 0;
        this.resolved = false;
        this.winner = null;

        // Track burn stacks on boss
        this.bossBurnDamage = 0;
        // Track if heal potion was used
        this.potionUsed = false;
        this.potionHealAmount = 0;

        // Apply boss mechanics at start
        this.applyStartMechanics();

        // Pre-resolve all turns
        this.resolveAllTurns();
    }

    applyStartMechanics() {
        if (this.boss.mechanic === 'atk_absorb') {
            const absorbed = Math.floor(this.player.atk * this.boss.absorbPercent);
            this.boss.atk += absorbed;
            this.log.push({
                text: `${this.boss.name} absorbs your power! (+${absorbed} ATK)`,
                type: 'mechanic',
            });
        }

        // Calculate burn damage from effects
        for (const effect of this.playerEffects) {
            if (effect.type === 'burn') {
                this.bossBurnDamage += effect.damage;
            }
        }

        // Check for heal potion
        for (const effect of this.playerEffects) {
            if (effect.type === 'heal_on_low') {
                this.potionHealAmount = effect.amount;
            }
        }
    }

    resolveAllTurns() {
        let maxTurns = 50; // Safety cap

        while (maxTurns-- > 0 && this.player.hp > 0 && this.boss.hp > 0) {
            const turn = this.resolveTurn();
            this.turns.push(turn);
        }

        if (this.player.hp > 0 && this.boss.hp <= 0) {
            this.winner = 'player';
        } else if (this.boss.hp > 0 && this.player.hp <= 0) {
            this.winner = 'boss';
        } else {
            // Timeout = boss wins
            this.winner = 'boss';
        }

        this.log.push({
            text: this.winner === 'player'
                ? `Victory! ${this.boss.name} is defeated!`
                : `Defeat... ${this.boss.name} overwhelms you.`,
            type: this.winner === 'player' ? 'victory' : 'defeat',
        });

        this.resolved = true;
    }

    resolveTurn() {
        const events = [];
        const turnNum = this.turns.length + 1;

        // Determine order by speed
        const playerFirst = this.player.spd >= this.boss.spd;
        const first = playerFirst ? 'player' : 'boss';
        const second = playerFirst ? 'boss' : 'player';

        // First attacker
        const event1 = this.resolveAttack(first);
        events.push(event1);

        // Check if target died
        if (this.player.hp <= 0 || this.boss.hp <= 0) {
            return { turnNum, events };
        }

        // Second attacker
        const event2 = this.resolveAttack(second);
        events.push(event2);

        // Check if target died
        if (this.player.hp <= 0 || this.boss.hp <= 0) {
            return { turnNum, events };
        }

        // Apply burn damage to boss
        if (this.bossBurnDamage > 0) {
            this.boss.hp -= this.bossBurnDamage;
            events.push({
                attacker: 'burn',
                text: `${this.boss.name} burns for ${this.bossBurnDamage} damage!`,
                damage: this.bossBurnDamage,
                type: 'burn',
            });
        }

        // Check potion usage
        if (!this.potionUsed && this.potionHealAmount > 0 &&
            this.player.hp / this.player.maxHp < 0.3) {
            const heal = Math.min(this.potionHealAmount, this.player.maxHp - this.player.hp);
            this.player.hp += heal;
            this.potionUsed = true;
            events.push({
                attacker: 'potion',
                text: `Health Potion activates! Healed ${heal} HP!`,
                damage: -heal,
                type: 'heal',
            });
        }

        return { turnNum, events };
    }

    resolveAttack(attacker) {
        if (attacker === 'player') {
            // Player attacks boss
            let dodged = false;
            if (this.boss.mechanic === 'dodge') {
                dodged = Math.random() < this.boss.dodgeChance;
            }

            if (dodged) {
                return {
                    attacker: 'player',
                    text: `${this.boss.name} dodges your attack!`,
                    damage: 0,
                    type: 'dodge',
                };
            }

            let damage = Math.max(1, this.player.atk - this.boss.def);
            this.boss.hp -= damage;

            // Lifesteal
            let healed = 0;
            for (const effect of this.playerEffects) {
                if (effect.type === 'lifesteal') {
                    healed = Math.floor(damage * effect.percent);
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + healed);
                }
            }

            let text = `You deal ${damage} damage to ${this.boss.name}!`;
            if (healed > 0) text += ` (Lifesteal: +${healed} HP)`;

            return { attacker: 'player', text, damage, healed, type: 'attack' };
        } else {
            // Boss attacks player
            let def = this.player.def;
            if (this.boss.mechanic === 'armor_pierce') {
                def = 0; // Ignore armor
            }
            let damage = Math.max(1, this.boss.atk - def);
            this.player.hp -= damage;

            let text = `${this.boss.name} deals ${damage} damage to you!`;
            if (this.boss.mechanic === 'armor_pierce') {
                text += ' (Ignores armor!)';
            }

            return { attacker: 'boss', text, damage, type: 'attack' };
        }
    }

    // Get the next turn to display (for animated playback)
    getNextTurn() {
        if (this.turnIndex >= this.turns.length) return null;
        return this.turns[this.turnIndex++];
    }

    peekCurrentTurn() {
        if (this.turnIndex >= this.turns.length) return null;
        return this.turns[this.turnIndex];
    }

    isFinished() {
        return this.turnIndex >= this.turns.length;
    }
}

export { CombatEngine };
