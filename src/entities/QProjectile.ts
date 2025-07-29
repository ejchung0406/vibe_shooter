import Phaser from 'phaser';

export class QProjectile extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Rectangle;
    private damage: number = 8;
    private lifetime: number = 1000; // Increased lifetime for acceleration
    private age: number = 0;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        damage: number,
        targetX: number,
        targetY: number
    ) {
        super(scene, x, y);
        
        this.damage = damage;
        
        // Create projectile sprite (yellow for Q skill)
        this.sprite = scene.add.rectangle(0, 0, 6, 6, 0xffff00);
        this.add(this.sprite);
        
        // Add physics body
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(6, 6);
        body.setOffset(-3, -3);
        
        // Calculate direction to target
        const angle = Math.atan2(targetY - y, targetX - x);
        const initialSpeed = 200;
        const acceleration = 1500;
        
        // Set initial velocity
        body.setVelocity(Math.cos(angle) * initialSpeed, Math.sin(angle) * initialSpeed);
        
        // Set constant acceleration
        body.setAcceleration(Math.cos(angle) * acceleration, Math.sin(angle) * acceleration);
        
        scene.add.existing(this);
        
        // Setup collision detection
        this.setupCollisions();
    }

    update(time: number, delta: number) {
        this.age += delta;
        
        // Destroy if too old
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }
        
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
        // Deal damage to enemy
        enemy.takeDamage(this.damage);
        
        // Add knockback effect
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const knockbackForce = 3;
            const knockbackX = (dx / distance) * knockbackForce;
            const knockbackY = (dy / distance) * knockbackForce;
            
            enemy.x += knockbackX;
            enemy.y += knockbackY;
        }
        
        // Destroy projectile
        this.destroy();
    }

    public getDamage() {
        return this.damage;
    }
} 