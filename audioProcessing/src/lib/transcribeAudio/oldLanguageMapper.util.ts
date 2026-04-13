/**
 * Sarvam AI Language Mapping
 *
 * Covers all BCP-47 language codes returned by Sarvam AI's
 * speech-to-text (Saaras v3 / Saarika) and used across its
 * TTS (Bulbul) and translation APIs.
 *
 * Reference: https://docs.sarvam.ai/api-reference-docs/speech-to-text/transcribe
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Every language code Sarvam AI can return or accept. */
export type SarvamLanguageCode =
  | "unknown"
  // Core (Saarika v2.5 + Saaras v3)
  | "hi-IN"   // Hindi
  | "bn-IN"   // Bengali
  | "kn-IN"   // Kannada
  | "ml-IN"   // Malayalam
  | "mr-IN"   // Marathi
  | "od-IN"   // Odia
  | "pa-IN"   // Punjabi
  | "ta-IN"   // Tamil
  | "te-IN"   // Telugu
  | "en-IN"   // English (Indian)
  | "gu-IN"   // Gujarati
  // Extended (Saaras v3 only)
  | "as-IN"   // Assamese
  | "ur-IN"   // Urdu
  | "ne-IN"   // Nepali
  | "kok-IN"  // Konkani
  | "ks-IN"   // Kashmiri
  | "sd-IN"   // Sindhi
  | "sa-IN"   // Sanskrit
  | "mai-IN"  // Maithili
  | "sat-IN"  // Santali
  | "doi-IN"  // Dogri
  | "mni-IN"; // Manipuri (Meitei)

export interface LanguageInfo {
  /** BCP-47 code as returned/accepted by Sarvam AI */
  code: SarvamLanguageCode;
  /** English name of the language */
  name: string;
  /** Native script name */
  nativeName: string;
  /** Unicode script tag */
  script: string;
  /** Whether Bulbul TTS supports this language */
  ttsSupported: boolean;
  /** Whether Saaras v3 STT supports this language */
  sttSupported: boolean;
}

// ─── Map ──────────────────────────────────────────────────────────────────────

const LANGUAGE_MAP: Record<SarvamLanguageCode, LanguageInfo> = {
  unknown: {
    code: "unknown",
    name: "Unknown / Auto-detect",
    nativeName: "Unknown",
    script: "N/A",
    ttsSupported: false,
    sttSupported: true,
  },

  // ── Core languages (Saarika v2.5 + Saaras v3 + Bulbul TTS) ─────────────────

  "hi-IN": {
    code: "hi-IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari",
    ttsSupported: true,
    sttSupported: true,
  },
  "bn-IN": {
    code: "bn-IN",
    name: "Bengali",
    nativeName: "বাংলা",
    script: "Bengali",
    ttsSupported: true,
    sttSupported: true,
  },
  "kn-IN": {
    code: "kn-IN",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    script: "Kannada",
    ttsSupported: true,
    sttSupported: true,
  },
  "ml-IN": {
    code: "ml-IN",
    name: "Malayalam",
    nativeName: "മലയാളം",
    script: "Malayalam",
    ttsSupported: true,
    sttSupported: true,
  },
  "mr-IN": {
    code: "mr-IN",
    name: "Marathi",
    nativeName: "मराठी",
    script: "Devanagari",
    ttsSupported: true,
    sttSupported: true,
  },
  "od-IN": {
    code: "od-IN",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    script: "Odia",
    ttsSupported: true,
    sttSupported: true,
  },
  "pa-IN": {
    code: "pa-IN",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    script: "Gurmukhi",
    ttsSupported: true,
    sttSupported: true,
  },
  "ta-IN": {
    code: "ta-IN",
    name: "Tamil",
    nativeName: "தமிழ்",
    script: "Tamil",
    ttsSupported: true,
    sttSupported: true,
  },
  "te-IN": {
    code: "te-IN",
    name: "Telugu",
    nativeName: "తెలుగు",
    script: "Telugu",
    ttsSupported: true,
    sttSupported: true,
  },
  "en-IN": {
    code: "en-IN",
    name: "English (Indian)",
    nativeName: "English",
    script: "Latin",
    ttsSupported: true,
    sttSupported: true,
  },
  "gu-IN": {
    code: "gu-IN",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    script: "Gujarati",
    ttsSupported: true,
    sttSupported: true,
  },

  // ── Extended languages (Saaras v3 STT only) ──────────────────────────────────

  "as-IN": {
    code: "as-IN",
    name: "Assamese",
    nativeName: "অসমীয়া",
    script: "Bengali",
    ttsSupported: false,
    sttSupported: true,
  },
  "ur-IN": {
    code: "ur-IN",
    name: "Urdu",
    nativeName: "اردو",
    script: "Nastaliq (Perso-Arabic)",
    ttsSupported: false,
    sttSupported: true,
  },
  "ne-IN": {
    code: "ne-IN",
    name: "Nepali",
    nativeName: "नेपाली",
    script: "Devanagari",
    ttsSupported: false,
    sttSupported: true,
  },
  "kok-IN": {
    code: "kok-IN",
    name: "Konkani",
    nativeName: "कोंकणी",
    script: "Devanagari",
    ttsSupported: false,
    sttSupported: true,
  },
  "ks-IN": {
    code: "ks-IN",
    name: "Kashmiri",
    nativeName: "كٲشُر",
    script: "Perso-Arabic / Devanagari",
    ttsSupported: false,
    sttSupported: true,
  },
  "sd-IN": {
    code: "sd-IN",
    name: "Sindhi",
    nativeName: "سنڌي",
    script: "Perso-Arabic / Devanagari",
    ttsSupported: false,
    sttSupported: true,
  },
  "sa-IN": {
    code: "sa-IN",
    name: "Sanskrit",
    nativeName: "संस्कृतम्",
    script: "Devanagari",
    ttsSupported: false,
    sttSupported: true,
  },
  "mai-IN": {
    code: "mai-IN",
    name: "Maithili",
    nativeName: "मैथिली",
    script: "Devanagari / Tirhuta",
    ttsSupported: false,
    sttSupported: true,
  },
  "sat-IN": {
    code: "sat-IN",
    name: "Santali",
    nativeName: "ᱥᱟᱱᱛᱟᱲᱤ",
    script: "Ol Chiki",
    ttsSupported: false,
    sttSupported: true,
  },
  "doi-IN": {
    code: "doi-IN",
    name: "Dogri",
    nativeName: "डोगरी",
    script: "Devanagari",
    ttsSupported: false,
    sttSupported: true,
  },
  "mni-IN": {
    code: "mni-IN",
    name: "Manipuri",
    nativeName: "মৈতৈলোন্",
    script: "Meitei / Bengali",
    ttsSupported: false,
    sttSupported: true,
  },
};

