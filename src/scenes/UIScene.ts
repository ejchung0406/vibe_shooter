import Phaser from 'phaser';
import { UpgradeManager } from '../systems/UpgradeManager';

interface UISceneData {
    level: number;
    upgradeManager: UpgradeManager;
    isGameOver?: boolean;
    isGameClear?: boolean;
    gameTime?: number;
}

export class UIScene extends Phaser.Scene {
    private level!: number;
    private upgradeManager!: UpgradeManager;
    private upgradeCards: Phaser.GameObjects.Container[] = [];
    private isGameOver: boolean = false;
    private isGameClear: boolean = false;
    private gameTime: number = 0;

    constructor() {
        super({ key: 'UIScene' });
    }

    init(data: UISceneData) {
        this.level = data.level;
        this.upgradeManager = data.upgradeManager;
        this.isGameOver = data.isGameOver || false;
        this.isGameClear = data.isGameClear || false;
        this.gameTime = data.gameTime || 0;
    }

    create() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        
        // Create background overlay
        const overlay = this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 0.8).setDepth(2000);

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

        const title = this.add.text(screenWidth / 2, screenHeight * 0.3, 'GAME CLEAR', {
            fontSize: '72px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2001);

        const minutes = Math.floor(this.gameTime / 60000);
        const seconds = Math.floor((this.gameTime % 60000) / 1000);
        const timeString = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;

        const timeText = this.add.text(screenWidth / 2, screenHeight * 0.5, timeString, {
            fontSize: '48px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2001);

        // Main menu button
        const menuRect = this.add.rectangle(0, 0, 200, 60, 0xff4444);
        const menuText = this.add.text(0, 0, 'Main Menu', {
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
            this.scene.start('StartScene');
        });
    }

    private createGameOverScreen() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        const title = this.add.text(screenWidth / 2, screenHeight * 0.3, 'GAME OVER', {
            fontSize: '72px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2001);

        // Restart button
        const restartRect = this.add.rectangle(0, 0, 200, 60, 0x00ff88);
        const restartText = this.add.text(0, 0, 'Restart', {
            fontSize: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const restartButton = this.add.container(screenWidth / 2, screenHeight * 0.5, [restartRect, restartText]).setDepth(2002);

        // Main menu button
        const menuRect = this.add.rectangle(0, 0, 200, 60, 0xff4444);
        const menuText = this.add.text(0, 0, 'Main Menu', {
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
            this.scene.start('StartScene');
        });
    }

    private createLevelUpScreen() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        
        // Level up title
        const title = this.add.text(screenWidth / 2, screenHeight * 0.2, `LEVEL ${this.level}!`, {
            fontSize: '72px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2001);
        
        // Subtitle
        const subtitle = this.add.text(screenWidth / 2, screenHeight * 0.3, 'Choose your upgrade:', {
            fontSize: '36px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(2001);
        
        // Get upgrade options
        const upgrades = this.upgradeManager.getRandomUpgrades(3);
        
        // Create upgrade cards
        const cardSpacing = screenWidth * 0.25;
        const startX = screenWidth * 0.25;
        upgrades.forEach((upgrade, index) => {
            const card = this.createUpgradeCard(upgrade, startX + index * cardSpacing, screenHeight * 0.6);
            this.upgradeCards.push(card);
        });
        
        // Setup input
        this.setupInput();
    }

    private createUpgradeCard(upgrade: any, x: number, y: number): Phaser.GameObjects.Container {
        const container = this.add.container(x, y).setDepth(2002);
        
        // Card background (bigger and more vibrant)
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
        
        // Upgrade title (bigger and colored by rarity)
        const title = this.add.text(0, -140, upgrade.name, {
            fontSize: '28px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: rarityColors[upgrade.rarity] || '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Upgrade description (bigger text)
        const description = this.add.text(0, -80, upgrade.description, {
            fontSize: '20px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#e0e0e0',
            wordWrap: { width: 280 }
        }).setOrigin(0.5);
        
        // Rarity indicator
        const rarityText = this.add.text(0, 140, upgrade.rarity.toUpperCase(), {
            fontSize: '18px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: rarityColors[upgrade.rarity] || '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add all elements to container
        container.add([background, border, title, description, rarityText]);
        
        // Make interactive (left click only)
        background.setInteractive();
        background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.selectUpgrade(upgrade);
            }
        });
        
        // Hover effects (more vibrant)
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