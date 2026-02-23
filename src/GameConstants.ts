import { Rarity } from './entities/Item';

export const RARITY_WEIGHTS: Record<Rarity, number> = {
    common: 10,
    rare: 5,
    epic: 2,
    legendary: 1,
};

export const ENEMY_HP_SCALING: Record<number, number> = {
    1: 30, 2: 200, 3: 500, 4: 1200, 5: 3000,
    6: 6000, 7: 12000, 8: 24000, 9: 48000, 10: 96000,
    11: 192000, 12: 384000, 13: 768000, 14: 1536000, 15: 3072000,
};

export const XP_WAVE_MULTIPLIERS: Record<number, number> = {
    1: 1.0, 2: 1.05, 3: 1.1, 4: 1.15, 5: 1.2,
    6: 1.25, 7: 1.3, 8: 1.35, 9: 1.4, 10: 1.45,
    11: 1.5,
};

export const MAP_SIZE = 5000;
export const SPAWN_DISTANCE = 700;
export const MAX_ENEMIES_ON_SCREEN = 20;
export const ENEMY_DETECTION_RADIUS = 800;
export const DESPAWN_TIME = 30000;
export const DESPAWN_DISTANCE = 1500;

export function getWaveDamageMultiplier(waveNumber: number): number {
    if (waveNumber >= 7) return 3.0 + (waveNumber - 6) * 2;
    if (waveNumber >= 3) return 1.0 + (waveNumber - 2) * 0.5;
    return 1.0;
}
