import { BaseEnemy } from './BaseEnemy';

export class ShieldedEnemy extends BaseEnemy {
    private shieldHits: number = 3;
    private shieldActive: boolean = true;
    private shieldGraphics: Phaser.GameObjects.Graphics | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.baseHealthMultiplier = 2.0;
        this.calculateHealth();

        this.moveSpeed = 35;
        this.damage = 20;
        this.xpValue = 60;

        // Create shield visual
        this.shieldGraphics = scene.add.graphics();
        this.shieldGraphics.lineStyle(2, 0x00aaff, 0.8);
        this.shieldGraphics.strokeCircle(0, 0, 18);
        this.add(this.shieldGraphics);
    }

    protected getEnemyColor(): number {
        return 0x4488FF;
    }

    protected createVisual(): void {
        const g = this.scene.add.graphics();
        // Thick inner armor cross pattern
        g.lineStyle(3, 0x3366CC, 0.7);
        g.beginPath();
        g.moveTo(0, -10); g.lineTo(0, 10);
        g.moveTo(-10, 0); g.lineTo(10, 0);
        g.strokePath();
        // Center emblem dot
        g.fillStyle(0x88ccff);
        g.fillCircle(0, 0, 3);
        // Corner armor plates
        g.fillStyle(0x3366CC, 0.4);
        g.fillRect(-10, -10, 7, 7);
        g.fillRect(3, -10, 7, 7);
        g.fillRect(-10, 3, 7, 7);
        g.fillRect(3, 3, 7, 7);
        this.add(g);
    }

    public takeDamage(damage: number, isCritical: boolean = false) {
        if (this.shieldActive) {
            this.shieldHits--;

            // Show shield hit effect
            if (this.shieldGraphics) {
                this.shieldGraphics.clear();
                if (this.shieldHits > 0) {
                    this.shieldGraphics.lineStyle(2, 0x00aaff, 0.3 + (this.shieldHits / 3) * 0.5);
                    this.shieldGraphics.strokeCircle(0, 0, 18);
                }
            }

            // Flash blue
            this.sprite.setFillStyle(0x00aaff);
            this.scene.time.delayedCall(100, () => {
                if (this.active && this.sprite) {
                    this.sprite.setFillStyle(this.getEnemyColor());
                }
            });

            if (this.shieldHits <= 0) {
                this.shieldActive = false;
                if (this.shieldGraphics) {
                    this.shieldGraphics.destroy();
                    this.shieldGraphics = null;
                }
            }
            return; // Shield absorbs the hit completely
        }

        super.takeDamage(damage, isCritical);
    }
}
