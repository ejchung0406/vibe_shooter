import { Player } from '../entities/Player';
import { ItemData } from '../entities/Item';

export class ItemManager {
    private items: Map<string, ItemData> = new Map();

    constructor() {
        this.initializeItems();
    }

    private initializeItems() {
        this.items.set('berserkers_greaves', {
            id: 'berserkers_greaves',
            name: 'Berserker\'s Greaves',
            description: '+50 Attack Damage, +50% Attack Speed',
            texture: 'berserkers_greaves_texture',
            rarity: 'common',
            applyEffect: (player: Player) => {
                player.increaseDamage(50);
                player.increaseAttackSpeed(0.5);
            }
        });

        this.items.set('projectile_multiplier', {
            id: 'projectile_multiplier',
            name: 'Projectile Multiplier',
            description: 'Projectile speed x1.5',
            texture: 'projectile_multiplier_texture',
            rarity: 'rare',
            applyEffect: (player: Player) => {
                player.increaseProjectileSpeed(1.5);
            }
        });

        this.items.set('crit_damage_boost', {
            id: 'crit_damage_boost',
            name: 'Critical Damage Boost',
            description: 'Critical damage +100%',
            texture: 'crit_damage_boost_texture',
            rarity: 'epic',
            applyEffect: (player: Player) => {
                player.setCriticalStrikeDamage(player.getCriticalStrikeDamage() + 1);
            }
        });

        this.items.set('legendary_item', {
            id: 'legendary_item',
            name: 'Legendary Item',
            description: '+30% move speed, +30 armor, +30 attack, +30% attack speed, +3 projectiles',
            texture: 'legendary_item_texture',
            rarity: 'legendary',
            applyEffect: (player: Player) => {
                player.increaseMoveSpeed(0.3);
                player.increaseArmor(30);
                player.increaseDamage(30);
                player.increaseAttackSpeed(0.3);
                player.increaseProjectileCount(3);
            }
        });
    }

    public getItem(id: string): ItemData | undefined {
        return this.items.get(id);
    }

    public getRandomItem(): ItemData | undefined {
        const itemsArray = Array.from(this.items.values());
        if (itemsArray.length === 0) {
            return undefined;
        }

        const weights = {
            common: 10,
            rare: 5,
            epic: 2,
            legendary: 1
        };

        const weightedItems = itemsArray.flatMap(item => {
            const weight = weights[item.rarity] || 1;
            return Array(weight).fill(item);
        });

        const randomIndex = Math.floor(Math.random() * weightedItems.length);
        return weightedItems[randomIndex];
    }
} 