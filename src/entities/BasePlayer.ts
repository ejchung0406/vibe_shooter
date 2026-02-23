import Phaser from 'phaser';
import { Pet } from './Pet';
import { GameScene } from '../scenes/GameScene';
import { ItemData } from './Item';
import { PlayerStatName, StatOp } from '../data/PlayerStats';
import { GameSceneInterface } from '../types/GameSceneInterface';
import { SoundManager } from '../systems/SoundManager';

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
    protected detailsGraphics!: Phaser.GameObjects.Graphics;
    protected bodyColor: number = 0x22AA66;
    protected chestColor: number = 0x33CC77;
    protected attackTimer: number = 0;
    protected attackCooldown: number = 1000; // milliseconds
    protected velocityX: number = 0;
    protected velocityY: number = 0;
    protected moveSpeed: number = 200;

    // Stat rework
    protected baseAttackDamage: number = 30;
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
    protected baseMaxHealth: number = 150;
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
    protected xpMagnetRange: number = 0; // 0 = disabled

    // Mana system (used by MagePlayer, stubs for others)
    protected mana: number = 0;
    protected maxMana: number = 0;
    protected baseMana: number = 0;
    protected baseManaRegen: number = 0;
    protected manaRegen: number = 0;
    protected manaRegenTimer: number = 0;

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
    protected dashSkillUnlocked: boolean = false;

    // Cooldown map: { max cooldown, current timer }
    protected cooldowns: Map<string, { max: number, timer: number }> = new Map([
        ['q', { max: 3000, timer: 0 }],
        ['e', { max: 8000, timer: 0 }],
        ['jump', { max: 2000, timer: 0 }],
        ['r', { max: 10000, timer: 0 }],
        ['f', { max: 40000, timer: 0 }],
        ['dash', { max: 3000, timer: 0 }],
    ]);

    // Store original cooldowns for upgrades that reduce cooldowns
    protected readonly originalECooldown: number;
    protected readonly originalRCooldown: number;
    protected readonly originalFCooldown: number;
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
        
        // Create player body
        this.sprite = scene.add.rectangle(0, 2, 20, 24, this.bodyColor);
        this.sprite.setStrokeStyle(1, 0x000000);
        this.add(this.sprite);

        // Details overlay (head, chest, eyes)
        this.detailsGraphics = scene.add.graphics();
        this.drawPlayerDetails();
        this.add(this.detailsGraphics);

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

        // Store original cooldowns from map
        this.originalECooldown = this.cooldowns.get('e')!.max;
        this.originalRCooldown = this.cooldowns.get('r')!.max;
        this.originalFCooldown = this.cooldowns.get('f')!.max;

        // Ensure maxHealth and health are set based on baseMaxHealth after all initializations
        this.maxHealth = this.baseMaxHealth;
        this.health = this.maxHealth;

        // Player starts with no items
    }

    protected drawPlayerDetails() {
        this.detailsGraphics.clear();
        const g = this.detailsGraphics;
        // Top-down body outline
        g.lineStyle(1.5, 0x000000, 0.5);
        g.strokeCircle(0, 0, 11);
        // Inner body shade
        g.fillStyle(this.chestColor, 0.5);
        g.fillCircle(0, 0, 8);
        // Directional wedge (points up = forward)
        g.fillStyle(0xffffff, 0.6);
        g.fillTriangle(-4, -2, 0, -12, 4, -2);
        // Belt strap across middle
        g.lineStyle(2, 0x000000, 0.3);
        g.beginPath();
        g.moveTo(-8, 2);
        g.lineTo(8, 2);
        g.strokePath();
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

    update(_time: number, delta: number) {
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
                this.sprite.setFillStyle(0xffffff);
                this.detailsGraphics.setAlpha(0.3);
            } else {
                this.sprite.setFillStyle(this.bodyColor);
                this.detailsGraphics.setAlpha(1);
            }

            if (this.invulnerabilityTimer >= this.invulnerabilityDuration) {
                this.isInvulnerable = false;
                this.invulnerabilityTimer = 0;
                this.sprite.setFillStyle(this.bodyColor);
                this.detailsGraphics.setAlpha(1);
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

        // Mana regen (no-op for non-mage: maxMana=0)
        if (this.maxMana > 0 && this.manaRegen > 0) {
            this.manaRegenTimer += delta;
            if (this.manaRegenTimer >= 1000) {
                this.manaRegenTimer -= 1000;
                this.mana = Math.min(this.maxMana, this.mana + this.manaRegen);
            }
        }
    }

    public setVelocity(x: number, y: number) {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body && !this.isBeingKnockedBack && !this.isDashing && this.canMove) {
            body.setVelocity(x * this.moveSpeed, y * this.moveSpeed);
        }
    }

    public abstract attack(): void;
    public abstract useQSkill(): void;
    public abstract useRSkill(): void;

    public useESkill(): void {
        if (!this.eSkillUnlocked || this.getCooldownTimer('e') > 0 || this.shieldActive) return;

        SoundManager.getInstance().play('shieldActivate');
        this.startCooldown('e');
        this.activateShield();

        if (this.eSkillHeals) {
            this.heal(this.maxHealth * 0.1);
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
        const gameScene = this.scene as GameSceneInterface;

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
        if (this.isDashing) return; // Disable knockback during dash

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
        for (const cd of this.cooldowns.values()) {
            if (cd.timer > 0) {
                cd.timer = Math.max(0, cd.timer - delta);
            }
        }
    }

    // Cooldown helpers
    public startCooldown(id: string) {
        const cd = this.cooldowns.get(id);
        if (cd) cd.timer = cd.max;
    }

    public isCooldownReady(id: string): boolean {
        const cd = this.cooldowns.get(id);
        return cd ? cd.timer <= 0 : true;
    }

    public getCooldownTimer(id: string): number {
        return this.cooldowns.get(id)?.timer ?? 0;
    }

    public getCooldownMax(id: string): number {
        return this.cooldowns.get(id)?.max ?? 0;
    }

    protected setCooldownMax(id: string, max: number) {
        const cd = this.cooldowns.get(id);
        if (cd) cd.max = max;
    }

    // Generic stat modification for data-driven items
    public applyStat(stat: PlayerStatName, op: StatOp, value: number) {
        switch (stat) {
            case 'bonusAttackDamage':
                if (op === 'add') this.bonusAttackDamage += value;
                break;
            case 'attackDamageMultiplier':
                if (op === 'add') this.attackDamageMultiplier += value;
                break;
            case 'attackSpeed':
                if (op === 'multiply') this.attackCooldown *= (1 - value);
                this.attackCooldown = Math.max(100, this.attackCooldown);
                break;
            case 'projectileSpeed':
                if (op === 'add') this.projectileSpeed += value;
                break;
            case 'criticalStrikeDamage':
                if (op === 'add') this.criticalStrikeDamage += value;
                break;
            case 'maxHealth':
                if (op === 'add') this.maxHealth += value;
                break;
            case 'moveSpeed':
                if (op === 'multiply') this.moveSpeed *= (1 + value);
                break;
            case 'projectileCount':
                if (op === 'add') this.projectileCount += value;
                break;
            case 'healthRegen':
                if (op === 'set') this.healthRegen = value;
                break;
            case 'lifeSteal':
                if (op === 'set') this.lifeSteal = value;
                break;
            case 'hasAegis':
                if (op === 'set') this.hasAegis = value === 1;
                break;
            case 'armor':
                if (op === 'add') this.armor += value;
                break;
            case 'criticalStrikeChance':
                if (op === 'add') this.criticalStrikeChance += value;
                break;
            case 'maxMana':
                if (op === 'add') this.maxMana += value;
                break;
            case 'manaRegen':
                if (op === 'add') this.manaRegen += value;
                break;
        }
    }

    public removeStat(stat: PlayerStatName, op: StatOp, value: number) {
        switch (stat) {
            case 'bonusAttackDamage':
                if (op === 'add') this.bonusAttackDamage -= value;
                break;
            case 'attackDamageMultiplier':
                if (op === 'add') this.attackDamageMultiplier -= value;
                break;
            case 'attackSpeed':
                if (op === 'multiply') this.attackCooldown /= (1 - value);
                break;
            case 'projectileSpeed':
                if (op === 'add') this.projectileSpeed -= value;
                break;
            case 'criticalStrikeDamage':
                if (op === 'add') this.criticalStrikeDamage -= value;
                break;
            case 'maxHealth':
                if (op === 'add') this.maxHealth -= value;
                break;
            case 'moveSpeed':
                if (op === 'multiply') this.moveSpeed /= (1 + value);
                break;
            case 'projectileCount':
                if (op === 'add') this.projectileCount -= value;
                break;
            case 'healthRegen':
                if (op === 'set') this.healthRegen = 0;
                break;
            case 'lifeSteal':
                if (op === 'set') this.lifeSteal = 0;
                break;
            case 'hasAegis':
                if (op === 'set') this.hasAegis = false;
                break;
            case 'armor':
                if (op === 'add') this.armor -= value;
                break;
            case 'criticalStrikeChance':
                if (op === 'add') this.criticalStrikeChance -= value;
                break;
            case 'maxMana':
                if (op === 'add') this.maxMana -= value;
                break;
            case 'manaRegen':
                if (op === 'add') this.manaRegen -= value;
                break;
        }
    }

    // Melee stubs - overridden in MeleePlayer, no-ops in BasePlayer
    public increaseMeleeAttackCount(_amount: number) { /* no-op for ranged */ }
    public decreaseMeleeAttackCount(_amount: number) { /* no-op for ranged */ }
    public getMeleeAttackCount(): number { return 0; }

    private updateDash(delta: number) {
        if (this.isDashing) {
            this.dashTimer += delta;
            
            // Add trail point while dashing
            this.addTrailPoint(this.x, this.y);
            
            if (this.dashTimer >= this.dashDuration) {
                this.isDashing = false;
                this.dashTimer = 0;
                // Keep invulnerability for a short grace period after dash
                this.isInvulnerable = true;
                this.invulnerabilityTimer = 0;
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

        SoundManager.getInstance().play('playerHit');
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

        // Only play heal sound for significant heals (not tiny regen ticks)
        if (healAmount >= this.maxHealth * 0.05) {
            SoundManager.getInstance().play('heal');
        }
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
        // Game over logic will be handled by the scene
        const gameScene = this.scene as GameSceneInterface;
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
        return this.getCooldownTimer('q');
    }

    public getECooldownTimer() {
        return this.getCooldownTimer('e');
    }

    public getQCooldown() {
        return this.getCooldownMax('q');
    }

    public getECooldown() {
        return this.getCooldownMax('e');
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

    public addItem(item: ItemData): boolean {
        // Check for duplicate — level up existing item instead
        const existing = this.items.find(i => i.id === item.id);
        if (existing) {
            existing.level = (existing.level || 1) + 1;
            this.recalculateStats();
            return true; // leveled up
        }

        if (this.items.length >= this.maxItems) {
            return false;
        }
        this.items.push(item);
        this.recalculateStats();
        return false; // new item
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
        this.maxMana = this.baseMana;
        this.manaRegen = this.baseManaRegen;

        // Apply item effects (scaled by level)
        this.items.forEach(item => {
            if (item.applyEffect) {
                const level = item.level || 1;
                for (let i = 0; i < level; i++) {
                    item.applyEffect(this);
                }
            }
        });

        // Re-apply upgrades
        const gameScene = this.scene as GameScene;
        const upgradeManager = gameScene.getUpgradeManager();
        if (upgradeManager) {
            upgradeManager.reapplyUpgrades(this);
        }

        // Ensure maxHealth never goes below 1
        this.maxHealth = Math.max(1, this.maxHealth);
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
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
        return this.getCooldownTimer('dash');
    }

    public getDashCooldown(): number {
        return this.getCooldownMax('dash');
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

    public getXPMagnetRange(): number {
        return this.xpMagnetRange;
    }

    public setXPMagnetRange(range: number) {
        this.xpMagnetRange = range;
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
        this.setCooldownMax('e', cooldown);
    }

    public getOriginalECooldown(): number {
        return this.originalECooldown;
    }

    public setRCooldown(cooldown: number) {
        this.setCooldownMax('r', cooldown);
    }

    public getRCooldown(): number {
        return this.getCooldownMax('r');
    }

    public getOriginalRCooldown(): number {
        return this.originalRCooldown;
    }

    public getRCooldownTimer(): number {
        return this.getCooldownTimer('r');
    }

    public isFSkillUnlocked(): boolean {
        return this.fSkillUnlocked;
    }

    public getFCooldown(): number {
        return this.getCooldownMax('f');
    }

    public setFCooldown(cooldown: number) {
        this.setCooldownMax('f', cooldown);
    }

    public getOriginalFCooldown(): number {
        return this.originalFCooldown;
    }

    public setRProjectileMultiplier(multiplier: number) {
        this.rProjectileMultiplier = multiplier;
    }

    public useFSkill() {
        if (!this.fSkillUnlocked || this.getCooldownTimer('f') > 0) {
            return;
        }

        SoundManager.getInstance().play('petSummon');
        this.startCooldown('f');

        const gameScene = this.scene as GameScene;
        const pet = new Pet(gameScene, this.x, this.y, this, 20000);
        gameScene.addPet(pet);
    }

    public useDashSkill() {
        if (!this.dashSkillUnlocked || this.getCooldownTimer('dash') > 0 || this.isDashing) return;

        SoundManager.getInstance().play('dash');
        this.startCooldown('dash');
        this.isDashing = true;
        this.dashTimer = 0;

        // Grant invulnerability during dash
        this.isInvulnerable = true;
        this.invulnerabilityTimer = 0;

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
        return this.getCooldownTimer('f');
    }

    public increaseAttackDamage(multiplier: number) {
        this.baseAttackDamage *= multiplier;
        this.recalculateStats();
    }

    public getArmorPerLevelUp(): number {
        return this.armorPerLevelUp;
    }

    // Public setters for properties UpgradeManager needs
    public setAttackCooldownMultiplier(multiplier: number) {
        this.attackCooldown *= multiplier;
        this.attackCooldown = Math.max(100, this.attackCooldown);
    }

    public setHealOverTime(enabled: boolean) {
        this.healOverTime = enabled;
    }

    public setPiercing(enabled: boolean) {
        this.piercing = enabled;
    }

    public getMana(): number { return this.mana; }
    public getMaxMana(): number { return this.maxMana; }
} 