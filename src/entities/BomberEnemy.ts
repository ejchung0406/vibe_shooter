import { BaseEnemy } from './BaseEnemy';
import { GameSceneInterface } from '../types/GameSceneInterface';

export class BomberEnemy extends BaseEnemy {
    private pulseTimer: number = 0;
    private explosionRadius: number = 150;
    private explosionDamage: number = 30;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.baseHealthMultiplier = 0.4;
        this.calculateHealth();

        this.moveSpeed = 90;
        this.damage = 10; // Contact damage is low; explosion is the threat
        this.xpValue = 30;
    }

    protected getEnemyColor(): number {
        return 0xFF4400;
    }

    protected createVisual(): void {
        const g = this.scene.add.graphics();
        // Round body (circle instead of rect) — top-down bomb shape
        g.fillStyle(0xFF4400, 0.4);
        g.fillCircle(0, 0, 11);
        // Hazard diagonal stripes
        g.lineStyle(2, 0xFFAA00, 0.5);
        g.beginPath();
        g.moveTo(-8, -4); g.lineTo(8, 4);
        g.moveTo(-8, 0); g.lineTo(8, 8);
        g.moveTo(-4, -8); g.lineTo(8, 0);
        g.strokePath();
        // Fuse dot on edge
        g.fillStyle(0xFFFF00);
        g.fillCircle(0, -12, 3);
        // Fuse line
        g.lineStyle(1.5, 0x666666);
        g.beginPath();
        g.moveTo(0, -11); g.lineTo(0, -8);
        g.strokePath();
        // Pulsing inner warning ring
        g.lineStyle(1.5, 0xFF0000, 0.6);
        g.strokeCircle(0, 0, 6);
        this.add(g);
    }

    protected customUpdate(_time: number, delta: number): void {
        // Pulsing red glow as it approaches
        this.pulseTimer += delta;
        const pulse = Math.sin(this.pulseTimer * 0.01) * 0.3 + 0.7;
        if (this.sprite && this.active) {
            const r = Math.floor(255 * pulse);
            const g = Math.floor(68 * pulse);
            this.sprite.setFillStyle(Phaser.Display.Color.GetColor(r, g, 0));
        }
    }

    public die(): void {
        this.explode();
        super.die();
    }

    private explode() {
        const gameScene = this.scene as GameSceneInterface;
        const player = gameScene.getPlayer();

        // Visual explosion
        const explosion = this.scene.add.circle(this.x, this.y, this.explosionRadius, 0xFF4400, 0.5);
        explosion.setStrokeStyle(4, 0xFF8800);

        this.scene.tweens.add({
            targets: explosion,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => explosion.destroy()
        });

        // Damage player if in range
        if (player && player.isAlive()) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.getX(), player.getY());
            if (distance <= this.explosionRadius) {
                player.takeDamage(this.explosionDamage);

                // Knockback
                const dx = player.getX() - this.x;
                const dy = player.getY() - this.y;
                player.applyKnockback(dx, dy, 600);
            }
        }

        // Particles
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const particle = this.scene.add.rectangle(
                this.x + Math.cos(angle) * 20,
                this.y + Math.sin(angle) * 20,
                5, 5, 0xFF6600
            );
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * 80,
                y: particle.y + Math.sin(angle) * 80,
                alpha: 0,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }
    }
}
