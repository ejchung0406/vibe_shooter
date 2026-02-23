export type PlayerStatName =
    | 'bonusAttackDamage'
    | 'attackDamageMultiplier'
    | 'attackSpeed'
    | 'projectileSpeed'
    | 'criticalStrikeDamage'
    | 'maxHealth'
    | 'moveSpeed'
    | 'projectileCount'
    | 'healthRegen'
    | 'lifeSteal'
    | 'hasAegis'
    | 'armor'
    | 'criticalStrikeChance'
    | 'maxMana'
    | 'manaRegen';

export type StatOp = 'add' | 'multiply' | 'set';
