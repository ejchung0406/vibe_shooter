import Phaser from 'phaser';
import { GameSceneInterface } from '../types/GameSceneInterface';
import { SoundManager } from '../systems/SoundManager';

export class XPOrb extends Phaser.GameObjects.Container {
    private xpAmount: number;
    private orb: Phaser.GameObjects.Arc;
    private updateHandler: () => void;

    constructor(scene: Phaser.Scene, x: number, y: number, xpAmount: number) {
        super(scene, x, y);
        this.xpAmount = xpAmount;

        // Sky-blue glowing circle
        this.orb = scene.add.circle(0, 0, 8, 0x66CCFF, 0.9);
        this.orb.setStrokeStyle(2, 0x00AAFF);
        this.add(this.orb);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(30, 30);
        body.setOffset(-15, -15);

        // Scatter outward then slow down
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 60;
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        body.setDrag(120);

        // Pulsing glow
        scene.tweens.add({
            targets: this.orb,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0.6,
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Setup player overlap
        const gameScene = scene as unknown as GameSceneInterface;
        gameScene.physics.add.overlap(
            gameScene.getPlayer(),
            this,
            this.onPickup,
            undefined,
            this
        );

        // Register for scene update to handle magnet pull
        this.updateHandler = () => this.magnetUpdate();
        scene.events.on('update', this.updateHandler);
        this.on('destroy', () => {
            scene.events.off('update', this.updateHandler);
        });
    }

    private magnetUpdate() {
        if (!this.active || !this.body) return;

        const gameScene = this.scene as unknown as GameSceneInterface;
        const player = gameScene.getPlayer();
        if (!player) return;

        const magnetRange = player.getXPMagnetRange();
        if (magnetRange <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < magnetRange && dist > 5) {
            const speed = 350;
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
        }
    }

    private onPickup() {
        SoundManager.getInstance().play('xpPickup');
        const gameScene = this.scene as unknown as GameSceneInterface;
        gameScene.addXP(this.xpAmount);

        // Floating XP text
        const text = this.scene.add.text(this.x, this.y - 10, `+${this.xpAmount} XP`, {
            fontSize: '14px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#66CCFF',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });

        this.destroy();
    }
}
