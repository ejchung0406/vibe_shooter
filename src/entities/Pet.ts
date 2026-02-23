import Phaser from 'phaser';
import { Player } from './Player';
import { Projectile } from './Projectile';
import { GameScene } from '../scenes/GameScene';

export class Pet extends Phaser.GameObjects.Container {
    private owner: Player;
    private lifespan: number;
    private attackTimer: number = 0;
    private lifeTimer: number = 0;

    constructor(scene: GameScene, x: number, y: number, owner: Player, lifespan: number) {
        super(scene, x, y);
        this.owner = owner;
        this.lifespan = lifespan;

        // Light blue diamond body
        const diamond = scene.add.rectangle(0, 0, 12, 12, 0x00aaff);
        diamond.setRotation(Math.PI / 4);
        this.add(diamond);
        // Inner pulsing glow
        const glow = scene.add.graphics();
        glow.fillStyle(0xffffff, 0.5);
        glow.fillCircle(0, 0, 4);
        this.add(glow);
        scene.tweens.add({
            targets: glow,
            alpha: 0.3,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        // Orbiting particle
        const particle = scene.add.graphics();
        particle.fillStyle(0x88ddff, 0.7);
        particle.fillCircle(10, 0, 2);
        this.add(particle);
        scene.tweens.add({
            targets: particle,
            rotation: Math.PI * 2,
            duration: 1500,
            repeat: -1,
            ease: 'Linear'
        });
        scene.add.existing(this);
        scene.physics.add.existing(this);
    }

    update(_time: number, delta: number) {
        this.lifeTimer += delta;
        if (this.lifeTimer >= this.lifespan) {
            this.destroy();
            return;
        }

        this.handleMovement();
        this.handleAttacking(delta);
    }

    private handleMovement() {
        const ownerBody = this.owner.body as Phaser.Physics.Arcade.Body;
        if (!ownerBody) return;

        const ownerVelocity = ownerBody.velocity;
        let targetX = this.owner.x;
        let targetY = this.owner.y;
        const offset = 40;

        if (ownerVelocity.x !== 0) {
            targetX -= Math.sign(ownerVelocity.x) * offset;
        }
        if (ownerVelocity.y !== 0) {
            targetY -= Math.sign(ownerVelocity.y) * offset;
        }

        if (ownerVelocity.x === 0 && ownerVelocity.y === 0) {
            targetX -= offset;
        }
        
        const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);

        if (distance > 200) {
             this.x = targetX;
             this.y = targetY;
        } else if (distance > 5) {
             const moveSpeed = this.owner.getMoveSpeed() * 1.5;
             const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
             const body = this.body as Phaser.Physics.Arcade.Body;
             if(body) {
                body.setVelocity(Math.cos(angle) * moveSpeed, Math.sin(angle) * moveSpeed);
             }
        } else {
             const body = this.body as Phaser.Physics.Arcade.Body;
             if(body) {
                body.setVelocity(0,0);
             }
        }
    }

    private handleAttacking(delta: number) {
        this.attackTimer += delta;
        const attackCooldown = this.owner.getAttackCooldown();
        if (this.attackTimer >= attackCooldown) {
            this.attackTimer = 0;
            this.findAndAttackEnemy();
        }
    }

    private findAndAttackEnemy() {
        const gameScene = this.scene as GameScene;
        const enemies = gameScene.getEnemies().getChildren();
        
        let closestEnemy: Phaser.GameObjects.GameObject | null = null;
        let minDistance = 800;

        enemies.forEach((enemy: any) => {
            if (enemy.active) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestEnemy = enemy;
                }
            }
        });

        if (closestEnemy) {
            this.attack(closestEnemy as unknown as { x: number, y: number });
        }
    }

    private attack(target: { x: number, y: number }) {
        const gameScene = this.scene as GameScene;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        
        const attackDamage = this.owner.getAttackDamage();
        let projectileCount = this.owner.getProjectileCount();
        const meleeCount = this.owner.getMeleeAttackCount();
        if (meleeCount > 0) {
            projectileCount = Math.max(projectileCount, meleeCount);
        }
        const projectileSpeed = this.owner.getProjectileSpeed();

        const { damage, isCritical } = this.calculateDamage(attackDamage);

        if (projectileCount === 1) {
            const projectile = new Projectile(
                this.scene,
                this.x,
                this.y,
                damage,
                projectileSpeed,
                angle,
                false,
                false,
                isCritical
            );
            gameScene.getProjectiles().add(projectile);
        } else {
            const spreadAngle = Math.PI / 4;
            const angleStep = spreadAngle / (projectileCount - 1);
            for (let i = 0; i < projectileCount; i++) {
                const projectileAngle = angle - spreadAngle / 2 + angleStep * i;
                const projectile = new Projectile(
                    this.scene,
                    this.x,
                    this.y,
                    damage,
                    projectileSpeed,
                    projectileAngle,
                    false,
                    false,
                    isCritical
                );
                gameScene.getProjectiles().add(projectile);
            }
        }
    }

    private calculateDamage(baseDamage: number): { damage: number, isCritical: boolean } {
        const criticalStrikeChance = this.owner.getCriticalStrikeChance();
        const criticalStrikeDamage = this.owner.getCriticalStrikeDamage();
        let finalDamage = baseDamage;
        let isCritical = false;
        if (Math.random() < criticalStrikeChance) {
            finalDamage *= criticalStrikeDamage;
            isCritical = true;
        }
        return { damage: finalDamage, isCritical };
    }
} 