import { BaseEnemy } from './BaseEnemy';
import { TankEnemy } from './TankEnemy';
import { GameSceneInterface } from '../types/GameSceneInterface';

export class SummonerEnemy extends BaseEnemy {
    private summonTimer: number = 0;
    private summonCooldown: number = 5000;
    private activeMinionCount: number = 0;
    private maxMinions: number = 4;
    private minions: BaseEnemy[] = [];

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.baseHealthMultiplier = 0.6;
        this.calculateHealth();

        this.moveSpeed = 25;
        this.damage = 5;
        this.xpValue = 40;

        this.sprite.setSize(28, 28);
    }

    protected getEnemyColor(): number {
        return 0x9933FF;
    }

    protected createVisual(): void {
        const g = this.scene.add.graphics();
        // Rune circle inscribed on body
        g.lineStyle(1.5, 0xBB44FF, 0.6);
        g.strokeCircle(0, 0, 10);
        // Inner star/pentagram lines
        g.lineStyle(1, 0xCC66FF, 0.5);
        const pts = 5;
        for (let i = 0; i < pts; i++) {
            const a1 = (i / pts) * Math.PI * 2 - Math.PI / 2;
            const a2 = ((i + 2) / pts) * Math.PI * 2 - Math.PI / 2;
            g.beginPath();
            g.moveTo(Math.cos(a1) * 8, Math.sin(a1) * 8);
            g.lineTo(Math.cos(a2) * 8, Math.sin(a2) * 8);
            g.strokePath();
        }
        // Pulsing core
        g.fillStyle(0xBB44FF, 0.5);
        g.fillCircle(0, 0, 4);
        // Floating orbs around body
        g.fillStyle(0xCC66FF, 0.7);
        g.fillCircle(-16, -8, 4);
        g.fillCircle(16, -8, 4);
        g.fillCircle(0, 16, 4);
        this.add(g);
    }

    protected customUpdate(_time: number, delta: number): void {
        this.summonTimer += delta;

        // Clean up destroyed minions
        this.minions = this.minions.filter(m => m.active);
        this.activeMinionCount = this.minions.length;

        if (this.summonTimer >= this.summonCooldown && this.activeMinionCount < this.maxMinions) {
            this.summonMinions();
            this.summonTimer = 0;
        }
    }

    private summonMinions() {
        const gameScene = this.scene as GameSceneInterface;

        // Summon visual
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, 0x9933FF, 0.6);
        ring.strokeCircle(this.x, this.y, 40);
        this.scene.tweens.add({
            targets: ring,
            alpha: 0,
            duration: 500,
            onComplete: () => ring.destroy()
        });

        for (let i = 0; i < 2; i++) {
            if (this.activeMinionCount >= this.maxMinions) break;

            const angle = Math.random() * Math.PI * 2;
            const dist = 40;
            const minion = new TankEnemy(
                this.scene,
                this.x + Math.cos(angle) * dist,
                this.y + Math.sin(angle) * dist
            );
            minion.setScale(0.7);
            gameScene.getEnemies().add(minion);
            this.minions.push(minion);
            this.activeMinionCount++;
        }
    }
}
