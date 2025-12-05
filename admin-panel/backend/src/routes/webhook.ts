import express from 'express';
import { authenticateToken, requireMasterAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Tester un webhook
router.post('/test', authenticateToken, requireMasterAdmin, async (req: AuthRequest, res) => {
  try {
    const { type } = req.body;

    // TODO: Implémenter l'envoi de test de webhook

    res.json({ message: 'Webhook de test envoyé', type });
  } catch (error) {
    console.error('Erreur test webhook:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
