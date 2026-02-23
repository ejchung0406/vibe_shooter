import Phaser from 'phaser';
import { UpgradeManager } from '../systems/UpgradeManager';
import { t } from '../i18n/i18n';

interface UISceneData {
    level: number;
    upgradeManager: UpgradeManager;
    isGameOver?: boolean;
    isGameClear?: boolean;
    gameTime?: number;
    rerollsRemaining?: number;
}

export class UIScene extends Phaser.Scene {
    private level!: number;
    private upgradeManager!: UpgradeManager;
    private upgradeCards: Phaser.GameObjects.Container[] = [];
    private isGameOver: boolean = false;
    private isGameClear: boolean = false;
    private gameTime: number = 0;
    private rerollsRemaining: number = 0;
    private cardRerollUsed: boolean[] = [false, false, false];
    private currentUpgrades: any[] = [];

    constructor() {
        super({ key: 'UIScene' });
    }

    init(data: UISceneData) {
        this.level = data.level;
        this.upgradeManager = data.upgradeManager;
        this.isGameOver = data.isGameOver || false;
        this.isGameClear = data.isGameClear || false;
        this.gameTime = data.gameTime || 0;
        this.rerollsRemaining = data.rerollsRemaining || 0;
    }

    create() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Create background overlay
        this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 0.8).setDepth(2000);

        if (this.isGameClear) {
            this.createGameClearScreen();
        } else if (this.isGameOver) {
            this.createGameOverScreen();
        } else {
            this.createLevelUpScreen();
        }
    }

    private createGameClearScreen() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        this.add.text(screenWidth / 2, screenHeight * 0.3, t('ui.game_clear'), {
            fontSize: '72px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2001);

        const minutes = Math.floor(this.gameTime / 60000);
        const seconds = Math.floor((this.gameTime % 60000) / 1000);
        const timeString = t('ui.time', { time: `${minutes}:${seconds.toString().padStart(2, '0')}` });

        this.add.text(screenWidth / 2, screenHeight * 0.5, timeString, {
            fontSize: '48px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2001);

        // Main menu button
        const menuRect = this.add.rectangle(0, 0, 200, 60, 0xff4444);
        const menuText = this.add.text(0, 0, t('ui.main_menu'), {
            fontSize: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const menuButton = this.add.container(screenWidth / 2, screenHeight * 0.65, [menuRect, menuText]).setDepth(2002);

        menuButton.setInteractive(new Phaser.Geom.Rectangle(-100, -30, 200, 60), Phaser.Geom.Rectangle.Contains);

        menuButton.on('pointerover', () => {
            menuButton.setScale(1.1);
            menuRect.setFillStyle(0xff6666);
        });
        menuButton.on('pointerout', () => {
            menuButton.setScale(1);
            menuRect.setFillStyle(0xff4444);
        });

        menuButton.on('pointerdown', () => {
            this.scene.stop('GameScene');
            this.scene.stop('UIScene');
            this.scene.start('StartScene');
        });
    }

    private createGameOverScreen() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        this.add.text(screenWidth / 2, screenHeight * 0.3, t('ui.game_over'), {
            fontSize: '72px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2001);

        // Restart button
        const restartRect = this.add.rectangle(0, 0, 200, 60, 0x00ff88);
        const restartText = this.add.text(0, 0, t('ui.restart'), {
            fontSize: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const restartButton = this.add.container(screenWidth / 2, screenHeight * 0.5, [restartRect, restartText]).setDepth(2002);

        // Main menu button
        const menuRect = this.add.rectangle(0, 0, 200, 60, 0xff4444);
        const menuText = this.add.text(0, 0, t('ui.main_menu'), {
            fontSize: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const menuButton = this.add.container(screenWidth / 2, screenHeight * 0.65, [menuRect, menuText]).setDepth(2002);

        // Make buttons interactive
        restartButton.setInteractive(new Phaser.Geom.Rectangle(-100, -30, 200, 60), Phaser.Geom.Rectangle.Contains);
        menuButton.setInteractive(new Phaser.Geom.Rectangle(-100, -30, 200, 60), Phaser.Geom.Rectangle.Contains);

        // Button hover effects
        restartButton.on('pointerover', () => {
            restartButton.setScale(1.1);
            restartRect.setFillStyle(0x00ffaa);
        });
        restartButton.on('pointerout', () => {
            restartButton.setScale(1);
            restartRect.setFillStyle(0x00ff88);
        });

        menuButton.on('pointerover', () => {
            menuButton.setScale(1.1);
            menuRect.setFillStyle(0xff6666);
        });
        menuButton.on('pointerout', () => {
            menuButton.setScale(1);
            menuRect.setFillStyle(0xff4444);
        });

        // Button actions
        restartButton.on('pointerdown', () => {
            this.scene.stop('GameScene');
            this.scene.stop('UIScene');
            this.scene.start('GameScene');
        });

        menuButton.on('pointerdown', () => {
            this.scene.stop('GameScene');
            this.scene.stop('UIScene');
            this.scene.start('StartScene');
        });
    }

    private createLevelUpScreen() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Level up title
        this.add.text(screenWidth / 2, screenHeight * 0.2, t('ui.level_up', { level: this.level }), {
            fontSize: '72px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2001);

        // Subtitle
        this.add.text(screenWidth / 2, screenHeight * 0.3, t('ui.choose_upgrade'), {
            fontSize: '36px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(2001);

        // Get upgrade options
        this.cardRerollUsed = [false, false, false];
        this.currentUpgrades = this.upgradeManager.getRandomUpgrades(3);
        this.showUpgradeCards();

        // Setup input
        this.setupInput();
    }

    private showUpgradeCards() {
        // Clear existing cards
        this.upgradeCards.forEach(card => card.destroy());
        this.upgradeCards = [];

        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        const cardSpacing = screenWidth * 0.25;
        const startX = screenWidth * 0.25;
        this.currentUpgrades.forEach((upgrade, index) => {
            const card = this.createUpgradeCard(upgrade, startX + index * cardSpacing, screenHeight * 0.6, index);
            this.upgradeCards.push(card);
        });
    }

    private createUpgradeCard(upgrade: any, x: number, y: number, cardIndex: number): Phaser.GameObjects.Container {
        const container = this.add.container(x, y).setDepth(2002);

        // Card background
        const background = this.add.rectangle(0, 0, 320, 400, 0x1a1a2e);
        const border = this.add.rectangle(0, 0, 320, 400, 0x16213e, 0);
        border.setStrokeStyle(5, 0x0f3460);

        // Rarity-based colors
        const rarityColors: { [key: string]: string } = {
            common: '#ffffff',
            rare: '#4da6ff',
            epic: '#9966ff',
            legendary: '#ff6600'
        };

        // Upgrade title — translate at display time
        const displayName = t(`upgrade.${upgrade.id}.name`);
        const title = this.add.text(0, -140, displayName, {
            fontSize: '28px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: rarityColors[upgrade.rarity] || '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Upgrade description — translate at display time
        const displayDesc = t(`upgrade.${upgrade.id}.desc`);
        const description = this.add.text(0, -80, displayDesc, {
            fontSize: '20px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#e0e0e0',
            wordWrap: { width: 280 }
        }).setOrigin(0.5);

        // Rarity indicator — translate
        const rarityText = this.add.text(0, 120, t(`rarity.${upgrade.rarity}`), {
            fontSize: '18px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: rarityColors[upgrade.rarity] || '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([background, border, title, description, rarityText]);

        // Per-card reroll button at bottom of card
        const rerollBtnRect = this.add.rectangle(0, 170, 140, 35, 0x334455);
        rerollBtnRect.setStrokeStyle(2, 0x5588aa);
        const rerollBtnText = this.add.text(0, 170, t('ui.reroll'), {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#88ccff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add([rerollBtnRect, rerollBtnText]);

        rerollBtnRect.setInteractive();
        rerollBtnRect.on('pointerover', () => {
            if (!this.cardRerollUsed[cardIndex] && this.rerollsRemaining > 0) {
                rerollBtnRect.setFillStyle(0x445566);
            }
        });
        rerollBtnRect.on('pointerout', () => {
            if (!this.cardRerollUsed[cardIndex]) {
                rerollBtnRect.setFillStyle(0x334455);
            }
        });
        rerollBtnRect.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
            if (this.cardRerollUsed[cardIndex] || this.rerollsRemaining <= 0) return;

            this.cardRerollUsed[cardIndex] = true;
            this.rerollsRemaining--;

            // Gray out button
            rerollBtnRect.setFillStyle(0x222222);
            rerollBtnRect.setStrokeStyle(2, 0x333333);
            rerollBtnText.setColor('#555555');
            rerollBtnText.setText(t('ui.reroll_used'));

            // Re-randomize only this card
            const newUpgrades = this.upgradeManager.getRandomUpgrades(1);
            if (newUpgrades.length > 0) {
                this.currentUpgrades[cardIndex] = newUpgrades[0];
            }
            this.showUpgradeCards();
        });

        // If already used or no rerolls, gray it out
        if (this.cardRerollUsed[cardIndex] || this.rerollsRemaining <= 0) {
            rerollBtnRect.setFillStyle(0x222222);
            rerollBtnRect.setStrokeStyle(2, 0x333333);
            rerollBtnText.setColor('#555555');
            rerollBtnText.setText(this.cardRerollUsed[cardIndex] ? t('ui.reroll_used') : t('ui.reroll_none'));
        }

        // Make card background interactive (left click to select)
        background.setInteractive();
        background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.selectUpgrade(upgrade);
            }
        });

        // Hover effects
        background.on('pointerover', () => {
            background.setFillStyle(0x2a2a4e);
            border.setStrokeStyle(5, 0x1a5490);
        });

        background.on('pointerout', () => {
            background.setFillStyle(0x1a1a2e);
            border.setStrokeStyle(5, 0x0f3460);
        });

        return container;
    }

    public setInteractive(isInteractive: boolean) {
        this.upgradeCards.forEach(card => {
            const background = card.list[0] as Phaser.GameObjects.Rectangle;
            background.setInteractive(isInteractive);
        });
    }

    private selectUpgrade(upgrade: any) {
        // Apply the upgrade
        this.upgradeManager.applyUpgrade(upgrade);

        // Resume the game
        this.scene.resume('GameScene');
        this.scene.stop();
    }

    private setupInput() {
        // Only allow clicking on upgrade cards - no auto-selection
        // The UI will stay until player makes a choice
    }
}
