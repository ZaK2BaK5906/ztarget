import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { whitelistApi } from '@/lib/api';
import type { Whitelist } from '@/types';
import { WhitelistStatus, WhitelistDecision, WhitelistCategory } from '@/types';
import toast from 'react-hot-toast';
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Whitelists() {
  const [whitelists, setWhitelists] = useState<Whitelist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    decision: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadWhitelists();
  }, [page, filters]);

  const loadWhitelists = async () => {
    setIsLoading(true);
    try {
      const { data } = await whitelistApi.getAll({
        page,
        limit: 20,
        ...filters
      });
      setWhitelists(data.whitelists);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: WhitelistStatus) => {
    const styles = {
      [WhitelistStatus.PENDING]: 'bg-gray-700 text-gray-300',
      [WhitelistStatus.IN_PROGRESS]: 'bg-blue-700 text-blue-300',
      [WhitelistStatus.COMPLETED]: 'bg-green-700 text-green-300'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getDecisionBadge = (decision?: WhitelistDecision) => {
    if (!decision) return null;
    const styles = {
      [WhitelistDecision.ACCEPTED]: 'bg-green-900/30 border-green-700/50 text-green-400',
      [WhitelistDecision.REFUSED]: 'bg-red-900/30 border-red-700/50 text-red-400',
      [WhitelistDecision.WAITING]: 'bg-yellow-900/30 border-yellow-700/50 text-yellow-400'
    };
    return (
      <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${styles[decision]}`}>
        {decision === WhitelistDecision.ACCEPTED ? '✅ Accepté' : decision === WhitelistDecision.REFUSED ? '❌ Refusé' : '⏳ En attente'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Whitelists</h1>
        <Link to="/whitelists/new" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nouvelle WL
        </Link>
      </div>

      {/* Filtres */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <FunnelIcon className="w-5 h-5" />
          Filtres
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recherche
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input pl-10"
                placeholder="Nom, Discord..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="select"
            >
              <option value="">Tous</option>
              <option value={WhitelistStatus.PENDING}>En attente</option>
              <option value={WhitelistStatus.IN_PROGRESS}>En cours</option>
              <option value={WhitelistStatus.COMPLETED}>Terminé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Catégorie
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="select"
            >
              <option value="">Toutes</option>
              <option value={WhitelistCategory.LEGAL}>Legal</option>
              <option value={WhitelistCategory.ILLEGAL}>Illégal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date début
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date fin
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="input"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', category: '', decision: '', search: '', startDate: '', endDate: '' })}
              className="btn-secondary w-full"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : whitelists.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">Aucune whitelist trouvée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {whitelists.map((wl) => (
            <Link
              key={wl.id}
              to={`/whitelists/${wl.id}`}
              className="card-hover block"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Candidat</p>
                    <p className="font-semibold">
                      {wl.candidateFirstname} {wl.candidateLastname}
                    </p>
                    <p className="text-sm text-gray-400">{wl.candidateDiscord}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Catégorie</p>
                    <p className="font-medium">{wl.category}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Admin</p>
                    <p className="font-medium">{wl.admin.username}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Date</p>
                    <p className="font-medium">
                      {format(new Date(wl.startedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(wl.status)}
                    {getDecisionBadge(wl.decision)}
                    {wl.totalScore !== undefined && (
                      <span className="text-sm font-semibold text-primary-400">
                        {wl.totalScore}/100
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-gray-400">
            Page {page} sur {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
