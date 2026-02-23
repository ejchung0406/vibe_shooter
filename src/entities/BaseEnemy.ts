import Phaser from 'phaser';
import { ENEMY_HP_SCALING, XP_WAVE_MULTIPLIERS, ENEMY_DETECTION_RADIUS, DESPAWN_TIME, DESPAWN_DISTANCE, getWaveDamageMultiplier } from '../GameConstants';
import { GameSceneInterface } from '../types/GameSceneInterface';
import { XPOrb } from './XPOrb';

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
    protected xpBossMultiplier: number = 1;
    private highlight!: Phaser.GameObjects.Graphics;

    // Elite system
    protected isElite: boolean = false;
    protected eliteModifier: string | null = null;
    private eliteBorder: Phaser.GameObjects.Graphics | null = null;
    private regenTimer: number = 0;

    protected abstract getEnemyColor(): number;
    protected customUpdate(_time: number, _delta: number): void {}

    private lifetime: number = 0;
    private isBleeding: boolean = false;
    private bleedTimer: number = 0;
    private bleedDamage: number = 0;
    private bleedTickTimer: number = 0;
    private bleedTickInterval: number = 500; // 0.5 seconds
    private bleedEffect: Phaser.GameObjects.Graphics | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        // Calculate health based on player level (after subclass sets multiplier)
        this.calculateHealth();

        // Create enemy sprite (base body rectangle)
        this.sprite = scene.add.rectangle(0, 0, 24, 24, this.getEnemyColor());
        this.add(this.sprite);

        // Subclass visuals
        this.createVisual();

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

    protected createVisual(): void {
        // Base top-down: body outline ring + directional notch
        const g = this.scene.add.graphics();
        g.lineStyle(1.5, 0x000000, 0.4);
        g.strokeCircle(0, 0, 10);
        // Directional notch (front = up)
        g.fillStyle(0xffffff, 0.4);
        g.fillTriangle(-3, -8, 0, -13, 3, -8);
        this.add(g);
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
        const gameScene = this.scene as GameSceneInterface;
        const waveNumber = gameScene.getEnemySpawner() ? gameScene.getEnemySpawner().getWaveNumber() : 1;

        const baseHp = ENEMY_HP_SCALING[waveNumber] || ENEMY_HP_SCALING[15] * (1 + (waveNumber - 15) * 0.2);
        
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
        this.checkDespawn(delta);
        this.updateBleed(delta);
        this.updateElite(delta);
    }

    protected moveTowardsPlayer(delta: number) {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();
        
        if (player && player.isAlive()) {
            const dx = player.getX() - this.x;
            const dy = player.getY() - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0 && (this.isBoss || distance <= ENEMY_DETECTION_RADIUS)) {
                // Apply wave-based speed scaling (faster enemies from wave 3+)
                const waveNumber = gameScene.getEnemySpawner() ? gameScene.getEnemySpawner().getWaveNumber() : 1;
                let speedMultiplier = 1.0;
                if (waveNumber >= 3) {
                    speedMultiplier = 1.0 + (waveNumber - 2) * 0.15; // +15% speed per wave after wave 2
                }
                speedMultiplier = Math.min(speedMultiplier, 3.0); // Cap at 3x speed
                
                // Check slow pool
                let slowMultiplier = 1.0;
                try {
                    const obstacleManager = gameScene.getObstacleManager();
                    if (obstacleManager && obstacleManager.isInSlowPool(this.x, this.y)) {
                        slowMultiplier = 0.5;
                    }
                } catch (_e) { /* obstacle manager not ready */ }

                const speed = this.moveSpeed * speedMultiplier * slowMultiplier * (delta / 1000);
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

    private updateElite(delta: number) {
        if (!this.isElite) return;

        // Regen modifier: heal 1% HP/s
        if (this.eliteModifier === 'regen') {
            this.regenTimer += delta;
            if (this.regenTimer >= 1000) {
                this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.01);
                this.regenTimer -= 1000;
            }
        }

        // Aura modifier: nearby enemies deal +25% damage (applied via damage getter)
        // This is checked by other enemies in their onPlayerHit
    }

    private checkDespawn(delta: number) {
        this.lifetime += delta;

        if (!this.isBoss && this.lifetime > DESPAWN_TIME) {
            const gameScene = this.scene as GameSceneInterface;
            const player = gameScene.getPlayer();
            if (player) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, player.getX(), player.getY());
                if (distance > DESPAWN_DISTANCE) {
                    this.destroy();
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
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();

        if (player) {
            // Add collision with player
            gameScene.physics.add.collider(
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
        const gameScene = this.scene as GameSceneInterface;
        const waveNumber = gameScene.getEnemySpawner() ? gameScene.getEnemySpawner().getWaveNumber() : 1;

        const damageMultiplier = getWaveDamageMultiplier(waveNumber);
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

        // Track damage dealt
        try {
            const gameScene = this.scene as GameSceneInterface;
            if (gameScene.addDamageDealt) {
                gameScene.addDamageDealt(damage);
            }
        } catch (_e) { /* not ready */ }

        // Show damage text
        this.showDamageText(damage, isCritical, false);

        // Blink effect
        const originalColor = this.getEnemyColor();
        this.sprite.setFillStyle(0xffffff, 1);
        this.scene.time.delayedCall(50, () => {
            if (this.active && this.sprite) {
                this.sprite.setFillStyle(originalColor, 1);
            }
        });

        if (this.health <= 0) {
            this.die();
        }
    }

    public takeDotDamage(damage: number) {
        this.health -= damage;

        // Track damage dealt
        try {
            const gameScene = this.scene as GameSceneInterface;
            if (gameScene.addDamageDealt) {
                gameScene.addDamageDealt(damage);
            }
        } catch (_e) { /* not ready */ }

        this.showDamageText(damage, false, true);

        if (this.health <= 0) {
            this.die();
        }
    }

    private showDamageText(damage: number, isCritical: boolean, isDot: boolean = false) {
        const offsetX = (Math.random() - 0.5) * 20;

        if (isCritical) {
            // Crit: red, 36px, bounce-scale animation, black stroke
            const damageText = this.scene.add.text(this.x + offsetX, this.y - 30, Math.round(damage).toString(), {
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '36px',
                color: '#ff2222',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setScale(0.3);

            // Bounce-scale: 0.3 -> 1.4 -> 1.0
            this.scene.tweens.add({
                targets: damageText,
                scaleX: 1.4,
                scaleY: 1.4,
                duration: 150,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: damageText,
                        scaleX: 1.0,
                        scaleY: 1.0,
                        y: damageText.y - 40,
                        alpha: 0,
                        duration: 800,
                        ease: 'Power2',
                        onComplete: () => damageText.destroy()
                    });
                }
            });
        } else if (isDot) {
            // DOT: orange, 18px, gentle short float
            const damageText = this.scene.add.text(this.x + offsetX, this.y - 25, Math.round(damage).toString(), {
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '18px',
                color: '#ff8844',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.scene.tweens.add({
                targets: damageText,
                y: damageText.y - 20,
                alpha: 0,
                duration: 600,
                ease: 'Power1',
                onComplete: () => damageText.destroy()
            });
        } else {
            // Normal: yellow, 28px, standard float
            const damageText = this.scene.add.text(this.x + offsetX, this.y - 30, Math.round(damage).toString(), {
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '28px',
                color: '#ffff00',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.scene.tweens.add({
                targets: damageText,
                y: damageText.y - 40,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => damageText.destroy()
            });
        }
    }

    public die() {
        const gameScene = this.scene as GameSceneInterface;

        const enemySpawner = gameScene.getEnemySpawner();
        const waveNumber = enemySpawner ? enemySpawner.getWaveNumber() : 1;

        let waveMultiplier = 1.0;
        for (const wave in XP_WAVE_MULTIPLIERS) {
            if (waveNumber >= parseInt(wave)) {
                waveMultiplier = XP_WAVE_MULTIPLIERS[wave];
            } else {
                break;
            }
        }

        const finalXP = Math.floor((this.xpValue * this.xpBossMultiplier) * waveMultiplier);

        // Spawn XP orbs instead of giving XP directly
        const orbCount = this.isBoss ? 8 : 3;
        const xpPerOrb = Math.max(1, Math.floor(finalXP / orbCount));
        for (let i = 0; i < orbCount; i++) {
            new XPOrb(this.scene, this.x, this.y, xpPerOrb);
        }

        // Notify enemy spawner of kill (for wave progression)
        if (enemySpawner) {
            enemySpawner.onEnemyKilled();
        }

        // Track kill
        try {
            if (gameScene.addKill) {
                gameScene.addKill();
            }
        } catch (_e) { /* not ready */ }

        // Effects manager: screen shake + kill streak
        try {
            const effectsManager = gameScene.getEffectsManager();
            if (effectsManager) {
                effectsManager.onEnemyKilled(this.isBoss, this.isElite);
                effectsManager.createEnhancedDeathEffect(this.x, this.y, this.getEnemyColor(), this.isBoss);
            }
        } catch (_e) { /* effects manager not ready */ }

        // Elite enemies: 30% chance to drop item (not guaranteed)
        if (this.isElite && Math.random() < 0.3) {
            try {
                gameScene.spawnItemAt(this.x, this.y);
            } catch (_e) { /* spawn not ready */ }
        }

        // Clean up bleeding effect
        this.removeBleedEffect();

        // Destroy enemy
        this.destroy();
    }

    protected createDeathEffect() {
        // Fallback if EffectsManager not available
        for (let i = 0; i < 8; i++) {
            const particle = this.scene.add.rectangle(
                this.x + (Math.random() - 0.5) * 20,
                this.y + (Math.random() - 0.5) * 20,
                4, 4, this.getEnemyColor()
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

    public applyBleed(duration: number, damagePerSecond: number) {
        // Safety check to ensure enemy is still active
        if (!this.active || !this.scene) return;
        
        this.isBleeding = true;
        this.bleedTimer = duration;
        this.bleedDamage = damagePerSecond;
        this.bleedTickTimer = 0; // Reset tick timer
        
        // Create bleeding visual effect
        this.createBleedEffect();
    }

    private updateBleed(delta: number) {
        if (this.isBleeding) {
            this.bleedTimer -= delta;
            this.bleedTickTimer += delta;
            
            // Apply damage every 0.5 seconds
            if (this.bleedTickTimer >= this.bleedTickInterval) {
                this.takeDotDamage(this.bleedDamage * (this.bleedTickInterval / 1000));
                this.bleedTickTimer = 0;
            }
            
            if (this.bleedTimer <= 0) {
                this.isBleeding = false;
                this.removeBleedEffect();
            }
        }
    }

    private createBleedEffect() {
        if (!this.bleedEffect && this.active && this.scene) {
            this.bleedEffect = this.scene.add.graphics();
            this.bleedEffect.setDepth(this.depth + 1);
            
            // Safety check to ensure we can add to the container
            if (this.add && typeof this.add === 'function') {
                this.add(this.bleedEffect);
            } else {
                // Fallback: position the effect manually if container add fails
                this.bleedEffect.x = this.x;
                this.bleedEffect.y = this.y;
            }
        }
        
        // Animate the bleeding effect
        this.animateBleedEffect();
    }

    private animateBleedEffect() {
        if (!this.bleedEffect || !this.isBleeding || !this.active || !this.scene) return;
        
        this.bleedEffect.clear();
        
        // Update position if not added to container (fallback positioning)
        if (this.bleedEffect.parentContainer !== this) {
            this.bleedEffect.x = this.x;
            this.bleedEffect.y = this.y;
        }
        
        // Create red particles around the enemy
        const numParticles = 3;
        for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2;
            const radius = 15 + Math.sin(this.lifetime * 0.01) * 3; // Pulsing effect
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            this.bleedEffect.fillStyle(0xff0000, 0.7);
            this.bleedEffect.fillCircle(x, y, 2);
        }
        
        // Continue animation if still bleeding and scene is available
        if (this.isBleeding && this.active && this.scene && this.scene.time) {
            this.scene.time.delayedCall(100, () => {
                if (this.active && this.scene) {
                    this.animateBleedEffect();
                }
            });
        }
    }

    private removeBleedEffect() {
        if (this.bleedEffect) {
            this.bleedEffect.destroy();
            this.bleedEffect = null;
        }
    }

    public makeElite() {
        this.isElite = true;
        this.maxHealth *= 3;
        this.health = this.maxHealth;
        this.damage = Math.floor(this.damage * 1.5);
        this.moveSpeed *= 1.2;
        this.xpValue *= 2;

        // Random modifier
        const modifiers = ['fast', 'regen', 'aura'];
        this.eliteModifier = modifiers[Math.floor(Math.random() * modifiers.length)];

        if (this.eliteModifier === 'fast') {
            this.moveSpeed *= 1.5;
        }

        // Gold border visual
        this.eliteBorder = this.scene.add.graphics();
        this.eliteBorder.lineStyle(2, 0xFFD700, 0.8);
        this.eliteBorder.strokeRect(-14, -14, 28, 28);
        this.add(this.eliteBorder);

        // Slightly bigger
        this.setScale((this.scaleX || 1) * 1.3);
    }

    public isEliteEnemy(): boolean {
        return this.isElite;
    }

    public getEliteModifier(): string | null {
        return this.eliteModifier;
    }

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