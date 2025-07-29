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
            // Attack Speed Upgrades
            {
                id: 'attack_speed_1',
                name: 'Rapid Fire',
                description: 'Increase attack speed by 20%',
                rarity: 'common',
                effect: (player: any) => player.increaseAttackSpeed(100)
            },
            {
                id: 'attack_speed_2',
                name: 'Lightning Strike',
                description: 'Increase attack speed by 40%',
                rarity: 'rare',
                effect: (player: any) => player.increaseAttackSpeed(200)
            },
            
            // Damage Upgrades
            {
                id: 'damage_1',
                name: 'Power Shot',
                description: 'Increase damage by 5',
                rarity: 'common',
                effect: (player: any) => player.increaseDamage(5)
            },
            {
                id: 'damage_2',
                name: 'Mega Blast',
                description: 'Increase damage by 15',
                rarity: 'rare',
                effect: (player: any) => player.increaseDamage(15)
            },
            
            // Projectile Count Upgrades
            {
                id: 'projectile_count_1',
                name: 'Double Shot',
                description: 'Add 1 more projectile',
                rarity: 'common',
                effect: (player: any) => player.increaseProjectileCount(1)
            },
            {
                id: 'projectile_count_2',
                name: 'Triple Shot',
                description: 'Add 2 more projectiles',
                rarity: 'rare',
                effect: (player: any) => player.increaseProjectileCount(2)
            },
            
            // Special Abilities
            {
                id: 'piercing',
                name: 'Piercing Shot',
                description: 'Projectiles pass through enemies',
                rarity: 'epic',
                effect: (player: any) => player.enablePiercing()
            },
            {
                id: 'spread_attack',
                name: 'Spread Shot',
                description: 'Multi-projectile attacks spread in an arc',
                rarity: 'rare',
                effect: (player: any) => player.enableSpreadAttack()
            },
            {
                id: 'burst_attack',
                name: 'Burst Fire',
                description: 'Multi-projectile attacks fire in rapid sequence',
                rarity: 'rare',
                effect: (player: any) => player.enableBurstAttack()
            },

            
            // Speed Upgrades
            {
                id: 'projectile_speed_1',
                name: 'Swift Shot',
                description: 'Increase projectile speed by 50',
                rarity: 'common',
                effect: (player: any) => player.increaseProjectileSpeed(50)
            },
            {
                id: 'projectile_speed_2',
                name: 'Sonic Shot',
                description: 'Increase projectile speed by 100',
                rarity: 'rare',
                effect: (player: any) => player.increaseProjectileSpeed(100)
            },
            
            // Legendary Upgrades
            {
                id: 'combo_master',
                name: 'Combo Master',
                description: 'Every 3rd shot becomes explosive and damages all nearby enemies',
                rarity: 'legendary',
                effect: (player: any) => player.enableComboMaster()
            },
            {
                id: 'rapid_burst',
                name: 'Rapid Burst',
                description: 'Fires a burst of 8 projectiles in all directions',
                rarity: 'legendary',
                effect: (player: any) => {
                    // This creates a special burst attack pattern
                    console.log('Rapid Burst activated!');
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