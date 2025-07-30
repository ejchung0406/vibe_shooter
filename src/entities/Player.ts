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
    DASH: 5,
    R: 9,
    F: 7,
};

export class Player extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Rectangle;
    private attackTimer: number = 0;
    private attackCooldown: number = 1000; // milliseconds
    private velocityX: number = 0;
    private velocityY: number = 0;
    private moveSpeed: number = 200;

    // Stat rework
    private baseAttackDamage: number = 10;
    private bonusAttackDamage: number = 0;
    private attackDamageMultiplier: number = 1.0;
    private attackDamage: number = 10;

    private armor: number = 5; // Default armor value
    private projectileCount: number = 1;
    private piercing: boolean = false;
    private projectileSpeed: number = 500;
    private isAttacking: boolean = false;
    private attackPauseTimer: number = 0;
    private health: number = 100;
    private maxHealth: number = 100;
    private isInvulnerable: boolean = false;
    private invulnerabilityDuration: number = 1000; // 1 second
    private invulnerabilityTimer: number = 0;
    private healthBar!: Phaser.GameObjects.Rectangle;
    private healthBarBg!: Phaser.GameObjects.Rectangle;
    private isBeingKnockedBack: boolean = false;
    private explosiveDamageMultiplier: number = 1;
    private explosiveBossDamageMultiplier: number = 1;

    // Auto heal
    private healOverTime: boolean = false;
    private healOverTimeTimer: number = 0;
    private healOverTimeAmount: number = 2;
    private healOverTimeInterval: number = 1000; // 1 second
    
    // Critical strike properties
    private criticalStrikeChance: number = 0.15;
    private criticalStrikeDamage: number = 1.5; // 150% damage
    private xpMultiplier: number = 1;
    private qDamageToNormalMultiplier: number = 1;
    private eSkillHeals: boolean = false;
    private lifeSteal: number = 0;
    private hasAegis: boolean = false;
    private healthRegen: number = 0;

    // Attack properties
    private comboCounter: number = 0;
    private comboThreshold: number = 3;
    private hasSpreadAttack: boolean = false; // Spread attack upgrade
    private hasComboMaster: boolean = false; // Combo master upgrade
    private hasAdvancedCombo: boolean = false; // Advanced combo upgrade
    private shotCounter: number = 0; // Track shots for combo
    private qSkillHomingMultiplier: number = 1;
    private rProjectileMultiplier: number = 1;

    // Skills
    private qSkillUnlocked: boolean = false;
    private eSkillUnlocked: boolean = false;
    private dashSkillUnlocked: boolean = false; // New dash skill
    private rSkillUnlocked: boolean = false;
    private fSkillUnlocked: boolean = false;
    private qCooldown: number = 3000; // 3 seconds
    private eCooldown: number = 8000; // 8 seconds
    private readonly originalECooldown: number;
    private dashCooldown: number = 2000; // 2 seconds
    private rCooldown: number = 10000; // 10 seconds
    private readonly originalRCooldown: number;
    private fCooldown: number = 40000; // 40 seconds
    private qCooldownTimer: number = 0;
    private eCooldownTimer: number = 0;
    private dashCooldownTimer: number = 0; // New dash cooldown timer
    private rCooldownTimer: number = 0;
    private fCooldownTimer: number = 0;
    
    // Shield
    private shieldActive: boolean = false;
    private shieldDuration: number = 2000; // 2 seconds
    private shieldTimer: number = 0;
    private shieldSprite: Phaser.GameObjects.Arc | null = null;
    private shieldAbsorbs: boolean = false;
    
    // Dash properties
    private isDashing: boolean = false;
    private dashDistance: number = 250; // Reduced from 500 to half
    private dashSpeed: number = 2000; // Very fast speed
    private dashDuration: number = 150; // 0.25 seconds
    private dashTimer: number = 0;
    
    // Dash visual effects
    private dashTrail: Phaser.GameObjects.Graphics | null = null;
    private dashTrailPoints: { x: number, y: number, alpha: number }[] = [];
    private maxTrailPoints: number = 15;
    private knockbackResistance: number = 0.3; // Reduce knockback to 30% of original
    private items: ItemData[] = [];
    private maxItems: number = 12;

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

        // Player starts with no items
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
        
        // Movement is now handled by physics velocity
        
        // Keep player within camera bounds
        this.constrainToCamera();

        // Heal over time
        this.updateHealOverTime(delta);
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
        if (body && !this.isBeingKnockedBack && !this.isDashing) {
            body.setVelocity(x * this.moveSpeed, y * this.moveSpeed);
        }
    }

    public attack() {
        if (this.isAttacking) return; // Prevent multiple attacks during pause
        
        this.isAttacking = true;
        this.attackPauseTimer = 0;
        
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        
        // Get mouse position for shooting direction (world coordinates)
        const mousePointer = scene.input.activePointer;
        const mouseX = mousePointer.worldX;
        const mouseY = mousePointer.worldY;
        
        // Check if mouse is over an enemy for homing
        const enemies = gameScene.getEnemies().getChildren();
        let isHoming = false;
        
        enemies.forEach((enemy: any) => {
            const dx = mouseX - enemy.x;
            const dy = mouseY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If mouse is within enemy bounds (assuming enemy size is roughly 40x40)
            if (distance < 30) {
                isHoming = true;
            }
        });
        
        // Calculate angle to mouse
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const angle = Math.atan2(dy, dx);
        
        if (this.projectileCount === 1) {
            // Single projectile - check for combo
            this.shotCounter++;
            const isComboShot = this.hasAdvancedCombo ? this.shotCounter % 2 === 0 : (this.hasComboMaster && this.shotCounter % 3 === 0);
            
            if (isComboShot) {
                // Create explosive projectile
                const { damage, isCritical } = this.calculateDamage(this.attackDamage * 2);
                const projectile = new ExplosiveProjectile(
                    scene,
                    this.x,
                    this.y,
                    damage, // Double damage
                    this.projectileSpeed,
                    angle,
                    this.explosiveDamageMultiplier,
                    this.explosiveBossDamageMultiplier,
                    this.piercing,
                    isCritical
                );
                gameScene.getProjectiles().add(projectile);
            } else {
                // Regular projectile
                const { damage, isCritical } = this.calculateDamage(this.attackDamage);
                const projectile = new Projectile(
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
                gameScene.getProjectiles().add(projectile);
            }
        } else {
            // Multi-projectile attacks - increment counter for combo tracking
            this.shotCounter++;
            const isComboShot = this.hasAdvancedCombo ? this.shotCounter % 2 === 0 : (this.hasComboMaster && this.shotCounter % 3 === 0);
            
            this.performBurstAttack(scene, gameScene, angle, isComboShot, isHoming);
        }
        
        // Combo system disabled for now
    }

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
    
    private createDashTrail() {
        if (!this.dashTrail) {
            this.dashTrail = this.scene.add.graphics();
            this.dashTrail.setDepth(500); // Above most objects but below UI
        }
        this.dashTrailPoints = []; // Reset trail points
    }
    
    private addTrailPoint(x: number, y: number) {
        this.dashTrailPoints.push({ x, y, alpha: 1.0 });
        
        // Limit trail length
        if (this.dashTrailPoints.length > this.maxTrailPoints) {
            this.dashTrailPoints.shift();
        }
    }
    
    private updateTrailEffect(delta: number) {
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
            
            // Draw trail segment
            const size = 8 + (point.alpha * 12); // Size decreases as alpha decreases
            const color = Phaser.Display.Color.GetColor(
                Math.floor(173 * point.alpha), // Light blue R
                Math.floor(216 * point.alpha), // Light blue G  
                Math.floor(230 * point.alpha)  // Light blue B
            );
            
            this.dashTrail.fillStyle(color, point.alpha * 0.8);
            this.dashTrail.fillCircle(point.x, point.y, size);
            
            // Add glow effect
            this.dashTrail.fillStyle(0x87CEEB, point.alpha * 0.3); // Light blue glow
            this.dashTrail.fillCircle(point.x, point.y, size * 1.5);
        }
        
        // Clean up trail if no more points
        if (this.dashTrailPoints.length === 0 && this.dashTrail) {
            this.dashTrail.destroy();
            this.dashTrail = null;
        }
    }

    private updateSkillCooldowns(delta: number) {
        if (this.qCooldownTimer > 0) {
            this.qCooldownTimer -= delta;
        }
        
        if (this.eCooldownTimer > 0) {
            this.eCooldownTimer -= delta;
        }
        
        if (this.dashCooldownTimer > 0) {
            this.dashCooldownTimer -= delta;
        }
        if (this.rCooldownTimer > 0) {
            this.rCooldownTimer -= delta;
        }
        if (this.fCooldownTimer > 0) {
            this.fCooldownTimer -= delta;
        }
    }
    
    private updateDash(delta: number) {
        if (this.isDashing) {
            this.dashTimer += delta;
            
            // Add current position to trail
            this.addTrailPoint(this.x, this.y);
            
            if (this.dashTimer >= this.dashDuration) {
                // End dash
                this.isDashing = false;
                this.dashTimer = 0;
                
                // Reset velocity to normal
                const body = this.body as Phaser.Physics.Arcade.Body;
                if (body) {
                    body.setVelocity(0, 0);
                }
            }
        }
        
        // Update trail effect
        this.updateTrailEffect(delta);
    }

    public useRSkill() {
        if (!this.rSkillUnlocked || this.rCooldownTimer > 0) return;

        this.rCooldownTimer = this.rCooldown;

        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;

        const mousePointer = scene.input.activePointer;
        const mouseX = mousePointer.worldX;
        const mouseY = mousePointer.worldY;

        const angle = Math.atan2(mouseY - this.y, mouseX - this.x);

        for (let i = 0; i < 7 * this.rProjectileMultiplier; i++) {
            scene.time.delayedCall(i * 50 / this.rProjectileMultiplier, () => {
                const { damage, isCritical } = this.calculateDamage(this.attackDamage * 1.5);
                const projectile = new ExplosiveProjectile(
                    scene,
                    this.x,
                    this.y,
                    damage,
                    this.projectileSpeed * 1.5,
                    angle,
                    this.explosiveDamageMultiplier,
                    this.explosiveBossDamageMultiplier,
                    false,
                    isCritical
                );

                gameScene.getProjectiles().add(projectile);
            });
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
        const projectileCount = ( 5 + playerLevel ) * this.qSkillHomingMultiplier;
        
        for (let i = 0; i < projectileCount; i++) {
            this.scene.time.delayedCall(i * 50 / this.qSkillHomingMultiplier, () => {
                const angle = (i / projectileCount) * Math.PI * 2;
                const offsetX = Math.cos(angle) * 30;
                const offsetY = Math.sin(angle) * 30;
                
                // Distribute projectiles between targets
                let targetIndex = 0;
                if (targetEnemies.length === 2) {
                    targetIndex = i < Math.floor(projectileCount / 2) ? 0 : 1; // Split evenly between enemies
                }
                
                if (targetEnemies[targetIndex]) {
                    const target = targetEnemies[targetIndex];
                    let damage = this.attackDamage * 0.6;
                    if (!target.enemy.isBossEnemy()) {
                        damage *= this.qDamageToNormalMultiplier;
                    }
                    const { damage: finalDamage, isCritical } = this.calculateDamage(damage);
                    
                    const projectile = new QProjectile(
                        scene,
                        this.x + offsetX,
                        this.y + offsetY,
                        finalDamage,
                        target.fixedX,
                        target.fixedY,
                        isCritical
                    );
                    
                    gameScene.getProjectiles().add(projectile);
                }
            });
        }
    }

    public applyKnockback(dx: number, dy: number, force: number) {
        if (this.isDashing) return;
    
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;
    
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            const knockbackForce = force * this.getKnockbackResistance();
            const knockbackVx = (dx / distance) * knockbackForce;
            const knockbackVy = (dy / distance) * knockbackForce;
            
            body.setVelocity(knockbackVx, knockbackVy);
    
            this.isBeingKnockedBack = true;
            this.scene.time.delayedCall(200, () => {
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

    public useESkill() {
        if (!this.eSkillUnlocked || this.eCooldownTimer > 0 || this.shieldActive) return;
        
        this.eCooldownTimer = this.eCooldown;
        this.activateShield();

        if (this.eSkillHeals) {
            this.heal(this.maxHealth * 0.1);
        }
    }

    private activateShield() {
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

    private calculateDamage(baseDamage: number): { damage: number, isCritical: boolean } {
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
        const index = this.items.findIndex(i => i.id === item.id);
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
        this.maxHealth = 100;
        this.healthRegen = 0;
        this.lifeSteal = 0;
        this.hasAegis = false;
        this.projectileCount = 1;
        this.moveSpeed = 200;
        this.attackCooldown = 1000;

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
        return (-Math.exp(-this.armor / 50) + 1) * 100; // Percentage reduction
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

    public getFCooldownTimer() {
        return this.fCooldownTimer;
    }

    public increaseAttackDamage(multiplier: number) {
        this.baseAttackDamage *= multiplier;
        this.recalculateStats();
    }
} 