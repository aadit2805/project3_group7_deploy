import { Request, Response, NextFunction } from 'express';
import { getLocalStaff, updateLocalStaff, updateLocalStaffPassword, createLocalStaff } from '../services/staffService';
import passport from 'passport';
import prisma from '../config/prisma'; // Import centralized Prisma instance

export const getAuthenticatedUserController = async (req: Request, res: Response) => {
  if (req.user) {
    const user = req.user as any;

    // If Google OAuth user with staff role, ensure staff table entry
    if (user.type === 'google' && (user.role === 'CASHIER' || user.role === 'MANAGER')) {
      try {
        const staffExists = await prisma.staff.findUnique({
          where: { staff_id: user.id },
        });

        if (!staffExists) {
          // Create staff entry for Google user
                        await prisma.staff.create({
                          data: {
                            staff_id: user.id,
                            username: user.name || user.email, // Use name or email as username
                            role: user.role,
                            password_hash: "GOOGLE_AUTH_USER", // Placeholder for Google authenticated users
                          },
                        });          console.log(`Created staff entry for Google user: ${user.name}`);
        }
      } catch (error) {
        console.error('Error ensuring staff entry for Google user:', error);
        // Do not block the user, but log the error
      }
    }

    const { password_hash, staff_id, ...userWithoutHash } = user;
    res.status(200).json({ id: staff_id || user.id, ...userWithoutHash }); // Use user.id if staff_id is not present (for Google users)
  } else {
    res.status(404).json({ message: 'User not found in session' });
  }
};

export const staffLoginController = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) {
      console.error('Passport authentication error:', err);
      res.status(500).json({ message: 'Internal server error during authentication' });
      return;
    }
    if (!user) {
      res.status(401).json({ message: info.message || 'Authentication failed' });
      return;
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('Error logging in user:', loginErr);
        res.status(500).json({ message: 'Could not log in user' });
        return;
      }
      // Attach a 'type' property to distinguish local staff when logging in
      (user as any).type = 'local';
      // If login is successful, send user data
      res.status(200).json({ message: 'Login successful', user: { id: user.staff_id, username: user.username, role: user.role, type: user.type } });
    });
  })(req, res, next);
};

export const getLocalStaffController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const staff = await getLocalStaff();
    res.status(200).json(staff);
  } catch (error: any) {
    console.error('Error in getLocalStaffController:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const updateLocalStaffController = async (req: Request, res: Response): Promise<void> => {
  try {
    const staff_id = parseInt(req.params.id, 10);
    const { username, role } = req.body;

    if (isNaN(staff_id)) {
      res.status(400).json({ message: 'Invalid staff ID' });
      return;
    }
    if (!username || !role) {
      res.status(400).json({ message: 'Username and role are required' });
      return;
    }

    const updatedStaff = await updateLocalStaff(staff_id, username, role);
    res.status(200).json(updatedStaff);
  } catch (error: any) {
    console.error('Error in updateLocalStaffController:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const updateLocalStaffPasswordController = async (req: Request, res: Response): Promise<void> => {
  try {
    const staff_id = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    if (isNaN(staff_id)) {
      res.status(400).json({ message: 'Invalid staff ID' });
      return;
    }
    if (!newPassword) {
      res.status(400).json({ message: 'New password is required' });
      return;
    }

    const updatedStaff = await updateLocalStaffPassword(staff_id, newPassword);
    res.status(200).json(updatedStaff);
  } catch (error: any) {
    console.error('Error in updateLocalStaffPasswordController:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const createLocalStaffController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, role, password } = req.body;

    if (!username || !role || !password) {
      res.status(400).json({ message: 'Username, role, and password are required' });
      return;
    }

    const newStaff = await createLocalStaff(username, role, password);
    res.status(201).json(newStaff);
  } catch (error: any) {
    console.error('Error in createLocalStaffController:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
