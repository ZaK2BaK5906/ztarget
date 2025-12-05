import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireMasterAdmin, requirePermission, AuthRequest } from '../middleware/auth';
import { sendWebhook } from '../utils/discord';

const router = express.Router();
const prisma = new PrismaClient();

// Liste des admins
router.get('/', authenticateToken, requirePermission('canViewAdmins'), async (req: AuthRequest, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        isMasterAdmin: true,
        isActive: true,
        avatar: true,
        canViewDashboard: true,
        canViewWhitelists: true,
        canViewTemplates: true,
        canViewAdmins: true,
        canViewAnalytics: true,
        canManageWhitelists: true,
        canManageTemplates: true,
        canManageAdmins: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { whitelists: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(admins);
  } catch (error) {
    console.error('Erreur récupération admins:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un admin
router.post('/', authenticateToken, requirePermission('canManageAdmins'), async (req: AuthRequest, res) => {
  try {
    const {
      username,
      email,
      password,
      permissions
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingAdmin) {
      return res.status(400).json({ error: 'Email ou nom d\'utilisateur déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        username,
        email,
        password: hashedPassword,
        createdById: req.admin!.id,
        canViewDashboard: permissions?.canViewDashboard ?? true,
        canViewWhitelists: permissions?.canViewWhitelists ?? true,
        canViewTemplates: permissions?.canViewTemplates ?? false,
        canViewAdmins: permissions?.canViewAdmins ?? false,
        canViewAnalytics: permissions?.canViewAnalytics ?? true,
        canManageWhitelists: permissions?.canManageWhitelists ?? true,
        canManageTemplates: permissions?.canManageTemplates ?? false,
        canManageAdmins: permissions?.canManageAdmins ?? false
      }
    });

    // Webhook Discord
    await sendWebhook('admin', {
      type: 'admin_created',
      adminName: newAdmin.username,
      adminEmail: newAdmin.email,
      createdBy: req.admin!.username,
      permissions
    });

    res.status(201).json({ message: 'Admin créé avec succès', admin: newAdmin });
  } catch (error) {
    console.error('Erreur création admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un admin
router.put('/:id', authenticateToken, requirePermission('canManageAdmins'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { username, email, isActive, permissions } = req.body;

    const admin = await prisma.admin.findUnique({ where: { id } });

    if (!admin) {
      return res.status(404).json({ error: 'Admin non trouvé' });
    }

    if (admin.isMasterAdmin && !req.admin!.isMasterAdmin) {
      return res.status(403).json({ error: 'Impossible de modifier le Master Admin' });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: {
        username: username ?? admin.username,
        email: email ?? admin.email,
        isActive: isActive ?? admin.isActive,
        ...(permissions && {
          canViewDashboard: permissions.canViewDashboard,
          canViewWhitelists: permissions.canViewWhitelists,
          canViewTemplates: permissions.canViewTemplates,
          canViewAdmins: permissions.canViewAdmins,
          canViewAnalytics: permissions.canViewAnalytics,
          canManageWhitelists: permissions.canManageWhitelists,
          canManageTemplates: permissions.canManageTemplates,
          canManageAdmins: permissions.canManageAdmins
        })
      }
    });

    // Webhook Discord
    await sendWebhook('admin', {
      type: 'admin_updated',
      adminName: updatedAdmin.username,
      modifiedBy: req.admin!.username,
      changes: { username, email, isActive, permissions }
    });

    res.json({ message: 'Admin modifié avec succès', admin: updatedAdmin });
  } catch (error) {
    console.error('Erreur modification admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un admin
router.delete('/:id', authenticateToken, requireMasterAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const admin = await prisma.admin.findUnique({ where: { id } });

    if (!admin) {
      return res.status(404).json({ error: 'Admin non trouvé' });
    }

    if (admin.isMasterAdmin) {
      return res.status(403).json({ error: 'Impossible de supprimer le Master Admin' });
    }

    await prisma.admin.delete({ where: { id } });

    // Webhook Discord
    await sendWebhook('admin', {
      type: 'admin_deleted',
      adminName: admin.username,
      deletedBy: req.admin!.username
    });

    res.json({ message: 'Admin supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
