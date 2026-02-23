import Phaser from 'phaser';
import { GameSceneInterface } from '../types/GameSceneInterface';
import { getWaveDamageMultiplier } from '../GameConstants';

export class EnemyProjectile extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Rectangle;
    private velocityX: number = 0;
    private velocityY: number = 0;
    private damage: number = 8;
    private lifetime: number = 3000; // 3 seconds
    private age: number = 0;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        damage: number,
        speed: number
    ) {
        super(scene, x, y);
        
        this.damage = damage;
        
        // Create enemy projectile visual (red diamond + dark center)
        this.sprite = scene.add.rectangle(0, 0, 8, 8, 0xff0000);
        this.sprite.setRotation(Math.PI / 4);
        this.add(this.sprite);
        const center = scene.add.graphics();
        center.fillStyle(0x660000);
        center.fillCircle(0, 0, 2);
        this.add(center);
        
        // Set velocity based on angle
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
        
        // Add physics body
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(6, 6);
        body.setOffset(-3, -3);
        body.setVelocity(this.velocityX, this.velocityY);
        
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
        
        // Update position
        this.x += this.velocityX * (delta / 1000);
        this.y += this.velocityY * (delta / 1000);
        
        // Destroy if out of map bounds
        const gameScene = this.scene as GameSceneInterface;
        const mapBounds = gameScene.getMapSize() / 2;
        if (this.x < -mapBounds || this.x > mapBounds || this.y < -mapBounds || this.y > mapBounds) {
            this.destroy();
        }
    }

    private setupCollisions() {
        const gameScene = this.scene as GameSceneInterface;

        // Check collision with player
        gameScene.physics.add.overlap(
            this,
            gameScene.getPlayer(),
            this.onPlayerHit,
            undefined,
            this
        );
    }

    private onPlayerHit(_projectile: any, player: any) {
        // Deal damage to player with wave-based scaling (stronger from wave 3+)
        const gameScene = this.scene as GameSceneInterface;
        const waveNumber = gameScene.getEnemySpawner() ? gameScene.getEnemySpawner().getWaveNumber() : 1;

        const damageMultiplier = getWaveDamageMultiplier(waveNumber);
        const scaledDamage = Math.round(this.damage * damageMultiplier);
        player.takeDamage(scaledDamage);
        
        // Apply knockback to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const knockbackForce = 250;
        player.applyKnockback(dx, dy, knockbackForce);
        
        // Destroy projectile
        this.destroy();
    }

    public getDamage() {
        return this.damage;
    }
} 