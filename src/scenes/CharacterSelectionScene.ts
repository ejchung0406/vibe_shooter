import Phaser from 'phaser';
import { t } from '../i18n/i18n';

export class CharacterSelectionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectionScene' });
    }

    create() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        this.add.text(screenWidth / 2, screenHeight * 0.2, t('charsel.title'), {
            fontSize: '48px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Ranged Character Selection
        const rangedButton = this.add.container(screenWidth / 2 - 320, screenHeight / 2);
        const rangedRect = this.add.rectangle(0, 0, 260, 400, 0x1a1a2e);
        rangedRect.setStrokeStyle(5, 0x0f3460);
        const rangedText = this.add.text(0, -150, t('charsel.ranged'), { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        const rangedDescription = this.add.text(0, 0, t('charsel.ranged_desc'), { fontSize: '18px', color: '#cccccc', wordWrap: { width: 240 } }).setOrigin(0.5);
        rangedButton.add([rangedRect, rangedText, rangedDescription]);
        rangedRect.setInteractive();
        rangedRect.on('pointerdown', () => {
            this.scene.start('GameScene', { character: 'ranged' });
        });

        // Mage Character Selection
        const mageButton = this.add.container(screenWidth / 2, screenHeight / 2);
        const mageRect = this.add.rectangle(0, 0, 260, 400, 0x1a1a2e);
        mageRect.setStrokeStyle(5, 0x2a1a4e);
        const mageText = this.add.text(0, -150, t('charsel.mage'), { fontSize: '24px', color: '#cc88ff' }).setOrigin(0.5);
        const mageDescription = this.add.text(0, 0, t('charsel.mage_desc'), { fontSize: '18px', color: '#cccccc', wordWrap: { width: 240 } }).setOrigin(0.5);
        mageButton.add([mageRect, mageText, mageDescription]);
        mageRect.setInteractive();
        mageRect.on('pointerdown', () => {
            this.scene.start('GameScene', { character: 'mage' });
        });

        // Melee Character Selection
        const meleeButton = this.add.container(screenWidth / 2 + 320, screenHeight / 2);
        const meleeRect = this.add.rectangle(0, 0, 260, 400, 0x1a1a2e);
        meleeRect.setStrokeStyle(5, 0x0f3460);
        const meleeText = this.add.text(0, -150, t('charsel.melee'), { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        const meleeDescription = this.add.text(0, 0, t('charsel.melee_desc'), { fontSize: '18px', color: '#cccccc', wordWrap: { width: 240 } }).setOrigin(0.5);
        meleeButton.add([meleeRect, meleeText, meleeDescription]);
        meleeRect.setInteractive();
        meleeRect.on('pointerdown', () => {
            this.scene.start('GameScene', { character: 'melee' });
        });
    }
}