// ─── Class ────────────────────────────────────────────────────────────────────

export class LanguageMapper {
  private readonly map: Record<SarvamLanguageCode, LanguageInfo> = LANGUAGE_MAP;

  // ── Lookups ──────────────────────────────────────────────────────────────────

  /**
   * Returns full `LanguageInfo` for a given code, or `null` if not found.
   *
   * @example
   * mapper.getInfo("pa-IN")
   * // { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", ... }
   */
  getInfo(code: string): LanguageInfo | null {
    return this.map[code as SarvamLanguageCode] ?? null;
  }

  /**
   * Returns the English name for a code, or `null` if not found.
   *
   * @example
   * mapper.getName("pa-IN") // "Punjabi"
   */
  getName(code: string): string | "unknown" {
    return this.getInfo(code)?.name ?? "unknown";
  }

  /**
   * Returns the native-script name for a code, or `null` if not found.
   *
   * @example
   * mapper.getNativeName("pa-IN") // "ਪੰਜਾਬੀ"
   */
  getNativeName(code: string): string | null {
    return this.getInfo(code)?.nativeName ?? null;
  }

  // ── Filtering helpers ────────────────────────────────────────────────────────

  /** All languages that Bulbul TTS supports. */
  getTTSLanguages(): LanguageInfo[] {
    return Object.values(this.map).filter((l) => l.ttsSupported);
  }

  /** All languages that Saaras v3 STT supports (excludes "unknown"). */
  getSTTLanguages(): LanguageInfo[] {
    return Object.values(this.map).filter(
      (l) => l.sttSupported && l.code !== "unknown"
    );
  }

  /** All known language codes (including "unknown"). */
  getAllCodes(): SarvamLanguageCode[] {
    return Object.keys(this.map) as SarvamLanguageCode[];
  }

  // ── Validation ───────────────────────────────────────────────────────────────

  /**
   * Returns `true` if `code` is a known Sarvam AI language code.
   */
  isValid(code: string): code is SarvamLanguageCode {
    return code in this.map;
  }

  /**
   * Parses a raw language code string coming from a Sarvam AI API response.
   * Returns the matching `LanguageInfo`, or throws if the code is unrecognised.
   *
   * @example
   * mapper.parse("pa-IN") // { code: "pa-IN", name: "Punjabi", ... }
   * mapper.parse("xx-XX") // throws Error
   */
  parse(code: string): LanguageInfo {
    const info = this.getInfo(code);
    if (!info) {
      throw new Error(
        `Unrecognised Sarvam AI language code: "${code}". ` +
          `Known codes: ${this.getAllCodes().join(", ")}`
      );
    }
    return info;
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

/** Pre-built singleton — import and use directly without instantiation. */
export const languageMapper = new LanguageMapper();