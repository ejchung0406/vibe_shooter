import { BaseEnemy } from './BaseEnemy';
import { GameSceneInterface } from '../types/GameSceneInterface';

export class SplitterEnemy extends BaseEnemy {
    private generation: number;
    private static MAX_GENERATION = 1;

    constructor(scene: Phaser.Scene, x: number, y: number, generation: number = 0) {
        super(scene, x, y);

        this.generation = generation;

        if (generation === 0) {
            this.baseHealthMultiplier = 1.0;
            this.xpValue = 20;
        } else {
            this.baseHealthMultiplier = 0.5;
            this.xpValue = 10;
            this.setScale(0.7);
        }

        this.calculateHealth();
        this.moveSpeed = 55;
        this.damage = 8;
    }

    protected getEnemyColor(): number {
        return 0xFF69B4;
    }

    protected createVisual(): void {
        const g = this.scene.add.graphics();
        // Two-toned halves (top-down split body)
        g.fillStyle(0xFF69B4, 0.5);
        g.fillRect(-10, -10, 10, 20); // Left half
        g.fillStyle(0xCC3388, 0.5);
        g.fillRect(0, -10, 10, 20); // Right half (darker)
        // Crack/seam down the middle
        g.lineStyle(2, 0xCC4488);
        g.beginPath();
        g.moveTo(0, -12);
        g.lineTo(-2, -4);
        g.lineTo(2, 4);
        g.lineTo(0, 12);
        g.strokePath();
        // Split indicator dots on each half
        g.fillStyle(0xFFAACC, 0.7);
        g.fillCircle(-5, -4, 2);
        g.fillCircle(-5, 4, 2);
        g.fillStyle(0xDD66AA, 0.7);
        g.fillCircle(5, -4, 2);
        g.fillCircle(5, 4, 2);
        this.add(g);
    }

    public die(): void {
        if (this.generation < SplitterEnemy.MAX_GENERATION) {
            const gameScene = this.scene as GameSceneInterface;

            for (let i = 0; i < 2; i++) {
                const offsetX = (Math.random() - 0.5) * 40;
                const offsetY = (Math.random() - 0.5) * 40;

                const mini = new SplitterEnemy(
                    this.scene,
                    this.x + offsetX,
                    this.y + offsetY,
                    this.generation + 1
                );
                gameScene.getEnemies().add(mini);
            }
        }

        super.die();
    }
}
