import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { whitelistApi } from '@/lib/api';
import type { Whitelist } from '@/types';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function WhitelistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [whitelist, setWhitelist] = useState<Whitelist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (id) loadWhitelist();
  }, [id]);

  const loadWhitelist = async () => {
    try {
      const { data } = await whitelistApi.getById(id!);
      setWhitelist(data);
    } catch (error) {
      toast.error('Erreur de chargement');
      navigate('/whitelists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await whitelistApi.addComment(id!, newComment);
      toast.success('Commentaire ajouté');
      setNewComment('');
      loadWhitelist();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  if (!whitelist) {
    return <div>Whitelist non trouvée</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/whitelists')} className="btn-secondary">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold">
          Whitelist - {whitelist.candidateFirstname} {whitelist.candidateLastname}
        </h1>
      </div>

      {/* Informations principales */}
      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">Informations du candidat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-400">Nom complet</p>
            <p className="font-semibold">{whitelist.candidateFirstname} {whitelist.candidateLastname}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Discord</p>
            <p className="font-semibold">{whitelist.candidateDiscord}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Âge</p>
            <p className="font-semibold">{whitelist.candidateAge} ans</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Expérience</p>
            <p className="font-semibold">{whitelist.experienceLevel}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Catégorie</p>
            <p className="font-semibold">{whitelist.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Admin</p>
            <p className="font-semibold">{whitelist.admin.username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Date</p>
            <p className="font-semibold">
              {format(new Date(whitelist.startedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </p>
          </div>
          {whitelist.duration && (
            <div>
              <p className="text-sm text-gray-400">Durée</p>
              <p className="font-semibold">
                {Math.floor(whitelist.duration / 60)}m {whitelist.duration % 60}s
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scores */}
      {whitelist.totalScore !== undefined && (
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Scores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-hover rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400">Scénarios</p>
              <p className="text-4xl font-bold text-primary-500">{whitelist.scenarioScore}/30</p>
            </div>
            <div className="glass-hover rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400">Règles</p>
              <p className="text-4xl font-bold text-purple-500">{whitelist.rulesScore}/70</p>
            </div>
            <div className="glass-hover rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-4xl font-bold text-green-500">{whitelist.totalScore}/100</p>
            </div>
          </div>
        </div>
      )}

      {/* Décision */}
      {whitelist.decision && (
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Décision</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Statut</p>
              <p className={`text-2xl font-bold ${
                whitelist.decision === 'ACCEPTED' ? 'text-green-400' :
                whitelist.decision === 'REFUSED' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {whitelist.decision === 'ACCEPTED' ? '✅ Accepté' :
                 whitelist.decision === 'REFUSED' ? '❌ Refusé' : '⏳ En attente'}
              </p>
            </div>
            {whitelist.decisionReason && (
              <div>
                <p className="text-sm text-gray-400">Raison</p>
                <p className="font-medium">{whitelist.decisionReason}</p>
              </div>
            )}
            {whitelist.customMessage && (
              <div>
                <p className="text-sm text-gray-400">Message personnalisé</p>
                <p className="font-medium whitespace-pre-wrap">{whitelist.customMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Réponses */}
      {whitelist.answers && whitelist.answers.length > 0 && (
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Réponses</h2>
          <div className="space-y-4">
            {whitelist.answers.map((answer, idx) => (
              <div key={answer.id} className="glass rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">Question {idx + 1} - {answer.template.type}</p>
                    <p className="text-gray-300 mt-1">{answer.template.question}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${answer.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {answer.score || 0} pts
                    </p>
                  </div>
                </div>
                {answer.candidateAnswer && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">Réponse:</p>
                    <p className="text-gray-200">{answer.candidateAnswer}</p>
                  </div>
                )}
                {answer.notes && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">Notes:</p>
                    <p className="text-gray-200 italic">{answer.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commentaires */}
      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">Commentaires</h2>

        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="textarea h-24"
            placeholder="Ajouter un commentaire..."
          />
          <button onClick={handleAddComment} className="btn-primary">
            Ajouter
          </button>
        </div>

        {whitelist.comments && whitelist.comments.length > 0 ? (
          <div className="space-y-3">
            {whitelist.comments.map((comment) => (
              <div key={comment.id} className="glass rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                    {comment.admin.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{comment.admin.username}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>
                    <p className="text-gray-300">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">Aucun commentaire</p>
        )}
      </div>
    </div>
  );
}
