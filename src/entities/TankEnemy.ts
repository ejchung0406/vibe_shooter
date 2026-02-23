import { BaseEnemy } from './BaseEnemy';

export class TankEnemy extends BaseEnemy {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.baseHealthMultiplier = 2.5;
        this.calculateHealth();

        this.moveSpeed = 30;
        this.damage = 25;
        this.xpValue = 50;

        this.sprite.setSize(32, 32);
        this.setScale(1.3);
    }

    protected createVisual(): void {
        const g = this.scene.add.graphics();
        // Thick concentric armor plates (top-down)
        g.lineStyle(3, 0x5A2D0A);
        g.strokeRect(-14, -14, 28, 28);
        g.lineStyle(2, 0x6B3D1B);
        g.strokeRect(-10, -10, 20, 20);
        // Spike protrusions on 4 sides
        g.fillStyle(0x5A2D0A);
        g.fillTriangle(0, -14, -4, -20, 4, -20);
        g.fillTriangle(0, 14, -4, 20, 4, 20);
        g.fillTriangle(-14, 0, -20, -4, -20, 4);
        g.fillTriangle(14, 0, 20, -4, 20, 4);
        // Cross-hatch armor pattern in center
        g.lineStyle(1, 0x000000, 0.3);
        g.beginPath();
        g.moveTo(-6, -6); g.lineTo(6, 6);
        g.moveTo(6, -6); g.lineTo(-6, 6);
        g.strokePath();
        this.add(g);
    }

    protected customUpdate(_time: number, _delta: number): void {}

    protected getEnemyColor(): number {
        return 0x8B4513;
    }
} 