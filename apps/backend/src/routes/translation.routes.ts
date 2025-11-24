import { Router, Request, Response } from 'express';
import { translateText, detectLanguage, getSupportedLanguages } from '../services/translation.service';

const router = Router();

// POST /api/translation/translate
router.post('/translate', async (req: Request, res: Response) => {
  const { text, targetLanguage, sourceLanguage } = req.body;

  if (!text || !targetLanguage) {
    return res.status(400).json({
      error: 'Missing required fields: text and targetLanguage',
    });
  }

  const result = await translateText(text, targetLanguage, sourceLanguage);

  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

// POST /api/translation/detect
router.post('/detect', async (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      error: 'Missing required field: text',
    });
  }

  const result = await detectLanguage(text);

  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

// GET /api/translation/languages
router.get('/languages', async (_req: Request, res: Response) => {
  const result = await getSupportedLanguages();

  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

// POST /api/translation/batch - Translate multiple texts at once
router.post('/batch', async (req: Request, res: Response) => {
  const { texts, targetLanguage, sourceLanguage } = req.body;

  if (!texts || !Array.isArray(texts) || texts.length === 0 || !targetLanguage) {
    return res.status(400).json({
      error: 'Missing required fields: texts (array) and targetLanguage',
    });
  }

  try {
    const results = await Promise.all(
      texts.map((text: string) => translateText(text, targetLanguage, sourceLanguage))
    );

    const allSuccess = results.every((result) => result.success);
    const successCount = results.filter((result) => result.success).length;

    if (allSuccess) {
      return res.json({
        success: true,
        translations: results.map((result) => ({
          translatedText: result.translatedText,
          detectedSourceLanguage: result.detectedSourceLanguage,
        })),
      });
    } else {
      // Return partial results - maintain order, frontend will handle failures
      console.warn(`[Translation] Batch translation: ${successCount}/${results.length} succeeded`);
      return res.json({
        success: successCount > 0, // Consider it successful if at least one translation worked
        translations: results.map((result) => 
          result.success 
            ? {
                translatedText: result.translatedText,
                detectedSourceLanguage: result.detectedSourceLanguage,
              }
            : null // Keep null to maintain order
        ),
        results, // Include full results for error handling
        partial: true, // Indicate this is a partial success
        error: successCount === 0 ? 'All translations failed' : `Some translations failed (${successCount}/${results.length} succeeded)`,
      });
    }
  } catch (error) {
    console.error('[Translation] Batch translation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Batch translation failed',
    });
  }
});

export default router;
