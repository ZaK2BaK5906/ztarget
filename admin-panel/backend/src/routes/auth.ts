import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Mise à jour du dernier login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() }
    });

    const token = jwt.sign(
      { adminId: admin.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        isMasterAdmin: admin.isMasterAdmin,
        avatar: admin.avatar,
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
      }
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérification du token
router.get('/verify', authenticateToken, (req: AuthRequest, res) => {
  res.json({ admin: req.admin });
});

// Changement de mot de passe
router.post('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mots de passe requis' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.admin!.id }
    });

    const validPassword = await bcrypt.compare(currentPassword, admin!.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: req.admin!.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur changement de mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
