import Phaser from 'phaser';

export class QProjectile extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Rectangle;
    private velocityX: number = 0;
    private velocityY: number = 0;
    private damage: number = 10;
    private speed: number = 1200;
    private lifetime: number = 1000;
    private age: number = 0;
    private targetX: number = 0;
    private targetY: number = 0;
    private startX: number = 0;
    private startY: number = 0;
    private curveControlX: number = 0;
    private curveControlY: number = 0;
    private acceleration: number = 3600;
    private projectileIndex: number = 0;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        damage: number,
        speed: number,
        targetX: number,
        targetY: number,
        projectileIndex: number = 0
    ) {
        super(scene, x, y);
        
        this.damage = damage;
        this.speed = speed;
        this.targetX = targetX;
        this.targetY = targetY;
        this.startX = x;
        this.startY = y;
        this.projectileIndex = projectileIndex;
        
        // Calculate curve control point with unique path per projectile
        this.calculateCurveControlPoint();
        
        // Create projectile sprite (yellow for Q skill)
        this.sprite = scene.add.rectangle(0, 0, 6, 6, 0xffff00);
        this.add(this.sprite);
        
        // Start with slow initial velocity
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Add physics body
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(this.velocityX, this.velocityY);
        
        scene.add.existing(this);
        
        // Setup collision detection
        this.setupCollisions();
    }

    private calculateCurveControlPoint() {
        // Calculate midpoint between start and target
        const midX = (this.startX + this.targetX) / 2;
        const midY = (this.startY + this.targetY) / 2;
        
        // Calculate perpendicular direction
        const dx = this.targetX - this.startX;
        const dy = this.targetY - this.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Perpendicular vector
            const perpX = -dy / distance;
            const perpY = dx / distance;
            
            // Unique offset distance and side for each projectile
            const baseOffset = distance * 0.4;
            const offsetVariation = (this.projectileIndex % 4) * 0.1; // 0, 0.1, 0.2, 0.3
            const offsetDistance = baseOffset + (distance * offsetVariation);
            
            // Deterministic side based on projectile index
            const side = (this.projectileIndex % 2 === 0) ? 1 : -1;
            
            // Add slight angle variation for each projectile (dynamic based on total projectiles)
            const maxProjectiles = 15; // Assume max level 10, so 5+10=15
            const angleVariation = (this.projectileIndex / maxProjectiles) * 0.5 - 0.25; // -0.25 to 0.25
            const rotatedPerpX = perpX * Math.cos(angleVariation) - perpY * Math.sin(angleVariation);
            const rotatedPerpY = perpX * Math.sin(angleVariation) + perpY * Math.cos(angleVariation);
            
            this.curveControlX = midX + rotatedPerpX * offsetDistance * side;
            this.curveControlY = midY + rotatedPerpY * offsetDistance * side;
        } else {
            this.curveControlX = midX;
            this.curveControlY = midY;
        }
    }

    update(time: number, delta: number) {
        this.age += delta;
        
        // Destroy if too old
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }
        
        // Calculate progress along the curve (0 to 1)
        const progress = Math.min(this.age / this.lifetime, 1);
        
        // Quadratic Bezier curve calculation
        const t = progress;
        const oneMinusT = 1 - t;
        
        // Calculate target position on curve
        const targetCurveX = oneMinusT * oneMinusT * this.startX + 
                            2 * oneMinusT * t * this.curveControlX + 
                            t * t * this.targetX;
        const targetCurveY = oneMinusT * oneMinusT * this.startY + 
                            2 * oneMinusT * t * this.curveControlY + 
                            t * t * this.targetY;
        
        // Directly set position to curve point (no jitter)
        this.x = targetCurveX;
        this.y = targetCurveY;
        
        // Destroy if reached target or out of bounds
        const targetDistance = Math.sqrt((this.x - this.targetX) ** 2 + (this.y - this.targetY) ** 2);
        if (targetDistance < 10 || progress >= 1) {
            this.destroy();
            return;
        }
        
        // Destroy if out of map bounds
        const mapBounds = 2000;
        if (this.x < -mapBounds || this.x > mapBounds || this.y < -mapBounds || this.y > mapBounds) {
            this.destroy();
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
        // Deal damage to enemy
        enemy.takeDamage(this.damage);
        
        // Add knockback effect
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const knockbackForce = 3;
            const knockbackX = (dx / distance) * knockbackForce;
            const knockbackY = (dy / distance) * knockbackForce;
            
            enemy.x += knockbackX;
            enemy.y += knockbackY;
        }
        
        // Destroy projectile
        this.destroy();
    }

    public getDamage() {
        return this.damage;
    }
} 