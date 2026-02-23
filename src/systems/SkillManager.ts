import { t } from '../i18n/i18n';

export interface SkillData {
    description: string;
    damageMultiplier?: number;
}

interface SkillDef {
    id: string;
    damageMultiplier?: number;
}

export class SkillManager {
    private skillDefs: SkillDef[] = [
        { id: 'q', damageMultiplier: 0.6 },
        { id: 'e' },
        { id: 'r', damageMultiplier: 1.5 },
        { id: 'f' },
        { id: 'dash' },
    ];

    private skillIdMap: Map<string, SkillDef> = new Map();

    constructor() {
        for (const def of this.skillDefs) {
            this.skillIdMap.set(def.id.toUpperCase(), def);
            this.skillIdMap.set(def.id, def);
        }
    }

    public getSkillData(skillId: string): SkillData | undefined {
        return this.getSkillDataForCharacter(skillId, 'ranged');
    }

    public getSkillDataForCharacter(skillId: string, characterType: 'melee' | 'ranged' | 'mage'): SkillData | undefined {
        const def = this.skillIdMap.get(skillId) || this.skillIdMap.get(skillId.toUpperCase());
        if (!def) return undefined;

        const key = `skill.${def.id}.${characterType}`;
        return {
            description: t(key),
            damageMultiplier: def.damageMultiplier,
        };
    }
}
