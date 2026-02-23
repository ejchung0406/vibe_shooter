import Phaser from 'phaser';
import { GameSceneInterface } from '../types/GameSceneInterface';

export class QProjectile extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Rectangle;
    private damage: number = 8;
    private lifetime: number = 1000; // Increased lifetime for acceleration
    private age: number = 0;
    private isCritical: boolean = false;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        damage: number,
        targetX: number,
        targetY: number,
        isCritical: boolean = false
    ) {
        super(scene, x, y);
        
        this.damage = damage;
        this.isCritical = isCritical;
        
        // Create Q projectile visual (cyan glowing circle)
        this.sprite = scene.add.rectangle(0, 0, 4, 4, 0xffffff);
        this.add(this.sprite);
        const glow = scene.add.graphics();
        glow.fillStyle(0x00ffff, 0.5);
        glow.fillCircle(0, 0, 5);
        glow.fillStyle(0xffffff, 0.8);
        glow.fillCircle(0, 0, 2);
        this.add(glow);
        
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

    update(_time: number, delta: number) {
        this.age += delta;
        
        // Destroy if too old
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }
        
        // Destroy if out of map bounds
        const gameScene = this.scene as GameSceneInterface;
        const mapBounds = gameScene.getMapSize() / 2;
        if (this.x < -mapBounds || this.x > mapBounds || this.y < -mapBounds || this.y > mapBounds) {
            this.destroy();
        }
    }

    private setupCollisions() {
        const gameScene = this.scene as GameSceneInterface;

        // Check collision with enemies
        gameScene.physics.add.overlap(
            this,
            gameScene.getEnemies(),
            this.onEnemyHit,
            undefined,
            this
        );
    }

    private onEnemyHit(_projectile: any, enemy: any) {
        // Deal damage to enemy
        enemy.takeDamage(this.damage, this.isCritical);
        
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