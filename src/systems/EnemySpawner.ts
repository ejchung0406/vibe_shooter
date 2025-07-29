import { GameScene } from '../scenes/GameScene';
import { TankEnemy } from '../entities/TankEnemy';
import { RangedEnemy } from '../entities/RangedEnemy';
import { BossEnemy } from '../entities/BossEnemy';

export class EnemySpawner {
    private scene: GameScene;
    private spawnTimer: number = 0;
    private spawnInterval: number = 1500; // Faster spawning (1.5 seconds)
    private waveNumber: number = 1;
    private enemiesPerWave: number = 5; // More enemies per wave
    private bossSpawnInterval: number = 4; // Boss every 4 waves (4, 8, 12, ...) for debugging
    private bossActive: boolean = false; // Track if boss is currently active
    
    // Wave system based on kills
    private enemiesKilledThisWave: number = 0;
    private enemiesToKillPerWave: number = 10; // Kill 10 enemies to advance wave
    
    // Difficulty scaling
    private difficultyMultiplier: number = 1.0;
    private maxEnemiesOnScreen: number = 35; // More enemies on screen at once
    private spawnMultiplier: number = 2; // Spawn 2 groups per wave

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

    public preSpawnEnemies(count: number) {
        for (let i = 0; i < count; i++) {
            this.spawnEnemy('basic');
        }
    }

    private spawnWave() {
        const currentEnemies = this.scene.getEnemies().getChildren().length;
        
        // Don't spawn if too many enemies on screen or boss is active
        if (currentEnemies >= this.maxEnemiesOnScreen || this.bossActive) {
            return;
        }

        // Determine enemy types for this wave
        const enemyTypes = this.getEnemyTypesForWave();
        
        // Spawn enemies around the player
        for (let i = 0; i < this.spawnMultiplier; i++) {
            enemyTypes.forEach((type, index) => {
                this.spawnEnemy(type);
            });
        }
        
        // Note: Wave advancement and boss spawning now handled by kill count in onEnemyKilled()
    }

    private getEnemyTypesForWave(): string[] {
        const types: string[] = [];
        const enemyCount = this.enemiesPerWave + Math.floor(this.waveNumber / 5);
        
        for (let i = 0; i < enemyCount; i++) {
            const rand = Math.random();
            
            if (this.waveNumber >= 15 && rand < 0.1) {
                types.push('boss');
            } else if (this.waveNumber >= 1 && rand < 0.4) {
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
        // Spawn position around player
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
        // Set boss as active to stop regular enemy spawning
        this.bossActive = true;
        
        // Spawn boss around player
        const spawnPosition = this.getRandomSpawnPosition();
        
        const boss = new BossEnemy(
            this.scene,
            spawnPosition.x,
            spawnPosition.y
        );
        
        this.scene.getEnemies().add(boss);
        
        // Show boss announcement
        this.showBossAnnouncement();
    }
    
    public onBossDefeated() {
        // Re-enable regular enemy spawning
        this.bossActive = false;
        console.log('Boss defeated! Regular enemy spawning resumed.');
    }
    
    public onEnemyKilled() {
        this.enemiesKilledThisWave++;
        
        // Check if wave should advance
        if (this.enemiesKilledThisWave >= this.enemiesToKillPerWave) {
            this.advanceWave();
        }
    }
    
    private advanceWave() {
        this.waveNumber++;
        this.enemiesKilledThisWave = 0;
        
        this.enemiesToKillPerWave = 10 + Math.floor((this.waveNumber - 1) * 2.5);

        // Update wave display
        this.updateWaveDisplay();
        
        // Check for boss spawn
        if (this.waveNumber % this.bossSpawnInterval === 0) {
            this.spawnBoss();
        }
        
        // Increase difficulty
        this.updateDifficulty();
        
        console.log(`Wave ${this.waveNumber} started! Enemies killed: 0/${this.enemiesToKillPerWave}`);
    }
    
    private updateWaveDisplay() {
        // Update the wave counter UI
        // This will be handled by the GameScene
        const gameScene = this.scene as any;
        if (gameScene.updateWaveCounter) {
            gameScene.updateWaveCounter(
                this.waveNumber, 
                this.enemiesKilledThisWave, 
                this.enemiesToKillPerWave
            );
        }
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
        const spawnDistance = 700; // Distance from player - within enemy detection range (800px)
        const side = Math.floor(Math.random() * 4);
        let x: number, y: number;
        
        switch (side) {
            case 0: // Top of player
                x = playerX + (Math.random() - 0.5) * spawnDistance * 2;
                y = playerY - spawnDistance;
                break;
            case 1: // Right of player
                x = playerX + spawnDistance;
                y = playerY + (Math.random() - 0.5) * spawnDistance * 2;
                break;
            case 2: // Bottom of player
                x = playerX + (Math.random() - 0.5) * spawnDistance * 2;
                y = playerY + spawnDistance;
                break;
            case 3: // Left of player
                x = playerX - spawnDistance;
                y = playerY + (Math.random() - 0.5) * spawnDistance * 2;
                break;
            default:
                x = playerX;
                y = playerY;
        }
        
        return { x, y };
    }

    private showBossAnnouncement() {
        const announcement = this.scene.add.text(this.scene.scale.width / 2, 150, 'BOSS INCOMING!', {
            fontSize: '32px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1500); // Fixed to UI with high depth
        
        // Animate the announcement
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
        // Increase difficulty over time
        this.difficultyMultiplier = 1 + (this.waveNumber - 1) * 0.1;
        
        // Decrease spawn interval (faster spawning)
        if (this.waveNumber <= 3) {
            this.spawnInterval = 3000 - (this.waveNumber - 1) * 200; // Slower start
        } else if (this.waveNumber <= 10) {
            this.spawnInterval = 2400 - (this.waveNumber - 3) * 150; // Moderate increase
        } else {
            this.spawnInterval = 1350 - (this.waveNumber - 10) * 50; // Faster increase
        }
        this.spawnInterval = Math.max(200, this.spawnInterval); // Minimum spawn interval
        
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

    public getDifficultyMultiplier(): number {
        return this.difficultyMultiplier;
    }

    public getWaveNumber(): number {
        return this.waveNumber;
    }

    public pauseSpawning() {
        this.scene.time.removeAllEvents();
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