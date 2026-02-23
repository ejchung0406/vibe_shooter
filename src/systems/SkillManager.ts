export interface SkillData {
    description: string;
    damageMultiplier?: number;
    meleeDescription?: string;
    rangedDescription?: string;
    mageDescription?: string;
}

export class SkillManager {
    private skills: Map<string, SkillData> = new Map();

    constructor() {
        this.initializeSkills();
    }

    private initializeSkills() {
        this.skills.set('Q', {
            description: 'Fires a burst of homing projectiles at nearby enemies.',
            rangedDescription: 'Fires a burst of homing projectiles at nearby enemies.',
            meleeDescription: 'Creates an AoE explosion around you that damages all nearby enemies. Closer enemies take 50% bonus damage. Applies bleeding to boss enemies.',
            mageDescription: 'Chain Lightning — strikes the nearest enemy, then arcs to nearby targets. Each chain deals reduced damage.',
            damageMultiplier: 0.6
        });
        this.skills.set('E', {
            description: 'Creates a temporary shield that blocks incoming damage.',
            rangedDescription: 'Creates a temporary shield that blocks incoming damage.',
            meleeDescription: 'Creates a temporary shield that blocks incoming damage. Can heal if upgraded.',
            mageDescription: 'Creates a temporary arcane shield that blocks incoming damage.'
        });
        this.skills.set('R', {
            description: 'Fires a powerful, explosive projectile.',
            rangedDescription: 'Fires a powerful, explosive projectile.',
            meleeDescription: 'Creates a large AoE attack that damages and applies bleeding to all enemies.',
            mageDescription: 'Meteor Storm — rains meteors around the cursor position, each dealing AoE damage on impact.',
            damageMultiplier: 1.5
        });
        this.skills.set('F', {
            description: 'Summons a pet that follows you and attacks enemies.',
            rangedDescription: 'Summons a pet that follows you and attacks enemies.',
            meleeDescription: 'Summons a pet that follows you and attacks enemies.',
            mageDescription: 'Summons an arcane familiar that follows you and attacks enemies.'
        });
        this.skills.set('DASH', {
            description: 'Performs a quick dash in the direction of the mouse.',
            rangedDescription: 'Performs a quick dash in the direction of the mouse.',
            meleeDescription: 'Performs a quick dash in the direction of the mouse.',
            mageDescription: 'Blink — teleport a short distance in the direction of the mouse.'
        });
    }

    public getSkillData(skillId: string): SkillData | undefined {
        return this.skills.get(skillId);
    }

    public getSkillDataForCharacter(skillId: string, characterType: 'melee' | 'ranged' | 'mage'): SkillData | undefined {
        const baseSkillData = this.skills.get(skillId);
        if (!baseSkillData) return undefined;

        const characterSkillData = { ...baseSkillData };

        if (characterType === 'mage' && baseSkillData.mageDescription) {
            characterSkillData.description = baseSkillData.mageDescription;
        } else if (characterType === 'melee' && baseSkillData.meleeDescription) {
            characterSkillData.description = baseSkillData.meleeDescription;
        } else if (characterType === 'ranged' && baseSkillData.rangedDescription) {
            characterSkillData.description = baseSkillData.rangedDescription;
        }

        return characterSkillData;
    }
} 