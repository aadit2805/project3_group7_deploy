import { Router, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { isManager } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users - Get all users (Manager only)
router.get('/', isManager, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(users);
  } catch (error) {
    console.error('Failed to get users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// PUT /api/users/:id/role - Update user role (Manager only)
router.put('/:id/role', isManager, async (req: Request, res): Promise<void> => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    res.status(400).json({ error: 'Role is required' });
    return;
  }

  // Basic role validation
  if (!['CASHIER', 'MANAGER'].includes(role)) {
    res.status(400).json({ error: 'Invalid role specified' });
    return;
  }

  try {
    // Get old values for audit log
    const oldUser = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!oldUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: { role },
    });

    // Log audit entry
    await createAuditLog(req, {
      action_type: 'UPDATE_ROLE',
      entity_type: 'user',
      entity_id: String(id),
      old_values: { role: oldUser.role },
      new_values: { role: updatedUser.role },
      description: `Updated user role from "${oldUser.role}" to "${role}" (User ID: ${id}, Email: ${oldUser.email || 'N/A'})`,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(`Failed to update role for user ${id}:`, error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
