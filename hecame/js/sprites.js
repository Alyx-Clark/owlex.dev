// 16x16 pixel art sprites defined as 2D arrays of hex color values
// null = transparent

const TILE_SIZE = 16;

// Color palette
const C = {
    // Terrain
    GRASS1: '#2d5a1e',
    GRASS2: '#3a6b2a',
    FOREST_DARK: '#1a3d12',
    FOREST_TRUNK: '#5a3a1a',
    FOREST_LEAF: '#2a5a18',
    MOUNTAIN: '#6b6b6b',
    MOUNTAIN_SNOW: '#dcdcdc',
    MOUNTAIN_DARK: '#4a4a4a',
    WATER1: '#1a4a8a',
    WATER2: '#2a5a9a',
    PATH: '#8a7a5a',
    PATH_DARK: '#6a5a3a',

    // Player
    SKIN: '#e8b888',
    HAIR: '#4a3020',
    SHIRT: '#3a5a9a',
    PANTS: '#2a3a5a',
    BOOTS: '#3a2a1a',
    CAPE: '#8a2a2a',

    // Items
    IRON: '#aaaaaa',
    STEEL: '#cccccc',
    LEATHER: '#8a6a3a',
    GOLD: '#daa520',
    RED: '#cc3333',
    BLUE: '#3355cc',
    GREEN: '#33aa33',
    PURPLE: '#8833aa',
    ORANGE: '#cc7722',
    WOOD: '#6a4a2a',

    // Bosses
    BEAR_FUR: '#5a3a1a',
    BEAR_DARK: '#3a2a10',
    BEAR_CLAW: '#cccccc',
    WRAITH: '#3a3a5a',
    WRAITH_GLOW: '#6a5aaa',
    WRAITH_EYE: '#aa33aa',
    KNIGHT_ARMOR: '#2a2a2a',
    KNIGHT_DARK: '#1a1a1a',
    KNIGHT_VISOR: '#cc3333',

    // UI
    CHEST_WOOD: '#7a5a2a',
    CHEST_METAL: '#aaaaaa',
    SHRINE: '#5a5aaa',
    SHRINE_GLOW: '#aaaaff',
    SHOP: '#aa8a3a',
};

// Sprite cache
const spriteCache = new Map();
const spriteCanvas = document.createElement('canvas');
const spriteCtx = spriteCanvas.getContext('2d');

