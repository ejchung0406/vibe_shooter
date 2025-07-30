import { BasePlayer } from './BasePlayer';
import { Pet } from './Pet';
import { GameScene } from '../scenes/GameScene';

export class MeleePlayer extends BasePlayer {
    protected attackRange: number = 200;
    protected baseAttackRange: number = 200; // Store the base value
    protected attackRangeMultiplier: number = 1; // Track the multiplier
    protected meleeAttackCount: number = 1;
    protected qSkillDamageMultiplier: number = 1;
    protected qSkillRadius: number = 200;
    protected baseQSkillRadius: number = 200; // Store the base value
    protected qSkillRadiusMultiplier: number = 1; // Track the multiplier
    private dashHitEnemies: Set<any> = new Set(); // Track enemies hit during current dash

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        this.baseMaxHealth = 150;
        this.health = 150;
        this.armor = 10;
        this.isMelee = true;
        
        // Override dash duration to be 2x longer for melee
        this.dashDuration = 400; // 400ms instead of 200ms
    }

    public attack(): void {
        if (this.isAttacking) return;

        this.isAttacking = true;
        this.attackPauseTimer = 0;
        this.canMove = false;
        this.scene.time.delayedCall(200, () => {
            this.canMove = true;
        });

        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;

        const mousePointer = scene.input.activePointer;
        const mouseX = mousePointer.worldX;
        const mouseY = mousePointer.worldY;

        const angle = Math.atan2(mouseY - this.y, mouseX - this.x);

        for (let i = 0; i < this.meleeAttackCount; i++) {
            this.scene.time.delayedCall(i * 100, () => { // Small delay between swings
                this.performMeleeSwing(angle, gameScene);
            });
        }
    }

    public useQSkill(): void {
        if (!this.qSkillUnlocked || this.qCooldownTimer > 0) return;

        this.qCooldownTimer = this.qCooldown;
        this.canMove = false;
        this.scene.time.delayedCall(300, () => {
            this.canMove = true;
        });

        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;

        // Create a visual effect for the AoE
        const ring = scene.add.graphics();
        ring.fillStyle(0xffffff, 0.2); // Filled circle
        ring.fillCircle(this.x, this.y, this.qSkillRadius);
        scene.tweens.add({
            targets: ring,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                ring.destroy();
            }
        });

        // Damage enemies in the AoE
        const enemies = gameScene.getEnemies().getChildren();
        enemies.forEach((enemy: any) => {
            // Check if enemy hitbox intersects with Q skill radius
            const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
            if (enemyBody) {
                // Create a circle for the Q skill area
                const qSkillCircle = new Phaser.Geom.Circle(this.x, this.y, this.qSkillRadius);
                
                // Create a rectangle from the enemy's physics body
                const enemyRect = new Phaser.Geom.Rectangle(enemyBody.x, enemyBody.y, enemyBody.width, enemyBody.height);
                
                // Check if enemy hitbox intersects with Q skill circle
                if (Phaser.Geom.Intersects.CircleToRectangle(qSkillCircle, enemyRect)) {
                    // Calculate distance from player to enemy center for damage falloff
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    let damageMultiplier = this.qSkillDamageMultiplier;

                    // Give bonus damage to enemies CLOSER to the center (within 50% of radius)
                    if (distance <= this.qSkillRadius * 0.5) {
                        damageMultiplier *= 1.5; // 50% bonus for close enemies
                    }
                    
                    // Don't multiply by meleeAttackCount - Q skill has its own base damage
                    const { damage, isCritical } = this.calculateDamage(this.attackDamage * damageMultiplier);
                    enemy.takeDamage(damage, isCritical);
                    
                    // Apply bleeding effect only to boss enemies (1/5 of R skill bleeding)
                    if (enemy.isBossEnemy && enemy.isBossEnemy()) {
                        // R skill bleeding: 5% of max health per second for 10 seconds
                        // Q skill bleeding: 2% of max health per second for 10 seconds (40% of R skill)
                        enemy.applyBleed(10000, enemy.getMaxHealth() * 0.02);
                    }
                }
            }
        });
    }

    public useRSkill(): void {
        if (!this.rSkillUnlocked || this.rCooldownTimer > 0) return;

        this.rCooldownTimer = this.rCooldown;
        this.canMove = false;
        this.scene.time.delayedCall(500, () => {
            this.canMove = true;
        });

        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;

        const radius = 400;

        // Create a visual effect for the AoE
        const ring = scene.add.graphics();
        ring.lineStyle(10, 0xff0000, 0.5);
        ring.strokeCircle(this.x, this.y, radius);
        scene.tweens.add({
            targets: ring,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                ring.destroy();
            }
        });

        // Damage and apply bleed to enemies in the AoE
        const enemies = gameScene.getEnemies().getChildren();
        enemies.forEach((enemy: any) => {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < radius) {
                const { damage, isCritical } = this.calculateDamage(this.attackDamage * 2);
                enemy.takeDamage(damage, isCritical);
                enemy.applyBleed(10000, enemy.getMaxHealth() * 0.05); // Bleed for 5% of max health per second for 10 seconds
            }
        });
    }

    public useESkill(): void {
        if (!this.eSkillUnlocked || this.eCooldownTimer > 0 || this.shieldActive) return;
        
        this.eCooldownTimer = this.eCooldown;
        this.activateShield();

        if (this.eSkillHeals) {
            this.heal(this.maxHealth * 0.1);
        }
    }

    public useFSkill(): void {
        if (!this.fSkillUnlocked || this.fCooldownTimer > 0) {
            return;
        }

        this.fCooldownTimer = this.fCooldown;

        const gameScene = this.scene as GameScene;
        const pet = new Pet(gameScene, this.x, this.y, this, 20000);
        gameScene.addPet(pet);
    }

    public increaseAttackRange(amount: number) {
        // Add to the multiplier instead of modifying the range directly
        this.attackRangeMultiplier += amount;
        console.log(`increaseAttackRange(${amount}): attackRangeMultiplier=${this.attackRangeMultiplier}`);
        // Don't recalculate here - let recalculateStats() handle it
    }

    public increaseMeleeAttackCount(amount: number) {
        this.meleeAttackCount += amount;
    }

    public increaseQSkillDamage(amount: number) {
        // Use additive scaling for damage multiplier
        this.qSkillDamageMultiplier += amount;
    }

    public increaseQSkillRadius(amount: number) {
        // Add to the multiplier instead of modifying the radius directly
        this.qSkillRadiusMultiplier += amount;
        console.log(`increaseQSkillRadius(${amount}): qSkillRadiusMultiplier=${this.qSkillRadiusMultiplier}`);
        // Don't recalculate here - let recalculateStats() handle it
    }

    public getMeleeAttackCount(): number {
        return this.meleeAttackCount;
    }

    public getAttackRange(): number {
        return this.attackRange;
    }

    public getQSkillRadius(): number {
        return this.qSkillRadius;
    }

    public recalculateStats() {
        // DON'T reset multipliers here - let the upgrade system handle that
        // Just recalculate the derived values from current multipliers
        this.attackRange = this.baseAttackRange * this.attackRangeMultiplier;
        this.qSkillRadius = this.baseQSkillRadius * this.qSkillRadiusMultiplier;
        
        // Debug logging
        console.log(`MeleePlayer recalculating: attackRange=${this.attackRange} (base=${this.baseAttackRange} * ${this.attackRangeMultiplier}), qSkillRadius=${this.qSkillRadius} (base=${this.baseQSkillRadius} * ${this.qSkillRadiusMultiplier})`);
        
        // Call parent recalculate stats
        super.recalculateStats();
    }

    // Add a method to reset multipliers (called by upgrade system before reapplying)
    public resetMeleeMultipliers() {
        console.log(`resetMeleeMultipliers: before reset - attackRangeMultiplier=${this.attackRangeMultiplier}, qSkillRadiusMultiplier=${this.qSkillRadiusMultiplier}`);
        this.attackRangeMultiplier = 1;
        this.qSkillRadiusMultiplier = 1;
        this.qSkillDamageMultiplier = 1;
        console.log(`resetMeleeMultipliers: after reset - attackRangeMultiplier=${this.attackRangeMultiplier}, qSkillRadiusMultiplier=${this.qSkillRadiusMultiplier}`);
    }

    private performMeleeSwing(angle: number, gameScene: any) {
        // Create a sword slash effect
        const sword = this.scene.add.graphics();
        sword.fillStyle(0xffffff, 0.5);
        sword.slice(this.x, this.y, this.attackRange, angle - Math.PI / 4, angle + Math.PI / 4, false);
        sword.fillPath();

        this.scene.tweens.add({
            targets: sword,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                sword.destroy();
            }
        });

        // Damage enemies in the slash arc
        const enemies = gameScene.getEnemies().getChildren();
        const attackCircle = new Phaser.Geom.Circle(this.x, this.y, this.attackRange);

        enemies.forEach((enemy: any) => {
            // Check if enemy is a boss and use its body for collision
            if (enemy.isBossEnemy && enemy.isBossEnemy()) {
                const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
                if (enemyBody) {
                    // Create a rectangle from the enemy's physics body
                    const enemyRect = new Phaser.Geom.Rectangle(enemyBody.x, enemyBody.y, enemyBody.width, enemyBody.height);
                    if (Phaser.Geom.Intersects.CircleToRectangle(attackCircle, enemyRect)) {
                        const enemyAngle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
                        if (Math.abs(Phaser.Math.Angle.ShortestBetween(angle, enemyAngle)) < Math.PI / 4) {
                            const { damage, isCritical } = this.calculateDamage(this.attackDamage);
                            enemy.takeDamage(damage, isCritical);
                        }
                    }
                }
            } else {
                // For non-boss enemies, use the existing distance check
                const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (distance < this.attackRange) {
                    const enemyAngle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
                    if (Math.abs(Phaser.Math.Angle.ShortestBetween(angle, enemyAngle)) < Math.PI / 4) {
                        const { damage, isCritical } = this.calculateDamage(this.attackDamage);
                        enemy.takeDamage(damage, isCritical);
                    }
                }
            }
        });
    }

    public getProjectileCount(): number {
        return this.meleeAttackCount;
    }

    public getProjectileSpeed(): number {
        return 500; // Pet projectiles will have a speed of 500
    }

    public useDashSkill() {
        if (!this.dashSkillUnlocked || this.dashCooldownTimer > 0 || this.isDashing) return;
        
        this.dashCooldownTimer = this.dashCooldown;
        this.isDashing = true;
        this.dashTimer = 0;
        
        // Clear the hit enemies set for the new dash
        this.dashHitEnemies.clear();
        
        // Create dash trail effect
        this.createDashTrail();
        
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        
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
            
            // Set up repeating dash attacks during the dash
            this.setupDashAttacks(gameScene);
        }
    }

    protected getDashTrailColor(alpha: number): {main: number, glow: number} {
        // Aggressive red/orange color for melee characters
        const mainColor = Phaser.Display.Color.GetColor(
            Math.floor(255 * alpha), // Red R
            Math.floor(68 * alpha),  // Red G  
            Math.floor(68 * alpha)   // Red B
        );
        return {
            main: mainColor,
            glow: 0xFF4444 // Red glow
        };
    }

    private setupDashAttacks(gameScene: any) {
        // Attack enemies every 50ms during the dash
        const attackInterval = 50;
        const maxAttacks = Math.floor(this.dashDuration / attackInterval);
        
        for (let i = 0; i < maxAttacks; i++) {
            this.scene.time.delayedCall(i * attackInterval, () => {
                if (this.isDashing && this.active) {
                    this.performDashAttack(gameScene);
                }
            });
        }
    }

    private performDashAttack(gameScene: any) {
        const enemies = gameScene.getEnemies().getChildren();
        const dashRange = 80; // Range around player to hit enemies during dash
        
        enemies.forEach((enemy: any) => {
            // Skip if we already hit this enemy during this dash
            if (this.dashHitEnemies.has(enemy)) return;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distanceToEnemy = Math.sqrt(dx * dx + dy * dy);
            
            if (distanceToEnemy <= dashRange) {
                // Add enemy to hit set to prevent multiple hits
                this.dashHitEnemies.add(enemy);
                
                // Deal damage
                const { damage, isCritical } = this.calculateDamage(this.attackDamage * 1.2); // 20% bonus damage
                enemy.takeDamage(damage, isCritical);
                
                // Apply knockback to enemy using physics
                if (distanceToEnemy > 0) {
                    const knockbackForce = 400; // Strong knockback
                    const knockbackX = (dx / distanceToEnemy) * knockbackForce;
                    const knockbackY = (dy / distanceToEnemy) * knockbackForce;
                    
                    const body = enemy.body as Phaser.Physics.Arcade.Body;
                    if (body) {
                        body.setVelocity(knockbackX, knockbackY);
                        
                        // Reset velocity after a short time
                        this.scene.time.delayedCall(150, () => {
                            if (enemy.active && body) {
                                body.setVelocity(0, 0);
                            }
                        });
                    }
                }
            }
        });
    }
}
