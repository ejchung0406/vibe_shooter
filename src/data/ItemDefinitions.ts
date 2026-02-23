import { Player } from '../entities/Player';
import { StatModifier, Rarity } from '../entities/Item';

export type ItemCategory = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'cursed';

export interface ItemDefinition {
    id: string;
    name: string;
    description: string;
    texture: string;
    rarity: Rarity;
    category: ItemCategory;
    modifiers: StatModifier[];
    isCursed?: boolean;
    special?: {
        apply: (player: Player) => void;
        remove: (player: Player) => void;
    };
}

export const ITEM_DEFINITIONS: ItemDefinition[] = [
    {
        id: 'basic_sword', name: 'Basic Sword',
        description: 'Attack damage x1.2',
        texture: 'basic_sword_texture', rarity: 'common', category: 'weapon',
        modifiers: [{ stat: 'attackDamageMultiplier', op: 'add', value: 0.2 }],
    },
    {
        id: 'berserkers_greaves', name: "Berserker's Greaves",
        description: '+50 Attack Damage, +50% Attack Speed',
        texture: 'berserkers_greaves_texture', rarity: 'common', category: 'armor',
        modifiers: [
            { stat: 'bonusAttackDamage', op: 'add', value: 50 },
            { stat: 'attackSpeed', op: 'multiply', value: 0.5 },
        ],
    },
    {
        id: 'projectile_multiplier', name: 'Projectile Multiplier',
        description: 'Projectile speed +100',
        texture: 'projectile_multiplier_texture', rarity: 'rare', category: 'accessory',
        modifiers: [{ stat: 'projectileSpeed', op: 'add', value: 100 }],
    },
    {
        id: 'crit_damage_boost', name: 'Critical Damage Boost',
        description: 'Critical damage +100%',
        texture: 'crit_damage_boost_texture', rarity: 'epic', category: 'accessory',
        modifiers: [{ stat: 'criticalStrikeDamage', op: 'add', value: 1.0 }],
    },
    {
        id: 'heart_of_tarrasque', name: 'Heart of Tarrasque',
        description: '+300 Max Health. Regenerates 1% of max health per second.',
        texture: 'heart_of_tarrasque_texture', rarity: 'legendary', category: 'armor',
        modifiers: [
            { stat: 'maxHealth', op: 'add', value: 300 },
            { stat: 'healthRegen', op: 'set', value: 0.01 },
        ],
    },
    {
        id: 'blade_of_the_ruined_king', name: 'Blade of the Ruined King',
        description: 'Attack damage x1.5, +25% Attack Speed',
        texture: 'blade_of_the_ruined_king_texture', rarity: 'epic', category: 'weapon',
        modifiers: [
            { stat: 'attackDamageMultiplier', op: 'add', value: 0.5 },
            { stat: 'attackSpeed', op: 'multiply', value: 0.25 },
        ],
    },
    {
        id: 'vampiric_scepter', name: 'Vampiric Scepter',
        description: 'Heal for 15% of damage dealt',
        texture: 'vampiric_scepter_texture', rarity: 'rare', category: 'weapon',
        modifiers: [{ stat: 'lifeSteal', op: 'set', value: 0.15 }],
    },
    {
        id: 'aegis_of_the_immortal', name: 'Aegis of the Immortal',
        description: 'Upon death, resurrect with 50% health. Consumed on use.',
        texture: 'aegis_of_the_immortal_texture', rarity: 'legendary', category: 'consumable',
        modifiers: [{ stat: 'hasAegis', op: 'set', value: 1 }],
    },
    {
        id: 'boots_of_swiftness', name: 'Boots of Swiftness',
        description: '+15% Movement Speed',
        texture: 'boots_of_swiftness_texture', rarity: 'common', category: 'armor',
        modifiers: [{ stat: 'moveSpeed', op: 'multiply', value: 0.15 }],
    },
    {
        id: 'rageblade', name: 'Rageblade',
        description: '+15% Attack Damage, +20% Attack Speed, +1 Attack/Projectile',
        texture: 'rageblade_texture', rarity: 'epic', category: 'weapon',
        modifiers: [
            { stat: 'attackDamageMultiplier', op: 'add', value: 0.15 },
            { stat: 'attackSpeed', op: 'multiply', value: 0.20 },
            { stat: 'projectileCount', op: 'add', value: 1 },
        ],
        special: {
            apply: (player: Player) => { player.increaseMeleeAttackCount(1); },
            remove: (player: Player) => { player.decreaseMeleeAttackCount(1); },
        },
    },
    {
        id: 'deathbringer', name: 'Deathbringer',
        description: '+30% Attack Damage, +35% Attack Speed, +2 Attacks/Projectiles',
        texture: 'deathbringer_texture', rarity: 'legendary', category: 'weapon',
        modifiers: [
            { stat: 'attackDamageMultiplier', op: 'add', value: 0.30 },
            { stat: 'attackSpeed', op: 'multiply', value: 0.35 },
            { stat: 'projectileCount', op: 'add', value: 2 },
        ],
        special: {
            apply: (player: Player) => { player.increaseMeleeAttackCount(2); },
            remove: (player: Player) => { player.decreaseMeleeAttackCount(2); },
        },
    },

    // === CURSED ITEMS ===
    {
        id: 'blood_pact', name: 'Blood Pact',
        description: '+80% Attack Damage, -30% Max HP. CURSED',
        texture: 'blood_pact_texture', rarity: 'epic', category: 'cursed',
        isCursed: true,
        modifiers: [
            { stat: 'attackDamageMultiplier', op: 'add', value: 0.8 },
        ],
        special: {
            apply: (player: Player) => {
                const hpLoss = Math.floor(player.getMaxHealth() * 0.3);
                player.increaseMaxHealth(-hpLoss);
            },
            remove: (player: Player) => {
                const hpRestore = Math.floor(player.getMaxHealth() * 0.43); // Inverse of 0.7
                player.increaseMaxHealth(hpRestore);
            },
        },
    },
    {
        id: 'glass_cannon', name: 'Glass Cannon',
        description: '+2 Projectiles, +50% Crit Damage, -50% Armor. CURSED',
        texture: 'glass_cannon_texture', rarity: 'epic', category: 'cursed',
        isCursed: true,
        modifiers: [
            { stat: 'projectileCount', op: 'add', value: 2 },
            { stat: 'criticalStrikeDamage', op: 'add', value: 0.5 },
            { stat: 'armor', op: 'add', value: -50 },
        ],
        special: {
            apply: (player: Player) => { player.increaseMeleeAttackCount(2); },
            remove: (player: Player) => { player.decreaseMeleeAttackCount(2); },
        },
    },
    {
        id: 'berserkers_rage', name: "Berserker's Rage",
        description: '+100% Attack Speed, -20% Move Speed. CURSED',
        texture: 'berserkers_rage_texture', rarity: 'epic', category: 'cursed',
        isCursed: true,
        modifiers: [
            { stat: 'attackSpeed', op: 'multiply', value: 1.0 },
        ],
        special: {
            apply: (player: Player) => { player.decreaseMoveSpeed(0.2); },
            remove: (player: Player) => { player.increaseMoveSpeed(0.2); },
        },
    },
    {
        id: 'cursed_blade', name: 'Cursed Blade',
        description: '+200 Attack Damage, +20% Crit Chance, -200 Max HP. CURSED',
        texture: 'cursed_blade_texture', rarity: 'legendary', category: 'cursed',
        isCursed: true,
        modifiers: [
            { stat: 'bonusAttackDamage', op: 'add', value: 200 },
            { stat: 'criticalStrikeChance', op: 'add', value: 0.2 },
            { stat: 'maxHealth', op: 'add', value: -200 },
        ],
    },
    {
        id: 'soul_harvester', name: 'Soul Harvester',
        description: '+5% Life Steal, +50% Attack Damage, -50 Max HP. CURSED',
        texture: 'soul_harvester_texture', rarity: 'legendary', category: 'cursed',
        isCursed: true,
        modifiers: [
            { stat: 'lifeSteal', op: 'set', value: 0.05 },
            { stat: 'attackDamageMultiplier', op: 'add', value: 0.5 },
            { stat: 'maxHealth', op: 'add', value: -50 },
        ],
    },

    // === MAGE ITEMS ===
    {
        id: 'arcane_crystal', name: 'Arcane Crystal',
        description: '+30 Max Mana, +15% Attack Damage',
        texture: 'arcane_crystal_texture', rarity: 'common', category: 'accessory',
        modifiers: [
            { stat: 'maxMana', op: 'add', value: 30 },
            { stat: 'attackDamageMultiplier', op: 'add', value: 0.15 },
        ],
    },
    {
        id: 'staff_of_power', name: 'Staff of Power',
        description: '+60 Max Mana, +20% Attack Damage',
        texture: 'staff_of_power_texture', rarity: 'rare', category: 'weapon',
        modifiers: [
            { stat: 'maxMana', op: 'add', value: 60 },
            { stat: 'attackDamageMultiplier', op: 'add', value: 0.2 },
        ],
    },
    {
        id: 'mana_prism', name: 'Mana Prism',
        description: '+100 Max Mana, +3 Mana/s',
        texture: 'mana_prism_texture', rarity: 'epic', category: 'accessory',
        modifiers: [
            { stat: 'maxMana', op: 'add', value: 100 },
            { stat: 'manaRegen', op: 'add', value: 3 },
        ],
    },
    {
        id: 'thunderlords_decree', name: "Thunderlord's Decree",
        description: '+80 Max Mana, +50% Attack Damage, +25% Attack Speed',
        texture: 'thunderlords_decree_texture', rarity: 'legendary', category: 'weapon',
        modifiers: [
            { stat: 'maxMana', op: 'add', value: 80 },
            { stat: 'attackDamageMultiplier', op: 'add', value: 0.5 },
            { stat: 'attackSpeed', op: 'multiply', value: 0.25 },
        ],
    },
];
