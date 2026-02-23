import Phaser from 'phaser';
import { BasePlayer } from '../entities/BasePlayer';
import { Upgrade } from './UpgradeManager';

interface SynergyDefinition {
    id: string;
    name: string;
    description: string;
    tags: string[];
    threshold: number;
    color: number;
    applied: boolean;
    apply: (player: BasePlayer) => void;
    remove: (player: BasePlayer) => void;
}

export class SynergyManager {
    private scene: Phaser.Scene;
    private synergies: SynergyDefinition[];
    private synergyIcons: Phaser.GameObjects.Container[] = [];
    private tagCounts: Map<string, number> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        this.synergies = [
            {
                id: 'crit_synergy',
                name: 'Crit Synergy',
                description: '+20% crit chance, crits cause small AoE',
                tags: ['crit'],
                threshold: 3,
                color: 0xFF4444,
                applied: false,
                apply: (player) => {
                    player.setCriticalStrikeChance(player.getCriticalStrikeChance() + 0.2);
                },
                remove: (player) => {
                    player.setCriticalStrikeChance(player.getCriticalStrikeChance() - 0.2);
                }
            },
            {
                id: 'speed_synergy',
                name: 'Speed Synergy',
                description: '+1 extra projectile from speed',
                tags: ['speed', 'attack_speed'],
                threshold: 3,
                color: 0x44FF44,
                applied: false,
                apply: (player) => {
                    player.increaseProjectileCount(1);
                },
                remove: (player) => {
                    player.decreaseProjectileCount(1);
                }
            },
            {
                id: 'tank_synergy',
                name: 'Tank Synergy',
                description: 'Regenerate 2% max HP/s',
                tags: ['health', 'armor'],
                threshold: 3,
                color: 0x4444FF,
                applied: false,
                apply: (player) => {
                    player.setHealthRegen(0.02);
                },
                remove: (player) => {
                    player.setHealthRegen(0);
                }
            },
            {
                id: 'damage_synergy',
                name: 'Damage Synergy',
                description: '+50% attack damage multiplier',
                tags: ['damage', 'bleed'],
                threshold: 3,
                color: 0xFF8800,
                applied: false,
                apply: (player) => {
                    player.increaseAttackDamageMultiplier(0.5);
                },
                remove: (player) => {
                    player.decreaseAttackDamageMultiplier(0.5);
                }
            }
        ];
    }

    public checkSynergies(appliedUpgrades: Upgrade[], player: BasePlayer) {
        // Count tags from upgrades
        this.tagCounts.clear();
        for (const upgrade of appliedUpgrades) {
            const tags = this.getUpgradeTags(upgrade);
            for (const tag of tags) {
                this.tagCounts.set(tag, (this.tagCounts.get(tag) || 0) + 1);
            }
        }

        // Check each synergy
        for (const synergy of this.synergies) {
            const totalCount = synergy.tags.reduce((sum, tag) => sum + (this.tagCounts.get(tag) || 0), 0);

            if (totalCount >= synergy.threshold && !synergy.applied) {
                synergy.applied = true;
                synergy.apply(player);
                this.showSynergyActivation(synergy);
                this.updateSynergyUI();
            } else if (totalCount < synergy.threshold && synergy.applied) {
                synergy.applied = false;
                synergy.remove(player);
                this.updateSynergyUI();
            }
        }
    }

    private getUpgradeTags(upgrade: Upgrade): string[] {
        const id = upgrade.id.toLowerCase();
        const tags: string[] = [];

        if (id.includes('critical') || id.includes('crit')) tags.push('crit');
        if (id.includes('rapid') || id.includes('lightning') || id.includes('speed')) tags.push('speed');
        if (id.includes('attack_speed') || id.includes('rapid_fire')) tags.push('attack_speed');
        if (id.includes('hp') || id.includes('health') || id.includes('heal')) tags.push('health');
        if (id.includes('armor')) tags.push('armor');
        if (id.includes('damage') || id.includes('power') || id.includes('mega')) tags.push('damage');
        if (id.includes('bleed') || id.includes('bleeding')) tags.push('bleed');

        return tags;
    }

    private showSynergyActivation(synergy: SynergyDefinition) {
        const screenWidth = this.scene.scale.width;

        const text = this.scene.add.text(screenWidth / 2, 250, `SYNERGY: ${synergy.name}!`, {
            fontSize: '36px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#' + synergy.color.toString(16).padStart(6, '0'),
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);

        const desc = this.scene.add.text(screenWidth / 2, 290, synergy.description, {
            fontSize: '18px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);

        this.scene.tweens.add({
            targets: [text, desc],
            alpha: 0,
            y: '-=60',
            duration: 3000,
            delay: 1000,
            onComplete: () => {
                text.destroy();
                desc.destroy();
            }
        });
    }

    private updateSynergyUI() {
        // Clear old icons
        this.synergyIcons.forEach(icon => icon.destroy());
        this.synergyIcons = [];

        const screenWidth = this.scene.scale.width;
        let offsetX = 0;

        for (const synergy of this.synergies) {
            if (synergy.applied) {
                const container = this.scene.add.container(screenWidth - 40 - offsetX, 60)
                    .setScrollFactor(0).setDepth(1000);

                const bg = this.scene.add.circle(0, 0, 15, synergy.color, 0.6);
                bg.setStrokeStyle(2, 0xffffff);

                const initial = this.scene.add.text(0, 0, synergy.name[0], {
                    fontSize: '14px',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }).setOrigin(0.5);

                container.add([bg, initial]);
                container.setSize(30, 30);
                container.setInteractive();
                container.on('pointerover', () => {
                    const tooltip = this.scene.add.text(container.x - 10, container.y + 20, `${synergy.name}\n${synergy.description}`, {
                        fontSize: '14px',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        color: '#ffffff',
                        backgroundColor: '#000000',
                        padding: { x: 5, y: 3 }
                    }).setOrigin(1, 0).setScrollFactor(0).setDepth(5000);
                    container.setData('tooltip', tooltip);
                });
                container.on('pointerout', () => {
                    const tooltip = container.getData('tooltip');
                    if (tooltip) tooltip.destroy();
                });

                this.synergyIcons.push(container);
                offsetX += 35;
            }
        }
    }

    public getActiveSynergies(): string[] {
        return this.synergies.filter(s => s.applied).map(s => s.name);
    }
}
