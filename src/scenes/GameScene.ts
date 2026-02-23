import Phaser from 'phaser';
import { BasePlayer } from '../entities/BasePlayer';
import { RangedPlayer } from '../entities/RangedPlayer';
import { MeleePlayer } from '../entities/MeleePlayer';
import { MagePlayer } from '../entities/MagePlayer';
import { UpgradeManager } from '../systems/UpgradeManager';
import { EnemySpawner } from '../systems/EnemySpawner';
import { SKILL_UNLOCK_LEVELS } from '../entities/BasePlayer';
import { Pet } from '../entities/Pet';
import { ItemManager } from '../systems/ItemManager';
import { Item, ItemData, StatModifier } from '../entities/Item';
import { BaseEnemy } from '../entities/BaseEnemy';
import { SkillManager } from '../systems/SkillManager';
import { EffectsManager } from '../systems/EffectsManager';
import { ObstacleManager } from '../systems/ObstacleManager';
import { SynergyManager } from '../systems/SynergyManager';
import { GameSceneInterface } from '../types/GameSceneInterface';
import { MAP_SIZE } from '../GameConstants';
import { t } from '../i18n/i18n';
import { SoundManager } from '../systems/SoundManager';

export class GameScene extends Phaser.Scene implements GameSceneInterface {
    private player!: BasePlayer;
    private enemies!: Phaser.GameObjects.Group;
    private projectiles!: Phaser.GameObjects.Group;
    private enemyProjectiles!: Phaser.GameObjects.Group;
    private pets!: Phaser.GameObjects.Group;
    private items!: Phaser.GameObjects.Group;
    private upgradeManager!: UpgradeManager;
    private enemySpawner!: EnemySpawner;
    private itemManager!: ItemManager;
    private skillManager!: SkillManager;
    private effectsManager!: EffectsManager;
    private obstacleManager!: ObstacleManager;
    private synergyManager!: SynergyManager;
    private tooltip!: Phaser.GameObjects.Container;
    private character: string = 'ranged';

    // Game state
    private gameTime: number = 0;
    private playerLevel: number = 1;
    private playerXP: number = 0;
    private xpToNextLevel: number = 200;
    private bossesDefeated: number = 0;

    // Stats tracking
    private totalDamageDealt: number = 0;
    private totalKills: number = 0;
    private highestWave: number = 1;
    private itemsCollected: number = 0;
    
    // UI elements
    private levelText!: Phaser.GameObjects.Text;
    private xpText!: Phaser.GameObjects.Text;
    private timeText!: Phaser.GameObjects.Text;
    private healthBar!: Phaser.GameObjects.Rectangle;
    private healthText!: Phaser.GameObjects.Text;
    private xpBar!: Phaser.GameObjects.Rectangle;
    private qSkillUI!: Phaser.GameObjects.Container;
    private autocastIndicator!: Phaser.GameObjects.Text;
    private eSkillUI!: Phaser.GameObjects.Container;
    private dashSkillUI!: Phaser.GameObjects.Container; // Dash skill UI
    private rSkillUI!: Phaser.GameObjects.Container;
    private fSkillUI!: Phaser.GameObjects.Container;
    private itemContainers: Phaser.GameObjects.Container[] = [];
    private manaBar!: Phaser.GameObjects.Rectangle;
    private manaBarBg!: Phaser.GameObjects.Rectangle;
    private manaText!: Phaser.GameObjects.Text;
    
    // Character stats UI
    private statsContainer!: Phaser.GameObjects.Container;
    private damageText!: Phaser.GameObjects.Text;
    private attackSpeedText!: Phaser.GameObjects.Text;
    private movementSpeedText!: Phaser.GameObjects.Text;
    private armorText!: Phaser.GameObjects.Text;
    private projectileCountText!: Phaser.GameObjects.Text;
    private critChanceText!: Phaser.GameObjects.Text;
    private critDamageText!: Phaser.GameObjects.Text;
    private qSkillRangeText!: Phaser.GameObjects.Text;
    private qSkillRepeatText!: Phaser.GameObjects.Text;
    private meleeAttackRangeText!: Phaser.GameObjects.Text;
    
    // Wave counter UI
    private waveText!: Phaser.GameObjects.Text;
    private streakText!: Phaser.GameObjects.Text;
    private pauseContainer!: Phaser.GameObjects.Container;
    private bossIndicator!: Phaser.GameObjects.Image;
    private bossIndicatorText!: Phaser.GameObjects.Text;

