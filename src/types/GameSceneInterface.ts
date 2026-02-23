import Phaser from 'phaser';
import { BasePlayer } from '../entities/BasePlayer';
import { EnemySpawner } from '../systems/EnemySpawner';
import { ItemManager } from '../systems/ItemManager';
import { UpgradeManager } from '../systems/UpgradeManager';
import { EffectsManager } from '../systems/EffectsManager';
import { ObstacleManager } from '../systems/ObstacleManager';
import { Item, ItemData } from '../entities/Item';
import { Pet } from '../entities/Pet';

export interface GameSceneInterface extends Phaser.Scene {
    getPlayer(): BasePlayer;
    getEnemies(): Phaser.GameObjects.Group;
    getProjectiles(): Phaser.GameObjects.Group;
    getEnemyProjectiles(): Phaser.GameObjects.Group;
    getEnemySpawner(): EnemySpawner;
    getMapSize(): number;
    getPlayerLevel(): number;
    getItemManager(): ItemManager;
    getUpgradeManager(): UpgradeManager;
    getEffectsManager(): EffectsManager;
    getObstacleManager(): ObstacleManager;
    addXP(amount: number): void;
    addItem(item: Item): void;
    addPet(pet: Pet): void;
    spawnItemAt(x: number, y: number): void;
    showSkillUnlockMessage(message: string): void;
    showItemTooltip(x: number, y: number, itemData: ItemData): void;
    hideTooltip(): void;
    showBossClearedMessage(): void;
    gameOver(): void;
    onBossDefeated(): void;
    updateWaveCounter(waveNumber: number): void;
}
