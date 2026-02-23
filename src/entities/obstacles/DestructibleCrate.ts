import Phaser from 'phaser';
import { GameSceneInterface } from '../../types/GameSceneInterface';
import { Item } from '../Item';
import { XPOrb } from '../XPOrb';
import { SoundManager } from '../../systems/SoundManager';

export class DestructibleCrate extends Phaser.GameObjects.Container {
    private body_: Phaser.GameObjects.Rectangle;
    private lid: Phaser.GameObjects.Rectangle;
    private lock: Phaser.GameObjects.Rectangle;
    private hitsRemaining: number = 5;
    private maxHits: number = 5;
    private healthBarBg: Phaser.GameObjects.Rectangle;
    private healthBar: Phaser.GameObjects.Rectangle;
    private highlight: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        // Chest body - golden brown (2x bigger)
        this.body_ = scene.add.rectangle(0, 4, 60, 40, 0xC8961E);
        this.body_.setStrokeStyle(3, 0x8B6914);
        this.add(this.body_);

        // Chest lid - slightly brighter gold
        this.lid = scene.add.rectangle(0, -16, 64, 20, 0xE8B830);
        this.lid.setStrokeStyle(3, 0xA07818);
        this.add(this.lid);

        // Lock/clasp in center
        this.lock = scene.add.rectangle(0, -4, 10, 10, 0xFFD700);
        this.lock.setStrokeStyle(2, 0xFFA500);
        this.add(this.lock);

        // Health bar
        this.healthBarBg = scene.add.rectangle(0, -35, 50, 5, 0x333333);
        this.healthBar = scene.add.rectangle(0, -35, 50, 5, 0x00ff00);
        this.add(this.healthBarBg);
        this.add(this.healthBar);

        // Hover highlight
        this.highlight = scene.add.graphics();
        this.add(this.highlight);

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body

        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(64, 56);
        body.setOffset(-32, -28);

        // Mouse hover detection
        this.setInteractive(new Phaser.Geom.Rectangle(-32, -28, 64, 56), Phaser.Geom.Rectangle.Contains);
        this.on('pointerover', () => {
            this.highlight.clear();
            this.highlight.lineStyle(2, 0xffffff, 0.6);
            this.highlight.strokeRect(-33, -27, 66, 58);
        });
        this.on('pointerout', () => {
            this.highlight.clear();
        });

        this.setupCollisions();
    }

    private setupCollisions() {
        const gameScene = this.scene as GameSceneInterface;

        // Projectiles damage the chest but pass through
        gameScene.physics.add.overlap(
            gameScene.getProjectiles(),
            this,
            this.onHit,
            undefined,
            this
        );

        // Block enemy movement
        gameScene.physics.add.collider(
            gameScene.getEnemies(),
            this
        );

        // Block player movement
        gameScene.physics.add.collider(
            gameScene.getPlayer(),
            this
        );
    }

    public meleeHit() {
        this.applyHit();
    }

    private onHit(_projectile: any, _crate: any) {
        // Destroy the projectile on impact (unless it's piercing)
        if (_projectile && _projectile.active) {
            if (!_projectile.isPiercing || !_projectile.isPiercing()) {
                _projectile.destroy();
            }
        }
        this.applyHit();
    }

    private applyHit() {
        SoundManager.getInstance().play('crateHit');
        this.hitsRemaining--;

        // Visual shake - stronger shake on each hit
        const shakeIntensity = 4 + (5 - this.hitsRemaining) * 2;
        this.scene.tweens.add({
            targets: this,
            x: this.x + shakeIntensity,
            duration: 40,
            yoyo: true,
            repeat: 2,
            ease: 'Bounce'
        });

        // Fade with damage
        const alpha = 0.4 + (this.hitsRemaining / this.maxHits) * 0.6;
        this.body_.setAlpha(alpha);
        this.lid.setAlpha(alpha);
        this.lock.setAlpha(alpha);

        // Update health bar
        const healthPercent = Math.max(0, this.hitsRemaining / this.maxHits);
        this.healthBar.width = 50 * healthPercent;
        if (healthPercent > 0.5) {
            this.healthBar.setFillStyle(0x00ff00);
        } else if (healthPercent > 0.25) {
            this.healthBar.setFillStyle(0xffff00);
        } else {
            this.healthBar.setFillStyle(0xff0000);
        }

        if (this.hitsRemaining <= 0) {
            this.onDestroyed();
        }
    }

    private onDestroyed() {
        SoundManager.getInstance().play('crateBreak');
        const gameScene = this.scene as GameSceneInterface;

        // Drop a common-rarity item from chests
        const itemManager = gameScene.getItemManager();
        if (itemManager) {
            const itemData = itemManager.getRandomCommonItem();
            if (itemData) {
                const item = new Item(this.scene, this.x, this.y, itemData);
                gameScene.addItem(item);
            }
        }

        // Spawn XP orbs (3-5 orbs)
        const orbCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < orbCount; i++) {
            new XPOrb(this.scene, this.x, this.y, 5 + Math.floor(Math.random() * 10));
        }

        // Break particles - gold pieces
        for (let i = 0; i < 8; i++) {
            const particle = this.scene.add.rectangle(
                this.x + (Math.random() - 0.5) * 20,
                this.y + (Math.random() - 0.5) * 20,
                5, 5, Math.random() > 0.5 ? 0xE8B830 : 0xC8961E
            );
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 70,
                y: particle.y + (Math.random() - 0.5) * 70,
                alpha: 0,
                rotation: Math.random() * Math.PI * 2,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }

        this.destroy();
    }
}
