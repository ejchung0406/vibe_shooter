import { BasePlayer } from './BasePlayer';
import { Projectile } from './Projectile';
import { ExplosiveProjectile } from './ExplosiveProjectile';
import { QProjectile } from './QProjectile';
import { GameScene } from '../scenes/GameScene';
import { Pet } from './Pet';

export class RangedPlayer extends BasePlayer {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
    }

    public attack(): void {
        if (this.isAttacking) return;

        this.isAttacking = true;
        this.attackPauseTimer = 0;

        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;

        const mousePointer = scene.input.activePointer;
        const mouseX = mousePointer.worldX;
        const mouseY = mousePointer.worldY;

        const enemies = gameScene.getEnemies().getChildren();
        let isHoming = false;

        enemies.forEach((enemy: any) => {
            const dx = mouseX - enemy.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 30) {
                isHoming = true;
            }
        });

        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const angle = Math.atan2(dy, dx);

        if (this.projectileCount === 1) {
            this.shotCounter++;
            const isComboShot = this.hasAdvancedCombo ? this.shotCounter % 2 === 0 : (this.hasComboMaster && this.shotCounter % 3 === 0);

            if (isComboShot) {
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
                const { damage, isCritical } = this.calculateDamage(this.attackDamage);
                const projectile = new Projectile(
                    scene,
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
            this.shotCounter++;
            const isComboShot = this.hasAdvancedCombo ? this.shotCounter % 2 === 0 : (this.hasComboMaster && this.shotCounter % 3 === 0);
            this.performBurstAttack(scene, gameScene, angle, isComboShot, isHoming);
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
                        isHoming,
                        isCritical
                    );
                }
                
                gameScene.getProjectiles().add(projectile);
            });
        }
    }

    public useQSkill(): void {
        if (!this.qSkillUnlocked || this.qCooldownTimer > 0) return;

        this.qCooldownTimer = this.qCooldown;

        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;

        const enemies = gameScene.getEnemies().getChildren();
        const nearbyEnemies: any[] = [];

        enemies.forEach((enemy: any) => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= 900) {
                nearbyEnemies.push({ 
                    enemy, 
                    distance,
                    fixedX: enemy.x,
                    fixedY: enemy.y
                });
            }
        });

        if (nearbyEnemies.length === 0) {
            this.qCooldownTimer = 0;
            return;
        }

        nearbyEnemies.sort((a, b) => a.distance - b.distance);

        const targetEnemies = nearbyEnemies;

        const playerLevel = gameScene.getPlayerLevel();
        const projectileCount = ( 5 + playerLevel ) * this.qSkillHomingMultiplier;

        for (let i = 0; i < projectileCount; i++) {
            this.scene.time.delayedCall(i * 50 / this.qSkillHomingMultiplier, () => {
                const angle = (i / projectileCount) * Math.PI * 2;
                const offsetX = Math.cos(angle) * 30;
                const offsetY = Math.sin(angle) * 30;

                const targetIndex = i % targetEnemies.length;

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

    public useRSkill(): void {
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
}