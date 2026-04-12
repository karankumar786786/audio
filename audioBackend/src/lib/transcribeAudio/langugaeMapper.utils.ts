/**
 * AssemblyAI Language Mapping
 *
 * Covers language codes supported by AssemblyAI's
 * speech-to-text models (Universal-1, Universal-2, Universal-3).
 *
 * Reference: https://www.assemblyai.com/docs/concepts/supported-languages
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Language codes supported by AssemblyAI */
export type LanguageCode =
  | "unknown"
  | "hi"    // Hindi
  | "bn"    // Bengali
  | "kn"    // Kannada
  | "ml"    // Malayalam
  | "mr"    // Marathi
  | "or"    // Odia
  | "pa"    // Punjabi
  | "ta"    // Tamil
  | "te"    // Telugu
  | "en"    // English
  | "gu"    // Gujarati
  | "as"    // Assamese
  | "ur"    // Urdu
  | "ne"    // Nepali
  | "gom"   // Konkani
  | "ks"    // Kashmiri
  | "sd"    // Sindhi
  | "sa"    // Sanskrit
  | "mai"   // Maithili
  | "sat"   // Santali
  | "doi"   // Dogri
  | "mni";  // Manipuri

export interface LanguageInfo {
  /** ISO 639-1 code (or similar) used by AssemblyAI */
  code: LanguageCode;
  /** English name of the language */
  name: string;
  /** Native script name */
  nativeName: string;
  /** Unicode script tag */
  script: string;
}

// ─── Map ──────────────────────────────────────────────────────────────────────

const LANGUAGE_MAP: Record<LanguageCode, LanguageInfo> = {
  unknown: {
    code: "unknown",
    name: "Unknown / Auto-detect",
    nativeName: "Unknown",
    script: "N/A",
  },

  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari",
  },
  bn: {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    script: "Bengali",
  },
  kn: {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡೆ",
    script: "Kannada",
  },
  ml: {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    script: "Malayalam",
  },
  mr: {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    script: "Devanagari",
  },
  or: {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    script: "Odia",
  },
  pa: {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    script: "Gurmukhi",
  },
  ta: {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    script: "Tamil",
  },
  te: {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    script: "Telugu",
  },
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    script: "Latin",
  },
  gu: {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    script: "Gujarati",
  },
  as: {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    script: "Bengali",
  },
  ur: {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    script: "Nastaliq",
  },
  ne: {
    code: "ne",
    name: "Nepali",
    nativeName: "नेपाली",
    script: "Devanagari",
  },
  gom: {
    code: "gom",
    name: "Konkani",
    nativeName: "कोंकणी",
    script: "Devanagari",
  },
  ks: {
    code: "ks",
    name: "Kashmiri",
    nativeName: "كٲشُر",
    script: "Perso-Arabic",
  },
  sd: {
    code: "sd",
    name: "Sindhi",
    nativeName: "سنڌي",
    script: "Perso-Arabic",
  },
  sa: {
    code: "sa",
    name: "Sanskrit",
    nativeName: "संस्कृतम्",
    script: "Devanagari",
  },
  mai: {
    code: "mai",
    name: "Maithili",
    nativeName: "मैथिली",
    script: "Devanagari",
  },
  sat: {
    code: "sat",
    name: "Santali",
    nativeName: "ᱥᱟᱱᱛᱟᱲᱤ",
    script: "Ol Chiki",
  },
  doi: {
    code: "doi",
    name: "Dogri",
    nativeName: "डोगरी",
    script: "Devanagari",
  },
  mni: {
    code: "mni",
    name: "Manipuri",
    nativeName: "মৈতৈলোন্",
    script: "Meitei",
  },
};

// ─── Class ────────────────────────────────────────────────────────────────────

export class LanguageMapper {
  private readonly map: Record<LanguageCode, LanguageInfo> = LANGUAGE_MAP;

  /**
   * Returns full `LanguageInfo` for a given code, or `null` if not found.
   */
  getInfo(code: string): LanguageInfo | null {
    return this.map[code as LanguageCode] ?? null;
  }

  /**
   * Returns the English name for a code, or "unknown" if not found.
   */
  getName(code: string): string {
    return this.getInfo(code)?.name ?? "unknown";
  }

  /**
   * Returns the native-script name for a code, or null if not found.
   */
  getNativeName(code: string): string | null {
    return this.getInfo(code)?.nativeName ?? null;
  }

  /** All known language codes (including "unknown"). */
  getAllCodes(): LanguageCode[] {
    return Object.keys(this.map) as LanguageCode[];
  }

  /**
   * Returns `true` if `code` is a known language code.
   */
  isValid(code: string): code is LanguageCode {
    return code in this.map;
  }

  /**
   * Parses a raw language code string coming from an API response.
   * Returns the matching `LanguageInfo`, or throws if unknown.
   */
  parse(code: string): LanguageInfo {
    const info = this.getInfo(code);
    if (!info) {
      throw new Error(
        `Unrecognised language code: "${code}". ` +
          `Known codes: ${this.getAllCodes().join(", ")}`
      );
    }
    return info;
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

/** Pre-built singleton — import and use directly without instantiation. */
export const languageMapper = new LanguageMapper();