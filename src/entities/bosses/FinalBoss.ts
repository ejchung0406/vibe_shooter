import { BaseEnemy } from '../BaseEnemy';
import { TankEnemy } from '../TankEnemy';
import { EnemyProjectile } from '../EnemyProjectile';
import { Item } from '../Item';
import { GameSceneInterface } from '../../types/GameSceneInterface';

type FinalPhase = 'phase1' | 'phase2' | 'phase3';

export class FinalBoss extends BaseEnemy {
    private currentPhase: FinalPhase = 'phase1';
    private attackTimer: number = 0;
    private barrageTimer: number = 0;
    private slamTimer: number = 0;
    private teleportTimer: number = 0;
    private summonTimer: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.baseHealthMultiplier = 80;
        this.moveSpeed = 50;
        this.damage = 30;
        this.xpBossMultiplier = 80;
        this.isBoss = true;

        this.setScale(12);
        this.calculateHealth();
        this.createHealthBar();
    }

    protected setupHitbox() {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setSize(18, 18);
            body.setOffset(-9, -9);
        }
    }

    protected getEnemyColor(): number {
        switch (this.currentPhase) {
            case 'phase1': return 0x8B0000;
            case 'phase2': return 0x660066;
            case 'phase3': return 0xFF4400;
            default: return 0x8B0000;
        }
    }

    protected createVisual(): void {
        const g = this.scene.add.graphics();
        // Golden crown (larger, more prominent)
        g.fillStyle(0xFFD700);
        g.fillTriangle(-10, -12, -7, -22, -4, -12);
        g.fillTriangle(-4, -12, 0, -24, 4, -12);
        g.fillTriangle(4, -12, 7, -22, 10, -12);
        // Crown base
        g.fillStyle(0xFFAA00);
        g.fillRect(-10, -12, 20, 3);
        // Multiple armor layers (top-down)
        g.lineStyle(2, 0x660000, 0.7);
        g.strokeRect(-10, -8, 20, 16);
        g.lineStyle(1.5, 0x550000, 0.5);
        g.strokeRect(-7, -5, 14, 10);
        // Golden inner core
        g.fillStyle(0xFFAA00, 0.5);
        g.fillCircle(0, 0, 5);
        g.fillStyle(0xFFDD44, 0.7);
        g.fillCircle(0, 0, 3);
        // Thick glow border
        g.lineStyle(3, 0xFFAA00, 0.6);
        g.strokeRect(-14, -14, 28, 28);
        this.add(g);
    }

    protected customUpdate(_time: number, delta: number): void {
        // Phase transitions based on HP
        const hpPercent = this.health / this.maxHealth;
        if (hpPercent <= 0.3 && this.currentPhase !== 'phase3') {
            this.currentPhase = 'phase3';
            this.moveSpeed = 75; // Enrage
            this.damage = Math.floor(this.damage * 1.5);
            this.sprite.setFillStyle(this.getEnemyColor());
        } else if (hpPercent <= 0.6 && this.currentPhase === 'phase1') {
            this.currentPhase = 'phase2';
            this.sprite.setFillStyle(this.getEnemyColor());
        }

        this.attackTimer += delta;
        this.barrageTimer += delta;

        switch (this.currentPhase) {
            case 'phase1':
                // Targeted shots + barrage
                if (this.attackTimer >= 1500) {
                    this.shootTargeted();
                    this.attackTimer = 0;
                }
                if (this.barrageTimer >= 5000) {
                    this.shootBarrage(18);
                    this.barrageTimer = 0;
                }
                break;

            case 'phase2':
                // Teleport + spread shots + summon
                this.teleportTimer += delta;
                this.summonTimer += delta;

                if (this.teleportTimer >= 5000) {
                    this.teleport();
                    this.teleportTimer = 0;
                }
                if (this.attackTimer >= 2000) {
                    this.spreadShot();
                    this.attackTimer = 0;
                }
                if (this.summonTimer >= 8000) {
                    this.summonMinions(2);
                    this.summonTimer = 0;
                }
                break;

            case 'phase3':
                // Rapid barrages + ground slam + enrage
                this.slamTimer += delta;

                if (this.barrageTimer >= 2000) {
                    this.shootBarrage(24);
                    this.barrageTimer = 0;
                }
                if (this.slamTimer >= 6000) {
                    this.groundSlam();
                    this.slamTimer = 0;
                }
                if (this.attackTimer >= 1000) {
                    this.shootTargeted();
                    this.attackTimer = 0;
                }
                break;
        }
    }

    private shootTargeted(): void {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();
        if (player) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.getX(), player.getY());
            const missile = new EnemyProjectile(this.scene, this.x, this.y, angle, this.damage, 300);
            gameScene.getEnemyProjectiles().add(missile);
        }
    }

    private shootBarrage(count: number): void {
        const gameScene = this.scene as GameSceneInterface;
        const angleStep = (Math.PI * 2) / count;
        for (let i = 0; i < count; i++) {
            const angle = angleStep * i;
            const missile = new EnemyProjectile(this.scene, this.x, this.y, angle, this.damage, 200);
            gameScene.getEnemyProjectiles().add(missile);
        }
    }

    private spreadShot(): void {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();
        if (!player) return;

        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.getX(), player.getY());
        for (let i = 0; i < 5; i++) {
            const angle = baseAngle - Math.PI / 6 + (i / 4) * Math.PI / 3;
            const missile = new EnemyProjectile(this.scene, this.x, this.y, angle, this.damage, 250);
            gameScene.getEnemyProjectiles().add(missile);
        }
    }

    private teleport(): void {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();
        if (!player) return;

        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * 200;
        this.x = player.getX() + Math.cos(angle) * dist;
        this.y = player.getY() + Math.sin(angle) * dist;

        // Flash effect
        const flash = this.scene.add.circle(this.x, this.y, 40, 0x660066, 0.6);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 300,
            onComplete: () => flash.destroy()
        });
    }

    private summonMinions(count: number): void {
        const gameScene = this.scene as GameSceneInterface;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const minion = new TankEnemy(
                this.scene,
                this.x + Math.cos(angle) * 80,
                this.y + Math.sin(angle) * 80
            );
            minion.setScale(0.8);
            gameScene.getEnemies().add(minion);
        }
    }

    private groundSlam(): void {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();
        const slamRadius = 350;

        const shockwave = this.scene.add.circle(this.x, this.y, 10, 0xff4400, 0.4);
        shockwave.setStrokeStyle(4, 0xff8800);
        this.scene.tweens.add({
            targets: shockwave,
            scaleX: slamRadius / 10,
            scaleY: slamRadius / 10,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => shockwave.destroy()
        });

        if (player && player.isAlive()) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.getX(), player.getY());
            if (distance <= slamRadius) {
                player.takeDamage(this.damage * 2);
                const dx = player.getX() - this.x;
                const dy = player.getY() - this.y;
                player.applyKnockback(dx, dy, 800);
            }
        }
    }

    public die(): void {
        const gameScene = this.scene as GameSceneInterface;
        gameScene.showBossClearedMessage();
        const enemySpawner = gameScene.getEnemySpawner();
        if (enemySpawner) {
            enemySpawner.onBossDefeated();
        }
        gameScene.onBossDefeated();
        this.dropItems();
        super.die();
    }

    private dropItems(): void {
        const gameScene = this.scene as GameSceneInterface;
        const itemManager = gameScene.getItemManager();
        if (itemManager) {
            for (let i = 0; i < 5; i++) { // Final boss drops 5 items
                const itemData = itemManager.getRandomBossItem();
                if (itemData) {
                    const angle = (i / 5) * 2 * Math.PI;
                    const item = new Item(this.scene, this.x + Math.cos(angle) * 60, this.y + Math.sin(angle) * 60, itemData);
                    gameScene.addItem(item);
                }
            }
        }
    }
}
