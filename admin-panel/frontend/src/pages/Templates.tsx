import { useEffect, useState } from 'react';
import { templateApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { Template, TemplateType, WhitelistCategory } from '@/types';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

export default function Templates() {
  const { admin } = useAuthStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    type: '' as TemplateType | '',
    category: '' as WhitelistCategory | '',
    question: '',
    answer: '',
    orderIndex: 0
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data } = await templateApi.getAll();
      setTemplates(data);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.question) {
      toast.error('Type et question requis');
      return;
    }

    try {
      if (editingTemplate) {
        await templateApi.update(editingTemplate.id, formData as any);
        toast.success('Template modifié');
      } else {
        await templateApi.create(formData as any);
        toast.success('Template créé');
      }
      setShowModal(false);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce template ?')) return;

    try {
      await templateApi.delete(id);
      toast.success('Template supprimé');
      loadTemplates();
    } catch (error) {
      toast.error('Erreur de suppression');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await templateApi.duplicate(id);
      toast.success('Template dupliqué');
      loadTemplates();
    } catch (error) {
      toast.error('Erreur de duplication');
    }
  };

  const resetForm = () => {
    setFormData({
      type: '',
      category: '',
      question: '',
      answer: '',
      orderIndex: 0
    });
    setEditingTemplate(null);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      category: template.category || '',
      question: template.question,
      answer: template.answer || '',
      orderIndex: template.orderIndex || 0
    });
    setShowModal(true);
  };

  if (!admin?.permissions.canViewTemplates && !admin?.isMasterAdmin) {
    return <div className="card">Accès refusé</div>;
  }

  const canManage = admin?.permissions.canManageTemplates || admin?.isMasterAdmin;

  const groupedTemplates = {
    MANDATORY_QUESTION: templates.filter(t => t.type === 'MANDATORY_QUESTION'),
    SCENARIO: templates.filter(t => t.type === 'SCENARIO'),
    RULES_QUESTION: templates.filter(t => t.type === 'RULES_QUESTION'),
    LEXICON: templates.filter(t => t.type === 'LEXICON')
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Templates</h1>
        {canManage && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nouveau Template
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([type, items]) => (
            <div key={type} className="card space-y-4">
              <h2 className="text-xl font-semibold">
                {type.replace('_', ' ')} ({items.length})
              </h2>
              <div className="space-y-3">
                {items.map((template) => (
                  <div key={template.id} className="glass-hover rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium mb-2">{template.question}</p>
                        {template.answer && (
                          <p className="text-sm text-green-400 bg-green-900/20 border border-green-700/50 rounded p-2">
                            Réponse: {template.answer}
                          </p>
                        )}
                        {template.category && (
                          <p className="text-xs text-gray-400 mt-2">Catégorie: {template.category}</p>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDuplicate(template.id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Dupliquer"
                          >
                            <DocumentDuplicateIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(template)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-2 hover:bg-red-900/30 rounded-lg transition-colors text-red-400"
                            title="Supprimer"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-gray-400 text-center py-4">Aucun template</p>
                )}
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
              {editingTemplate ? 'Modifier' : 'Nouveau'} Template
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TemplateType })}
                  className="select"
                  required
                >
                  <option value="">Sélectionner...</option>
                  <option value="MANDATORY_QUESTION">Question Obligatoire</option>
                  <option value="SCENARIO">Scénario RP</option>
                  <option value="RULES_QUESTION">Question de Règlement</option>
                  <option value="LEXICON">Lexique</option>
                </select>
              </div>

              {formData.type === 'SCENARIO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as WhitelistCategory })}
                    className="select"
                  >
                    <option value="">Toutes</option>
                    <option value="LEGAL">Legal</option>
                    <option value="ILLEGAL">Illégal</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Question / Scénario *
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="textarea h-32"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Réponse attendue (optionnel)
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="textarea h-24"
                />
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
                  {editingTemplate ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
