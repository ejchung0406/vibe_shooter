import { GameScene } from '../scenes/GameScene';
import { TankEnemy } from '../entities/TankEnemy';
import { RangedEnemy } from '../entities/RangedEnemy';

export class EnemySpawner {
    private scene: GameScene;
    private spawnTimer: number = 0;
    private spawnInterval: number = 4000; // 4 seconds (slower spawning)
    private waveNumber: number = 1;
    private enemiesPerWave: number = 2; // Fewer enemies per wave
    private bossSpawnInterval: number = 10; // Boss every 10 waves
    
    // Difficulty scaling
    private difficultyMultiplier: number = 1.0;
    private maxEnemiesOnScreen: number = 20;

    constructor(scene: GameScene) {
        this.scene = scene;
    }

    public startSpawning() {
        // Start the spawn timer
        this.scene.time.addEvent({
            delay: this.spawnInterval,
            callback: this.spawnWave,
            callbackScope: this,
            loop: true
        });
    }

    private spawnWave() {
        const currentEnemies = this.scene.getEnemies().getChildren().length;
        
        // Don't spawn if too many enemies on screen
        if (currentEnemies >= this.maxEnemiesOnScreen) {
            return;
        }

        // Determine enemy types for this wave
        const enemyTypes = this.getEnemyTypesForWave();
        
        // Spawn enemies around the edges of the screen
        enemyTypes.forEach((type, index) => {
            this.spawnEnemy(type);
        });

        // Check for boss spawn
        if (this.waveNumber % this.bossSpawnInterval === 0) {
            this.spawnBoss();
        }

        this.waveNumber++;
        this.updateDifficulty();
    }

    private getEnemyTypesForWave(): string[] {
        const types: string[] = [];
        const enemyCount = this.enemiesPerWave + Math.floor(this.waveNumber / 5);
        
        for (let i = 0; i < enemyCount; i++) {
            const rand = Math.random();
            
            if (this.waveNumber >= 15 && rand < 0.1) {
                types.push('boss');
            } else if (this.waveNumber >= 8 && rand < 0.4) {
                types.push('ranged');
            } else if (this.waveNumber >= 5 && rand < 0.3) {
                types.push('tank');
            } else {
                types.push('basic');
            }
        }
        
        return types;
    }

    private spawnEnemy(type: string) {
        // Spawn position around screen edges
        const spawnPosition = this.getRandomSpawnPosition();
        
        let enemy;
        
        switch (type) {
            case 'tank':
                enemy = new TankEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 'ranged':
                enemy = new RangedEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                break;
            case 'boss':
                enemy = new TankEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                enemy.setScale(1.5);
                break;
            default: // basic
                enemy = new TankEnemy(this.scene, spawnPosition.x, spawnPosition.y);
                break;
        }
        
        this.scene.getEnemies().add(enemy);
    }

    private spawnBoss() {
        // Spawn boss at a random edge position
        const spawnPosition = this.getRandomSpawnPosition();
        
        const boss = new TankEnemy(
            this.scene,
            spawnPosition.x,
            spawnPosition.y
        );
        
        // Make boss bigger
        boss.setScale(1.5);
        
        this.scene.getEnemies().add(boss);
        
        // Show boss announcement
        this.showBossAnnouncement();
    }

    private getRandomSpawnPosition(): { x: number, y: number } {
        const spawnDistance = 700; // Distance from origin - within enemy detection range
        const side = Math.floor(Math.random() * 4);
        let x: number, y: number;
        
        switch (side) {
            case 0: // Top
                x = (Math.random() - 0.5) * spawnDistance * 2;
                y = -spawnDistance;
                break;
            case 1: // Right
                x = spawnDistance;
                y = (Math.random() - 0.5) * spawnDistance * 2;
                break;
            case 2: // Bottom
                x = (Math.random() - 0.5) * spawnDistance * 2;
                y = spawnDistance;
                break;
            case 3: // Left
                x = -spawnDistance;
                y = (Math.random() - 0.5) * spawnDistance * 2;
                break;
            default:
                x = 0;
                y = 0;
        }
        
        return { x, y };
    }

    private showBossAnnouncement() {
        const announcement = this.scene.add.text(this.scene.scale.width / 2, 150, 'BOSS INCOMING!', {
            fontSize: '32px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0); // Fixed to UI
        
        // Animate the announcement
        this.scene.tweens.add({
            targets: announcement,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 1000,
            yoyo: true,
            repeat: 2,
            onComplete: () => announcement.destroy()
        });
    }

    private updateDifficulty() {
        // Increase difficulty over time
        this.difficultyMultiplier = 1 + (this.waveNumber - 1) * 0.1;
        
        // Decrease spawn interval (faster spawning)
        this.spawnInterval = Math.max(500, 2000 - (this.waveNumber - 1) * 100);
        
        // Increase max enemies
        this.maxEnemiesOnScreen = Math.min(50, 20 + Math.floor(this.waveNumber / 5));
        
        // Update spawn timer
        this.scene.time.removeAllEvents();
        this.scene.time.addEvent({
            delay: this.spawnInterval,
            callback: this.spawnWave,
            callbackScope: this,
            loop: true
        });
    }

    public getWaveNumber(): number {
        return this.waveNumber;
    }

    public getDifficultyMultiplier(): number {
        return this.difficultyMultiplier;
    }

    public pauseSpawning() {
        this.scene.time.removeAllEvents();
    }

    public resumeSpawning() {
        this.startSpawning();
    }
} 