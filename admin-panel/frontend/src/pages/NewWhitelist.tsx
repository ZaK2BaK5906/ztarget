import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { whitelistApi } from '@/lib/api';
import { ExperienceLevel, WhitelistCategory, WhitelistDecision, TemplateType, type Answer } from '@/types';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

interface WhitelistFormData {
  candidateFirstname: string;
  candidateLastname: string;
  candidateDiscord: string;
  candidateAge: number;
  candidateRpHours: number;
  experienceLevel: ExperienceLevel | '';
  category: WhitelistCategory | '';
  adminNotes: string;
}

export default function NewWhitelist() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [whitelistId, setWhitelistId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [discordCheckResult, setDiscordCheckResult] = useState<any>(null);
  const [discordVerified, setDiscordVerified] = useState(false);

  const [formData, setFormData] = useState<WhitelistFormData>({
    candidateFirstname: '',
    candidateLastname: '',
    candidateDiscord: '',
    candidateAge: 18,
    candidateRpHours: 0,
    experienceLevel: '',
    category: '',
    adminNotes: ''
  });

  const [finalDecision, setFinalDecision] = useState({
    decision: '' as WhitelistDecision | '',
    decisionReason: '',
    customMessage: '',
    reexamDate: ''
  });

  // Vérifier le Discord
  const handleCheckDiscord = async () => {
    if (!formData.candidateDiscord) {
      toast.error('Veuillez saisir un pseudo Discord');
      return;
    }

    // Vérification format Discord
    if (!formData.candidateDiscord.includes('#') && !formData.candidateDiscord.includes('@')) {
      toast.error('Format Discord invalide (exemple: Username#1234 ou @username)');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await whitelistApi.checkDiscord(formData.candidateDiscord);
      setDiscordCheckResult(data);
      setDiscordVerified(true);

      if (!data.exists) {
        toast.success('✅ Aucune whitelist trouvée, vous pouvez continuer');
      } else {
        toast.info(data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la vérification');
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 1: Créer la whitelist et récupérer les questions
  const handleStep1Submit = async () => {
    if (!discordVerified) {
      toast.error('Veuillez d\'abord vérifier le pseudo Discord');
      return;
    }
    if (!formData.candidateFirstname || !formData.candidateLastname || !formData.candidateDiscord || !formData.experienceLevel || !formData.category) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await whitelistApi.create({
        ...formData,
        candidateAge: Number(formData.candidateAge)
      } as any);

      setWhitelistId(data.whitelist.id);
      setAnswers(data.whitelist.answers);
      toast.success('Entretien démarré avec succès !');
      setStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour une réponse
  const updateAnswer = async (answerId: string, data: Partial<Answer>) => {
    if (!whitelistId) return;

    try {
      await whitelistApi.updateAnswer(whitelistId, answerId, data);
      setAnswers(prev => prev.map(a => a.id === answerId ? { ...a, ...data } : a));
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Finaliser la whitelist
  const handleFinalize = async () => {
    if (!finalDecision.decision) {
      toast.error('Veuillez sélectionner une décision');
      return;
    }

    if (finalDecision.decision === WhitelistDecision.REFUSED && !finalDecision.decisionReason) {
      toast.error('La raison du refus est obligatoire');
      return;
    }

    setIsLoading(true);
    try {
      await whitelistApi.finalize(whitelistId!, finalDecision);
      toast.success('Whitelist finalisée avec succès !');
      navigate('/whitelists');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la finalisation');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcul du score total
  const calculateScores = () => {
    const scenarioAnswers = answers.filter(a => a.template.type === TemplateType.SCENARIO);
    const mandatoryAnswers = answers.filter(a => a.template.type === TemplateType.MANDATORY_QUESTION);
    const rulesAnswers = answers.filter(a => a.template.type === TemplateType.RULES_QUESTION);
    const lexiconAnswers = answers.filter(a => a.template.type === TemplateType.LEXICON);

    const scenarioScore = scenarioAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
    const rulesScore = [...mandatoryAnswers, ...rulesAnswers, ...lexiconAnswers].reduce((sum, a) => sum + (a.score || 0), 0);
    const total = scenarioScore + rulesScore;

    return { scenarioScore, rulesScore, total };
  };

  const scores = calculateScores();

  const copierMessage = () => {
    if (finalDecision.customMessage) {
      navigator.clipboard.writeText(finalDecision.customMessage);
      toast.success('Message copié dans le presse-papier !');
    }
  };

  const renderQuestionBlock = (answer: Answer, index: number) => (
    <div key={answer.id} className="card p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">
            Question {index + 1} - {answer.template.type.replace('_', ' ')}
          </h3>
          <p className="text-gray-300 mb-2">{answer.template.question}</p>
          {answer.template.answer && (
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 mb-3">
              <p className="text-sm text-green-300">
                <span className="font-semibold">Réponse attendue: </span>
                {answer.template.answer}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Réponse du candidat
          </label>
          <textarea
            value={answer.candidateAnswer || ''}
            onChange={(e) => updateAnswer(answer.id, { candidateAnswer: e.target.value })}
            className="textarea h-24"
            placeholder="Notez la réponse du candidat..."
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Évaluation
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateAnswer(answer.id, { isCorrect: true, score: answer.template.type === TemplateType.SCENARIO ? 10 : 7 })}
                className={`flex-1 btn ${answer.isCorrect === true ? 'btn-success' : 'btn-secondary'}`}
              >
                <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                Valider
              </button>
              <button
                onClick={() => updateAnswer(answer.id, { isCorrect: false, score: 0 })}
                className={`flex-1 btn ${answer.isCorrect === false ? 'btn-danger' : 'btn-secondary'}`}
              >
                <XCircleIcon className="w-5 h-5 inline mr-2" />
                Refuser
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Score ({answer.template.type === TemplateType.SCENARIO ? '0-10' : '0-7'})
            </label>
            <input
              type="number"
              min="0"
              max={answer.template.type === TemplateType.SCENARIO ? 10 : 7}
              value={answer.score || 0}
              onChange={(e) => updateAnswer(answer.id, { score: Number(e.target.value) })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (optionnel)
            </label>
            <input
              type="text"
              value={answer.notes || ''}
              onChange={(e) => updateAnswer(answer.id, { notes: e.target.value })}
              className="input"
              placeholder="Notes supplémentaires..."
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Nouvel Entretien de Whitelist</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className={step >= 1 ? 'text-primary-500' : ''}>1. Infos</span>
          <span>→</span>
          <span className={step >= 2 ? 'text-primary-500' : ''}>2. Catégorie</span>
          <span>→</span>
          <span className={step >= 3 ? 'text-primary-500' : ''}>3. Questions</span>
          <span>→</span>
          <span className={step >= 4 ? 'text-primary-500' : ''}>4. Évaluation</span>
          <span>→</span>
          <span className={step >= 5 ? 'text-primary-500' : ''}>5. Finalisation</span>
        </div>
      </div>

      {/* ÉTAPE 1: Informations du candidat */}
      {step === 1 && (
        <div className="card space-y-6">
          <h2 className="text-xl font-semibold">Étape 1 - Informations du candidat</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prénom RP *
              </label>
              <input
                type="text"
                value={formData.candidateFirstname}
                onChange={(e) => setFormData({ ...formData, candidateFirstname: e.target.value })}
                className="input"
                placeholder="John"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom RP *
              </label>
              <input
                type="text"
                value={formData.candidateLastname}
                onChange={(e) => setFormData({ ...formData, candidateLastname: e.target.value })}
                className="input"
                placeholder="Doe"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discord *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.candidateDiscord}
                  onChange={(e) => {
                    setFormData({ ...formData, candidateDiscord: e.target.value });
                    setDiscordVerified(false);
                    setDiscordCheckResult(null);
                  }}
                  className="input flex-1"
                  placeholder="Username#1234 ou @username"
                />
                <button
                  type="button"
                  onClick={handleCheckDiscord}
                  disabled={isLoading || !formData.candidateDiscord}
                  className="btn-primary px-6 disabled:opacity-50"
                >
                  {isLoading ? 'Vérification...' : 'Vérifier'}
                </button>
              </div>

              {/* Résultat de la vérification */}
              {discordCheckResult && discordCheckResult.exists && (
                <div className={`mt-3 p-4 rounded-lg border ${
                  discordCheckResult.isBanned
                    ? 'bg-red-900/20 border-red-700/50'
                    : discordCheckResult.status === 'REFUSED_TOO_SOON'
                    ? 'bg-orange-900/20 border-orange-700/50'
                    : discordCheckResult.status === 'REFUSED_CAN_RETRY'
                    ? 'bg-yellow-900/20 border-yellow-700/50'
                    : discordCheckResult.status === 'ACCEPTED'
                    ? 'bg-green-900/20 border-green-700/50'
                    : 'bg-blue-900/20 border-blue-700/50'
                }`}>
                  <p className="font-semibold mb-2">{discordCheckResult.message}</p>
                  {discordCheckResult.latestWhitelist && (
                    <div className="text-sm space-y-1 mt-2">
                      <p>Dernière WL: {new Date(discordCheckResult.latestWhitelist.startedAt).toLocaleDateString('fr-FR')}</p>
                      <p>Score: {discordCheckResult.latestWhitelist.totalScore || 0}/100</p>
                      <p>Admin: {discordCheckResult.latestWhitelist.admin?.username}</p>
                      {discordCheckResult.hoursRemaining && (
                        <p className="text-orange-400 font-semibold">
                          Délai restant: {discordCheckResult.hoursRemaining}h
                        </p>
                      )}
                      <button
                        onClick={() => navigate(`/whitelists/${discordCheckResult.latestWhitelist.id}`)}
                        className="mt-2 btn-secondary text-sm"
                      >
                        Voir la whitelist →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {discordVerified && !discordCheckResult?.exists && (
                <div className="mt-2 flex items-center gap-2 text-green-500 bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="text-sm font-semibold">Discord vérifié ✓</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Âge *
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={formData.candidateAge}
                onChange={(e) => setFormData({ ...formData, candidateAge: Number(e.target.value) })}
                className="input"
              />
              {formData.candidateAge < 18 && (
                <div className="mt-2 flex items-center gap-2 text-red-500 bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span className="text-sm font-semibold">ATTENTION: Candidat mineur !</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre d'heures RP
              </label>
              <input
                type="number"
                min="0"
                value={formData.candidateRpHours}
                onChange={(e) => setFormData({ ...formData, candidateRpHours: Number(e.target.value) })}
                className="input"
                placeholder="Ex: 500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expérience RP *
              </label>
              <select
                value={formData.experienceLevel}
                onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as ExperienceLevel })}
                className="select"
              >
                <option value="">Sélectionner...</option>
                <option value={ExperienceLevel.DEBUTANT}>Débutant</option>
                <option value={ExperienceLevel.INTERMEDIAIRE}>Intermédiaire</option>
                <option value={ExperienceLevel.EXPERIMENTE}>Expérimenté</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as WhitelistCategory })}
                className="select"
              >
                <option value="">Sélectionner...</option>
                <option value={WhitelistCategory.LEGAL}>Legal</option>
                <option value={WhitelistCategory.ILLEGAL}>Illégal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes personnelles (optionnel)
            </label>
            <textarea
              value={formData.adminNotes}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              className="textarea h-24"
              placeholder="Vos notes personnelles sur le candidat..."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleStep1Submit}
              disabled={isLoading}
              className="btn-primary px-8 disabled:opacity-50"
            >
              {isLoading ? 'Démarrage...' : 'Démarrer l\'entretien'}
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 2-4: Questions */}
      {step >= 2 && step <= 4 && whitelistId && (
        <div className="space-y-6">
          <div className="card bg-primary-900/20 border-primary-700/50">
            <h2 className="text-xl font-semibold mb-2">
              Catégorie sélectionnée: {formData.category}
            </h2>
            <p className="text-gray-300">
              Candidat: {formData.candidateFirstname} {formData.candidateLastname} ({formData.candidateDiscord})
            </p>
          </div>

          {/* Questions obligatoires */}
          {answers.filter(a => a.template.type === TemplateType.MANDATORY_QUESTION).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Questions Obligatoires (3)</h2>
              {answers
                .filter(a => a.template.type === TemplateType.MANDATORY_QUESTION)
                .map((answer, idx) => renderQuestionBlock(answer, idx))}
            </div>
          )}

          {/* Scénarios */}
          {answers.filter(a => a.template.type === TemplateType.SCENARIO).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Scénarios RP (3) - /30 points</h2>
              {answers
                .filter(a => a.template.type === TemplateType.SCENARIO)
                .map((answer, idx) => renderQuestionBlock(answer, idx))}
            </div>
          )}

          {/* Questions de règlement */}
          {answers.filter(a => a.template.type === TemplateType.RULES_QUESTION).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Questions de Règlement (5) - /35 points</h2>
              {answers
                .filter(a => a.template.type === TemplateType.RULES_QUESTION)
                .map((answer, idx) => renderQuestionBlock(answer, idx))}
            </div>
          )}

          {/* Lexiques */}
          {answers.filter(a => a.template.type === TemplateType.LEXICON).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Lexiques (2) - /14 points</h2>
              {answers
                .filter(a => a.template.type === TemplateType.LEXICON)
                .map((answer, idx) => renderQuestionBlock(answer, idx))}
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(Math.max(1, step - 1))} className="btn-secondary px-8">
              Retour
            </button>
            <button onClick={() => setStep(5)} className="btn-primary px-8">
              Finaliser l'entretien
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 5: Finalisation */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="card space-y-6">
            <h2 className="text-2xl font-bold">Récapitulatif & Décision</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-hover rounded-lg p-6 text-center">
                <p className="text-sm text-gray-400">Score Scénarios</p>
                <p className="text-4xl font-bold text-primary-500">{scores.scenarioScore}/30</p>
              </div>
              <div className="glass-hover rounded-lg p-6 text-center">
                <p className="text-sm text-gray-400">Score Règles</p>
                <p className="text-4xl font-bold text-purple-500">{scores.rulesScore}/70</p>
              </div>
              <div className="glass-hover rounded-lg p-6 text-center">
                <p className="text-sm text-gray-400">Score Total</p>
                <p className="text-4xl font-bold text-green-500">{scores.total}/100</p>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <p className="text-sm">
                <span className="font-semibold">Suggestion automatique: </span>
                {scores.total >= 70 ? (
                  <span className="text-green-400">✅ ACCEPTER (score ≥ 70)</span>
                ) : scores.total >= 50 ? (
                  <span className="text-yellow-400">⏳ EN ATTENTE (score entre 50 et 70)</span>
                ) : (
                  <span className="text-red-400">❌ REFUSER (score &lt; 50)</span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Décision finale *
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setFinalDecision({ ...finalDecision, decision: WhitelistDecision.ACCEPTED })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    finalDecision.decision === WhitelistDecision.ACCEPTED
                      ? 'border-green-500 bg-green-900/30'
                      : 'border-gray-700 hover:border-green-700'
                  }`}
                >
                  <CheckCircleIcon className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="font-semibold">Accepter</p>
                </button>
                <button
                  onClick={() => setFinalDecision({ ...finalDecision, decision: WhitelistDecision.REFUSED })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    finalDecision.decision === WhitelistDecision.REFUSED
                      ? 'border-red-500 bg-red-900/30'
                      : 'border-gray-700 hover:border-red-700'
                  }`}
                >
                  <XCircleIcon className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="font-semibold">Refuser</p>
                </button>
                <button
                  onClick={() => setFinalDecision({ ...finalDecision, decision: WhitelistDecision.WAITING })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    finalDecision.decision === WhitelistDecision.WAITING
                      ? 'border-yellow-500 bg-yellow-900/30'
                      : 'border-gray-700 hover:border-yellow-700'
                  }`}
                >
                  <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="font-semibold">En attente</p>
                </button>
              </div>
            </div>

            {finalDecision.decision === WhitelistDecision.REFUSED && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Raison du refus *
                  </label>
                  <select
                    value={finalDecision.decisionReason}
                    onChange={(e) => setFinalDecision({ ...finalDecision, decisionReason: e.target.value })}
                    className="select mb-2"
                  >
                    <option value="">Sélectionner une raison...</option>
                    <option value="Score insuffisant">Score insuffisant</option>
                    <option value="Manque de connaissance RP">Manque de connaissance RP</option>
                    <option value="Règlement non maîtrisé">Règlement non maîtrisé</option>
                    <option value="Comportement inapproprié">Comportement inapproprié</option>
                    <option value="Autre">Autre (préciser dans le message)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date de réexamen (optionnel)
                  </label>
                  <input
                    type="date"
                    value={finalDecision.reexamDate}
                    onChange={(e) => setFinalDecision({ ...finalDecision, reexamDate: e.target.value })}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message personnalisé (copié pour Discord)
              </label>
              <textarea
                value={finalDecision.customMessage}
                onChange={(e) => setFinalDecision({ ...finalDecision, customMessage: e.target.value })}
                className="textarea h-32"
                placeholder="Message à envoyer au candidat via Discord..."
              />
              {finalDecision.customMessage && (
                <button
                  onClick={copierMessage}
                  className="mt-2 btn-secondary text-sm flex items-center gap-2"
                >
                  <ClipboardDocumentIcon className="w-4 h-4" />
                  Copier le message
                </button>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(4)} className="btn-secondary px-8">
                Retour
              </button>
              <button
                onClick={handleFinalize}
                disabled={isLoading || !finalDecision.decision}
                className="btn-primary px-8 disabled:opacity-50"
              >
                {isLoading ? 'Finalisation...' : 'Finaliser & Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
