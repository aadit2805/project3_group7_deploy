import { Router } from 'express';
import { getProductUsage } from '../controllers/productUsageController';

const router = Router();

router.get('/', getProductUsage);

export default router;

