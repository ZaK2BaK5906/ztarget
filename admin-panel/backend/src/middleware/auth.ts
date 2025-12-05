import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    username: string;
    email: string;
    isMasterAdmin: boolean;
    permissions: {
      canViewDashboard: boolean;
      canViewWhitelists: boolean;
      canViewTemplates: boolean;
      canViewAdmins: boolean;
      canViewAnalytics: boolean;
      canManageWhitelists: boolean;
      canManageTemplates: boolean;
      canManageAdmins: boolean;
    };
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { adminId: string };

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: {
        id: true,
        username: true,
        email: true,
        isMasterAdmin: true,
        isActive: true,
        canViewDashboard: true,
        canViewWhitelists: true,
        canViewTemplates: true,
        canViewAdmins: true,
        canViewAnalytics: true,
        canManageWhitelists: true,
        canManageTemplates: true,
        canManageAdmins: true
      }
    });

    if (!admin || !admin.isActive) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    req.admin = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      isMasterAdmin: admin.isMasterAdmin,
      permissions: {
        canViewDashboard: admin.canViewDashboard,
        canViewWhitelists: admin.canViewWhitelists,
        canViewTemplates: admin.canViewTemplates,
        canViewAdmins: admin.canViewAdmins,
        canViewAnalytics: admin.canViewAnalytics,
        canManageWhitelists: admin.canManageWhitelists,
        canManageTemplates: admin.canManageTemplates,
        canManageAdmins: admin.canManageAdmins
      }
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token invalide' });
  }
};

export const requireMasterAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.admin?.isMasterAdmin) {
    return res.status(403).json({ error: 'Accès réservé au Master Admin' });
  }
  next();
};

export const requirePermission = (permission: keyof AuthRequest['admin']['permissions']) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin?.permissions[permission] && !req.admin?.isMasterAdmin) {
      return res.status(403).json({ error: 'Permission insuffisante' });
    }
    next();
  };
};
