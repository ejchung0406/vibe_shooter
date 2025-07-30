import Phaser from 'phaser';
import { QProjectile } from './QProjectile';
import { ExplosiveProjectile } from './ExplosiveProjectile';
import { Projectile } from './Projectile';
import { Pet } from './Pet';
import { GameScene } from '../scenes/GameScene';
import { Item, ItemData } from './Item';

export const SKILL_UNLOCK_LEVELS = {
    Q: 2,
    E: 3,
    JUMP: 5,
    R: 9,
    F: 7,
    DASH: 4,
};

export abstract class BasePlayer extends Phaser.GameObjects.Container {
    protected sprite!: Phaser.GameObjects.Rectangle;
    protected attackTimer: number = 0;
    protected attackCooldown: number = 1000; // milliseconds
    protected velocityX: number = 0;
    protected velocityY: number = 0;
    protected moveSpeed: number = 200;

    // Stat rework
    protected baseAttackDamage: number = 10;
    protected bonusAttackDamage: number = 0;
    protected attackDamageMultiplier: number = 1.0;
    protected attackDamage: number = 10;

    protected armor: number = 10; // Default armor value
    protected armorPerLevelUp: number = 5; // Armor increase per level up
    protected projectileCount: number = 1;
    protected piercing: boolean = false;
    protected projectileSpeed: number = 500;
    protected isAttacking: boolean = false;
    protected attackPauseTimer: number = 0;
    protected health: number = 100;
    protected maxHealth: number = 100;
    protected baseMaxHealth: number = 100;
    protected isInvulnerable: boolean = false;
    protected invulnerabilityDuration: number = 1000; // 1 second
    protected invulnerabilityTimer: number = 0;
    protected healthBar!: Phaser.GameObjects.Rectangle;
    protected healthBarBg!: Phaser.GameObjects.Rectangle;
    protected isBeingKnockedBack: boolean = false;
    protected isMelee: boolean = false;
    protected explosiveDamageMultiplier: number = 1;
    protected explosiveBossDamageMultiplier: number = 1;

    // Auto heal
    protected healOverTime: boolean = false;
    protected healOverTimeTimer: number = 0;
    protected healOverTimeAmount: number = 2;
    protected healOverTimeInterval: number = 1000; // 1 second
    
    // Critical strike properties
    protected criticalStrikeChance: number = 0.15;
    protected criticalStrikeDamage: number = 1.5; // 150% damage
    protected xpMultiplier: number = 1;
    protected qDamageToNormalMultiplier: number = 1;
    protected eSkillHeals: boolean = false;
    protected lifeSteal: number = 0;
    protected hasAegis: boolean = false;
    protected healthRegen: number = 0;
    protected healthRegenTimer: number = 0;

    // Attack properties
    protected comboCounter: number = 0;
    protected comboThreshold: number = 3;
    protected hasSpreadAttack: boolean = false; // Spread attack upgrade
    protected hasComboMaster: boolean = false; // Combo master upgrade
    protected hasAdvancedCombo: boolean = false; // Advanced combo upgrade
    protected shotCounter: number = 0; // Track shots for combo
    protected qSkillHomingMultiplier: number = 1;
    protected rProjectileMultiplier: number = 1;

    // Skills
    protected qSkillUnlocked: boolean = false;
    protected eSkillUnlocked: boolean = false;
    protected jumpSkillUnlocked: boolean = false;
    protected rSkillUnlocked: boolean = false;
    protected fSkillUnlocked: boolean = false;
    protected qCooldown: number = 3000; // 3 seconds
    protected eCooldown: number = 8000; // 8 seconds
    protected readonly originalECooldown: number;
    protected jumpCooldown: number = 2000; // 2 seconds
    protected rCooldown: number = 10000; // 10 seconds
    protected readonly originalRCooldown: number;
    protected fCooldown: number = 40000; // 40 seconds
    protected readonly originalFCooldown: number;
    protected qCooldownTimer: number = 0;
    protected eCooldownTimer: number = 0;
    protected jumpCooldownTimer: number = 0;
    protected rCooldownTimer: number = 0;
    protected fCooldownTimer: number = 0;
    
