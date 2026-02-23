import { Player } from '../entities/Player';
import { ItemData, Rarity } from '../entities/Item';
import { RARITY_WEIGHTS } from '../GameConstants';
import { ItemDefinition, ITEM_DEFINITIONS } from '../data/ItemDefinitions';

function buildItemData(def: ItemDefinition): ItemData {
    return {
        id: def.id,
        name: def.name,
        description: def.description,
        texture: def.texture,
        rarity: def.rarity,
        modifiers: def.modifiers,
        isCursed: def.isCursed,
        level: 1,
        applyEffect: (player: Player) => {
            for (const mod of def.modifiers) {
                player.applyStat(mod.stat, mod.op, mod.value);
            }
            def.special?.apply(player);
        },
        removeEffect: (player: Player) => {
            for (const mod of def.modifiers) {
                player.removeStat(mod.stat, mod.op, mod.value);
            }
            def.special?.remove(player);
        },
    };
}

export class ItemManager {
    private items: Map<string, ItemData> = new Map();

    constructor() {
        for (const def of ITEM_DEFINITIONS) {
            this.items.set(def.id, buildItemData(def));
        }
    }

    public getItem(id: string): ItemData | undefined {
        return this.items.get(id);
    }

    public getItemsByRarity(rarity: Rarity): ItemData[] {
        return Array.from(this.items.values()).filter(item => item.rarity === rarity);
    }

    public getRandomItem(): ItemData | undefined {
        const itemsArray = Array.from(this.items.values());
        if (itemsArray.length === 0) return undefined;

        const weightedItems = itemsArray.flatMap(item => {
            const weight = RARITY_WEIGHTS[item.rarity] || 1;
            return Array(weight).fill(item);
        });

        return weightedItems[Math.floor(Math.random() * weightedItems.length)];
    }

    public getRandomCommonItem(): ItemData | undefined {
        const commonItems = Array.from(this.items.values()).filter(
            item => item.rarity === 'common' && !item.isCursed
        );
        if (commonItems.length > 0) {
            return commonItems[Math.floor(Math.random() * commonItems.length)];
        }
        return this.getRandomItem();
    }

    public getRandomBossItem(): ItemData | undefined {
        const bossItems = Array.from(this.items.values()).filter(
            item => item.rarity === 'epic' || item.rarity === 'legendary'
        );
        if (bossItems.length > 0) {
            return bossItems[Math.floor(Math.random() * bossItems.length)];
        }
        return this.getRandomItem();
    }
}
