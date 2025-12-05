import { Webhook, MessageBuilder } from 'discord-webhook-node';

const webhooks = {
  entretien: process.env.DISCORD_WEBHOOK_ENTRETIEN,
  validation: process.env.DISCORD_WEBHOOK_VALIDATION,
  refus: process.env.DISCORD_WEBHOOK_REFUS,
  admin: process.env.DISCORD_WEBHOOK_ADMIN,
  rapport: process.env.DISCORD_WEBHOOK_RAPPORT
};

export async function sendWebhook(type: keyof typeof webhooks, data: any) {
  try {
    const webhookUrl = webhooks[type];

    if (!webhookUrl) {
      console.warn(`Webhook ${type} non configuré`);
      return;
    }

    const webhook = new Webhook(webhookUrl);

    let embed: MessageBuilder;

    switch (type) {
      case 'entretien':
        embed = new MessageBuilder()
          .setTitle('🎤 Entretien démarré')
          .setColor(0x3498db)
          .addField('Candidat', `${data.candidateName} (${data.candidateDiscord})`, false)
          .addField('Admin', data.adminName, true)
          .addField('Catégorie', data.category, true)
          .setTimestamp();
        break;

      case 'validation':
        embed = new MessageBuilder()
          .setTitle('✅ Whitelist Validée')
          .setColor(0x2ecc71)
          .addField('Candidat', `${data.candidateName} (${data.candidateDiscord})`, false)
          .addField('Score', `${data.totalScore}/100`, true)
          .addField('Catégorie', data.category, true)
          .addField('Admin', data.adminName, true)
          .addField('Durée', `${Math.floor(data.duration / 60)} min ${data.duration % 60} sec`, true)
          .setTimestamp();

        if (data.customMessage) {
          embed.addField('Message', data.customMessage, false);
        }
        break;

      case 'refus':
        embed = new MessageBuilder()
          .setTitle('❌ Whitelist Refusée')
          .setColor(0xe74c3c)
          .addField('Candidat', `${data.candidateName} (${data.candidateDiscord})`, false)
          .addField('Score', `${data.totalScore}/100`, true)
          .addField('Catégorie', data.category, true)
          .addField('Admin', data.adminName, true)
          .addField('Durée', `${Math.floor(data.duration / 60)} min ${data.duration % 60} sec`, true)
          .setTimestamp();

        if (data.reason) {
          embed.addField('Raison', data.reason, false);
        }
        break;

      case 'admin':
        if (data.type === 'admin_created') {
          embed = new MessageBuilder()
            .setTitle('👤 Nouvel Admin Créé')
            .setColor(0x3498db)
            .addField('Nom', data.adminName, true)
            .addField('Email', data.adminEmail, true)
            .addField('Créé par', data.createdBy, false)
            .setTimestamp();
        } else if (data.type === 'admin_updated') {
          embed = new MessageBuilder()
            .setTitle('🔧 Admin Modifié')
            .setColor(0xf39c12)
            .addField('Admin', data.adminName, true)
            .addField('Modifié par', data.modifiedBy, true)
            .setTimestamp();
        } else {
          embed = new MessageBuilder()
            .setTitle('🗑️ Admin Supprimé')
            .setColor(0xe74c3c)
            .addField('Admin', data.adminName, true)
            .addField('Supprimé par', data.deletedBy, true)
            .setTimestamp();
        }
        break;

      case 'rapport':
        embed = new MessageBuilder()
          .setTitle('📊 Rapport Quotidien')
          .setColor(0x9b59b6)
          .addField('Validées', data.accepted.toString(), true)
          .addField('Refusées', data.refused.toString(), true)
          .addField('En attente', data.waiting.toString(), true)
          .setTimestamp();
        break;

      default:
        return;
    }

    await webhook.send(embed);
  } catch (error) {
    console.error(`Erreur envoi webhook ${type}:`, error);
  }
}

// Rapport quotidien automatique (à appeler via cron)
export async function sendDailyReport() {
  try {
    // TODO: Implémenter les statistiques du jour
    await sendWebhook('rapport', {
      accepted: 0,
      refused: 0,
      waiting: 0
    });
  } catch (error) {
    console.error('Erreur rapport quotidien:', error);
  }
}
