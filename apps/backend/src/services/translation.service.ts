import axios from 'axios';

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || '';
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

/**
 * Translate text from one language to another using Google Translate API
 * @param text - The text to translate
 * @param targetLanguage - Target language code (e.g., 'es', 'fr')
 * @param sourceLanguage - Optional source language code (auto-detected if not provided)
 * @returns Object with success status, translated text, and detected source language
 */
export const translateText = async (
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
) => {
  try {
    const response = await axios.post(
      GOOGLE_TRANSLATE_URL,
      {},
      {
        params: {
          q: text,
          target: targetLanguage,
          ...(sourceLanguage && { source: sourceLanguage }),
          key: GOOGLE_TRANSLATE_API_KEY,
        },
      }
    );

    return {
      success: true,
      translatedText: response.data.data.translations[0].translatedText,
      detectedSourceLanguage: response.data.data.translations[0].detectedSourceLanguage,
    };
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    console.error('Translation API Error:', err.response?.data || err.message);
    return {
      success: false,
      error: err.response?.data?.error?.message || 'Translation failed',
    };
  }
};

/**
 * Detect the language of the provided text using Google Translate API
 * @param text - The text to analyze
 * @returns Object with success status, detected language code, and confidence score
 */
export const detectLanguage = async (text: string) => {
  try {
    const response = await axios.post(
      `${GOOGLE_TRANSLATE_URL}/detect`,
      {},
      {
        params: {
          q: text,
          key: GOOGLE_TRANSLATE_API_KEY,
        },
      }
    );

    return {
      success: true,
      language: response.data.data.detections[0][0].language,
      confidence: response.data.data.detections[0][0].confidence,
    };
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    console.error('Language Detection Error:', err.response?.data || err.message);
    return {
      success: false,
      error: err.response?.data?.error?.message || 'Language detection failed',
    };
  }
};

/**
 * Get list of all languages supported by Google Translate API
 * @returns Object with success status and array of supported languages
 */
export const getSupportedLanguages = async () => {
  try {
    const response = await axios.get(`${GOOGLE_TRANSLATE_URL}/languages`, {
      params: {
        key: GOOGLE_TRANSLATE_API_KEY,
      },
    });

    return {
      success: true,
      languages: response.data.data.languages,
    };
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    console.error('Get Languages Error:', err.response?.data || err.message);
    return {
      success: false,
      error: err.response?.data?.error?.message || 'Failed to fetch supported languages',
    };
  }
};
