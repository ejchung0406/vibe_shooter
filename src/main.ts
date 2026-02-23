import Phaser from 'phaser';
import { StartScene } from './scenes/StartScene';
import { CharacterSelectionScene } from './scenes/CharacterSelectionScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { TutorialScene } from './scenes/TutorialScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: '100%',
    height: '100%',
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [StartScene, CharacterSelectionScene, GameScene, UIScene, TutorialScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    }
};

new Phaser.Game(config); 