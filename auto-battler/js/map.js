import { getRandomItemId } from './items.js';

const MAP_WIDTH = 30;
const MAP_HEIGHT = 30;

const TERRAIN = {
    GRASS: 'grass',
    FOREST: 'forest',
    MOUNTAIN: 'mountain',
    WATER: 'water',
    PATH: 'path',
};

const PASSABLE = new Set([TERRAIN.GRASS, TERRAIN.FOREST, TERRAIN.PATH]);

class GameMap {
    constructor() {
        this.width = MAP_WIDTH;
        this.height = MAP_HEIGHT;
        this.tiles = [];
        this.generate();
    }

    generate() {
        // Initialize with grass
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = { terrain: TERRAIN.GRASS, poi: null };
            }
        }

        // Place water bodies (2-3 small lakes)
        const numLakes = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numLakes; i++) {
            const cx = 3 + Math.floor(Math.random() * (this.width - 6));
            const cy = 3 + Math.floor(Math.random() * (this.height - 6));
            const r = 2 + Math.floor(Math.random() * 2);
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (dx * dx + dy * dy <= r * r) {
                        const tx = cx + dx, ty = cy + dy;
                        if (this.inBounds(tx, ty)) {
                            this.tiles[ty][tx].terrain = TERRAIN.WATER;
                        }
                    }
                }
            }
        }

        // Place mountain ranges
        const numMountains = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numMountains; i++) {
            let x = 2 + Math.floor(Math.random() * (this.width - 4));
            let y = 2 + Math.floor(Math.random() * (this.height - 4));
            const len = 3 + Math.floor(Math.random() * 4);
            const dx = Math.random() < 0.5 ? 1 : 0;
            const dy = dx === 0 ? 1 : 0;
            for (let j = 0; j < len; j++) {
                if (this.inBounds(x, y)) {
                    this.tiles[y][x].terrain = TERRAIN.MOUNTAIN;
                    // Thicken
                    if (this.inBounds(x + 1, y)) this.tiles[y][x + 1].terrain = TERRAIN.MOUNTAIN;
                    if (this.inBounds(x, y + 1)) this.tiles[y + 1][x].terrain = TERRAIN.MOUNTAIN;
                }
                x += dx;
                y += dy;
            }
        }

        // Scatter forests
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x].terrain === TERRAIN.GRASS && Math.random() < 0.15) {
                    this.tiles[y][x].terrain = TERRAIN.FOREST;
                }
            }
        }

        // Create a path from center-ish area
        const pathStartX = Math.floor(this.width / 2);
        let px = pathStartX, py = 0;
        while (py < this.height) {
            if (this.inBounds(px, py)) {
                this.tiles[py][px].terrain = TERRAIN.PATH;
            }
            py++;
            px += Math.floor(Math.random() * 3) - 1;
            px = Math.max(1, Math.min(this.width - 2, px));
        }

        // Ensure spawn area is clear (center of map)
        const spawnX = Math.floor(this.width / 2);
        const spawnY = Math.floor(this.height / 2);
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = spawnX + dx, ty = spawnY + dy;
                if (this.inBounds(tx, ty)) {
                    this.tiles[ty][tx].terrain = TERRAIN.GRASS;
                    this.tiles[ty][tx].poi = null;
                }
            }
        }

        // Place POIs on passable tiles (not on spawn)
        this.placePOIs(spawnX, spawnY);
    }

    placePOIs(spawnX, spawnY) {
        const candidates = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!PASSABLE.has(this.tiles[y][x].terrain)) continue;
                const dist = Math.abs(x - spawnX) + Math.abs(y - spawnY);
                if (dist < 3) continue; // Not too close to spawn
                candidates.push({ x, y, dist });
            }
        }

        // Shuffle candidates
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        // Place chests (6-8)
        let placed = 0;
        const numChests = 6 + Math.floor(Math.random() * 3);
        for (const c of candidates) {
            if (placed >= numChests) break;
            if (this.tiles[c.y][c.x].poi) continue;
            this.tiles[c.y][c.x].poi = {
                type: 'chest',
                sprite: 'chest',
                itemId: getRandomItemId(),
                looted: false,
            };
            placed++;
        }

        // Place shrines (2-3)
        placed = 0;
        const numShrines = 2 + Math.floor(Math.random() * 2);
        for (const c of candidates) {
            if (placed >= numShrines) break;
            if (this.tiles[c.y][c.x].poi) continue;
            const buffType = ['atk', 'def', 'spd'][Math.floor(Math.random() * 3)];
            this.tiles[c.y][c.x].poi = {
                type: 'shrine',
                sprite: 'shrine',
                buffType,
                buffAmount: 2,
                used: false,
            };
            placed++;
        }

        // Place shops (2)
        placed = 0;
        for (const c of candidates) {
            if (placed >= 2) break;
            if (this.tiles[c.y][c.x].poi) continue;
            this.tiles[c.y][c.x].poi = {
                type: 'shop',
                sprite: 'shop',
                inventory: [getRandomItemId(), getRandomItemId(), getRandomItemId()],
            };
            placed++;
        }
    }

    inBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getTile(x, y) {
        if (!this.inBounds(x, y)) return { terrain: TERRAIN.MOUNTAIN, poi: null };
        return this.tiles[y][x];
    }

    isPassable(x, y) {
        if (!this.inBounds(x, y)) return false;
        return PASSABLE.has(this.tiles[y][x].terrain);
    }

    getSpawnPoint() {
        return { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) };
    }
}

export { GameMap, TERRAIN, PASSABLE, MAP_WIDTH, MAP_HEIGHT };
