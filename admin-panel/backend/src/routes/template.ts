import express from 'express';
import { PrismaClient, TemplateType, WhitelistCategory } from '@prisma/client';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Liste des templates
router.get('/', authenticateToken, requirePermission('canViewTemplates'), async (req: AuthRequest, res) => {
  try {
    const { type, category, isActive } = req.query;

    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const templates = await prisma.template.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { orderIndex: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(templates);
  } catch (error) {
    console.error('Erreur récupération templates:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un template
router.post('/', authenticateToken, requirePermission('canManageTemplates'), async (req: AuthRequest, res) => {
  try {
    const { type, category, question, answer, orderIndex } = req.body;

    if (!type || !question) {
      return res.status(400).json({ error: 'Type et question requis' });
    }

    const template = await prisma.template.create({
      data: {
        type: type as TemplateType,
        category: category ? (category as WhitelistCategory) : undefined,
        question,
        answer,
        orderIndex: orderIndex ? Number(orderIndex) : undefined,
        createdById: req.admin!.id
      }
    });

    res.status(201).json({ message: 'Template créé avec succès', template });
  } catch (error) {
    console.error('Erreur création template:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un template
router.put('/:id', authenticateToken, requirePermission('canManageTemplates'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { type, category, question, answer, isActive, orderIndex } = req.body;

    const template = await prisma.template.update({
      where: { id },
      data: {
        type: type ? (type as TemplateType) : undefined,
        category: category ? (category as WhitelistCategory) : undefined,
        question,
        answer,
        isActive,
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : undefined
      }
    });

    res.json({ message: 'Template modifié avec succès', template });
  } catch (error) {
    console.error('Erreur modification template:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un template
router.delete('/:id', authenticateToken, requirePermission('canManageTemplates'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.template.delete({ where: { id } });

    res.json({ message: 'Template supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression template:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Dupliquer un template
router.post('/:id/duplicate', authenticateToken, requirePermission('canManageTemplates'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const original = await prisma.template.findUnique({ where: { id } });

    if (!original) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    const duplicate = await prisma.template.create({
      data: {
        type: original.type,
        category: original.category,
        question: `${original.question} (copie)`,
        answer: original.answer,
        orderIndex: original.orderIndex,
        createdById: req.admin!.id
      }
    });

    res.status(201).json({ message: 'Template dupliqué avec succès', template: duplicate });
  } catch (error) {
    console.error('Erreur duplication template:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
