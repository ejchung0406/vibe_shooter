import Phaser from 'phaser';

export class EffectsManager {
    private scene: Phaser.Scene;

    // Kill streak tracking
    private killStreak: number = 0;
    private killStreakTimer: number = 0;
    private killStreakResetDelay: number = 3000; // 3 seconds

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public screenShake(intensity: number, duration: number) {
        this.scene.cameras.main.shake(duration, intensity / 1000);
    }

    public hitStop(duration: number) {
        this.scene.time.timeScale = 0.01;
        this.scene.time.delayedCall(duration * 0.01, () => {
            this.scene.time.timeScale = 1;
        });
    }

    public slowMotion(scale: number, duration: number) {
        this.scene.time.timeScale = scale;
        this.scene.time.delayedCall(duration * scale, () => {
            this.scene.time.timeScale = 1;
        });
    }

    public onEnemyKilled(isBoss: boolean) {
        this.killStreak++;
        this.killStreakTimer = 0;

        if (isBoss) {
            this.screenShake(10, 300);
        } else {
            this.screenShake(4, 100);
        }

        // Streak thresholds
        if (this.killStreak === 5) {
            this.showStreakText('KILLING SPREE!', '#ffaa00');
            this.slowMotion(0.5, 300);
        } else if (this.killStreak === 10) {
            this.showStreakText('RAMPAGE!', '#ff4400');
            this.slowMotion(0.4, 400);
        } else if (this.killStreak === 20) {
            this.showStreakText('GODLIKE!', '#ff0000');
            this.slowMotion(0.3, 500);
        }
    }

    public update(delta: number) {
        if (this.killStreak > 0) {
            this.killStreakTimer += delta;
            if (this.killStreakTimer >= this.killStreakResetDelay) {
                this.killStreak = 0;
                this.killStreakTimer = 0;
            }
        }
    }

    public getKillStreak(): number {
        return this.killStreak;
    }

    private showStreakText(message: string, color: string) {
        const screenWidth = this.scene.scale.width;

        const text = this.scene.add.text(screenWidth / 2, 200, message, {
            fontSize: '48px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 80,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    public createEnhancedDeathEffect(x: number, y: number, color: number, isBoss: boolean) {
        const particleCount = isBoss ? 24 : 10;
        const radius = isBoss ? 40 : 20;

        // White flash
        const flash = this.scene.add.circle(x, y, isBoss ? 60 : 20, 0xffffff, 0.8);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        // Colored fragments
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
            const dist = Math.random() * radius;
            const size = isBoss ? 4 + Math.random() * 6 : 3 + Math.random() * 3;
            const particleColor = Math.random() > 0.5 ? color : 0xffffff;

            const particle = this.scene.add.rectangle(
                x + Math.cos(angle) * dist,
                y + Math.sin(angle) * dist,
                size, size, particleColor
            );

            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * (isBoss ? 120 : 60),
                y: particle.y + Math.sin(angle) * (isBoss ? 120 : 60),
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 500 + Math.random() * 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
}
