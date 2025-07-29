import Phaser from 'phaser';

export class ExplosiveProjectile extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Rectangle;
    private velocityX: number = 0;
    private velocityY: number = 0;
    private damage: number = 20;
    private speed: number = 300;
    private piercing: boolean = false;
    private lifetime: number = 3000;
    private age: number = 0;
    private explosionRadius: number = 120; // Increased from 80 (1.5x)
    private explosiveDamageMultiplier: number = 1;
    private explosiveBossDamageMultiplier: number = 1;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        damage: number,
        speed: number,
        angle: number,
        piercing: boolean = false
    ) {
        super(scene, x, y);
        
        this.damage = damage;
        this.speed = speed;
        this.piercing = piercing;
        
        // Create larger explosive projectile sprite (orange/red)
        this.sprite = scene.add.rectangle(0, 0, 16, 16, 0xff4400);
        this.sprite.setStrokeStyle(2, 0xff8800);
        this.add(this.sprite);
        
        // Set velocity based on angle
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
        
        // Add physics body
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(this.velocityX, this.velocityY);
        
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

    update(time: number, delta: number) {
        this.age += delta;
        
        // Destroy if too old
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }
        
        // Update position
        this.x += this.velocityX * (delta / 1000);
        this.y += this.velocityY * (delta / 1000);
        
        // Destroy if out of map bounds
        const mapBounds = 2000;
        if (this.x < -mapBounds || this.x > mapBounds || this.y < -mapBounds || this.y > mapBounds) {
            this.destroy();
        }
    }

    private setupCollisions() {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        
        // Check collision with enemies
        scene.physics.add.overlap(
            this,
            gameScene.getEnemies(),
            this.onEnemyHit,
            undefined,
            this
        );
    }

    private onEnemyHit(projectile: any, enemy: any) {
        // Create explosion at impact point
        this.createExplosion();
        
        // Destroy projectile
        this.destroy();
    }

    private createExplosion() {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        
        // Create explosion visual effect
        const explosion = scene.add.circle(this.x, this.y, this.explosionRadius, 0xff4400, 0.6);
        explosion.setStrokeStyle(4, 0xff8800);
        
        // Animate explosion
        scene.tweens.add({
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
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.explosionRadius) {
                // Deal damage to enemy
                let damage = this.damage * this.explosiveDamageMultiplier;
                if (enemy.isBossEnemy()) {
                    damage *= this.explosiveBossDamageMultiplier;
                }
                enemy.takeDamage(damage);
                
                // Add knockback effect
                if (distance > 0) {
                    const knockbackForce = 80;
                    const knockbackX = (dx / distance) * knockbackForce;
                    const knockbackY = (dy / distance) * knockbackForce;
                    
                    enemy.x += knockbackX;
                    enemy.y += knockbackY;
                }
            }
        });
        
        // Create particle effects
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = scene.add.rectangle(
                this.x + Math.cos(angle) * 20,
                this.y + Math.sin(angle) * 20,
                6,
                6,
                0xff6600
            );
            
            scene.tweens.add({
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

    public getExplosiveDamageMultiplier() {
        return this.explosiveDamageMultiplier;
    }

    public setExplosiveDamageMultiplier(multiplier: number) {
        this.explosiveDamageMultiplier = multiplier;
    }

    public getExplosiveBossDamageMultiplier() {
        return this.explosiveBossDamageMultiplier;
    }

    public setExplosiveBossDamageMultiplier(multiplier: number) {
        this.explosiveBossDamageMultiplier = multiplier;
    }
} 