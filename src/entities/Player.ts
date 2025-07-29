import Phaser from 'phaser';
import { QProjectile } from './QProjectile';
import { ExplosiveProjectile } from './ExplosiveProjectile';
import { Projectile } from './Projectile';

export class Player extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Rectangle;
    private attackTimer: number = 0;
    private attackCooldown: number = 500; // milliseconds
    private velocityX: number = 0;
    private velocityY: number = 0;
    private moveSpeed: number = 200;
    private isAttacking: boolean = false;
    private attackPauseDuration: number = 200; // milliseconds
    private attackPauseTimer: number = 0;
    private health: number = 100;
    private maxHealth: number = 100;
    private isInvulnerable: boolean = false;
    private invulnerabilityDuration: number = 1000; // 1 second
    private invulnerabilityTimer: number = 0;
    private healthBar!: Phaser.GameObjects.Rectangle;
    private healthBarBg!: Phaser.GameObjects.Rectangle;
    
    // Attack properties
    private attackDamage: number = 10;
    private projectileSpeed: number = 500;
    private projectileCount: number = 1;
    private piercing: boolean = false;
    private comboCounter: number = 0;
    private comboThreshold: number = 3;
    private hasSpreadAttack: boolean = false; // Spread attack upgrade
    private hasBurstAttack: boolean = false; // Burst attack upgrade
    private hasComboMaster: boolean = false; // Combo master upgrade
    private shotCounter: number = 0; // Track shots for combo
    
    // Skills
    private qSkillUnlocked: boolean = false;
    private eSkillUnlocked: boolean = false;
    private qCooldown: number = 5000; // 5 seconds
    private eCooldown: number = 8000; // 8 seconds
    private qCooldownTimer: number = 0;
    private eCooldownTimer: number = 0;
    private shieldActive: boolean = false;
    private shieldDuration: number = 2000; // 2 seconds
    private shieldTimer: number = 0;
    private shieldSprite!: Phaser.GameObjects.Arc;
    private knockbackResistance: number = 0.3; // Reduce knockback to 30% of original

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        
        // Create player sprite (simple rectangle for now)
        this.sprite = scene.add.rectangle(0, 0, 20, 20, 0x00ff00);
        this.add(this.sprite);
        
        // Create health bar
        this.createHealthBar();
        
        // Create shield sprite (initially invisible)
        this.shieldSprite = scene.add.circle(0, 0, 25, 0xffff00, 0);
        this.shieldSprite.setStrokeStyle(3, 0xffff00);
        this.shieldSprite.setAlpha(0); // Start invisible
        this.add(this.shieldSprite);
        
        // Add physics body
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(false); // Remove world bounds
        
        scene.add.existing(this);
    }

    private createHealthBar() {
        const barWidth = 30;
        const barHeight = 4;
        
        this.healthBarBg = this.scene.add.rectangle(0, -20, barWidth, barHeight, 0x333333);
        this.healthBar = this.scene.add.rectangle(0, -20, barWidth, barHeight, 0x00ff00);
        
        this.add([this.healthBarBg, this.healthBar]);
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

    update(time: number, delta: number) {
        // Update attack pause timer
        if (this.isAttacking) {
            this.attackPauseTimer += delta;
            if (this.attackPauseTimer >= this.attackPauseDuration) {
                this.isAttacking = false;
                this.attackPauseTimer = 0;
            }
        }
        
        // Update invulnerability timer
        if (this.isInvulnerable) {
            this.invulnerabilityTimer += delta;
            
            // Blink white every 100ms
            const blinkInterval = 100;
            if (Math.floor(this.invulnerabilityTimer / blinkInterval) % 2 === 0) {
                this.sprite.setFillStyle(0xffffff); // White
            } else {
                this.sprite.setFillStyle(0x00ff00); // Normal green
            }
            
            if (this.invulnerabilityTimer >= this.invulnerabilityDuration) {
                this.isInvulnerable = false;
                this.invulnerabilityTimer = 0;
                this.sprite.setFillStyle(0x00ff00); // Return to normal color
            }
        }
        
        // Update health bar
        this.updateHealthBar();
        
        // Update skill cooldowns
        this.updateSkillCooldowns(delta);
        
        // Update shield
        this.updateShield(delta);
        
        // Update attack timer
        this.attackTimer += delta;
        
        // Movement (only if not attacking)
        if (!this.isAttacking) {
            this.updateMovement(delta);
        }
    }



    private triggerComboAttack() {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        
        // Get mouse position for combo attack direction
        const mouseX = scene.input.mousePointer.x;
        const mouseY = scene.input.mousePointer.y;
        
        // Calculate angle to mouse
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const angle = Math.atan2(dy, dx);
        
        // Create a powerful combo attack (3 projectiles instead of 8)
        for (let i = 0; i < 3; i++) {
            const spreadAngle = angle + (i - 1) * 0.3;
            const projectile = new Projectile(
                scene,
                this.x,
                this.y,
                this.attackDamage * 2,
                this.projectileSpeed * 1.5,
                spreadAngle,
                true, // Combo attacks pierce
                false
            );
            
            gameScene.getProjectiles().add(projectile);
        }
    }

    private updateMovement(delta: number) {
        // Normalize diagonal movement
        const speed = this.moveSpeed * (delta / 1000);
        
        // Apply velocity
        this.x += this.velocityX * speed;
        this.y += this.velocityY * speed;
        
        // No boundaries - player can move freely
    }

    public setVelocity(x: number, y: number) {
        this.velocityX = x;
        this.velocityY = y;
    }

    public attack() {
        if (this.isAttacking) return; // Prevent multiple attacks during pause
        
        this.isAttacking = true;
        this.attackPauseTimer = 0;
        
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        
        // Get mouse position for shooting direction (world coordinates)
        const camera = scene.cameras.main;
        const mouseX = scene.input.mousePointer.x + camera.scrollX;
        const mouseY = scene.input.mousePointer.y + camera.scrollY;
        
        // Calculate angle to mouse
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const angle = Math.atan2(dy, dx);
        
        if (this.projectileCount === 1) {
            // Single projectile - check for combo
            this.shotCounter++;
            const isComboShot = this.hasComboMaster && this.shotCounter % 3 === 0;
            
            if (isComboShot) {
                // Create explosive projectile
                const projectile = new ExplosiveProjectile(
                    scene,
                    this.x,
                    this.y,
                    this.attackDamage * 2, // Double damage
                    this.projectileSpeed,
                    angle,
                    this.piercing
                );
                gameScene.getProjectiles().add(projectile);
            } else {
                // Regular projectile
                const projectile = new Projectile(
                    scene,
                    this.x,
                    this.y,
                    this.attackDamage,
                    this.projectileSpeed,
                    angle,
                    this.piercing,
                    false
                );
                gameScene.getProjectiles().add(projectile);
            }
        } else {
            // Multi-projectile attacks - increment counter for combo tracking
            this.shotCounter++;
            const isComboShot = this.hasComboMaster && this.shotCounter % 3 === 0;
            
            if (this.hasSpreadAttack) {
                this.performSpreadAttack(scene, gameScene, angle, isComboShot);
            }
            if (this.hasBurstAttack) {
                this.performBurstAttack(scene, gameScene, angle, isComboShot);
            }
            if (!this.hasSpreadAttack && !this.hasBurstAttack) {
                // Default spread behavior if no upgrades
                this.performSpreadAttack(scene, gameScene, angle, isComboShot);
            }
        }
        
        // Combo system disabled for now
    }

    private performSpreadAttack(scene: Phaser.Scene, gameScene: any, baseAngle: number, isComboShot: boolean = false) {
        for (let i = 0; i < this.projectileCount; i++) {
            // Spread projectiles in an arc
            const spreadAngle = Math.PI / 4; // 45 degrees total spread
            const angleStep = spreadAngle / (this.projectileCount - 1);
            const projectileAngle = baseAngle - spreadAngle / 2 + angleStep * i;
            
            let projectile;
            if (isComboShot && i === 0) { // Make first projectile explosive for combo
                projectile = new ExplosiveProjectile(
                    scene,
                    this.x,
                    this.y,
                    this.attackDamage * 2,
                    this.projectileSpeed,
                    projectileAngle,
                    this.piercing
                );
            } else {
                projectile = new Projectile(
                    scene,
                    this.x,
                    this.y,
                    this.attackDamage,
                    this.projectileSpeed,
                    projectileAngle,
                    this.piercing,
                    false
                );
            }
            
            gameScene.getProjectiles().add(projectile);
        }
    }

    private performBurstAttack(scene: Phaser.Scene, gameScene: any, angle: number, isComboShot: boolean = false) {
        for (let i = 0; i < this.projectileCount; i++) {
            scene.time.delayedCall(i * 100, () => { // 100ms delay between shots
                let projectile;
                if (isComboShot && i === 0) { // Make first projectile explosive for combo
                    projectile = new ExplosiveProjectile(
                        scene,
                        this.x,
                        this.y,
                        this.attackDamage * 2,
                        this.projectileSpeed,
                        angle,
                        this.piercing
                    );
                } else {
                    projectile = new Projectile(
                        scene,
                        this.x,
                        this.y,
                        this.attackDamage,
                        this.projectileSpeed,
                        angle,
                        this.piercing,
                        false
                    );
                }
                
                gameScene.getProjectiles().add(projectile);
            });
        }
    }

    // Upgrade methods
    public increaseAttackSpeed(amount: number) {
        this.attackCooldown = Math.max(100, this.attackCooldown - amount);
    }

    public increaseDamage(amount: number) {
        this.attackDamage += amount;
    }

    public increaseProjectileCount(amount: number) {
        this.projectileCount += amount;
    }

    public enablePiercing() {
        this.piercing = true;
    }

    public unlockSkills(level: number) {
        if (level >= 2 && !this.qSkillUnlocked) {
            this.qSkillUnlocked = true;
        }
        if (level >= 2 && !this.eSkillUnlocked) {
            this.eSkillUnlocked = true;
        }
    }

    private updateSkillCooldowns(delta: number) {
        if (this.qCooldownTimer > 0) {
            this.qCooldownTimer -= delta;
        }
        if (this.eCooldownTimer > 0) {
            this.eCooldownTimer -= delta;
        }
    }

    private updateShield(delta: number) {
        if (this.shieldActive) {
            this.shieldTimer += delta;
            if (this.shieldTimer >= this.shieldDuration) {
                this.deactivateShield();
            }
        }
    }

    public useQSkill() {
        if (!this.qSkillUnlocked || this.qCooldownTimer > 0) return;
        
        this.qCooldownTimer = this.qCooldown;
        
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        
        // Find nearby enemies and sort by distance
        const enemies = gameScene.getEnemies().getChildren();
        const nearbyEnemies: any[] = [];
        
        enemies.forEach((enemy: any) => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= 900) { // 900px radius (3x bigger)
                nearbyEnemies.push({ 
                    enemy, 
                    distance,
                    fixedX: enemy.x, // Fix target position at this moment
                    fixedY: enemy.y
                });
            }
        });
        
        // Don't use Q skill if no enemies in range
        if (nearbyEnemies.length === 0) {
            this.qCooldownTimer = 0; // Reset cooldown so it can be tried again
            return;
        }
        
        // Sort by distance (closest first)
        nearbyEnemies.sort((a, b) => a.distance - b.distance);
        
        // Take up to 2 closest enemies
        const targetEnemies = nearbyEnemies.slice(0, 2);
        
        // Create homing projectiles (5 + player level)
        const playerLevel = gameScene.getPlayerLevel();
        const projectileCount = 5 + playerLevel;
        
        for (let i = 0; i < projectileCount; i++) {
            const angle = (i / projectileCount) * Math.PI * 2;
            const offsetX = Math.cos(angle) * 30;
            const offsetY = Math.sin(angle) * 30;
            
            // Distribute projectiles between targets
            let targetIndex = 0;
            if (targetEnemies.length === 2) {
                targetIndex = i < Math.floor(projectileCount / 2) ? 0 : 1; // Split evenly between enemies
            }
            
            const target = targetEnemies[targetIndex];
            
            const projectile = new QProjectile(
                scene,
                this.x + offsetX,
                this.y + offsetY,
                this.attackDamage * 0.6,
                this.projectileSpeed * 1.5,
                target.fixedX,
                target.fixedY,
                i // Pass projectile index for unique curves
            );
            
            gameScene.getProjectiles().add(projectile);
        }
    }

    public useESkill() {
        if (!this.eSkillUnlocked || this.eCooldownTimer > 0 || this.shieldActive) return;
        
        this.eCooldownTimer = this.eCooldown;
        this.activateShield();
    }

    private activateShield() {
        this.shieldActive = true;
        this.shieldTimer = 0;
        this.shieldSprite.setAlpha(0.7);
    }

    private deactivateShield() {
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldSprite.setAlpha(0);
    }

    public increaseProjectileSpeed(amount: number) {
        this.projectileSpeed += amount;
    }

    public getX() {
        return this.x;
    }

    public getY() {
        return this.y;
    }

    public getVelocityX() {
        return this.velocityX;
    }

    public getVelocityY() {
        return this.velocityY;
    }

    public takeDamage(damage: number) {
        if (this.isInvulnerable || this.shieldActive) return;
        
        this.health -= damage;
        this.isInvulnerable = true;
        this.invulnerabilityTimer = 0;
        
        // Show damage text
        this.showDamageText(damage);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    private showDamageText(damage: number) {
        const damageText = this.scene.add.text(this.x, this.y - 30, damage.toString(), {
            fontSize: '16px',
            color: '#ff4444',
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

    private die() {
        console.log('Player died!');
        // Game over logic will be handled by the scene
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        gameScene.gameOver();
    }

    public getHealth() {
        return this.health;
    }

    public getMaxHealth() {
        return this.maxHealth;
    }

    public isAlive() {
        return this.health > 0;
    }

    public getQCooldownTimer() {
        return this.qCooldownTimer;
    }

    public getECooldownTimer() {
        return this.eCooldownTimer;
    }

    public getQCooldown() {
        return this.qCooldown;
    }

    public getECooldown() {
        return this.eCooldown;
    }

    public getKnockbackResistance() {
        return this.knockbackResistance;
    }

    public enableSpreadAttack() {
        this.hasSpreadAttack = true;
    }

    public enableBurstAttack() {
        this.hasBurstAttack = true;
    }

    public enableComboMaster() {
        this.hasComboMaster = true;
    }
} 