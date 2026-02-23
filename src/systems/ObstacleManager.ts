import Phaser from 'phaser';
import { DestructibleCrate } from '../entities/obstacles/DestructibleCrate';
import { SlowPool } from '../entities/obstacles/SlowPool';
import { BuffShrine } from '../entities/obstacles/BuffShrine';
import { GameSceneInterface } from '../types/GameSceneInterface';

export class ObstacleManager {
    private scene: Phaser.Scene & GameSceneInterface;
    private crates: Phaser.GameObjects.Group;
    private slowPools: Phaser.GameObjects.Group;
    private shrines: Phaser.GameObjects.Group;
    private shrineTimer: number = 0;
    private shrineCooldown: number = 36000; // 36 seconds

    constructor(scene: Phaser.Scene & GameSceneInterface) {
        this.scene = scene;
        this.crates = scene.add.group();
        this.slowPools = scene.add.group();
        this.shrines = scene.add.group();

        this.spawnInitialObstacles();
    }

    private spawnInitialObstacles() {
        // Spawn 1 small chest cluster (2-3 chests)
        const cx = (Math.random() - 0.5) * 600;
        const cy = (Math.random() - 0.5) * 600;
        this.spawnCrateCluster(cx, cy);

        // Spawn 1 slow pool
        const px = (Math.random() - 0.5) * 800;
        const py = (Math.random() - 0.5) * 800;
        this.spawnSlowPool(px, py);

        // Spawn 1 shrine
        const sx = (Math.random() - 0.5) * 1600;
        const sy = (Math.random() - 0.5) * 1600;
        this.spawnShrine(sx, sy);
    }

    private spawnCrateCluster(cx: number, cy: number) {
        const count = 1 + Math.floor(Math.random() * 2); // 1-2 chests
        for (let i = 0; i < count; i++) {
            const x = cx + (Math.random() - 0.5) * 80;
            const y = cy + (Math.random() - 0.5) * 80;
            const crate = new DestructibleCrate(this.scene, x, y);
            this.crates.add(crate);
        }
    }

    private spawnSlowPool(x: number, y: number) {
        const pool = new SlowPool(this.scene, x, y);
        this.slowPools.add(pool);
    }

    private spawnShrine(x: number, y: number) {
        const shrine = new BuffShrine(this.scene, x, y);
        this.shrines.add(shrine);
    }

    public update(delta: number) {
        this.shrineTimer += delta;

        // Spawn new shrine every 3 minutes
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

        // Update slow pools
        this.slowPools.getChildren().forEach((pool: any) => {
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
