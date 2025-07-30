import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { TankEnemy } from '../entities/TankEnemy';
import { RangedEnemy } from '../entities/RangedEnemy';
import { Projectile } from '../entities/Projectile';
import { UpgradeManager } from '../systems/UpgradeManager';
import { EnemySpawner } from '../systems/EnemySpawner';
import { SKILL_UNLOCK_LEVELS } from '../entities/Player';
import { Pet } from '../entities/Pet';
import { ItemManager } from '../systems/ItemManager';
import { Item, ItemData } from '../entities/Item';
import { SkillManager, SkillData } from '../systems/SkillManager';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private enemies!: Phaser.GameObjects.Group;
    private projectiles!: Phaser.GameObjects.Group;
    private enemyProjectiles!: Phaser.GameObjects.Group;
    private pets!: Phaser.GameObjects.Group;
    private items!: Phaser.GameObjects.Group;
    private upgradeManager!: UpgradeManager;
    private enemySpawner!: EnemySpawner;
    private itemManager!: ItemManager;
    private skillManager!: SkillManager;
    private tooltip!: Phaser.GameObjects.Container;
    
    // Game state
    private gameTime: number = 0;
    private playerLevel: number = 1;
    private playerXP: number = 0;
    private xpToNextLevel: number = 100;
    
    // UI elements
    private levelText!: Phaser.GameObjects.Text;
    private xpText!: Phaser.GameObjects.Text;
    private timeText!: Phaser.GameObjects.Text;
    private healthBar!: Phaser.GameObjects.Rectangle;
    private healthBarBg!: Phaser.GameObjects.Rectangle;
    private healthText!: Phaser.GameObjects.Text;
    private xpBar!: Phaser.GameObjects.Rectangle;
    private qSkillUI!: Phaser.GameObjects.Container;
    private eSkillUI!: Phaser.GameObjects.Container;
    private dashSkillUI!: Phaser.GameObjects.Container; // Dash skill UI
    private rSkillUI!: Phaser.GameObjects.Container;
    private fSkillUI!: Phaser.GameObjects.Container;
    private itemContainers: Phaser.GameObjects.Container[] = [];
    
    // Character stats UI
    private statsContainer!: Phaser.GameObjects.Container;
    private damageText!: Phaser.GameObjects.Text;
    private attackSpeedText!: Phaser.GameObjects.Text;
    private movementSpeedText!: Phaser.GameObjects.Text;
    private armorText!: Phaser.GameObjects.Text;
    private projectileCountText!: Phaser.GameObjects.Text;
    private critChanceText!: Phaser.GameObjects.Text;
    private critDamageText!: Phaser.GameObjects.Text;
    
    // Wave counter UI
    private waveText!: Phaser.GameObjects.Text;
    private pauseContainer!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        // Reset game state
        this.gameTime = 0;
        this.playerLevel = 1;
        this.playerXP = 0;
        this.xpToNextLevel = 100;
    }

    create() {
        const mapSize = this.scale.width * 3;
        this.physics.world.setBounds(-mapSize, -mapSize, mapSize * 2, mapSize * 2);
        // Enable physics debugging
        // this.physics.world.createDebugGraphic();

        // Create background pattern
        this.createBackground();
        
        // Initialize game systems
        this.upgradeManager = new UpgradeManager(this);
        this.enemySpawner = new EnemySpawner(this);
        this.itemManager = new ItemManager();
        this.skillManager = new SkillManager();
        
        // Create groups
        this.enemies = this.add.group();
        this.projectiles = this.add.group();
        this.enemyProjectiles = this.add.group();
        this.pets = this.add.group();
        this.items = this.add.group();
        
        // Add physics to enemy group
        this.physics.add.collider(this.enemies, this.enemies, this.handleEnemyCollision, undefined, this);
        
        // Create player at center of the world (0,0)
        this.player = new Player(this, 0, 0);
        this.add.existing(this.player);
        
        this.physics.add.overlap(this.player, this.items, this.handleItemPickup, undefined, this);

        // Setup camera
        this.setupCamera();
        
        // Setup UI
        this.setupUI();
        
        // Start enemy spawning
        this.enemySpawner.startSpawning();
        this.enemySpawner.preSpawnEnemies(5);
        
        // Create character stats UI
        this.createCharacterStatsUI();
        this.createPauseUI();
        
        // Initialize item UI
        this.updateItemUI();
        
        // Setup input
        this.setupInput();
        
        // Debug logging removed

        // Add a test item near the player for debugging (remove this later)
        const testItemData = this.itemManager.getItem('basic_sword');
        if (testItemData) {
            const testItem = new Item(this, 100, 100, testItemData);
            this.addItem(testItem);
        }

        // Timer for random item drops
        this.time.addEvent({
            delay: 60000, // 1 minute
            callback: this.spawnRandomItem,
            callbackScope: this,
            loop: true
        });

        window.addEventListener('keydown', this.handleKeyDown);
        this.events.on('shutdown', this.shutdown, this);
    }

    update(time: number, delta: number) {
        this.gameTime += delta;
        
        // Handle WASD movement
        this.handleMovement();
        
        // Update player
        this.player.update(time, delta);
        
        // Update enemies
        this.enemies.getChildren().forEach((enemy: any) => {
            enemy.update(time, delta);
        });
        
        // Update projectiles
        this.projectiles.getChildren().forEach((projectile: any) => {
            projectile.update(time, delta);
        });
        
        // Update enemy projectiles
        this.enemyProjectiles.getChildren().forEach((projectile: any) => {
            projectile.update(time, delta);
        });
        
        this.pets.getChildren().forEach((pet: any) => {
            pet.update(time, delta);
        });

        // Update UI
        this.updateUI();
        this.updateSkillUI();
        this.updateCamera();
        
        // Update character stats display
        this.updateCharacterStats();
        
        // Update wave display
        this.updateWaveDisplay();
        
        // Check for level up
        this.checkLevelUp();
    }

    private spawnRandomItem() {
        const itemData = this.itemManager.getRandomItem();
        if (itemData) {
            const player = this.getPlayer();
            const spawnX = player.x + Phaser.Math.Between(-100, 100);
            const spawnY = player.y + Phaser.Math.Between(-100, 100);
            const item = new Item(this, spawnX, spawnY, itemData);
            this.addItem(item);
        }
    }

    private handleItemPickup(player: any, item: any) {
        console.log('Item picked up:', item.getItemData().name); // Debug log
        player.addItem(item.getItemData());
        this.showItemCollectedPopup(item.getItemData());
        this.updateItemUI();
        item.destroy();
    }

    public showBossClearedMessage() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        const message = this.add.text(screenWidth / 2, screenHeight / 2, 'Boss Cleared! Take the item.', {
            fontSize: '48px',
            color: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);

        this.tweens.add({
            targets: message,
            alpha: 0,
            y: message.y - 100,
            duration: 5000,
            ease: 'Power2',
            onComplete: () => {
                message.destroy();
            }
        });
    }

    public showItemTooltip(x: number, y: number, itemData: ItemData) {
        const text = `${itemData.name}\n${itemData.description}`;
        this.showSmartTooltip(x, y, text, false);
    }

    public hideTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy();
        }
    }

    private showSmartTooltip(x: number, y: number, text: string, isUI: boolean) {
        this.hideTooltip();

        const tooltipText = this.add.text(0, 0, text, {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            wordWrap: { width: 300, useAdvancedWrap: true }
        });

        tooltipText.setOrigin(0, 1);

        if (isUI) {
            const tooltipWidth = tooltipText.width;
            const tooltipHeight = tooltipText.height;
            const screenWidth = this.scale.width;

            if (x + tooltipWidth > screenWidth) {
                tooltipText.setOrigin(1, 1);
            }
            if (y - tooltipHeight < 0) {
                tooltipText.setOrigin(tooltipText.originX, 0);
            }
        }
        
        this.tooltip = this.add.container(x, y, [tooltipText]);
        this.tooltip.setDepth(5000);

        if (isUI) {
            this.tooltip.setScrollFactor(0);
        }
    }

    private showSkillTooltip(skillId: string) {
        const skillData = this.skillManager.getSkillData(skillId);
        if (skillData) {
            let text = skillData.description;
            if (skillData.damageMultiplier) {
                text += `\nDamage: ${skillData.damageMultiplier * 100}%`;
            }
            this.showSmartTooltip(this.input.x, this.input.y, text, true);
        }
    }

    private handleMovement() {
        let velX = 0;
        let velY = 0;
        
        if (this.wKey?.isDown) velY -= 1;
        if (this.sKey?.isDown) velY += 1;
        if (this.aKey?.isDown) velX -= 1;
        if (this.dKey?.isDown) velX += 1;
        
        // Normalize diagonal movement
        if (velX !== 0 && velY !== 0) {
            velX *= 0.707; // 1/√2
            velY *= 0.707;
        }
        
        this.player.setVelocity(velX, velY);
    }

    private setupUI() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        
        // XP bar at bottom of screen
        const xpBarY = screenHeight - 20;
        const xpBarWidth = screenWidth - 40;
        
        // XP bar background
        this.add.rectangle(screenWidth / 2, xpBarY, xpBarWidth, 10, 0x333333).setScrollFactor(0).setDepth(1000);
        
        // XP bar (will be updated in updateUI) - start from left edge
        this.xpBar = this.add.rectangle(20, xpBarY, 0, 10, 0x00ff00).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
        
        // XP text (on the bar, better visibility with stroke)
        this.xpText = this.add.text(screenWidth / 2, xpBarY, 'XP: 0/100', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);
        
        this.timeText = this.add.text(20, 80, 'Time: 0:00', {
            fontSize: '22px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ffff'
        }).setScrollFactor(0).setDepth(1000);
        
        // Health bar (center bottom like LoL)
        const centerX = screenWidth / 2;
        const bottomY = screenHeight - 60;
        
        this.healthBarBg = this.add.rectangle(centerX, bottomY, 300, 30, 0x333333).setScrollFactor(0).setDepth(1000);
        this.healthBar = this.add.rectangle(centerX, bottomY, 300, 30, 0x00ff00).setScrollFactor(0).setDepth(1001);
        this.healthText = this.add.text(centerX, bottomY, '100/100', {
            fontSize: '22px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);
        
        // Level text (left of health bar, moved more to the left)
        this.levelText = this.add.text(centerX - 220, bottomY, 'Level: 1', {
            fontSize: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        
        // Add wave counter on the right side (dynamic)
        this.waveText = this.add.text(screenWidth - 200, 20, 'Wave: 1 (0/10)', {
            fontSize: '22px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffaa00'
        }).setScrollFactor(0).setDepth(1000);
        
        // Create skill UI
        this.createSkillUI();
        
        // Create character stats UI
        this.createPauseUI();
    }

    private updateUI() {
        this.levelText.setText(`Level: ${this.playerLevel}`);
        
        // Update XP bar
        const xpPercent = this.playerXP / this.xpToNextLevel;
        const maxXpBarWidth = this.scale.width - 40;
        this.xpBar.width = maxXpBarWidth * xpPercent;
        this.xpText.setText(`XP: ${this.playerXP}/${this.xpToNextLevel}`);
        
        const minutes = Math.floor(this.gameTime / 60000);
        const seconds = Math.floor((this.gameTime % 60000) / 1000);
        this.timeText.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        
        // Update health bar
        const player = this.getPlayer();
        if (player && player.isAlive()) {
            const healthPercent = player.getHealth() / player.getMaxHealth();
            this.healthBar.width = 300 * healthPercent;
            this.healthText.setText(`${player.getHealth()}/${player.getMaxHealth()}`);
            
            // Change color based on health
            if (healthPercent > 0.6) {
                this.healthBar.setFillStyle(0x00ff00);
            } else if (healthPercent > 0.3) {
                this.healthBar.setFillStyle(0xffff00);
            } else {
                this.healthBar.setFillStyle(0xff0000);
            }
        }
    }

    private updateItemUI() {
        // Remove existing item containers
        this.itemContainers.forEach(container => {
            container.destroy();
        });
        this.itemContainers = [];
        
        const items = this.player.getItems();
        const screenHeight = this.scale.height;
        const itemY = screenHeight - 100; // Same Y as skills
        const itemStartX = 40; // Bottom left starting position
        
        items.forEach((item, index) => {
            const rarityColors = {
                common: 0xffffff,
                rare: 0x0000ff,
                epic: 0x800080,
                legendary: 0xffa500
            };
            const color = rarityColors[item.rarity] || 0xffffff;

            // Create item container directly on scene (EXACTLY like skill UI)
            const itemContainer = this.add.container(itemStartX + (index * 50), itemY).setScrollFactor(0).setDepth(1500);
            console.log(`Creating item container ${index} at position:`, itemStartX + (index * 50), itemY);
            
            // Create the item background rectangle - make it more visible for debugging
            const itemBg = this.add.rectangle(0, 0, 40, 40, 0xff0000); // Red background for debugging
            itemBg.setStrokeStyle(2, color);
            
            // Add the background to the container
            itemContainer.add(itemBg);
            
            // Try simplified interactive setup
            itemContainer.setSize(40, 40);
            itemContainer.setInteractive();
            
            // Add hover effects and tooltip (EXACTLY like skill UI)
            itemContainer.on('pointerover', () => {
                console.log('Item hover detected:', item.name); // Debug log
                itemBg.setFillStyle(0x333333, 0.8); // Darker on hover
                const text = `${item.name}\n${item.description}\n\nRight-click to unequip`;
                this.showSmartTooltip(this.input.x, this.input.y, text, true);
            });
            
            itemContainer.on('pointerout', () => {
                console.log('Item hover out detected:', item.name); // Debug log
                itemBg.setFillStyle(0xff0000); // Back to red
                this.hideTooltip();
            });

            itemContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.rightButtonDown()) {
                    this.player.removeItem(item);
                    this.updateItemUI();
                }
            });

            this.itemContainers.push(itemContainer);
        });
    }

    private showItemCollectedPopup(itemData: ItemData) {
        console.log('Showing item popup for:', itemData.name); // Debug log
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Create popup container
        const popup = this.add.container(screenWidth / 2, screenHeight * 0.4);
        
        // Create background with border
        const background = this.add.rectangle(0, 0, 350, 120, 0x000000, 0.9);
        const border = this.add.rectangle(0, 0, 350, 120, 0x00ff88, 0);
        border.setStrokeStyle(3, 0x00ff88);
        
        // Create title text
        const titleText = this.add.text(0, -30, 'ITEM OBTAINED!', {
            fontSize: '20px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Create item name text
        const itemText = this.add.text(0, 10, itemData.name, {
            fontSize: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add all elements to popup
        popup.add([background, border, titleText, itemText]);
        popup.setScrollFactor(0).setDepth(7000); // Higher depth to ensure visibility

        // Start with full opacity
        popup.setAlpha(1);

        // Make popup more visible with a flash effect
        this.tweens.add({
            targets: popup,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 150,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Return to normal size
                this.tweens.add({
                    targets: popup,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 150,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        // Keep visible for longer, then fade out
                        this.tweens.add({
                            targets: popup,
                            alpha: 0,
                            y: popup.y - 50,
                            duration: 2000,
                            delay: 2000, // Wait 2 seconds before fading
                            ease: 'Power2',
                            onComplete: () => {
                                console.log('Popup destroyed for:', itemData.name); // Debug log
                                popup.destroy();
                            }
                        });
                    }
                });
            }
        });
    }

    // Input keys
    private wKey!: Phaser.Input.Keyboard.Key;
    private sKey!: Phaser.Input.Keyboard.Key;
    private aKey!: Phaser.Input.Keyboard.Key;
    private dKey!: Phaser.Input.Keyboard.Key;
    private qKey!: Phaser.Input.Keyboard.Key;
    private eKey!: Phaser.Input.Keyboard.Key;
    private rKey!: Phaser.Input.Keyboard.Key;
    private fKey!: Phaser.Input.Keyboard.Key;
    private shiftKey!: Phaser.Input.Keyboard.Key; // Left Shift for dash
    private escKey!: Phaser.Input.Keyboard.Key; // ESC for pause

    private setupInput() {
        if (!this.input.keyboard) {
            return;
        }
        // Create cursor keys for WASD
        this.wKey = this.input.keyboard.addKey('W');
        this.aKey = this.input.keyboard.addKey('A');
        this.sKey = this.input.keyboard.addKey('S');
        this.dKey = this.input.keyboard.addKey('D');
        
        // Right-click shooting
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                this.player.attack();
            }
        });
        
        // Q, E, Shift, and Space keys
        this.qKey = this.input.keyboard.addKey('Q');
        this.eKey = this.input.keyboard.addKey('E');
        this.rKey = this.input.keyboard.addKey('R');
        this.fKey = this.input.keyboard.addKey('F');
        this.shiftKey = this.input.keyboard.addKey('SHIFT');
        this.escKey = this.input.keyboard.addKey('ESC');
        
        this.qKey.on('down', () => {
            this.player.useQSkill();
        });
        
        this.eKey.on('down', () => {
            this.player.useESkill();
        });
        
        this.rKey.on('down', () => {
            this.player.useRSkill();
        });

        this.fKey.on('down', () => {
            this.player.useFSkill();
        });

        this.shiftKey.on('down', () => {
            this.player.useDashSkill();
        });

        this.escKey.on('down', () => {
            this.togglePause();
        });
    }

    public addXP(amount: number) {
        this.playerXP += amount * this.player.getXPMultiplier();
        
        if (this.playerXP >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    private shutdown() {
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Escape') {
            this.togglePause();
        }
    };

    private levelUp() {
        this.playerLevel++;
        this.playerXP -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.2); // Increase XP requirement
        
        // --- Level Up Bonuses ---
        // 1. Fixed armor gain
        this.player.increaseArmor(5); 

        // 2. Heal 20% of max health
        this.player.heal(this.player.getMaxHealth() * 0.2); 

        // 3. Increase attack damage by 1.2x
        this.player.increaseAttackDamage(1.2);

        // Unlock skills
        this.player.unlockSkills(this.playerLevel);
        
        // Trigger level up UI
        this.scene.launch('UIScene', { 
            level: this.playerLevel,
            upgradeManager: this.upgradeManager,
            isGameOver: false
        });
        
        // Pause the game
        this.scene.pause();
    }

    public showSkillUnlockMessage(message: string) {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        const skillUnlockText = this.add.text(screenWidth / 2, screenHeight / 2 - 100, message, {
            fontSize: '32px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);

        this.tweens.add({
            targets: skillUnlockText,
            alpha: 0,
            y: skillUnlockText.y - 50,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => {
                skillUnlockText.destroy();
            }
        });
    }

    private checkLevelUp() {
        if (this.playerXP >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    public getPlayer() {
        return this.player;
    }

    public getEnemies() {
        return this.enemies;
    }

    public getProjectiles() {
        return this.projectiles;
    }

    public getEnemyProjectiles() {
        return this.enemyProjectiles;
    }

    public getItemManager(): ItemManager {
        return this.itemManager;
    }

    public addItem(item: Item) {
        this.items.add(item);
    }

    public getGameTime() {
        return this.gameTime;
    }

    public getPlayerLevel() {
        return this.playerLevel;
    }
    
    public getEnemySpawner() {
        return this.enemySpawner;
    }
    
    public updateWaveCounter(waveNumber: number) {
        if (!this.waveText || !this.enemySpawner) return;
        
        const enemiesKilled = this.enemySpawner.getEnemiesKilledThisWave();
        const enemiesToKill = this.enemySpawner.getEnemiesToKillPerWave();
        
        this.waveText.setText(`Wave: ${waveNumber} (${enemiesKilled}/${enemiesToKill})`);
    }
    
    private updateWaveDisplay() {
        if (!this.waveText || !this.enemySpawner) return;
        
        const currentWave = this.enemySpawner.getWaveNumber();
        const enemiesKilled = this.enemySpawner.getEnemiesKilledThisWave();
        const enemiesToKill = this.enemySpawner.getEnemiesToKillPerWave();
        
        this.waveText.setText(`Wave: ${currentWave} (${enemiesKilled}/${enemiesToKill})`);
    }

    private createBackground() {
        const gridSize = 100;
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Ensure the texture doesn't already exist
        if (this.textures.exists('grid')) {
            this.textures.remove('grid');
        }

        // Create an in-memory texture for the grid pattern
        const gridTexture = this.textures.createCanvas('grid', gridSize, gridSize);
        if (!gridTexture) return;
        const context = gridTexture.getContext();

        // Draw the grid lines onto the texture
        context.strokeStyle = '#666666';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, gridSize);
        context.lineTo(gridSize, gridSize);
        context.moveTo(gridSize, 0);
        context.lineTo(gridSize, gridSize);
        context.stroke();
        gridTexture.refresh();

        // Create a tiling sprite using the new texture
        const background = this.add.tileSprite(0, 0, screenWidth, screenHeight, 'grid');
        background.setOrigin(0, 0);
        background.setScrollFactor(0); // The tileSprite will be moved manually
        background.setDepth(-1000);

        // We'll update the tilePosition in the update loop to match the camera
        this.events.on('update', () => {
            background.setTilePosition(this.cameras.main.scrollX, this.cameras.main.scrollY);
        });
    }

    private setupCamera() {
        // Set camera bounds centered around world origin
        const mapSize = this.scale.width * 3;
        this.cameras.main.setBounds(-mapSize, -mapSize, mapSize * 2, mapSize * 2);
        
        // Start camera at player position
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    private updateCamera() {
        const player = this.getPlayer();
        if (!player) return;
        
        // Get mouse position in world coordinates
        const camera = this.cameras.main;
        const mouseX = this.input.mousePointer.x + camera.scrollX;
        const mouseY = this.input.mousePointer.y + camera.scrollY;
        
        // Calculate point between mouse and player (9:1 ratio, closer to player)
        const targetX = player.getX() * 0.9 + mouseX * 0.1;
        const targetY = player.getY() * 0.9 + mouseY * 0.1;
        
        // Smoothly move camera to target position
        this.cameras.main.pan(targetX, targetY, 100);
    }

    public getMapSize() {
        return this.scale.width * 6;
    }

    private handleEnemyCollision(enemy1: any, enemy2: any) {
        // Push enemies apart when they collide
        const dx = enemy1.x - enemy2.x;
        const dy = enemy1.y - enemy2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const pushForce = 100;
            const pushX = (dx / distance) * pushForce;
            const pushY = (dy / distance) * pushForce;
            
            const body1 = enemy1.body as Phaser.Physics.Arcade.Body;
            const body2 = enemy2.body as Phaser.Physics.Arcade.Body;
            
            if (body1) body1.setVelocity(pushX, pushY);
            if (body2) body2.setVelocity(-pushX, -pushY);
        }
    }

    private createSkillUI() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        
        const skillY = screenHeight - 100;
        const skillSpacing = 70;
        let startX = screenWidth - (skillSpacing * 5);

        // Item containers will be created dynamically in updateItemUI()

        // Dash Skill UI (Shift)
        this.dashSkillUI = this.add.container(startX, skillY).setScrollFactor(0).setDepth(1000)
            .setInteractive(new Phaser.Geom.Rectangle(-25, -25, 50, 50), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => this.showSkillTooltip('DASH'))
            .on('pointerout', () => this.hideTooltip());
        const dashBg = this.add.rectangle(0, 0, 50, 50, 0x333333);
        const dashText = this.add.text(0, 0, '⚡', { 
            fontSize: '20px', 
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff' 
        }).setOrigin(0.5);
        const dashCooldownOverlay = this.add.rectangle(0, 0, 50, 50, 0x666666, 0.8);
        const dashCooldownText = this.add.text(0, 20, '', { 
            fontSize: '14px', 
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff' 
        }).setOrigin(0.5);
        this.dashSkillUI.add([dashBg, dashText, dashCooldownOverlay, dashCooldownText]);
        startX += skillSpacing;

        // Q Skill UI
        this.qSkillUI = this.add.container(startX, skillY).setScrollFactor(0).setDepth(1000)
            .setInteractive(new Phaser.Geom.Rectangle(-25, -25, 50, 50), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => this.showSkillTooltip('Q'))
            .on('pointerout', () => this.hideTooltip());
        const qBg = this.add.rectangle(0, 0, 50, 50, 0x333333);
        const qText = this.add.text(0, 0, 'Q', { 
            fontSize: '24px', 
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff' 
        }).setOrigin(0.5);
        const qCooldownOverlay = this.add.rectangle(0, 0, 50, 50, 0x666666, 0.8);
        const qCooldownText = this.add.text(0, 20, '', { 
            fontSize: '14px', 
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff' 
        }).setOrigin(0.5);
        this.qSkillUI.add([qBg, qText, qCooldownOverlay, qCooldownText]);
        startX += skillSpacing;
        
        // E Skill UI
        this.eSkillUI = this.add.container(startX, skillY).setScrollFactor(0).setDepth(1000)
            .setInteractive(new Phaser.Geom.Rectangle(-25, -25, 50, 50), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => this.showSkillTooltip('E'))
            .on('pointerout', () => this.hideTooltip());
        const eBg = this.add.rectangle(0, 0, 50, 50, 0x333333);
        const eText = this.add.text(0, 0, 'E', { 
            fontSize: '24px', 
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff' 
        }).setOrigin(0.5);
        const eCooldownOverlay = this.add.rectangle(0, 0, 50, 50, 0x666666, 0.8);
        const eCooldownText = this.add.text(0, 20, '', { 
            fontSize: '14px', 
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff' 
        }).setOrigin(0.5);
        this.eSkillUI.add([eBg, eText, eCooldownOverlay, eCooldownText]);
        startX += skillSpacing;
        
        // R Skill UI
        this.rSkillUI = this.add.container(startX, skillY).setScrollFactor(0).setDepth(1000)
            .setInteractive(new Phaser.Geom.Rectangle(-25, -25, 50, 50), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => this.showSkillTooltip('R'))
            .on('pointerout', () => this.hideTooltip());
        const rBg = this.add.rectangle(0, 0, 50, 50, 0x333333);
        const rText = this.add.text(0, 0, 'R', { 
            fontSize: '24px', 
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff' 
        }).setOrigin(0.5);
        const rCooldownOverlay = this.add.rectangle(0, 0, 50, 50, 0x666666, 0.8);
        const rCooldownText = this.add.text(0, 20, '', { 
            fontSize: '14px', 
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff' 
        }).setOrigin(0.5);
        this.rSkillUI.add([rBg, rText, rCooldownOverlay, rCooldownText]);
        startX += skillSpacing;

        // F Skill UI (Placeholder)
        this.fSkillUI = this.add.container(startX, skillY).setScrollFactor(0).setDepth(1000)
            .setInteractive(new Phaser.Geom.Rectangle(-25, -25, 50, 50), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => this.showSkillTooltip('F'))
            .on('pointerout', () => this.hideTooltip());
        const fBg = this.add.rectangle(0, 0, 50, 50, 0x333333);
        const fText = this.add.text(0, 0, 'F', { 
            fontSize: '24px', 
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff' 
        }).setOrigin(0.5);
        const fCooldownOverlay = this.add.rectangle(0, 0, 50, 50, 0x666666, 0.8);
        const fCooldownText = this.add.text(0, 20, '', {
            fontSize: '14px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.fSkillUI.add([fBg, fText, fCooldownOverlay, fCooldownText]);
    }

    private createCharacterStatsUI() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        
        // Position stats UI below and to the left of the level text
        const levelTextX = screenWidth / 2 - 220;
        const levelTextY = screenHeight - 60;
        const statsX = levelTextX - 420; 
        const statsY = levelTextY - 170; 
        /* (0, 0) is the top left corner of the screen */

        // Create stats container positioned relative to level text
        this.statsContainer = this.add.container(statsX, statsY).setScrollFactor(0).setDepth(1000);
        
        // Background panel (made taller for all stats including projectiles)
        const statsBg = this.add.rectangle(0, 0, 220, 230, 0x000000, 0.7);
        statsBg.setStrokeStyle(2, 0x333333);
        statsBg.setOrigin(0, 0);
        // Remove problematic setInteractive call
        // statsBg.setInteractive(false);
        
        // Title
        const statsTitle = this.add.text(10, 10, 'CHARACTER STATS', {
            fontSize: '18px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold'
        });
        
        // Damage stat
        this.damageText = this.add.text(10, 40, 'Damage: 10', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        });
        
        // Attack speed stat (bullets per second)
        this.attackSpeedText = this.add.text(10, 65, 'Attack Speed: 1.0/s', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        });
        
        // Movement speed stat
        this.movementSpeedText = this.add.text(10, 90, 'Move Speed: 200', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        });
        
        // Armor stat
        this.armorText = this.add.text(10, 115, 'Armor: 10 (63.2%)', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        });
        
        // Projectile count stat
        this.projectileCountText = this.add.text(10, 140, 'Projectiles: 1', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        });
        
        // Critical strike chance
        this.critChanceText = this.add.text(10, 165, 'Crit Chance: 0%', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        });

        // Critical strike damage
        this.critDamageText = this.add.text(10, 190, 'Crit Damage: 120%', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        });

        // Add all elements to container
        this.statsContainer.add([statsBg, statsTitle, this.damageText, this.attackSpeedText, this.movementSpeedText, this.armorText, this.projectileCountText, this.critChanceText, this.critDamageText]);
    }

    private updateCharacterStats() {
        if (!this.player || !this.damageText || !this.attackSpeedText || !this.movementSpeedText || !this.armorText || !this.projectileCountText) return;
        
        // Get player stats
        const damage = Math.round(this.player.getAttackDamage());
        const attackSpeed = (1000 / this.player.getAttackCooldown()).toFixed(1); // Convert cooldown to attacks per second
        const moveSpeed = this.player.getMoveSpeed();
        const armor = this.player.getArmor();
        const damageReduction = this.player.getDamageReduction().toFixed(1);
        const projectileCount = this.player.getProjectileCount();
        const critChance = (this.player.getCriticalStrikeChance() * 100).toFixed(0);
        const critDamage = (this.player.getCriticalStrikeDamage() * 100).toFixed(0);
        
        // Update text displays
        this.damageText.setText(`Damage: ${damage}`);
        this.attackSpeedText.setText(`Attack Speed: ${attackSpeed}/s`);
        this.movementSpeedText.setText(`Move Speed: ${moveSpeed}`);
        this.armorText.setText(`Armor: ${armor} (${damageReduction}%)`);
        this.projectileCountText.setText(`Projectiles: ${projectileCount}`);
        this.critChanceText.setText(`Crit Chance: ${critChance}%`);
        this.critDamageText.setText(`Crit Damage: ${critDamage}%`);
    }

    public addPet(pet: Pet) {
        this.pets.add(pet);
    }

    private updateSkillUI() {
        const player = this.getPlayer();
        if (!player) return;
        
        // Update Q skill UI
        const qCooldownOverlay = this.qSkillUI.list[2] as Phaser.GameObjects.Rectangle;
        const qCooldownText = this.qSkillUI.list[3] as Phaser.GameObjects.Text;
        
        if (!player.isQSkillUnlocked()) {
            // Disabled state
            qCooldownOverlay.setAlpha(0.8);
            qCooldownText.setText(`Lv${SKILL_UNLOCK_LEVELS.Q}`);
        } else if (player.getQCooldownTimer() > 0) {
            // On cooldown
            const cooldownPercent = player.getQCooldownTimer() / player.getQCooldown();
            qCooldownOverlay.setAlpha(0.8 * cooldownPercent);
            qCooldownText.setText(Math.ceil(player.getQCooldownTimer() / 1000).toString());
        } else {
            // Ready
            qCooldownOverlay.setAlpha(0);
            qCooldownText.setText('');
        }
        
        // Update E skill UI
        const eCooldownOverlay = this.eSkillUI.list[2] as Phaser.GameObjects.Rectangle;
        const eCooldownText = this.eSkillUI.list[3] as Phaser.GameObjects.Text;
        
        if (!player.isESkillUnlocked()) {
            // Disabled state
            eCooldownOverlay.setAlpha(0.8);
            eCooldownText.setText(`Lv${SKILL_UNLOCK_LEVELS.E}`);
        } else if (player.getECooldownTimer() > 0) {
            // On cooldown
            const cooldownPercent = player.getECooldownTimer() / player.getECooldown();
            eCooldownOverlay.setAlpha(0.8 * cooldownPercent);
            eCooldownText.setText(Math.ceil(player.getECooldownTimer() / 1000).toString());
        } else {
            // Ready
            eCooldownOverlay.setAlpha(0);
            eCooldownText.setText('');
        }
        
        // Update Dash skill UI
        const dashCooldownOverlay = this.dashSkillUI.list[2] as Phaser.GameObjects.Rectangle;
        const dashCooldownText = this.dashSkillUI.list[3] as Phaser.GameObjects.Text;
        
        if (!player.isDashSkillUnlocked()) {
            // Disabled state
            dashCooldownOverlay.setAlpha(0.8);
            dashCooldownText.setText(`Lv${SKILL_UNLOCK_LEVELS.DASH}`);
        } else if (player.getDashCooldownTimer() > 0) {
            // On cooldown
            const cooldownPercent = player.getDashCooldownTimer() / player.getDashCooldown();
            dashCooldownOverlay.setAlpha(0.8 * cooldownPercent);
            dashCooldownText.setText(Math.ceil(player.getDashCooldownTimer() / 1000).toString());
        } else {
            // Ready
            dashCooldownOverlay.setAlpha(0);
            dashCooldownText.setText('');
        }

        // Update R skill UI
        const rCooldownOverlay = this.rSkillUI.list[2] as Phaser.GameObjects.Rectangle;
        const rCooldownText = this.rSkillUI.list[3] as Phaser.GameObjects.Text;

        if (!player.isRSkillUnlocked()) {
            // Disabled state
            rCooldownOverlay.setAlpha(0.8);
            rCooldownText.setText(`Lv${SKILL_UNLOCK_LEVELS.R}`);
        } else if (player.getRCooldownTimer() > 0) {
            // On cooldown
            const cooldownPercent = player.getRCooldownTimer() / player.getRCooldown();
            rCooldownOverlay.setAlpha(0.8 * cooldownPercent);
            rCooldownText.setText(Math.ceil(player.getRCooldownTimer() / 1000).toString());
        } else {
            // Ready
            rCooldownOverlay.setAlpha(0);
            rCooldownText.setText('');
        }

        // Update F skill UI
        const fCooldownOverlay = this.fSkillUI.list[2] as Phaser.GameObjects.Rectangle;
        const fCooldownText = this.fSkillUI.list[3] as Phaser.GameObjects.Text;

        if (!player.isFSkillUnlocked()) {
            fCooldownOverlay.setAlpha(0.8);
            fCooldownText.setText(`Lv${SKILL_UNLOCK_LEVELS.F}`);
        } else if (player.getFCooldownTimer() > 0) {
            const cooldownPercent = player.getFCooldownTimer() / player.getFCooldown();
            fCooldownOverlay.setAlpha(0.8 * cooldownPercent);
            fCooldownText.setText(Math.ceil(player.getFCooldownTimer() / 1000).toString());
        } else {
            fCooldownOverlay.setAlpha(0);
            fCooldownText.setText('');
        }
    }

    public gameOver() {
        // Stop the game
        this.scene.pause();
        
        // Show game over screen in UI
        this.scene.launch('UIScene', {
            level: this.playerLevel,
            upgradeManager: this.upgradeManager,
            isGameOver: true
        });
    }
    
    private createPauseUI() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.5).setOrigin(0);

        const pauseText = this.add.text(screenWidth / 2, screenHeight * 0.4, 'Game Paused', {
            fontSize: '48px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
        }).setOrigin(0.5);

        const resumeText = this.add.text(screenWidth / 2, screenHeight * 0.6, 'Press ESC to resume', {
            fontSize: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
        }).setOrigin(0.5);

        this.pauseContainer = this.add.container(0, 0, [overlay, pauseText, resumeText]);
        this.pauseContainer.setScrollFactor(0).setDepth(4000).setVisible(false);
    }
    
    private togglePause() {
        const uiScene = this.scene.get('UIScene') as any;

        if (this.scene.isPaused()) {
            this.scene.resume();
            this.pauseContainer.setVisible(false);
            if (uiScene && uiScene.scene.isActive()) {
                uiScene.scene.setVisible(true);
            }
        } else {
            this.scene.pause();
            this.pauseContainer.setVisible(true);
            if (uiScene && uiScene.scene.isActive()) {
                uiScene.scene.setVisible(false);
            }
        }
    }
} 