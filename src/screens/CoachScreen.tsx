import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IconArrowLeft, IconCheck, IconSparkles } from '../components/Icons';
import { GlassIcon } from '../components/GlassIcon';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout } from '../data/workouts';
import { getProgram } from '../data/programs';
import { buildCoachDigest, digestSizeBytes } from '../utils/coachDigest';
import type { CoachAiPriority, CoachAiResponse } from '../utils/coachDigest';
import { getCoachBrief } from '../utils/coach';
import {
  clearChat, maskApiKey, readCachedBrief, readChat, readStoredApiKey, requestCoachAi,
  sendChatMessage, writeCachedBrief, writeChat, writeStoredApiKey,
} from '../utils/coachAi';
import type { CachedBrief, ChatState } from '../utils/coachAi';

interface CoachScreenProps { onBack: () => void; }

// Couleur de la pastille de priorité. Le rouge est réservé à « haute » : s'il
// servait aussi au reste, il ne voudrait plus rien dire.
const PRIORITY_COLOR: Record<CoachAiPriority, string> = {
  haute: '#ef4444',
  moyenne: '#f59e0b',
  basse: 'var(--text-dim)',
};

const formatWhen = (ts: number): string => {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'hier' : `il y a ${days} j`;
};

export const CoachScreen: React.FC<CoachScreenProps> = ({ onBack }) => {
  const history = useWorkoutStore((s) => s.history);
  const trainingProfile = useWorkoutStore((s) => s.trainingProfile);
  const bodyWeightHistory = useWorkoutStore((s) => s.bodyWeightHistory);
  const weeklySessionGoal = useWorkoutStore((s) => s.weeklySessionGoal);
  const activeProgramId = useWorkoutStore((s) => s.activeProgramId);
  const customPrograms = useWorkoutStore((s) => s.customPrograms);

  const [apiKey, setApiKey] = useState<string>(readStoredApiKey);
  const [keyDraft, setKeyDraft] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);
  const [cached, setCached] = useState<CachedBrief | null>(readCachedBrief);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<ChatState>(readChat);
  const [asking, setAsking] = useState(false);
  // Fin de la liste des messages : on y descend à chaque nouveau message,
  // sinon la réponse arrive hors de l'écran sur un téléphone.
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  // Le champ garde le focus après l'envoi : sur téléphone, ça évite que le
  // clavier se referme entre deux messages d'une même conversation.
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Le digest est recalculé seulement quand les données changent — c'est du
  // pur calcul local, mais sur 10 semaines d'historique ça ne sert à rien de
  // le refaire à chaque frappe dans le champ de question.
  const digest = useMemo(() => buildCoachDigest({
    history,
    resolveWorkout: getWorkout,
    profile: trainingProfile,
    bodyWeightHistory,
    programName: getProgram(activeProgramId, customPrograms).name,
    weeklySessionGoal,
  }), [history, trainingProfile, bodyWeightHistory, activeProgramId, customPrograms, weeklySessionGoal]);

  // Repère de secours : le coach local, celui qui tourne sans réseau. Il
  // reste affiché sous le bilan IA — c'est lui qui parle pendant la séance.
  const localBrief = useMemo(() => getCoachBrief(history, getWorkout), [history]);

  const staleBrief = cached !== null && cached.sessions !== history.length;

  const handleResponse = (response: CoachAiResponse): boolean => {
    if (response.ok) { setError(null); setNeedsKey(false); return true; }
    setError(response.message);
    setNeedsKey(response.code === 'CLE_MANQUANTE' || response.code === 'CLE_INVALIDE');
    if (response.code === 'CLE_MANQUANTE' || response.code === 'CLE_INVALIDE') setKeyOpen(true);
    return false;
  };

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    const response = await requestCoachAi({ mode: 'brief', digest, apiKey: apiKey || undefined });
    if (handleResponse(response) && response.ok && response.mode === 'brief') {
      const fresh: CachedBrief = {
        brief: response.brief,
        at: Date.now(),
        model: response.model,
        sessions: history.length,
      };
      setCached(fresh);
      writeCachedBrief(fresh);
    }
    setLoading(false);
  };

  const ask = async () => {
    const clean = question.trim();
    if (!clean || asking) return;

    // Le message part à l'écran tout de suite : attendre la réponse pour
    // l'afficher donnerait l'impression que le bouton n'a rien fait.
    const withMine: ChatState = {
      ...chat,
      messages: [...chat.messages, { role: 'moi', text: clean, at: Date.now() }],
    };
    setChat(withMine);
    writeChat(withMine);
    setQuestion('');
    chatInputRef.current?.focus();
    setAsking(true);
    setError(null);

    const response = await sendChatMessage({
      digest,
      question: clean,
      previousInteractionId: chat.interactionId,
      apiKey: apiKey || undefined,
    });

    if (handleResponse(response) && response.ok && response.mode === 'chat') {
      const withReply: ChatState = {
        messages: [...withMine.messages, { role: 'coach', text: response.reponse, at: Date.now() }],
        interactionId: response.interactionId,
      };
      setChat(withReply);
      writeChat(withReply);
    }
    setAsking(false);
  };

  const resetChat = () => {
    clearChat();
    setChat({ messages: [] });
    setError(null);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [chat.messages.length, asking]);

  const saveKey = () => {
    const clean = keyDraft.trim();
    writeStoredApiKey(clean);
    setApiKey(clean);
    setKeyDraft('');
    setNeedsKey(false);
    setError(null);
  };

  const clearKey = () => {
    writeStoredApiKey('');
    setApiKey('');
    setKeyDraft('');
  };

  const digestKo = (digestSizeBytes(digest) / 1024).toFixed(1).replace('.', ',');

  return (
    <div className="screen-ambient" style={container}>
      <div style={scroll}>

        <div style={headerRow}>
          <button onClick={onBack} className="glass-icon" style={backBtn} aria-label="Retour"><IconArrowLeft size={17} /></button>
          <GlassIcon size={38} accent><IconSparkles size={19} /></GlassIcon>
          <div>
            <h1 style={title}>Coach</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
              Un vrai bilan de tes stats, écrit par Gemini
            </p>
          </div>
        </div>

        {/* ── Bilan ────────────────────────────────────────────────────── */}
        <p style={sectionLabel}>BILAN</p>

        {cached ? (
          <div style={card}>
            <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5, fontWeight: 600 }}>
              {cached.brief.resume}
            </p>

            {cached.brief.points.map((point, i) => (
              <div key={i} style={pointRow}>
                <span style={{ ...priorityDot, background: PRIORITY_COLOR[point.priorite] }} aria-hidden="true" />
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>{point.titre}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.45, marginTop: 3 }}>{point.constat}</p>
                  <p style={{ color: 'var(--text-primary)', fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>
                    → {point.action}
                  </p>
                </div>
              </div>
            ))}

            <p style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.45, marginTop: 12, fontStyle: 'italic' }}>
              {cached.brief.encouragement}
            </p>

            <p style={metaLine}>
              {formatWhen(cached.at)} · {cached.model}
              {staleBrief && ' · nouvelle séance depuis, le bilan est à refaire'}
            </p>
          </div>
        ) : (
          <div style={card}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Aucun bilan pour l'instant. L'appli envoie un résumé chiffré de tes {history.length} séances
              enregistrées ({digestKo} Ko, jamais ton historique complet) et Gemini le commente.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={generate}
          disabled={loading || history.length === 0}
          style={{ ...primaryBtn, opacity: loading || history.length === 0 ? 0.55 : 1 }}
        >
          {loading ? 'Analyse en cours…' : cached ? 'Actualiser le bilan' : 'Générer le bilan'}
        </button>

        {history.length === 0 && (
          <p style={hintLine}>Enregistre au moins une séance : sans données, il n'y a rien à analyser.</p>
        )}

        {error && (
          <div style={errorCard}>
            <p style={{ color: 'var(--text-primary)', fontSize: 12.5, lineHeight: 1.45 }}>{error}</p>
          </div>
        )}

        {/* ── Conversation ─────────────────────────────────────────────── */}
        <div style={chatHeaderRow}>
          <p style={{ ...sectionLabel, margin: 0 }}>PARLER AU COACH</p>
          {chat.messages.length > 0 && (
            <button type="button" onClick={resetChat} style={linkBtn}>Effacer</button>
          )}
        </div>

        <div style={card}>
          {chat.messages.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.5 }}>
              Pose-lui ce que tu veux : il a tes stats sous les yeux, et il se souvient de ce qui
              a été dit avant dans la conversation.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chat.messages.map((message, i) => (
                <div key={i} style={message.role === 'moi' ? bubbleMineWrap : bubbleCoachWrap}>
                  <div style={message.role === 'moi' ? bubbleMine : bubbleCoach}>{message.text}</div>
                </div>
              ))}
              {asking && (
                <div style={bubbleCoachWrap}>
                  <div style={{ ...bubbleCoach, color: 'var(--text-dim)' }}>Le coach réfléchit…</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          <textarea
            ref={chatInputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pourquoi mon développé couché stagne ?"
            rows={2}
            style={{ ...textareaStyle, marginTop: chat.messages.length === 0 ? 12 : 14 }}
          />
          <button
            type="button"
            onClick={ask}
            disabled={asking || !question.trim()}
            style={{ ...primaryBtn, marginTop: 8, opacity: asking || !question.trim() ? 0.55 : 1 }}
          >
            {asking ? 'Le coach réfléchit…' : 'Envoyer'}
          </button>
        </div>

        {/* ── Coach local ──────────────────────────────────────────────── */}
        {localBrief && (
          <>
            <p style={sectionLabel}>COACH LOCAL (SANS RÉSEAU)</p>
            <div style={card}>
              <p style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.45 }}>{localBrief.recap}</p>
              <p style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.45, marginTop: 6 }}>{localBrief.focus}</p>
              <p style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>→ {localBrief.action}</p>
              <p style={metaLine}>
                Calculé sur ton téléphone, sans réseau — c'est lui qui te conseille pendant la séance.
              </p>
            </div>
          </>
        )}

        {/* ── Clé d'API ────────────────────────────────────────────────── */}
        <p style={sectionLabel}>CLÉ D'API</p>
        <div style={{ ...card, border: needsKey ? '1px solid var(--brand-1)' : card.border }}>
          {keyOpen ? (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.45, marginBottom: 10 }}>
                Colle ici une clé Gemini créée sur <strong style={{ color: 'var(--text-primary)' }}>aistudio.google.com/apikey</strong>.
                Elle reste sur ce téléphone et n'est envoyée qu'à la fonction du site au moment d'un bilan.
                Si une clé est déjà configurée sur Vercel, tu peux laisser ce champ vide.
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="password"
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  placeholder={apiKey ? maskApiKey(apiKey) : 'AIza…'}
                  autoComplete="off"
                  spellCheck={false}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={saveKey}
                  disabled={!keyDraft.trim()}
                  style={{ ...iconBtn, opacity: keyDraft.trim() ? 1 : 0.4 }}
                  aria-label="Enregistrer la clé"
                >
                  <IconCheck size={15} />
                </button>
              </div>
              {apiKey && (
                <button type="button" onClick={clearKey} style={linkBtn}>Supprimer la clé enregistrée</button>
              )}
            </>
          ) : (
            <button type="button" onClick={() => setKeyOpen(true)} style={keyRow}>
              <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                {apiKey ? `Clé enregistrée · ${maskApiKey(apiKey)}` : 'Aucune clé dans l’appli'}
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                {apiKey ? 'Modifier' : 'Ajouter'}
              </span>
            </button>
          )}
        </div>

        <p style={hintLine}>
          Sans clé ici, l'appli utilise celle du serveur (GEMINI_API_KEY sur Vercel). Avec une clé ici, c'est
          celle-ci qui passe devant.
        </p>

      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 112px' };
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 18,
  borderBottom: '1px solid var(--border-subtle)', marginBottom: 18,
};
const backBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12, background: 'var(--bg-elevated)',
  border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 18, flexShrink: 0,
};
const title: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 };
const sectionLabel: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
  margin: '18px 0 10px',
};
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: 14,
  border: '1px solid var(--border-mid)', marginBottom: 8,
};
const pointRow: React.CSSProperties = {
  display: 'flex', gap: 10, alignItems: 'flex-start',
  marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)',
};
const priorityDot: React.CSSProperties = {
  width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 5,
};
const metaLine: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 11, marginTop: 12,
};
const hintLine: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 11.5, lineHeight: 1.45, margin: '8px 2px 0',
};
const errorCard: React.CSSProperties = {
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 14, padding: '12px 14px', marginTop: 10,
};
const primaryBtn: React.CSSProperties = {
  width: '100%', marginTop: 6,
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
const inputStyle: React.CSSProperties = {
  flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
};
const textareaStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14,
  fontFamily: 'inherit', resize: 'vertical', outline: 'none',
};
const iconBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  color: 'var(--text-primary)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const linkBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', padding: '10px 0 0',
  color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
};
const chatHeaderRow: React.CSSProperties = {
  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
  gap: 10, margin: '18px 0 10px',
};
const bubbleMineWrap: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end' };
const bubbleCoachWrap: React.CSSProperties = { display: 'flex', justifyContent: 'flex-start' };
const bubbleBase: React.CSSProperties = {
  maxWidth: '85%', borderRadius: 14, padding: '9px 12px',
  fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap',
};
const bubbleMine: React.CSSProperties = {
  ...bubbleBase,
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  color: '#fff', borderBottomRightRadius: 5,
};
const bubbleCoach: React.CSSProperties = {
  ...bubbleBase,
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', borderBottomLeftRadius: 5,
};
const keyRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  width: '100%', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
};
