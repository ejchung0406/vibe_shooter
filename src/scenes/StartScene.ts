import Phaser from 'phaser';
import { t, getLang, setLang } from '../i18n/i18n';

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
        const title = this.add.text(screenWidth / 2, screenHeight * 0.15, t('start.title'), {
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
        const startText = this.add.text(0, 0, t('start.start_game'), {
            fontSize: '32px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const startButton = this.add.container(screenWidth / 2, screenHeight * 0.35, [startRect, startText]).setDepth(1002);

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

        // Difficulty toggle
        let difficulty: 'easy' | 'hard' = 'hard';
        const diffRect = this.add.rectangle(0, 0, 160, 40, 0x1a1a2e);
        diffRect.setStrokeStyle(2, 0x00ff88);
        const diffText = this.add.text(0, 0, t('start.hard'), {
            fontSize: '20px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const diffButton = this.add.container(screenWidth / 2 + 190, screenHeight * 0.35, [diffRect, diffText]).setDepth(1002);
        diffButton.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
        diffButton.on('pointerover', () => {
            diffButton.setScale(1.1);
            diffRect.setFillStyle(0x2a2a3e);
        });
        diffButton.on('pointerout', () => {
            diffButton.setScale(1);
            diffRect.setFillStyle(0x1a1a2e);
        });
        diffButton.on('pointerdown', () => {
            difficulty = difficulty === 'hard' ? 'easy' : 'hard';
            diffText.setText(difficulty === 'hard' ? t('start.hard') : t('start.easy'));
        });

        // Start game on click
        startButton.on('pointerdown', () => {
            this.scene.start('CharacterSelectionScene', { difficulty });
        });

        // Tutorial button
        const tutorialRect = this.add.rectangle(0, 0, 300, 50, 0x1a1a2e);
        tutorialRect.setStrokeStyle(2, 0x00ff88);
        const tutorialText = this.add.text(0, 0, t('start.how_to_play'), {
            fontSize: '22px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const tutorialButton = this.add.container(screenWidth / 2, screenHeight * 0.45, [tutorialRect, tutorialText]).setDepth(1002);
        tutorialButton.setInteractive(new Phaser.Geom.Rectangle(-150, -25, 300, 50), Phaser.Geom.Rectangle.Contains);
        tutorialButton.on('pointerover', () => {
            tutorialButton.setScale(1.1);
            tutorialRect.setFillStyle(0x2a2a3e);
        });
        tutorialButton.on('pointerout', () => {
            tutorialButton.setScale(1);
            tutorialRect.setFillStyle(0x1a1a2e);
        });
        tutorialButton.on('pointerdown', () => {
            this.scene.start('TutorialScene');
        });

        // Language toggle button
        const langLabel = getLang() === 'en' ? '한국어' : 'English';
        const langRect = this.add.rectangle(0, 0, 160, 40, 0x1a1a2e);
        langRect.setStrokeStyle(2, 0x00ff88);
        const langText = this.add.text(0, 0, langLabel, {
            fontSize: '20px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const langButton = this.add.container(screenWidth / 2, screenHeight * 0.53, [langRect, langText]).setDepth(1002);
        langButton.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
        langButton.on('pointerover', () => {
            langButton.setScale(1.1);
            langRect.setFillStyle(0x2a2a3e);
        });
        langButton.on('pointerout', () => {
            langButton.setScale(1);
            langRect.setFillStyle(0x1a1a2e);
        });
        langButton.on('pointerdown', () => {
            setLang(getLang() === 'en' ? 'ko' : 'en');
            this.scene.restart();
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
        const controlsTitle = this.add.text(0, -120, t('start.controls'), {
            fontSize: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Controls text with better spacing
        const controlsText = this.add.text(0, -20, t('start.controls_text'), {
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

        const descriptionText = this.add.text(0, 0, t('start.description'), {
            fontSize: '14px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#888888',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5);

        // Author information
        const authorText = this.add.text(0, 40, t('start.author'), {
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
