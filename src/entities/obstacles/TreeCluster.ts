import Phaser from 'phaser';

export class TreeCluster extends Phaser.GameObjects.Container {
    private treeGraphics: Phaser.GameObjects.Graphics;
    private radius: number;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.radius = 60 + Math.random() * 50;

        this.treeGraphics = scene.add.graphics();
        this.drawTrees();
        this.add(this.treeGraphics);

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
        this.setDepth(-400);
    }

    private drawTrees() {
        this.treeGraphics.clear();

        // Main canopy — dark forest green
        this.treeGraphics.fillStyle(0x0e3a0e, 0.85);
        this.treeGraphics.fillCircle(0, 0, this.radius);

        // Slightly lighter leaf patches
        const patches = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < patches; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * this.radius * 0.6;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            const r = this.radius * (0.2 + Math.random() * 0.25);
            this.treeGraphics.fillStyle(0x1a4c1a, 0.5);
            this.treeGraphics.fillCircle(px, py, r);
        }

        // Trunk dots (visible through canopy)
        const trunks = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < trunks; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * this.radius * 0.4;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            this.treeGraphics.fillStyle(0x3a2510, 0.7);
            this.treeGraphics.fillCircle(px, py, 5);
        }

        // Outline
        this.treeGraphics.lineStyle(2, 0x082808, 0.7);
        this.treeGraphics.strokeCircle(0, 0, this.radius);
    }

    public getRadius(): number {
        return this.radius;
    }
}
