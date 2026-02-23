import Phaser from 'phaser';
import { GameSceneInterface } from '../types/GameSceneInterface';

export class ExplosiveProjectile extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Rectangle;
    private velocityX: number = 0;
    private velocityY: number = 0;
    private damage: number = 20;
    private piercing: boolean = false;
    private lifetime: number = 3000;
    private age: number = 0;
    private explosionRadius: number = 120; // Increased from 80 (1.5x)
    private explosiveDamageMultiplier: number = 1;
    private explosiveBossDamageMultiplier: number = 1;
    private isCritical: boolean = false;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        damage: number,
        speed: number,
        angle: number,
        explosiveDamageMultiplier: number,
        explosiveBossDamageMultiplier: number,
        piercing: boolean = false,
        isCritical: boolean = false
    ) {
        super(scene, x, y);
        
        this.damage = damage;
        this.piercing = piercing;
        this.isCritical = isCritical;
        
        // Create explosive projectile visual (circle + inner core + sparks)
        const glow = scene.add.graphics();
        glow.fillStyle(0xff6600, 0.3);
        glow.fillCircle(0, 0, 12);
        this.add(glow);
        this.sprite = scene.add.rectangle(0, 0, 12, 12, 0xff4400);
        this.sprite.setStrokeStyle(2, 0xff8800);
        this.add(this.sprite);
        const core = scene.add.graphics();
        core.fillStyle(0xff0000, 0.8);
        core.fillCircle(0, 0, 4);
        // Spark lines
        core.lineStyle(1, 0xffaa00, 0.7);
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            core.beginPath();
            core.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
            core.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
            core.strokePath();
        }
        this.add(core);
        
        // Set velocity based on angle
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;

        this.explosiveDamageMultiplier = explosiveDamageMultiplier;
        this.explosiveBossDamageMultiplier = explosiveBossDamageMultiplier;
        
        // Add physics body
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(this.velocityX, this.velocityY);
        body.setCollideWorldBounds(true);
        (this.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;
        
        scene.add.existing(this);
        
        // Setup collision detection
        this.setupCollisions();
        
        // Add pulsing effect to show it's special
        scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    update(_time: number, delta: number) {
        this.age += delta;
        
        // Destroy if too old
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }
        
        // Update position
        this.x += this.velocityX * (delta / 1000);
        this.y += this.velocityY * (delta / 1000);
    }

    private setupCollisions() {
        const gameScene = this.scene as GameSceneInterface;

        const onWorldBounds = (body: any) => {
            if (body.gameObject === this) {
                this.destroy();
            }
        };
        this.scene.physics.world.on('worldbounds', onWorldBounds);

        // Clean up listener when destroyed to prevent memory leak
        this.on('destroy', () => {
            gameScene.physics?.world?.off('worldbounds', onWorldBounds);
        });

        // Check collision with enemies
        gameScene.physics.add.overlap(
            this,
            gameScene.getEnemies(),
            this.onEnemyHit,
            undefined,
            this
        );
    }

    private onEnemyHit(_projectile: any, _enemy: any) {
        // Create explosion at impact point
        this.createExplosion();
        
        // Destroy projectile
        this.destroy();
    }

    private createExplosion() {
        const gameScene = this.scene as GameSceneInterface;

        // Create explosion visual effect
        const explosion = gameScene.add.circle(this.x, this.y, this.explosionRadius, 0xff4400, 0.6);
        explosion.setStrokeStyle(4, 0xff8800);
        
        // Animate explosion
        gameScene.tweens.add({
            targets: explosion,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => explosion.destroy()
        });
        
        // Damage all enemies in explosion radius
        const enemies = gameScene.getEnemies().getChildren();
        enemies.forEach((enemy: any) => {
            if (enemy.body) {
                const hitbox = enemy.body as Phaser.Physics.Arcade.Body;
                
                // Find the closest point on the hitbox to the explosion center
                const closestX = Phaser.Math.Clamp(this.x, hitbox.left, hitbox.right);
                const closestY = Phaser.Math.Clamp(this.y, hitbox.top, hitbox.bottom);
                
                const dx = closestX - this.x;
                const dy = closestY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.explosionRadius) {
                    // Deal damage to enemy
                    let damage = this.damage * this.explosiveDamageMultiplier;
                    if (enemy.isBossEnemy()) { 
                        damage *= this.explosiveBossDamageMultiplier;
                    }
                    enemy.takeDamage(damage, this.isCritical);
                    
                    // Add knockback effect
                    if (distance > 0) {
                        const knockbackForce = 8;
                        const knockbackX = (dx / distance) * knockbackForce;
                        const knockbackY = (dy / distance) * knockbackForce;
                        
                        enemy.x += knockbackX;
                        enemy.y += knockbackY;
                    }
                }
            }
        });
        
        // Create particle effects
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = gameScene.add.rectangle(
                this.x + Math.cos(angle) * 20,
                this.y + Math.sin(angle) * 20,
                6,
                6,
                0xff6600
            );
            
            gameScene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * 60,
                y: particle.y + Math.sin(angle) * 60,
                alpha: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    public getDamage() {
        return this.damage;
    }

    public isPiercing() {
        return this.piercing;
    }  
} 