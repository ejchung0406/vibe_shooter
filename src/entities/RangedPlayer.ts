import { BasePlayer } from './BasePlayer';
import { Projectile } from './Projectile';
import { ExplosiveProjectile } from './ExplosiveProjectile';
import { QProjectile } from './QProjectile';
import { GameSceneInterface } from '../types/GameSceneInterface';

export class RangedPlayer extends BasePlayer {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        // Top-down gun barrel (points up)
        const gun = scene.add.graphics();
        gun.fillStyle(0x555555);
        gun.fillRect(-2, -18, 4, 10);
        gun.fillStyle(0x777777);
        gun.fillRect(-1, -18, 2, 10);
        // Scope dot at tip
        gun.fillStyle(0xff0000);
        gun.fillCircle(0, -19, 1.5);
        this.add(gun);
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

        if (this.projectileCount === 1) {
            this.shotCounter++;
            const isComboShot = this.hasAdvancedCombo ? this.shotCounter % 2 === 0 : (this.hasComboMaster && this.shotCounter % 3 === 0);

            if (isComboShot) {
                const { damage, isCritical } = this.calculateDamage(this.attackDamage * 2);
                const projectile = new ExplosiveProjectile(
                    gameScene,
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
            this.shotCounter++;
            const isComboShot = this.hasAdvancedCombo ? this.shotCounter % 2 === 0 : (this.hasComboMaster && this.shotCounter % 3 === 0);
            this.performBurstAttack(gameScene, angle, isComboShot, isHoming);
        }
    }

    private performBurstAttack(gameScene: GameSceneInterface, angle: number, isComboShot: boolean = false, isHoming: boolean = false) {
        for (let i = 0; i < this.projectileCount; i++) {
            gameScene.time.delayedCall(i * 50, () => { // 50ms delay between shots
                let projectile;
                if (isComboShot && i === 0) { // Make first projectile explosive for combo
                    const { damage, isCritical } = this.calculateDamage(this.attackDamage * 2);
                    projectile = new ExplosiveProjectile(
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
                } else {
                    const { damage, isCritical } = this.calculateDamage(this.attackDamage);
                    projectile = new Projectile(
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
                }
                
                gameScene.getProjectiles().add(projectile);
            });
        }
    }

    public useQSkill(): void {
        if (!this.qSkillUnlocked || this.getCooldownTimer('q') > 0) return;

        this.startCooldown('q');

        const gameScene = this.scene as GameSceneInterface;

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
            this.cooldowns.get('q')!.timer = 0;
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
                        gameScene,
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
        if (!this.rSkillUnlocked || this.getCooldownTimer('r') > 0) return;

        this.startCooldown('r');

        const gameScene = this.scene as GameSceneInterface;

        const mousePointer = gameScene.input.activePointer;
        const mouseX = mousePointer.worldX;
        const mouseY = mousePointer.worldY;

        const angle = Math.atan2(mouseY - this.y, mouseX - this.x);

        for (let i = 0; i < 7 * this.rProjectileMultiplier; i++) {
            gameScene.time.delayedCall(i * 50 / this.rProjectileMultiplier, () => {
                const { damage, isCritical } = this.calculateDamage(this.attackDamage * 1.5);
                const projectile = new ExplosiveProjectile(
                    gameScene,
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

}