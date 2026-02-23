import { GameScene } from '../scenes/GameScene';
import { BasePlayer } from '../entities/BasePlayer';
import { RangedPlayer } from '../entities/RangedPlayer';
import { MeleePlayer } from '../entities/MeleePlayer';
import { MagePlayer } from '../entities/MagePlayer';
import { RARITY_WEIGHTS } from '../GameConstants';
import { Rarity } from '../entities/Item';

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    rarity: Rarity;
    dependencies?: string[];
    requiredSkill?: 'Q' | 'E' | 'R' | 'F' | 'DASH';
    character?: 'ranged' | 'melee' | 'mage';
    effect: (player: BasePlayer) => void;
}

export class UpgradeManager {
    private scene: GameScene;
    private availableUpgrades: Upgrade[] = [];
    private appliedUpgrades: Upgrade[] = [];

    constructor(scene: GameScene) {
        this.scene = scene;
        this.initializeUpgrades();
    }

    private initializeUpgrades() {
        this.availableUpgrades = [
            // Attack modifications
            {
                id: "double_shot",
                name: "Double Shot",
                description: "Add 1 more projectile",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.increaseProjectileCount(1);
                },
                character: 'ranged'
            },
            {
                id: "triple_shot",
                name: "Triple Shot",
                description: "Add 2 more projectiles",
                rarity: "rare",
                effect: (player: BasePlayer) => {
                    player.increaseProjectileCount(2);
                },
                character: 'ranged'
            },
            {
                id: "quad_shot",
                name: "Quadruple Shot",
                description: "Add 3 more projectiles",
                rarity: "epic",
                effect: (player: BasePlayer) => {
                    player.increaseProjectileCount(3);
                },
                character: 'ranged'
            },
            {
                id: "double_swing",
                name: "Double Swing",
                description: "Add 1 more melee attack",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.increaseMeleeAttackCount(1);
                },
                character: 'melee'
            },
            {
                id: "triple_swing",
                name: "Triple Swing",
                description: "Add 2 more melee attacks",
                rarity: "rare",
                effect: (player: BasePlayer) => {
                    player.increaseMeleeAttackCount(2);
                },
                character: 'melee'
            },
            {
                id: "quad_swing",
                name: "Quadruple Swing",
                description: "Add 3 more melee attacks",
                rarity: "epic",
                effect: (player: BasePlayer) => {
                    player.increaseMeleeAttackCount(3);
                },
                character: 'melee'
            },
            {
                id: "combo_master",
                name: "Combo Master",
                description: "Every 3rd shot becomes explosive",
                rarity: "epic",
                effect: (player: BasePlayer) => {
                    player.enableComboMaster();
                },
                character: 'ranged'
            },
            {
                id: "advanced_combo",
                name: "Advanced Combo",
                description: "Every 2nd shot becomes a combo attack",
                rarity: "legendary",
                dependencies: ["combo_master"],
                effect: (player: BasePlayer) => {
                    player.enableAdvancedCombo();
                },
                character: 'ranged'
            },

