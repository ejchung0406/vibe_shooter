import Phaser from 'phaser';
import { UpgradeManager } from '../systems/UpgradeManager';

interface UISceneData {
    level: number;
    upgradeManager: UpgradeManager;
}

export class UIScene extends Phaser.Scene {
    private level!: number;
    private upgradeManager!: UpgradeManager;
    private upgradeCards: Phaser.GameObjects.Container[] = [];

    constructor() {
        super({ key: 'UIScene' });
    }

    init(data: UISceneData) {
        this.level = data.level;
        this.upgradeManager = data.upgradeManager;
    }

    create() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        
        // Create background overlay
        const overlay = this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 0.8);
        
        // Level up title
        const title = this.add.text(screenWidth / 2, screenHeight * 0.2, `LEVEL ${this.level}!`, {
            fontSize: '64px',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Subtitle
        const subtitle = this.add.text(screenWidth / 2, screenHeight * 0.3, 'Choose your upgrade:', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
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
        const container = this.add.container(x, y);
        
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
            fontSize: '24px',
            color: rarityColors[upgrade.rarity] || '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Upgrade description (bigger text)
        const description = this.add.text(0, -80, upgrade.description, {
            fontSize: '18px',
            color: '#e0e0e0',
            wordWrap: { width: 280 }
        }).setOrigin(0.5);
        
        // Rarity indicator
        const rarityText = this.add.text(0, 140, upgrade.rarity.toUpperCase(), {
            fontSize: '16px',
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