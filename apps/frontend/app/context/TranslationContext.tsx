'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface Language {
  language: string;
  name?: string;
}

interface TranslationCache {
  [key: string]: string; // key format: "text|targetLanguage"
}

interface TranslationContextType {
  currentLanguage: string;
  setCurrentLanguage: (language: string) => void;
  translate: (text: string, targetLanguage?: string) => Promise<string>;
  translateBatch: (texts: string[], targetLanguage?: string) => Promise<string[]>;
  supportedLanguages: Language[];
  isLoading: boolean;
}

export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const API_BASE_URL = '/api';

// Language name mappings for common languages
const LANGUAGE_NAMES: { [key: string]: string } = {
  en: 'English',
  es: 'Spanish',
  zh: 'Chinese (Simplified)',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  hi: 'Hindi',
  ar: 'Arabic',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  ru: 'Russian',
  it: 'Italian',
  vi: 'Vietnamese',
  th: 'Thai',
  tr: 'Turkish',
  pl: 'Polish',
  nl: 'Dutch',
  id: 'Indonesian',
  uk: 'Ukrainian',
  ro: 'Romanian',
  el: 'Greek',
  cs: 'Czech',
  sv: 'Swedish',
  hu: 'Hungarian',
  da: 'Danish',
  fi: 'Finnish',
  no: 'Norwegian',
  he: 'Hebrew',
  fa: 'Persian',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  ur: 'Urdu',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
};

/**
 * Detects browser language and maps it to a supported language code
 * Prioritizes the first (most preferred) language in navigator.languages
 * @param supportedLanguageCodes - Array of supported language codes
 * @returns Detected language code or 'en' as fallback
 */