            // Stat improvements
            {
                id: "rapid_fire",
                name: "Rapid Fire",
                description: "+20% attack speed",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.setAttackCooldownMultiplier(0.8);
                }
            },
            {
                id: "lightning_strike",
                name: "Lightning Strike",
                description: "+40% attack speed",
                rarity: "rare",
                effect: (player: BasePlayer) => {
                    player.setAttackCooldownMultiplier(0.6);
                }
            },
            {
                id: "power_shot",
                name: "Power Shot",
                description: "+10 damage",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.increaseBonusAttackDamage(10);
                },
                character: 'ranged'
            },
            {
                id: "power_shot_2",
                name: "Power Shot 2",
                description: "+20 damage",
                rarity: "rare",
                dependencies: ["power_shot"],
                effect: (player: BasePlayer) => {
                    player.increaseBonusAttackDamage(20);
                },
                character: 'ranged'
            },
            {
                id: "power_shot_3",
                name: "Power Shot 3",
                description: "+30 damage",
                rarity: "epic",
                dependencies: ["power_shot_2"],
                effect: (player: BasePlayer) => {
                    player.increaseBonusAttackDamage(30);
                },
                character: 'ranged'
            },
            {
                id: "mega_blast",
                name: "Mega Blast",
                description: "+50 damage",
                rarity: "rare",
                dependencies: ["power_shot_3"],
                effect: (player: BasePlayer) => {
                    player.increaseBonusAttackDamage(50);
                },
                character: 'ranged'
            },
            {
                id: "power_swing",
                name: "Power Swing",
                description: "1.5x melee damage",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.increaseAttackDamageMultiplier(1.5);
                },
                character: 'melee'
            },
            {
                id: "power_swing_2",
                name: "Power Swing 2",
                description: "2x melee damage",
                rarity: "rare",
                dependencies: ["power_swing"],
                effect: (player: BasePlayer) => {
                    player.increaseAttackDamageMultiplier(2);
                },
                character: 'melee'
            },
            {
                id: "power_swing_3",
                name: "Power Swing 3",
                description: "3x melee damage",
                rarity: "epic",
                dependencies: ["power_swing_2"],
                effect: (player: BasePlayer) => {
                    player.increaseAttackDamageMultiplier(3);
                },
                character: 'melee'
            },
            {
                id: "mega_swing",
                name: "Mega Swing",
                description: "5x melee damage",
                rarity: "legendary",
                dependencies: ["power_swing_3"],
                effect: (player: BasePlayer) => {
                    player.increaseAttackDamageMultiplier(5);
                },
                character: 'melee'
            },
            {
                id: "piercing_shot",
                name: "Piercing Shot",
                description: "Projectiles pass through enemies",
                rarity: "epic",
                effect: (player: BasePlayer) => {
                    player.setPiercing(true);
                },
                character: 'ranged'
            },

            // Q Skill improvements
            {
                id: "double_q",
                name: "Double Homing",
                description: "Double the number of projectiles from Q",
                rarity: "rare",
                requiredSkill: 'Q',
                effect: (player: BasePlayer) => {
                    player.setQSkillHomingMultiplier(2);
                },
                character: 'ranged'
            },
            {
                id: "triple_q",
                name: "Triple Homing",
                description: "Triple the number of projectiles from Q",
                rarity: "epic",
                dependencies: ["double_q"],
                requiredSkill: 'Q',
                effect: (player: BasePlayer) => {
                    player.setQSkillHomingMultiplier(player.getQSkillHomingMultiplier() * 3);
                },
                character: 'ranged'
            },
            {
                id: "triple_q_2",
                name: "Triple Homing 2",
                description: "Triple the number of projectiles from Q",
                rarity: "epic",
                dependencies: ["triple_q"],
                requiredSkill: 'Q',
                effect: (player: BasePlayer) => {
                    player.setQSkillHomingMultiplier(player.getQSkillHomingMultiplier() * 3);
                },
                character: 'ranged'
            },

            // Combo Master
            {
                id: "wombo_combo_master",
                name: "Wombo Combo Master",
                description: "Explosive shot deals 1.5x damage to enemies",
                rarity: "epic",
                dependencies: ["combo_master"],
                effect: (player: BasePlayer) => {
                    player.setExplosiveDamageMultiplier(1.5);
                }
            },
            {
                id: "wombo_combo_master_2",
                name: "Wombo Combo Master 2",
                description: "Explosive shot deals 2x damage to enemies",
                rarity: "legendary",
                dependencies: ["wombo_combo_master"],
                effect: (player: BasePlayer) => {
                    player.setExplosiveDamageMultiplier(player.getExplosiveDamageMultiplier() * 2);
                }
            },
            {
                id: "combo_killer",
                name: "Combo Killer",
                description: "Explosive shot deals 5x damage to bosses",
                rarity: "legendary",
                dependencies: ["combo_master"],
                effect: (player: BasePlayer) => {
                    player.setExplosiveBossDamageMultiplier(5);
                }
            },

            // Character HP
            {
                id: "hp_boost",
                name: "HP Boost",
                description: "+50 max HP",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.increaseMaxHealth(50);
                }
            },
            {
                id: "hp_boost_2",
                name: "HP Boost 2",
                description: "+100 max HP",
                rarity: "rare",
                dependencies: ["hp_boost"],
                effect: (player: BasePlayer) => {
                    player.increaseMaxHealth(100);
                }
            },
            {
                id: "heal_over_time",
                name: "Heal Over Time",
                description: "Heal 2 HP every 1 second",
                rarity: "epic",
                effect: (player: BasePlayer) => {
                    player.setHealOverTime(true);
                }
            },
            {
                id: "instant_heal",
                name: "Instant Heal",
                description: "Heal 30% of max HP",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.heal(player.getMaxHealth() * 0.3);
                }
            },
            {
                id: "instant_heal_2",
                name: "Instant Heal 2",
                description: "Heal 50% of max HP",
                rarity: "rare",
                dependencies: ["instant_heal"],
                effect: (player: BasePlayer) => {
                    player.heal(player.getMaxHealth() * 0.5);
                }
            },

            // Critical strike
            {
                id: "critical_strike",
                name: "Critical Strike",
                description: "Critical strike chance 30%",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.setCriticalStrikeChance(0.3);
                }
            },
            {
                id: "critical_strike_2",
                name: "Critical Strike 2",
                description: "Critical strike chance 50%",
                rarity: "rare",
                dependencies: ["critical_strike"],
                effect: (player: BasePlayer) => {
                    player.setCriticalStrikeChance(0.5);
                }
            },
            {
                id: "critical_strike_3",
                name: "Critical Strike 3",
                description: "Critical strike chance 70%",
                rarity: "epic",
                dependencies: ["critical_strike_2"],
                effect: (player: BasePlayer) => {
                    player.setCriticalStrikeChance(0.7);
                }
            },
            {
                id: "critical_damage",
                name: "Critical Damage",
                description: "Critical strike damage +30%",
                rarity: "common",
                dependencies: ["critical_strike"],
                effect: (player: BasePlayer) => {
                    player.setCriticalStrikeDamage(player.getCriticalStrikeDamage() + 0.3);
                }
            },
            {
                id: "critical_damage_2",
                name: "Critical Damage 2",
                description: "Critical strike damage +50%",
                rarity: "rare",
                dependencies: ["critical_damage"],
                effect: (player: BasePlayer) => {
                    player.setCriticalStrikeDamage(player.getCriticalStrikeDamage() + 0.5);
                }
            },
            {
                id: "critical_damage_3",
                name: "Critical Damage 3",
                description: "Critical strike damage +80%",
                rarity: "epic",
                dependencies: ["critical_damage_2"],
                effect: (player: BasePlayer) => {
                    player.setCriticalStrikeDamage(player.getCriticalStrikeDamage() + 0.8);
                }
            },
            {
                id: "critical_damage_4",
                name: "Critical Damage 4",
                description: "Critical strike damage +120%",
                rarity: "legendary",
                dependencies: ["critical_damage_3"],
                effect: (player: BasePlayer) => {
                    player.setCriticalStrikeDamage(player.getCriticalStrikeDamage() + 1.2);
                }
            },

            // New skills
            {
                id: "exp_boost",
                name: "EXP Boost",
                description: "Gain 20% more experience from normal enemies",
                rarity: "rare",
                effect: (player: BasePlayer) => {
                    player.setXPMultiplier(player.getXPMultiplier() + 0.2);
                }
            },
            {
                id: "q_damage_boost",
                name: "Q Damage Boost",
                description: "Q skill deals 2x damage to normal enemies",
                rarity: "epic",
                requiredSkill: 'Q',
                effect: (player: BasePlayer) => {
                    player.setQDamageToNormalMultiplier(2);
                },
                character: 'ranged'
            },
            // Melee Q skill upgrades
            {
                id: "melee_q_damage_1",
                name: "Melee Q Damage 1",
                description: "Increase Melee Q skill damage by 20%",
                rarity: "common",
                requiredSkill: 'Q',
                effect: (player: BasePlayer) => {
                    if (player instanceof MeleePlayer) {
                        player.increaseQSkillDamageMultiplier(0.2);
                    }
                },
                character: 'melee'
            },
            {
                id: "melee_q_damage_2",
                name: "Melee Q Damage 2",
                description: "Increase Melee Q skill damage by 40%",
                rarity: "rare",
                dependencies: ["melee_q_damage_1"],
                requiredSkill: 'Q',
                effect: (player: BasePlayer) => {
                    if (player instanceof MeleePlayer) {
                        player.increaseQSkillDamageMultiplier(0.4);
                    }
                },
                character: 'melee'
            },
            {
                id: "melee_q_damage_3",
                name: "Melee Q Damage 3",
                description: "Increase Melee Q skill damage by 80%",
                rarity: "legendary",
                dependencies: ["melee_q_damage_2"],
                requiredSkill: 'Q',
                effect: (player: BasePlayer) => {
                    if (player instanceof MeleePlayer) {
                        player.increaseQSkillDamageMultiplier(0.8);
                    }
                },
                character: 'melee'
            },
            {
                id: "melee_q_range_1",
                name: "Melee Q Range 1",
                description: "Increase Melee Q skill radius by 30%",
                rarity: "common",
                requiredSkill: 'Q',
                effect: (player: BasePlayer) => {
                    if (player instanceof MeleePlayer) {
                        player.increaseQSkillRadius(0.3);
                    }
                },
                character: 'melee'
            },
            {
                id: "melee_q_range_2",
                name: "Melee Q Range 2",
                description: "Increase Melee Q skill radius by 50%",
                rarity: "rare",
                dependencies: ["melee_q_range_1"],
                requiredSkill: 'Q',
                effect: (player: BasePlayer) => {
                    if (player instanceof MeleePlayer) {
                        player.increaseQSkillRadius(0.5);
                    }
                },
                character: 'melee'
            },
            // Melee R skill bleeding upgrades
            {
                id: "melee_r_bleeding_1",
                name: "Enhanced Bleeding",
                description: "Increase R skill bleeding damage from 3% to 5% of max health per second",
                rarity: "rare",
                requiredSkill: 'R',
                effect: (player: BasePlayer) => {
                    if (player instanceof MeleePlayer) {
                        player.setRSkillBleedingDamage(0.05);
                    }
                },
                character: 'melee'
            },
            {
                id: "melee_r_bleeding_2",
                name: "Potent Bleeding",
                description: "Increase R skill bleeding damage from 5% to 7% of max health per second",
                rarity: "epic",
                dependencies: ["melee_r_bleeding_1"],
                requiredSkill: 'R',
                effect: (player: BasePlayer) => {
                    if (player instanceof MeleePlayer) {
                        player.setRSkillBleedingDamage(0.07);
                    }
                },
                character: 'melee'
            },
            {
                id: "spawn_increase",
                name: "Swarm",
                description: "Increase enemy spawn rate by 1.5x",
                rarity: "legendary",
                effect: (_player: BasePlayer) => {
                    const enemySpawner = this.scene.getEnemySpawner();
                    if (enemySpawner) {
                        enemySpawner.setSpawnMultiplier(1.5);
                    }
                }
            },
            {
                id: "e_skill_heal",
                name: "Shield Heal",
                description: "E skill heals 10% of max health when used",
                rarity: "epic",
                requiredSkill: 'E',
                effect: (player: BasePlayer) => {
                    player.setESkillHeals(true);
                }
            },

            // Armor upgrades
            {
                id: "armor_boost_1",
                name: "Armor Boost",
                description: "+1 Armor per every upgrade",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.increaseArmor(1);
                }
            },
            {
                id: "armor_boost_2",
                name: "Armor Boost 2",
                description: "+2 Armor per every upgrade",
                rarity: "rare",
                dependencies: ["armor_boost_1"],
                effect: (player: BasePlayer) => {
                    player.increaseArmor(2);
                }
            },
            {
                id: "armor_boost_3",
                name: "Armor Boost 3",
                description: "+5 Armor per every upgrade",
                rarity: "epic",
                dependencies: ["armor_boost_2"],
                effect: (player: BasePlayer) => {
                    player.increaseArmor(5);
                }
            },
            {
                id: "armor_boost_4",
                name: "Armor Boost 4",
                description: "+8 Armor per every upgrade",
                rarity: "legendary",
                dependencies: ["armor_boost_3"],
                effect: (player: BasePlayer) => {
                    player.increaseArmor(8);
                }
            },

            // E skill cooldown reduction
            {
                id: "e_cooldown_1",
                name: "E Cooldown 1",
                description: "Reduce E skill cooldown by 20%",
                rarity: "common",
                requiredSkill: 'E',
                effect: (player: BasePlayer) => {
                    player.setECooldown(player.getOriginalECooldown() * 0.8);
                }
            },
            {
                id: "e_cooldown_2",
                name: "E Cooldown 2",
                description: "Reduce E skill cooldown by 35%",
                rarity: "rare",
                dependencies: ["e_cooldown_1"],
                requiredSkill: 'E',
                effect: (player: BasePlayer) => {
                    player.setECooldown(player.getOriginalECooldown() * 0.65);
                }
            },
            {
                id: "e_cooldown_3",
                name: "E Cooldown 3",
                description: "Reduce E skill cooldown by 60%",
                rarity: "epic",
                dependencies: ["e_cooldown_2"],
                requiredSkill: 'E',
                effect: (player: BasePlayer) => {
                    player.setECooldown(player.getOriginalECooldown() * 0.4);
                }
            },
            {
                id: "shield_absorb",
                name: "Shield Absorb",
                description: "E skill absorbs 50% of damage taken as health",
                rarity: "epic",
                dependencies: ["e_cooldown_2"],
                requiredSkill: 'E',
                effect: (player: BasePlayer) => {
                    player.setShieldAbsorbs(true);
                }
            },

            // R skill upgrades
            {
                id: "r_projectile_1",
                name: "R Skill Projectile 1",
                description: "Increase R skill projectiles by 1.5x",
                rarity: "rare",
                requiredSkill: 'R',
                effect: (player: BasePlayer) => {
                    player.setRProjectileMultiplier(1.5);
                },
                character: 'ranged'
            },
            {
                id: "r_projectile_2",
                name: "R Skill Projectile 2",
                description: "Increase R skill projectiles by 2x",
                rarity: "epic",
                dependencies: ["r_projectile_1"],
                requiredSkill: 'R',
                effect: (player: BasePlayer) => {
                    player.setRProjectileMultiplier(2);
                },
                character: 'ranged'
            },
            {
                id: "r_cooldown_1",
                name: "R Cooldown 1",
                description: "Reduce R skill cooldown by 20%",
                rarity: "common",
                requiredSkill: 'R',
                effect: (player: BasePlayer) => {
                    player.setRCooldown(player.getOriginalRCooldown() * 0.8);
                }
            },
            {
                id: "r_cooldown_2",
                name: "R Cooldown 2",
                description: "Reduce R skill cooldown by 35%",
                rarity: "rare",
                dependencies: ["r_cooldown_1"],
                requiredSkill: 'R',
                effect: (player: BasePlayer) => {
                    player.setRCooldown(player.getOriginalRCooldown() * 0.65);
                }
            },
            {
                id: "r_cooldown_3",
                name: "R Cooldown 3",
                description: "Reduce R skill cooldown by 60%",
                rarity: "epic",
                dependencies: ["r_cooldown_2"],
                requiredSkill: 'R',
                effect: (player: BasePlayer) => {
                    player.setRCooldown(player.getOriginalRCooldown() * 0.4);
                }
            },

            // F skill upgrades
            {
                id: "f_cooldown_1",
                name: "F Cooldown 1",
                description: "Reduce F skill cooldown by 25%",
                rarity: "rare",
                requiredSkill: 'F',
                effect: (player: BasePlayer) => {
                    player.setFCooldown(player.getOriginalFCooldown() * 0.75);
                }
            },
            {
                id: "f_cooldown_2",
                name: "F Cooldown 2",
                description: "Reduce F skill cooldown by 25%",
                rarity: "epic",
                dependencies: ["f_cooldown_1"],
                requiredSkill: 'F',
                effect: (player: BasePlayer) => {
                    player.setFCooldown(player.getOriginalFCooldown() * 0.5);
                }
            },

            // === NEW BALANCED DPS UPGRADES ===

            // Projectile speed (more damage from faster hits reaching enemies)
            {
                id: "swift_bolts",
                name: "Swift Bolts",
                description: "+30% projectile speed",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.increaseProjectileSpeedBonus(150);
                },
                character: 'ranged'
            },
            {
                id: "velocity_rounds",
                name: "Velocity Rounds",
                description: "+60% projectile speed",
                rarity: "rare",
                dependencies: ["swift_bolts"],
                effect: (player: BasePlayer) => {
                    player.increaseProjectileSpeedBonus(300);
                },
                character: 'ranged'
            },

            // Hybrid damage + survivability
            {
                id: "battle_focus",
                name: "Battle Focus",
                description: "+10% attack damage, +10% attack speed",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.increaseAttackDamageMultiplier(0.10);
                    player.setAttackCooldownMultiplier(0.9);
                }
            },
            {
                id: "war_tempo",
                name: "War Tempo",
                description: "+15% attack speed, +5% crit chance",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.setAttackCooldownMultiplier(0.85);
                    player.setCriticalStrikeChance(player.getCriticalStrikeChance() + 0.05);
                }
            },
            {
                id: "berserker_blood",
                name: "Berserker Blood",
                description: "+25% attack damage, -20 max HP",
                rarity: "rare",
                effect: (player: BasePlayer) => {
                    player.increaseAttackDamageMultiplier(0.25);
                    player.increaseMaxHealth(-20);
                }
            },
            {
                id: "precision_strikes",
                name: "Precision Strikes",
                description: "+10% crit chance, +20% crit damage",
                rarity: "rare",
                effect: (player: BasePlayer) => {
                    player.setCriticalStrikeChance(player.getCriticalStrikeChance() + 0.10);
                    player.setCriticalStrikeDamage(player.getCriticalStrikeDamage() + 0.20);
                }
            },
            {
                id: "glass_edge",
                name: "Glass Edge",
                description: "+35% attack damage, +25% attack speed, -40 max HP",
                rarity: "epic",
                effect: (player: BasePlayer) => {
                    player.increaseAttackDamageMultiplier(0.35);
                    player.setAttackCooldownMultiplier(0.75);
                    player.increaseMaxHealth(-40);
                }
            },
            {
                id: "steady_hands",
                name: "Steady Hands",
                description: "+1 projectile, +10% attack speed",
                rarity: "rare",
                effect: (player: BasePlayer) => {
                    player.increaseProjectileCount(1);
                    player.increaseMeleeAttackCount(1);
                    player.setAttackCooldownMultiplier(0.9);
                }
            },
            {
                id: "lethal_momentum",
                name: "Lethal Momentum",
                description: "+15% move speed, +15% attack damage",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.increaseMoveSpeed(0.15);
                    player.increaseAttackDamageMultiplier(0.15);
                }
            },
            {
                id: "iron_will",
                name: "Iron Will",
                description: "+75 max HP, +10% attack damage",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.increaseMaxHealth(75);
                    player.increaseAttackDamageMultiplier(0.10);
                }
            },
            {
                id: "adrenaline_rush",
                name: "Adrenaline Rush",
                description: "+30% attack speed, +10% move speed",
                rarity: "rare",
                effect: (player: BasePlayer) => {
                    player.setAttackCooldownMultiplier(0.7);
                    player.increaseMoveSpeed(0.1);
                }
            },
            {
                id: "executioner",
                name: "Executioner",
                description: "+25% crit damage, +15% attack damage",
                rarity: "epic",
                effect: (player: BasePlayer) => {
                    player.setCriticalStrikeDamage(player.getCriticalStrikeDamage() + 0.25);
                    player.increaseAttackDamageMultiplier(0.15);
                }
            },
            {
                id: "savage_blows",
                name: "Savage Blows",
                description: "+20% attack damage, +15% crit chance",
                rarity: "epic",
                effect: (player: BasePlayer) => {
                    player.increaseAttackDamageMultiplier(0.20);
                    player.setCriticalStrikeChance(player.getCriticalStrikeChance() + 0.15);
                }
            },
            {
                id: "overcharge",
                name: "Overcharge",
                description: "+2 projectiles, -15% attack speed",
                rarity: "epic",
                effect: (player: BasePlayer) => {
                    player.increaseProjectileCount(2);
                    player.increaseMeleeAttackCount(2);
                    player.setAttackCooldownMultiplier(1.15);
                },
            },
            {
                id: "death_dealer",
                name: "Death Dealer",
                description: "+50% attack damage, +30% crit damage",
                rarity: "legendary",
                effect: (player: BasePlayer) => {
                    player.increaseAttackDamageMultiplier(0.50);
                    player.setCriticalStrikeDamage(player.getCriticalStrikeDamage() + 0.30);
                }
            },

            // Melee-specific upgrades
            {
                id: "life_steal_1",
                name: "Life Steal",
                description: "Heal for 5% of damage dealt",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.setLifeSteal(0.05);
                },
                character: 'melee'
            },
            {
                id: "life_steal_2",
                name: "Life Steal 2",
                description: "Heal for 10% of damage dealt",
                rarity: "rare",
                dependencies: ["life_steal_1"],
                effect: (player: BasePlayer) => {
                    player.setLifeSteal(0.1);
                },
                character: 'melee'
            },
            {
                id: "attack_range_1",
                name: "Attack Range",
                description: "Increase attack range by 40%",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    if (player instanceof MeleePlayer) {
                        player.increaseAttackRange(0.4);
                    }
                },
                character: 'melee'
            },
            {
                id: "attack_range_2",
                name: "Attack Range 2",
                description: "Increase attack range by 60%",
                rarity: "rare",
                dependencies: ["attack_range_1"],
                effect: (player: BasePlayer) => {
                    if (player instanceof MeleePlayer) {
                        player.increaseAttackRange(0.6);
                    }
                },
                character: 'melee'
            },

            // XP Magnet upgrades
            {
                id: "xp_magnet_1",
                name: "XP Magnet",
                description: "Nearby XP orbs are pulled toward you (range: 200)",
                rarity: "common",
                effect: (player: BasePlayer) => {
                    player.setXPMagnetRange(200);
                }
            },
            {
                id: "xp_magnet_2",
                name: "XP Magnet 2",
                description: "Increase XP magnet range to 400",
                rarity: "rare",
                dependencies: ["xp_magnet_1"],
                effect: (player: BasePlayer) => {
                    player.setXPMagnetRange(400);
                }
            },
            {
                id: "xp_magnet_3",
                name: "XP Magnet 3",
                description: "Increase XP magnet range to 700",
                rarity: "epic",
                dependencies: ["xp_magnet_2"],
                effect: (player: BasePlayer) => {
                    player.setXPMagnetRange(700);
                }
            },

            // === MAGE-SPECIFIC UPGRADES ===
            {
                id: "mage_spell_amp_1",
                name: "Arcane Focus",
                description: "+30% spell amplification",
                rarity: "common",
                character: 'mage',
                effect: (player: BasePlayer) => {
                    if (player instanceof MagePlayer) {
                        player.increaseSpellAmplification(0.3);
                    }
                }
            },
            {
                id: "mage_spell_amp_2",
                name: "Arcane Mastery",
                description: "+50% spell amplification",
                rarity: "rare",
                dependencies: ["mage_spell_amp_1"],
                character: 'mage',
                effect: (player: BasePlayer) => {
                    if (player instanceof MagePlayer) {
                        player.increaseSpellAmplification(0.5);
                    }
                }
            },
            {
                id: "mage_chain_1",
                name: "Forked Lightning",
                description: "Chain Lightning hits +2 targets, +20% lightning damage",
                rarity: "common",
                requiredSkill: 'Q',
                character: 'mage',
                effect: (player: BasePlayer) => {
                    if (player instanceof MagePlayer) {
                        player.increaseChainLightningCount(2);
                        player.increaseLightningDamageMultiplier(0.2);
                    }
                }
            },
            {
                id: "mage_chain_2",
                name: "Storm Conductor",
                description: "Chain Lightning hits +3 more targets, 90% damage retention",
                rarity: "rare",
                dependencies: ["mage_chain_1"],
                requiredSkill: 'Q',
                character: 'mage',
                effect: (player: BasePlayer) => {
                    if (player instanceof MagePlayer) {
                        player.increaseChainLightningCount(3);
                        player.setChainLightningDamageRetention(0.90);
                    }
                }
            },
            {
                id: "mage_meteor_1",
                name: "Meteor Shower",
                description: "+3 meteor impacts",
                rarity: "rare",
                requiredSkill: 'R',
                character: 'mage',
                effect: (player: BasePlayer) => {
                    if (player instanceof MagePlayer) {
                        player.increaseMeteorCount(3);
                    }
                }
            },
            {
                id: "mage_meteor_2",
                name: "Cataclysm",
                description: "Burning ground +80% damage, duration, and area",
                rarity: "epic",
                dependencies: ["mage_meteor_1"],
                requiredSkill: 'R',
                character: 'mage',
                effect: (player: BasePlayer) => {
                    if (player instanceof MagePlayer) {
                        player.increaseBurningGroundMultiplier(0.8);
                    }
                }
            },

            // Lightning damage upgrades
            {
                id: "mage_lightning_power_1",
                name: "Thunderstrike",
                description: "+50% chain lightning damage",
                rarity: "common",
                requiredSkill: 'Q',
                character: 'mage',
                effect: (player: BasePlayer) => {
                    if (player instanceof MagePlayer) {
                        player.increaseLightningDamageMultiplier(0.5);
                    }
                }
            },
            {
                id: "mage_lightning_power_2",
                name: "Tempest",
                description: "+80% chain lightning damage",
                rarity: "rare",
                dependencies: ["mage_lightning_power_1"],
                requiredSkill: 'Q',
                character: 'mage',
                effect: (player: BasePlayer) => {
                    if (player instanceof MagePlayer) {
                        player.increaseLightningDamageMultiplier(0.8);
                    }
                }
            },
            {
                id: "mage_autocast_speed",
                name: "Rapid Incantation",
                description: "Chain Lightning cooldown -30%",
                rarity: "rare",
                requiredSkill: 'Q',
                character: 'mage',
                effect: (player: BasePlayer) => {
                    if (player instanceof MagePlayer) {
                        player.reduceQCooldown(0.7);
                    }
                }
            },

            // Mana upgrades
            {
                id: "mage_mana_pool_1",
                name: "Mana Well",
                description: "+50 max mana",
                rarity: "common",
                character: 'mage',
                effect: (player: BasePlayer) => {
                    player.applyStat('maxMana', 'add', 50);
                }
            },
            {
                id: "mage_mana_regen_1",
                name: "Meditation",
                description: "+3 mana regeneration per second",
                rarity: "rare",
                character: 'mage',
                effect: (player: BasePlayer) => {
                    player.applyStat('manaRegen', 'add', 3);
                }
            },
            {
                id: "mage_mana_efficiency",
                name: "Arcane Efficiency",
                description: "Reduce mana costs by 25%",
                rarity: "rare",
                character: 'mage',
                effect: (player: BasePlayer) => {
                    if (player instanceof MagePlayer) {
                        player.setManaCostReduction(0.25);
                    }
                }
            },

            // Teleport triggers chain lightning
            {
                id: "mage_teleport_lightning",
                name: "Lightning Blink",
                description: "Teleporting triggers Chain Lightning at your destination",
                rarity: "epic",
                dependencies: ["mage_chain_1"],
                requiredSkill: 'DASH',
                character: 'mage',
                effect: (player: BasePlayer) => {
                    if (player instanceof MagePlayer) {
                        player.setTeleportCastsQ(true);
                    }
                }
            },

            // Basic attacks trigger chain lightning
            {
                id: "mage_attack_lightning",
                name: "Static Discharge",
                description: "Basic attacks trigger Chain Lightning on hit",
                rarity: "epic",
                dependencies: ["mage_lightning_power_1"],
                character: 'mage',
                effect: (player: BasePlayer) => {
                    if (player instanceof MagePlayer) {
                        player.setAttackCastsQ(true);
                    }
                }
            }
        ];
    }

    public getRandomUpgrades(count: number): Upgrade[] {
        const player = this.scene.getPlayer();
        let characterType: 'ranged' | 'melee' | 'mage';
        if (player instanceof MagePlayer) {
            characterType = 'mage';
        } else if (player instanceof RangedPlayer) {
            characterType = 'ranged';
        } else {
            characterType = 'melee';
        }

        const available = this.availableUpgrades.filter(upgrade => {
            if (upgrade.dependencies && !upgrade.dependencies.every(dep => this.appliedUpgrades.some(applied => applied.id === dep))) {
                return false;
            }
            if (upgrade.requiredSkill) {
                let skillUnlocked = false;
                switch (upgrade.requiredSkill) {
                    case 'Q': skillUnlocked = player.isQSkillUnlocked(); break;
                    case 'E': skillUnlocked = player.isESkillUnlocked(); break;
                    case 'R': skillUnlocked = player.isRSkillUnlocked(); break;
                    case 'F': skillUnlocked = player.isFSkillUnlocked(); break;
                    case 'DASH': skillUnlocked = player.isDashSkillUnlocked(); break;
                    default: skillUnlocked = true;
                }
                if (!skillUnlocked) {
                    return false;
                }
            }
            if (upgrade.character && upgrade.character !== characterType) {
                return false;
            }
            return true;
        });

        const weightedUpgrades = available.flatMap(upgrade => {
            const weight = RARITY_WEIGHTS[upgrade.rarity] || 1;
            return Array(weight).fill(upgrade);
        });

        const shuffled = [...weightedUpgrades].sort(() => 0.5 - Math.random());

        const selectedUpgrades: Upgrade[] = [];
        const selectedIds = new Set<string>();

        for (const upgrade of shuffled) {
            if (selectedUpgrades.length >= count) {
                break;
            }
            if (!selectedIds.has(upgrade.id)) {
                selectedUpgrades.push(upgrade);
                selectedIds.add(upgrade.id);
            }
        }

        return selectedUpgrades;
    }

    public reapplyUpgrades(player: BasePlayer) {
        let characterType: 'ranged' | 'melee' | 'mage';
        if (player instanceof MagePlayer) {
            characterType = 'mage';
        } else if (player instanceof RangedPlayer) {
            characterType = 'ranged';
        } else {
            characterType = 'melee';
        }

        if (player instanceof MeleePlayer) {
            player.resetMeleeMultipliers();
        }
        if (player instanceof MagePlayer) {
            player.resetMageMultipliers();
        }

        this.appliedUpgrades.forEach(upgrade => {
            if (!upgrade.character || upgrade.character === characterType) {
                upgrade.effect(player);
            }
        });
    }

    public applyUpgrade(upgrade: Upgrade) {
        const player = this.scene.getPlayer();
        if (player) {
            this.appliedUpgrades.push(upgrade);
            this.availableUpgrades = this.availableUpgrades.filter(u => u.id !== upgrade.id);

            upgrade.effect(player);
            player.recalculateStats();

            // Check synergies
            try {
                const synergyManager = this.scene.getSynergyManager();
                if (synergyManager) {
                    synergyManager.checkSynergies(this.appliedUpgrades, player);
                }
            } catch (_e) { /* synergy manager not ready */ }
        }
    }

    public getAppliedUpgrades(): Upgrade[] {
        return this.appliedUpgrades;
    }

    public getUpgradeCount(): number {
        return this.appliedUpgrades.length;
    }

    public getRarityColor(rarity: string): string {
        switch (rarity) {
            case 'common': return '#ffffff';
            case 'rare': return '#0088ff';
            case 'epic': return '#aa00ff';
            case 'legendary': return '#ffaa00';
            default: return '#ffffff';
        }
    }
}
