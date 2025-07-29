import Phaser from 'phaser';

export class Enemy extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Rectangle;
    private health: number = 30;
    private maxHealth: number = 30;
    private moveSpeed: number = 50;
    private damage: number = 10;
    private xpValue: number = 10;
    private healthBar!: Phaser.GameObjects.Rectangle;
    private healthBarBg!: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, x: number, y: number, type: string = 'basic') {
        super(scene, x, y);
        
        // Set properties based on type
        this.setupEnemyType(type);
        
        // Create enemy sprite
        this.sprite = scene.add.rectangle(0, 0, 24, 24, 0xff0000);
        this.add(this.sprite);
        
        // Create health bar
        this.createHealthBar();
        
        // Add physics body
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(false);
        
        scene.add.existing(this);
        
        // Setup collision with player
        this.setupPlayerCollision();
    }

    private setupEnemyType(type: string) {
        switch (type) {
            case 'fast':
                this.health = 15;
                this.maxHealth = 15;
                this.moveSpeed = 100;
                this.damage = 5;
                this.xpValue = 15;
                break;
            case 'tank':
                this.health = 60;
                this.maxHealth = 60;
                this.moveSpeed = 30;
                this.damage = 20;
                this.xpValue = 25;
                break;
            case 'boss':
                this.health = 200;
                this.maxHealth = 200;
                this.moveSpeed = 40;
                this.damage = 30;
                this.xpValue = 100;
                break;
            default: // basic
                this.health = 30;
                this.maxHealth = 30;
                this.moveSpeed = 50;
                this.damage = 10;
                this.xpValue = 10;
                break;
        }
    }

    private createHealthBar() {
        const barWidth = 30;
        const barHeight = 4;
        
        this.healthBarBg = this.scene.add.rectangle(0, -20, barWidth, barHeight, 0x333333);
        this.healthBar = this.scene.add.rectangle(0, -20, barWidth, barHeight, 0x00ff00);
        
        this.add([this.healthBarBg, this.healthBar]);
    }

    update(time: number, delta: number) {
        // Move towards player using physics
        this.moveTowardsPlayer(delta);
        
        // Update health bar
        this.updateHealthBar();
    }

    private moveTowardsPlayer(delta: number) {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        const player = gameScene.getPlayer();
        
        if (player) {
            const dx = player.getX() - this.x;
            const dy = player.getY() - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const speed = this.moveSpeed * (delta / 1000);
                const moveX = (dx / distance) * speed;
                const moveY = (dy / distance) * speed;
                
                // Use physics body for movement
                const body = this.body as Phaser.Physics.Arcade.Body;
                if (body) {
                    body.setVelocity(moveX * 60, moveY * 60); // Convert to pixels per second
                } else {
                    // Fallback to direct position change
                    this.x += moveX;
                    this.y += moveY;
                }
            }
        }
    }

    private updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        const barWidth = 30;
        
        this.healthBar.width = barWidth * healthPercent;
        
        // Change color based on health
        if (healthPercent > 0.6) {
            this.healthBar.setFillStyle(0x00ff00);
        } else if (healthPercent > 0.3) {
            this.healthBar.setFillStyle(0xffff00);
        } else {
            this.healthBar.setFillStyle(0xff0000);
        }
    }

    private setupPlayerCollision() {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        const player = gameScene.getPlayer();
        
        if (player) {
            // Add collision with player
            scene.physics.add.collider(
                this,
                player,
                this.onPlayerHit,
                undefined,
                this
            );
        }
    }

    private onPlayerHit(enemy: any, player: any) {
        // Deal damage to player
        player.takeDamage(this.damage);
        
        // Push enemy away from player using physics
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const pushForce = 200;
            const pushX = (dx / distance) * pushForce;
            const pushY = (dy / distance) * pushForce;
            
            const body = enemy.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(pushX, pushY);
            
            // Reset velocity after a short time
            this.scene.time.delayedCall(300, () => {
                if (enemy.active) {
                    body.setVelocity(0, 0);
                }
            });
        }
    }

    public takeDamage(damage: number) {
        this.health -= damage;
        
        // Flash red when hit
        this.sprite.setFillStyle(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.sprite.setFillStyle(0xff0000);
        });
        
        if (this.health <= 0) {
            this.die();
        }
    }

    private die() {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        
        // Give XP to player
        gameScene.addXP(this.xpValue);
        
        // Create death effect
        this.createDeathEffect();
        
        // Destroy enemy
        this.destroy();
    }

    private createDeathEffect() {
        // Create explosion effect
        for (let i = 0; i < 5; i++) {
            const particle = this.scene.add.rectangle(
                this.x + (Math.random() - 0.5) * 20,
                this.y + (Math.random() - 0.5) * 20,
                4,
                4,
                0xffaa00
            );
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scaleX: 2,
                scaleY: 2,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }

    public getHealth() {
        return this.health;
    }

    public getMaxHealth() {
        return this.maxHealth;
    }

    public getDamage() {
        return this.damage;
    }

    public getXPValue() {
        return this.xpValue;
    }
} 