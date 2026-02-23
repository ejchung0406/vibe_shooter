import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { t } from '../i18n/i18n';
import { TankEnemy } from '../entities/TankEnemy';
import { RangedEnemy } from '../entities/RangedEnemy';
import { BossEnemy } from '../entities/BossEnemy';
import { DasherEnemy } from '../entities/DasherEnemy';
import { SplitterEnemy } from '../entities/SplitterEnemy';
import { ShieldedEnemy } from '../entities/ShieldedEnemy';
import { SummonerEnemy } from '../entities/SummonerEnemy';
import { BomberEnemy } from '../entities/BomberEnemy';
import { BruteBoss } from '../entities/bosses/BruteBoss';
import { SwarmBoss } from '../entities/bosses/SwarmBoss';
import { PhaseShifterBoss } from '../entities/bosses/PhaseShifterBoss';
import { TeleporterBoss } from '../entities/bosses/TeleporterBoss';
import { FinalBoss } from '../entities/bosses/FinalBoss';
import { SPAWN_DISTANCE, MAX_ENEMIES_ON_SCREEN, MAP_SIZE } from '../GameConstants';
import { SoundManager } from './SoundManager';

export class EnemySpawner {
    private scene: GameScene;
    private spawnInterval: number = 2500;
    private waveNumber: number = 1;
    private enemiesPerWave: number = 5;
    private bossActive: boolean = false;
    private spawnEvent: Phaser.Time.TimerEvent | null = null;

    // Wave system based on kills
    private enemiesKilledThisWave: number = 0;
    private enemiesToKillPerWave: number = 10;

    // Difficulty scaling
    private difficultyMultiplier: number = 1.0;
    private maxEnemiesOnScreen: number = MAX_ENEMIES_ON_SCREEN;
    private spawnMultiplier: number = 1;

    constructor(scene: GameScene) {
        this.scene = scene;
    }

    public startSpawning() {
        this.spawnEvent = this.scene.time.addEvent({
            delay: this.spawnInterval,
            callback: this.spawnWave,
            callbackScope: this,
            loop: true
        });
    }

    public preSpawnEnemies(count: number) {
        for (let i = 0; i < count; i++) {
            this.spawnEnemy('basic');
        }
    }

    private spawnWave() {
        const currentEnemies = this.scene.getEnemies().getChildren().length;

        if (currentEnemies >= this.maxEnemiesOnScreen) {
            return;
        }

        const enemyTypes = this.getEnemyTypesForWave();

        // During boss fights, spawn at half rate
        const multiplier = this.bossActive ? Math.max(1, Math.floor(this.spawnMultiplier / 2)) : this.spawnMultiplier;
        const typesToSpawn = this.bossActive ? enemyTypes.slice(0, Math.ceil(enemyTypes.length / 2)) : enemyTypes;

        for (let i = 0; i < multiplier; i++) {
            typesToSpawn.forEach((type) => {
                this.spawnEnemy(type);
            });
        }
    }

    private getEnemyTypesForWave(): string[] {
        const types: string[] = [];
        const enemyCount = this.enemiesPerWave + Math.floor(this.waveNumber / 5);

        for (let i = 0; i < enemyCount; i++) {
            const rand = Math.random();

            if (this.waveNumber >= 15 && rand < 0.05) {
                types.push('boss');
            } else if (this.waveNumber >= 7 && rand < 0.15) {
                // Shielded or summoner
                types.push(Math.random() < 0.5 ? 'shielded' : 'summoner');
            } else if (this.waveNumber >= 5 && rand < 0.25) {
                // Tank or splitter
                types.push(Math.random() < 0.5 ? 'tank' : 'splitter');
            } else if (this.waveNumber >= 3 && rand < 0.35) {
                // Dasher or bomber
                types.push(Math.random() < 0.5 ? 'dasher' : 'bomber');
            } else if (rand < 0.4) {
                types.push('ranged');
            } else {
                types.push('basic');
            }
        }

        return types;
    }

    private spawnEnemy(type: string) {
        const spawnPosition = this.getRandomSpawnPosition();

        let enemy;

        switch (type) {
            case 'tank':
                enemy = new TankEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 'ranged':
                enemy = new RangedEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 'dasher':
                enemy = new DasherEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 'splitter':
                enemy = new SplitterEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 'shielded':
                enemy = new ShieldedEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 'summoner':
                enemy = new SummonerEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 'bomber':
                enemy = new BomberEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 'boss':
                enemy = new TankEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                enemy.setScale(1.5);
                break;
            default: // basic
                enemy = new TankEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                break;
        }

        // Elite chance (not for bosses)
        if (!enemy.isBossEnemy()) {
            const eliteChance = this.waveNumber >= 5 ? 0.15 : 0.10;
            if (Math.random() < eliteChance) {
                enemy.makeElite();
            }
        }

        this.scene.getEnemies().add(enemy);
    }

