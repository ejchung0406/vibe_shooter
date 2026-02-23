import { BaseEnemy } from './BaseEnemy';
import { EnemyProjectile } from './EnemyProjectile';
import { GameSceneInterface } from '../types/GameSceneInterface';

export class RangedEnemy extends BaseEnemy {
    private shootTimer: number = 0;
    private shootCooldown: number = 2000; // 2 seconds
    private shootRange: number = 1000; // Distance to start shooting
    private shootSpeed: number = 150; // Speed of the projectile

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.baseHealthMultiplier = 0.7;
        this.calculateHealth();

        this.moveSpeed = 60;
        this.damage = 12;
        this.xpValue = 30;

        this.sprite.setSize(28, 28);
    }

    protected createVisual(): void {
        const g = this.scene.add.graphics();
        // Crosshair overlay (top-down targeting)
        g.lineStyle(1, 0xaaddff, 0.6);
        g.strokeCircle(0, 0, 8);
        g.beginPath();
        g.moveTo(0, -10); g.lineTo(0, 10);
        g.moveTo(-10, 0); g.lineTo(10, 0);
        g.strokePath();
        // Crescent bow on back (bottom = back in top-down)
        g.lineStyle(2.5, 0x2244aa);
        g.beginPath();
        g.arc(0, 10, 8, Math.PI + Math.PI / 4, Math.PI * 2 - Math.PI / 4);
        g.strokePath();
        // Quiver dots on right side
        g.fillStyle(0x886644);
        g.fillCircle(10, 2, 2);
        g.fillCircle(10, -2, 2);
        g.fillCircle(10, 6, 2);
        this.add(g);
    }

    protected customUpdate(_time: number, delta: number): void {
        this.shootTimer += delta;

        // Check if player is in range and shoot
        const gameScene = this.scene as GameSceneInterface;
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
        const gameScene = this.scene as GameSceneInterface;
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
                    gameScene,
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