import { BaseEnemy } from '../BaseEnemy';
import { TankEnemy } from '../TankEnemy';
import { EnemyProjectile } from '../EnemyProjectile';
import { Item } from '../Item';
import { GameSceneInterface } from '../../types/GameSceneInterface';

export class SwarmBoss extends BaseEnemy {
    private summonTimer: number = 0;
    private summonCooldown: number = 6000;
    private spreadShotTimer: number = 0;
    private spreadShotCooldown: number = 3000;
    private isBelowHalf: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.baseHealthMultiplier = 40;
        this.moveSpeed = 45;
        this.damage = 20;
        this.xpBossMultiplier = 40;
        this.isBoss = true;

        this.setScale(10);
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
        return 0x660066;
    }

    protected createVisual(): void {
        const g = this.scene.add.graphics();
        // Crown spikes
        g.fillStyle(0xFFD700);
        g.fillTriangle(-8, -12, -5, -18, -2, -12);
        g.fillTriangle(-3, -12, 0, -20, 3, -12);
        g.fillTriangle(2, -12, 5, -18, 8, -12);
        // Inner rune circle
        g.lineStyle(1.5, 0xCC44CC, 0.5);
        g.strokeCircle(0, 0, 8);
        // Pulsing core
        g.fillStyle(0x880088, 0.5);
        g.fillCircle(0, 0, 4);
        // Orbiting minion dots
        g.fillStyle(0xCC44CC, 0.7);
        g.fillCircle(-14, -6, 3);
        g.fillCircle(14, -6, 3);
        g.fillCircle(-10, 12, 3);
        g.fillCircle(10, 12, 3);
        // Glow border
        g.lineStyle(2, 0xCC00CC, 0.5);
        g.strokeRect(-13, -13, 26, 26);
        this.add(g);
    }

    protected customUpdate(_time: number, delta: number): void {
        // Check if below half HP
        if (!this.isBelowHalf && this.health < this.maxHealth * 0.5) {
            this.isBelowHalf = true;
            this.summonCooldown = 3000; // Double summon rate
        }

        this.summonTimer += delta;
        this.spreadShotTimer += delta;

        if (this.summonTimer >= this.summonCooldown) {
            this.summonMinions();
            this.summonTimer = 0;
        }

        if (this.spreadShotTimer >= this.spreadShotCooldown) {
            this.spreadShot();
            this.spreadShotTimer = 0;
        }
    }

    private summonMinions(): void {
        const gameScene = this.scene as GameSceneInterface;

        // Visual
        const ring = this.scene.add.graphics();
        ring.lineStyle(4, 0x660066, 0.6);
        ring.strokeCircle(this.x, this.y, 60);
        this.scene.tweens.add({
            targets: ring,
            alpha: 0,
            duration: 500,
            onComplete: () => ring.destroy()
        });

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dist = 80;
            const minion = new TankEnemy(
                this.scene,
                this.x + Math.cos(angle) * dist,
                this.y + Math.sin(angle) * dist
            );
            minion.setScale(0.8);
            gameScene.getEnemies().add(minion);
        }
    }

    private spreadShot(): void {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();
        if (!player) return;

        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.getX(), player.getY());
        const spreadCount = 5;
        const spreadAngle = Math.PI / 6; // 30 degree spread total

        for (let i = 0; i < spreadCount; i++) {
            const angle = baseAngle - spreadAngle + (i / (spreadCount - 1)) * spreadAngle * 2;
            const missile = new EnemyProjectile(this.scene, this.x, this.y, angle, this.damage, 250);
            gameScene.getEnemyProjectiles().add(missile);
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
            for (let i = 0; i < 3; i++) {
                const itemData = itemManager.getRandomBossItem();
                if (itemData) {
                    const angle = (i / 3) * 2 * Math.PI;
                    const item = new Item(this.scene, this.x + Math.cos(angle) * 50, this.y + Math.sin(angle) * 50, itemData);
                    gameScene.addItem(item);
                }
            }
        }
    }
}
