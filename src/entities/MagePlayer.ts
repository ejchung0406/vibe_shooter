import { BasePlayer } from './BasePlayer';
import { MageProjectile } from './MageProjectile';
import { ExplosiveProjectile } from './ExplosiveProjectile';
import { GameSceneInterface } from '../types/GameSceneInterface';

export class MagePlayer extends BasePlayer {
    // Mage-specific properties
    protected spellAmplification: number = 1.0;
    protected chainLightningCount: number = 4;
    protected chainLightningDamageRetention: number = 0.7;
    protected lightningDamageMultiplier: number = 1.0;
    protected meteorCount: number = 5;
    protected hasBurningGround: boolean = false;
    protected autoQInterval: number = 0; // No extra delay — auto-cast as soon as cooldown ready

    // Mana bar visuals (on player entity)
    private manaBarBg!: Phaser.GameObjects.Rectangle;
    private manaBarFill!: Phaser.GameObjects.Rectangle;

    // Mana costs
    private readonly MANA_COST_Q = 10;
    private readonly MANA_COST_E = 20;
    private readonly MANA_COST_R = 30;
    private readonly MANA_COST_TELEPORT = 5;
    protected manaCostReduction: number = 0; // 0-1 percentage

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        // Mage base stats
        this.baseMaxHealth = 150;
        this.health = 150;
        this.maxHealth = 150;
        this.armor = 6;
        this.armorPerLevelUp = 4;

        // Mana system
        this.baseMana = 100;
        this.maxMana = 100;
        this.mana = 100;
        this.baseManaRegen = 10;
        this.manaRegen = 10;

        // Purple mage colors
        this.bodyColor = 0x7744CC;
        this.chestColor = 0x9966EE;
        this.sprite.setFillStyle(this.bodyColor);
        this.detailsGraphics.clear();
        this.drawPlayerDetails();

        // Staff visual on top with glowing crystal orb
        const staff = scene.add.graphics();
        // Staff shaft
        staff.fillStyle(0x886644);
        staff.fillRect(-1.5, -20, 3, 16);
        // Crystal orb at tip
        staff.fillStyle(0xCC88FF, 0.9);
        staff.fillCircle(0, -22, 4);
        // Orb glow
        staff.fillStyle(0xAA66FF, 0.4);
        staff.fillCircle(0, -22, 6);
        // Small sparkles around orb
        staff.fillStyle(0xFFFFFF, 0.7);
        staff.fillCircle(-3, -25, 1);
        staff.fillCircle(3, -19, 1);
        this.add(staff);

        // Set mage-specific cooldowns
        this.cooldowns.set('q', { max: 3000, timer: 0 });
        this.cooldowns.set('r', { max: 12000, timer: 0 });
        this.cooldowns.set('dash', { max: 1500, timer: 0 }); // Faster teleport

