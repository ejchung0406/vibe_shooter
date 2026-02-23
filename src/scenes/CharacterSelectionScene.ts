import Phaser from 'phaser';
import { t } from '../i18n/i18n';

export class CharacterSelectionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectionScene' });
    }

    create() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Dark background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, screenWidth, screenHeight);

        this.add.text(screenWidth / 2, screenHeight * 0.15, t('charsel.title'), {
            fontSize: '48px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        const characters = [
            { key: 'ranged', x: screenWidth / 2 - 320, stroke: 0x0f3460, nameColor: '#ffffff' },
            { key: 'mage', x: screenWidth / 2, stroke: 0x2a1a4e, nameColor: '#cc88ff' },
            { key: 'melee', x: screenWidth / 2 + 320, stroke: 0x0f3460, nameColor: '#ffffff' }
        ];

        for (const char of characters) {
            const container = this.add.container(char.x, screenHeight / 2);

            const rect = this.add.rectangle(0, 0, 260, 400, 0x1a1a2e);
            rect.setStrokeStyle(5, char.stroke);

            const nameText = this.add.text(0, -150, t(`charsel.${char.key}`), {
                fontSize: '24px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                color: char.nameColor,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const descText = this.add.text(0, 0, t(`charsel.${char.key}_desc`), {
                fontSize: '18px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                color: '#cccccc',
                wordWrap: { width: 240 }
            }).setOrigin(0.5);

            container.add([rect, nameText, descText]);

            // Interactive on the container with explicit hit area
            container.setInteractive(
                new Phaser.Geom.Rectangle(-130, -200, 260, 400),
                Phaser.Geom.Rectangle.Contains
            );

            container.on('pointerover', () => {
                container.setScale(1.05);
                rect.setFillStyle(0x2a2a3e);
            });

            container.on('pointerout', () => {
                container.setScale(1);
                rect.setFillStyle(0x1a1a2e);
            });

            container.on('pointerdown', () => {
                this.scene.start('GameScene', { character: char.key });
            });
        }
    }
}
