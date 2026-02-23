import { BaseEnemy } from './BaseEnemy';
import { GameSceneInterface } from '../types/GameSceneInterface';

export class DasherEnemy extends BaseEnemy {
    private dashTimer: number = 0;
    private dashCooldown: number = 3000;
    private isDashing: boolean = false;
    private dashDuration: number = 300;
    private dashElapsed: number = 0;
    private dashTargetX: number = 0;
    private dashTargetY: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.baseHealthMultiplier = 0.5;
        this.calculateHealth();

        this.moveSpeed = 120;
        this.damage = 15;
        this.xpValue = 25;
    }

    protected getEnemyColor(): number {
        return 0x00FF88;
    }

    protected createVisual(): void {
        const g = this.scene.add.graphics();
        // Arrow/wedge body shape (top-down, pointing up)
        g.fillStyle(0x00CC66, 0.6);
        g.fillTriangle(-8, 8, 0, -12, 8, 8);
        // Swept-back tail fins
        g.fillStyle(0x009944);
        g.fillTriangle(-6, 6, -12, 12, -2, 8);
        g.fillTriangle(6, 6, 12, 12, 2, 8);
        // Motion trail lines behind
        g.lineStyle(1, 0x00FF88, 0.3);
        g.beginPath();
        g.moveTo(-4, 10); g.lineTo(-4, 16);
        g.moveTo(0, 10); g.lineTo(0, 16);
        g.moveTo(4, 10); g.lineTo(4, 16);
        g.strokePath();
        this.add(g);
    }

    protected customUpdate(_time: number, delta: number): void {
        if (this.isDashing) {
            this.dashElapsed += delta;
            if (this.dashElapsed >= this.dashDuration) {
                this.isDashing = false;
                this.dashElapsed = 0;
                // Stop dash velocity so it doesn't keep flying
                const body = this.body as Phaser.Physics.Arcade.Body;
                if (body) {
                    body.setVelocity(0, 0);
                }
            }
            return; // Don't update dash timer while dashing
        }

        this.dashTimer += delta;
        if (this.dashTimer >= this.dashCooldown) {
            this.startDash();
            this.dashTimer = 0;
        }
    }

    private startDash() {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();
        if (!player || !player.isAlive()) return;

        this.isDashing = true;
        this.dashElapsed = 0;
        this.dashTargetX = player.getX();
        this.dashTargetY = player.getY();

        const dx = this.dashTargetX - this.x;
        const dy = this.dashTargetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const dashSpeed = this.moveSpeed * 3;
            const body = this.body as Phaser.Physics.Arcade.Body;
            if (body) {
                body.setVelocity(
                    (dx / distance) * dashSpeed * 60,
                    (dy / distance) * dashSpeed * 60
                );
            }
        }

        // Visual dash indicator
        this.sprite.setFillStyle(0xffffff);
        this.scene.time.delayedCall(this.dashDuration, () => {
            if (this.active && this.sprite) {
                this.sprite.setFillStyle(this.getEnemyColor());
            }
        });
    }
}
