import { DICTIONARIES, type Lang } from './translations';
import { useGameStore } from '../state/store';

export { LANGUAGES, type Lang } from './translations';

type Params = Record<string, string | number>;

/** The device language if we ship it, otherwise English. */
export function detectLanguage(): Lang {
  let tag = 'en';
  try {
    tag = Intl.DateTimeFormat().resolvedOptions().locale || 'en';
  } catch {
    // keep default
  }
  const base = tag.slice(0, 2).toLowerCase();
  return base in DICTIONARIES ? (base as Lang) : 'en';
}

/** Looks a key up in `lang` (falling back to French, then to the key
 * itself), picks the `_one` / `_other` variant when `params.n` is given
 * and such variants exist, and fills `{placeholders}`. */
export function translate(lang: Lang, key: string, params?: Params): string {
  const dict = DICTIONARIES[lang];
  let resolved = key;
  if (params && typeof params.n === 'number') {
    const pluralKey = `${key}_${params.n === 1 ? 'one' : 'other'}`;
    if (dict[pluralKey] !== undefined || DICTIONARIES.fr[pluralKey] !== undefined) resolved = pluralKey;
  }
  let text = dict[resolved] ?? DICTIONARIES.fr[resolved] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

/** The language in effect: the player's explicit choice, or the device's. */
export function useLanguage(): Lang {
  const chosen = useGameStore((s) => s.language);
  return chosen ?? detectLanguage();
}

/** Hook returning `t(key, params)` bound to the current language; the
 * calling component re-renders when the player switches language. */
export function useT() {
  const lang = useLanguage();
  return (key: string, params?: Params) => translate(lang, key, params);
}
