import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import type { AdvancedAnalytics } from '@/types';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data } = await analyticsApi.getAdvanced();
      setAnalytics(data);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await analyticsApi.exportCSV();
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `whitelists_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export réussi !');
    } catch (error) {
      toast.error('Erreur d\'export');
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  if (!analytics) {
    return <div>Erreur de chargement</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Avancés</h1>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2">
          <ArrowDownTrayIcon className="w-5 h-5" />
          Exporter CSV
        </button>
      </div>

      {/* Statistiques globales */}
      <div className="card space-y-4">
        <h2 className="text-2xl font-semibold">Statistiques Globales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-hover rounded-lg p-6">
            <p className="text-sm text-gray-400">Total Whitelists</p>
            <p className="text-4xl font-bold text-primary-500 mt-2">{analytics.global.total}</p>
          </div>
          <div className="glass-hover rounded-lg p-6">
            <p className="text-sm text-gray-400">Acceptées</p>
            <p className="text-4xl font-bold text-green-500 mt-2">{analytics.global.accepted}</p>
          </div>
          <div className="glass-hover rounded-lg p-6">
            <p className="text-sm text-gray-400">Refusées</p>
            <p className="text-4xl font-bold text-red-500 mt-2">{analytics.global.refused}</p>
          </div>
          <div className="glass-hover rounded-lg p-6">
            <p className="text-sm text-gray-400">Taux d'acceptation</p>
            <p className="text-4xl font-bold text-blue-500 mt-2">{analytics.global.acceptanceRate.toFixed(1)}%</p>
          </div>
          <div className="glass-hover rounded-lg p-6">
            <p className="text-sm text-gray-400">Score moyen (Acceptées)</p>
            <p className="text-4xl font-bold text-green-500 mt-2">{analytics.global.avgScoreAccepted.toFixed(1)}</p>
          </div>
          <div className="glass-hover rounded-lg p-6">
            <p className="text-sm text-gray-400">Score moyen (Refusées)</p>
            <p className="text-4xl font-bold text-red-500 mt-2">{analytics.global.avgScoreRefused.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Statistiques par admin */}
      <div className="card space-y-4">
        <h2 className="text-2xl font-semibold">Statistiques par Admin</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr className="text-left text-sm text-gray-400">
                <th className="pb-3">Admin</th>
                <th className="pb-3">Total WL</th>
                <th className="pb-3">Taux d'acceptation</th>
                <th className="pb-3">Durée moyenne</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {analytics.byAdmin.map((admin) => (
                <tr key={admin.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                        {admin.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{admin.username}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="font-semibold text-primary-400">{admin.totalWhitelists}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-600"
                          style={{ width: `${admin.acceptanceRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{admin.acceptanceRate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="font-medium">
                      {Math.floor(admin.avgDuration / 60)}m {admin.avgDuration % 60}s
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistiques par catégorie */}
      <div className="card space-y-4">
        <h2 className="text-2xl font-semibold">Statistiques par Catégorie</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analytics.byCategory.map((cat) => (
            <div key={cat.category} className="glass-hover rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-semibold">{cat.category}</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-primary-500">{cat.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Taux d'acceptation</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600"
                        style={{ width: `${cat.acceptanceRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{cat.acceptanceRate.toFixed(1)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Score moyen</p>
                  <p className="text-2xl font-bold text-green-500">{cat.avgScore.toFixed(1)}/100</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
