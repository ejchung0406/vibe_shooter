import { BaseEnemy } from '../BaseEnemy';
import { EnemyProjectile } from '../EnemyProjectile';
import { Item } from '../Item';
import { GameSceneInterface } from '../../types/GameSceneInterface';

type BossPhase = 'aggressive' | 'defensive' | 'berserk';

export class PhaseShifterBoss extends BaseEnemy {
    private currentPhase: BossPhase = 'aggressive';
    private phaseTimer: number = 0;
    private phaseDuration: number = 10000;
    private attackTimer: number = 0;
    private phaseIndicator: Phaser.GameObjects.Graphics | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.baseHealthMultiplier = 50;
        this.moveSpeed = 50;
        this.damage = 22;
        this.xpBossMultiplier = 50;
        this.isBoss = true;

        this.setScale(10);
        this.calculateHealth();
        this.createHealthBar();

        // Phase indicator ring
        this.phaseIndicator = scene.add.graphics();
        this.add(this.phaseIndicator);
        this.updatePhaseVisual();
    }

    protected createVisual(): void {
        const g = this.scene.add.graphics();
        // Crown spikes
        g.fillStyle(0xFFD700);
        g.fillTriangle(-8, -12, -5, -18, -2, -12);
        g.fillTriangle(-3, -12, 0, -20, 3, -12);
        g.fillTriangle(2, -12, 5, -18, 8, -12);
        // Inner energy ring
        g.lineStyle(2, 0xFF4444, 0.5);
        g.strokeCircle(0, 0, 8);
        // Phase-colored core dot
        g.fillStyle(0xFF4444, 0.6);
        g.fillCircle(0, 0, 4);
        // Glow border
        g.lineStyle(2, 0xFF4444, 0.5);
        g.strokeRect(-13, -13, 26, 26);
        this.add(g);
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
            case 'aggressive': return 0xFF4444;
            case 'defensive': return 0x4444FF;
            case 'berserk': return 0xFF8800;
            default: return 0xFF4444;
        }
    }

    protected customUpdate(_time: number, delta: number): void {
        this.phaseTimer += delta;
        this.attackTimer += delta;

        // Phase transition
        if (this.phaseTimer >= this.phaseDuration) {
            this.nextPhase();
            this.phaseTimer = 0;
        }

        switch (this.currentPhase) {
            case 'aggressive':
                this.moveSpeed = 80;
                if (this.attackTimer >= 800) {
                    this.shootSingle();
                    this.attackTimer = 0;
                }
                break;

            case 'defensive':
                this.moveSpeed = 30;
                if (this.attackTimer >= 2000) {
                    this.shootSingle(); // Slow shots
                    this.attackTimer = 0;
                }
                break;

            case 'berserk':
                this.moveSpeed = 10; // Nearly stationary
                if (this.attackTimer >= 2000) {
                    this.shoot360Barrage();
                    this.attackTimer = 0;
                }
                break;
        }
    }

    public takeDamage(damage: number, isCritical: boolean = false) {
        // Defensive phase: 50% damage reduction
        if (this.currentPhase === 'defensive') {
            damage *= 0.5;
        }
        super.takeDamage(damage, isCritical);
    }

    private nextPhase() {
        const phases: BossPhase[] = ['aggressive', 'defensive', 'berserk'];
        const currentIndex = phases.indexOf(this.currentPhase);
        this.currentPhase = phases[(currentIndex + 1) % phases.length];
        this.updatePhaseVisual();
        this.sprite.setFillStyle(this.getEnemyColor());
    }

    private updatePhaseVisual() {
        if (!this.phaseIndicator) return;
        this.phaseIndicator.clear();

        const color = this.getEnemyColor();
        this.phaseIndicator.lineStyle(1, color, 0.6);
        this.phaseIndicator.strokeCircle(0, 0, 16);
    }

    private shootSingle(): void {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();
        if (player) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.getX(), player.getY());
            const missile = new EnemyProjectile(this.scene, this.x, this.y, angle, this.damage, 280);
            gameScene.getEnemyProjectiles().add(missile);
        }
    }

    private shoot360Barrage(): void {
        const gameScene = this.scene as GameSceneInterface;
        const shotCount = 24;
        const angleStep = (Math.PI * 2) / shotCount;
        for (let i = 0; i < shotCount; i++) {
            const angle = angleStep * i;
            const missile = new EnemyProjectile(this.scene, this.x, this.y, angle, this.damage, 200);
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
