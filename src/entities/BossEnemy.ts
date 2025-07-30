import { BaseEnemy } from './BaseEnemy';
import { EnemyProjectile } from './EnemyProjectile';
import { Item } from './Item';
import { ItemManager } from '../systems/ItemManager';

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
        this.xpMultiplier = 30; // Lots of XP
        this.isBoss = true;
        
        // Make boss 10x bigger
        this.setScale(10);
        
        // Recalculate health with new multiplier
        this.calculateHealth();
        
        // Update health bar for boss
        this.createHealthBar();

        // Make boss attack faster if the wave is higher
        const gameScene = this.scene as any;
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

    protected customUpdate(time: number, delta: number): void {
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
        return 0x8B0000; // Dark red for boss
    }

    private shootTargetedMissile(): void {
        const gameScene = this.scene as any;
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
            
            const gameScene = this.scene as any;
            gameScene.getEnemyProjectiles().add(missile);
        }
    }

    public die(): void {
        // Notify enemy spawner that boss is defeated
        const gameScene = this.scene as any;
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
        const gameScene = this.scene as any;
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