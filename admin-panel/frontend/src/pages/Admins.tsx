import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { Admin, AdminPermissions } from '@/types';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { translatePermission } from '@/utils/permissions';

export default function Admins() {
  const { admin: currentAdmin } = useAuthStore();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    permissions: {
      canViewDashboard: true,
      canViewWhitelists: true,
      canViewTemplates: false,
      canViewAdmins: false,
      canViewAnalytics: true,
      canManageWhitelists: true,
      canManageTemplates: false,
      canManageAdmins: false
    }
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const { data } = await adminApi.getAll();
      setAdmins(data);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAdmin) {
        await adminApi.update(editingAdmin.id, {
          username: formData.username,
          email: formData.email,
          permissions: formData.permissions
        });
        toast.success('Admin modifié');
      } else {
        if (!formData.password) {
          toast.error('Mot de passe requis');
          return;
        }
        await adminApi.create(formData);
        toast.success('Admin créé');
      }
      setShowModal(false);
      resetForm();
      loadAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet admin ?')) return;

    try {
      await adminApi.delete(id);
      toast.success('Admin supprimé');
      loadAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur de suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      permissions: {
        canViewDashboard: true,
        canViewWhitelists: true,
        canViewTemplates: false,
        canViewAdmins: false,
        canViewAnalytics: true,
        canManageWhitelists: true,
        canManageTemplates: false,
        canManageAdmins: false
      }
    });
    setEditingAdmin(null);
  };

  const openEditModal = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      email: admin.email,
      password: '',
      permissions: admin.permissions
    });
    setShowModal(true);
  };

  if (!currentAdmin?.permissions.canViewAdmins && !currentAdmin?.isMasterAdmin) {
    return <div className="card">Accès refusé</div>;
  }

  const canManage = currentAdmin?.permissions.canManageAdmins || currentAdmin?.isMasterAdmin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Administrateurs</h1>
        {canManage && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nouvel Admin
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {admins.map((admin) => (
            <div key={admin.id} className="card space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                    {admin.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{admin.username}</p>
                    <p className="text-sm text-gray-400">{admin.email}</p>
                    {admin.isMasterAdmin && (
                      <span className="inline-block mt-1 px-2 py-1 bg-yellow-900/30 border border-yellow-700/50 rounded text-xs font-semibold text-yellow-400">
                        Master Admin
                      </span>
                    )}
                  </div>
                </div>
                {canManage && !admin.isMasterAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(admin)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(admin.id)}
                      className="p-2 hover:bg-red-900/30 rounded-lg transition-colors text-red-400"
                      title="Supprimer"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-400">Whitelists gérées</p>
                  <p className="font-semibold">{admin._count?.whitelists || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400">Dernière connexion</p>
                  <p className="font-semibold">
                    {admin.lastLoginAt
                      ? format(new Date(admin.lastLoginAt), 'dd/MM/yy', { locale: fr })
                      : 'Jamais'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-400 mb-2">Permissions</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {admin.permissions && Object.entries(admin.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1">
                      {value ? (
                        <CheckIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <span className={value ? 'text-gray-300' : 'text-gray-600'}>
                        {translatePermission(key)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Créé le {format(new Date(admin.createdAt), 'dd/MM/yyyy', { locale: fr })}</span>
                <span className={`px-2 py-1 rounded ${admin.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  {admin.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingAdmin ? 'Modifier' : 'Nouvel'} Admin
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom d'utilisateur *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              {!editingAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input"
                    required={!editingAdmin}
                    minLength={8}
                  />
                  <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Permissions
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(formData.permissions).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              [key]: e.target.checked
                            }
                          })
                        }
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                      />
                      <span className="text-sm">
                        {translatePermission(key)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {editingAdmin ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