const detectBrowserLanguage = (supportedLanguageCodes: string[]): string => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  // Get browser language preferences - navigator.languages is ordered by preference
  // The first language is the most preferred
  const browserLanguages = navigator.languages || [navigator.language || 'en'];
  
  console.log('[Translation] Browser languages (ordered by preference):', browserLanguages);
  
  // Map common browser language codes to our supported codes
  const languageMap: { [key: string]: string } = {
    'es': 'es',           // Spanish
    'es-ES': 'es',        // Spanish (Spain)
    'es-MX': 'es',        // Spanish (Mexico)
    'es-AR': 'es',        // Spanish (Argentina)
    'es-CO': 'es',        // Spanish (Colombia)
    'es-CL': 'es',        // Spanish (Chile)
    'es-PE': 'es',        // Spanish (Peru)
    'es-VE': 'es',        // Spanish (Venezuela)
    'en': 'en',           // English
    'en-US': 'en',        // English (US)
    'en-GB': 'en',        // English (UK)
    'en-CA': 'en',        // English (Canada)
    'en-AU': 'en',        // English (Australia)
    'zh': 'zh',           // Chinese
    'zh-CN': 'zh',        // Chinese (Simplified)
    'zh-TW': 'zh-TW',     // Chinese (Traditional)
    'hi': 'hi',           // Hindi
    'ar': 'ar',           // Arabic
    'fr': 'fr',           // French
    'de': 'de',           // German
    'ja': 'ja',           // Japanese
    'ko': 'ko',           // Korean
    'pt': 'pt',           // Portuguese
    'ru': 'ru',           // Russian
    'it': 'it',           // Italian
    'vi': 'vi',           // Vietnamese
    'th': 'th',           // Thai
    'tr': 'tr',           // Turkish
    'pl': 'pl',           // Polish
    'nl': 'nl',           // Dutch
    'id': 'id',           // Indonesian
    'uk': 'uk',           // Ukrainian
    'ro': 'ro',           // Romanian
    'el': 'el',           // Greek
    'cs': 'cs',           // Czech
    'sv': 'sv',           // Swedish
    'hu': 'hu',           // Hungarian
    'da': 'da',           // Danish
    'fi': 'fi',           // Finnish
    'no': 'no',           // Norwegian
    'he': 'he',           // Hebrew
    'fa': 'fa',           // Persian
    'bn': 'bn',           // Bengali
    'ta': 'ta',           // Tamil
    'te': 'te',           // Telugu
    'mr': 'mr',           // Marathi
    'ur': 'ur',           // Urdu
    'gu': 'gu',           // Gujarati
    'kn': 'kn',           // Kannada
    'ml': 'ml',           // Malayalam
    'pa': 'pa',           // Punjabi
  };

  // Process languages in order of preference (first is most preferred)
  for (const browserLang of browserLanguages) {
    const normalizedLang = browserLang.toLowerCase();
    const langCode = normalizedLang.split('-')[0]; // Get base language code (e.g., 'es' from 'es-MX')
    
    // Try exact match first, then base language code
    const mappedLang = languageMap[normalizedLang] || languageMap[browserLang] || languageMap[langCode];
    
    if (mappedLang && supportedLanguageCodes.includes(mappedLang)) {
      console.log('[Translation] Browser language detected (top preference):', browserLang, '->', mappedLang);
      return mappedLang;
    }
  }

  // Fallback to English
  console.log('[Translation] No matching browser language found, defaulting to English');
  return 'en';
};

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>('en');
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
  const [translationCache, setTranslationCache] = useState<TranslationCache>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load current language from localStorage or detect browser language
  useEffect(() => {
    // Wait for supported languages to be loaded before detecting browser language
    if (supportedLanguages.length === 0) {
      return;
    }

    const supportedCodes = supportedLanguages.map(lang => lang.language);
    const savedLanguage = localStorage.getItem('appLanguage');
    
    if (savedLanguage) {
      // Use saved preference if it exists
      console.log('[Translation] Using saved language from localStorage:', savedLanguage);
      setCurrentLanguageState(savedLanguage);
    } else {
      // No saved preference - detect browser language
      const detectedLanguage = detectBrowserLanguage(supportedCodes);
      console.log('[Translation] No saved language, detected browser language:', detectedLanguage);
      setCurrentLanguageState(detectedLanguage);
      localStorage.setItem('appLanguage', detectedLanguage);
    }
  }, [supportedLanguages]);

  // Fetch supported languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        console.log('[Translation] Fetching supported languages from:', `${API_BASE_URL}/api/translation/languages`);
        const response = await fetch(`${API_BASE_URL}/translation/languages`);
        const data = await response.json();
        
        console.log('[Translation] Languages response:', data);
        
        if (data.success && data.languages) {
          // Add language names to the languages array
          const languagesWithNames = data.languages.map((lang: Language) => ({
            ...lang,
            name: LANGUAGE_NAMES[lang.language] || lang.language.toUpperCase(),
          }));
          
          // Sort by name
          languagesWithNames.sort((a: Language, b: Language) => 
            (a.name || '').localeCompare(b.name || '')
          );
          
          setSupportedLanguages(languagesWithNames);
          console.log('[Translation] Loaded', languagesWithNames.length, 'languages');
        }
      } catch (error) {
        console.error('[Translation] Failed to fetch supported languages:', error);
        // Fallback to common languages
        setSupportedLanguages([
          { language: 'en', name: 'English' },
          { language: 'es', name: 'Spanish' },
          { language: 'zh', name: 'Chinese (Simplified)' },
          { language: 'hi', name: 'Hindi' },
          { language: 'ar', name: 'Arabic' },
          { language: 'fr', name: 'French' },
          { language: 'de', name: 'German' },
          { language: 'ja', name: 'Japanese' },
          { language: 'ko', name: 'Korean' },
        ]);
      }
    };

    fetchLanguages();
  }, []);

  const setCurrentLanguage = useCallback((language: string) => {
    console.log('[Translation] Changing language to:', language);
    setCurrentLanguageState(language);
    localStorage.setItem('appLanguage', language);
  }, []);

  const translate = useCallback(
    async (text: string, targetLanguage?: string): Promise<string> => {
      const target = targetLanguage || currentLanguage;
      
      // If target language is English or same as source, return original text
      if (target === 'en') {
        return text;
      }

      // Check cache first
      const cacheKey = `${text}|${target}`;
      if (translationCache[cacheKey]) {
        console.log('[Translation] Cache hit for:', text.substring(0, 30));
        return translationCache[cacheKey];
      }

      try {
        setIsLoading(true);
        console.log('[Translation] Translating:', text.substring(0, 30), 'to', target);
        const response = await fetch(`${API_BASE_URL}/translation/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            targetLanguage: target,
            sourceLanguage: 'en',
          }),
        });

        const data = await response.json();
        console.log('[Translation] Response:', data);

        if (data.success && data.translatedText) {
          // Update cache
          setTranslationCache((prev) => ({
            ...prev,
            [cacheKey]: data.translatedText,
          }));
          console.log('[Translation] Success:', text.substring(0, 30), '->', data.translatedText.substring(0, 30));
          return data.translatedText;
        } else {
          console.error('[Translation] Translation failed:', data.error);
          return text; // Return original text on failure
        }
      } catch (error) {
        console.error('[Translation] Translation error:', error);
        return text; // Return original text on error
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage, translationCache]
  );

  const translateBatch = useCallback(
    async (texts: string[], targetLanguage?: string): Promise<string[]> => {
      const target = targetLanguage || currentLanguage;
      
      console.log('[Translation] translateBatch called with', texts.length, 'texts, target:', target);
      
      // If target language is English, return original texts
      if (target === 'en') {
        console.log('[Translation] Target is English, returning original texts');
        return texts;
      }

      // Check which texts need translation
      const textsToTranslate: string[] = [];
      const cachedResults: { [index: number]: string } = {};

      texts.forEach((text, index) => {
        const cacheKey = `${text}|${target}`;
        if (translationCache[cacheKey]) {
          cachedResults[index] = translationCache[cacheKey];
        } else {
          textsToTranslate.push(text);
        }
      });

      console.log('[Translation] Cache hits:', Object.keys(cachedResults).length, 'Need to translate:', textsToTranslate.length);

      // If all texts are cached, return them
      if (textsToTranslate.length === 0) {
        console.log('[Translation] All texts cached, returning from cache');
        return texts.map((text, index) => cachedResults[index]);
      }

      try {
        setIsLoading(true);
        console.log('[Translation] Sending batch request to:', `${API_BASE_URL}/translation/batch`);
        const response = await fetch(`${API_BASE_URL}/translation/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            texts: textsToTranslate,
            targetLanguage: target,
            sourceLanguage: 'en',
          }),
        });

        const data = await response.json();
        console.log('[Translation] Batch response:', data);

        if (data.success && data.translations) {
          // Update cache with new translations
          const newCache: TranslationCache = {};
          textsToTranslate.forEach((text, index) => {
            const cacheKey = `${text}|${target}`;
            newCache[cacheKey] = data.translations[index].translatedText;
          });
          
          setTranslationCache((prev) => ({ ...prev, ...newCache }));

          // Merge cached and new translations
          let translationIndex = 0;
          const results = texts.map((text, index) => {
            if (cachedResults[index]) {
              return cachedResults[index];
            } else {
              return data.translations[translationIndex++].translatedText;
            }
          });
          
          console.log('[Translation] Batch translation complete, returning', results.length, 'results');
          return results;
        } else if (data.translations && Array.isArray(data.translations)) {
          // Handle partial failures - use successful translations, fall back to original for failed ones
          console.warn('[Translation] Some translations failed, using successful ones and falling back to original text for failures');
          const newCache: TranslationCache = {};
          let translationIndex = 0;
          const results = texts.map((text, index) => {
            if (cachedResults[index]) {
              return cachedResults[index];
            } else {
              const translation = data.translations[translationIndex++];
              if (translation && translation.translatedText) {
                const cacheKey = `${text}|${target}`;
                newCache[cacheKey] = translation.translatedText;
                return translation.translatedText;
              } else {
                // Check if we have results array with error info
                const result = data.results && data.results[translationIndex - 1];
                if (result && !result.success) {
                  console.warn('[Translation] Translation failed for:', text.substring(0, 30), 'Error:', result.error, 'using original text');
                } else {
                  console.warn('[Translation] Translation missing for:', text.substring(0, 30), 'using original text');
                }
                return text; // Fall back to original text
              }
            }
          });
          
          // Update cache with successful translations
          if (Object.keys(newCache).length > 0) {
            setTranslationCache((prev) => ({ ...prev, ...newCache }));
          }
          
          return results;
        } else {
          console.error('[Translation] Batch translation failed:', data.error || 'Unknown error');
          return texts; // Return original texts on failure
        }
      } catch (error) {
        console.error('[Translation] Batch translation error:', error);
        return texts; // Return original texts on error
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage, translationCache]
  );

  return (
    <TranslationContext.Provider
      value={{
        currentLanguage,
        setCurrentLanguage,
        translate,
        translateBatch,
        supportedLanguages,
        isLoading,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

