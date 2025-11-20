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

    if (allSuccess) {
      return res.json({
        success: true,
        translations: results.map((result) => ({
          translatedText: result.translatedText,
          detectedSourceLanguage: result.detectedSourceLanguage,
        })),
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Some translations failed',
        results,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Batch translation failed',
    });
  }
});

export default router;
