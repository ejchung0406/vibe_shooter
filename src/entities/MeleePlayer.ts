import { BasePlayer } from './BasePlayer';
import { GameSceneInterface } from '../types/GameSceneInterface';
import { SoundManager } from '../systems/SoundManager';

export class MeleePlayer extends BasePlayer {
    protected attackRange: number = 200;
    protected baseAttackRange: number = 200; // Store the base value
    protected attackRangeMultiplier: number = 1; // Track the multiplier
    protected meleeAttackCount: number = 1;
    protected qSkillDamageMultiplier: number = 1;
    protected qSkillRadius: number = 200;
    protected baseQSkillRadius: number = 200; // Store the base value
    protected qSkillRadiusMultiplier: number = 1; // Track the multiplier
    protected rSkillBleedingDamage: number = 0.03; // Default 3% of max health per second
    private dashHitEnemies: Set<any> = new Set(); // Track enemies hit during current dash

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        this.baseMaxHealth = 225;
        this.health = 225;
        this.armor = 10;
        this.isMelee = true;
        this.armorPerLevelUp = 7;
        this.dashDuration = 400;

        // Melee visual: red tones
        this.bodyColor = 0xCC3333;
        this.chestColor = 0xDD5555;
        this.sprite.setFillStyle(0xCC3333);
        this.detailsGraphics.clear();
        this.drawPlayerDetails();

