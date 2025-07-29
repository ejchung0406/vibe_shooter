export interface SkillData {
    description: string;
    damageMultiplier?: number;
}

export class SkillManager {
    private skills: Map<string, SkillData> = new Map();

    constructor() {
        this.initializeSkills();
    }

    private initializeSkills() {
        this.skills.set('Q', {
            description: 'Fires a burst of homing projectiles at nearby enemies.',
            damageMultiplier: 0.6
        });
        this.skills.set('E', {
            description: 'Creates a temporary shield that blocks incoming damage.'
        });
        this.skills.set('R', {
            description: 'Fires a powerful, explosive projectile.',
            damageMultiplier: 1.5
        });
        this.skills.set('F', {
            description: 'Summons a pet that follows you and attacks enemies.'
        });
        this.skills.set('DASH', {
            description: 'Performs a quick dash in the direction of the mouse.'
        });
    }

    public getSkillData(skillId: string): SkillData | undefined {
        return this.skills.get(skillId);
    }
} 