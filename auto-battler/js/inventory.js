import { createItem } from './items.js';

// Handles inventory UI interactions and shop logic

class InventoryManager {
    constructor(player) {
        this.player = player;
        this.selectedSlot = -1;
        this.hoveredSlot = -1;
        this.shopItems = null; // Set when visiting a shop
        this.shopHovered = -1;
        this.message = null;
        this.messageTimer = 0;
    }

    showMessage(text, duration = 2000) {
        this.message = text;
        this.messageTimer = duration;
    }

    update(dt) {
        if (this.messageTimer > 0) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                this.message = null;
            }
        }
    }

    // Handle click on inventory slot
    clickSlot(index) {
        if (index < 0 || index >= this.player.inventory.length) {
            this.selectedSlot = -1;
            return;
        }

        if (this.selectedSlot === index) {
            // Toggle equip
            const item = this.player.inventory[index];
            if (this.player.isEquipped(item)) {
                const slot = this.player.getEquipSlot(item);
                this.player.unequipItem(slot);
                this.showMessage(`Unequipped ${item.name}`);
            } else {
                if (this.player.equipItem(index)) {
                    this.showMessage(`Equipped ${item.name}`);
                } else {
                    this.showMessage(`Can't equip ${item.name}`);
                }
            }
            this.selectedSlot = -1;
        } else {
            this.selectedSlot = index;
        }
    }

    // Drop selected item
    dropSelected() {
        if (this.selectedSlot < 0) return;
        const item = this.player.removeItem(this.selectedSlot);
        if (item) {
            this.showMessage(`Dropped ${item.name}`);
        }
        this.selectedSlot = -1;
    }

    // Open shop with POI data
    openShop(shopPoi) {
        this.shopItems = shopPoi.inventory.map(id => createItem(id)).filter(Boolean);
        this.shopHovered = -1;
    }

    closeShop() {
        this.shopItems = null;
        this.shopHovered = -1;
    }

    // Take item from shop (free in MVP - no currency)
    takeShopItem(index) {
        if (!this.shopItems || index < 0 || index >= this.shopItems.length) return;
        const item = this.shopItems[index];
        if (!item) return;

        if (this.player.canPickup()) {
            this.player.addItem(item);
            this.shopItems[index] = null;
            this.showMessage(`Picked up ${item.name}`);
        } else {
            this.showMessage('Inventory full!');
        }
    }

    isShopOpen() {
        return this.shopItems !== null;
    }
}

export { InventoryManager };
