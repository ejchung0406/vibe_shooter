import { GameScene } from '../scenes/GameScene';

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    dependencies?: string[];
    effect: (player: any) => void;
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
                effect: (player: any) => {
                    player.projectileCount++;
                }
            },
            {
                id: "triple_shot",
                name: "Triple Shot", 
                description: "Add 2 more projectiles",
                rarity: "rare",
                effect: (player: any) => {
                    player.projectileCount += 2;
                }
            },
            {
                id: "quad_shot",
                name: "Quadruple Shot", 
                description: "Add 3 more projectiles",
                rarity: "epic",
                effect: (player: any) => {
                    player.projectileCount += 3;
                }
            },
            {
                id: "combo_master",
                name: "Combo Master",
                description: "Every 3rd shot becomes explosive",
                rarity: "epic",
                effect: (player: any) => {
                    player.enableComboMaster();
                }
            },
            {
                id: "advanced_combo",
                name: "Advanced Combo",
                description: "Every 2nd shot becomes a combo attack",
                rarity: "legendary",
                dependencies: ["combo_master"],
                effect: (player: any) => {
                    player.enableAdvancedCombo();
                }
            },
            
            // Stat improvements
            {
                id: "rapid_fire",
                name: "Rapid Fire",
                description: "+20% attack speed",
                rarity: "common",
                effect: (player: any) => {
                    player.attackCooldown *= 0.8;
                }
            },
            {
                id: "lightning_strike",
                name: "Lightning Strike", 
                description: "+40% attack speed",
                rarity: "rare",
                effect: (player: any) => {
                    player.attackCooldown *= 0.6;
                }
            },
            {
                id: "power_shot",
                name: "Power Shot",
                description: "+10 damage",
                rarity: "common",
                effect: (player: any) => {
                    player.attackDamage += 10;
                }
            },
            {
                id: "power_shot_2",
                name: "Power Shot 2",
                description: "+20 damage",
                rarity: "rare",
                dependencies: ["power_shot"],
                effect: (player: any) => {
                    player.attackDamage += 20;
                }
            },
            {
                id: "power_shot_3",
                name: "Power Shot 3",
                description: "+30 damage",
                rarity: "epic",
                dependencies: ["power_shot_2"],
                effect: (player: any) => {
                    player.attackDamage += 30;
                }
            },
            {
                id: "mega_blast",
                name: "Mega Blast",
                description: "+50 damage", 
                rarity: "rare",
                dependencies: ["power_shot_3"],
                effect: (player: any) => {
                    player.attackDamage += 50;  
                }
            },
            {
                id: "piercing_shot",
                name: "Piercing Shot",
                description: "Projectiles pass through enemies",
                rarity: "epic",
                effect: (player: any) => {
                    player.piercing = true;
                }
            },

            // Q Skill improvements
            {
                id: "double_q",
                name: "Double Homing",
                description: "Double the number of projectiles from Q",
                rarity: "rare",
                effect: (player: any) => {
                    player.setQSkillHomingMultiplier(2);
                }
            },
            {
                id: "triple_q",
                name: "Triple Homing",
                description: "Triple the number of projectiles from Q",
                rarity: "epic",
                dependencies: ["double_q"],
                effect: (player: any) => {
                    const currentMultiplier = player.getQSkillHomingMultiplier();
                    player.setQSkillHomingMultiplier(currentMultiplier * 3);
                }
            },
            {
                id: "triple_q_2",
                name: "Triple Homing 2",
                description: "Triple the number of projectiles from Q",
                rarity: "epic",
                dependencies: ["triple_q"],
                effect: (player: any) => {
                    const currentMultiplier = player.getQSkillHomingMultiplier();
                    player.setQSkillHomingMultiplier(currentMultiplier * 3);    
                }
            },



            // Combo Master
            {
                id: "wombo_combo_master",
                name: "Wombo Combo Master",
                description: "Explosive shot deals 1.5x damage to enemies",
                rarity: "epic",
                dependencies: ["combo_master"],
                effect: (player: any) => {
                    player.setExplosiveDamageMultiplier(1.5);
                }
            },
            {
                id: "wombo_combo_master_2",
                name: "Wombo Combo Master 2",
                description: "Explosive shot deals 2x damage to enemies",
                rarity: "legendary",
                dependencies: ["wombo_combo_master"],
                effect: (player: any) => {
                    const currentMultiplier = player.getExplosiveDamageMultiplier();
                    player.setExplosiveDamageMultiplier(currentMultiplier * 2);
                }
            },
            {
                id: "combo_killer",
                name: "Combo Killer",
                description: "Explosive shot deals 5x damage to bosses",
                rarity: "legendary",
                dependencies: ["combo_master"],
                effect: (player: any) => {
                    player.setExplosiveBossDamageMultiplier(5);
                }
            },

            // Character HP
            { 
                id: "hp_boost",
                name: "HP Boost",
                description: "+50 max HP",
                rarity: "common",
                effect: (player: any) => {
                    player.maxHealth += 50;
                }
            },
            {
                id: "hp_boost_2",
                name: "HP Boost 2",
                description: "+100 max HP",
                rarity: "rare",
                dependencies: ["hp_boost"],
                effect: (player: any) => {
                    player.maxHealth += 100;
                }
            },
            {
                id: "heal_over_time",
                name: "Heal Over Time",
                description: "Heal 2 HP every 1 second",
                rarity: "epic",
                effect: (player: any) => {
                    player.healOverTime = true;
                }
            },
            {
                id: "instant_heal",
                name: "Instant Heal",
                description: "Heal 30% of max HP",
                rarity: "common",
                effect: (player: any) => {
                    player.heal(player.maxHealth * 0.3);
                }
            },
            {
                id: "instant_heal_2",
                name: "Instant Heal 2",
                description: "Heal 50% of max HP",
                rarity: "rare",
                dependencies: ["instant_heal"],
                effect: (player: any) => {
                    player.heal(player.maxHealth * 0.5);
                }
            },

            // Critical strike
            {
                id: "critical_strike",
                name: "Critical Strike",
                description: "Critical strike chance 30%",
                rarity: "common",
                effect: (player: any) => {
                    player.setCriticalStrikeChance(0.3);
                }
            },
            {
                id: "critical_strike_2",
                name: "Critical Strike 2",
                description: "Critical strike chance 50%",
                rarity: "rare",
                dependencies: ["critical_strike"],
                effect: (player: any) => {
                    player.setCriticalStrikeChance(0.5);
                }
            },
            {
                id: "critical_strike_3",
                name: "Critical Strike 3",
                description: "Critical strike chance 70%",
                rarity: "epic",
                dependencies: ["critical_strike_2"],
                effect: (player: any) => {
                    player.setCriticalStrikeChance(0.7);
                }
            },
            {
                id: "critical_damage",
                name: "Critical Damage",
                description: "Critical strike damage +30%",
                rarity: "common",
                dependencies: ["critical_strike"],
                effect: (player: any) => {
                    player.setCriticalStrikeDamage(player.getCriticalStrikeDamage() + 0.3);
                }
            },
            {
                id: "critical_damage_2",
                name: "Critical Damage 2",
                description: "Critical strike damage +50%",
                rarity: "rare",
                dependencies: ["critical_damage"],
                effect: (player: any) => {
                    player.setCriticalStrikeDamage(player.getCriticalStrikeDamage() + 0.5);
                }
            },
            {
                id: "critical_damage_3",
                name: "Critical Damage 3",
                description: "Critical strike damage +80%",
                rarity: "epic",
                dependencies: ["critical_damage_2"],
                effect: (player: any) => {
                    player.setCriticalStrikeDamage(player.getCriticalStrikeDamage() + 0.8);
                }
            },
            {
                id: "critical_damage_4",
                name: "Critical Damage 4",
                description: "Critical strike damage +120%",
                rarity: "legendary",
                dependencies: ["critical_damage_3"],
                effect: (player: any) => {
                    player.setCriticalStrikeDamage(player.getCriticalStrikeDamage() + 1.2);
                }
            },

            // New skills
            {
                id: "exp_boost",
                name: "EXP Boost",
                description: "Gain 20% more experience from normal enemies",
                rarity: "rare",
                effect: (player: any) => {
                    player.setXPMultiplier(player.getXPMultiplier() + 0.2);
                }
            },
            {
                id: "q_damage_boost",
                name: "Q Damage Boost",
                description: "Q skill deals 2x damage to normal enemies",
                rarity: "epic",
                effect: (player: any) => {
                    player.setQDamageToNormalMultiplier(2);
                }
            },
            {
                id: "spawn_increase",
                name: "Swarm",
                description: "Increase enemy spawn rate by 1.5x",
                rarity: "legendary",
                effect: (player: any) => {
                    const enemySpawner = (this.scene as any).getEnemySpawner();
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
                effect: (player: any) => {
                    player.setESkillHeals(true);
                }
            },

            // Armor upgrades
            {
                id: "armor_boost_1",
                name: "Armor Boost",
                description: "+5 Armor",
                rarity: "common",
                effect: (player: any) => {
                    player.increaseArmor(5);
                }
            },
            {
                id: "armor_boost_2",
                name: "Armor Boost 2",
                description: "+10 Armor",
                rarity: "rare",
                dependencies: ["armor_boost_1"],
                effect: (player: any) => {
                    player.increaseArmor(10);
                }
            },
            {
                id: "armor_boost_3",
                name: "Armor Boost 3",
                description: "+20 Armor",
                rarity: "epic",
                dependencies: ["armor_boost_2"],
                effect: (player: any) => {
                    player.increaseArmor(20);
                }
            },
            {
                id: "armor_boost_4",
                name: "Armor Boost 4",
                description: "+50 Armor",
                rarity: "legendary",
                dependencies: ["armor_boost_3"],
                effect: (player: any) => {
                    player.increaseArmor(50);
                }
            },

            // E skill cooldown reduction
            {
                id: "e_cooldown_1",
                name: "E Cooldown 1",
                description: "Reduce E skill cooldown by 20%",
                rarity: "common",
                effect: (player: any) => {
                    player.setECooldown(player.getOriginalECooldown() * 0.8);
                }
            },
            {
                id: "e_cooldown_2",
                name: "E Cooldown 2",
                description: "Reduce E skill cooldown by 35%",
                rarity: "rare",
                dependencies: ["e_cooldown_1"],
                effect: (player: any) => {
                    player.setECooldown(player.getOriginalECooldown() * 0.65);
                }
            },
            {
                id: "e_cooldown_3",
                name: "E Cooldown 3",
                description: "Reduce E skill cooldown by 60%",
                rarity: "epic",
                dependencies: ["e_cooldown_2"],
                effect: (player: any) => {
                    player.setECooldown(player.getOriginalECooldown() * 0.4);
                }
            },
            {
                id: "shield_absorb",
                name: "Shield Absorb",
                description: "E skill absorbs 50% of damage taken as health",
                rarity: "epic",
                dependencies: ["e_cooldown_2"],
                effect: (player: any) => {
                    player.setShieldAbsorbs(true);
                }
            },

            // R skill upgrades
            {
                id: "r_projectile_1",
                name: "R Skill Projectile 1",
                description: "Increase R skill projectiles by 1.5x",
                rarity: "rare",
                effect: (player: any) => {
                    player.setRProjectileMultiplier(1.5);
                }
            },
            {
                id: "r_projectile_2",
                name: "R Skill Projectile 2",
                description: "Increase R skill projectiles by 2x",
                rarity: "epic",
                dependencies: ["r_projectile_1"],
                effect: (player: any) => {
                    player.setRProjectileMultiplier(2);
                }
            },
            {
                id: "r_cooldown_1",
                name: "R Cooldown 1",
                description: "Reduce R skill cooldown by 20%",
                rarity: "common",
                effect: (player: any) => {
                    player.setRCooldown(player.getOriginalRCooldown() * 0.8);
                }
            },
            {
                id: "r_cooldown_2",
                name: "R Cooldown 2",
                description: "Reduce R skill cooldown by 35%",
                rarity: "rare",
                dependencies: ["r_cooldown_1"],
                effect: (player: any) => {
                    player.setRCooldown(player.getOriginalRCooldown() * 0.65);
                }
            },
            {
                id: "r_cooldown_3",
                name: "R Cooldown 3",
                description: "Reduce R skill cooldown by 60%",
                rarity: "epic",
                dependencies: ["r_cooldown_2"],
                effect: (player: any) => {
                    player.setRCooldown(player.getOriginalRCooldown() * 0.4);
                }
            }
        ];
    }

    public getRandomUpgrades(count: number): Upgrade[] {
        const available = this.availableUpgrades.filter(upgrade => {
            if (!upgrade.dependencies) {
                return true;
            }
            return upgrade.dependencies.every(dep =>
                this.appliedUpgrades.some(applied => applied.id === dep)
            );
        });

        const weightedUpgrades = available.flatMap(upgrade => {
            const weight = this.getWeightForRarity(upgrade.rarity);
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

    private getWeightForRarity(rarity: 'common' | 'rare' | 'epic' | 'legendary'): number {
        switch (rarity) {
            case 'common':
                return 10;
            case 'rare':
                return 5;
            case 'epic':
                return 2;
            case 'legendary':
                return 1;
            default:
                return 1;
        }
    }

    public applyUpgrade(upgrade: Upgrade) {
        const player = this.scene.getPlayer();
        if (player) {
            upgrade.effect(player);
            this.appliedUpgrades.push(upgrade);
            
            // Remove from available upgrades to prevent duplicates
            this.availableUpgrades = this.availableUpgrades.filter(u => u.id !== upgrade.id);
            
            console.log(`Applied upgrade: ${upgrade.name}`);
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