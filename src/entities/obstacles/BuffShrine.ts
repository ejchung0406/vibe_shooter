import Phaser from 'phaser';
import { GameSceneInterface } from '../../types/GameSceneInterface';

export class BuffShrine extends Phaser.GameObjects.Container {
    private shrineSprite: Phaser.GameObjects.Rectangle;
    private glowGraphics: Phaser.GameObjects.Graphics;
    private isUsed: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        // Use bright cyan/teal to distinguish from items
        this.shrineSprite = scene.add.rectangle(0, 0, 24, 24, 0x00FFCC);
        this.shrineSprite.setStrokeStyle(2, 0x00CC99);
        this.add(this.shrineSprite);

        // Glow
        this.glowGraphics = scene.add.graphics();
        this.glowGraphics.fillStyle(0x00FFCC, 0.15);
        this.glowGraphics.fillCircle(0, 0, 30);
        this.add(this.glowGraphics);

        // Label
        const label = scene.add.text(0, 18, 'SHRINE', {
            fontSize: '10px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00FFCC',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.7);
        this.add(label);

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body

        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        body.setCircle(20);
        // Container lacks getTopLeft(), so manually fix body position & spatial tree
        body.position.set(this.x - body.halfWidth, this.y - body.halfHeight);
        body.updateCenter();
        (scene.physics.world as any).staticTree.remove(body);
        (scene.physics.world as any).staticTree.insert(body);

        // Player overlap
        const gameScene = scene as unknown as GameSceneInterface;
        gameScene.physics.add.overlap(
            gameScene.getPlayer(),
            this,
            this.onPlayerTouch,
            undefined,
            this
        );

        // Pulsing tween
        scene.tweens.add({
            targets: this.shrineSprite,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private onPlayerTouch(_player: any, _shrine: any) {
        if (this.isUsed) return;
        this.isUsed = true;

        const gameScene = this.scene as unknown as GameSceneInterface;
        const player = gameScene.getPlayer();

        // Random buff
        const buffType = Math.floor(Math.random() * 3);
        let message = '';

        switch (buffType) {
            case 0: // Damage boost
                player.increaseAttackDamageMultiplier(0.3);
                message = '+30% Damage for 15s!';
                this.scene.time.delayedCall(15000, () => {
                    if (player.active) {
                        player.decreaseAttackDamageMultiplier(0.3);
                    }
                });
                break;
            case 1: // Speed boost
                player.increaseMoveSpeed(0.5);
                message = '+50% Speed for 10s!';
                this.scene.time.delayedCall(10000, () => {
                    if (player.active) {
                        player.decreaseMoveSpeed(0.5);
                    }
                });
                break;
            case 2: // Full heal
                player.heal(player.getMaxHealth());
                message = 'Full Heal!';
                break;
        }

        // Show buff message
        const text = this.scene.add.text(this.x, this.y - 30, message, {
            fontSize: '20px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00FFCC',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: text,
            y: text.y - 50,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });

        // Activation particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = this.scene.add.rectangle(
                this.x, this.y, 4, 4, 0x00FFCC
            );
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * 50,
                y: this.y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }

        // Fade out shrine
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 500,
            onComplete: () => this.destroy()
        });
    }
}