    // Minimap
    private minimapGraphics!: Phaser.GameObjects.Graphics;
    private readonly MINIMAP_SIZE = 280;
    private readonly MINIMAP_RANGE = 1500; // World units shown on minimap

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data: { character: string }) {
        // Reset game state
        this.gameTime = 0;
        this.playerLevel = 1;
        this.playerXP = 0;
        this.xpToNextLevel = 100;
        this.bossesDefeated = 0;
        this.totalDamageDealt = 0;
        this.totalKills = 0;
        this.highestWave = 1;
        this.itemsCollected = 0;

        // Set character type
        this.character = data.character || 'ranged';
    }

    create() {
        const halfMap = MAP_SIZE / 2;
        this.physics.world.setBounds(-halfMap, -halfMap, MAP_SIZE, MAP_SIZE);
        // Enable physics debugging
        // this.physics.world.createDebugGraphic();

        // Create background pattern
        this.createBackground();
        
        // Initialize game systems
        this.upgradeManager = new UpgradeManager(this);
        this.enemySpawner = new EnemySpawner(this);
        this.itemManager = new ItemManager();
        this.skillManager = new SkillManager();
        this.effectsManager = new EffectsManager(this);
        this.synergyManager = new SynergyManager(this);
        
        // Create groups
        this.enemies = this.add.group();
        this.projectiles = this.add.group();
        this.enemyProjectiles = this.add.group();
        this.pets = this.add.group();
        this.items = this.add.group();
        
        // Add physics to enemy group
        this.physics.add.collider(this.enemies, this.enemies, this.handleEnemyCollision, undefined, this);
        
        // Create player at center of the world (0,0)
        if (this.character === 'melee') {
            this.player = new MeleePlayer(this, 0, 0);
        } else if (this.character === 'mage') {
            this.player = new MagePlayer(this, 0, 0);
        } else {
            this.player = new RangedPlayer(this, 0, 0);
        }
        this.add.existing(this.player);
        this.player.recalculateStats(); // Ensure stats are correctly applied before UI setup
        
        this.physics.add.overlap(this.player, this.items, this.handleItemPickup, undefined, this);

        // Projectiles pass through loot items (no interaction)

        // Initialize obstacle manager (after player creation)
        this.obstacleManager = new ObstacleManager(this as unknown as Phaser.Scene & GameSceneInterface);

        // Setup camera
        this.setupCamera();
        
        // Setup UI
        this.setupUI();
        this.updateUI();
        
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
        this.createBossIndicator();
        
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
        this.updateBossIndicator();

        // Update new systems
        this.effectsManager.update(delta);
        this.obstacleManager.update(delta);
        this.updateStreakDisplay();
        this.updateMinimap();
    }

    public onBossDefeated() {
        this.bossesDefeated++;
        if (this.bossesDefeated >= 5) {
            this.gameClear();
        }
    }

    private gameClear() {
        this.scene.pause();
        this.scene.launch('UIScene', {
            level: this.playerLevel,
            upgradeManager: this.upgradeManager,
            isGameClear: true,
            gameTime: this.gameTime,
            stats: this.getGameStats()
        });
    }

    private spawnRandomItem() {
        let itemData = this.itemManager.getRandomItem();
        if (itemData && itemData.id === 'aegis_of_the_immortal') {
            if (this.isAegisOnFieldOrInInventory()) {
                return;
            }
        }

        if (itemData) {
            const player = this.getPlayer();
            const spawnX = player.x + Phaser.Math.Between(-400, 400);
            const spawnY = player.y + Phaser.Math.Between(-400, 400);
            const item = new Item(this, spawnX, spawnY, itemData);
            this.addItem(item);
        }
    }

    private isAegisOnFieldOrInInventory(): boolean {
        const playerAegis = this.player.getItems().some(item => item.id === 'aegis_of_the_immortal');
        const fieldAegis = this.items.getChildren().some(item => (item as Item).getItemData().id === 'aegis_of_the_immortal');
        return playerAegis || fieldAegis;
    }

    private handleItemPickup(player: any, item: any) {
        const itemData = item.getItemData();
        this.itemsCollected++;
        const leveledUp = player.addItem(itemData);
        if (leveledUp) {
            SoundManager.getInstance().play('itemLevelUp');
            // Find the leveled-up item for current level
            const existing = player.getItems().find((i: ItemData) => i.id === itemData.id);
            this.showItemLevelUpPopup(existing || itemData);
        } else {
            SoundManager.getInstance().play('itemPickup');
            this.showItemCollectedPopup(itemData);
        }
        this.updateItemUI();
        item.destroy();
    }

    public showBossClearedMessage() {
        SoundManager.getInstance().play('bossDefeat');
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        const message = this.add.text(screenWidth / 2, screenHeight / 2, t('popup.boss_cleared'), {
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
        this.showItemRichTooltip(x, y, itemData, false);
    }

    public hideTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null as any;
        }
    }

    private updateAutocastIndicator() {
        if (!this.autocastIndicator) return;
        if (this.player instanceof MagePlayer) {
            const on = (this.player as MagePlayer).isAutoQEnabled();
            this.autocastIndicator.setText(on ? 'AUTO' : 'OFF');
            this.autocastIndicator.setColor(on ? '#00ff00' : '#ff4444');
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

    private getStatLabel(stat: string): string {
        const labels: Record<string, string> = {
            bonusAttackDamage: t('stats.damage', { value: '' }).replace(': ', '').trim(),
            attackDamageMultiplier: t('stats.damage', { value: '' }).replace(': ', '').trim(),
            attackSpeed: t('stats.attack_speed', { value: '' }).replace(': /s', '').trim(),
            projectileSpeed: 'Projectile Speed',
            criticalStrikeDamage: t('stats.crit_damage', { value: '' }).replace(': %', '').trim(),
            criticalStrikeChance: t('stats.crit_chance', { value: '' }).replace(': %', '').trim(),
            maxHealth: 'Max HP',
            moveSpeed: t('stats.move_speed', { value: '' }).replace(': ', '').trim(),
            projectileCount: t('stats.projectiles', { value: '' }).replace(': ', '').trim(),
            healthRegen: 'HP Regen',
            lifeSteal: 'Life Steal',
            hasAegis: 'Aegis',
            armor: t('stats.armor', { armor: '', reduction: '' }).replace(': ', '').replace(' (%)', '').trim(),
            maxMana: 'Max Mana',
            manaRegen: 'Mana Regen',
        };
        return labels[stat] || stat;
    }

    private formatModifier(mod: StatModifier): string {
        const label = this.getStatLabel(mod.stat);
        if (mod.stat === 'attackDamageMultiplier') {
            return `${label} x${(1 + mod.value).toFixed(1)}`;
        }
        if (mod.stat === 'attackSpeed' || mod.stat === 'moveSpeed') {
            const pct = mod.value > 0 ? `+${Math.round(mod.value * 100)}%` : `${Math.round(mod.value * 100)}%`;
            return `${label} ${pct}`;
        }
        if (mod.stat === 'criticalStrikeChance') {
            return `${label} +${Math.round(mod.value * 100)}%`;
        }
        if (mod.stat === 'criticalStrikeDamage') {
            return `${label} +${Math.round(mod.value * 100)}%`;
        }
        if (mod.stat === 'lifeSteal' || mod.stat === 'healthRegen') {
            return `${label} ${Math.round(mod.value * 100)}%`;
        }
        if (mod.stat === 'hasAegis') {
            return label;
        }
        const sign = mod.value >= 0 ? '+' : '';
        return `${label} ${sign}${mod.value}`;
    }

    private showItemRichTooltip(x: number, y: number, itemData: ItemData, isUI: boolean, extraLine?: string) {
        this.hideTooltip();

        const itemName = t(`item.${itemData.id}.name`);
        const levelStr = (itemData.level && itemData.level > 1) ? ` (Lv.${itemData.level})` : '';

        const rarityColors: Record<string, string> = {
            common: '#ffffff',
            rare: '#4da6ff',
            epic: '#9966ff',
            legendary: '#ff6600'
        };
        const nameColor = itemData.isCursed ? '#ff4444' : (rarityColors[itemData.rarity] || '#ffffff');

        // Build layout inside a container
        const container = this.add.container(x, y);
        container.setDepth(5000);

        // Background - we'll size it after measuring content
        const bg = this.add.rectangle(0, 0, 10, 10, 0x111111, 0.95);
        bg.setStrokeStyle(2, itemData.isCursed ? 0xff4444 : 0x444444);
        bg.setOrigin(0, 1);
        container.add(bg);

        // Icon
        const iconGraphics = this.add.graphics();
        Item.drawItemIcon(iconGraphics, itemData.id, 1.2);
        container.add(iconGraphics);

        // Name text
        const nameText = this.add.text(30, 0, `${itemName}${levelStr}`, {
            fontSize: '18px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: nameColor,
            fontStyle: 'bold'
        });
        container.add(nameText);

        // Rarity text
        const rarityLabel = t(`rarity.${itemData.rarity}`);
        const rarityText = this.add.text(30, 22, rarityLabel, {
            fontSize: '13px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: nameColor,
        });
        container.add(rarityText);

        // Stat modifier lines
        const modifiers = itemData.modifiers || [];
        const statTexts: Phaser.GameObjects.Text[] = [];
        let statY = 46;

        modifiers.forEach((mod) => {
            const line = this.formatModifier(mod);
            const isNegative = mod.value < 0;
            const statText = this.add.text(12, statY, line, {
                fontSize: '15px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                color: isNegative ? '#ff6666' : '#88ff88',
            });
            container.add(statText);
            statTexts.push(statText);
            statY += 20;
        });

        // Extra line (e.g., "Right-click to unequip")
        if (extraLine) {
            statY += 4;
            const extraText = this.add.text(12, statY, extraLine, {
                fontSize: '13px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                color: '#888888',
            });
            container.add(extraText);
            statY += 18;
        }

        // Measure and size the background
        const padding = 12;
        let maxWidth = nameText.width + 30;
        if (rarityText.width + 30 > maxWidth) maxWidth = rarityText.width + 30;
        statTexts.forEach(st => {
            if (st.width + 12 > maxWidth) maxWidth = st.width + 12;
        });
        const totalWidth = maxWidth + padding * 2;
        const totalHeight = statY + padding;

        bg.setSize(totalWidth, totalHeight);

        // Position icon inside background
        iconGraphics.setPosition(padding, -(totalHeight) + 20);
        nameText.setPosition(padding + 26, -(totalHeight) + 8);
        rarityText.setPosition(padding + 26, -(totalHeight) + 28);

        // Position stat lines
        let lineY = -(totalHeight) + 50;
        statTexts.forEach(st => {
            st.setPosition(padding, lineY);
            lineY += 20;
        });

        // Reposition extra line
        if (extraLine) {
            const extras = container.list.filter(c => c !== bg && c !== iconGraphics && c !== nameText && c !== rarityText && !statTexts.includes(c as any)) as Phaser.GameObjects.Text[];
            extras.forEach(ex => {
                ex.setPosition(padding, lineY - 16);
            });
        }

        // Adjust position if overflowing screen
        if (isUI) {
            container.setScrollFactor(0);
            const screenWidth = this.scale.width;
            if (x + totalWidth > screenWidth) {
                container.setX(x - totalWidth);
            }
            if (y - totalHeight < 0) {
                bg.setOrigin(0, 0);
                // Flip all children down
                container.list.forEach((child: any) => {
                    if (child !== bg) {
                        child.setY(child.y + totalHeight);
                    }
                });
            }
        }

        this.tooltip = container;
    }

    private showSkillTooltip(skillId: string) {
        // Determine character type
        let characterType: 'melee' | 'ranged' | 'mage';
        if (this.player instanceof MagePlayer) {
            characterType = 'mage';
        } else if (this.player instanceof MeleePlayer) {
            characterType = 'melee';
        } else {
            characterType = 'ranged';
        }

        // Get character-specific skill data
        const skillData = this.skillManager.getSkillDataForCharacter(skillId, characterType);
        
        if (skillData) {
            let text = skillData.description;
            if (skillData.damageMultiplier) {
                text += `\n${t('skill.damage', { value: String(skillData.damageMultiplier * 100) })}`;
            }
            // Show auto-cast status for mage Q
            if (skillId === 'Q' && this.player instanceof MagePlayer) {
                const autoOn = (this.player as MagePlayer).isAutoQEnabled();
                text += `\n${autoOn ? t('skill.autocast_on') : t('skill.autocast_off')}`;
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
        this.xpText = this.add.text(screenWidth / 2, xpBarY, t('hud.xp', { current: 0, max: 100 }), {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);
        
        this.timeText = this.add.text(20, 80, t('hud.time', { time: '0:00' }), {
            fontSize: '22px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ffff'
        }).setScrollFactor(0).setDepth(1000);
        
        // Health bar (center bottom like LoL)
        const centerX = screenWidth / 2;
        const bottomY = screenHeight - 80;
        
        this.add.rectangle(centerX, bottomY, 300, 30, 0x333333).setScrollFactor(0).setDepth(1000);
        this.healthBar = this.add.rectangle(centerX, bottomY, 300, 30, 0x00ff00).setScrollFactor(0).setDepth(1001);
        this.healthText = this.add.text(centerX, bottomY, `${Math.round(this.player.getHealth())}/${Math.round(this.player.getMaxHealth())}`, {
            fontSize: '22px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);
        
        // Mana bar (below health bar, only visible for mage)
        const manaY = bottomY + 28;
        this.manaBarBg = this.add.rectangle(centerX, manaY, 300, 20, 0x222244).setScrollFactor(0).setDepth(1000);
        this.manaBar = this.add.rectangle(centerX, manaY, 300, 20, 0x4488ff).setScrollFactor(0).setDepth(1001);
        this.manaText = this.add.text(centerX, manaY, '', {
            fontSize: '18px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);
        // Hide mana bar for non-mage
        const isMage = this.player instanceof MagePlayer;
        this.manaBarBg.setVisible(isMage);
        this.manaBar.setVisible(isMage);
        this.manaText.setVisible(isMage);

        // Level text (left of health bar, moved more to the left)
        this.levelText = this.add.text(centerX - 220, bottomY, t('hud.level', { level: 1 }), {
            fontSize: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        
        // Add wave counter on the right side (dynamic)
        this.waveText = this.add.text(screenWidth - 200, 20, t('hud.wave', { wave: 1, killed: 0, total: 10 }), {
            fontSize: '22px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffaa00'
        }).setScrollFactor(0).setDepth(1000);

        // Kill streak counter
        this.streakText = this.add.text(screenWidth - 200, 50, '', {
            fontSize: '18px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ff8800',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(1000);
        
        // Create minimap
        this.createMinimap();

        // Create skill UI
        this.createSkillUI();

        // Create character stats UI
        this.createPauseUI();
    }

    private updateUI() {
        this.levelText.setText(t('hud.level', { level: this.playerLevel }));

        // Update XP bar
        const xpPercent = this.playerXP / this.xpToNextLevel;
        const maxXpBarWidth = this.scale.width - 40;
        this.xpBar.width = maxXpBarWidth * xpPercent;
        this.xpText.setText(t('hud.xp', { current: Math.floor(this.playerXP), max: this.xpToNextLevel }));

        const minutes = Math.floor(this.gameTime / 60000);
        const seconds = Math.floor((this.gameTime % 60000) / 1000);
        this.timeText.setText(t('hud.time', { time: `${minutes}:${seconds.toString().padStart(2, '0')}` }));
        
        // Update health bar
        const player = this.getPlayer();
        if (player && player.isAlive()) {
            const healthPercent = player.getHealth() / player.getMaxHealth();
            this.healthBar.width = 300 * healthPercent;
            this.healthText.setText(`${Math.round(player.getHealth())}/${Math.round(player.getMaxHealth())}`);
            
            // Change color based on health
            if (healthPercent > 0.6) {
                this.healthBar.setFillStyle(0x00ff00);
            } else if (healthPercent > 0.3) {
                this.healthBar.setFillStyle(0xffff00);
            } else {
                this.healthBar.setFillStyle(0xff0000);
            }

            // Update mana bar (for mage)
            if (player.getMaxMana() > 0) {
                const manaPercent = player.getMana() / player.getMaxMana();
                this.manaBar.width = 300 * manaPercent;
                this.manaText.setText(`${Math.round(player.getMana())}/${Math.round(player.getMaxMana())}`);
            }
        }
    }

    private updateItemUI() {
        // Hide any lingering tooltip before rebuilding item UI
        this.hideTooltip();

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
            const rarityColors: Record<string, number> = {
                common: 0xffffff,
                rare: 0x0000ff,
                epic: 0x800080,
                legendary: 0xffa500
            };
            const isCursed = item.isCursed;
            const color = isCursed ? 0xff0000 : (rarityColors[item.rarity] || 0xffffff);

            // Create item container directly on scene (EXACTLY like skill UI)
            const itemContainer = this.add.container(itemStartX + (index * 50), itemY).setScrollFactor(0).setDepth(1500);

            // Dark semi-transparent background
            const itemBg = this.add.rectangle(0, 0, 40, 40, 0x111122, 0.7);
            itemBg.setStrokeStyle(2, color);
            itemContainer.add(itemBg);

            // Per-item icon
            const icon = this.add.graphics();
            Item.drawItemIcon(icon, item.id, 0.8);
            itemContainer.add(icon);
            
            // Show level badge if > 1
            const level = item.level || 1;
            if (level > 1) {
                const levelBadge = this.add.text(15, -15, `${level}`, {
                    fontSize: '12px',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    color: '#ffaa00',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5);
                itemContainer.add(levelBadge);
            }

            // Try simplified interactive setup
            itemContainer.setSize(40, 40);
            itemContainer.setInteractive();

            // Add hover effects and tooltip (EXACTLY like skill UI)
            itemContainer.on('pointerover', () => {
                itemBg.setFillStyle(0x333333, 0.8); // Darker on hover
                const tooltipData: ItemData = { ...item, level };
                this.showItemRichTooltip(this.input.x, this.input.y, tooltipData, true, t('popup.right_click_unequip'));
            });
            
            itemContainer.on('pointerout', () => {
                itemBg.setFillStyle(0x111122);
                this.hideTooltip();
            });

            itemContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.rightButtonDown()) {
                    this.hideTooltip();
                    this.player.removeItem(item);
                    this.updateItemUI();
                }
            });

            this.itemContainers.push(itemContainer);
        });
    }

    private showItemCollectedPopup(itemData: ItemData) {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Create popup container
        const popup = this.add.container(screenWidth / 2, screenHeight * 0.4);
        
        // Create background with border
        const background = this.add.rectangle(0, 0, 350, 120, 0x000000, 0.9);
        const border = this.add.rectangle(0, 0, 350, 120, 0x00ff88, 0);
        border.setStrokeStyle(3, 0x00ff88);
        
        // Create title text
        const titleText = this.add.text(0, -30, t('popup.item_obtained'), {
            fontSize: '20px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Create item name text
        const itemText = this.add.text(0, 10, t(`item.${itemData.id}.name`), {
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
                                popup.destroy();
                            }
                        });
                    }
                });
            }
        });
    }

    private showItemLevelUpPopup(itemData: ItemData) {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        const popup = this.add.container(screenWidth / 2, screenHeight * 0.4);

        const background = this.add.rectangle(0, 0, 350, 120, 0x000000, 0.9);
        const border = this.add.rectangle(0, 0, 350, 120, 0xffaa00, 0);
        border.setStrokeStyle(3, 0xffaa00);

        const titleText = this.add.text(0, -30, t('popup.item_level_up'), {
            fontSize: '20px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const level = itemData.level || 1;
        const itemText = this.add.text(0, 10, `${t(`item.${itemData.id}.name`)} Lv.${level}`, {
            fontSize: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        popup.add([background, border, titleText, itemText]);
        popup.setScrollFactor(0).setDepth(7000);
        popup.setAlpha(1);

        this.tweens.add({
            targets: popup,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 150,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: popup,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 150,
                    onComplete: () => {
                        this.tweens.add({
                            targets: popup,
                            alpha: 0,
                            y: popup.y - 50,
                            duration: 2000,
                            delay: 1500,
                            ease: 'Power2',
                            onComplete: () => popup.destroy()
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
        SoundManager.getInstance().play('levelUp');
        this.hideTooltip();
        this.playerLevel++;
        this.playerXP -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5); // Increase XP requirement
        
        // --- Level Up Bonuses ---
        // 1. Fixed armor gain
        this.player.increaseArmor(this.player.getArmorPerLevelUp()); 

        // 2. Heal 20% of max health
        this.player.heal(this.player.getMaxHealth() * 0.2); 

        // 3. Increase attack damage by 1.2x
        this.player.increaseAttackDamage(1.2);

        // Unlock skills
        this.player.unlockSkills(this.playerLevel);
        
        // Trigger level up UI (each card can reroll once = 3 total)
        this.scene.launch('UIScene', {
            level: this.playerLevel,
            upgradeManager: this.upgradeManager,
            isGameOver: false,
            rerollsRemaining: 3,
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

    public getUpgradeManager(): UpgradeManager {
        return this.upgradeManager;
    }

    public getEffectsManager(): EffectsManager {
        return this.effectsManager;
    }

    public getObstacleManager(): ObstacleManager {
        return this.obstacleManager;
    }

    public getSynergyManager(): SynergyManager {
        return this.synergyManager;
    }

    public spawnItemAt(x: number, y: number) {
        const itemData = this.itemManager.getRandomItem();
        if (itemData) {
            const item = new Item(this, x, y, itemData);
            this.addItem(item);
        }
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

    public addDamageDealt(damage: number) {
        this.totalDamageDealt += damage;
    }

    public addKill() {
        this.totalKills++;
    }

    public updateHighestWave(wave: number) {
        if (wave > this.highestWave) {
            this.highestWave = wave;
        }
    }

    public getGameStats() {
        return {
            gameTime: this.gameTime,
            highestWave: this.highestWave,
            totalKills: this.totalKills,
            totalDamageDealt: this.totalDamageDealt,
            itemsCollected: this.itemsCollected,
        };
    }
    
    public updateWaveCounter(waveNumber: number) {
        if (!this.waveText || !this.enemySpawner) return;

        const enemiesKilled = this.enemySpawner.getEnemiesKilledThisWave();
        const enemiesToKill = this.enemySpawner.getEnemiesToKillPerWave();

        this.waveText.setText(t('hud.wave', { wave: waveNumber, killed: enemiesKilled, total: enemiesToKill }));
    }

    private updateWaveDisplay() {
        if (!this.waveText || !this.enemySpawner) return;

        const currentWave = this.enemySpawner.getWaveNumber();
        const enemiesKilled = this.enemySpawner.getEnemiesKilledThisWave();
        const enemiesToKill = this.enemySpawner.getEnemiesToKillPerWave();

        this.waveText.setText(t('hud.wave', { wave: currentWave, killed: enemiesKilled, total: enemiesToKill }));
    }

    private createBackground() {
        const tileSize = 200;
        const halfMap = MAP_SIZE / 2;

        // Ensure the texture doesn't already exist
        if (this.textures.exists('grid')) {
            this.textures.remove('grid');
        }

        // Create an in-memory texture for the grass pattern
        const gridTexture = this.textures.createCanvas('grid', tileSize, tileSize);
        if (!gridTexture) return;
        const context = gridTexture.getContext();

        // Green grass base
        context.fillStyle = '#2d5a1e';
        context.fillRect(0, 0, tileSize, tileSize);

        // Subtle lighter grass patches
        context.fillStyle = '#3a6e28';
        for (let i = 0; i < 6; i++) {
            const px = Math.random() * tileSize;
            const py = Math.random() * tileSize;
            const r = 8 + Math.random() * 15;
            context.beginPath();
            context.arc(px, py, r, 0, Math.PI * 2);
            context.fill();
        }

        // Small dirt spots
        context.fillStyle = '#4a3a20';
        for (let i = 0; i < 3; i++) {
            const px = Math.random() * tileSize;
            const py = Math.random() * tileSize;
            const r = 2 + Math.random() * 4;
            context.beginPath();
            context.arc(px, py, r, 0, Math.PI * 2);
            context.fill();
        }

        // Darker green grid lines
        context.strokeStyle = '#1a3d10';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, tileSize);
        context.lineTo(tileSize, tileSize);
        context.moveTo(tileSize, 0);
        context.lineTo(tileSize, tileSize);
        context.stroke();
        gridTexture.refresh();

        // Fixed-size TileSprite that scrolls with the world
        const background = this.add.tileSprite(0, 0, MAP_SIZE, MAP_SIZE, 'grid');
        background.setOrigin(0.5, 0.5);
        background.setScrollFactor(1);
        background.setDepth(-1000);

        // Procedural ground patches for visual variety
        const patchGraphics = this.add.graphics();
        patchGraphics.setDepth(-999);

        // ~20 large dirt/dark-grass patches
        for (let i = 0; i < 20; i++) {
            const px = (Math.random() - 0.5) * MAP_SIZE * 0.9;
            const py = (Math.random() - 0.5) * MAP_SIZE * 0.9;
            const r = 80 + Math.random() * 150;
            patchGraphics.fillStyle(0x3a5a20, 0.3 + Math.random() * 0.2);
            patchGraphics.fillCircle(px, py, r);
        }

        // ~10 lighter clearings
        for (let i = 0; i < 10; i++) {
            const px = (Math.random() - 0.5) * MAP_SIZE * 0.9;
            const py = (Math.random() - 0.5) * MAP_SIZE * 0.9;
            const r = 60 + Math.random() * 120;
            patchGraphics.fillStyle(0x4a7a30, 0.2 + Math.random() * 0.15);
            patchGraphics.fillCircle(px, py, r);
        }

        // Map boundary — dark void outside + visible border
        const boundaryGraphics = this.add.graphics();
        boundaryGraphics.setDepth(-998);
        const edgeThickness = 2000;

        // Dark fill outside play area (4 rectangles around the edges)
        boundaryGraphics.fillStyle(0x0a0a0a, 1);
        // Top
        boundaryGraphics.fillRect(-halfMap - edgeThickness, -halfMap - edgeThickness, MAP_SIZE + edgeThickness * 2, edgeThickness);
        // Bottom
        boundaryGraphics.fillRect(-halfMap - edgeThickness, halfMap, MAP_SIZE + edgeThickness * 2, edgeThickness);
        // Left
        boundaryGraphics.fillRect(-halfMap - edgeThickness, -halfMap, edgeThickness, MAP_SIZE);
        // Right
        boundaryGraphics.fillRect(halfMap, -halfMap, edgeThickness, MAP_SIZE);

        // Visible inner border line
        boundaryGraphics.lineStyle(4, 0x664422, 1);
        boundaryGraphics.strokeRect(-halfMap, -halfMap, MAP_SIZE, MAP_SIZE);
    }

    private setupCamera() {
        const halfMap = MAP_SIZE / 2;
        this.cameras.main.setBounds(-halfMap, -halfMap, MAP_SIZE, MAP_SIZE);

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
        return MAP_SIZE;
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
            .on('pointerout', () => this.hideTooltip())
            .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.rightButtonDown() && this.player instanceof MagePlayer) {
                    (this.player as MagePlayer).toggleAutoQ();
                    this.updateAutocastIndicator();
                }
            });
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
        // Auto-cast indicator (mage only)
        this.autocastIndicator = this.add.text(0, -30, 'AUTO', {
            fontSize: '10px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.autocastIndicator.setVisible(this.player instanceof MagePlayer);
        this.qSkillUI.add([qBg, qText, qCooldownOverlay, qCooldownText, this.autocastIndicator]);
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
        const screenHeight = this.scale.height;
        
        // Position stats UI below and to the left of the level text
        const statsX = 40; 
        const statsY = screenHeight / 2 - 115; 
        /* (0, 0) is the top left corner of the screen */

        // Create stats container positioned relative to level text
        this.statsContainer = this.add.container(statsX, statsY).setScrollFactor(0).setDepth(1000);
        
        // Background panel (made taller for all stats including new ones)
        const statsBg = this.add.rectangle(0, 0, 220, 310, 0x000000, 0.7);
        statsBg.setStrokeStyle(2, 0x333333);
        statsBg.setOrigin(0, 0);
        // Remove problematic setInteractive call
        // statsBg.setInteractive(false);
        
        // Title
        const statsTitle = this.add.text(10, 10, t('stats.title'), {
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

        // Q Skill Range (for melee players)
        this.qSkillRangeText = this.add.text(10, 215, 'Q Range: 200', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        });

        // Q Skill Repeat/Projectiles (for ranged players)
        this.qSkillRepeatText = this.add.text(10, 240, 'Q Projectiles: 1x', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        });

        // Melee Attack Range (for melee players)
        this.meleeAttackRangeText = this.add.text(10, 265, 'Attack Range: 200', {
            fontSize: '16px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff'
        });

        // Add all elements to container
        this.statsContainer.add([statsBg, statsTitle, this.damageText, this.attackSpeedText, this.movementSpeedText, this.armorText, this.projectileCountText, this.critChanceText, this.critDamageText, this.qSkillRangeText, this.qSkillRepeatText, this.meleeAttackRangeText]);
    }

    private updateCharacterStats() {
        if (!this.player || !this.damageText || !this.attackSpeedText || !this.movementSpeedText || !this.armorText || !this.projectileCountText || !this.qSkillRangeText || !this.qSkillRepeatText || !this.meleeAttackRangeText) return;
        
        // Get player stats
        const damage = Math.round(this.player.getAttackDamage());
        const attackSpeed = (1000 / this.player.getAttackCooldown()).toFixed(1); // Convert cooldown to attacks per second
        const moveSpeed = this.player.getMoveSpeed();
        const armor = this.player.getArmor();
        const damageReduction = this.player.getDamageReduction().toFixed(1);
        const projectileCount = (this.player instanceof MeleePlayer) ? (this.player as MeleePlayer).getMeleeAttackCount() : this.player.getProjectileCount();
        const critChance = (this.player.getCriticalStrikeChance() * 100).toFixed(0);
        const critDamage = (this.player.getCriticalStrikeDamage() * 100).toFixed(0);
        
        // Update text displays
        this.damageText.setText(t('stats.damage', { value: damage }));
        this.attackSpeedText.setText(t('stats.attack_speed', { value: attackSpeed }));
        this.movementSpeedText.setText(t('stats.move_speed', { value: moveSpeed.toFixed(2) }));
        this.armorText.setText(t('stats.armor', { armor, reduction: damageReduction }));

        // Show appropriate count label based on player type
        if (this.player instanceof MeleePlayer) {
            this.projectileCountText.setText(t('stats.attack_count', { value: projectileCount }));
        } else {
            this.projectileCountText.setText(t('stats.projectiles', { value: projectileCount }));
        }

        this.critChanceText.setText(t('stats.crit_chance', { value: critChance }));
        this.critDamageText.setText(t('stats.crit_damage', { value: critDamage }));

        // Update character-specific stats
        if (this.player instanceof MagePlayer) {
            const magePlayer = this.player as MagePlayer;
            const spellAmp = (magePlayer.getSpellAmplification() * 100).toFixed(0);
            const lightningDmg = (magePlayer.getLightningDamageMultiplier() * 100).toFixed(0);
            this.qSkillRepeatText.setText(t('stats.spell_amp', { value: spellAmp }));
            this.qSkillRepeatText.setVisible(true);
            this.qSkillRangeText.setText(t('stats.lightning_dmg', { value: lightningDmg }));
            this.qSkillRangeText.setVisible(true);
            this.meleeAttackRangeText.setVisible(false);
        } else if (this.player instanceof MeleePlayer) {
            const meleePlayer = this.player as MeleePlayer;
            const qSkillRadius = Math.round(meleePlayer.getQSkillRadius());
            const attackRange = Math.round(meleePlayer.getAttackRange());

            this.qSkillRangeText.setText(t('stats.q_range', { value: qSkillRadius }));
            this.qSkillRangeText.setVisible(true);
            this.meleeAttackRangeText.setText(t('stats.attack_range', { value: attackRange }));
            this.meleeAttackRangeText.setVisible(true);
            this.qSkillRepeatText.setVisible(false);
        } else if (this.player instanceof RangedPlayer) {
            const rangedPlayer = this.player as RangedPlayer;
            const qProjectileMultiplier = rangedPlayer.getQSkillHomingMultiplier();

            this.qSkillRepeatText.setText(t('stats.q_projectiles', { value: qProjectileMultiplier }));
            this.qSkillRepeatText.setVisible(true);
            this.qSkillRangeText.setVisible(false);
            this.meleeAttackRangeText.setVisible(false);
        }
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
        this.hideTooltip();
        // Stop the game
        this.scene.pause();

        // Show game over screen in UI
        this.scene.launch('UIScene', {
            level: this.playerLevel,
            upgradeManager: this.upgradeManager,
            isGameOver: true,
            stats: this.getGameStats()
        });
    }
    
    private createPauseUI() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.5).setOrigin(0);

        const pauseText = this.add.text(screenWidth / 2, screenHeight * 0.4, t('pause.title'), {
            fontSize: '48px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
        }).setOrigin(0.5);

        const resumeText = this.add.text(screenWidth / 2, screenHeight * 0.6, t('pause.resume'), {
            fontSize: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
        }).setOrigin(0.5);

        this.pauseContainer = this.add.container(0, 0, [overlay, pauseText, resumeText]);
        this.pauseContainer.setScrollFactor(0).setDepth(4000).setVisible(false);
    }
    
    private togglePause() {
        this.hideTooltip();
        const uiScene = this.scene.get('UIScene');

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

    private updateStreakDisplay() {
        if (!this.streakText || !this.effectsManager) return;
        const streak = this.effectsManager.getKillStreak();
        if (streak >= 3) {
            this.streakText.setText(t('hud.streak', { streak }));
            this.streakText.setVisible(true);
        } else {
            this.streakText.setVisible(false);
        }
    }

    private createMinimap() {
        const screenWidth = this.scale.width;
        const mapX = screenWidth - this.MINIMAP_SIZE - 15;
        const mapY = 80; // Below wave + streak text

        // Background
        this.add.rectangle(
            mapX + this.MINIMAP_SIZE / 2, mapY + this.MINIMAP_SIZE / 2,
            this.MINIMAP_SIZE, this.MINIMAP_SIZE, 0x111111, 0.7
        ).setScrollFactor(0).setDepth(900);

        // Border
        const border = this.add.rectangle(
            mapX + this.MINIMAP_SIZE / 2, mapY + this.MINIMAP_SIZE / 2,
            this.MINIMAP_SIZE, this.MINIMAP_SIZE, 0x000000, 0
        ).setScrollFactor(0).setDepth(901);
        border.setStrokeStyle(2, 0x444444);

        // Graphics layer for dots
        this.minimapGraphics = this.add.graphics()
            .setScrollFactor(0).setDepth(902);
    }

    private updateMinimap() {
        if (!this.minimapGraphics || !this.player) return;

        this.minimapGraphics.clear();

        const screenWidth = this.scale.width;
        const mapX = screenWidth - this.MINIMAP_SIZE - 15;
        const mapY = 80;
        const centerX = mapX + this.MINIMAP_SIZE / 2;
        const centerY = mapY + this.MINIMAP_SIZE / 2;
        const halfSize = this.MINIMAP_SIZE / 2;
        const scale = this.MINIMAP_SIZE / (this.MINIMAP_RANGE * 2);
        const px = this.player.getX();
        const py = this.player.getY();

        // Draw terrain (water pools as blue, trees as dark green)
        if (this.obstacleManager) {
            this.obstacleManager.getWaterPools().getChildren().forEach((pool: any) => {
                if (!pool.active) return;
                const dx = (pool.x - px) * scale;
                const dy = (pool.y - py) * scale;
                if (Math.abs(dx) < halfSize && Math.abs(dy) < halfSize) {
                    const r = Math.max(4, (pool.getRadius() || 100) * scale);
                    this.minimapGraphics.fillStyle(0x2266aa, 0.5);
                    this.minimapGraphics.fillCircle(centerX + dx, centerY + dy, r);
                }
            });

            this.obstacleManager.getTrees().getChildren().forEach((tree: any) => {
                if (!tree.active) return;
                const dx = (tree.x - px) * scale;
                const dy = (tree.y - py) * scale;
                if (Math.abs(dx) < halfSize && Math.abs(dy) < halfSize) {
                    const r = Math.max(3, (tree.getRadius() || 60) * scale);
                    this.minimapGraphics.fillStyle(0x0a3a0a, 0.8);
                    this.minimapGraphics.fillCircle(centerX + dx, centerY + dy, r);
                }
            });

            // Draw slow pools as purple circles
            this.obstacleManager.getSlowPools().getChildren().forEach((pool: any) => {
                if (!pool.active) return;
                const dx = (pool.x - px) * scale;
                const dy = (pool.y - py) * scale;
                if (Math.abs(dx) < halfSize && Math.abs(dy) < halfSize) {
                    const r = Math.max(3, (pool.getRadius ? pool.getRadius() : 80) * scale);
                    this.minimapGraphics.fillStyle(0x9933cc, 0.5);
                    this.minimapGraphics.fillCircle(centerX + dx, centerY + dy, r);
                }
            });
        }

        // Draw enemies as red dots
        this.enemies.getChildren().forEach((enemy: any) => {
            const dx = (enemy.x - px) * scale;
            const dy = (enemy.y - py) * scale;

            if (Math.abs(dx) < halfSize && Math.abs(dy) < halfSize) {
                const isBoss = enemy.isBossEnemy && enemy.isBossEnemy();
                const isElite = enemy.isEliteEnemy && enemy.isEliteEnemy();
                if (isBoss) {
                    this.minimapGraphics.fillStyle(0xff0000, 1);
                    this.minimapGraphics.fillCircle(centerX + dx, centerY + dy, 6);
                } else if (isElite) {
                    this.minimapGraphics.fillStyle(0xffd700, 0.9);
                    this.minimapGraphics.fillCircle(centerX + dx, centerY + dy, 4);
                } else {
                    this.minimapGraphics.fillStyle(0xff4444, 0.7);
                    this.minimapGraphics.fillCircle(centerX + dx, centerY + dy, 3);
                }
            }
        });

        // Draw items as yellow squares (5x5)
        this.items.getChildren().forEach((item: any) => {
            const dx = (item.x - px) * scale;
            const dy = (item.y - py) * scale;
            if (Math.abs(dx) < halfSize && Math.abs(dy) < halfSize) {
                this.minimapGraphics.fillStyle(0xffd700, 0.8);
                this.minimapGraphics.fillRect(centerX + dx - 2.5, centerY + dy - 2.5, 5, 5);
            }
        });

        // Draw chests as golden brown squares (5x5)
        if (this.obstacleManager) {
            this.obstacleManager.getCrates().getChildren().forEach((crate: any) => {
                if (!crate.active) return;
                const dx = (crate.x - px) * scale;
                const dy = (crate.y - py) * scale;
                if (Math.abs(dx) < halfSize && Math.abs(dy) < halfSize) {
                    this.minimapGraphics.fillStyle(0xcc8844, 0.8);
                    this.minimapGraphics.fillRect(centerX + dx - 2.5, centerY + dy - 2.5, 5, 5);
                }
            });

            // Draw shrines as cyan diamonds
            this.obstacleManager.getShrines().getChildren().forEach((shrine: any) => {
                if (!shrine.active) return;
                const dx = (shrine.x - px) * scale;
                const dy = (shrine.y - py) * scale;
                if (Math.abs(dx) < halfSize && Math.abs(dy) < halfSize) {
                    const sx = centerX + dx;
                    const sy = centerY + dy;
                    this.minimapGraphics.fillStyle(0x00ffff, 0.9);
                    this.minimapGraphics.fillTriangle(sx, sy - 4, sx - 3, sy, sx + 3, sy);
                    this.minimapGraphics.fillTriangle(sx, sy + 4, sx - 3, sy, sx + 3, sy);
                }
            });
        }

        // Draw pets as light green dots
        this.pets.getChildren().forEach((pet: any) => {
            if (!pet.active) return;
            const dx = (pet.x - px) * scale;
            const dy = (pet.y - py) * scale;
            if (Math.abs(dx) < halfSize && Math.abs(dy) < halfSize) {
                this.minimapGraphics.fillStyle(0x88ff88, 0.9);
                this.minimapGraphics.fillCircle(centerX + dx, centerY + dy, 3);
            }
        });

        // Draw player as green dot in center (size 5)
        this.minimapGraphics.fillStyle(0x00ff00, 1);
        this.minimapGraphics.fillCircle(centerX, centerY, 5);
    }

    private createBossIndicator() {
        // Create a 3x larger triangle texture for the boss indicator
        const graphics = this.add.graphics();
        graphics.fillStyle(0xff0000, 1);
        graphics.beginPath();
        graphics.moveTo(45, 0);   // top center (shifted into 90x90 canvas)
        graphics.lineTo(90, 90);  // bottom right
        graphics.lineTo(0, 90);   // bottom left
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('boss_indicator', 90, 90);
        graphics.destroy();

        this.bossIndicator = this.add.image(this.scale.width / 2, 50, 'boss_indicator')
            .setScrollFactor(0)
            .setDepth(5000)
            .setVisible(false);

        this.bossIndicatorText = this.add.text(this.scale.width / 2, 50, 'BOSS', {
            fontSize: '20px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5000).setVisible(false);
    }

    private updateBossIndicator() {
        const boss = this.enemies.getChildren().find(enemy => (enemy as BaseEnemy).isBossEnemy());

        if (boss) {
            const bossEnemy = boss as BaseEnemy;
            const camera = this.cameras.main;
            const screenWidth = this.scale.width;
            const screenHeight = this.scale.height;

            if (Phaser.Geom.Rectangle.Contains(camera.worldView, bossEnemy.x, bossEnemy.y)) {
                this.bossIndicator.setVisible(false);
                this.bossIndicatorText.setVisible(false);
            } else {
                this.bossIndicator.setVisible(true);
                this.bossIndicatorText.setVisible(true);

                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, bossEnemy.x, bossEnemy.y);
                this.bossIndicator.setRotation(angle + Math.PI / 2);

                const indicatorPadding = 80;
                const indicatorX = Phaser.Math.Clamp(
                    (bossEnemy.x - camera.scrollX) * (screenWidth / camera.width),
                    indicatorPadding,
                    screenWidth - indicatorPadding
                );
                const indicatorY = Phaser.Math.Clamp(
                    (bossEnemy.y - camera.scrollY) * (screenHeight / camera.height),
                    indicatorPadding,
                    screenHeight - indicatorPadding
                );

                let displayX = 0;
                let displayY = 0;

                const screenCenterX = screenWidth / 2;
                const screenCenterY = screenHeight / 2;

                const bossAngle = Phaser.Math.Angle.Between(screenCenterX, screenCenterY, indicatorX, indicatorY);
                const screenAngle = Phaser.Math.Angle.Between(screenCenterX, screenCenterY, screenWidth, screenHeight);

                if (Math.abs(bossAngle) > Math.abs(screenAngle) && Math.abs(bossAngle) < Math.PI - Math.abs(screenAngle)) {
                    if (bossAngle > 0) {
                        displayY = screenHeight - indicatorPadding;
                    } else {
                        displayY = indicatorPadding;
                    }
                    displayX = screenCenterX + (displayY - screenCenterY) / Math.tan(bossAngle)
                } else {
                    if (Math.abs(bossAngle) < Math.PI / 2) {
                         displayX = screenWidth-indicatorPadding;
                    } else {
                        displayX = indicatorPadding;
                    }
                    displayY = screenCenterY + (displayX - screenCenterX) * Math.tan(bossAngle);
                }

                const finalX = Phaser.Math.Clamp(displayX, indicatorPadding, screenWidth - indicatorPadding);
                const finalY = Phaser.Math.Clamp(displayY, indicatorPadding, screenHeight - indicatorPadding);

                this.bossIndicator.setPosition(finalX, finalY);
                this.bossIndicatorText.setPosition(finalX, finalY + 55);
            }
        } else {
            this.bossIndicator.setVisible(false);
            this.bossIndicatorText.setVisible(false);
        }
    }
} 