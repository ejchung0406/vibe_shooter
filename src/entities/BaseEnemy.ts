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
    protected isBoss: boolean = false;
    protected xpMultiplier: number = 1;
    private highlight!: Phaser.GameObjects.Graphics;

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

        // Make the enemy interactive
        this.setInteractive(new Phaser.Geom.Rectangle(-12, -12, 24, 24), Phaser.Geom.Rectangle.Contains);
        this.on('pointerover', this.showHighlight, this);
        this.on('pointerout', this.hideHighlight, this);

        // Create highlight graphic
        this.highlight = scene.add.graphics();
        this.add(this.highlight);
        this.hideHighlight();
    }

    protected setupHitbox() {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(28, 28);
        body.setOffset(-14, -14);
        body.setCollideWorldBounds(false);
    }

    private showHighlight() {
        this.highlight.clear();
        this.highlight.lineStyle(2, 0x808080); // Gray color
        this.highlight.strokeRect(-12, -12, 24, 24);
    }

    private hideHighlight() {
        this.highlight.clear();
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
        const waveNumber = gameScene.getEnemySpawner() ? gameScene.getEnemySpawner().getWaveNumber() : 1;
        
        // HP scaling map based on wave number (increased difficulty from wave 3+)
        const hpScalingMap: { [key: number]: number } = {
            1: 15, 2: 20, 3: 50, 4: 80, 5: 120,
            6: 200, 7: 300, 8: 450, 9: 650, 10: 900,
            11: 1200, 12: 1600, 13: 2200, 14: 3000, 15: 4000,
            16: 5500, 17: 7500, 18: 10000, 19: 13000, 20: 17000,
        };
        
        // Get base HP for current wave
        const baseHp = hpScalingMap[waveNumber] || hpScalingMap[20] * (1 + (waveNumber - 20) * 0.2);
        
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
                // Apply wave-based speed scaling (faster enemies from wave 3+)
                const waveNumber = gameScene.getEnemySpawner() ? gameScene.getEnemySpawner().getWaveNumber() : 1;
                let speedMultiplier = 1.0;
                if (waveNumber >= 3) {
                    speedMultiplier = 1.0 + (waveNumber - 2) * 0.15; // +15% speed per wave after wave 2
                }
                speedMultiplier = Math.min(speedMultiplier, 3.0); // Cap at 3x speed
                
                const speed = this.moveSpeed * speedMultiplier * (delta / 1000);
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
        // Deal damage to player with wave-based scaling (stronger from wave 3+)
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        const waveNumber = gameScene.getEnemySpawner() ? gameScene.getEnemySpawner().getWaveNumber() : 1;
        
        let damageMultiplier = 1.0;
        if (waveNumber >= 3) {
            damageMultiplier = 1.0 + (waveNumber - 2) * 0.25; // +25% damage per wave after wave 2
        }
        damageMultiplier = Math.min(damageMultiplier, 4.0); // Cap at 4x damage
        
        const scaledDamage = Math.round(this.damage * damageMultiplier);
        player.takeDamage(scaledDamage);
        
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

    public takeDamage(damage: number, isCritical: boolean = false) {
        this.health -= damage;
        
        // Show damage text
        this.showDamageText(damage, isCritical);

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

    private showDamageText(damage: number, isCritical: boolean) {
        const fontSize = isCritical ? '44px' : '28px';
        const color = isCritical ? '#ff0000' : '#ffff00';

        const damageText = this.scene.add.text(this.x, this.y - 30, Math.round(damage).toString(), {
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: fontSize,
            color: color,
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

    private showXPText(amount: number) {
        const xpText = this.scene.add.text(this.x, this.y, `+${amount} XP`, {
            fontSize: '14px',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: xpText,
            y: this.y - 50,
            alpha: 0,
            duration: 1500,
            ease: 'Power1',
            onComplete: () => {
                xpText.destroy();
            }
        });
    }

    public die() {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        
        // --- XP Wave Bonus Logic ---
        const enemySpawner = gameScene.getEnemySpawner();
        const waveNumber = enemySpawner ? enemySpawner.getWaveNumber() : 1;

        // XP scaling map based on wave number
        const xpWaveMultipliers: { [key: number]: number } = {
            1: 1.0, 5: 1.2, 10: 1.5, 15: 2.0, 20: 2.5,
            25: 3.0, 30: 4.0, 40: 5.0, 50: 7.0, 60: 10.0
        };

        // Get the closest wave multiplier (or default to 1.0)
        let waveMultiplier = 1.0;
        for (const wave in xpWaveMultipliers) {
            if (waveNumber >= parseInt(wave)) {
                waveMultiplier = xpWaveMultipliers[wave];
            } else {
                break;
            }
        }

        const finalXP = Math.floor((this.xpValue * this.xpMultiplier) * waveMultiplier);

        // Give XP to player
        gameScene.addXP(finalXP);
        
        // Show XP text
        this.showXPText(finalXP);

        // Notify enemy spawner of kill (for wave progression)
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

    public isBossEnemy(): boolean {
        return this.isBoss;
    }
} 