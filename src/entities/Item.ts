import Phaser from 'phaser';
import { Player } from './Player';
import { PlayerStatName, StatOp } from '../data/PlayerStats';
import { GameSceneInterface } from '../types/GameSceneInterface';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface StatModifier {
    stat: PlayerStatName;
    op: StatOp;
    value: number;
}

export interface ItemData {
    id: string;
    name: string;
    description: string;
    texture: string;
    rarity: Rarity;
    modifiers?: StatModifier[];
    isCursed?: boolean;
    level: number;
    applyEffect: (player: Player) => void;
    removeEffect?: (player: Player) => void;
}

export class Item extends Phaser.GameObjects.Container {
    private itemData: ItemData;

    static drawItemIcon(g: Phaser.GameObjects.Graphics, itemId: string, scale: number = 1): void {
        const s = scale;
        switch (itemId) {
            case 'basic_sword':
                // Sword blade + crossguard
                g.fillStyle(0xCCCCCC);
                g.fillRect(-1.5 * s, -10 * s, 3 * s, 16 * s);
                g.fillStyle(0x886600);
                g.fillRect(-5 * s, 4 * s, 10 * s, 2.5 * s);
                g.fillStyle(0xFFFFFF, 0.4);
                g.fillRect(-0.5 * s, -9 * s, 1 * s, 12 * s);
                break;
            case 'berserkers_greaves':
                // Boot outline (L-shape)
                g.fillStyle(0x884422);
                g.fillRect(-3 * s, -8 * s, 6 * s, 12 * s);
                g.fillRect(-3 * s, 4 * s, 10 * s, 4 * s);
                g.lineStyle(1 * s, 0xAA6633);
                g.strokeRect(-3 * s, -8 * s, 6 * s, 12 * s);
                break;
            case 'boots_of_swiftness':
                // Boot + wing lines
                g.fillStyle(0x4488CC);
                g.fillRect(-3 * s, -6 * s, 6 * s, 10 * s);
                g.fillRect(-3 * s, 4 * s, 9 * s, 3 * s);
                g.lineStyle(1.5 * s, 0x88CCFF, 0.7);
                g.beginPath();
                g.moveTo(-4 * s, -2 * s); g.lineTo(-8 * s, -6 * s);
                g.moveTo(-4 * s, 1 * s); g.lineTo(-8 * s, -1 * s);
                g.strokePath();
                break;
            case 'projectile_multiplier':
                // 3 small arrows in a fan
                g.fillStyle(0xFFDD44);
                g.fillTriangle(-6 * s, 4 * s, -4 * s, -8 * s, -2 * s, 4 * s);
                g.fillTriangle(-2 * s, 4 * s, 0, -10 * s, 2 * s, 4 * s);
                g.fillTriangle(2 * s, 4 * s, 4 * s, -8 * s, 6 * s, 4 * s);
                break;
            case 'vampiric_scepter':
                // Staff + red gem
                g.fillStyle(0x886644);
                g.fillRect(-1 * s, -4 * s, 2 * s, 14 * s);
                g.fillStyle(0xFF0000);
                g.fillCircle(0, -6 * s, 3.5 * s);
                g.fillStyle(0xFF6666, 0.5);
                g.fillCircle(-1 * s, -7 * s, 1.5 * s);
                break;
            case 'crit_damage_boost':
                // Lightning bolt zigzag
                g.fillStyle(0xFFDD00);
                g.beginPath();
                g.moveTo(2 * s, -10 * s);
                g.lineTo(-2 * s, -2 * s);
                g.lineTo(2 * s, -2 * s);
                g.lineTo(-2 * s, 10 * s);
                g.lineTo(0, 2 * s);
                g.lineTo(-4 * s, 2 * s);
                g.closePath();
                g.fillPath();
                break;
            case 'blade_of_the_ruined_king':
                // Large sword with notched blade
                g.fillStyle(0xAABBCC);
                g.fillRect(-2 * s, -10 * s, 4 * s, 16 * s);
                g.fillStyle(0x886600);
                g.fillRect(-5 * s, 5 * s, 10 * s, 3 * s);
                // Notch in blade
                g.fillStyle(0x222222);
                g.fillRect(2 * s, -6 * s, 2 * s, 3 * s);
                break;
            case 'rageblade':
                // Blade + flame wisps
                g.fillStyle(0xCCCCCC);
                g.fillRect(-1.5 * s, -8 * s, 3 * s, 14 * s);
                g.fillStyle(0x886600);
                g.fillRect(-4 * s, 5 * s, 8 * s, 2 * s);
                // Flame wisps
                g.lineStyle(1.5 * s, 0xFF6600, 0.7);
                g.beginPath();
                g.moveTo(-3 * s, -4 * s); g.lineTo(-5 * s, -8 * s);
                g.moveTo(3 * s, -4 * s); g.lineTo(5 * s, -8 * s);
                g.moveTo(-3 * s, 0); g.lineTo(-6 * s, -3 * s);
                g.moveTo(3 * s, 0); g.lineTo(6 * s, -3 * s);
                g.strokePath();
                break;
            case 'blood_pact':
                // Blood droplet (teardrop)
                g.fillStyle(0xCC0000);
                g.beginPath();
                g.moveTo(0, -8 * s);
                g.lineTo(-5 * s, 2 * s);
                g.arc(0, 2 * s, 5 * s, Math.PI, 0, false);
                g.closePath();
                g.fillPath();
                g.fillStyle(0xFF4444, 0.4);
                g.fillCircle(-1.5 * s, 1 * s, 2 * s);
                break;
            case 'glass_cannon':
                // Cracked circle + crosshair
                g.lineStyle(1.5 * s, 0xCCCCCC);
                g.strokeCircle(0, 0, 7 * s);
                g.beginPath();
                g.moveTo(0, -9 * s); g.lineTo(0, 9 * s);
                g.moveTo(-9 * s, 0); g.lineTo(9 * s, 0);
                g.strokePath();
                // Crack lines
                g.lineStyle(1 * s, 0xFF4444, 0.8);
                g.beginPath();
                g.moveTo(-2 * s, -5 * s); g.lineTo(1 * s, 0);
                g.lineTo(-1 * s, 4 * s);
                g.strokePath();
                break;
            case 'berserkers_rage':
                // Fist shape
                g.fillStyle(0xCC8844);
                g.fillRect(-5 * s, -4 * s, 10 * s, 10 * s);
                // Knuckle bumps
                g.fillStyle(0xDDAA66);
                g.fillCircle(-3 * s, -5 * s, 2 * s);
                g.fillCircle(0, -5.5 * s, 2 * s);
                g.fillCircle(3 * s, -5 * s, 2 * s);
                break;
            case 'heart_of_tarrasque':
                // Heart shape
                g.fillStyle(0xFF2244);
                g.fillCircle(-3.5 * s, -3 * s, 4 * s);
                g.fillCircle(3.5 * s, -3 * s, 4 * s);
                g.fillTriangle(-7 * s, -1 * s, 7 * s, -1 * s, 0, 8 * s);
                g.fillStyle(0xFF8899, 0.4);
                g.fillCircle(-2 * s, -4 * s, 2 * s);
                break;
            case 'aegis_of_the_immortal':
                // Shield outline + star
                g.lineStyle(2 * s, 0xFFDD44);
                g.beginPath();
                g.moveTo(0, -8 * s);
                g.lineTo(-7 * s, -4 * s);
                g.lineTo(-7 * s, 3 * s);
                g.lineTo(0, 8 * s);
                g.lineTo(7 * s, 3 * s);
                g.lineTo(7 * s, -4 * s);
                g.closePath();
                g.strokePath();
                // Star in center
                g.fillStyle(0xFFDD44);
                g.fillCircle(0, 0, 2.5 * s);
                break;
            case 'deathbringer':
                // Skull shape
                g.fillStyle(0xDDDDDD);
                g.fillCircle(0, -2 * s, 6 * s);
                g.fillRect(-4 * s, 2 * s, 8 * s, 5 * s);
                // Eye holes
                g.fillStyle(0x000000);
                g.fillCircle(-2.5 * s, -3 * s, 2 * s);
                g.fillCircle(2.5 * s, -3 * s, 2 * s);
                // Teeth
                g.fillStyle(0x000000);
                g.fillRect(-3 * s, 5 * s, 2 * s, 2 * s);
                g.fillRect(1 * s, 5 * s, 2 * s, 2 * s);
                break;
            case 'cursed_blade':
                // Jagged dagger + dripping lines
                g.fillStyle(0x8844AA);
                g.beginPath();
                g.moveTo(0, -10 * s);
                g.lineTo(-3 * s, -4 * s);
                g.lineTo(-1 * s, -5 * s);
                g.lineTo(-2 * s, 0);
                g.lineTo(0, -1 * s);
                g.lineTo(2 * s, 0);
                g.lineTo(1 * s, -5 * s);
                g.lineTo(3 * s, -4 * s);
                g.closePath();
                g.fillPath();
                g.fillStyle(0x886600);
                g.fillRect(-3 * s, 0, 6 * s, 3 * s);
                // Drips
                g.lineStyle(1 * s, 0xCC0000, 0.7);
                g.beginPath();
                g.moveTo(-2 * s, 3 * s); g.lineTo(-2 * s, 7 * s);
                g.moveTo(1 * s, 3 * s); g.lineTo(1 * s, 8 * s);
                g.strokePath();
                break;
            case 'soul_harvester':
                // Spiral vortex (concentric arcs)
                g.lineStyle(1.5 * s, 0x8844CC, 0.8);
                g.beginPath();
                g.arc(0, 0, 3 * s, 0, Math.PI * 1.5);
                g.strokePath();
                g.lineStyle(1.5 * s, 0xAA66EE, 0.6);
                g.beginPath();
                g.arc(0, 0, 5.5 * s, Math.PI * 0.5, Math.PI * 2);
                g.strokePath();
                g.lineStyle(1.5 * s, 0xCC88FF, 0.4);
                g.beginPath();
                g.arc(0, 0, 8 * s, Math.PI, Math.PI * 2.5);
                g.strokePath();
                g.fillStyle(0xBB66DD);
                g.fillCircle(0, 0, 2 * s);
                break;
            case 'arcane_crystal':
                // Blue diamond crystal
                g.fillStyle(0x4488FF);
                g.beginPath();
                g.moveTo(0, -9 * s);
                g.lineTo(-6 * s, 0);
                g.lineTo(0, 9 * s);
                g.lineTo(6 * s, 0);
                g.closePath();
                g.fillPath();
                g.fillStyle(0x88BBFF, 0.5);
                g.fillTriangle(-4 * s, 0, 0, -7 * s, 0, 0);
                break;
            case 'staff_of_power':
                // Purple staff with blue orb
                g.fillStyle(0x886644);
                g.fillRect(-1 * s, -4 * s, 2 * s, 14 * s);
                g.fillStyle(0x4488FF);
                g.fillCircle(0, -6 * s, 4 * s);
                g.fillStyle(0x88BBFF, 0.5);
                g.fillCircle(-1 * s, -7 * s, 2 * s);
                g.lineStyle(1 * s, 0xAA66FF, 0.6);
                g.strokeCircle(0, -6 * s, 5 * s);
                break;
            case 'mana_prism':
                // Blue triangular prism
                g.fillStyle(0x2266CC);
                g.fillTriangle(0, -9 * s, -7 * s, 7 * s, 7 * s, 7 * s);
                g.fillStyle(0x4488FF, 0.6);
                g.fillTriangle(0, -6 * s, -4 * s, 5 * s, 4 * s, 5 * s);
                g.fillStyle(0xFFFFFF, 0.3);
                g.fillTriangle(0, -6 * s, -2 * s, 0, 2 * s, 0);
                break;
            case 'thunderlords_decree':
                // Lightning bolt with crown
                g.fillStyle(0xFFDD00);
                g.beginPath();
                g.moveTo(2 * s, -10 * s);
                g.lineTo(-3 * s, -1 * s);
                g.lineTo(1 * s, -1 * s);
                g.lineTo(-2 * s, 10 * s);
                g.lineTo(4 * s, 1 * s);
                g.lineTo(0, 1 * s);
                g.closePath();
                g.fillPath();
                // Crown at top
                g.lineStyle(1.5 * s, 0xFFAA00);
                g.beginPath();
                g.moveTo(-5 * s, -8 * s);
                g.lineTo(-3 * s, -11 * s);
                g.lineTo(0, -8 * s);
                g.lineTo(3 * s, -11 * s);
                g.lineTo(5 * s, -8 * s);
                g.strokePath();
                break;
            default:
                // Fallback: simple diamond
                g.fillStyle(0xffd700);
                g.fillRect(-4 * s, -4 * s, 8 * s, 8 * s);
                break;
        }
    }

