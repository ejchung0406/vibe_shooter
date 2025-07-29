import Phaser from 'phaser';

export class EnemyProjectile extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Rectangle;
    private velocityX: number = 0;
    private velocityY: number = 0;
    private damage: number = 8;
    private speed: number = 200;
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
        this.speed = speed;
        
        // Create projectile sprite (red for enemy projectiles)
        this.sprite = scene.add.rectangle(0, 0, 6, 6, 0xff0000);
        this.add(this.sprite);
        
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
        const gameScene = this.scene as any;
        const mapBounds = gameScene.getMapSize() / 2;
        if (this.x < -mapBounds || this.x > mapBounds || this.y < -mapBounds || this.y > mapBounds) {
            this.destroy();
        }
    }

    private setupCollisions() {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        
        // Check collision with player
        scene.physics.add.overlap(
            this,
            gameScene.getPlayer(),
            this.onPlayerHit,
            undefined,
            this
        );
    }

    private onPlayerHit(projectile: any, player: any) {
        // Deal damage to player
        player.takeDamage(this.damage);
        
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