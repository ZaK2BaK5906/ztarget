import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { KeyIcon, UserIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const { admin } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Paramètres</h1>

      {/* Informations du profil */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <UserIcon className="w-6 h-6" />
          Informations du profil
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Nom d'utilisateur</p>
            <p className="font-semibold text-lg">{admin?.username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Email</p>
            <p className="font-semibold text-lg">{admin?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Rôle</p>
            <p className="font-semibold text-lg">
              {admin?.isMasterAdmin ? 'Master Admin' : 'Administrateur'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Statut</p>
            <span className="inline-block px-3 py-1 bg-green-900/30 border border-green-700/50 rounded text-sm font-semibold text-green-400">
              Actif
            </span>
          </div>
        </div>
      </div>

      {/* Changement de mot de passe */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <KeyIcon className="w-6 h-6" />
          Changer le mot de passe
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              minLength={8}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary disabled:opacity-50"
          >
            {isLoading ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>

      {/* Permissions */}
      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">Vos permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {admin && Object.entries(admin.permissions).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-600'}`} />
              <span className={value ? 'text-gray-300' : 'text-gray-600'}>
                {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
