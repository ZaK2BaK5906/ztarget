import express from 'express';
import { PrismaClient, WhitelistDecision, WhitelistStatus, WhitelistCategory } from '@prisma/client';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Statistiques du dashboard
router.get('/dashboard', authenticateToken, requirePermission('canViewDashboard'), async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 30);

    // Statistiques aujourd'hui
    const todayStats = await prisma.whitelist.groupBy({
      by: ['decision'],
      where: {
        startedAt: { gte: today },
        status: WhitelistStatus.COMPLETED
      },
      _count: true
    });

    // Statistiques cette semaine
    const weekStats = await prisma.whitelist.groupBy({
      by: ['decision'],
      where: {
        startedAt: { gte: thisWeekStart },
        status: WhitelistStatus.COMPLETED
      },
      _count: true
    });

    // Statistiques ce mois
    const monthStats = await prisma.whitelist.groupBy({
      by: ['decision'],
      where: {
        startedAt: { gte: thisMonthStart },
        status: WhitelistStatus.COMPLETED
      },
      _count: true
    });

    // Taux de réussite
    const totalCompleted = await prisma.whitelist.count({
      where: { status: WhitelistStatus.COMPLETED }
    });

    const totalAccepted = await prisma.whitelist.count({
      where: {
        status: WhitelistStatus.COMPLETED,
        decision: WhitelistDecision.ACCEPTED
      }
    });

    const successRate = totalCompleted > 0 ? (totalAccepted / totalCompleted) * 100 : 0;

    // Top 5 admins
    const topAdmins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        avatar: true,
        _count: {
          select: { whitelists: true }
        }
      },
      orderBy: {
        whitelists: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Répartition par catégorie
    const categoryStats = await prisma.whitelist.groupBy({
      by: ['category'],
      where: {
        status: WhitelistStatus.COMPLETED
      },
      _count: true
    });

    // Évolution sur 30 jours
    const evolutionData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const dayData = await prisma.whitelist.groupBy({
        by: ['decision'],
        where: {
          startedAt: {
            gte: dayStart,
            lt: dayEnd
          },
          status: WhitelistStatus.COMPLETED
        },
        _count: true
      });

      const accepted = dayData.find(d => d.decision === WhitelistDecision.ACCEPTED)?._count || 0;
      const refused = dayData.find(d => d.decision === WhitelistDecision.REFUSED)?._count || 0;

      evolutionData.push({
        date: dayStart.toISOString().split('T')[0],
        accepted,
        refused,
        total: accepted + refused
      });
    }

    // En cours
    const pendingCount = await prisma.whitelist.count({
      where: {
        status: {
          in: [WhitelistStatus.PENDING, WhitelistStatus.IN_PROGRESS]
        }
      }
    });

    res.json({
      today: {
        accepted: todayStats.find(s => s.decision === WhitelistDecision.ACCEPTED)?._count || 0,
        refused: todayStats.find(s => s.decision === WhitelistDecision.REFUSED)?._count || 0,
        waiting: todayStats.find(s => s.decision === WhitelistDecision.WAITING)?._count || 0,
        pending: pendingCount
      },
      week: {
        accepted: weekStats.find(s => s.decision === WhitelistDecision.ACCEPTED)?._count || 0,
        refused: weekStats.find(s => s.decision === WhitelistDecision.REFUSED)?._count || 0,
        waiting: weekStats.find(s => s.decision === WhitelistDecision.WAITING)?._count || 0
      },
      month: {
        accepted: monthStats.find(s => s.decision === WhitelistDecision.ACCEPTED)?._count || 0,
        refused: monthStats.find(s => s.decision === WhitelistDecision.REFUSED)?._count || 0,
        waiting: monthStats.find(s => s.decision === WhitelistDecision.WAITING)?._count || 0
      },
      successRate: Math.round(successRate * 100) / 100,
      topAdmins: topAdmins.map(admin => ({
        ...admin,
        whitelistCount: admin._count.whitelists
      })),
      categoryStats: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count
      })),
      evolution: evolutionData
    });
  } catch (error) {
    console.error('Erreur récupération stats dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques avancées
router.get('/advanced', authenticateToken, requirePermission('canViewAnalytics'), async (req: AuthRequest, res) => {
  try {
    // Stats générales
    const totalWhitelists = await prisma.whitelist.count();
    const totalAccepted = await prisma.whitelist.count({
      where: { decision: WhitelistDecision.ACCEPTED }
    });
    const totalRefused = await prisma.whitelist.count({
      where: { decision: WhitelistDecision.REFUSED }
    });

    const globalAcceptanceRate = totalWhitelists > 0 ? (totalAccepted / totalWhitelists) * 100 : 0;

    // Scores moyens
    const acceptedAvg = await prisma.whitelist.aggregate({
      where: { decision: WhitelistDecision.ACCEPTED },
      _avg: { totalScore: true }
    });

    const refusedAvg = await prisma.whitelist.aggregate({
      where: { decision: WhitelistDecision.REFUSED },
      _avg: { totalScore: true }
    });

    // Stats par admin
    const adminStats = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        avatar: true,
        _count: {
          select: { whitelists: true }
        },
        whitelists: {
          select: {
            decision: true,
            duration: true,
            totalScore: true
          }
        }
      }
    });

    const adminAnalytics = adminStats.map(admin => {
      const total = admin.whitelists.length;
      const accepted = admin.whitelists.filter(w => w.decision === WhitelistDecision.ACCEPTED).length;
      const avgDuration = admin.whitelists.reduce((sum, w) => sum + (w.duration || 0), 0) / (total || 1);

      return {
        id: admin.id,
        username: admin.username,
        avatar: admin.avatar,
        totalWhitelists: total,
        acceptanceRate: total > 0 ? (accepted / total) * 100 : 0,
        avgDuration: Math.round(avgDuration)
      };
    }).sort((a, b) => b.totalWhitelists - a.totalWhitelists);

    // Stats par catégorie
    const categoryAnalytics = await Promise.all([
      WhitelistCategory.LEGAL,
      WhitelistCategory.ILLEGAL
    ].map(async (category) => {
      const total = await prisma.whitelist.count({ where: { category } });
      const accepted = await prisma.whitelist.count({
        where: { category, decision: WhitelistDecision.ACCEPTED }
      });
      const avgScore = await prisma.whitelist.aggregate({
        where: { category },
        _avg: { totalScore: true }
      });

      return {
        category,
        total,
        acceptanceRate: total > 0 ? (accepted / total) * 100 : 0,
        avgScore: avgScore._avg.totalScore || 0
      };
    }));

    res.json({
      global: {
        total: totalWhitelists,
        accepted: totalAccepted,
        refused: totalRefused,
        acceptanceRate: Math.round(globalAcceptanceRate * 100) / 100,
        avgScoreAccepted: Math.round((acceptedAvg._avg.totalScore || 0) * 100) / 100,
        avgScoreRefused: Math.round((refusedAvg._avg.totalScore || 0) * 100) / 100
      },
      byAdmin: adminAnalytics,
      byCategory: categoryAnalytics
    });
  } catch (error) {
    console.error('Erreur récupération stats avancées:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Export CSV
router.get('/export', authenticateToken, requirePermission('canViewAnalytics'), async (req: AuthRequest, res) => {
  try {
    const whitelists = await prisma.whitelist.findMany({
      include: {
        admin: {
          select: { username: true }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    let csv = 'ID,Date,Prénom,Nom,Discord,Âge,Expérience,Catégorie,Statut,Décision,Score Total,Score Scénarios,Score Règles,Durée (s),Admin\n';

    whitelists.forEach(wl => {
      csv += `"${wl.id}","${wl.startedAt.toISOString()}","${wl.candidateFirstname}","${wl.candidateLastname}","${wl.candidateDiscord}",${wl.candidateAge},"${wl.experienceLevel}","${wl.category}","${wl.status}","${wl.decision || ''}",${wl.totalScore || 0},${wl.scenarioScore || 0},${wl.rulesScore || 0},${wl.duration || 0},"${wl.admin.username}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="whitelists_export_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Erreur export CSV:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
