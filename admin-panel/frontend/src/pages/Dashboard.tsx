import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '@/lib/api';
import type { DashboardStats } from '@/types';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  TrophyIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await analyticsApi.getDashboard();
      setStats(data);
    } catch (error) {
      toast.error('Erreur de chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Chargement...</div>;
  }

  if (!stats) {
    return <div>Erreur de chargement</div>;
  }

  const chartData = {
    labels: stats.evolution.map(d => new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })),
    datasets: [
      {
        label: 'Validées',
        data: stats.evolution.map(d => d.accepted),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Refusées',
        data: stats.evolution.map(d => d.refused),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#d1d5db'
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af'
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link to="/whitelists/new" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nouvelle WL
        </Link>
      </div>

      {/* Stats aujourd'hui */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Validées (Aujourd'hui)</p>
              <p className="text-3xl font-bold text-green-500 mt-2">{stats.today.accepted}</p>
            </div>
            <CheckCircleIcon className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Refusées (Aujourd'hui)</p>
              <p className="text-3xl font-bold text-red-500 mt-2">{stats.today.refused}</p>
            </div>
            <XCircleIcon className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">En attente</p>
              <p className="text-3xl font-bold text-yellow-500 mt-2">{stats.today.waiting}</p>
            </div>
            <ClockIcon className="w-12 h-12 text-yellow-500 opacity-20" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Taux de réussite</p>
              <p className="text-3xl font-bold text-primary-500 mt-2">{stats.successRate.toFixed(1)}%</p>
            </div>
            <ChartBarIcon className="w-12 h-12 text-primary-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Graphique d'évolution */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Évolution sur 30 jours</h2>
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 admins */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrophyIcon className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">Top 5 Admins</h2>
          </div>
          <div className="space-y-3">
            {stats.topAdmins.map((admin, index) => (
              <div key={admin.id} className="flex items-center gap-3 p-3 glass-hover rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{admin.username}</p>
                  <p className="text-sm text-gray-400">{admin.whitelistCount} whitelists</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats par catégorie */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Répartition par catégorie</h2>
          <div className="space-y-4">
            {stats.categoryStats.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{cat.category}</span>
                  <span className="text-sm text-gray-400">{cat.count}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                    style={{
                      width: `${(cat.count / stats.categoryStats.reduce((sum, c) => sum + c.count, 0)) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
