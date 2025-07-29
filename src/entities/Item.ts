import Phaser from 'phaser';
import { Player } from './Player';

export interface ItemData {
    id: string;
    name: string;
    description: string;
    texture: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    applyEffect: (player: Player) => void;
}

export class Item extends Phaser.GameObjects.Container {
    private itemData: ItemData;

    constructor(scene: Phaser.Scene, x: number, y: number, itemData: ItemData) {
        super(scene, x, y);
        this.itemData = itemData;
        const sprite = scene.add.rectangle(0, 0, 30, 30, 0xffd700);
        this.add(sprite);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(30, 30);
        
        this.setInteractive(new Phaser.Geom.Rectangle(-15, -15, 30, 30), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', (pointer: Phaser.Input.Pointer) => this.showTooltip(pointer))
            .on('pointerout', this.hideTooltip);
    }

    private showTooltip(pointer: Phaser.Input.Pointer) {
        const gameScene = this.scene as any;
        gameScene.showItemTooltip(pointer.worldX, pointer.worldY, this.itemData);
    }

    private hideTooltip() {
        const gameScene = this.scene as any;
        gameScene.hideItemTooltip();
    }

    public applyEffect(player: Player) {
        this.itemData.applyEffect(player);
    }
    
    public getItemData(): ItemData {
        return this.itemData;
    }
} 