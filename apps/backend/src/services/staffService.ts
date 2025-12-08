import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Authenticate a staff member by username and password
 * Compares provided password with hashed password in database
 * Returns staff object without password hash on success, null on failure
 */
export const authenticateStaff = async (username: string, passwordPlain: string) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { username: username },
    });

    if (!staff) {
      return null; // Staff not found
    }

    const isPasswordValid = await bcrypt.compare(passwordPlain, staff.password_hash);

    if (!isPasswordValid) {
      return null; // Invalid password
    }

    // Return staff object without password hash for security
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...staffWithoutHash } = staff;
    return staffWithoutHash;
  } catch (error) {
    console.error('Error authenticating staff:', error);
    throw new Error('Failed to authenticate staff');
  }
};

/**
 * Get all local staff members
 * Returns list of staff with ID, username, role, and creation date
 */
export const getLocalStaff = async () => {
  try {
    const staff = await prisma.staff.findMany({
      select: {
        staff_id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });
    return staff;
  } catch (error) {
    console.error('Error fetching local staff:', error);
    throw new Error('Failed to retrieve local staff');
  }
};

/**
 * Update a local staff member's username and role
 * Returns updated staff object without password hash
 */
export const updateLocalStaff = async (staff_id: number, username: string, role: string) => {
  try {
    const updatedStaff = await prisma.staff.update({
      where: { staff_id: staff_id },
      data: {
        username: username,
        role: role,
      },
      select: {
        staff_id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });
    return updatedStaff;
  } catch (error) {
    console.error(`Error updating local staff with ID ${staff_id}:`, error);
    throw new Error(`Failed to update local staff with ID ${staff_id}`);
  }
};

/**
 * Update a local staff member's password
 * Hashes the new password using bcrypt before storing
 * Returns updated staff object without password hash
 */
export const updateLocalStaffPassword = async (staff_id: number, newPasswordPlain: string) => {
  try {
    // Hash the new password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPasswordPlain, salt);

    const updatedStaff = await prisma.staff.update({
      where: { staff_id: staff_id },
      data: {
        password_hash: hashedPassword,
      },
      select: {
        staff_id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });
    return updatedStaff;
  } catch (error) {
    console.error(`Error updating password for staff ID ${staff_id}:`, error);
    throw new Error(`Failed to update password for staff ID ${staff_id}`);
  }
};

/**
 * Create a new local staff member
 * Hashes the password before storing in database
 * Returns created staff object without password hash
 */
export const createLocalStaff = async (username: string, role: string, passwordPlain: string) => {
  try {
    // Hash the password with bcrypt before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordPlain, salt);

    const newStaff = await prisma.staff.create({
      data: {
        username: username,
        role: role,
        password_hash: hashedPassword,
      },
      select: {
        staff_id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });
    return newStaff;
  } catch (error) {
    console.error('Error creating local staff:', error);
    throw new Error('Failed to create local staff');
  }
};
