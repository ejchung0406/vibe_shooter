import { en } from './en';
import { ko } from './ko';

export type Language = 'en' | 'ko';

const dictionaries: Record<Language, Record<string, string>> = { en, ko };

let currentLang: Language = (localStorage.getItem('volvox_lang') as Language) || 'en';

export function setLang(lang: Language): void {
    currentLang = lang;
    localStorage.setItem('volvox_lang', lang);
}

export function getLang(): Language {
    return currentLang;
}

export function t(key: string, params?: Record<string, string | number>): string {
    let text = dictionaries[currentLang]?.[key] ?? dictionaries.en[key] ?? key;
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{${k}}`, String(v));
        }
    }
    return text;
}
