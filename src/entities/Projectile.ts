import Phaser from 'phaser';

export class Projectile extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Rectangle;
    private velocityX: number = 0;
    private velocityY: number = 0;
    private damage: number = 10;
    private projectileSpeed: number = 500;
    private piercing: boolean = false;
    private homing: boolean = false;
    private lifetime: number = 3000; // 3 seconds
    private age: number = 0;
    private isCritical: boolean = false;
    
    // Track which enemies this projectile has already hit (for piercing)
    private hitEnemies: Set<any> = new Set();

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        damage: number,
        speed: number,
        angle: number,
        piercing: boolean = false,
        homing: boolean = false,
        isCritical: boolean = false
    ) {
        super(scene, x, y);
        
        this.damage = damage;
        this.projectileSpeed = speed;
        this.piercing = piercing;
        this.homing = homing;
        this.isCritical = isCritical;
        
        // Create projectile sprite
        this.sprite = scene.add.rectangle(0, 0, 8, 8, 0xffff00);
        this.add(this.sprite);
        
        // Set velocity based on angle
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
        
        // Add physics body
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(8, 8);
        body.setOffset(-4, -4);
        body.setVelocity(this.velocityX, this.velocityY);
        
        scene.add.existing(this);
        
        // Setup collision detection
        this.setupCollisions();
    }

    update(time: number, delta: number) {
        this.age += delta;
        
        // Destroy if too old
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }
        
        // Homing behavior
        if (this.homing) {
            this.updateHoming(delta);
        }
        
        // Update position
        this.x += this.velocityX * (delta / 1000);
        this.y += this.velocityY * (delta / 1000);
        
        // Destroy if out of map bounds
        const gameScene = this.scene as any;
        const mapBounds = gameScene.getMapSize() / 2;
        if (this.x < -mapBounds || this.x > mapBounds || this.y < -mapBounds || this.y > mapBounds) {
            this.destroy();
        }
    }

    private updateHoming(delta: number) {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        const enemies = gameScene.getEnemies().getChildren();
        
        if (enemies.length > 0) {
            // Find closest enemy
            let closestEnemy: any = null;
            let closestDistance = Infinity;
            
            enemies.forEach((enemy: any) => {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            });
            
            if (closestEnemy && closestDistance < 200) {
                // Move towards closest enemy
                const dx = closestEnemy.x - this.x;
                const dy = closestEnemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const homingSpeed = 200;
                    this.velocityX += (dx / distance) * homingSpeed * (delta / 1000);
                    this.velocityY += (dy / distance) * homingSpeed * (delta / 1000);
                    
                    // Limit speed
                    const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
                    if (currentSpeed > this.projectileSpeed) {
                        this.velocityX = (this.velocityX / currentSpeed) * this.projectileSpeed;
                        this.velocityY = (this.velocityY / currentSpeed) * this.projectileSpeed;
                    }
                }
            }
        }
    }

    private setupCollisions() {
        const scene = this.scene as Phaser.Scene;
        const gameScene = scene as any;
        
        // Check collision with enemies
        scene.physics.add.overlap(
            this,
            gameScene.getEnemies(),
            this.onEnemyHit,
            undefined,
            this
        );
    }

    private onEnemyHit(projectile: any, enemy: any) {
        // Check if this enemy has already been hit by this projectile
        if (this.hitEnemies.has(enemy)) {
            return; // Skip if already hit
        }
        
        // Mark this enemy as hit
        this.hitEnemies.add(enemy);
        
        // Deal damage to enemy
        enemy.takeDamage(this.damage, this.isCritical);
        
        // Add knockback effect using physics velocity instead of teleportation
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const knockbackForce = 50;
            const knockbackX = (dx / distance) * knockbackForce;
            const knockbackY = (dy / distance) * knockbackForce;
            
            // Use physics body for smooth knockback movement
            const body = enemy.body as Phaser.Physics.Arcade.Body;
            if (body) {
                body.setVelocity(knockbackX, knockbackY);
                
                // Reset velocity after a short time to prevent endless knockback
                enemy.scene.time.delayedCall(200, () => {
                    if (enemy.active && body) {
                        body.setVelocity(0, 0);
                    }
                });
            }
        }
        
        // Destroy projectile if not piercing
        if (!this.piercing) {
            this.destroy();
        }
    }

    public getDamage() {
        return this.damage;
    }

    public isPiercing() {
        return this.piercing;
    }
} 