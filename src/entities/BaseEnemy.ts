import Phaser from 'phaser';

export abstract class BaseEnemy extends Phaser.GameObjects.Container {
    protected sprite!: Phaser.GameObjects.Rectangle;
    protected health: number = 15;
    protected maxHealth: number = 15;
    protected moveSpeed: number = 50;
    protected damage: number = 10;
    protected xpValue: number = 10;
    protected healthBar!: Phaser.GameObjects.Rectangle;
    protected healthBarBg!: Phaser.GameObjects.Rectangle;
    protected baseHealthMultiplier: number = 1;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        
        // Calculate health based on player level (after subclass sets multiplier)
        this.calculateHealth();
        
        // Create enemy sprite
        this.sprite = scene.add.rectangle(0, 0, 24, 24, this.getEnemyColor());
        this.add(this.sprite);
        
        // Create health bar
        this.createHealthBar();
        
        // Add physics body
        scene.physics.add.existing(this);
        this.setupHitbox();
        
        scene.add.existing(this);
        
        // Setup collision with player
        this.setupPlayerCollision();
    }

    protected setupHitbox() {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(28, 28);
        body.setOffset(-14, -14);
        body.setCollideWorldBounds(false);
    }

    protected createHealthBar() {
        const barWidth = 30;
        const barHeight = 4;
        
        this.healthBarBg = this.scene.add.rectangle(0, -20, barWidth, barHeight, 0x333333);
        this.healthBar = this.scene.add.rectangle(0, -20, barWidth, barHeight, 0xff0000); // Red health bar
        
        this.add([this.healthBarBg, this.healthBar]);
    }

    protected calculateHealth() {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        const playerLevel = gameScene.getPlayerLevel ? gameScene.getPlayerLevel() : 1;
        
        // HP scaling map based on player level
        const hpScalingMap: { [key: number]: number } = {
            1: 15, 2: 18, 3: 22, 4: 27, 5: 33,
            6: 40, 7: 48, 8: 57, 9: 67, 10: 80
        };
        
        // Get base HP for current level (default to level 10 if higher)
        const baseHp = hpScalingMap[playerLevel] || hpScalingMap[10];
        
        // Apply enemy type multiplier
        this.health = Math.floor(baseHp * this.baseHealthMultiplier);
        this.maxHealth = this.health;
    }

    update(time: number, delta: number) {
        // Move towards player
        this.moveTowardsPlayer(delta);
        
        // Update health bar
        this.updateHealthBar();
        
        // Custom update logic for subclasses
        this.customUpdate(time, delta);
    }

    protected moveTowardsPlayer(delta: number) {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        const player = gameScene.getPlayer();
        
        if (player && player.isAlive()) {
            const dx = player.getX() - this.x;
            const dy = player.getY() - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only follow player if within detection radius
            const detectionRadius = 800; // Increased to ensure spawned enemies can detect player
            if (distance > 0 && distance <= detectionRadius) {
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
            } else if (distance > detectionRadius) {
                // Stop moving if player is too far
                const body = this.body as Phaser.Physics.Arcade.Body;
                if (body) {
                    body.setVelocity(0, 0);
                }
            }
        }
    }

    protected updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        const barWidth = 30;
        
        this.healthBar.width = barWidth * healthPercent;
        
        // Keep red color for all enemies
        this.healthBar.setFillStyle(0xff0000);
    }

    protected setupPlayerCollision() {
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

    protected onPlayerHit(enemy: any, player: any) {
        // Deal damage to player
        player.takeDamage(this.damage);
        
        // Push player away from enemy (with resistance)
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        
        // Player knockback (with resistance)
        const playerKnockbackForce = 400;
        player.applyKnockback(dx, dy, playerKnockbackForce);
        
        // Push enemy away from player using physics
        const enemyPushForce = 200;
        const enemyPushX = -(dx / Math.sqrt(dx * dx + dy * dy)) * enemyPushForce;
        const enemyPushY = -(dy / Math.sqrt(dx * dx + dy * dy)) * enemyPushForce;
        
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(enemyPushX, enemyPushY);
            
            // Reset velocity after a short time
            this.scene.time.delayedCall(200, () => {
                if (enemy.active && body) {
                    body.setVelocity(0, 0);
                }
            });
        }
    }

    public takeDamage(damage: number) {
        this.health -= damage;
        
        // Show damage text
        this.showDamageText(damage);

        // Blink effect
        const originalColor = this.getEnemyColor();
        this.sprite.setFillStyle(0xffffff, 1); // White, Opaque
        this.scene.time.delayedCall(50, () => {
            if (this.active && this.sprite) {
                this.sprite.setFillStyle(originalColor, 1); // Original Color, Opaque
            }
        });
        
        if (this.health <= 0) {
            this.die();
        }
    }

    private showDamageText(damage: number) {
        const damageText = this.scene.add.text(this.x, this.y - 30, damage.toString(), {
            fontSize: '14px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Animate damage text
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 40,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });
    }

    public die() {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        
        // Give XP to player
        gameScene.addXP(this.xpValue);
        
        // Notify enemy spawner of kill (for wave progression)
        const enemySpawner = gameScene.getEnemySpawner();
        if (enemySpawner) {
            enemySpawner.onEnemyKilled();
        }
        
        // Create death effect
        this.createDeathEffect();
        
        // Destroy enemy
        this.destroy();
    }

    protected createDeathEffect() {
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

    // Abstract methods for subclasses
    protected abstract customUpdate(time: number, delta: number): void;
    protected abstract getEnemyColor(): number;

    // Getters
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