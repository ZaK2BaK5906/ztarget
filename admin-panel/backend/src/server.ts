import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import whitelistRoutes from './routes/whitelist';
import templateRoutes from './routes/template';
import analyticsRoutes from './routes/analytics';
import webhookRoutes from './routes/webhook';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/whitelists', whitelistRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialisation du Master Admin au démarrage
async function initializeMasterAdmin() {
  try {
    const masterAdminExists = await prisma.admin.findFirst({
      where: { isMasterAdmin: true }
    });

    if (!masterAdminExists) {
      const hashedPassword = await bcrypt.hash(
        process.env.MASTER_ADMIN_PASSWORD || 'ChangeMe123!',
        10
      );

      await prisma.admin.create({
        data: {
          username: process.env.MASTER_ADMIN_USERNAME || 'MasterAdmin',
          email: process.env.MASTER_ADMIN_EMAIL || 'admin@fivem.local',
          password: hashedPassword,
          isMasterAdmin: true,
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

      console.log('✅ Master Admin créé avec succès !');
    } else {
      console.log('✅ Master Admin existe déjà');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création du Master Admin:', error);
  }
}

// Démarrage du serveur
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Connecté à la base de données');

    await initializeMasterAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📍 API disponible sur http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();

// Gestion de la fermeture propre
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('👋 Serveur arrêté proprement');
  process.exit(0);
});
