import Phaser from 'phaser';
import { DestructibleCrate } from '../entities/obstacles/DestructibleCrate';
import { SlowPool } from '../entities/obstacles/SlowPool';
import { BuffShrine } from '../entities/obstacles/BuffShrine';
import { WaterPool } from '../entities/obstacles/WaterPool';
import { TreeCluster } from '../entities/obstacles/TreeCluster';
import { GameSceneInterface } from '../types/GameSceneInterface';

export class ObstacleManager {
    private scene: Phaser.Scene & GameSceneInterface;
    private crates: Phaser.GameObjects.Group;
    private slowPools: Phaser.GameObjects.Group;
    private shrines: Phaser.GameObjects.Group;
    private waterPools: Phaser.GameObjects.Group;
    private trees: Phaser.GameObjects.Group;
    private shrineTimer: number = 0;
    private shrineCooldown: number = 36000; // 36 seconds
    private chestTimer: number = 0;
    private chestSpawnInterval: number = 35000; // 35 seconds
    private maxChests: number = 10;

    constructor(scene: Phaser.Scene & GameSceneInterface) {
        this.scene = scene;
        this.crates = scene.add.group();
        this.slowPools = scene.add.group();
        this.shrines = scene.add.group();
        this.waterPools = scene.add.group();
        this.trees = scene.add.group();

        this.spawnInitialObstacles();
        this.spawnInitialTerrain();
    }

    private spawnInitialObstacles() {
        // Spawn 5-8 chests scattered across ±3000
        const chestCount = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < chestCount; i++) {
            const x = (Math.random() - 0.5) * 6000;
            const y = (Math.random() - 0.5) * 6000;
            // Ensure at least 400 from origin
            const dist = Math.sqrt(x * x + y * y);
            if (dist < 400) {
                const angle = Math.atan2(y, x);
                const cx = Math.cos(angle) * 400;
                const cy = Math.sin(angle) * 400;
                this.spawnCrate(cx, cy);
            } else {
                this.spawnCrate(x, y);
            }
        }

        // Spawn 1 slow pool
        const px = (Math.random() - 0.5) * 800;
        const py = (Math.random() - 0.5) * 800;
        this.spawnSlowPool(px, py);

        // Spawn 1 shrine
        const sx = (Math.random() - 0.5) * 1600;
        const sy = (Math.random() - 0.5) * 1600;
        this.spawnShrine(sx, sy);
    }

    private spawnInitialTerrain() {
        // Spawn 3-4 water pools (within ±2000, at least 400 from origin)
        const waterCount = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < waterCount; i++) {
            const { x, y } = this.getTerrainPosition(2000, 400);
            this.spawnWaterPool(x, y);
        }

        // Spawn 4-5 tree clusters (within ±2000, at least 400 from origin)
        const treeCount = 4 + Math.floor(Math.random() * 2);
        for (let i = 0; i < treeCount; i++) {
            const { x, y } = this.getTerrainPosition(2000, 400);
            this.spawnTreeCluster(x, y);
        }
    }

    private getTerrainPosition(range: number, minDist: number): { x: number; y: number } {
        let x: number, y: number, dist: number;
        do {
            x = (Math.random() - 0.5) * range * 2;
            y = (Math.random() - 0.5) * range * 2;
            dist = Math.sqrt(x * x + y * y);
        } while (dist < minDist);
        return { x, y };
    }

    private spawnCrate(x: number, y: number) {
        const crate = new DestructibleCrate(this.scene, x, y);
        this.crates.add(crate);
    }

    private spawnSlowPool(x: number, y: number) {
        const pool = new SlowPool(this.scene, x, y);
        this.slowPools.add(pool);
    }

    private spawnShrine(x: number, y: number) {
        const shrine = new BuffShrine(this.scene, x, y);
        this.shrines.add(shrine);
    }

    private spawnWaterPool(x: number, y: number) {
        const pool = new WaterPool(this.scene, x, y);
        this.waterPools.add(pool);

        // Add collision with player and enemies
        const player = this.scene.getPlayer();
        if (player) {
            this.scene.physics.add.collider(player, pool);
        }
        this.scene.physics.add.collider(this.scene.getEnemies(), pool);
    }

    private spawnTreeCluster(x: number, y: number) {
        const tree = new TreeCluster(this.scene, x, y);
        this.trees.add(tree);

        // Add collision with player and enemies
        const player = this.scene.getPlayer();
        if (player) {
            this.scene.physics.add.collider(player, tree);
        }
        this.scene.physics.add.collider(this.scene.getEnemies(), tree);
    }

    public update(delta: number) {
        this.shrineTimer += delta;

        // Spawn new shrine every 36 seconds
        if (this.shrineTimer >= this.shrineCooldown) {
            this.shrineTimer = 0;
            const player = this.scene.getPlayer();
            if (player) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 400 + Math.random() * 800;
                this.spawnShrine(
                    player.getX() + Math.cos(angle) * dist,
                    player.getY() + Math.sin(angle) * dist
                );
            }
        }

        // Auto-spawn chests every ~35 seconds
        this.chestTimer += delta;
        if (this.chestTimer >= this.chestSpawnInterval) {
            this.chestTimer = 0;
            const activeChests = this.crates.getChildren().filter(c => c.active).length;
            if (activeChests < this.maxChests) {
                const player = this.scene.getPlayer();
                if (player) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 400 + Math.random() * 800;
                    this.spawnCrate(
                        player.getX() + Math.cos(angle) * dist,
                        player.getY() + Math.sin(angle) * dist
                    );
                }
            }
        }

        // Update slow pools
        this.slowPools.getChildren().forEach((pool: any) => {
            pool.update(delta);
        });

        // Update water pools
        this.waterPools.getChildren().forEach((pool: any) => {
            pool.update(delta);
        });
    }

    public getCrates(): Phaser.GameObjects.Group {
        return this.crates;
    }

    public getSlowPools(): Phaser.GameObjects.Group {
        return this.slowPools;
    }

    public getShrines(): Phaser.GameObjects.Group {
        return this.shrines;
    }

    public getWaterPools(): Phaser.GameObjects.Group {
        return this.waterPools;
    }

    public getTrees(): Phaser.GameObjects.Group {
        return this.trees;
    }

    public isInSlowPool(x: number, y: number): boolean {
        let inPool = false;
        this.slowPools.getChildren().forEach((pool: any) => {
            if (pool.active) {
                const dist = Phaser.Math.Distance.Between(x, y, pool.x, pool.y);
                if (dist <= pool.getRadius()) {
                    inPool = true;
                }
            }
        });
        return inPool;
    }
}