        // Create mana bar visual on player
        this.createManaBar();
    }

    private createManaBar() {
        const barWidth = 30;
        const barHeight = 4;
        const yPos = -15; // Below health bar at -20
        this.manaBarBg = this.scene.add.rectangle(0, yPos, barWidth, barHeight, 0x222244);
        this.manaBarFill = this.scene.add.rectangle(0, yPos, barWidth, barHeight, 0x4488ff);
        this.add([this.manaBarBg, this.manaBarFill]);
    }

    private updateManaBar() {
        if (this.maxMana <= 0) return;
        const manaPercent = this.mana / this.maxMana;
        this.manaBarFill.width = 30 * manaPercent;
    }

    private getManaCost(baseCost: number): number {
        return Math.floor(baseCost * (1 - this.manaCostReduction));
    }

    private canAffordMana(baseCost: number): boolean {
        return this.mana >= this.getManaCost(baseCost);
    }

    private spendMana(baseCost: number) {
        this.mana = Math.max(0, this.mana - this.getManaCost(baseCost));
    }

    protected drawPlayerDetails() {
        this.detailsGraphics.clear();
        const g = this.detailsGraphics;
        // Top-down body outline
        g.lineStyle(1.5, 0x000000, 0.5);
        g.strokeCircle(0, 0, 11);
        // Inner body shade (purple)
        g.fillStyle(this.chestColor, 0.5);
        g.fillCircle(0, 0, 8);
        // Arcane symbol on chest
        g.lineStyle(1, 0xCC88FF, 0.6);
        g.strokeCircle(0, 0, 4);
        g.beginPath();
        g.moveTo(0, -4);
        g.lineTo(0, 4);
        g.moveTo(-4, 0);
        g.lineTo(4, 0);
        g.strokePath();
        // Directional wedge (points up = forward)
        g.fillStyle(0xCC88FF, 0.6);
        g.fillTriangle(-4, -2, 0, -12, 4, -2);
    }

    update(time: number, delta: number) {
        super.update(time, delta);

        // Update mana bar visual
        this.updateManaBar();

        // Auto-cast Q (chain lightning) when cooldown ready and mana available
        if (this.qSkillUnlocked && this.getCooldownTimer('q') <= 0 && this.canAffordMana(this.MANA_COST_Q)) {
            // Check if enemies are in range before auto-casting
            const gameScene = this.scene as GameSceneInterface;
            const enemies = gameScene.getEnemies().getChildren();
            let hasNearbyEnemy = false;
            for (const enemy of enemies) {
                const e = enemy as any;
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                if (dx * dx + dy * dy < 700 * 700) {
                    hasNearbyEnemy = true;
                    break;
                }
            }
            if (hasNearbyEnemy) {
                this.useQSkill();
            }
        }
    }

    public useDashSkill() {
        if (!this.dashSkillUnlocked || this.getCooldownTimer('dash') > 0 || this.isDashing) return;
        if (!this.canAffordMana(this.MANA_COST_TELEPORT)) return;

        this.spendMana(this.MANA_COST_TELEPORT);
        this.startCooldown('dash');

        const gameScene = this.scene as GameSceneInterface;
        const mousePointer = gameScene.input.activePointer;
        const mouseX = mousePointer.worldX;
        const mouseY = mousePointer.worldY;

        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) return;

        // Teleport distance: 300px in mouse direction (or less if mouse is closer)
        const teleportDist = Math.min(300, distance);
        const startX = this.x;
        const startY = this.y;
        const targetX = this.x + (dx / distance) * teleportDist;
        const targetY = this.y + (dy / distance) * teleportDist;

        // Purple flash at start position
        const startFlash = gameScene.add.graphics();
        startFlash.fillStyle(0xAA44FF, 0.6);
        startFlash.fillCircle(0, 0, 20);
        startFlash.fillStyle(0xFFFFFF, 0.4);
        startFlash.fillCircle(0, 0, 8);
        startFlash.setPosition(startX, startY);
        gameScene.tweens.add({
            targets: startFlash,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 300,
            onComplete: () => startFlash.destroy()
        });

        // Instantly move player
        this.x = targetX;
        this.y = targetY;

        // Purple flash at destination
        const endFlash = gameScene.add.graphics();
        endFlash.fillStyle(0xAA44FF, 0.8);
        endFlash.fillCircle(0, 0, 25);
        endFlash.fillStyle(0xFFFFFF, 0.5);
        endFlash.fillCircle(0, 0, 10);
        endFlash.setPosition(targetX, targetY);
        gameScene.tweens.add({
            targets: endFlash,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 400,
            onComplete: () => endFlash.destroy()
        });
    }

    protected getDashTrailColor(alpha: number): { main: number; glow: number } {
        const mainColor = Phaser.Display.Color.GetColor(
            Math.floor(170 * alpha),
            Math.floor(68 * alpha),
            Math.floor(255 * alpha)
        );
        return {
            main: mainColor,
            glow: 0xAA44FF
        };
    }

    public attack(): void {
        if (this.isAttacking) return;

        this.isAttacking = true;
        this.attackPauseTimer = 0;

        const gameScene = this.scene as GameSceneInterface;

        const mousePointer = gameScene.input.activePointer;
        const mouseX = mousePointer.worldX;
        const mouseY = mousePointer.worldY;

        const enemies = gameScene.getEnemies().getChildren();
        let isHoming = false;

        enemies.forEach((enemy: any) => {
            const dx = mouseX - enemy.x;
            const dy = mouseY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 30) {
                isHoming = true;
            }
        });

        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const angle = Math.atan2(dy, dx);

        this.shotCounter++;
        const isEmpowered = this.shotCounter % 4 === 0;

        if (this.projectileCount === 1) {
            if (isEmpowered) {
                const { damage, isCritical } = this.calculateDamage(this.attackDamage * 2 * this.spellAmplification);
                const projectile = new ExplosiveProjectile(
                    gameScene,
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
                gameScene.getProjectiles().add(projectile);
            } else {
                const { damage, isCritical } = this.calculateDamage(this.attackDamage * this.spellAmplification);
                const projectile = new MageProjectile(
                    gameScene,
                    this.x,
                    this.y,
                    damage,
                    this.projectileSpeed,
                    angle,
                    this.piercing,
                    isHoming,
                    isCritical
                );
                gameScene.getProjectiles().add(projectile);
            }
        } else {
            this.performBurstAttack(gameScene, angle, isEmpowered, isHoming);
        }
    }

    private performBurstAttack(gameScene: GameSceneInterface, angle: number, isEmpowered: boolean, isHoming: boolean) {
        for (let i = 0; i < this.projectileCount; i++) {
            gameScene.time.delayedCall(i * 50, () => {
                if (isEmpowered && i === 0) {
                    const { damage, isCritical } = this.calculateDamage(this.attackDamage * 2 * this.spellAmplification);
                    const projectile = new ExplosiveProjectile(
                        gameScene,
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
                    gameScene.getProjectiles().add(projectile);
                } else {
                    const { damage, isCritical } = this.calculateDamage(this.attackDamage * this.spellAmplification);
                    const projectile = new MageProjectile(
                        gameScene,
                        this.x,
                        this.y,
                        damage,
                        this.projectileSpeed,
                        angle,
                        this.piercing,
                        isHoming,
                        isCritical
                    );
                    gameScene.getProjectiles().add(projectile);
                }
            });
        }
    }

    public useQSkill(): void {
        if (!this.qSkillUnlocked || this.getCooldownTimer('q') > 0) return;
        if (!this.canAffordMana(this.MANA_COST_Q)) return;

        const gameScene = this.scene as GameSceneInterface;
        const enemies = gameScene.getEnemies().getChildren();

        // Find nearest enemy within 700px
        let nearestEnemy: any = null;
        let nearestDistance = 700;

        enemies.forEach((enemy: any) => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        });

        if (!nearestEnemy) return; // No target, don't start cooldown or spend mana

        this.spendMana(this.MANA_COST_Q);
        this.startCooldown('q');

        // Chain lightning logic — 1.5x attackDamage base, scaled by spell amp & lightning multiplier
        const hitTargets: any[] = [nearestEnemy];
        let currentTarget = nearestEnemy;
        let currentDamage = this.attackDamage * 1.5 * this.spellAmplification * this.lightningDamageMultiplier;

        // Deal damage to first target
        const { damage: firstDamage, isCritical: firstCrit } = this.calculateDamage(currentDamage);
        nearestEnemy.takeDamage(firstDamage, firstCrit);

        // Draw lightning from player to first target
        this.drawLightningBolt(this.x, this.y, nearestEnemy.x, nearestEnemy.y, gameScene);

        // Chain to nearby enemies (250px chain range)
        for (let i = 0; i < this.chainLightningCount; i++) {
            currentDamage *= this.chainLightningDamageRetention;

            let nextTarget: any = null;
            let nextDistance = 250;

            enemies.forEach((enemy: any) => {
                if (hitTargets.includes(enemy)) return;
                const ddx = enemy.x - currentTarget.x;
                const ddy = enemy.y - currentTarget.y;
                const dist = Math.sqrt(ddx * ddx + ddy * ddy);
                if (dist < nextDistance) {
                    nextDistance = dist;
                    nextTarget = enemy;
                }
            });

            if (!nextTarget) break;

            hitTargets.push(nextTarget);

            const chainDelay = (i + 1) * 80;
            const prevTarget = currentTarget;
            const chainDamage = currentDamage;
            const capturedNext = nextTarget;

            this.scene.time.delayedCall(chainDelay, () => {
                if (!capturedNext.active) return;
                const { damage, isCritical } = this.calculateDamage(chainDamage);
                capturedNext.takeDamage(damage, isCritical);
                this.drawLightningBolt(prevTarget.x, prevTarget.y, capturedNext.x, capturedNext.y, gameScene);
            });

            currentTarget = nextTarget;
        }
    }

    private drawLightningBolt(x1: number, y1: number, x2: number, y2: number, scene: GameSceneInterface) {
        const graphics = scene.add.graphics();
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) return;

        const segments = Math.max(3, Math.floor(distance / 30));
        const perpX = -dy / distance;
        const perpY = dx / distance;

        const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const baseX = x1 + dx * t;
            const baseY = y1 + dy * t;
            const offset = (Math.random() - 0.5) * 30;
            points.push({
                x: baseX + perpX * offset,
                y: baseY + perpY * offset
            });
        }
        points.push({ x: x2, y: y2 });

        // Draw glow (wider, semi-transparent white)
        graphics.lineStyle(6, 0xffffff, 0.3);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.strokePath();

        // Draw main bolt (bright cyan)
        graphics.lineStyle(3, 0x00ffff, 1);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.strokePath();

        // Fade out
        scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 300,
            onComplete: () => graphics.destroy()
        });
    }

    public useESkill(): void {
        if (!this.eSkillUnlocked || this.getCooldownTimer('e') > 0 || this.shieldActive) return;
        if (!this.canAffordMana(this.MANA_COST_E)) return;

        this.spendMana(this.MANA_COST_E);
        // Call the base implementation (which will activate shield, start cooldown, etc.)
        this.startCooldown('e');
        this.activateShield();
        if (this.eSkillHeals) {
            this.heal(this.maxHealth * 0.1);
        }
    }

    public useRSkill(): void {
        if (!this.rSkillUnlocked || this.getCooldownTimer('r') > 0) return;
        if (!this.canAffordMana(this.MANA_COST_R)) return;

        this.spendMana(this.MANA_COST_R);
        this.startCooldown('r');

        const gameScene = this.scene as GameSceneInterface;
        const mousePointer = gameScene.input.activePointer;
        const targetX = mousePointer.worldX;
        const targetY = mousePointer.worldY;

        for (let i = 0; i < this.meteorCount; i++) {
            const meteorX = targetX + (Math.random() - 0.5) * 600;
            const meteorY = targetY + (Math.random() - 0.5) * 600;

            this.scene.time.delayedCall(i * 150, () => {
                if (!this.active) return;
                this.spawnMeteor(meteorX, meteorY, gameScene);
            });
        }
    }

    private spawnMeteor(x: number, y: number, scene: GameSceneInterface) {
        // Warning circle (small, grows over 300ms)
        const warning = scene.add.graphics();
        warning.fillStyle(0x440000, 0.5);
        warning.fillCircle(0, 0, 100);
        warning.lineStyle(2, 0xff4400, 0.8);
        warning.strokeCircle(0, 0, 100);
        warning.setPosition(x, y);
        warning.setScale(0.1);

        scene.tweens.add({
            targets: warning,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Quad.easeIn',
            onComplete: () => {
                warning.destroy();
                this.meteorImpact(x, y, scene);
            }
        });
    }

    private meteorImpact(x: number, y: number, scene: GameSceneInterface) {
        const impactRadius = 180;

        // Impact visual
        const impact = scene.add.circle(x, y, impactRadius, 0xff4400, 0.6);
        impact.setStrokeStyle(4, 0xff8800);

        scene.tweens.add({
            targets: impact,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => impact.destroy()
        });

        // Damage enemies in radius
        const enemies = scene.getEnemies().getChildren();
        enemies.forEach((enemy: any) => {
            if (!enemy.body) return;
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= impactRadius) {
                const baseDamage = this.attackDamage * 3.0 * this.spellAmplification;
                const { damage, isCritical } = this.calculateDamage(baseDamage);
                enemy.takeDamage(damage, isCritical);
            }
        });

        // Particles
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const particle = scene.add.rectangle(
                x + Math.cos(angle) * 20,
                y + Math.sin(angle) * 20,
                8, 8, 0xff6600
            );
            scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * 80,
                y: particle.y + Math.sin(angle) * 80,
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 500,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Burning ground (always active)
        this.createBurningGround(x, y, scene);
    }

    private createBurningGround(x: number, y: number, scene: GameSceneInterface) {
        const radius = 150;
        const duration = 4000;
        const tickInterval = 400;

        const ground = scene.add.graphics();
        ground.fillStyle(0xff4400, 0.3);
        ground.fillCircle(0, 0, radius);
        ground.lineStyle(2, 0xff6600, 0.4);
        ground.strokeCircle(0, 0, radius);
        ground.setPosition(x, y);

        // Flickering fire effect
        scene.tweens.add({
            targets: ground,
            alpha: { from: 0.8, to: 0.4 },
            duration: 300,
            yoyo: true,
            repeat: Math.floor(duration / 600)
        });

        let elapsed = 0;
        const timer = scene.time.addEvent({
            delay: tickInterval,
            callback: () => {
                elapsed += tickInterval;
                if (elapsed >= duration) {
                    timer.destroy();
                    return;
                }
                const enemies = scene.getEnemies().getChildren();
                enemies.forEach((enemy: any) => {
                    if (!enemy.body) return;
                    const ddx = enemy.x - x;
                    const ddy = enemy.y - y;
                    const dist = Math.sqrt(ddx * ddx + ddy * ddy);
                    if (dist <= radius) {
                        // % max HP burn — hurts bosses too
                        const dotDamage = Math.max(
                            this.attackDamage * 0.5 * this.spellAmplification,
                            (enemy.getMaxHealth?.() || 0) * 0.02
                        );
                        enemy.takeDamage(dotDamage, false);
                    }
                });
            },
            loop: true
        });

        scene.tweens.add({
            targets: ground,
            alpha: 0,
            duration: duration,
            onComplete: () => {
                ground.destroy();
                timer.destroy();
            }
        });
    }

    public recalculateStats() {
        super.recalculateStats();
        // Adjust base values: mage has 800ms attack cooldown (vs 1000 default)
        // and 400 projectile speed (vs 500 default)
        this.attackCooldown *= 0.8;
        this.projectileSpeed *= 0.8;
        // Cap mana
        if (this.mana > this.maxMana) {
            this.mana = this.maxMana;
        }
    }

    public resetMageMultipliers() {
        this.spellAmplification = 1.0;
        this.chainLightningCount = 4;
        this.chainLightningDamageRetention = 0.7;
        this.lightningDamageMultiplier = 1.0;
        this.meteorCount = 5;
        this.hasBurningGround = false;
        this.manaCostReduction = 0;
    }

    // Mage-specific upgrade methods
    public increaseSpellAmplification(amount: number) {
        this.spellAmplification += amount;
    }

    public getSpellAmplification(): number {
        return this.spellAmplification;
    }

    public increaseChainLightningCount(amount: number) {
        this.chainLightningCount += amount;
    }

    public setChainLightningDamageRetention(value: number) {
        this.chainLightningDamageRetention = value;
    }

    public increaseLightningDamageMultiplier(amount: number) {
        this.lightningDamageMultiplier += amount;
    }

    public getLightningDamageMultiplier(): number {
        return this.lightningDamageMultiplier;
    }

    public increaseMeteorCount(amount: number) {
        this.meteorCount += amount;
    }

    public setHasBurningGround(value: boolean) {
        this.hasBurningGround = value;
    }

    public setManaCostReduction(value: number) {
        this.manaCostReduction = value;
    }

    public reduceQCooldown(multiplier: number) {
        const cd = this.cooldowns.get('q');
        if (cd) cd.max = Math.floor(cd.max * multiplier);
    }
}
