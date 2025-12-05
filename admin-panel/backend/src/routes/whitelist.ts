import express from 'express';
import { PrismaClient, WhitelistCategory, WhitelistStatus, WhitelistDecision, ExperienceLevel, TemplateType } from '@prisma/client';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth';
import { sendWebhook } from '../utils/discord';

const router = express.Router();
const prisma = new PrismaClient();

// Liste des whitelists avec filtres
router.get('/', authenticateToken, requirePermission('canViewWhitelists'), async (req: AuthRequest, res) => {
  try {
    const {
      status,
      category,
      adminId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (adminId) where.adminId = adminId;
    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) where.startedAt.gte = new Date(startDate as string);
      if (endDate) where.startedAt.lte = new Date(endDate as string);
    }
    if (search) {
      where.OR = [
        { candidateFirstname: { contains: search as string } },
        { candidateLastname: { contains: search as string } },
        { candidateDiscord: { contains: search as string } }
      ];
    }

    const total = await prisma.whitelist.count({ where });
    const whitelists = await prisma.whitelist.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            comments: true,
            answers: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    res.json({
      whitelists,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération whitelists:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Détails d'une whitelist
router.get('/:id', authenticateToken, requirePermission('canViewWhitelists'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const whitelist = await prisma.whitelist.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true
          }
        },
        answers: {
          include: {
            template: true
          }
        },
        comments: {
          include: {
            admin: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        activityLogs: {
          include: {
            admin: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!whitelist) {
      return res.status(404).json({ error: 'Whitelist non trouvée' });
    }

    res.json(whitelist);
  } catch (error) {
    console.error('Erreur récupération whitelist:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une nouvelle whitelist (démarrer un entretien)
router.post('/', authenticateToken, requirePermission('canManageWhitelists'), async (req: AuthRequest, res) => {
  try {
    const {
      candidateFirstname,
      candidateLastname,
      candidateDiscord,
      candidateAge,
      experienceLevel,
      category,
      adminNotes
    } = req.body;

    if (!candidateFirstname || !candidateLastname || !candidateDiscord || !candidateAge || !experienceLevel || !category) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Récupération des templates pour cette catégorie
    const mandatoryQuestions = await prisma.template.findMany({
      where: {
        type: TemplateType.MANDATORY_QUESTION,
        isActive: true
      },
      take: 3
    });

    const scenarios = await prisma.template.findMany({
      where: {
        type: TemplateType.SCENARIO,
        category: category as WhitelistCategory,
        isActive: true
      },
      orderBy: { orderIndex: 'asc' }
    });

    // Sélection aléatoire de 3 scénarios
    const selectedScenarios = scenarios
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const rulesQuestions = await prisma.template.findMany({
      where: {
        type: TemplateType.RULES_QUESTION,
        isActive: true
      }
    });

    // Sélection aléatoire de 5 questions de règlement
    const selectedRulesQuestions = rulesQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    const lexiconQuestions = await prisma.template.findMany({
      where: {
        type: TemplateType.LEXICON,
        isActive: true
      }
    });

    // Sélection aléatoire de 2 lexiques
    const selectedLexicons = lexiconQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    // Création de la whitelist
    const whitelist = await prisma.whitelist.create({
      data: {
        candidateFirstname,
        candidateLastname,
        candidateDiscord,
        candidateAge: Number(candidateAge),
        experienceLevel: experienceLevel as ExperienceLevel,
        category: category as WhitelistCategory,
        adminNotes,
        adminId: req.admin!.id,
        status: WhitelistStatus.IN_PROGRESS,
        answers: {
          create: [
            ...mandatoryQuestions.map(q => ({ templateId: q.id })),
            ...selectedScenarios.map(s => ({ templateId: s.id })),
            ...selectedRulesQuestions.map(q => ({ templateId: q.id })),
            ...selectedLexicons.map(l => ({ templateId: l.id }))
          ]
        }
      },
      include: {
        answers: {
          include: {
            template: true
          }
        }
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        adminId: req.admin!.id,
        whitelistId: whitelist.id,
        action: 'WHITELIST_STARTED',
        details: `Entretien démarré pour ${candidateFirstname} ${candidateLastname}`
      }
    });

    // Webhook Discord
    await sendWebhook('entretien', {
      type: 'started',
      candidateName: `${candidateFirstname} ${candidateLastname}`,
      candidateDiscord,
      adminName: req.admin!.username,
      category,
      startTime: new Date().toISOString()
    });

    res.status(201).json({ message: 'Entretien démarré avec succès', whitelist });
  } catch (error) {
    console.error('Erreur création whitelist:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour une réponse
router.put('/:id/answers/:answerId', authenticateToken, requirePermission('canManageWhitelists'), async (req: AuthRequest, res) => {
  try {
    const { id, answerId } = req.params;
    const { candidateAnswer, isCorrect, score, notes } = req.body;

    const answer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        candidateAnswer,
        isCorrect,
        score: score ? Number(score) : undefined,
        notes
      }
    });

    res.json({ message: 'Réponse mise à jour', answer });
  } catch (error) {
    console.error('Erreur mise à jour réponse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Finaliser une whitelist (validation/refus)
router.post('/:id/finalize', authenticateToken, requirePermission('canManageWhitelists'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { decision, decisionReason, customMessage, reexamDate } = req.body;

    if (!decision) {
      return res.status(400).json({ error: 'Décision requise' });
    }

    // Calcul des scores
    const answers = await prisma.answer.findMany({
      where: { whitelistId: id },
      include: { template: true }
    });

    const scenarioAnswers = answers.filter(a => a.template.type === TemplateType.SCENARIO);
    const rulesAnswers = answers.filter(a =>
      a.template.type === TemplateType.RULES_QUESTION ||
      a.template.type === TemplateType.LEXICON ||
      a.template.type === TemplateType.MANDATORY_QUESTION
    );

    const scenarioScore = scenarioAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
    const rulesScore = rulesAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
    const totalScore = scenarioScore + rulesScore;

    const whitelist = await prisma.whitelist.findUnique({
      where: { id },
      include: { admin: true }
    });

    if (!whitelist) {
      return res.status(404).json({ error: 'Whitelist non trouvée' });
    }

    const startTime = new Date(whitelist.startedAt);
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const updatedWhitelist = await prisma.whitelist.update({
      where: { id },
      data: {
        status: WhitelistStatus.COMPLETED,
        decision: decision as WhitelistDecision,
        decisionReason,
        customMessage,
        reexamDate: reexamDate ? new Date(reexamDate) : undefined,
        endedAt: endTime,
        duration,
        totalScore,
        scenarioScore,
        rulesScore
      }
    });

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        adminId: req.admin!.id,
        whitelistId: id,
        action: `WHITELIST_${decision}`,
        details: `Whitelist ${decision === 'ACCEPTED' ? 'validée' : decision === 'REFUSED' ? 'refusée' : 'mise en attente'}`
      }
    });

    // Webhook Discord
    const webhookType = decision === 'ACCEPTED' ? 'validation' : 'refus';
    await sendWebhook(webhookType, {
      type: decision,
      candidateName: `${whitelist.candidateFirstname} ${whitelist.candidateLastname}`,
      candidateDiscord: whitelist.candidateDiscord,
      adminName: req.admin!.username,
      category: whitelist.category,
      totalScore,
      scenarioScore,
      rulesScore,
      duration,
      reason: decisionReason,
      customMessage
    });

    res.json({ message: 'Whitelist finalisée avec succès', whitelist: updatedWhitelist });
  } catch (error) {
    console.error('Erreur finalisation whitelist:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un commentaire
router.post('/:id/comments', authenticateToken, requirePermission('canViewWhitelists'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content, mentions } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Contenu requis' });
    }

    const comment = await prisma.comment.create({
      data: {
        whitelistId: id,
        adminId: req.admin!.id,
        content,
        mentions: mentions ? JSON.stringify(mentions) : undefined
      },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({ message: 'Commentaire ajouté', comment });
  } catch (error) {
    console.error('Erreur ajout commentaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
