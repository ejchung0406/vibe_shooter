import Phaser from 'phaser';

export class WaterPool extends Phaser.GameObjects.Container {
    private poolGraphics: Phaser.GameObjects.Graphics;
    private radius: number;
    private rippleTimer: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.radius = 100 + Math.random() * 80;

        this.poolGraphics = scene.add.graphics();
        this.drawPool();
        this.add(this.poolGraphics);

        // Add "WATER" label
        const label = scene.add.text(0, 0, 'WATER', {
            fontSize: '14px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#88bbff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.5);
        this.add(label);

        // Physics — static body for collision
        scene.physics.add.existing(this, true); // true = static
        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        body.setCircle(this.radius, -this.radius, -this.radius);

        scene.add.existing(this);
        this.setDepth(-500);
    }

    private drawPool() {
        this.poolGraphics.clear();
        // Main water fill
        this.poolGraphics.fillStyle(0x2266aa, 0.35);
        this.poolGraphics.fillCircle(0, 0, this.radius);
        // Edge ring
        this.poolGraphics.lineStyle(2, 0x3388cc, 0.4);
        this.poolGraphics.strokeCircle(0, 0, this.radius);
        // Inner highlight
        this.poolGraphics.fillStyle(0x44aaff, 0.15);
        this.poolGraphics.fillCircle(this.radius * 0.2, -this.radius * 0.2, this.radius * 0.4);
    }

    public update(delta: number) {
        this.rippleTimer += delta;
        // Subtle ripple via alpha oscillation
        const alpha = 0.85 + Math.sin(this.rippleTimer * 0.002) * 0.15;
        this.setAlpha(alpha);
    }

    public getRadius(): number {
        return this.radius;
    }
}
