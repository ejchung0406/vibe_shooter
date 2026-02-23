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
        body.setCircle(this.radius);
        body.immovable = true;
        // Container lacks getTopLeft(), so manually fix body position & spatial tree
        body.position.set(this.x - body.halfWidth, this.y - body.halfHeight);
        body.updateCenter();
        (scene.physics.world as any).staticTree.remove(body);
        (scene.physics.world as any).staticTree.insert(body);

        scene.add.existing(this);
        this.setDepth(-500);
    }

    private drawPool() {
        this.poolGraphics.clear();
        // Main water fill — opaque
        this.poolGraphics.fillStyle(0x1a4a7a, 1);
        this.poolGraphics.fillCircle(0, 0, this.radius);
        // Lighter water layer
        this.poolGraphics.fillStyle(0x2266aa, 0.7);
        this.poolGraphics.fillCircle(0, 0, this.radius * 0.9);
        // Inner highlight
        this.poolGraphics.fillStyle(0x3388cc, 0.5);
        this.poolGraphics.fillCircle(this.radius * 0.2, -this.radius * 0.2, this.radius * 0.4);
        // Edge ring
        this.poolGraphics.lineStyle(3, 0x0e3a5a, 0.9);
        this.poolGraphics.strokeCircle(0, 0, this.radius);
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
