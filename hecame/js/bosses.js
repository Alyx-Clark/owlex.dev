const BOSSES = [
    {
        id: 'grizzly',
        name: 'Razorclaw Grizzly',
        sprite: 'boss_grizzly',
        description: 'Its claws rend through any armor.',
        stats: { hp: 60, maxHp: 60, atk: 12, def: 3, spd: 4 },
        mechanic: 'armor_pierce', // Attacks ignore player DEF
        mechanicDesc: 'Ignores Armor',
        lore: 'A corrupted beast driven mad by the Demon King\'s approach.',
    },
    {
        id: 'wraith',
        name: 'Shadow Wraith',
        sprite: 'boss_wraith',
        description: 'A phantom that slips between strikes.',
        stats: { hp: 45, maxHp: 45, atk: 8, def: 2, spd: 10 },
        mechanic: 'dodge', // 40% chance to dodge attacks
        dodgeChance: 0.4,
        mechanicDesc: '40% Dodge',
        lore: 'Born from the shadows of those who fell before the coming.',
    },
    {
        id: 'knight',
        name: 'Black Knight',
        sprite: 'boss_knight',
        description: 'Absorbs your strength to fuel its own.',
        stats: { hp: 80, maxHp: 80, atk: 6, def: 5, spd: 3 },
        mechanic: 'atk_absorb', // Gains 50% of player's ATK
        absorbPercent: 0.5,
        mechanicDesc: 'Absorbs 50% ATK',
        lore: 'A fallen champion who now serves the darkness.',
    },
];

function getBoss(cycleNumber) {
    // Cycle through bosses, scaling up each cycle
    const bossIndex = (cycleNumber - 1) % BOSSES.length;
    const boss = BOSSES[bossIndex];

    // Scale stats with cycle number
    const scale = 1 + (cycleNumber - 1) * 0.25;
    return {
        ...boss,
        stats: {
            hp: Math.floor(boss.stats.hp * scale),
            maxHp: Math.floor(boss.stats.maxHp * scale),
            atk: Math.floor(boss.stats.atk * scale),
            def: Math.floor(boss.stats.def * scale),
            spd: Math.floor(boss.stats.spd * scale),
        },
    };
}

function getRandomBoss(cycleNumber) {
    const bossIndex = Math.floor(Math.random() * BOSSES.length);
    const boss = BOSSES[bossIndex];
    const scale = 1 + (cycleNumber - 1) * 0.25;
    return {
        ...boss,
        stats: {
            hp: Math.floor(boss.stats.hp * scale),
            maxHp: Math.floor(boss.stats.maxHp * scale),
            atk: Math.floor(boss.stats.atk * scale),
            def: Math.floor(boss.stats.def * scale),
            spd: Math.floor(boss.stats.spd * scale),
        },
    };
}

export { BOSSES, getBoss, getRandomBoss };