    // Dash properties
    protected dashSkillUnlocked: boolean = false;
    protected dashCooldown: number = 3000; // 3 seconds
    protected dashCooldownTimer: number = 0;
    protected isDashing: boolean = false;
    protected dashDuration: number = 200; // 200ms dash duration
    protected dashTimer: number = 0;
    protected dashSpeed: number = 1600; // Dash speed
    
    // Dash trail properties
    protected dashTrail: Phaser.GameObjects.Graphics | null = null;
    protected dashTrailPoints: Array<{x: number, y: number, alpha: number}> = [];
    protected maxTrailPoints: number = 15;
    
    // Shield
    protected shieldActive: boolean = false;
    protected shieldDuration: number = 2000; // 2 seconds
    protected shieldTimer: number = 0;
    protected shieldSprite: Phaser.GameObjects.Arc | null = null;
    protected shieldAbsorbs: boolean = false;
    
    // Jump properties
    protected isJumping: boolean = false;
    protected knockbackResistance: number = 1; // Reduce knockback to 100% of original
    protected items: ItemData[] = [];
    protected maxItems: number = 12;
    protected canMove: boolean = true;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        
        // Create player sprite (simple rectangle for now)
        this.sprite = scene.add.rectangle(0, 0, 20, 20, 0x00ff00);
        this.add(this.sprite);
        
        // Scale the player
        this.setScale(1.5);

        // Create health bar
        this.createHealthBar();
        
        // Create shield sprite (initially invisible)
        this.shieldSprite = scene.add.circle(0, 0, 25, 0xffff00, 0);
        if (this.shieldSprite) {
            this.shieldSprite.setStrokeStyle(3, 0xffff00);
            this.shieldSprite.setAlpha(0); // Start invisible
            this.add(this.shieldSprite);
        }
        
        // Add physics body
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(30, 30);
        body.setOffset(-15, -15); // Center the hitbox
        body.setCollideWorldBounds(false); // Remove world bounds
        
        scene.add.existing(this);
        
        // Initial skill unlock check
        this.unlockSkills(1);

        // Store original cooldowns
        this.originalECooldown = this.eCooldown;
        this.originalRCooldown = this.rCooldown;
        this.originalFCooldown = this.fCooldown;

        // Ensure maxHealth and health are set based on baseMaxHealth after all initializations
        this.maxHealth = this.baseMaxHealth;
        this.health = this.maxHealth;

