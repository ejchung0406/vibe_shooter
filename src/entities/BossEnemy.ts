import { BaseEnemy } from './BaseEnemy';
import { EnemyProjectile } from './EnemyProjectile';
import { Item } from './Item';
import { GameSceneInterface } from '../types/GameSceneInterface';

export class BossEnemy extends BaseEnemy {
    private singleShotTimer: number = 0;
    private singleShotCooldown: number = 1500; // 1.5 second

    private barrageTimer: number = 0;
    private barrageCooldown: number = 5000; // 5 seconds
    private barrageShotCount: number = 18;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        
        // Boss properties
        this.baseHealthMultiplier = 50; // 50x health
        this.moveSpeed = 60; // Slower than tank
        this.damage = 25; // High damage
        this.xpBossMultiplier = 30; // Lots of XP
        this.isBoss = true;
        
        // Make boss 10x bigger
        this.setScale(10);
        
        // Recalculate health with new multiplier
        this.calculateHealth();
        
        // Update health bar for boss
        this.createHealthBar();

        // Make boss attack faster if the wave is higher
        const gameScene = this.scene as GameSceneInterface;
        const enemySpawner = gameScene.getEnemySpawner();
        if (enemySpawner) {
            this.singleShotCooldown *= (10 - enemySpawner.getWaveNumber()) / 10;
            this.barrageCooldown *= (10 - enemySpawner.getWaveNumber()) / 10;
        }
    }

    protected setupHitbox() {
        // Fix hitbox after scaling - make it proportional to visual size
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setSize(18, 18);
            body.setOffset(-9, -9);
        }
    }

    protected customUpdate(_time: number, delta: number): void {
        this.singleShotTimer += delta;
        this.barrageTimer += delta;

        // Single targeted shot
        if (this.singleShotTimer >= this.singleShotCooldown) {
            this.shootTargetedMissile();
            this.singleShotTimer = 0;
        }

        // All-around barrage
        if (this.barrageTimer >= this.barrageCooldown) {
            this.shootBarrage();
            this.barrageTimer = 0;
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
        // Weapon shapes extending from sides
        g.fillStyle(0x880000);
        g.fillRect(-16, -3, 6, 6);
        g.fillRect(10, -3, 6, 6);
        // Glow border
        g.lineStyle(2, 0xFF4400, 0.5);
        g.strokeRect(-13, -13, 26, 26);
        this.add(g);
    }

    private shootTargetedMissile(): void {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();

        if (player) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.getX(), player.getY());
            const missile = new EnemyProjectile(
                this.scene,
                this.x,
                this.y,
                angle,
                this.damage,
                300 // Missile speed
            );
            gameScene.getEnemyProjectiles().add(missile);
        }
    }

    private shootBarrage(): void {
        const angleStep = (Math.PI * 2) / this.barrageShotCount;
        
        for (let i = 0; i < this.barrageShotCount; i++) {
            const angle = angleStep * i;
            
            const missile = new EnemyProjectile(
                this.scene,
                this.x,
                this.y,
                angle,
                this.damage,
                200 // Slower barrage missiles
            );
            
            const gameScene = this.scene as GameSceneInterface;
            gameScene.getEnemyProjectiles().add(missile);
        }
    }

    public die(): void {
        // Notify enemy spawner that boss is defeated
        const gameScene = this.scene as GameSceneInterface;
        gameScene.showBossClearedMessage();
        const enemySpawner = gameScene.getEnemySpawner();
        if (enemySpawner) {
            enemySpawner.onBossDefeated();
        }
        gameScene.onBossDefeated();
        
        this.dropItems();

        // Call parent die method
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
                    const spawnX = this.x + Math.cos(angle) * 50;
                    const spawnY = this.y + Math.sin(angle) * 50;
                    const item = new Item(this.scene, spawnX, spawnY, itemData);
                    gameScene.addItem(item);
                }
            }
        }
    }
} 