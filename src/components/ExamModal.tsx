import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { Exam, ExamTopic } from '../types/study';
import { addDaysToDateString, getTodayString } from '../utils/dateUtils';

interface ExamModalProps {
  open: boolean;
  editingExam: Exam | null;
  onClose: () => void;
}

const ACCENT_PALETTE = [
  { label: 'Indigo', hex: '#4F46E5' },
  { label: 'Emerald', hex: '#10B981' },
  { label: 'Amber', hex: '#F59E0B' },
  { label: 'Rose', hex: '#E11D48' },
];

export const ExamModal: React.FC<ExamModalProps> = ({ open, editingExam, onClose }) => {
  const { addExam, updateExam } = useStudy();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [provider, setProvider] = useState('');
  const [targetDate, setTargetDate] = useState(addDaysToDateString(getTodayString(), 30));
  const [accentColor, setAccentColor] = useState('#4F46E5');
  const [topics, setTopics] = useState<Array<{ name: string; weightPct: number }>>([
    { name: 'Core Architecture & Principles', weightPct: 35 },
    { name: 'Implementation & Operations', weightPct: 35 },
    { name: 'Security, Governance & Troubleshooting', weightPct: 30 },
  ]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editingExam) {
      setTitle(editingExam.title);
      setCode(editingExam.code);
      setProvider(editingExam.provider);
      setTargetDate(editingExam.targetDate);
      setAccentColor(editingExam.accentColor);
    } else {
      setTitle('');
      setCode('');
      setProvider('');
      setTargetDate(addDaysToDateString(getTodayString(), 30));
      setAccentColor('#4F46E5');
      setTopics([
        { name: 'Core Architecture & Principles', weightPct: 35 },
        { name: 'Implementation & Operations', weightPct: 35 },
        { name: 'Security, Governance & Troubleshooting', weightPct: 30 },
      ]);
    }
    setError('');
  }, [open, editingExam]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      setError('Exam title and exam code are required.');
      return;
    }

    if (editingExam) {
      updateExam(editingExam.id, {
        title: title.trim(),
        code: code.trim().toUpperCase(),
        provider: provider.trim() || 'Certification',
        targetDate,
        accentColor,
      });
    } else {
      const cleanedTopics: ExamTopic[] = topics
        .filter((t) => t.name.trim().length > 0)
        .map((t, idx) => ({
          id: `topic-${Date.now()}-${idx}`,
          name: t.name.trim(),
          weightPct: Math.max(5, Number(t.weightPct) || 20),
          status: 'needs_focus',
        }));

      addExam({
        title: title.trim(),
        code: code.trim().toUpperCase(),
        provider: provider.trim() || 'Certification',
        targetDate,
        accentColor,
        topics:
          cleanedTopics.length > 0
            ? cleanedTopics
            : [
                {
                  id: `topic-${Date.now()}-0`,
                  name: 'Core Exam Objectives',
                  weightPct: 100,
                  status: 'needs_focus',
                },
              ],
      });
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#0F172A]/40 backdrop-blur-[4px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-modal-title"
    >
      <div className="w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl border border-[#E5E7EB] shadow-[0_20px_25px_-5px_rgba(15,23,42,0.12)] max-h-[90vh] overflow-y-auto">
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-[#CBD5E1]" />
        </div>

        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 id="exam-modal-title" className="font-display text-lg font-bold text-[#0F172A]">
            {editingExam ? 'Edit Exam Milestone' : 'Add Certification Exam'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 -mr-2 rounded-xl flex items-center justify-center text-[#64748B] hover:bg-[#F1F4F9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="exam-title" className="block text-xs font-semibold text-[#475569] mb-1.5">
              Certification Title
            </label>
            <input
              id="exam-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Certified Kubernetes Administrator"
              className="w-full h-12 px-3.5 rounded-xl input-surface text-sm text-[#0F172A]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="exam-code" className="block text-xs font-semibold text-[#475569] mb-1.5">
                Exam Code
              </label>
              <input
                id="exam-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., CKA"
                className="w-full h-12 px-3.5 rounded-xl input-surface text-sm text-[#0F172A] uppercase"
              />
            </div>
            <div>
              <label htmlFor="exam-provider" className="block text-xs font-semibold text-[#475569] mb-1.5">
                Provider
              </label>
              <input
                id="exam-provider"
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g., CNCF"
                className="w-full h-12 px-3.5 rounded-xl input-surface text-sm text-[#0F172A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exam-date" className="block text-xs font-semibold text-[#475569] mb-1.5">
                Target Exam Date
              </label>
              <input
                id="exam-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full h-12 px-3 rounded-xl input-surface text-sm text-[#0F172A] tabular-nums"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#475569] mb-1.5">Accent Marker</span>
              <div className="h-12 flex items-center gap-2.5">
                {ACCENT_PALETTE.map((swatch) => {
                  const selected = accentColor === swatch.hex;
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => setAccentColor(swatch.hex)}
                      aria-label={swatch.label}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${
                        selected ? 'ring-2 ring-offset-2 ring-[#0F172A] scale-105' : ''
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {!editingExam && (
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#475569]">Initial Syllabus Domains</span>
                <button
                  type="button"
                  onClick={() => setTopics((prev) => [...prev, { name: '', weightPct: 20 }])}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#4F46E5] hover:text-[#3525CD]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add domain
                </button>
              </div>
              <div className="space-y-2">
                {topics.map((tp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tp.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTopics((prev) => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
                      }}
                      placeholder={`Domain ${idx + 1}`}
                      className="flex-1 h-10 px-3 rounded-xl input-surface text-sm text-[#0F172A]"
                    />
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={tp.weightPct}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTopics((prev) => prev.map((item, i) => (i === idx ? { ...item, weightPct: val } : item)));
                      }}
                      className="w-16 h-10 px-2 rounded-xl input-surface text-sm text-center tabular-nums text-[#0F172A]"
                      aria-label="Weight percentage"
                    />
                    {topics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setTopics((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label="Remove domain"
                        className="w-9 h-10 flex items-center justify-center text-[#94A3B8] hover:text-[#DC2626]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs font-medium text-[#DC2626]">{error}</p>}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] text-sm font-semibold text-[#475569]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[1.5] h-12 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold cursor-pointer"
            >
              {editingExam ? 'Save Changes' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
