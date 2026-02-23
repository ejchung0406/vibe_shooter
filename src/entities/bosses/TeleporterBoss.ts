import { BaseEnemy } from '../BaseEnemy';
import { EnemyProjectile } from '../EnemyProjectile';
import { Item } from '../Item';
import { GameSceneInterface } from '../../types/GameSceneInterface';

export class TeleporterBoss extends BaseEnemy {
    private teleportTimer: number = 0;
    private teleportCooldown: number = 5000;
    private burstShotTimer: number = 0;
    private burstShotCooldown: number = 2000;
    private isTeleporting: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.baseHealthMultiplier = 60;
        this.moveSpeed = 40;
        this.damage = 25;
        this.xpBossMultiplier = 60;
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
        return 0x00CCCC;
    }

    protected createVisual(): void {
        const g = this.scene.add.graphics();
        // Crown spikes
        g.fillStyle(0xFFD700);
        g.fillTriangle(-8, -12, -5, -18, -2, -12);
        g.fillTriangle(-3, -12, 0, -20, 3, -12);
        g.fillTriangle(2, -12, 5, -18, 8, -12);
        // "Glitch" offset shadow rectangles
        g.fillStyle(0x00AAAA, 0.3);
        g.fillRect(-10, -8, 20, 16);
        g.fillStyle(0x00CCCC, 0.2);
        g.fillRect(-8, -6, 20, 16);
        // Warp ring circle
        g.lineStyle(1.5, 0x00FFFF, 0.5);
        g.strokeCircle(0, 0, 9);
        // Glow border
        g.lineStyle(2, 0x00FFFF, 0.5);
        g.strokeRect(-13, -13, 26, 26);
        this.add(g);
    }

    protected customUpdate(_time: number, delta: number): void {
        this.teleportTimer += delta;
        this.burstShotTimer += delta;

        if (this.teleportTimer >= this.teleportCooldown && !this.isTeleporting) {
            this.teleport();
            this.teleportTimer = 0;
        }

        if (this.burstShotTimer >= this.burstShotCooldown) {
            this.burstShot();
            this.burstShotTimer = 0;
        }
    }

    private teleport(): void {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();
        if (!player) return;

        this.isTeleporting = true;
        const oldX = this.x;
        const oldY = this.y;

        // Random position near player
        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * 200;
        const newX = player.getX() + Math.cos(angle) * dist;
        const newY = player.getY() + Math.sin(angle) * dist;

        // Telegraph: shadow at destination
        const shadow = this.scene.add.circle(newX, newY, 15, 0x00CCCC, 0.3);
        this.scene.tweens.add({
            targets: shadow,
            alpha: 0.8,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 1000,
            onComplete: () => {
                shadow.destroy();
                // Actual teleport
                this.x = newX;
                this.y = newY;
                this.isTeleporting = false;

                // Flash effect at new position
                const flash = this.scene.add.circle(newX, newY, 30, 0x00CCCC, 0.6);
                this.scene.tweens.add({
                    targets: flash,
                    alpha: 0,
                    scaleX: 2,
                    scaleY: 2,
                    duration: 300,
                    onComplete: () => flash.destroy()
                });

                // Burst shot after teleport
                this.burstShot();
            }
        });

        // Leave damaging zone at old position
        this.createDamageZone(oldX, oldY, gameScene);
    }

    private createDamageZone(x: number, y: number, gameScene: GameSceneInterface): void {
        const zone = this.scene.add.circle(x, y, 80, 0x00CCCC, 0.2);
        zone.setStrokeStyle(2, 0x00CCCC);

        const player = gameScene.getPlayer();
        const damageInterval = this.scene.time.addEvent({
            delay: 500,
            callback: () => {
                if (player && player.isAlive()) {
                    const dist = Phaser.Math.Distance.Between(x, y, player.getX(), player.getY());
                    if (dist <= 80) {
                        player.takeDamage(10);
                    }
                }
            },
            repeat: 5 // 3 seconds total
        });

        this.scene.tweens.add({
            targets: zone,
            alpha: 0,
            duration: 3000,
            onComplete: () => {
                zone.destroy();
                damageInterval.remove();
            }
        });
    }

    private burstShot(): void {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();
        if (!player) return;

        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.getX(), player.getY());

        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                if (!this.active) return;
                const missile = new EnemyProjectile(this.scene, this.x, this.y, baseAngle, this.damage, 300);
                gameScene.getEnemyProjectiles().add(missile);
            });
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
