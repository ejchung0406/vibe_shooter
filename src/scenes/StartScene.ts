import Phaser from 'phaser';

export class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    init() {
        // Game state will be reset when GameScene starts
    }

    create() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Create animated background
        this.createAnimatedBackground();

        // Game title
        const title = this.add.text(screenWidth / 2, screenHeight * 0.25, 'VOLVOX ARENA', {
            fontSize: '64px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(1001);

        // Add glow effect to title
        title.setShadow(0, 0, '#00ff88', 10);

        // Start button
        const startRect = this.add.rectangle(0, 0, 300, 80, 0x00ff88);
        const startText = this.add.text(0, 0, 'START GAME', {
            fontSize: '32px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const startButton = this.add.container(screenWidth / 2, screenHeight * 0.45, [startRect, startText]).setDepth(1002);

        // Make button interactive
        startButton.setInteractive(new Phaser.Geom.Rectangle(-150, -40, 300, 80), Phaser.Geom.Rectangle.Contains);
        
        // Button hover effects
        startButton.on('pointerover', () => {
            startButton.setScale(1.1);
            startRect.setFillStyle(0x00ffaa);
        });
        
        startButton.on('pointerout', () => {
            startButton.setScale(1);
            startRect.setFillStyle(0x00ff88);
        });

        // Start game on click
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Controls section
        this.createControlsSection(screenWidth, screenHeight);

        // Game description
        this.createGameDescription(screenWidth, screenHeight);

        // Add some floating particles for visual appeal
        this.createFloatingParticles();
    }

    private createAnimatedBackground() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Create gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, screenWidth, screenHeight);
        bg.setDepth(1000);

        // Add some animated stars
        for (let i = 0; i < 50; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, screenWidth),
                Phaser.Math.Between(0, screenHeight),
                1,
                0xffffff,
                0.3
            ).setDepth(1000);

            this.tweens.add({
                targets: star,
                alpha: 0,
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    private createControlsSection(screenWidth: number, screenHeight: number) {
        const controlsContainer = this.add.container(screenWidth / 2, screenHeight * 0.75, []).setDepth(1002);

        // Controls title
        const controlsTitle = this.add.text(0, -120, 'CONTROLS', {
            fontSize: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Controls text with better spacing
        const controlsText = this.add.text(0, -20, 'WASD - Move\nRight Click - Attack\nQ/E/R/F - Skills\nShift - Dash\nESC - Pause', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#cccccc',
            align: 'center',
            lineSpacing: 12
        }).setOrigin(0.5);

        controlsContainer.add([controlsTitle, controlsText]);
    }

    private createGameDescription(screenWidth: number, screenHeight: number) {
        const descriptionContainer = this.add.container(screenWidth / 2, screenHeight * 0.9, []).setDepth(1002);

        const descriptionText = this.add.text(0, 0, 'Survive waves of enemies, unlock skills and upgrades, defeat bosses to get stronger!', {
            fontSize: '14px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#888888',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5);

        // Author information
        const authorText = this.add.text(0, 40, 'Created by Euijun', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        descriptionContainer.add([descriptionText, authorText]);
    }

    private createFloatingParticles() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Create some floating orbs
        for (let i = 0; i < 8; i++) {
            const orb = this.add.circle(
                Phaser.Math.Between(100, screenWidth - 100),
                Phaser.Math.Between(100, screenHeight - 100),
                Phaser.Math.Between(3, 8),
                0x00ff88,
                0.2
            ).setDepth(1001);

            // Animate the orbs
            this.tweens.add({
                targets: orb,
                x: Phaser.Math.Between(100, screenWidth - 100),
                y: Phaser.Math.Between(100, screenHeight - 100),
                duration: Phaser.Math.Between(8000, 15000),
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });

            // Pulse effect
            this.tweens.add({
                targets: orb,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
} 