        // Top-down melee details
        const meleeDetails = scene.add.graphics();
        // Shoulder circles (top-down)
        meleeDetails.fillStyle(0xAA2222);
        meleeDetails.fillCircle(-10, 0, 4);
        meleeDetails.fillCircle(10, 0, 4);
        // Sword on right side (pointing up)
        meleeDetails.fillStyle(0xCCCCCC);
        meleeDetails.fillRect(12, -16, 3, 18);
        meleeDetails.fillStyle(0x886600);
        meleeDetails.fillRect(10, -2, 7, 3);
        // Shield on left side (top-down circle)
        meleeDetails.lineStyle(2, 0x886600);
        meleeDetails.strokeCircle(-13, -4, 5);
        meleeDetails.fillStyle(0xAA7722, 0.5);
        meleeDetails.fillCircle(-13, -4, 4);
        this.add(meleeDetails);
    }

    public attack(): void {
        if (this.isAttacking) return;

        SoundManager.getInstance().play('meleeSwing');
        this.isAttacking = true;
        this.attackPauseTimer = 0;
        this.canMove = false;
        this.scene.time.delayedCall(200, () => {
            this.canMove = true;
        });

        const gameScene = this.scene as GameSceneInterface;

        const mousePointer = gameScene.input.activePointer;
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
        if (!this.qSkillUnlocked || this.getCooldownTimer('q') > 0) return;

        SoundManager.getInstance().play('skillQ');
        this.startCooldown('q');
        this.canMove = false;
        this.scene.time.delayedCall(300, () => {
            this.canMove = true;
        });

        const gameScene = this.scene as GameSceneInterface;

        // Create a visual effect for the AoE
        const ring = gameScene.add.graphics();
        ring.fillStyle(0xffffff, 0.2); // Filled circle
        ring.fillCircle(this.x, this.y, this.qSkillRadius);
        gameScene.tweens.add({
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
                    
                    const { damage, isCritical } = this.calculateDamage(this.attackDamage * this.meleeAttackCount * damageMultiplier);
                    enemy.takeDamage(damage, isCritical);
                    
                    // Apply bleeding effect only to boss enemies (1/5 of R skill bleeding)
                    if (enemy.isBossEnemy && enemy.isBossEnemy()) {
                        // R skill bleeding: 5% of max health per second for 10 seconds
                        // Q skill bleeding: 2% of max health per second for 10 seconds (40% of R skill)
                        enemy.applyBleed(10000, enemy.getMaxHealth() * 0.01);
                    }
                }
            }
        });
    }

    public useRSkill(): void {
        if (!this.rSkillUnlocked || this.getCooldownTimer('r') > 0) return;

        SoundManager.getInstance().play('skillR');
        this.startCooldown('r');
        this.canMove = false;
        this.scene.time.delayedCall(500, () => {
            this.canMove = true;
        });

        const gameScene = this.scene as GameSceneInterface;
        const radius = 400;
        const cx = this.x;
        const cy = this.y;

        // === Phase 1: Ground crack lines radiating outward ===
        const crackGraphics = gameScene.add.graphics();
        crackGraphics.setDepth(this.depth - 1);
        const crackCount = 12;
        for (let i = 0; i < crackCount; i++) {
            const angle = (Math.PI * 2 / crackCount) * i + (Math.random() - 0.5) * 0.3;
            const len = radius * (0.6 + Math.random() * 0.4);
            crackGraphics.lineStyle(3, 0xff4400, 0.8);
            crackGraphics.beginPath();
            crackGraphics.moveTo(cx, cy);
            // Jagged segments
            let px = cx, py = cy;
            const segments = 4 + Math.floor(Math.random() * 3);
            for (let s = 1; s <= segments; s++) {
                const t = s / segments;
                const jitter = 15 * (1 - t);
                px = cx + Math.cos(angle) * len * t + (Math.random() - 0.5) * jitter;
                py = cy + Math.sin(angle) * len * t + (Math.random() - 0.5) * jitter;
                crackGraphics.lineTo(px, py);
            }
            crackGraphics.strokePath();
        }
        gameScene.tweens.add({
            targets: crackGraphics,
            alpha: 0,
            duration: 800,
            delay: 200,
            onComplete: () => crackGraphics.destroy()
        });

        // === Phase 2: Expanding shockwave rings ===
        const ringColors = [0xff2200, 0xff6600, 0xff0000];
        ringColors.forEach((color, i) => {
            const ring = gameScene.add.graphics();
            ring.setDepth(this.depth + 1);
            const startRadius = 20;
            const ringObj = { r: startRadius, a: 0.9 };
            gameScene.tweens.add({
                targets: ringObj,
                r: radius * (0.8 + i * 0.15),
                a: 0,
                duration: 400 + i * 100,
                delay: i * 80,
                ease: 'Cubic.easeOut',
                onUpdate: () => {
                    ring.clear();
                    ring.lineStyle(6 - i * 1.5, color, ringObj.a);
                    ring.strokeCircle(cx, cy, ringObj.r);
                },
                onComplete: () => ring.destroy()
            });
        });

        // === Phase 3: Inner fire burst fill ===
        const burstFill = gameScene.add.graphics();
        burstFill.setDepth(this.depth);
        const burstObj = { r: 0, a: 0.5 };
        gameScene.tweens.add({
            targets: burstObj,
            r: radius,
            a: 0,
            duration: 350,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                burstFill.clear();
                burstFill.fillStyle(0xff3300, burstObj.a * 0.4);
                burstFill.fillCircle(cx, cy, burstObj.r);
                burstFill.fillStyle(0xff6600, burstObj.a * 0.6);
                burstFill.fillCircle(cx, cy, burstObj.r * 0.6);
                burstFill.fillStyle(0xffaa00, burstObj.a * 0.8);
                burstFill.fillCircle(cx, cy, burstObj.r * 0.25);
            },
            onComplete: () => burstFill.destroy()
        });

        // === Phase 4: Spark particles flying outward ===
        const sparkCount = 24;
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 400;
            const sparkSize = 3 + Math.random() * 5;
            const sparkColor = [0xff4400, 0xff8800, 0xffcc00, 0xffffff][Math.floor(Math.random() * 4)];
            const spark = gameScene.add.graphics();
            spark.setDepth(this.depth + 2);
            spark.fillStyle(sparkColor, 1);
            spark.fillCircle(0, 0, sparkSize);
            spark.setPosition(cx, cy);

            const destX = cx + Math.cos(angle) * speed;
            const destY = cy + Math.sin(angle) * speed;
            gameScene.tweens.add({
                targets: spark,
                x: destX,
                y: destY,
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: 300 + Math.random() * 400,
                ease: 'Cubic.easeOut',
                onComplete: () => spark.destroy()
            });
        }

        // === Phase 5: Screen shake ===
        gameScene.cameras.main.shake(300, 0.012);

        // === Phase 6: Brief white flash overlay ===
        const flash = gameScene.add.rectangle(cx, cy, radius * 2.5, radius * 2.5, 0xffffff, 0.3);
        flash.setDepth(this.depth + 3);
        gameScene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        // Damage and apply bleed to enemies in the AoE
        const enemies = gameScene.getEnemies().getChildren();
        enemies.forEach((enemy: any) => {
            const distance = Phaser.Math.Distance.Between(cx, cy, enemy.x, enemy.y);
            if (distance < radius) {
                const { damage, isCritical } = this.calculateDamage(this.attackDamage * 2);
                enemy.takeDamage(damage, isCritical);
                enemy.applyBleed(10000, enemy.getMaxHealth() * this.rSkillBleedingDamage);
            }
        });
    }

    public increaseAttackRange(amount: number) {
        this.attackRangeMultiplier += amount;
    }

    public increaseMeleeAttackCount(amount: number) {
        this.meleeAttackCount += amount;
    }

    public decreaseMeleeAttackCount(amount: number) {
        this.meleeAttackCount = Math.max(1, this.meleeAttackCount - amount);
    }

    public increaseQSkillDamage(amount: number) {
        // Use additive scaling for damage multiplier (deprecated - use increaseQSkillDamageMultiplier)
        this.qSkillDamageMultiplier += amount;
    }

    public increaseQSkillDamageMultiplier(amount: number) {
        // Use multiplicative scaling for damage multiplier
        this.qSkillDamageMultiplier *= (1 + amount);
    }

    public setRSkillBleedingDamage(damage: number) {
        this.rSkillBleedingDamage = damage;
    }

    public increaseQSkillRadius(amount: number) {
        this.qSkillRadiusMultiplier += amount;
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
        this.attackRange = this.baseAttackRange * this.attackRangeMultiplier;
        this.qSkillRadius = this.baseQSkillRadius * this.qSkillRadiusMultiplier;
        super.recalculateStats();
    }

    // Add a method to reset multipliers (called by upgrade system before reapplying)
    public resetMeleeMultipliers() {
        this.meleeAttackCount = 1;
        this.attackRangeMultiplier = 1;
        this.qSkillRadiusMultiplier = 1;
        this.qSkillDamageMultiplier = 1;
        this.rSkillBleedingDamage = 0.03;
    }

    private performMeleeSwing(angle: number, gameScene: GameSceneInterface) {
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
                        if (Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle)) < Math.PI / 4) {
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

        // Also damage destructible crates in the slash arc
        try {
            const obstacleManager = gameScene.getObstacleManager();
            if (obstacleManager) {
                const crates = obstacleManager.getCrates().getChildren();
                crates.forEach((crate: any) => {
                    if (!crate.active) return;
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, crate.x, crate.y);
                    if (distance < this.attackRange) {
                        const crateAngle = Phaser.Math.Angle.Between(this.x, this.y, crate.x, crate.y);
                        if (Math.abs(Phaser.Math.Angle.ShortestBetween(angle, crateAngle)) < Math.PI / 4) {
                            // Trigger the crate's hit method
                            if (crate.meleeHit) crate.meleeHit();
                        }
                    }
                });
            }
        } catch (_e) { /* obstacle manager not ready */ }
    }

    public getProjectileCount(): number {
        return this.meleeAttackCount;
    }

    public getProjectileSpeed(): number {
        return 500; // Pet projectiles will have a speed of 500
    }

    public useDashSkill() {
        if (!this.dashSkillUnlocked || this.getCooldownTimer('dash') > 0 || this.isDashing) return;

        SoundManager.getInstance().play('dash');
        this.startCooldown('dash');
        this.isDashing = true;
        this.dashTimer = 0;
        
        // Clear the hit enemies set for the new dash
        this.dashHitEnemies.clear();
        
        // Create dash trail effect
        this.createDashTrail();
        
        const gameScene = this.scene as GameSceneInterface;

        // Get mouse position for dash direction (world coordinates)
        const mousePointer = gameScene.input.activePointer;
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

    private setupDashAttacks(gameScene: GameSceneInterface) {
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

    private performDashAttack(gameScene: GameSceneInterface) {
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