        // Player starts with no items
    }

    private createHealthBar() {
        const barWidth = 30;
        const barHeight = 4;
        
        this.healthBarBg = this.scene.add.rectangle(0, -20, barWidth, barHeight, 0x333333);
        this.healthBar = this.scene.add.rectangle(0, -20, barWidth, barHeight, 0x00ff00);
        
        this.add([this.healthBarBg, this.healthBar]);

        // Initial update to reflect correct health values
        this.updateHealthBar();
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
            if (this.attackPauseTimer >= this.attackCooldown) {
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
        
        // Update dash movement
        this.updateDash(delta);
        
        // Update dash trail effect
        this.updateTrailEffect(delta);
        
        // Movement is now handled by physics velocity
        
        // Keep player within camera bounds
        this.constrainToCamera();

        // Heal over time
        this.updateHealOverTime(delta);
        this.updateHealthRegen(delta);
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
            const { damage, isCritical } = this.calculateDamage(this.attackDamage * 2);
            const projectile = new Projectile(
                scene,
                this.x,
                this.y,
                damage,
                this.projectileSpeed * 1.5,
                spreadAngle,
                true, // Combo attacks pierce
                false,
                isCritical
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
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body && !this.isBeingKnockedBack && !this.isDashing && this.canMove) {
            body.setVelocity(x * this.moveSpeed, y * this.moveSpeed);
        }
    }

    public abstract attack(): void;

    public abstract useESkill(): void;

    public abstract useFSkill(): void;

    private performSpreadAttack(scene: Phaser.Scene, gameScene: any, baseAngle: number, isComboShot: boolean = false, isHoming: boolean = false) {
        for (let i = 0; i < this.projectileCount; i++) {
            // Spread projectiles in an arc
            const spreadAngle = Math.PI / 4; // 45 degrees total spread
            const angleStep = spreadAngle / (this.projectileCount - 1);
            const projectileAngle = baseAngle - spreadAngle / 2 + angleStep * i;
            
            let projectile;
            // Only make center projectile explosive for combo (middle index)
            const centerIndex = Math.floor((this.projectileCount - 1) / 2);
            if (isComboShot && i === centerIndex) {
                const { damage, isCritical } = this.calculateDamage(this.attackDamage * 2);
                projectile = new ExplosiveProjectile(
                    scene,
                    this.x,
                    this.y,
                    damage,
                    this.projectileSpeed,
                    projectileAngle,
                    this.explosiveDamageMultiplier,
                    this.explosiveBossDamageMultiplier,
                    this.piercing,
                    isCritical
                );
            } else {
                const { damage, isCritical } = this.calculateDamage(this.attackDamage);
                projectile = new Projectile(
                    scene,
                    this.x,
                    this.y,
                    damage,
                    this.projectileSpeed,
                    projectileAngle,
                    this.piercing,
                    isHoming, // Enable homing if mouse is over enemy
                    isCritical
                );
            }
            
            gameScene.getProjectiles().add(projectile);
        }
    }

    private performBurstAttack(scene: Phaser.Scene, gameScene: any, angle: number, isComboShot: boolean = false, isHoming: boolean = false) {
        for (let i = 0; i < this.projectileCount; i++) {
            scene.time.delayedCall(i * 50, () => { // 50ms delay between shots
                let projectile;
                if (isComboShot && i === 0) { // Make first projectile explosive for combo
                    const { damage, isCritical } = this.calculateDamage(this.attackDamage * 2);
                    projectile = new ExplosiveProjectile(
                        scene,
                        this.x,
                        this.y,
                        damage,
                        this.projectileSpeed,
                        angle,
                        this.explosiveDamageMultiplier,
                        this.explosiveBossDamageMultiplier,
                        this.piercing,
                        isCritical
                    );
                } else {
                    const { damage, isCritical } = this.calculateDamage(this.attackDamage);
                    projectile = new Projectile(
                        scene,
                        this.x,
                        this.y,
                        damage,
                        this.projectileSpeed,
                        angle,
                        this.piercing,
                        isHoming, // Enable homing if mouse is over enemy
                        isCritical
                    );
                }
                
                gameScene.getProjectiles().add(projectile);
            });
        }
    }

    // Upgrade methods
    public increaseAttackSpeed(amount: number) {
        this.attackCooldown *= (1 - amount);
        this.attackCooldown = Math.max(100, this.attackCooldown);
    }

    public increaseDamage(amount: number) {
        this.bonusAttackDamage += amount;
    }

    public increaseMoveSpeed(amount: number) {
        this.moveSpeed *= (1 + amount);
    }

    public decreaseMoveSpeed(amount: number) {
        this.moveSpeed /= (1 + amount);
    }

    public increaseProjectileCount(amount: number) {
        this.projectileCount += amount;
    }

    public decreaseProjectileCount(amount: number) {
        this.projectileCount -= amount;
    }

    public enablePiercing() {
        this.piercing = true;
    }

    public unlockSkills(level: number) {
        const gameScene = this.scene as any;

        if (level >= SKILL_UNLOCK_LEVELS.Q && !this.qSkillUnlocked) {
            this.qSkillUnlocked = true;
            gameScene.showSkillUnlockMessage('Q Skill Unlocked!');
        }
        if (level >= SKILL_UNLOCK_LEVELS.E && !this.eSkillUnlocked) {
            this.eSkillUnlocked = true;
            gameScene.showSkillUnlockMessage('E Skill Unlocked!');
        }
        if (level >= SKILL_UNLOCK_LEVELS.JUMP && !this.jumpSkillUnlocked) {
            this.jumpSkillUnlocked = true;
            gameScene.showSkillUnlockMessage('Jump Skill Unlocked!');
        }
        if (level >= SKILL_UNLOCK_LEVELS.DASH && !this.dashSkillUnlocked) {
            this.dashSkillUnlocked = true;
            gameScene.showSkillUnlockMessage('Dash Skill Unlocked!');
        }
        if (level >= SKILL_UNLOCK_LEVELS.R && !this.rSkillUnlocked) {
            this.rSkillUnlocked = true;
            gameScene.showSkillUnlockMessage('R Skill Unlocked!');
        }
        if (level >= SKILL_UNLOCK_LEVELS.F && !this.fSkillUnlocked) {
            this.fSkillUnlocked = true;
            gameScene.showSkillUnlockMessage('F Skill Unlocked!');
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

    

    public applyKnockback(dx: number, dy: number, force: number) {
        if (this.isJumping || this.isDashing) return; // Disable knockback during jump or dash
    
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;
    
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            // Significantly reduce knockback for ranged players too
            const knockbackForce = force * this.getKnockbackResistance(); // 20% of original
            const knockbackVx = (dx / distance) * knockbackForce;
            const knockbackVy = (dy / distance) * knockbackForce;
            
            body.setVelocity(knockbackVx, knockbackVy);
    
            this.isBeingKnockedBack = true;
            this.scene.time.delayedCall(100, () => { // Reduced duration from 200ms to 100ms
                this.isBeingKnockedBack = false;
                if(this.active) {
                    body.setVelocity(0, 0);
                }
            });
        }
    }

    private updateHealOverTime(delta: number) {
        if (this.healOverTime) {
            this.healOverTimeTimer += delta;
            if (this.healOverTimeTimer >= this.healOverTimeInterval) {
                this.healOverTimeTimer -= this.healOverTimeInterval;
                this.heal(this.healOverTimeAmount);
            }
        }
    }

    private updateHealthRegen(delta: number) {
        if (this.healthRegen > 0) {
            this.healthRegenTimer += delta;
            if (this.healthRegenTimer >= 1000) {
                this.heal(this.maxHealth * this.healthRegen);
                this.healthRegenTimer -= 1000;
            }
        }
    }

    private updateSkillCooldowns(delta: number) {
        // Update all skill cooldown timers
        if (this.qCooldownTimer > 0) {
            this.qCooldownTimer = Math.max(0, this.qCooldownTimer - delta);
        }
        if (this.eCooldownTimer > 0) {
            this.eCooldownTimer = Math.max(0, this.eCooldownTimer - delta);
        }
        if (this.jumpCooldownTimer > 0) {
            this.jumpCooldownTimer = Math.max(0, this.jumpCooldownTimer - delta);
        }
        if (this.rCooldownTimer > 0) {
            this.rCooldownTimer = Math.max(0, this.rCooldownTimer - delta);
        }
        if (this.fCooldownTimer > 0) {
            this.fCooldownTimer = Math.max(0, this.fCooldownTimer - delta);
        }
        if (this.dashCooldownTimer > 0) {
            this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - delta);
        }
    }

    private updateDash(delta: number) {
        if (this.isDashing) {
            this.dashTimer += delta;
            
            // Add trail point while dashing
            this.addTrailPoint(this.x, this.y);
            
            if (this.dashTimer >= this.dashDuration) {
                this.isDashing = false;
                this.dashTimer = 0;
                // Stop dash movement
                const body = this.body as Phaser.Physics.Arcade.Body;
                if (body) {
                    body.setVelocity(0, 0);
                }
            }
        }
    }

    private constrainToCamera() {
        const camera = this.scene.cameras.main;
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        const worldView = camera.worldView;
        const halfWidth = body.width / 2;
        const halfHeight = body.height / 2;

        const minX = worldView.x + halfWidth;
        const maxX = worldView.right - halfWidth;
        const minY = worldView.y + halfHeight;
        const maxY = worldView.bottom - halfHeight;

        this.x = Phaser.Math.Clamp(this.x, minX, maxX);
        this.y = Phaser.Math.Clamp(this.y, minY, maxY);
    }

    public abstract useESkill(): void;

    protected activateShield() {
        this.shieldActive = true;
        this.shieldTimer = 0;
        if (this.shieldSprite) {
            this.shieldSprite.setAlpha(0.7);
        }
    }

    private deactivateShield() {
        this.shieldActive = false;
        this.shieldTimer = 0;
        if (this.shieldSprite) {
            this.shieldSprite.setAlpha(0);
        }
    }

    public increaseProjectileSpeed(amount: number) {
        this.projectileSpeed += amount;
    }

    public getProjectileSpeed(): number {
        return this.projectileSpeed;
    }

    public setShieldAbsorbs(absorbs: boolean) {
        this.shieldAbsorbs = absorbs;
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
        if (this.isInvulnerable) return;

        if (this.shieldActive) {
            if (this.shieldAbsorbs) {
                this.heal(damage * 0.5);
            }
            return;
        }
        
        // Apply armor damage reduction using logarithmic formula
        const damageReduction = this.getDamageReduction(); // Percentage reduction
        const actualDamage = Math.max(1, Math.round(damage * (1 - damageReduction / 100))); // Minimum 1 damage
        
        this.health -= actualDamage;
        this.isInvulnerable = true;
        this.invulnerabilityTimer = 0;
        
        // Show damage text (actual damage taken)
        this.showDamageText(actualDamage);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    public heal(amount: number) {
        if (this.health >= this.maxHealth) {
            return;
        }

        const healAmount = Math.min(amount, this.maxHealth - this.health);
        this.health += healAmount;

        // Show healing text
        this.showHealText(healAmount);
    }

    private showHealText(amount: number) {
        const healText = this.scene.add.text(this.x, this.y - 30, `+${Math.round(amount)}`, {
            fontSize: '16px',
            color: '#44ff44',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Animate healing text
        this.scene.tweens.add({
            targets: healText,
            y: healText.y - 40,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => healText.destroy()
        });
    }

    private showDamageText(damage: number) {
        const damageText = this.scene.add.text(this.x, this.y - 30, Math.round(damage).toString(), {
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

    protected calculateDamage(baseDamage: number): { damage: number, isCritical: boolean } {
        let finalDamage = baseDamage;
        let isCritical = false;
        if (Math.random() < this.criticalStrikeChance) {
            finalDamage *= this.criticalStrikeDamage;
            isCritical = true;
        }

        // Apply life steal
        if (this.lifeSteal > 0) {
            this.heal(finalDamage * this.lifeSteal);
        }

        return { damage: finalDamage, isCritical };
    }

    private die() {
        if (this.hasAegis) {
            this.hasAegis = false;
            this.health = this.maxHealth * 0.5;
            const itemData = this.items.find(item => item.id === 'aegis_of_the_immortal');
            if (itemData) {
                this.removeItem(itemData);
            }
            return;
        }
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

    public enableComboMaster() {
        this.hasComboMaster = true;
    }
    
    public enableAdvancedCombo() {
        this.hasAdvancedCombo = true;
    }

    public addItem(item: ItemData) {
        if (this.items.length >= this.maxItems) {
            return;
        }
        this.items.push(item);
        this.recalculateStats();
    }

    public removeItem(item: ItemData) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
            this.recalculateStats();
        }
    }

    public recalculateStats() {
        // Reset bonuses to their base values
        this.bonusAttackDamage = 0;
        this.attackDamageMultiplier = 1.0;
        this.projectileSpeed = 500;
        this.criticalStrikeDamage = 1.5;
        this.maxHealth = this.baseMaxHealth;
        this.healthRegen = 0;
        this.lifeSteal = 0;
        this.hasAegis = false;
        this.projectileCount = 1;
        this.moveSpeed = 200;
        this.attackCooldown = 1000;
        const level = this.scene.registry.get('playerLevel') || 1;
        this.armor = 10 + this.armorPerLevelUp * level; // Reset armor to base value

        // Apply item effects
        this.items.forEach(item => {
            if (item.applyEffect) {
                item.applyEffect(this);
            }
        });

        // Re-apply upgrades
        const gameScene = this.scene as GameScene;
        const upgradeManager = gameScene.getUpgradeManager();
        if (upgradeManager) {
            upgradeManager.reapplyUpgrades(this);
        }

        // Final calculation
        this.attackDamage = (this.baseAttackDamage + this.bonusAttackDamage) * this.attackDamageMultiplier;
    }

    public getItems(): ItemData[] {
        return this.items;
    }

    // Getter methods for character stats display
    public getAttackDamage(): number {
        return (this.baseAttackDamage + this.bonusAttackDamage) * this.attackDamageMultiplier;
    }
    
    public getAttackCooldown(): number {
        return this.attackCooldown;
    }
    
    public getMoveSpeed(): number {
        return this.moveSpeed;
    }
    
    public getArmor(): number {
        return this.armor;
    }
    
    public getDamageReduction(): number {
        return (-Math.exp(-this.armor / 100) + 1) * 100; // Percentage reduction
    }
    
    public increaseArmor(amount: number) {
        this.armor += amount;
    }

    public increaseBonusAttackDamage(amount: number) {
        this.bonusAttackDamage += amount;
    }

    public decreaseBonusAttackDamage(amount: number) {
        this.bonusAttackDamage -= amount;
    }

    public increaseAttackDamageMultiplier(amount: number) {
        this.attackDamageMultiplier += amount;
    }

    public decreaseAttackDamageMultiplier(amount: number) {
        this.attackDamageMultiplier -= amount;
    }

    public decreaseAttackSpeed(amount: number) {
        this.attackCooldown /= (1 - amount);
    }
    
    public increaseProjectileSpeedBonus(amount: number) {
        this.projectileSpeed += amount;
    }

    public decreaseProjectileSpeedBonus(amount: number) {
        this.projectileSpeed -= amount;
    }

    public increaseCriticalStrikeDamage(amount: number) {
        this.criticalStrikeDamage += amount;
    }

    public decreaseCriticalStrikeDamage(amount: number) {
        this.criticalStrikeDamage -= amount;
    }

    public increaseMaxHealth(amount: number) {
        this.maxHealth += amount;
    }

    public decreaseMaxHealth(amount: number) {
        this.maxHealth -= amount;
    }

    public setHealthRegen(amount: number) {
        this.healthRegen = amount;
    }

    public setLifeSteal(amount: number) {
        this.lifeSteal = amount;
    }

    public setHasAegis(value: boolean) {
        this.hasAegis = value;
    }

    public getProjectileCount(): number {
        return this.projectileCount;
    }
    
    public getDashCooldownTimer(): number {
        return this.dashCooldownTimer;
    }
    
    public getDashCooldown(): number {
        return this.dashCooldown;
    }
    
    public isDashSkillUnlocked(): boolean {
        return this.dashSkillUnlocked;
    }

    public isQSkillUnlocked(): boolean {
        return this.qSkillUnlocked;
    }

    public isESkillUnlocked(): boolean {
        return this.eSkillUnlocked;
    }

    public isRSkillUnlocked(): boolean {
        return this.rSkillUnlocked;
    }

    public getQSkillHomingMultiplier(): number {
        return this.qSkillHomingMultiplier;
    }

    public setQSkillHomingMultiplier(multiplier: number) {
        this.qSkillHomingMultiplier = multiplier;
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

    public getCriticalStrikeChance() {
        return this.criticalStrikeChance;
    }

    public setCriticalStrikeChance(chance: number) {
        this.criticalStrikeChance = chance;
    }

    public getCriticalStrikeDamage() {
        return this.criticalStrikeDamage;
    }

    public setCriticalStrikeDamage(damage: number) {
        this.criticalStrikeDamage = damage;
    }

    public getXPMultiplier() {
        return this.xpMultiplier;
    }

    public setXPMultiplier(multiplier: number) {
        this.xpMultiplier = multiplier;
    }

    public getQDamageToNormalMultiplier() {
        return this.qDamageToNormalMultiplier;
    }

    public setQDamageToNormalMultiplier(multiplier: number) {
        this.qDamageToNormalMultiplier = multiplier;
    }

    public setESkillHeals(heals: boolean) {
        this.eSkillHeals = heals;
    }

    public setECooldown(cooldown: number) {
        this.eCooldown = cooldown;
    }

    public getOriginalECooldown(): number {
        return this.originalECooldown;
    }

    public setRCooldown(cooldown: number) {
        this.rCooldown = cooldown;
    }

    public getRCooldown(): number {
        return this.rCooldown;
    }

    public getOriginalRCooldown(): number {
        return this.originalRCooldown;
    }

    public getRCooldownTimer(): number {
        return this.rCooldownTimer;
    }

    public isFSkillUnlocked(): boolean {
        return this.fSkillUnlocked;
    }

    public getFCooldown(): number {
        return this.fCooldown;
    }

    public setFCooldown(cooldown: number) {
        this.fCooldown = cooldown;
    }

    public getOriginalFCooldown(): number {
        return this.originalFCooldown;
    }

    public setRProjectileMultiplier(multiplier: number) {
        this.rProjectileMultiplier = multiplier;
    }

    public useFSkill() {
        if (!this.fSkillUnlocked || this.fCooldownTimer > 0) {
            return;
        }

        this.fCooldownTimer = this.fCooldown;

        const gameScene = this.scene as GameScene;
        const pet = new Pet(gameScene, this.x, this.y, this, 20000);
        gameScene.addPet(pet);
    }

    public useDashSkill() {
        if (!this.dashSkillUnlocked || this.dashCooldownTimer > 0 || this.isDashing) return;
        
        this.dashCooldownTimer = this.dashCooldown;
        this.isDashing = true;
        this.dashTimer = 0;
        
        // Create trail graphics if not exists
        this.createDashTrail();
        
        const scene = this.scene as Phaser.Scene;
        
        // Get mouse position for dash direction (world coordinates)
        const mousePointer = scene.input.activePointer;
        const mouseX = mousePointer.worldX;
        const mouseY = mousePointer.worldY;
        
        // Calculate direction to mouse
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize direction and apply dash speed
            const dashVelX = (dx / distance) * this.dashSpeed;
            const dashVelY = (dy / distance) * this.dashSpeed;
            
            // Apply dash velocity
            const body = this.body as Phaser.Physics.Arcade.Body;
            if (body) {
                body.setVelocity(dashVelX, dashVelY);
            }
        }
    }

    protected createDashTrail() {
        if (!this.dashTrail) {
            this.dashTrail = this.scene.add.graphics();
            this.dashTrail.setDepth(500); // Above most objects but below UI
        }
        this.dashTrailPoints = []; // Reset trail points
    }
    
    protected addTrailPoint(x: number, y: number) {
        this.dashTrailPoints.push({ x, y, alpha: 1.0 });
        
        // Limit trail length
        if (this.dashTrailPoints.length > this.maxTrailPoints) {
            this.dashTrailPoints.shift();
        }
    }
    
    protected updateTrailEffect(delta: number) {
        if (!this.dashTrail || this.dashTrailPoints.length === 0) return;
        
        // Clear previous trail
        this.dashTrail.clear();
        
        // Fade out trail points
        for (let i = 0; i < this.dashTrailPoints.length; i++) {
            const point = this.dashTrailPoints[i];
            point.alpha -= delta / 300; // Fade over 300ms
            
            if (point.alpha <= 0) {
                this.dashTrailPoints.splice(i, 1);
                i--;
                continue;
            }
            
            // Draw trail segment with default light blue color
            const size = 8 + (point.alpha * 12); // Size decreases as alpha decreases
            const trailColor = this.getDashTrailColor(point.alpha);
            
            this.dashTrail.fillStyle(trailColor.main, point.alpha * 0.8);
            this.dashTrail.fillCircle(point.x, point.y, size);
            
            // Add glow effect
            this.dashTrail.fillStyle(trailColor.glow, point.alpha * 0.3);
            this.dashTrail.fillCircle(point.x, point.y, size * 1.5);
        }
        
        // Clean up trail if no more points
        if (this.dashTrailPoints.length === 0 && this.dashTrail) {
            this.dashTrail.destroy();
            this.dashTrail = null;
        }
    }
    
    protected getDashTrailColor(alpha: number): {main: number, glow: number} {
        // Default light blue color for ranged characters
        const mainColor = Phaser.Display.Color.GetColor(
            Math.floor(173 * alpha), // Light blue R
            Math.floor(216 * alpha), // Light blue G  
            Math.floor(230 * alpha)  // Light blue B
        );
        return {
            main: mainColor,
            glow: 0x87CEEB // Light blue glow
        };
    }

    public getFCooldownTimer() {
        return this.fCooldownTimer;
    }

    public increaseAttackDamage(multiplier: number) {
        this.baseAttackDamage *= multiplier;
        this.recalculateStats();
    }
    
    public getArmorPerLevelUp(): number {
        return this.armorPerLevelUp;
    }
} 