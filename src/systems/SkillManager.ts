export interface SkillData {
    description: string;
    damageMultiplier?: number;
    meleeDescription?: string; // Character-specific description for melee players
    rangedDescription?: string; // Character-specific description for ranged players
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
            damageMultiplier: 0.6
        });
        this.skills.set('E', {
            description: 'Creates a temporary shield that blocks incoming damage.',
            rangedDescription: 'Creates a temporary shield that blocks incoming damage.',
            meleeDescription: 'Creates a temporary shield that blocks incoming damage. Can heal if upgraded.'
        });
        this.skills.set('R', {
            description: 'Fires a powerful, explosive projectile.',
            rangedDescription: 'Fires a powerful, explosive projectile.',
            meleeDescription: 'Creates a large AoE attack that damages and applies bleeding to all enemies.',
            damageMultiplier: 1.5
        });
        this.skills.set('F', {
            description: 'Summons a pet that follows you and attacks enemies.',
            rangedDescription: 'Summons a pet that follows you and attacks enemies.',
            meleeDescription: 'Summons a pet that follows you and attacks enemies.'
        });
        this.skills.set('DASH', {
            description: 'Performs a quick dash in the direction of the mouse.',
            rangedDescription: 'Performs a quick dash in the direction of the mouse.',
            meleeDescription: 'Performs a quick dash in the direction of the mouse.'
        });
    }

    public getSkillData(skillId: string): SkillData | undefined {
        return this.skills.get(skillId);
    }

    public getSkillDataForCharacter(skillId: string, characterType: 'melee' | 'ranged'): SkillData | undefined {
        const baseSkillData = this.skills.get(skillId);
        if (!baseSkillData) return undefined;

        // Create a copy of the skill data with character-specific description
        const characterSkillData = { ...baseSkillData };
        
        if (characterType === 'melee' && baseSkillData.meleeDescription) {
            characterSkillData.description = baseSkillData.meleeDescription;
        } else if (characterType === 'ranged' && baseSkillData.rangedDescription) {
            characterSkillData.description = baseSkillData.rangedDescription;
        }
        
        return characterSkillData;
    }
} 