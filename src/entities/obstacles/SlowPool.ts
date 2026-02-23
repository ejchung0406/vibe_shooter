import Phaser from 'phaser';

export class SlowPool extends Phaser.GameObjects.Container {
    private poolGraphics: Phaser.GameObjects.Graphics;
    private radius: number = 200;
    private lifetime: number = 30000; // 30 seconds
    private age: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.poolGraphics = scene.add.graphics();
        this.poolGraphics.fillStyle(0x4488FF, 0.1);
        this.poolGraphics.fillCircle(0, 0, this.radius);
        this.poolGraphics.lineStyle(1, 0x4488FF, 0.2);
        this.poolGraphics.strokeCircle(0, 0, this.radius);
        this.add(this.poolGraphics);

        // Add "SLOW" label in center
        const label = scene.add.text(0, 0, 'SLOW ZONE', {
            fontSize: '14px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#4488FF',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.4);
        this.add(label);

        scene.add.existing(this);
        this.setDepth(-500);
    }

    public update(delta: number) {
        this.age += delta;

        // Fade out near end of life
        if (this.age > this.lifetime * 0.8) {
            const remaining = (this.lifetime - this.age) / (this.lifetime * 0.2);
            this.setAlpha(Math.max(0, remaining));
        }

        if (this.age >= this.lifetime) {
            this.destroy();
        }
    }

    public getRadius(): number {
        return this.radius;
    }
}
