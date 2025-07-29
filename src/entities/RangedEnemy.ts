import { BaseEnemy } from './BaseEnemy';
import { EnemyProjectile } from './EnemyProjectile';

export class RangedEnemy extends BaseEnemy {
    private shootTimer: number = 0;
    private shootCooldown: number = 2000; // 2 seconds
    private shootRange: number = 1000; // Distance to start shooting
    private shootSpeed: number = 150; // Speed of the projectile

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        
        // Set multiplier and recalculate health
        this.baseHealthMultiplier = 0.7; // Ranged has 0.7x base HP
        this.calculateHealth();
        
        // Override properties for ranged enemy
        this.moveSpeed = 60; // Normal speed
        this.damage = 12; // Lower damage (ranged)
        this.xpValue = 30; // Medium XP
        
        // Make ranged enemy smaller
        this.sprite.setSize(28, 28);
    }

    protected customUpdate(time: number, delta: number): void {
        this.shootTimer += delta;
        
        // Check if player is in range and shoot
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        const player = gameScene.getPlayer();
        
        if (player && player.isAlive()) {
            const dx = player.getX() - this.x;
            const dy = player.getY() - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.shootRange && this.shootTimer >= this.shootCooldown) {
                this.shoot();
                this.shootTimer = 0;
            }
        }
    }

    private shoot() {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        const player = gameScene.getPlayer();
        
        if (player && player.isAlive()) {
            // Calculate direction to player
            const dx = player.getX() - this.x;
            const dy = player.getY() - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const angle = Math.atan2(dy, dx);
                
                // Create enemy projectile
                const projectile = new EnemyProjectile(
                    scene,
                    this.x,
                    this.y,
                    angle,
                    this.damage, // damage
                    this.shootSpeed // speed
                );
                
                gameScene.getEnemyProjectiles().add(projectile);
            }
        }
    }

    protected getEnemyColor(): number {
        return 0x4169E1; // Blue color for ranged enemy
    }
} 