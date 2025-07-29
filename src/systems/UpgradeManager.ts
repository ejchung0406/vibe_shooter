import { GameScene } from '../scenes/GameScene';

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
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
                description: "+5 damage",
                rarity: "common",
                effect: (player: any) => {
                    player.attackDamage += 5;
                }
            },
            {
                id: "mega_blast",
                name: "Mega Blast",
                description: "+15 damage", 
                rarity: "rare",
                effect: (player: any) => {
                    player.attackDamage += 15;
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

            // Skill improvements
            {
                id: "auto_q",
                name: "Double Homing",
                description: "Double the number of projectiles from Q",
                rarity: "epic",
                effect: (player: any) => {
                    player.setQSkillHomingMultiplier(2);
                }
            },
            {
                id: "wombo_combo_master",
                name: "Wombo Combo Master",
                description: "Explosive shot deals 1.5x damage to enemies",
                rarity: "epic",
                effect: (player: any) => {
                    player.setExplosiveDamageMultiplier(1.5);
                }
            },
            {
                id: "combo_killer",
                name: "Combo Killer",
                description: "Explosive shot deals 5x damage to bosses",
                rarity: "legendary",
                effect: (player: any) => {
                    player.setExplosiveBossDamageMultiplier(5);
                }
            }
        ];
    }

    public getRandomUpgrades(count: number): Upgrade[] {
        const shuffled = [...this.availableUpgrades].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, shuffled.length));
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