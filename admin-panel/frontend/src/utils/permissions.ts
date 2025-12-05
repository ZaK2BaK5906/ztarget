// Traduction des permissions en français
export const permissionsTranslations: Record<string, string> = {
  canViewDashboard: 'Voir le tableau de bord',
  canViewWhitelists: 'Voir les whitelists',
  canViewTemplates: 'Voir les templates',
  canViewAdmins: 'Voir les administrateurs',
  canViewAnalytics: 'Voir les statistiques',
  canManageWhitelists: 'Gérer les whitelists',
  canManageTemplates: 'Gérer les templates',
  canManageAdmins: 'Gérer les administrateurs'
};

export function translatePermission(key: string): string {
  return permissionsTranslations[key] || key;
}
