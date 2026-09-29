'use server';

import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { isDemoEmail } from '@/lib/dataScope';
import { ensureDemoDataset } from '@/lib/demoSeed';

export async function seedDemoUsers() {
  try {
    const demoAccounts = [
      {
        email: 'admin@example.com',
        name: 'Admin User',
        role: Role.ADMIN,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      },
      {
        email: 'manager@example.com',
        name: 'Manager User',
        role: Role.MANAGER,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
      },
      {
        email: 'staff@example.com',
        name: 'Staff User',
        role: Role.STAFF,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop',
      },
    ];

    for (const demo of demoAccounts) {
      const existing = await prisma.user.findUnique({
        where: { email: demo.email },
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            email: demo.email,
            name: demo.name,
            role: demo.role,
            avatarUrl: demo.avatarUrl,
            isApproved: true,
            isDemo: true,
          },
        });
      } else if (existing.role !== demo.role || !existing.isApproved || !existing.isDemo) {
        await prisma.user.update({
          where: { email: demo.email },
          data: { role: demo.role, isApproved: true, isDemo: true },
        });
      }
    }

    await ensureDemoDataset();
    return { success: true };
  } catch (error: any) {
    console.error('seedDemoUsers error:', error);
    return { success: false, error: error?.message };
  }
}

export async function syncUserRole(email: string, requestedRole?: string, name?: string, supabaseAuthId?: string) {
  try {
    let roleEnum: Role = Role.STAFF;
    if (requestedRole === 'ADMIN' || requestedRole === 'Admin' || email.includes('admin')) {
      roleEnum = Role.ADMIN;
    } else if (requestedRole === 'MANAGER' || requestedRole === 'Manager' || email.includes('manager')) {
      roleEnum = Role.MANAGER;
    } else if (requestedRole === 'STAFF' || requestedRole === 'Staff' || email.includes('staff')) {
      roleEnum = Role.STAFF;
    }

    const isDemo = isDemoEmail(email);
    if (isDemo) {
      await ensureDemoDataset().catch((err) => console.error('ensureDemoDataset error:', err));
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      const updated = await prisma.user.update({
        where: { email },
        data: {
          supabaseAuthId: supabaseAuthId || existing.supabaseAuthId,
          ...(isDemo ? { isDemo: true } : {}),
        },
      });
      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
        isApproved: updated.isApproved,
      };
    }

    const created = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        role: roleEnum,
        supabaseAuthId: supabaseAuthId || null,
        isApproved: false,
        isDemo,
      },
    });

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      role: created.role,
      avatarUrl: created.avatarUrl,
      isApproved: created.isApproved,
    };
  } catch (error: any) {
    console.error('syncUserRole error:', error);
    let fallbackRole: Role = Role.STAFF;
    if (email.includes('admin')) fallbackRole = Role.ADMIN;
    else if (email.includes('manager')) fallbackRole = Role.MANAGER;
    else if (email.includes('staff')) fallbackRole = Role.STAFF;
    return {
      email,
      name: email.split('@')[0],
      role: fallbackRole,
      avatarUrl: null,
      isApproved: false,
    };
  }
}

export async function getUserProfile(email?: string | null, supabaseAuthId?: string | null) {
  try {
    if (supabaseAuthId) {
      const byAuthId = await prisma.user.findUnique({ where: { supabaseAuthId } });
      if (byAuthId) {
        return {
          id: byAuthId.id,
          email: byAuthId.email,
          name: byAuthId.name,
          role: byAuthId.role,
          avatarUrl: byAuthId.avatarUrl,
          isApproved: byAuthId.isApproved,
        };
      }
    }

    if (email) {
      const byEmail = await prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        return {
          id: byEmail.id,
          email: byEmail.email,
          name: byEmail.name,
          role: byEmail.role,
          avatarUrl: byEmail.avatarUrl,
          isApproved: byEmail.isApproved,
        };
      }
    }

    return null;
  } catch (error: any) {
    console.error('getUserProfile error:', error);
    return null;
  }
}

export async function updateUserProfile(
  email: string,
  data: { name?: string; avatarUrl?: string | null }
) {
  try {
    if (!email) {
      return { success: false, error: 'You must be signed in to update your profile.' };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      return { success: false, error: 'User profile was not found.' };
    }

    const name = data.name?.trim();
    if (data.name !== undefined && (!name || name.length < 2)) {
      return { success: false, error: 'Full name must be at least 2 characters.' };
    }

    const updated = await prisma.user.update({
      where: { email },
      data: {
        ...(name ? { name } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      },
    });

    return {
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
      },
    };
  } catch (error: any) {
    console.error('updateUserProfile error:', error);
    return { success: false, error: error?.message || 'Failed to update profile.' };
  }
}
