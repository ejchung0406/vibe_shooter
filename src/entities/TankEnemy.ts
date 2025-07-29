import { BaseEnemy } from './BaseEnemy';

export class TankEnemy extends BaseEnemy {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        
        // Set multiplier and recalculate health
        this.baseHealthMultiplier = 2.5; // Tank has 2.5x base HP
        this.calculateHealth();
        
        // Override properties for tank enemy
        this.moveSpeed = 30; // Very slow
        this.damage = 25; // High damage
        this.xpValue = 30; // More XP for killing tank
        
        // Make tank bigger
        this.sprite.setSize(32, 32);
        this.setScale(1.3);
    }

    protected customUpdate(time: number, delta: number): void {
        // Tank-specific behavior (none for now)
    }

    protected getEnemyColor(): number {
        return 0x8B4513; // Brown color for tank
    }
} 