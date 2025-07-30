import Phaser from 'phaser';

export class CharacterSelectionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectionScene' });
    }

    create() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        this.add.text(screenWidth / 2, screenHeight * 0.2, 'Choose Your Character', {
            fontSize: '48px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Ranged Character Selection
        const rangedButton = this.add.container(screenWidth / 2 - 200, screenHeight / 2);
        const rangedRect = this.add.rectangle(0, 0, 300, 400, 0x1a1a2e);
        rangedRect.setStrokeStyle(5, 0x0f3460);
        const rangedText = this.add.text(0, -150, 'Ranged Attacker', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        const rangedDescription = this.add.text(0, 0, 'Fires projectiles at enemies from a distance.', { fontSize: '18px', color: '#cccccc', wordWrap: { width: 280 } }).setOrigin(0.5);
        rangedButton.add([rangedRect, rangedText, rangedDescription]);
        rangedRect.setInteractive();
        rangedRect.on('pointerdown', () => {
            this.scene.start('GameScene', { character: 'ranged' });
        });

        // Melee Character Selection
        const meleeButton = this.add.container(screenWidth / 2 + 200, screenHeight / 2);
        const meleeRect = this.add.rectangle(0, 0, 300, 400, 0x1a1a2e);
        meleeRect.setStrokeStyle(5, 0x0f3460);
        const meleeText = this.add.text(0, -150, 'Melee Attacker', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        const meleeDescription = this.add.text(0, 0, 'Slashes at nearby enemies with a powerful sword.', { fontSize: '18px', color: '#cccccc', wordWrap: { width: 280 } }).setOrigin(0.5);
        meleeButton.add([meleeRect, meleeText, meleeDescription]);
        meleeRect.setInteractive();
        meleeRect.on('pointerdown', () => {
            this.scene.start('GameScene', { character: 'melee' });
        });
    }
}