    constructor(scene: Phaser.Scene, x: number, y: number, itemData: ItemData) {
        super(scene, x, y);
        this.itemData = itemData;
        const isCursed = itemData.isCursed;
        const rarityGlowColors: Record<string, number> = {
            common: 0xffffff,
            rare: 0x4da6ff,
            epic: 0x9966ff,
            legendary: 0xff6600
        };
        const glowColor = isCursed ? 0xff0000 : (rarityGlowColors[itemData.rarity] || 0xffffff);

        // Glow ring
        const glow = scene.add.graphics();
        glow.fillStyle(glowColor, 0.2);
        glow.fillCircle(0, 0, 20);
        glow.lineStyle(2, glowColor, 0.5);
        glow.strokeCircle(0, 0, 18);
        this.add(glow);

        // Per-item icon
        const icon = scene.add.graphics();
        Item.drawItemIcon(icon, itemData.id, 1);
        this.add(icon);

        // Cursed: jagged red border
        if (isCursed) {
            const curse = scene.add.graphics();
            curse.lineStyle(2, 0xff0000, 0.8);
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const r1 = 14;
                const r2 = 18;
                curse.beginPath();
                curse.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
                curse.lineTo(Math.cos(a + 0.2) * r2, Math.sin(a + 0.2) * r2);
                curse.strokePath();
            }
            this.add(curse);
        }

        // Small sparkle animation (orbiting white dot)
        const sparkle = scene.add.graphics();
        sparkle.fillStyle(0xffffff, 0.9);
        sparkle.fillCircle(14, 0, 2);
        this.add(sparkle);
        scene.tweens.add({
            targets: sparkle,
            rotation: Math.PI * 2,
            duration: 2000,
            repeat: -1,
            ease: 'Linear'
        });
        scene.add.existing(this);
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(50, 50);
        body.setOffset(-25, -25);

        this.setInteractive(new Phaser.Geom.Rectangle(-25, -25, 50, 50), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', (pointer: Phaser.Input.Pointer) => this.showTooltip(pointer))
            .on('pointerout', () => this.hideTooltip());
    }

    private showTooltip(pointer: Phaser.Input.Pointer) {
        const gameScene = this.scene as GameSceneInterface;
        gameScene.showItemTooltip(pointer.worldX, pointer.worldY, this.itemData);
    }

    private hideTooltip() {
        const gameScene = this.scene as GameSceneInterface;
        gameScene.hideTooltip();
    }

    public applyEffect(player: Player) {
        this.itemData.applyEffect(player);
    }
    
    public getItemData(): ItemData {
        return this.itemData;
    }
} 