function createSprite(pixelData) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < pixelData.length; y++) {
        for (let x = 0; x < pixelData[y].length; x++) {
            const color = pixelData[y][x];
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    return canvas;
}

function getSprite(name) {
    if (spriteCache.has(name)) return spriteCache.get(name);
    const data = SPRITE_DATA[name];
    if (!data) return null;
    const sprite = createSprite(data);
    spriteCache.set(name, sprite);
    return sprite;
}

// Helper to fill a 16x16 grid
function fill(color) {
    return Array(16).fill(null).map(() => Array(16).fill(color));
}

// Helper: draw into a base grid
function stamp(base, pixels) {
    for (const [x, y, color] of pixels) {
        if (y >= 0 && y < 16 && x >= 0 && x < 16) {
            base[y][x] = color;
        }
    }
    return base;
}

// ---- TERRAIN SPRITES ----

const SPRITE_DATA = {};

// Grass tile
SPRITE_DATA.grass = (() => {
    const g = fill(C.GRASS1);
    // Scatter lighter patches
    const spots = [[2,3],[5,7],[9,2],[12,10],[7,13],[14,5],[1,11],[10,7],[4,1],[13,14]];
    for (const [x, y] of spots) g[y][x] = C.GRASS2;
    return g;
})();

// Forest tile
SPRITE_DATA.forest = (() => {
    const g = fill(C.FOREST_DARK);
    // Tree trunk
    for (let y = 10; y < 16; y++) { g[y][7] = C.FOREST_TRUNK; g[y][8] = C.FOREST_TRUNK; }
    // Canopy (circle-ish)
    const leafPixels = [];
    for (let y = 2; y < 11; y++) {
        for (let x = 3; x < 13; x++) {
            const dx = x - 7.5, dy = y - 6;
            if (dx * dx + dy * dy < 20) leafPixels.push([x, y, C.FOREST_LEAF]);
        }
    }
    stamp(g, leafPixels);
    return g;
})();

// Mountain tile
SPRITE_DATA.mountain = (() => {
    const g = fill(C.MOUNTAIN_DARK);
    // Triangle mountain shape
    for (let y = 0; y < 16; y++) {
        const halfWidth = Math.floor((y / 15) * 7);
        for (let x = 8 - halfWidth; x <= 7 + halfWidth; x++) {
            if (x >= 0 && x < 16) {
                g[y][x] = y < 4 ? C.MOUNTAIN_SNOW : C.MOUNTAIN;
            }
        }
    }
    return g;
})();

// Water tile
SPRITE_DATA.water = (() => {
    const g = fill(C.WATER1);
    // Wave pattern
    for (let x = 0; x < 16; x++) {
        const wy = Math.floor(Math.sin(x * 0.8) * 1.5 + 5);
        if (wy >= 0 && wy < 16) g[wy][x] = C.WATER2;
        const wy2 = Math.floor(Math.sin(x * 0.8 + 2) * 1.5 + 11);
        if (wy2 >= 0 && wy2 < 16) g[wy2][x] = C.WATER2;
    }
    return g;
})();

// Path tile
SPRITE_DATA.path = (() => {
    const g = fill(C.PATH);
    const spots = [[3,2],[7,8],[11,4],[2,12],[14,9],[5,14],[9,1],[1,6]];
    for (const [x, y] of spots) g[y][x] = C.PATH_DARK;
    return g;
})();

// ---- PLAYER SPRITE ----
SPRITE_DATA.player = (() => {
    const g = fill(null);
    // Hair
    stamp(g, [[6,1,C.HAIR],[7,1,C.HAIR],[8,1,C.HAIR],[9,1,C.HAIR],
              [5,2,C.HAIR],[6,2,C.HAIR],[7,2,C.HAIR],[8,2,C.HAIR],[9,2,C.HAIR],[10,2,C.HAIR]]);
    // Face
    stamp(g, [[6,3,C.SKIN],[7,3,C.SKIN],[8,3,C.SKIN],[9,3,C.SKIN],
              [6,4,C.SKIN],[7,4,'#2a2a2a'],[8,4,C.SKIN],[9,4,'#2a2a2a'],
              [6,5,C.SKIN],[7,5,C.SKIN],[8,5,C.SKIN],[9,5,C.SKIN]]);
    // Cape
    stamp(g, [[4,6,C.CAPE],[5,6,C.CAPE],[10,6,C.CAPE],[11,6,C.CAPE],
              [4,7,C.CAPE],[5,7,C.CAPE],[10,7,C.CAPE],[11,7,C.CAPE],
              [4,8,C.CAPE],[11,8,C.CAPE]]);
    // Shirt/body
    stamp(g, [[6,6,C.SHIRT],[7,6,C.SHIRT],[8,6,C.SHIRT],[9,6,C.SHIRT],
              [6,7,C.SHIRT],[7,7,C.SHIRT],[8,7,C.SHIRT],[9,7,C.SHIRT],
              [6,8,C.SHIRT],[7,8,C.SHIRT],[8,8,C.SHIRT],[9,8,C.SHIRT],
              [5,9,C.SKIN],[6,9,C.SHIRT],[7,9,C.SHIRT],[8,9,C.SHIRT],[9,9,C.SHIRT],[10,9,C.SKIN]]);
    // Pants
    stamp(g, [[6,10,C.PANTS],[7,10,C.PANTS],[8,10,C.PANTS],[9,10,C.PANTS],
              [6,11,C.PANTS],[7,11,C.PANTS],[8,11,C.PANTS],[9,11,C.PANTS],
              [6,12,C.PANTS],[7,12,C.PANTS],[8,12,C.PANTS],[9,12,C.PANTS]]);
    // Boots
    stamp(g, [[5,13,C.BOOTS],[6,13,C.BOOTS],[7,13,C.BOOTS],[8,13,C.BOOTS],[9,13,C.BOOTS],[10,13,C.BOOTS],
              [5,14,C.BOOTS],[6,14,C.BOOTS],[9,14,C.BOOTS],[10,14,C.BOOTS]]);
    return g;
})();

// ---- POI SPRITES ----

// Chest
SPRITE_DATA.chest = (() => {
    const g = fill(null);
    // Chest body
    for (let y = 6; y < 14; y++) {
        for (let x = 3; x < 13; x++) {
            g[y][x] = y === 6 || y === 13 || x === 3 || x === 12 ? C.CHEST_METAL : C.CHEST_WOOD;
        }
    }
    // Latch
    g[9][7] = C.GOLD; g[9][8] = C.GOLD;
    g[10][7] = C.GOLD; g[10][8] = C.GOLD;
    return g;
})();

// Shrine
SPRITE_DATA.shrine = (() => {
    const g = fill(null);
    // Pillar
    for (let y = 4; y < 15; y++) { g[y][7] = C.SHRINE; g[y][8] = C.SHRINE; }
    // Base
    for (let x = 5; x < 11; x++) { g[14][x] = C.SHRINE; g[15][x] = C.SHRINE; }
    // Glow on top
    stamp(g, [[6,2,C.SHRINE_GLOW],[7,2,C.SHRINE_GLOW],[8,2,C.SHRINE_GLOW],[9,2,C.SHRINE_GLOW],
              [7,1,C.SHRINE_GLOW],[8,1,C.SHRINE_GLOW],
              [6,3,C.SHRINE_GLOW],[9,3,C.SHRINE_GLOW]]);
    return g;
})();

// Shop
SPRITE_DATA.shop = (() => {
    const g = fill(null);
    // Roof
    for (let y = 2; y < 6; y++) {
        const inset = Math.max(0, 2 - (y - 2));
        for (let x = inset; x < 16 - inset; x++) g[y][x] = C.RED;
    }
    // Walls
    for (let y = 6; y < 14; y++) {
        for (let x = 2; x < 14; x++) {
            g[y][x] = C.SHOP;
        }
    }
    // Door
    for (let y = 9; y < 14; y++) { g[y][7] = C.WOOD; g[y][8] = C.WOOD; }
    // Counter
    for (let x = 2; x < 14; x++) g[14][x] = C.WOOD;
    g[15][2] = C.WOOD; g[15][13] = C.WOOD;
    return g;
})();

// ---- ITEM SPRITES ----

// Iron Sword
SPRITE_DATA.item_iron_sword = (() => {
    const g = fill(null);
    stamp(g, [[11,2,C.IRON],[10,3,C.IRON],[9,4,C.IRON],[8,5,C.IRON],[7,6,C.IRON],
              [6,7,C.IRON],[5,8,C.GOLD],[4,9,C.GOLD],[3,10,C.WOOD],[3,11,C.WOOD],[2,12,C.RED]]);
    return g;
})();

// Steel Axe
SPRITE_DATA.item_steel_axe = (() => {
    const g = fill(null);
    // Handle
    for (let i = 0; i < 8; i++) stamp(g, [[4 + i, 13 - i, C.WOOD]]);
    // Axe head
    stamp(g, [[9,5,C.STEEL],[10,4,C.STEEL],[11,3,C.STEEL],[10,5,C.STEEL],[11,4,C.STEEL],
              [12,3,C.STEEL],[12,4,C.STEEL],[11,5,C.STEEL],[12,5,C.STEEL],[13,4,C.STEEL]]);
    return g;
})();

// Leather Armor
SPRITE_DATA.item_leather_armor = (() => {
    const g = fill(null);
    // Torso shape
    for (let y = 3; y < 13; y++) {
        const w = y < 5 ? 4 : y < 7 ? 5 : 4;
        for (let x = 8 - w; x <= 7 + w; x++) {
            if (x >= 0 && x < 16) g[y][x] = C.LEATHER;
        }
    }
    // Collar
    stamp(g, [[6,3,C.GOLD],[7,3,C.GOLD],[8,3,C.GOLD],[9,3,C.GOLD]]);
    return g;
})();

// Chain Mail
SPRITE_DATA.item_chain_mail = (() => {
    const g = fill(null);
    for (let y = 3; y < 13; y++) {
        const w = y < 5 ? 4 : y < 7 ? 5 : 4;
        for (let x = 8 - w; x <= 7 + w; x++) {
            if (x >= 0 && x < 16) g[y][x] = (x + y) % 2 === 0 ? C.IRON : C.STEEL;
        }
    }
    return g;
})();

// Health Potion
SPRITE_DATA.item_health_potion = (() => {
    const g = fill(null);
    // Bottle neck
    stamp(g, [[7,3,C.IRON],[8,3,C.IRON],[7,4,C.IRON],[8,4,C.IRON]]);
    // Bottle body
    for (let y = 5; y < 13; y++) {
        for (let x = 5; x < 11; x++) {
            g[y][x] = C.RED;
        }
    }
    // Highlight
    stamp(g, [[6,6,'#ee5555'],[6,7,'#ee5555']]);
    return g;
})();

// Speed Ring
SPRITE_DATA.item_speed_ring = (() => {
    const g = fill(null);
    // Ring shape
    for (let a = 0; a < 32; a++) {
        const angle = (a / 32) * Math.PI * 2;
        const x = Math.round(7.5 + Math.cos(angle) * 4);
        const y = Math.round(7.5 + Math.sin(angle) * 4);
        if (x >= 0 && x < 16 && y >= 0 && y < 16) g[y][x] = C.GOLD;
    }
    // Gem
    stamp(g, [[7,3,C.BLUE],[8,3,C.BLUE],[7,4,C.BLUE],[8,4,C.BLUE]]);
    return g;
})();

// Wooden Shield
SPRITE_DATA.item_wooden_shield = (() => {
    const g = fill(null);
    for (let y = 2; y < 14; y++) {
        const w = y < 4 ? 4 + y : y < 10 ? 8 : 8 - (y - 9) * 2;
        const half = Math.floor(w / 2);
        for (let x = 8 - half; x <= 7 + half; x++) {
            if (x >= 0 && x < 16) g[y][x] = C.WOOD;
        }
    }
    // Metal boss
    stamp(g, [[7,7,C.IRON],[8,7,C.IRON],[7,8,C.IRON],[8,8,C.IRON]]);
    // Metal rim
    for (let y = 2; y < 14; y++) {
        const w = y < 4 ? 4 + y : y < 10 ? 8 : 8 - (y - 9) * 2;
        const half = Math.floor(w / 2);
        if (8 - half >= 0) g[y][8 - half] = C.IRON;
        if (7 + half < 16) g[y][7 + half] = C.IRON;
    }
    return g;
})();

// Amulet of Power
SPRITE_DATA.item_amulet = (() => {
    const g = fill(null);
    // Chain
    stamp(g, [[5,1,C.GOLD],[6,2,C.GOLD],[7,3,C.GOLD],[8,3,C.GOLD],[9,2,C.GOLD],[10,1,C.GOLD]]);
    // Gem setting
    for (let a = 0; a < 24; a++) {
        const angle = (a / 24) * Math.PI * 2;
        const x = Math.round(7.5 + Math.cos(angle) * 3);
        const y = Math.round(8 + Math.sin(angle) * 3);
        if (x >= 0 && x < 16 && y >= 0 && y < 16) g[y][x] = C.GOLD;
    }
    // Gem
    stamp(g, [[7,7,C.PURPLE],[8,7,C.PURPLE],[7,8,C.PURPLE],[8,8,C.PURPLE],[7,9,C.PURPLE],[8,9,C.PURPLE]]);
    return g;
})();

// Vampire Fang
SPRITE_DATA.item_vampire_fang = (() => {
    const g = fill(null);
    // Fang shape - two teeth
    stamp(g, [[5,2,'#f0f0f0'],[6,2,'#f0f0f0'],[5,3,'#f0f0f0'],[6,3,'#f0f0f0'],
              [5,4,'#f0f0f0'],[6,4,'#e0e0e0'],[5,5,'#e0e0e0'],[6,5,'#d0d0d0'],
              [5,6,'#d0d0d0'],[5,7,'#c0c0c0'],[5,8,'#c0c0c0'],
              [9,2,'#f0f0f0'],[10,2,'#f0f0f0'],[9,3,'#f0f0f0'],[10,3,'#f0f0f0'],
              [9,4,'#e0e0e0'],[10,4,'#f0f0f0'],[9,5,'#d0d0d0'],[10,5,'#e0e0e0'],
              [10,6,'#d0d0d0'],[10,7,'#c0c0c0'],[10,8,'#c0c0c0']]);
    // Blood drip
    stamp(g, [[5,9,C.RED],[5,10,C.RED],[10,9,C.RED],[10,10,C.RED],[10,11,C.RED]]);
    return g;
})();

// Fire Staff
SPRITE_DATA.item_fire_staff = (() => {
    const g = fill(null);
    // Staff shaft
    for (let i = 0; i < 10; i++) stamp(g, [[5 + i, 14 - i, C.WOOD]]);
    // Fire on top
    stamp(g, [[12,3,C.ORANGE],[13,2,C.ORANGE],[14,1,C.ORANGE],
              [13,3,C.RED],[14,2,C.RED],[13,4,C.ORANGE],
              [12,4,'#ffaa00'],[14,3,'#ffaa00'],[13,1,'#ffaa00']]);
    return g;
})();

// ---- BOSS SPRITES ----

// Razorclaw Grizzly - large, menacing bear
SPRITE_DATA.boss_grizzly = (() => {
    const g = fill(null);
    // Body
    for (let y = 3; y < 14; y++) {
        const w = y < 6 ? 3 + (y - 3) : y < 11 ? 6 : 6 - (y - 10);
        for (let x = 8 - w; x <= 7 + w; x++) {
            if (x >= 0 && x < 16) g[y][x] = C.BEAR_FUR;
        }
    }
    // Head
    for (let y = 1; y < 5; y++) {
        for (let x = 5; x < 11; x++) g[y][x] = C.BEAR_FUR;
    }
    // Ears
    stamp(g, [[4,0,C.BEAR_FUR],[5,0,C.BEAR_FUR],[10,0,C.BEAR_FUR],[11,0,C.BEAR_FUR]]);
    // Eyes
    stamp(g, [[6,2,C.RED],[9,2,C.RED]]);
    // Snout
    stamp(g, [[7,3,C.BEAR_DARK],[8,3,C.BEAR_DARK]]);
    // Claws
    stamp(g, [[1,11,C.BEAR_CLAW],[1,12,C.BEAR_CLAW],[2,12,C.BEAR_CLAW],
              [14,11,C.BEAR_CLAW],[14,12,C.BEAR_CLAW],[13,12,C.BEAR_CLAW]]);
    // Feet
    stamp(g, [[4,14,C.BEAR_DARK],[5,14,C.BEAR_DARK],[6,14,C.BEAR_DARK],
              [9,14,C.BEAR_DARK],[10,14,C.BEAR_DARK],[11,14,C.BEAR_DARK]]);
    return g;
})();

// Shadow Wraith - ghostly figure
SPRITE_DATA.boss_wraith = (() => {
    const g = fill(null);
    // Flowing body
    for (let y = 2; y < 15; y++) {
        const w = y < 5 ? 2 + (y - 2) : y < 10 ? 5 : 5 + Math.floor(Math.sin(y * 2) * 2);
        for (let x = 8 - w; x <= 7 + w; x++) {
            if (x >= 0 && x < 16) {
                g[y][x] = (x + y) % 3 === 0 ? C.WRAITH_GLOW : C.WRAITH;
            }
        }
    }
    // Hood
    for (let y = 0; y < 4; y++) {
        for (let x = 5; x < 11; x++) g[y][x] = C.WRAITH;
    }
    // Glowing eyes
    stamp(g, [[6,2,C.WRAITH_EYE],[7,2,C.WRAITH_EYE],[9,2,C.WRAITH_EYE],[10,2,C.WRAITH_EYE]]);
    // Wispy bottom
    stamp(g, [[3,14,C.WRAITH_GLOW],[5,15,C.WRAITH],[8,14,C.WRAITH_GLOW],
              [11,15,C.WRAITH],[13,14,C.WRAITH_GLOW]]);
    return g;
})();

// Black Knight - armored figure
SPRITE_DATA.boss_knight = (() => {
    const g = fill(null);
    // Helmet
    for (let y = 0; y < 5; y++) {
        for (let x = 5; x < 11; x++) g[y][x] = C.KNIGHT_ARMOR;
    }
    // Visor slit
    stamp(g, [[6,2,C.KNIGHT_VISOR],[7,2,C.KNIGHT_VISOR],[8,2,C.KNIGHT_VISOR],[9,2,C.KNIGHT_VISOR]]);
    // Plume
    stamp(g, [[10,0,C.RED],[11,0,C.RED],[12,0,C.RED],[11,1,C.RED]]);
    // Body armor
    for (let y = 5; y < 12; y++) {
        for (let x = 4; x < 12; x++) {
            g[y][x] = (x + y) % 4 === 0 ? C.KNIGHT_DARK : C.KNIGHT_ARMOR;
        }
    }
    // Arms
    stamp(g, [[2,6,C.KNIGHT_ARMOR],[3,6,C.KNIGHT_ARMOR],[3,7,C.KNIGHT_ARMOR],
              [12,6,C.KNIGHT_ARMOR],[13,6,C.KNIGHT_ARMOR],[12,7,C.KNIGHT_ARMOR]]);
    // Sword in right hand
    stamp(g, [[13,4,C.IRON],[13,5,C.IRON],[14,3,C.IRON],[14,2,C.IRON],[14,1,C.IRON]]);
    // Legs
    for (let y = 12; y < 15; y++) {
        stamp(g, [[5,y,C.KNIGHT_DARK],[6,y,C.KNIGHT_ARMOR],[9,y,C.KNIGHT_ARMOR],[10,y,C.KNIGHT_DARK]]);
    }
    // Boots
    stamp(g, [[4,15,C.KNIGHT_DARK],[5,15,C.KNIGHT_DARK],[6,15,C.KNIGHT_DARK],
              [9,15,C.KNIGHT_DARK],[10,15,C.KNIGHT_DARK],[11,15,C.KNIGHT_DARK]]);
    return g;
})();

export { TILE_SIZE, getSprite, SPRITE_DATA, createSprite };