    private spawnBoss() {
        this.bossActive = true;

        const spawnPosition = this.getRandomSpawnPosition();

        let boss;

        // Select boss based on wave number
        switch (this.waveNumber) {
            case 3:
                boss = new BruteBoss(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 5:
                boss = new SwarmBoss(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 7:
                boss = new PhaseShifterBoss(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 9:
                boss = new TeleporterBoss(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 11:
                boss = new FinalBoss(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            default:
                // For wave 13+, use random boss or fallback to BossEnemy
                boss = new BossEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                break;
        }

        this.scene.getEnemies().add(boss);
        this.showBossAnnouncement();
    }

    public onBossDefeated() {
        this.bossActive = false;
    }

    public onEnemyKilled() {
        this.enemiesKilledThisWave++;

        if (this.enemiesKilledThisWave >= this.enemiesToKillPerWave) {
            this.advanceWave();
        }
    }

    private advanceWave() {
        SoundManager.getInstance().play('waveStart');
        this.waveNumber++;
        this.enemiesKilledThisWave = 0;

        this.enemiesToKillPerWave = 10 + Math.floor((this.waveNumber - 1) * 2.5);

        this.updateWaveDisplay();

        // Track highest wave
        this.scene.updateHighestWave(this.waveNumber);

        // Check for boss spawn
        if (this.waveNumber === 3 || (this.waveNumber > 3 && (this.waveNumber - 3) % 2 === 0)) {
            this.spawnBoss();
        }

        this.updateDifficulty();
    }

    private updateWaveDisplay() {
        this.scene.updateWaveCounter(this.waveNumber);
    }

    public getEnemiesKilledThisWave(): number {
        return this.enemiesKilledThisWave;
    }

    public getEnemiesToKillPerWave(): number {
        return this.enemiesToKillPerWave;
    }

    private getRandomSpawnPosition(): { x: number, y: number } {
        const player = this.scene.getPlayer();
        if (!player) {
            return { x: 0, y: 0 };
        }

        const playerX = player.getX();
        const playerY = player.getY();
        const spawnDistance = SPAWN_DISTANCE;
        const side = Math.floor(Math.random() * 4);
        let x: number, y: number;

        switch (side) {
            case 0:
                x = playerX + (Math.random() - 0.5) * spawnDistance * 2;
                y = playerY - spawnDistance;
                break;
            case 1:
                x = playerX + spawnDistance;
                y = playerY + (Math.random() - 0.5) * spawnDistance * 2;
                break;
            case 2:
                x = playerX + (Math.random() - 0.5) * spawnDistance * 2;
                y = playerY + spawnDistance;
                break;
            case 3:
                x = playerX - spawnDistance;
                y = playerY + (Math.random() - 0.5) * spawnDistance * 2;
                break;
            default:
                x = playerX;
                y = playerY;
        }

        // Clamp within map bounds
        const halfMap = MAP_SIZE / 2;
        x = Phaser.Math.Clamp(x, -halfMap + 50, halfMap - 50);
        y = Phaser.Math.Clamp(y, -halfMap + 50, halfMap - 50);

        return { x, y };
    }

    private showBossAnnouncement() {
        SoundManager.getInstance().play('bossSpawn');
        const announcement = this.scene.add.text(this.scene.scale.width / 2, 150, t('boss.incoming'), {
            fontSize: '32px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1500);

        this.scene.tweens.add({
            targets: announcement,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 1000,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                announcement.destroy();
            }
        });
    }

    private updateDifficulty() {
        this.difficultyMultiplier = 1 + (this.waveNumber - 1) * 0.1;

        if (this.waveNumber <= 3) {
            this.spawnInterval = 3500 - (this.waveNumber - 1) * 200;
        } else if (this.waveNumber <= 10) {
            this.spawnInterval = 3100 - (this.waveNumber - 3) * 150;
        } else {
            this.spawnInterval = 2050 - (this.waveNumber - 10) * 50;
        }
        this.spawnInterval = Math.max(500, this.spawnInterval);

        this.maxEnemiesOnScreen = Math.min(30, 15 + Math.floor(this.waveNumber / 3));

        if (this.spawnEvent) {
            this.spawnEvent.remove();
        }
        this.spawnEvent = this.scene.time.addEvent({
            delay: this.spawnInterval,
            callback: this.spawnWave,
            callbackScope: this,
            loop: true
        });
    }

    public getDifficultyMultiplier(): number {
        return this.difficultyMultiplier;
    }

    public getWaveNumber(): number {
        return this.waveNumber;
    }

    public pauseSpawning() {
        if (this.spawnEvent) {
            this.spawnEvent.remove();
            this.spawnEvent = null;
        }
    }

    public resumeSpawning() {
        this.startSpawning();
    }

    public getSpawnMultiplier() {
        return this.spawnMultiplier;
    }

    public setSpawnMultiplier(multiplier: number) {
        this.spawnMultiplier = multiplier;
    }
}
