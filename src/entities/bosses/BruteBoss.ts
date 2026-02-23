import { BaseEnemy } from '../BaseEnemy';
import { EnemyProjectile } from '../EnemyProjectile';
import { Item } from '../Item';
import { GameSceneInterface } from '../../types/GameSceneInterface';

export class BruteBoss extends BaseEnemy {
    private singleShotTimer: number = 0;
    private singleShotCooldown: number = 1500;
    private barrageTimer: number = 0;
    private barrageCooldown: number = 5000;
    private barrageShotCount: number = 18;
    private slamTimer: number = 0;
    private slamCooldown: number = 8000;
    private slamRadius: number = 300;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.baseHealthMultiplier = 30;
        this.moveSpeed = 60;
        this.damage = 25;
        this.xpBossMultiplier = 30;
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
        return 0x8B0000;
    }

    protected createVisual(): void {
        const g = this.scene.add.graphics();
        // Crown spikes
        g.fillStyle(0xFFD700);
        g.fillTriangle(-8, -12, -5, -18, -2, -12);
        g.fillTriangle(-3, -12, 0, -20, 3, -12);
        g.fillTriangle(2, -12, 5, -18, 8, -12);
        // Thick armor cross (top-down)
        g.lineStyle(3, 0x660000, 0.8);
        g.beginPath();
        g.moveTo(0, -8); g.lineTo(0, 8);
        g.moveTo(-8, 0); g.lineTo(8, 0);
        g.strokePath();
        // Weapon shapes (rectangles) extending from sides
        g.fillStyle(0x8B0000);
        g.fillRect(-16, -3, 6, 6);
        g.fillRect(10, -3, 6, 6);
        // Armor plate layers
        g.fillStyle(0x550000, 0.5);
        g.fillRect(-8, 4, 16, 5);
        // Glow border
        g.lineStyle(2, 0xFF4400, 0.5);
        g.strokeRect(-13, -13, 26, 26);
        this.add(g);
    }

    protected customUpdate(_time: number, delta: number): void {
        this.singleShotTimer += delta;
        this.barrageTimer += delta;
        this.slamTimer += delta;

        if (this.singleShotTimer >= this.singleShotCooldown) {
            this.shootTargetedMissile();
            this.singleShotTimer = 0;
        }

        if (this.barrageTimer >= this.barrageCooldown) {
            this.shootBarrage();
            this.barrageTimer = 0;
        }

        if (this.slamTimer >= this.slamCooldown) {
            this.groundSlam();
            this.slamTimer = 0;
        }
    }

    private shootTargetedMissile(): void {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();
        if (player) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.getX(), player.getY());
            const missile = new EnemyProjectile(this.scene, this.x, this.y, angle, this.damage, 300);
            gameScene.getEnemyProjectiles().add(missile);
        }
    }

    private shootBarrage(): void {
        const gameScene = this.scene as GameSceneInterface;
        const angleStep = (Math.PI * 2) / this.barrageShotCount;
        for (let i = 0; i < this.barrageShotCount; i++) {
            const angle = angleStep * i;
            const missile = new EnemyProjectile(this.scene, this.x, this.y, angle, this.damage, 200);
            gameScene.getEnemyProjectiles().add(missile);
        }
    }

    private groundSlam(): void {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();

        // Shockwave visual
        const shockwave = this.scene.add.circle(this.x, this.y, 10, 0xff4400, 0.4);
        shockwave.setStrokeStyle(4, 0xff8800);

        this.scene.tweens.add({
            targets: shockwave,
            scaleX: this.slamRadius / 10,
            scaleY: this.slamRadius / 10,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => shockwave.destroy()
        });

        // Damage player if in range
        if (player && player.isAlive()) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.getX(), player.getY());
            if (distance <= this.slamRadius) {
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
