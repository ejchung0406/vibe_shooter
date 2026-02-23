import Phaser from 'phaser';
import { GameSceneInterface } from '../types/GameSceneInterface';
import { MagePlayer } from './MagePlayer';

export class MageProjectile extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Rectangle;
    private velocityX: number = 0;
    private velocityY: number = 0;
    private damage: number = 10;
    private projectileSpeed: number = 400;
    private piercing: boolean = false;
    private homing: boolean = false;
    private lifetime: number = 3000;
    private age: number = 0;
    private isCritical: boolean = false;
    private hitEnemies: Set<any> = new Set();

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        damage: number,
        speed: number,
        angle: number,
        piercing: boolean = false,
        homing: boolean = false,
        isCritical: boolean = false
    ) {
        super(scene, x, y);

        this.damage = damage;
        this.projectileSpeed = speed;
        this.piercing = piercing;
        this.homing = homing;
        this.isCritical = isCritical;

        // Purple energy orb visual
        this.sprite = scene.add.rectangle(0, 0, 10, 10, 0x9944FF);
        this.sprite.setRotation(Math.PI / 4);
        this.add(this.sprite);

        // Magenta glow
        const glow = scene.add.graphics();
        glow.fillStyle(0xCC66FF, 0.4);
        glow.fillCircle(0, 0, 10);
        glow.fillStyle(0xBB88FF, 0.6);
        glow.fillCircle(0, 0, 5);
        this.add(glow);

        // Set velocity based on angle
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;

        // Add physics body
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(16, 16);
        body.setOffset(-8, -8);
        body.setVelocity(this.velocityX, this.velocityY);
        body.setCollideWorldBounds(true);
        (this.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;

        scene.add.existing(this);

        this.setupCollisions();
    }

    update(_time: number, delta: number) {
        this.age += delta;

        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }

        if (this.homing) {
            this.updateHoming(delta);
        }

        this.x += this.velocityX * (delta / 1000);
        this.y += this.velocityY * (delta / 1000);
    }

    private updateHoming(delta: number) {
        const gameScene = this.scene as GameSceneInterface;
        const enemies = gameScene.getEnemies().getChildren();

        if (enemies.length > 0) {
            let closestEnemy: any = null;
            let closestDistance = Infinity;

            enemies.forEach((enemy: any) => {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            });

            if (closestEnemy && closestDistance < 200) {
                const dx = closestEnemy.x - this.x;
                const dy = closestEnemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    const homingSpeed = 200;
                    this.velocityX += (dx / distance) * homingSpeed * (delta / 1000);
                    this.velocityY += (dy / distance) * homingSpeed * (delta / 1000);
                    const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
                    if (currentSpeed > this.projectileSpeed) {
                        this.velocityX = (this.velocityX / currentSpeed) * this.projectileSpeed;
                        this.velocityY = (this.velocityY / currentSpeed) * this.projectileSpeed;
                    }
                }
            }
        }
    }

    private setupCollisions() {
        const gameScene = this.scene as GameSceneInterface;

        const onWorldBounds = (body: any) => {
            if (body.gameObject === this) {
                this.destroy();
            }
        };
        this.scene.physics.world.on('worldbounds', onWorldBounds);

        this.on('destroy', () => {
            gameScene.physics?.world?.off('worldbounds', onWorldBounds);
        });

        gameScene.physics.add.overlap(
            this,
            gameScene.getEnemies(),
            this.onEnemyHit,
            undefined,
            this
        );
    }

    private onEnemyHit(_projectile: any, enemy: any) {
        if (this.hitEnemies.has(enemy)) return;
        this.hitEnemies.add(enemy);

        enemy.takeDamage(this.damage, this.isCritical);

        // Trigger chain lightning on hit if player has attackCastsQ upgrade
        try {
            const gameScene = this.scene as GameSceneInterface;
            const player = gameScene.getPlayer();
            if (player instanceof MagePlayer && player.hasAttackCastsQ()) {
                player.castChainLightningAt(enemy.x, enemy.y);
            }
        } catch (_e) { /* not ready */ }

        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            const knockbackForce = 50;
            const knockbackX = (dx / distance) * knockbackForce;
            const knockbackY = (dy / distance) * knockbackForce;
            const body = enemy.body as Phaser.Physics.Arcade.Body;
            if (body) {
                body.setVelocity(knockbackX, knockbackY);
                enemy.scene.time.delayedCall(200, () => {
                    if (enemy.active && body) {
                        body.setVelocity(0, 0);
                    }
                });
            }
        }

        this.destroy();
    }

    public getDamage() {
        return this.damage;
    }

    public isPiercing() {
        return this.piercing;
    }
}
