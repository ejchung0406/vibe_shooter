import { Player } from '../entities/Player';
import { ItemData } from '../entities/Item';

export class ItemManager {
    private items: Map<string, ItemData> = new Map();

    constructor() {
        this.initializeItems();
    }

    private initializeItems() {
        this.items.set('basic_sword', {
            id: 'basic_sword',
            name: 'Basic Sword',
            description: 'Attack damage x1.2',
            texture: 'basic_sword_texture',
            rarity: 'common',
            applyEffect: (player: Player) => {
                player.increaseAttackDamageMultiplier(0.2);
            },
            removeEffect: (player: Player) => {
                player.decreaseAttackDamageMultiplier(0.2);
            }
        });

        this.items.set('berserkers_greaves', {
            id: 'berserkers_greaves',
            name: 'Berserker\'s Greaves',
            description: '+50 Attack Damage, +50% Attack Speed',
            texture: 'berserkers_greaves_texture',
            rarity: 'common',
            applyEffect: (player: Player) => {
                player.increaseBonusAttackDamage(50);
                player.increaseAttackSpeed(0.5);
            },
            removeEffect: (player: Player) => {
                player.decreaseBonusAttackDamage(50);
                player.decreaseAttackSpeed(0.5);
            }
        });

        this.items.set('projectile_multiplier', {
            id: 'projectile_multiplier',
            name: 'Projectile Multiplier',
            description: 'Projectile speed +100',
            texture: 'projectile_multiplier_texture',
            rarity: 'rare',
            applyEffect: (player: Player) => {
                player.increaseProjectileSpeedBonus(100);
            },
            removeEffect: (player: Player) => {
                player.decreaseProjectileSpeedBonus(100);
            }
        });

        this.items.set('crit_damage_boost', {
            id: 'crit_damage_boost',
            name: 'Critical Damage Boost',
            description: 'Critical damage +100%',
            texture: 'crit_damage_boost_texture',
            rarity: 'epic',
            applyEffect: (player: Player) => {
                player.increaseCriticalStrikeDamage(1.0);
            },
            removeEffect: (player: Player) => {
                player.decreaseCriticalStrikeDamage(1.0);
            }
        });

        this.items.set('heart_of_tarrasque', {
            id: 'heart_of_tarrasque',
            name: 'Heart of Tarrasque',
            description: '+300 Max Health. Regenerates 1% of max health per second.',
            texture: 'heart_of_tarrasque_texture',
            rarity: 'legendary',
            applyEffect: (player: Player) => {
                player.increaseMaxHealth(300);
                player.setHealthRegen(0.01);
            },
            removeEffect: (player: Player) => {
                player.decreaseMaxHealth(300);
                player.setHealthRegen(0);
            }
        });

        this.items.set('blade_of_the_ruined_king', {
            id: 'blade_of_the_ruined_king',
            name: 'Blade of the Ruined King',
            description: 'Attack damage x1.5, +25% Attack Speed',
            texture: 'blade_of_the_ruined_king_texture',
            rarity: 'epic',
            applyEffect: (player: Player) => {
                player.increaseAttackDamageMultiplier(0.5);
                player.increaseAttackSpeed(0.25);
            },
            removeEffect: (player: Player) => {
                player.decreaseAttackDamageMultiplier(0.5);
                player.decreaseAttackSpeed(0.25);
            }
        });

        this.items.set('vampiric_scepter', {
            id: 'vampiric_scepter',
            name: 'Vampiric Scepter',
            description: 'Heal for 15% of damage dealt',
            texture: 'vampiric_scepter_texture',
            rarity: 'rare',
            applyEffect: (player: Player) => {
                player.setLifeSteal(0.15);
            },
            removeEffect: (player: Player) => {
                player.setLifeSteal(0);
            }
        });

        this.items.set('aegis_of_the_immortal', {
            id: 'aegis_of_the_immortal',
            name: 'Aegis of the Immortal',
            description: 'Upon death, resurrect with 50% health. Consumed on use.',
            texture: 'aegis_of_the_immortal_texture',
            rarity: 'legendary',
            applyEffect: (player: Player) => {
                player.setHasAegis(true);
            },
            removeEffect: (player: Player) => {
                player.setHasAegis(false);
            }
        });

        this.items.set('boots_of_swiftness', {
            id: 'boots_of_swiftness',
            name: 'Boots of Swiftness',
            description: '+15% Movement Speed',
            texture: 'boots_of_swiftness_texture',
            rarity: 'common',
            applyEffect: (player: Player) => {
                player.increaseMoveSpeed(0.15);
            },
            removeEffect: (player: Player) => {
                player.decreaseMoveSpeed(0.15);
            }
        });

        this.items.set('rageblade', {
            id: 'rageblade',
            name: 'Rageblade',
            description: '+15% Attack Damage, +20% Attack Speed, +1 Projectile',
            texture: 'rageblade_texture',
            rarity: 'epic',
            applyEffect: (player: Player) => {
                player.increaseAttackDamageMultiplier(0.15);
                player.increaseAttackSpeed(0.20);
                player.increaseProjectileCount(1);
            },
            removeEffect: (player: Player) => {
                player.decreaseAttackDamageMultiplier(0.15);
                player.decreaseAttackSpeed(0.20);
                player.decreaseProjectileCount(1);
            }
        });

        this.items.set('deathbringer', {
            id: 'deathbringer',
            name: 'Deathbringer',
            description: '+30% Attack Damage, +35% Attack Speed, +2 Projectiles',
            texture: 'deathbringer_texture',
            rarity: 'legendary',
            applyEffect: (player: Player) => {
                player.increaseAttackDamageMultiplier(0.30);
                player.increaseAttackSpeed(0.35);
                player.increaseProjectileCount(2);
            },
            removeEffect: (player: Player) => {
                player.decreaseAttackDamageMultiplier(0.30);
                player.decreaseAttackSpeed(0.35);
                player.decreaseProjectileCount(2);
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

        const weights: { [key: string]: number } = {
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

    public getRandomBossItem(): ItemData | undefined {
        const bossItems = Array.from(this.items.values()).filter(item => item.rarity === 'epic' || item.rarity === 'legendary');
        if (bossItems.length > 0) {
            const randomIndex = Math.floor(Math.random() * bossItems.length);
            return bossItems[randomIndex];
        }
        return this.getRandomItem(); // Fallback to a common item if no boss items are defined
    }
} 