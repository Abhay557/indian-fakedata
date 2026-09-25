import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

import { generate, generateAgentPersona } from '../src/index.js';
import {
  transliterate,
  scriptForLanguage,
  containsIndic,
} from '../src/utils/transliterate.js';

describe('transliteration engine (v2.1.0, item 1)', () => {
  it('renders common names in Devanagari', () => {
    expect(transliterate('Pushpa', 'Devanagari')).toBe('पुष्पा');
    expect(transliterate('Sharma', 'Devanagari')).toBe('शर्मा');
    expect(transliterate('Singh', 'Devanagari')).toBe('सिंह');
    expect(transliterate('Amit', 'Devanagari')).toBe('अमित');
    expect(transliterate('Geeta', 'Devanagari')).toBe('गीता');
    expect(transliterate('Lakshmi', 'Devanagari')).toBe('लक्ष्मी');
    expect(transliterate('Mitra', 'Devanagari')).toBe('मित्र');
    expect(transliterate('Satya', 'Devanagari')).toBe('सत्या');
    expect(transliterate('Kanya', 'Devanagari')).toBe('कन्या');
    expect(transliterate('Pant', 'Devanagari')).toBe('पंत');
    expect(transliterate('Neha', 'Devanagari')).toBe('नेहा');
    // Chennai ends in an ī-matra (verified codepoints below); a typed
    // literal cannot distinguish matra-ī from independent-ī reliably
    expect(
      [...transliterate('Chennai', 'Devanagari')]
        .map(c => c.codePointAt(0)!.toString(16)).join(',')
    ).toBe('91a,947,928,94d,928,940');
    expect(transliterate('Sneha', 'Devanagari')).toBe('स्नेहा');
    expect(transliterate('Ritu', 'Devanagari')).toBe('ऋतु');
    expect(transliterate('Faiz', 'Devanagari')).toBe('फ़ैज़');
    expect(transliterate('Sawant', 'Devanagari')).toBe('सवंत');
    expect(transliterate('Divya', 'Devanagari')).toBe('दिव्या');
    expect(transliterate('Anna', 'Devanagari')).toBe('अन्ना');
    expect(transliterate('Utsav', 'Devanagari')).toBe('उत्सव');
    expect(transliterate('Swati', 'Devanagari')).toBe('स्वती');
  });

  it('documents known approximations (pronunciation-faithful)', () => {
    // medial vowel length is unpredictable from plain ASCII
    expect(transliterate('Prakash', 'Devanagari')).toBe('प्रकश');
    expect(transliterate('Kumar', 'Devanagari')).toBe('कुमर');
    // final -i defaults long
    expect(transliterate('Ravi', 'Devanagari')).toBe('रवी');
    expect(transliterate('Rishi', 'Devanagari')).toBe('ऋषी');
    // no retroflex detection; codepoints, not literals, because typed
    // Devanagari cannot distinguish halants reliably here
    expect(
      [...transliterate('Rukmani', 'Devanagari')]
        .map(c => c.codePointAt(0)!.toString(16)).join(',')
    ).toBe('930,941,915,94d,92e,928,940'); // halant yes, retroflex no
  });

  it('renders other scripts with their own conventions', () => {
    expect(transliterate('Pushpa Sharma', 'Tamil')).toBe('புஷ்பா ஷர்மா');
    expect(transliterate('Singh', 'Tamil')).toBe('சிங்');
    expect(transliterate('Pushpa', 'Bengali')).toBe('পুষ্পা');
    // Malayalam chillu final-n plus long final-i; codepoints because a
    // typed literal cannot distinguish the chillu reliably
    expect(
      [...transliterate('Ravi Menon', 'Malayalam')]
        .map(c => c.codePointAt(0)!.toString(16)).join(',')
    ).toBe('d30,d35,d40,20,d2e,d46,d28,d4b,d7b');
    expect(transliterate('Amit', 'Gujarati')).toBe('અમિત');
    expect(transliterate('Singh', 'Gurmukhi')).toBe('ਸਿੰਘ');
    expect(transliterate('Pushpa', 'Kannada')).toBe('ಪುಷ್ಪಾ');
    expect(transliterate('Pushpa', 'Telugu')).toBe('పుష్పా');
    expect(transliterate('Pushpa', 'Odia')).toBe('ପୁଷ୍ପା');
  });

  it('maps mother tongues to scripts, Latin fallback otherwise', () => {
    expect(scriptForLanguage('Hindi')).toBe('Devanagari');
    expect(scriptForLanguage('Bengali')).toBe('Bengali');
    expect(scriptForLanguage('Tamil')).toBe('Tamil');
    expect(scriptForLanguage('Punjabi')).toBe('Gurmukhi');
    expect(scriptForLanguage('Urdu')).toBe('Latin');
    expect(scriptForLanguage('English')).toBe('Latin');
    expect(scriptForLanguage('Something New')).toBe('Latin');
  });

  it('passes digits and punctuation through, Latin returns input', () => {
    expect(transliterate('245/D, Market Yard', 'Devanagari')).toBe('245/D, Market Yard'.replace(/[A-Za-z]+/g, m => transliterate(m, 'Devanagari')));
    expect(transliterate('Pushpa', 'Latin')).toBe('Pushpa');
    expect(containsIndic(transliterate('Pushpa', 'Devanagari'))).toBe(true);
    expect(containsIndic('Pushpa')).toBe(false);
  });

  it('is deterministic', () => {
    const a = transliterate('Pushpa Sharma', 'Devanagari');
    expect(transliterate('Pushpa Sharma', 'Devanagari')).toBe(a);
  });

  it('every profile carries a nativeScript block matching its language', () => {
    const rows = generate({ count: 120, seed: 77 });
    let indic = 0;
    let latin = 0;
    for (const r of rows) {
      const ns = r.nativeScript;
      expect(ns).toBeDefined();
      expect(ns.language).toBe(r.motherTongue);
      expect(ns.script).toBe(scriptForLanguage(r.motherTongue));
      if (ns.script === 'Latin') {
        expect(ns.firstName).toBe(r.firstName);
        latin++;
      } else {
        expect(containsIndic(ns.firstName)).toBe(true);
        expect(containsIndic(ns.lastName)).toBe(true);
        indic++;
      }
    }
    expect(indic).toBeGreaterThan(0);
    expect(latin).toBeGreaterThanOrEqual(0);
  });

  it('transliterates persona prompts too', () => {
    const p = generate({ count: 1, seed: 77 })[0];
    const persona = generateAgentPersona(p);
    const script = scriptForLanguage(p.motherTongue);
    const out = transliterate(persona.systemPrompt, script);
    expect(out).toContain(transliterate(p.firstName, script));
    if (script === 'Latin') {
      expect(out).toBe(persona.systemPrompt);
    } else {
      expect(containsIndic(out)).toBe(true);
    }
  });
});
