import { TILE_SIZE, getSprite } from './sprites.js';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const SCALE = 2; // Each pixel rendered as 2x2 for that chunky look

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.camera = { x: 0, y: 0 };
        this.scaledTile = TILE_SIZE * SCALE;
        this.tilesX = Math.ceil(CANVAS_WIDTH / this.scaledTile) + 1;
        this.tilesY = Math.ceil(CANVAS_HEIGHT / this.scaledTile) + 1;

        // Shake effect
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
    }

    clear(color = '#0a0a0a') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    centerCamera(worldX, worldY) {
        this.camera.x = worldX * this.scaledTile - CANVAS_WIDTH / 2 + this.scaledTile / 2;
        this.camera.y = worldY * this.scaledTile - CANVAS_HEIGHT / 2 + this.scaledTile / 2;
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    updateShake(dt) {
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            if (this.shakeTimer <= 0) {
                this.shakeTimer = 0;
                this.shakeIntensity = 0;
            }
        }
    }

    getShakeOffset() {
        if (this.shakeTimer <= 0) return { x: 0, y: 0 };
        return {
            x: (Math.random() - 0.5) * this.shakeIntensity * 2,
            y: (Math.random() - 0.5) * this.shakeIntensity * 2
        };
    }

    drawMap(map) {
        const shake = this.getShakeOffset();
        const startCol = Math.max(0, Math.floor((this.camera.x + shake.x) / this.scaledTile));
        const startRow = Math.max(0, Math.floor((this.camera.y + shake.y) / this.scaledTile));

        for (let row = startRow; row < startRow + this.tilesY && row < map.height; row++) {
            for (let col = startCol; col < startCol + this.tilesX && col < map.width; col++) {
                const tile = map.getTile(col, row);
                const spriteName = tile.terrain;
                const sprite = getSprite(spriteName);
                if (sprite) {
                    const sx = col * this.scaledTile - this.camera.x + shake.x;
                    const sy = row * this.scaledTile - this.camera.y + shake.y;
                    this.ctx.drawImage(sprite, sx, sy, this.scaledTile, this.scaledTile);
                }

                // Draw POI on top
                if (tile.poi) {
                    const poiSprite = getSprite(tile.poi.sprite);
                    if (poiSprite) {
                        const sx = col * this.scaledTile - this.camera.x + shake.x;
                        const sy = row * this.scaledTile - this.camera.y + shake.y;
                        this.ctx.drawImage(poiSprite, sx, sy, this.scaledTile, this.scaledTile);
                    }
                }
            }
        }
    }

    drawEntity(worldX, worldY, spriteName) {
        const shake = this.getShakeOffset();
        const sprite = getSprite(spriteName);
        if (!sprite) return;
        const sx = worldX * this.scaledTile - this.camera.x + shake.x;
        const sy = worldY * this.scaledTile - this.camera.y + shake.y;
        this.ctx.drawImage(sprite, sx, sy, this.scaledTile, this.scaledTile);
    }

    drawSprite(screenX, screenY, spriteName, scale = SCALE) {
        const sprite = getSprite(spriteName);
        if (!sprite) return;
        this.ctx.drawImage(sprite, screenX, screenY, TILE_SIZE * scale, TILE_SIZE * scale);
    }

    // UI drawing helpers
    drawRect(x, y, w, h, color, filled = true) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        if (filled) {
            this.ctx.fillRect(x, y, w, h);
        } else {
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, w, h);
        }
    }

    drawText(text, x, y, color = '#ffffff', size = 16, align = 'left') {
        this.ctx.fillStyle = color;
        this.ctx.font = `${size}px monospace`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(text, x, y);
    }

    drawBar(x, y, w, h, current, max, fgColor, bgColor = '#333333') {
        this.drawRect(x, y, w, h, bgColor);
        const fillW = Math.max(0, (current / max) * w);
        this.drawRect(x, y, fillW, h, fgColor);
        this.drawRect(x, y, w, h, '#ffffff', false);
    }

    get width() { return CANVAS_WIDTH; }
    get height() { return CANVAS_HEIGHT; }
}

export { Renderer, CANVAS_WIDTH, CANVAS_HEIGHT, SCALE };
