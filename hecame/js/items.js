// Item type constants
const ITEM_TYPE = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    OFFHAND: 'offhand',
    TRINKET: 'trinket',
    CONSUMABLE: 'consumable',
};

// All item definitions
const ITEMS = {
    iron_sword: {
        id: 'iron_sword',
        name: 'Iron Sword',
        type: ITEM_TYPE.WEAPON,
        sprite: 'item_iron_sword',
        description: 'A sturdy iron blade.',
        stats: { atk: 5 },
        effects: [],
    },
    steel_axe: {
        id: 'steel_axe',
        name: 'Steel Axe',
        type: ITEM_TYPE.WEAPON,
        sprite: 'item_steel_axe',
        description: 'Heavy but devastating.',
        stats: { atk: 8, spd: -2 },
        effects: [],
    },
    leather_armor: {
        id: 'leather_armor',
        name: 'Leather Armor',
        type: ITEM_TYPE.ARMOR,
        sprite: 'item_leather_armor',
        description: 'Basic protection.',
        stats: { def: 3 },
        effects: [],
    },
    chain_mail: {
        id: 'chain_mail',
        name: 'Chain Mail',
        type: ITEM_TYPE.ARMOR,
        sprite: 'item_chain_mail',
        description: 'Heavy linked armor.',
        stats: { def: 6, spd: -1 },
        effects: [],
    },
    health_potion: {
        id: 'health_potion',
        name: 'Health Potion',
        type: ITEM_TYPE.CONSUMABLE,
        sprite: 'item_health_potion',
        description: 'Restores 20 HP in combat when below 30% HP.',
        stats: {},
        effects: [{ type: 'heal_on_low', threshold: 0.3, amount: 20 }],
    },
    speed_ring: {
        id: 'speed_ring',
        name: 'Speed Ring',
        type: ITEM_TYPE.TRINKET,
        sprite: 'item_speed_ring',
        description: 'Enhances reflexes.',
        stats: { spd: 3 },
        effects: [],
    },
    wooden_shield: {
        id: 'wooden_shield',
        name: 'Wooden Shield',
        type: ITEM_TYPE.OFFHAND,
        sprite: 'item_wooden_shield',
        description: 'Sturdy wooden shield.',
        stats: { def: 4, hp: 10 },
        effects: [],
    },
    amulet: {
        id: 'amulet',
        name: 'Amulet of Power',
        type: ITEM_TYPE.TRINKET,
        sprite: 'item_amulet',
        description: 'Radiates arcane energy.',
        stats: { atk: 3, spd: 1 },
        effects: [],
    },
    vampire_fang: {
        id: 'vampire_fang',
        name: 'Vampire Fang',
        type: ITEM_TYPE.TRINKET,
        sprite: 'item_vampire_fang',
        description: 'Drains life from foes.',
        stats: {},
        effects: [{ type: 'lifesteal', percent: 0.10 }],
    },
    fire_staff: {
        id: 'fire_staff',
        name: 'Fire Staff',
        type: ITEM_TYPE.WEAPON,
        sprite: 'item_fire_staff',
        description: 'Sets enemies ablaze.',
        stats: { atk: 4 },
        effects: [{ type: 'burn', damage: 3 }],
    },
};

// Get a random item id
function getRandomItemId() {
    const ids = Object.keys(ITEMS);
    return ids[Math.floor(Math.random() * ids.length)];
}

// Create an item instance (copy of definition)
function createItem(itemId) {
    const def = ITEMS[itemId];
    if (!def) return null;
    return { ...def, stats: { ...def.stats }, effects: [...def.effects] };
}

export { ITEMS, ITEM_TYPE, getRandomItemId, createItem };
