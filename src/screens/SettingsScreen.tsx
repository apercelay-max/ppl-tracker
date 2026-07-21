import React, { useState, useRef, useEffect } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { ACCENT_PRESETS, GYM_PRESETS } from '../data/accents';
import type { HomeSectionKey } from '../store/workoutStore';
import { ICON_SHAPE_RADIUS, ICON_SHAPE_LABEL, ICON_SIZE_LABEL } from '../data/iconPrefs';
import type { IconShape, IconSize } from '../data/iconPrefs';
import { WORKOUTS } from '../data/workouts';
import { getAllPrograms } from '../data/programs';
import { parseImportedFile, parseExcelWorkbook } from '../utils/importParser';
import type { ImportResult } from '../utils/importParser';
import { useAuth } from '../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { SyncStatus } from '../hooks/useCloudSync';
import { CARDIO_TYPE_LABELS } from '../store/workoutStore';
import type { CardioActivityType, NavTabKey } from '../data/types';

const CARDIO_TYPES: CardioActivityType[] = ['velo', 'marche', 'course', 'autre'];

// Métadonnées d'affichage des onglets de la barre de navigation — même liste
// que TABS dans NavBar.tsx (sans "Réglages", qui reste toujours affiché et
// n'a donc pas besoin d'interrupteur).
const NAV_TAB_META: { id: NavTabKey; label: string; emoji: string }[] = [
{ id: 'home', label: 'Accueil', emoji: '🏠' },
{ id: 'objectifs', label: 'Objectifs', emoji: '🎯' },
{ id: 'historique', label: 'Historique', emoji: '🗓️' },
{ id: 'cardio', label: 'Cardio', emoji: '🏃' },
{ id: 'exercices', label: 'Exercices', emoji: '🏋️' },
{ id: 'poids', label: 'Poids (essai)', emoji: '⚖️' },
{ id: 'dashboard', label: 'Stats', emoji: '📊' },
{ id: 'profil', label: 'Profil', emoji: '👤' },
];

const formatRest = (seconds: number): string => {
const m = Math.floor(seconds / 60);
const s = seconds % 60;
return `${m}:${s.toString().padStart(2, '0')}`;
};

interface SettingsScreenProps {
onBack: () => void;
onOpenAccount: () => void;
syncStatus?: SyncStatus;
lastSyncedAt?: number | null;
}

const FONT_SCALES: { id: 'sm' | 'md' | 'lg'; label: string; preview: number }[] = [
{ id: 'sm', label: 'Petit', preview: 12 },
{ id: 'md', label: 'Normal', preview: 15 },
{ id: 'lg', label: 'Grand', preview: 18 },
];

const ICON_SHAPES: IconShape[] = ['square', 'rounded', 'circle'];
const ICON_SIZES: IconSize[] = ['sm', 'md', 'lg'];

// Sélecteur Système/Clair/Sombre (Réglages → Apparence), inspiré de la
// pilule compacte du menu de réglages de Claude.ai.
const THEME_MODES: { id: 'system' | 'light' | 'dark'; label: string; icon: string }[] = [
{ id: 'system', label: 'Système', icon: '🖥️' },
{ id: 'light', label: 'Clair', icon: '☀️' },
{ id: 'dark', label: 'Sombre', icon: '🌙' },
];

const REST_OPTIONS: { seconds: number; label: string }[] = [
{ seconds: 60, label: '1:00' },
{ seconds: 90, label: '1:30' },
{ seconds: 120, label: '2:00' },
{ seconds: 180, label: '3:00' },
{ seconds: 240, label: '4:00' },
];

const BEEP_TONES: { id: 'doux' | 'classique' | 'urgent' | 'melodique' | 'cloche'; label: string }[] = [
{ id: 'doux', label: 'Doux' },
{ id: 'classique', label: 'Classique' },
{ id: 'urgent', label: 'Urgent' },
{ id: 'melodique', label: 'Mélodique' },
{ id: 'cloche', label: 'Cloche' },
];

const SECTION_META: Record<HomeSectionKey, { label: string; desc: string; toggleable: boolean }> = {
cycle: { label: 'Cycle en cours', desc: 'La carte semaine / RIR / objectif.', toggleable: true },
seances: { label: 'Liste des séances', desc: 'Les séances du programme actif — toujours visible.', toggleable: false },
nutrition: { label: 'Conseil nutrition', desc: 'Le rappel protéines/glucides après la séance.', toggleable: true },
supersetRule: { label: 'Règle superset', desc: 'Le rappel sur le fonctionnement des supersets.', toggleable: true },
muscleAlert: { label: 'Groupes musculaires', desc: 'Alerte les groupes pas travaillés depuis un moment.', toggleable: true },
cardio: { label: 'Cardio', desc: 'Ajouter et suivre tes séances de vélo, marche, course...', toggleable: true },
weeklyGoal: { label: 'Objectif hebdo', desc: "L'anneau de progression du nombre de séances cette semaine.", toggleable: true },
nextSession: { label: 'Prochaine séance', desc: 'Le bandeau qui indique la prochaine séance du cycle.', toggleable: true },
};

// Catégories de la page Réglages — volontairement peu nombreuses et
// regroupées par usage plutôt que par type technique (avant : 9 catégories
// assez techniques ; maintenant 4, groupées comme un utilisateur y penserait :
// "tout ce qui touche à une séance", "tout ce qui touche à l'apparence", etc.)
// pour que la page reste simple à parcourir malgré le nombre de réglages.
type CategoryId = 'seance' | 'apparence' | 'objectifs' | 'donnees';

const CATEGORY_META: Record<CategoryId, { label: string; emoji: string; desc: string }> = {
seance: { label: 'Séance', emoji: '🏋️', desc: 'Programme, repos, minuteur, muscles sollicités.' },
apparence: { label: 'Apparence', emoji: '🎨', desc: 'Couleurs, thème, texte, icônes, navigation, animations, accueil.' },
objectifs: { label: 'Objectifs & calories', emoji: '🎯', desc: 'Badges, calories, objectif hebdo, cardio.' },
donnees: { label: 'Données & compte', emoji: '💾', desc: 'Export, import, sauvegarde, synchronisation.' },
};

const CATEGORY_ORDER: CategoryId[] = ['seance', 'apparence', 'objectifs', 'donnees'];

// Mots-clés utilisés par la recherche (barre en haut des Réglages) pour
// retrouver une catégorie à partir d'un mot qui n'apparaît pas forcément
// dans son nom affiché (ex: "repos" → Séance, "couleur" → Apparence). Pas
// besoin d'être exhaustif : l'objectif est de retomber sur la bonne
// catégorie pour les mots que Léo taperait naturellement.
const CATEGORY_KEYWORDS: Record<CategoryId, string[]> = {
seance: [
'programme', 'entrainement', 'repos', 'minuteur', 'temps', 'chrono', 'bip', 'son', 'volume',
'vibration', 'haptique', 'muscle', 'muscles sollicites', 'schema corps', 'exercice', 'serie',
],
apparence: [
'couleur', 'accent', 'theme', 'sombre', 'clair', 'amoled', 'noir', 'texte', 'police', 'taille',
'icone', 'forme', 'contraste', 'accessibilite', 'lisibilite', 'navigation', 'barre', 'onglet',
'accueil', 'ecran d accueil', 'bloc', 'ordre', 'animation', 'ultra', 'confetti', 'feu artifice',
'etincelle', 'transition', 'rebond', 'glissement', 'zoom', 'rotation', 'salle de sport', 'gym',
],
objectifs: [
'badge', 'recompense', 'calorie', 'kcal', 'objectif', 'hebdo', 'semaine', 'cardio', 'velo',
'marche', 'course',
],
donnees: [
'export', 'import', 'sauvegarde', 'backup', 'fichier', 'excel', 'csv', 'json', 'compte',
'connexion', 'inscription', 'synchro', 'synchronisation', 'cloud', 'appareil', 'deconnexion',
],
};

// Libellé + couleur affichés dans la catégorie Compte, selon l'état de la
// synchro en cours (voir hooks/useCloudSync.ts pour la logique).
const SYNC_STATUS_META: Record<SyncStatus, { label: string; color: string }> = {
idle: { label: '', color: 'var(--text-dim)' },
checking: { label: 'Vérification...', color: 'var(--text-dim)' },
conflict: { label: 'Choix à faire...', color: '#f5a623' },
syncing: { label: 'Synchro en cours...', color: 'var(--text-dim)' },
synced: { label: 'Synchronisé', color: '#4CAF50' },
error: { label: 'Erreur de synchro — nouvelle tentative au prochain changement', color: '#e03030' },
};

const formatSyncTime = (ts: number | null | undefined): string | null => {
if (!ts) return null;
const diffSec = Math.round((Date.now() - ts) / 1000);
if (diffSec < 10) return "à l'instant";
if (diffSec < 60) return `il y a ${diffSec}s`;
const diffMin = Math.round(diffSec / 60);
if (diffMin < 60) return `il y a ${diffMin} min`;
return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onOpenAccount, syncStatus, lastSyncedAt }) => {
const { user, loading: authLoading } = useAuth();
const handleSignOut = () => { supabase?.auth.signOut(); };
const accentTheme = useWorkoutStore((s) => s.accentTheme);
const setAccentTheme = useWorkoutStore((s) => s.setAccentTheme);
const customAccentColor = useWorkoutStore((s) => s.customAccentColor);
const setCustomAccentColor = useWorkoutStore((s) => s.setCustomAccentColor);
const amoledMode = useWorkoutStore((s) => s.amoledMode);
const setAmoledMode = useWorkoutStore((s) => s.setAmoledMode);
const theme = useWorkoutStore((s) => s.theme);
const themeMode = useWorkoutStore((s) => s.themeMode);
const setThemeMode = useWorkoutStore((s) => s.setThemeMode);
const fontScale = useWorkoutStore((s) => s.fontScale);
const setFontScale = useWorkoutStore((s) => s.setFontScale);
const homeSections = useWorkoutStore((s) => s.homeSections);
const setHomeSectionVisible = useWorkoutStore((s) => s.setHomeSectionVisible);
const homeSectionOrder = useWorkoutStore((s) => s.homeSectionOrder);
const moveHomeSection = useWorkoutStore((s) => s.moveHomeSection);
const homeSectionColors = useWorkoutStore((s) => s.homeSectionColors);
const setHomeSectionColor = useWorkoutStore((s) => s.setHomeSectionColor);
const iconShape = useWorkoutStore((s) => s.iconShape);
const setIconShape = useWorkoutStore((s) => s.setIconShape);
const iconSize = useWorkoutStore((s) => s.iconSize);
const setIconSize = useWorkoutStore((s) => s.setIconSize);
const defaultRestSeconds = useWorkoutStore((s) => s.defaultRestSeconds);
const setDefaultRestSeconds = useWorkoutStore((s) => s.setDefaultRestSeconds);
const customRestSeconds = useWorkoutStore((s) => s.customRestSeconds);
const saveCustomRest = useWorkoutStore((s) => s.saveCustomRest);
const clearCustomRest = useWorkoutStore((s) => s.clearCustomRest);
const highContrast = useWorkoutStore((s) => s.highContrast);
const setHighContrast = useWorkoutStore((s) => s.setHighContrast);
const beepEnabled = useWorkoutStore((s) => s.beepEnabled);
const setBeepEnabled = useWorkoutStore((s) => s.setBeepEnabled);
const beepTone = useWorkoutStore((s) => s.beepTone);
const setBeepTone = useWorkoutStore((s) => s.setBeepTone);
const beepVolume = useWorkoutStore((s) => s.beepVolume);
const setBeepVolume = useWorkoutStore((s) => s.setBeepVolume);
const testBeep = useWorkoutStore((s) => s.testBeep);
const hapticsEnabled = useWorkoutStore((s) => s.hapticsEnabled);
const setHapticsEnabled = useWorkoutStore((s) => s.setHapticsEnabled);
const ultraAnimationsEnabled = useWorkoutStore((s) => s.ultraAnimationsEnabled);
const setUltraAnimationsEnabled = useWorkoutStore((s) => s.setUltraAnimationsEnabled);
const ultraAnimationStyle = useWorkoutStore((s) => s.ultraAnimationStyle);
const setUltraAnimationStyle = useWorkoutStore((s) => s.setUltraAnimationStyle);
const ultraTransitionStyle = useWorkoutStore((s) => s.ultraTransitionStyle);
const setUltraTransitionStyle = useWorkoutStore((s) => s.setUltraTransitionStyle);
const caloriesPerHour = useWorkoutStore((s) => s.caloriesPerHour);
const setCaloriesPerHour = useWorkoutStore((s) => s.setCaloriesPerHour);
const bodyDiagramEnabled = useWorkoutStore((s) => s.bodyDiagramEnabled);
const setBodyDiagramEnabled = useWorkoutStore((s) => s.setBodyDiagramEnabled);
const cardioKcalPerHour = useWorkoutStore((s) => s.cardioKcalPerHour);
const setCardioKcalPerHour = useWorkoutStore((s) => s.setCardioKcalPerHour);
const weeklySessionGoal = useWorkoutStore((s) => s.weeklySessionGoal);
const setWeeklySessionGoal = useWorkoutStore((s) => s.setWeeklySessionGoal);
const navBarEnabled = useWorkoutStore((s) => s.navBarEnabled);
const setNavBarEnabled = useWorkoutStore((s) => s.setNavBarEnabled);
const navBarTabsEnabled = useWorkoutStore((s) => s.navBarTabsEnabled);
const setNavBarTabEnabled = useWorkoutStore((s) => s.setNavBarTabEnabled);
const navBarPinned = useWorkoutStore((s) => s.navBarPinned);
const setNavBarTabPinned = useWorkoutStore((s) => s.setNavBarTabPinned);
const activeProgramId = useWorkoutStore((s) => s.activeProgramId);
const setActiveProgram = useWorkoutStore((s) => s.setActiveProgram);
const customPrograms = useWorkoutStore((s) => s.customPrograms);
const addCustomProgram = useWorkoutStore((s) => s.addCustomProgram);
const removeCustomProgram = useWorkoutStore((s) => s.removeCustomProgram);
const badgesEnabled = useWorkoutStore((s) => s.badgesEnabled);
const setBadgesEnabled = useWorkoutStore((s) => s.setBadgesEnabled);
// Mode simplifié (choisi au premier lancement, modifiable ici) : masque les
// réglages de personnalisation cosmétique (couleurs, icônes, animations,
// barre de menus, accueil) pour ne garder que l'essentiel. Voir App.tsx /
// OnboardingModal.tsx pour l'écran de premier lancement, et
// store/workoutStore.ts pour la persistance.
const simplicityMode = useWorkoutStore((s) => s.simplicityMode);
const setSimplicityMode = useWorkoutStore((s) => s.setSimplicityMode);
const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
const toggleDay = (id: string) => setExpandedDays((d) => ({ ...d, [id]: !d[id] }));
const importInputRef = useRef<HTMLInputElement>(null);
const [importMsg, setImportMsg] = useState<string | null>(null);
const allPrograms = getAllPrograms(customPrograms);

// Chaque catégorie est ouverte par défaut ; l'état ne stocke que celles
// que l'utilisateur a explicitement repliées.
const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
const toggleCategory = (id: CategoryId) =>
setCollapsedCategories((c) => ({ ...c, [id]: !c[id] }));

// Recherche dans les Réglages — filtre les catégories affichées plutôt
// que chaque réglage un par un (plus simple et fiable vu le nombre de
// réglages), et force l'ouverture d'une catégorie qui correspond, quel
// que soit son état plié/déplié.
const normalizeSearch = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const [settingsQuery, setSettingsQuery] = useState('');
const normalizedQuery = normalizeSearch(settingsQuery.trim());
const categoryMatchesQuery = (id: CategoryId) => {
if (!normalizedQuery) return true;
const meta = CATEGORY_META[id];
const haystack = normalizeSearch([meta.label, meta.desc, ...CATEGORY_KEYWORDS[id]].join(' '));
return haystack.includes(normalizedQuery);
};
const visibleCategoryCount = CATEGORY_ORDER.filter(categoryMatchesQuery).length;

// Navigation rapide entre catégories (demande de Léo) : sur écran large/
// horizontal (tablette, ordi navigateur), une vraie barre latérale à
// gauche liste les 4 catégories et fait défiler jusqu'à la bonne section.
// Sur téléphone (écran étroit/vertical), on remplace le scroll par des
// onglets horizontaux qui n'affichent qu'une seule catégorie à la fois
// (plus besoin de scroller pour la trouver).
const [isLandscape, setIsLandscape] = useState(
() => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(orientation: landscape)').matches : false
);
useEffect(() => {
if (typeof window === 'undefined' || !window.matchMedia) return;
const mq = window.matchMedia('(orientation: landscape)');
const onChange = () => setIsLandscape(mq.matches);
mq.addEventListener('change', onChange);
return () => mq.removeEventListener('change', onChange);
}, []);
const [activeTab, setActiveTab] = useState<CategoryId>('seance');
const categoryRefs = useRef<Record<CategoryId, HTMLDivElement | null>>({
seance: null, apparence: null, objectifs: null, donnees: null,
});
// Un clic sur la barre latérale (mode paysage) : on s'assure que la
// catégorie est dépliée puis on scrolle doucement jusqu'à elle.
const handleSidebarJump = (id: CategoryId) => {
setCollapsedCategories((c) => ({ ...c, [id]: false }));
requestAnimationFrame(() => {
categoryRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
};
// Une catégorie s'affiche si : elle correspond à la recherche, ET (on est
// en paysage — tout reste visible, la sidebar sert juste à naviguer — OU
// en recherche active — OU c'est l'onglet actif en mode portrait/onglets).
const shouldShowCategory = (id: CategoryId) => {
if (!categoryMatchesQuery(id)) return false;
if (normalizedQuery !== '') return true;
if (isLandscape) return true;
return activeTab === id;
};
// Le corps d'une catégorie est visible si : recherche active, OU mode
// portrait/onglets (la catégorie affichée est toujours dépliée, l'onglet
// fait déjà office de sélection), OU non repliée manuellement en paysage.
const isBodyVisible = (id: CategoryId) => {
if (normalizedQuery !== '') return true;
if (!isLandscape) return true;
return !collapsedCategories[id];
};

// Télécharge tout le contenu du store (séances, historique, réglages…)
// dans un fichier JSON, pour pouvoir le garder au chaud ou le remettre
// sur un autre téléphone.
const handleExport = () => {
const raw = localStorage.getItem('ppl-tracker-store');
if (!raw) return;
const blob = new Blob([raw], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `ppl-tracker-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
a.click();
URL.revokeObjectURL(url);
};

// Traite le résultat du parseur (texte, CSV, JSON ou Excel) une fois
// obtenu — proposition de restauration pour une sauvegarde PPL Tracker,
// ou proposition d'ajout d'un nouveau programme sans toucher aux
// programmes existants.
const finishImport = (result: ImportResult, rawText: string | null, filename: string) => {
if (result.isBackupFile) {
if (!rawText) {
setImportMsg('Sauvegarde détectée mais illisible — réessaie.');
return;
}
const ok = window.confirm(
'Ce fichier est une sauvegarde PPL Tracker. L\'importer va remplacer toutes tes données actuelles (séances, historique, réglages...) par celles du fichier. Continuer ?'
);
if (!ok) return;
localStorage.setItem('ppl-tracker-store', rawText);
window.location.reload();
return;
}

if (!result.program) {
setImportMsg(`Import impossible — ${result.warnings[0] ?? 'aucune séance reconnue dans ce fichier.'}`);
return;
}

const warningLine = result.warnings.length ? ` (${result.warnings.join(' ')})` : '';
const ok = window.confirm(
`${result.daysDetected} jour(s) et ${result.exercisesDetected} exercice(s) détectés dans "${filename}".\n` +
`Ça va créer le programme "${result.program.name}", sélectionnable dans Programme d'entraînement — sans toucher aux programmes existants.${warningLine}\n\n` +
`Ajouter ce programme ?`
);
if (!ok) return;
addCustomProgram(result.program);
setImportMsg(`"${result.program.name}" ajouté (${result.daysDetected} jour(s), ${result.exercisesDetected} exercice(s)). Choisis-le dans "Programme d'entraînement" ci-dessus.`);
};

// Import "intelligent" : accepte n'importe quel format (Excel, CSV, JSON,
// texte). D'abord on vérifie si c'est une vraie sauvegarde PPL Tracker
// (JSON avec "state") → restauration complète comme avant. Sinon on
// tente d'en extraire un programme — voir importParser.ts, pas une
// vraie IA, un parseur à base de règles qui remonte des avertissements
// honnêtes plutôt que d'inventer des données.
const handleImportFile = (file: File) => {
const lower = file.name.toLowerCase();
if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
setImportMsg('Lecture du fichier Excel...');
parseExcelWorkbook(file)
.then((result) => finishImport(result, null, file.name))
.catch(() => setImportMsg("Import impossible — le fichier Excel n'a pas pu être lu."));
return;
}
const reader = new FileReader();
reader.onload = () => {
const text = String(reader.result ?? '');
const result = parseImportedFile(file.name, text);
finishImport(result, text, file.name);
};
reader.readAsText(file);
};

// Petit composant de tête de catégorie, réutilisé pour chacune des 4 classes.
const CategoryHeader: React.FC<{ id: CategoryId }> = ({ id }) => {
const meta = CATEGORY_META[id];
const collapsed = !!collapsedCategories[id];
return (
<button onClick={() => toggleCategory(id)} style={categoryHeaderBtn}>
<span style={{ fontSize: 18 }}>{meta.emoji}</span>
<div style={{ flex: 1, textAlign: 'left' }}>
<p style={categoryHeaderLabel}>{meta.label}</p>
<p style={categoryHeaderDesc}>{meta.desc}</p>
</div>
<span style={{ color: 'var(--text-dim)', fontSize: 12, transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
</button>
);
};

return (
<div style={container}>
<div style={isLandscape ? landscapeRow : undefined}>
{isLandscape && (
<div style={landscapeSidebar}>
{CATEGORY_ORDER.map((id) => (
<button
key={id}
onClick={() => handleSidebarJump(id)}
title={CATEGORY_META[id].label}
style={{
...landscapeSidebarBtn,
background: !collapsedCategories[id] ? 'var(--bg-elevated)' : 'transparent',
}}
>
<span style={{ fontSize: 20 }}>{CATEGORY_META[id].emoji}</span>
<span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{CATEGORY_META[id].label}</span>
</button>
))}
</div>
)}
<div style={isLandscape
? { ...scroll, maxWidth: 'none', margin: 0, flex: 1, paddingBottom: navBarEnabled ? 112 : 40 }
: { ...scroll, paddingBottom: navBarEnabled ? 112 : 40 }}
>
<div style={headerRow}>
<button onClick={onBack} style={backBtn}>←</button>
<div>
<h1 style={titleStyle}>Réglages</h1>
<p style={subtitleStyle}>Personnalise l'appli</p>
</div>
</div>

{/* Recherche — filtre les 4 catégories ci-dessous par mot-clé. */}
<div style={settingsSearchWrap}>
<span style={{ color: 'var(--text-dim)', fontSize: 14 }}>🔍</span>
<input
value={settingsQuery}
onChange={(e) => setSettingsQuery(e.target.value)}
placeholder="Rechercher un réglage (ex: repos, couleur, export...)"
style={settingsSearchInput}
/>
{settingsQuery !== '' && (
<button onClick={() => setSettingsQuery('')} style={settingsSearchClear}>✕</button>
)}
</div>

{/* Onglets rapides (téléphone / écran vertical uniquement) — une
seule catégorie affichée à la fois, pas besoin de scroller pour
la trouver. Masqués pendant une recherche (tout reste visible). */}
{!isLandscape && normalizedQuery === '' && (
<div style={portraitTabsRow}>
{CATEGORY_ORDER.map((id) => (
<button
key={id}
onClick={() => setActiveTab(id)}
style={{
...portraitTabBtn,
background: activeTab === id ? 'var(--brand-1)' : 'var(--bg-elevated)',
color: activeTab === id ? '#fff' : 'var(--text-muted)',
}}
>
<span style={{ fontSize: 15 }}>{CATEGORY_META[id].emoji}</span>
<span style={{ fontSize: 10, fontWeight: 700 }}>{CATEGORY_META[id].label}</span>
</button>
))}
</div>
)}

{normalizedQuery !== '' && visibleCategoryCount === 0 && (
<p style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', padding: '24px 0' }}>
Aucune catégorie ne correspond à "{settingsQuery}".
</p>
)}

{/* ═══ Catégorie : Séance (programme, repos, minuteur, muscles) ═══ */}
{shouldShowCategory('seance') && (
<div style={categoryWrapper} ref={(el) => { categoryRefs.current.seance = el; }}>
<CategoryHeader id="seance" />
{isBodyVisible('seance') && (
<div style={categoryBody}>
{/* Programme actif */}
<p style={subLabel}>PROGRAMME D'ENTRAÎNEMENT</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 12, lineHeight: '15px' }}>
Choisis le programme actif — les autres restent disponibles, rien n'est supprimé en changeant.
</p>
<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
{allPrograms.map((program) => {
const isActive = program.id === activeProgramId;
return (
<div key={program.id} style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
<button
onClick={() => setActiveProgram(program.id)}
style={{
...programCard,
border: isActive ? '2px solid var(--brand-1)' : '2px solid transparent',
background: isActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
}}
>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
<p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 800 }}>{program.name}</p>
{isActive && <span style={{ color: 'var(--brand-1)', fontSize: 10, fontWeight: 700 }}>✓ ACTIF</span>}
</div>
<p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3, lineHeight: '15px' }}>{program.shortDescription}</p>
<p style={{ color: 'var(--text-micro)', fontSize: 10, marginTop: 4, fontStyle: 'italic' }}>{program.source}</p>
</button>
{program.isCustom && (
<button
onClick={() => {
const ok = window.confirm(`Supprimer le programme importé "${program.name}" ? L'historique déjà enregistré n'est pas touché.`);
if (ok) removeCustomProgram(program.id);
}}
style={programDeleteBtn}
title="Supprimer ce programme importé"
>✕</button>
)}
</div>
);
})}
</div>

{/* Temps de repos par défaut */}
<p style={subLabel}>TEMPS DE REPOS PAR DÉFAUT</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
Utilisé quand tu commences une série sans temps personnalisé. Tu peux toujours ajuster +30s/-30s pendant le repos.
</p>
<div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
{REST_OPTIONS.map((opt) => (
<button
key={opt.seconds}
onClick={() => setDefaultRestSeconds(opt.seconds)}
style={{
...restBtn,
background: defaultRestSeconds === opt.seconds ? 'var(--brand-1)' : 'var(--bg-elevated)',
color: defaultRestSeconds === opt.seconds ? '#fff' : 'var(--text-muted)',
}}
>
{opt.label}
</button>
))}
</div>

{/* Son du minuteur */}
<p style={subLabel}>SON DU MINUTEUR</p>
<div style={toggleRow}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Bip de fin de repos</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
Joue un bip quand le repos se termine, en plus de la vibration/notification.
</p>
</div>
<button
onClick={() => setBeepEnabled(!beepEnabled)}
style={{
...switchTrack,
background: beepEnabled ? 'var(--brand-1)' : 'var(--bg-elevated)',
justifyContent: beepEnabled ? 'flex-end' : 'flex-start',
}}
>
<span style={switchThumb} />
</button>
</div>
{beepEnabled && (
<>
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 12 }}>
{BEEP_TONES.map((t) => (
<button
key={t.id}
onClick={() => setBeepTone(t.id)}
style={{
...restBtn,
flex: '1 1 30%',
background: beepTone === t.id ? 'var(--brand-1)' : 'var(--bg-elevated)',
color: beepTone === t.id ? '#fff' : 'var(--text-muted)',
}}
>
{t.label}
</button>
))}
<button onClick={testBeep} style={{ ...restBtn, flex: '1 1 30%', color: 'var(--brand-1)' }}>▶ Tester</button>
</div>
<div style={{ ...toggleRow, marginBottom: 20, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>Volume du bip</p>
<p style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 700 }}>{beepVolume}%</p>
</div>
<input
type="range"
min={0}
max={100}
step={5}
value={beepVolume}
onChange={(e) => setBeepVolume(Number(e.target.value))}
onMouseUp={testBeep}
onTouchEnd={testBeep}
style={{ width: '100%', accentColor: 'var(--brand-1)' }}
/>
</div>
</>
)}
{!beepEnabled && <div style={{ marginBottom: 12 }} />}

{/* Vibrations */}
<div style={{ ...toggleRow, marginBottom: 20 }}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Vibrations (haptique)</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
Petite vibration à chaque série validée, fin de repos et fin de séance.
</p>
</div>
<button
onClick={() => setHapticsEnabled(!hapticsEnabled)}
style={{
...switchTrack,
background: hapticsEnabled ? 'var(--brand-1)' : 'var(--bg-elevated)',
justifyContent: hapticsEnabled ? 'flex-end' : 'flex-start',
}}
>
<span style={switchThumb} />
</button>
</div>

{/* Schéma des muscles sollicités */}
<p style={subLabel}>SÉANCE</p>
<div style={{ ...toggleRow, marginBottom: 20 }}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Schéma muscles sollicités</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
Le corps face/dos affiché en début de séance avec les muscles travaillés.
</p>
</div>
<button
onClick={() => setBodyDiagramEnabled(!bodyDiagramEnabled)}
style={{
...switchTrack,
background: bodyDiagramEnabled ? 'var(--brand-1)' : 'var(--bg-elevated)',
justifyContent: bodyDiagramEnabled ? 'flex-end' : 'flex-start',
}}
>
<span style={switchThumb} />
</button>
</div>

{/* Temps de repos par exercice */}
<p style={subLabel}>TEMPS DE REPOS PAR EXERCICE</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
Remplace le temps par défaut pour un exercice précis (séances Strict V10). Déplie une séance pour voir ses exercices.
</p>
<div>
{WORKOUTS.map((workout) => {
const isOpen = !!expandedDays[workout.id];
return (
<div key={workout.id} style={dayGroup}>
<button onClick={() => toggleDay(workout.id)} style={dayHeaderBtn}>
<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, flex: 1, textAlign: 'left' }}>
{workout.name}
</span>
<span style={{ color: 'var(--text-dim)', fontSize: 10 }}>{workout.exercises.length} exercices</span>
<span style={{ color: 'var(--text-dim)', fontSize: 10, marginLeft: 8 }}>{isOpen ? '▴' : '▾'}</span>
</button>
{isOpen && (
<div style={{ padding: '4px 10px 8px' }}>
{workout.exercises.map((ex) => {
const current = customRestSeconds[ex.id] ?? ex.restSeconds;
const isCustom = customRestSeconds[ex.id] !== undefined;
return (
<div key={ex.id} style={exRestRow}>
<div style={{ flex: 1, minWidth: 0 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
{ex.name}
</p>
{isCustom && <p style={{ color: 'var(--text-micro)', fontSize: 9, marginTop: 1 }}>Personnalisé</p>}
</div>
<button
onClick={() => saveCustomRest(ex.id, Math.max(30, current - 15))}
style={stepperBtn}
>−</button>
<span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, width: 40, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
{formatRest(current)}
</span>
<button
onClick={() => saveCustomRest(ex.id, Math.min(300, current + 15))}
style={stepperBtn}
>+</button>
{isCustom && (
<button onClick={() => clearCustomRest(ex.id)} style={resetBtn} title="Revenir au temps d'origine">↺</button>
)}
</div>
);
})}
</div>
)}
</div>
);
})}
</div>
</div>
)}
</div>
)}

{/* ═══ Catégorie : Apparence (couleurs, thème, icônes, navigation, animations, accueil) ═══ */}
{shouldShowCategory('apparence') && (
<div style={categoryWrapper} ref={(el) => { categoryRefs.current.apparence = el; }}>
<CategoryHeader id="apparence" />
{isBodyVisible('apparence') && (
<div style={categoryBody}>
{simplicityMode && (
<div style={simplicityBanner}>
<p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: '17px' }}>
✨ Mode simplifié activé — les réglages de personnalisation avancés (couleurs, icônes, animations, barre de menus, accueil) sont masqués. Tu peux les retrouver à tout moment ci-dessous.
</p>
</div>
)}

{/* Mode simplifié / personnalisation avancée */}
<div style={{ ...toggleRow, marginBottom: 20 }}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Réglages avancés (personnalisation)</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
Désactive pour ne garder que les réglages essentiels et masquer couleurs, icônes, animations, barre de menus et accueil.
</p>
</div>
<button
onClick={() => setSimplicityMode(!simplicityMode)}
style={{
...switchTrack,
background: !simplicityMode ? 'var(--brand-1)' : 'var(--bg-elevated)',
justifyContent: !simplicityMode ? 'flex-end' : 'flex-start',
}}
>
<span style={switchThumb} />
</button>
</div>

{!simplicityMode && (
<>
{/* Couleur d'accent */}
<p style={subLabel}>COULEUR D'ACCENT</p>
<div style={swatchGrid}>
{ACCENT_PRESETS.map((a) => (
<button
key={a.id}
onClick={() => setAccentTheme(a.id)}
style={{
...swatchBtn,
border: accentTheme === a.id ? `2px solid ${a.c1}` : '2px solid transparent',
}}
title={a.label}
>
<span style={{
display: 'block', width: 40, height: 40, borderRadius: '50%',
background: `linear-gradient(135deg, ${a.c1}, ${a.c2})`,
boxShadow: accentTheme === a.id ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${a.c1}` : 'none',
}} />
<span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>{a.label}</span>
</button>
))}
<label
style={{
...swatchBtn,
cursor: 'pointer',
border: accentTheme === 'custom' ? `2px solid ${customAccentColor}` : '2px solid transparent',
}}
title="Couleur perso"
>
<span style={{
display: 'flex', alignItems: 'center', justifyContent: 'center',
width: 40, height: 40, borderRadius: '50%',
background: accentTheme === 'custom'
? `linear-gradient(135deg, ${customAccentColor}, ${customAccentColor})`
: 'repeating-conic-gradient(#e03030 0% 25%, #2563eb 0% 50%, #16a34a 0% 75%, #ea580c 0% 100%)',
boxShadow: accentTheme === 'custom' ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${customAccentColor}` : 'none',
fontSize: 16,
}}>
{accentTheme !== 'custom' && '🎨'}
</span>
<span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>Perso</span>
<input
type="color"
value={customAccentColor}
onChange={(e) => setCustomAccentColor(e.target.value)}
style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
/>
</label>
</div>

{/* Thème "salle de sport" */}
<p style={{ ...subLabel, marginTop: 20 }}>SALLE DE SPORT</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 12, lineHeight: '15px' }}>
Choisis ta salle et l'appli (et le logo) reprend une couleur dans son esprit. Couleurs approximatives, pas les codes officiels de la marque.
</p>
<div style={swatchGrid}>
{GYM_PRESETS.map((g) => (
<button
key={g.id}
onClick={() => setAccentTheme(g.id)}
style={{
...swatchBtn,
border: accentTheme === g.id ? `2px solid ${g.c1}` : '2px solid transparent',
}}
title={g.label}
>
<span style={{
display: 'block', width: 40, height: 40, borderRadius: '50%',
background: `linear-gradient(135deg, ${g.c1}, ${g.c2})`,
boxShadow: accentTheme === g.id ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${g.c1}` : 'none',
}} />
<span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textAlign: 'center' }}>{g.label}</span>
</button>
))}
</div>
</>
)}

{/* Apparence (Système/Clair/Sombre) — pilule compacte façon
menu de réglages Claude, distincte des segmentBtn colorés
utilisés ailleurs (transitions, effets...). Reste visible même
en mode simplifié : c'est un réglage essentiel, pas un gadget. */}
<p style={{ ...subLabel, marginTop: simplicityMode ? 0 : 20 }}>APPARENCE</p>
<div style={themeModePill}>
{THEME_MODES.map((m) => (
<button
key={m.id}
onClick={() => setThemeMode(m.id)}
title={m.label}
style={{
...themeModeBtn,
background: themeMode === m.id ? 'var(--bg-base)' : 'transparent',
color: themeMode === m.id ? 'var(--text-primary)' : 'var(--text-dim)',
boxShadow: themeMode === m.id ? '0 1px 3px rgba(0,0,0,0.25)' : 'none',
}}
>
<span style={{ fontSize: 16, lineHeight: 1 }}>{m.icon}</span>
<span style={{ fontSize: 10, fontWeight: 700 }}>{m.label}</span>
</button>
))}
</div>

{!simplicityMode && (
<>
{/* Thème (AMOLED) */}
<p style={{ ...subLabel, marginTop: 20 }}>THÈME</p>
<div style={toggleRow}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Noir pur (AMOLED)</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
{theme === 'dark'
? "Fond quasi noir, économise la batterie sur écran OLED."
: 'Actif uniquement en thème sombre (☀️/🌙 sur l\'accueil).'}
</p>
</div>
<button
onClick={() => setAmoledMode(!amoledMode)}
style={{
...switchTrack,
background: amoledMode ? 'var(--brand-1)' : 'var(--bg-elevated)',
justifyContent: amoledMode ? 'flex-end' : 'flex-start',
opacity: theme === 'dark' ? 1 : 0.5,
}}
>
<span style={switchThumb} />
</button>
</div>

{/* Taille du texte */}
<p style={{ ...subLabel, marginTop: 20 }}>TAILLE DU TEXTE</p>
<div style={segmentRow}>
{FONT_SCALES.map((f) => (
<button
key={f.id}
onClick={() => setFontScale(f.id)}
style={{
...segmentBtn,
background: fontScale === f.id ? 'var(--brand-1)' : 'var(--bg-elevated)',
color: fontScale === f.id ? '#fff' : 'var(--text-muted)',
}}
>
<span style={{ fontSize: f.preview, fontWeight: 800 }}>Aa</span>
<span style={{ fontSize: 10, fontWeight: 700 }}>{f.label}</span>
</button>
))}
</div>

{/* Forme des icônes */}
<p style={{ ...subLabel, marginTop: 20 }}>FORME DES ICÔNES</p>
<div style={segmentRow}>
{ICON_SHAPES.map((shape) => (
<button
key={shape}
onClick={() => setIconShape(shape)}
style={{
...segmentBtn,
background: iconShape === shape ? 'var(--brand-1)' : 'var(--bg-elevated)',
color: iconShape === shape ? '#fff' : 'var(--text-muted)',
}}
>
<span style={{
display: 'block', width: 24, height: 24,
borderRadius: ICON_SHAPE_RADIUS[shape],
background: iconShape === shape ? '#fff' : 'var(--text-muted)',
}} />
<span style={{ fontSize: 10, fontWeight: 700 }}>{ICON_SHAPE_LABEL[shape]}</span>
</button>
))}
</div>

{/* Taille des icônes */}
<p style={{ ...subLabel, marginTop: 20 }}>TAILLE DES ICÔNES</p>
<div style={segmentRow}>
{ICON_SIZES.map((sz) => (
<button
key={sz}
onClick={() => setIconSize(sz)}
style={{
...segmentBtn,
background: iconSize === sz ? 'var(--brand-1)' : 'var(--bg-elevated)',
color: iconSize === sz ? '#fff' : 'var(--text-muted)',
}}
>
<span style={{
display: 'block',
width: sz === 'sm' ? 18 : sz === 'md' ? 24 : 30,
height: sz === 'sm' ? 18 : sz === 'md' ? 24 : 30,
borderRadius: ICON_SHAPE_RADIUS[iconShape],
background: iconSize === sz ? '#fff' : 'var(--text-muted)',
}} />
<span style={{ fontSize: 10, fontWeight: 700 }}>{ICON_SIZE_LABEL[sz]}</span>
</button>
))}
</div>

{/* Ultra animations */}
<p style={{ ...subLabel, marginTop: 20 }}>EFFETS</p>
<div style={toggleRow}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>✨ Ultra animations</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
Transitions rebondissantes entre les écrans, confettis sur les records et à la fin de séance, halo lumineux. Purement visuel, à activer si tu aimes le fun.
</p>
</div>
<button
onClick={() => setUltraAnimationsEnabled(!ultraAnimationsEnabled)}
style={{
...switchTrack,
background: ultraAnimationsEnabled ? 'var(--brand-1)' : 'var(--bg-elevated)',
justifyContent: ultraAnimationsEnabled ? 'flex-end' : 'flex-start',
}}
>
<span style={switchThumb} />
</button>
</div>

{ultraAnimationsEnabled && (
<>
<p style={{ ...subLabel, marginTop: 16 }}>STYLE DE L'EFFET</p>
<div style={segmentRow}>
{(
[
{ id: 'confetti', emoji: '🎉', label: 'Confettis' },
{ id: 'fireworks', emoji: '🎆', label: 'Feu d\'artifice' },
{ id: 'sparkles', emoji: '✨', label: 'Étincelles' },
] as const
).map((opt) => (
<button
key={opt.id}
onClick={() => setUltraAnimationStyle(opt.id)}
style={{
...segmentBtn,
background: ultraAnimationStyle === opt.id ? 'var(--brand-1)' : 'var(--bg-elevated)',
color: ultraAnimationStyle === opt.id ? '#fff' : 'var(--text-muted)',
}}
>
<span style={{ fontSize: 20 }}>{opt.emoji}</span>
<span style={{ fontSize: 10, fontWeight: 700 }}>{opt.label}</span>
</button>
))}
</div>

<p style={{ ...subLabel, marginTop: 16 }}>STYLE DE TRANSITION</p>
<div style={segmentRow}>
{(
[
{ id: 'bounce', emoji: '🏀', label: 'Rebond' },
{ id: 'slide', emoji: '➡️', label: 'Glissement' },
{ id: 'zoom', emoji: '🔍', label: 'Zoom' },
{ id: 'flip', emoji: '🔃', label: 'Rotation' },
] as const
).map((opt) => (
<button
key={opt.id}
onClick={() => setUltraTransitionStyle(opt.id)}
style={{
...segmentBtn,background: ultraTransitionStyle === opt.id ? 'var(--brand-1)' : 'var(--bg-elevated)',
color: ultraTransitionStyle === opt.id ? '#fff' : 'var(--text-muted)',
}}
>
<span style={{ fontSize: 20 }}>{opt.emoji}</span>
<span style={{ fontSize: 10, fontWeight: 700 }}>{opt.label}</span>
</button>
))}
</div>
</>
)}
</>
)}

{/* Accessibilité (ex-catégorie séparée) — reste visible même en mode
simplifié : c'est de l'accessibilité, pas un gadget de personnalisation. */}
<p style={{ ...subLabel, marginTop: 20 }}>ACCESSIBILITÉ</p>
<div style={toggleRow}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Contraste élevé</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
Textes et bordures plus marqués, pour mieux distinguer les éléments.
</p>
</div>
<button
onClick={() => setHighContrast(!highContrast)}
style={{
...switchTrack,
background: highContrast ? 'var(--brand-1)' : 'var(--bg-elevated)',
justifyContent: highContrast ? 'flex-end' : 'flex-start',
}}
>
<span style={switchThumb} />
</button>
</div>

{!simplicityMode && (
<>
{/* Navigation (ex-catégorie séparée) */}
<p style={{ ...subLabel, marginTop: 20 }}>BARRE DE MENUS</p>
<div style={toggleRow}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Barre de navigation (Liquid Glass)</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
Barre flottante et translucide en bas de l'écran, pour naviguer entre l'accueil, les objectifs, le dashboard et les réglages sans revenir en arrière à chaque fois. Masquée pendant une séance.
</p>
</div>
<button
onClick={() => setNavBarEnabled(!navBarEnabled)}
style={{
...switchTrack,
background: navBarEnabled ? 'var(--brand-1)' : 'var(--bg-elevated)',
justifyContent: navBarEnabled ? 'flex-end' : 'flex-start',
}}
>
<span style={switchThumb} />
</button>
</div>

{navBarEnabled && (
<div style={{ marginTop: 8 }}>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
Choisis les onglets affichés dans la barre. Pour chaque onglet actif, choisis s'il reste épinglé directement dans la barre ou s'il passe dans le bouton + (pratique quand la barre est trop chargée). Réglages reste toujours accessible, quoi qu'il arrive.
</p>
{NAV_TAB_META.map((tab) => {
const enabled = navBarTabsEnabled[tab.id];
const pinned = navBarPinned[tab.id];
return (
<div key={tab.id} style={toggleRow}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>{tab.emoji} {tab.label}</p>
</div>
{enabled && (
<button
onClick={() => setNavBarTabPinned(tab.id, !pinned)}
style={{
...restBtn,
flex: '0 0 auto',
width: 'auto',
padding: '6px 10px',
fontSize: 11,
color: pinned ? 'var(--text-muted)' : 'var(--brand-1)',
}}
title={pinned ? "Dans la barre — appuie pour mettre dans le +" : "Dans le + — appuie pour épingler dans la barre"}
>
{pinned ? 'Barre' : 'Dans le +'}
</button>
)}
<button
onClick={() => setNavBarTabEnabled(tab.id, !enabled)}
style={{
...switchTrack,
background: enabled ? 'var(--brand-1)' : 'var(--bg-elevated)',
justifyContent: enabled ? 'flex-end' : 'flex-start',
}}
>
<span style={switchThumb} />
</button>
</div>
);
})}
</div>
)}

{/* Écran d'accueil (ex-catégorie séparée) */}
<p style={{ ...subLabel, marginTop: 20 }}>ÉCRAN D'ACCUEIL</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 12, lineHeight: '15px' }}>
Utilise les flèches pour réordonner les blocs, et l'interrupteur pour masquer ceux que tu ne veux pas voir.
</p>
<div>
{homeSectionOrder.map((key, idx) => {
const meta = SECTION_META[key];
const visible = meta.toggleable ? homeSections[key as keyof typeof homeSections] : true;
return (
<div key={key} style={toggleRow}>
<div style={reorderCol}>
<button
onClick={() => moveHomeSection(key, 'up')}
disabled={idx === 0}
style={{ ...reorderBtn, opacity: idx === 0 ? 0.25 : 1 }}
>▲</button>
<button
onClick={() => moveHomeSection(key, 'down')}
disabled={idx === homeSectionOrder.length - 1}
style={{ ...reorderBtn, opacity: idx === homeSectionOrder.length - 1 ? 0.25 : 1 }}
>▼</button>
</div>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{meta.label}</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>{meta.desc}</p>
</div>
{key !== 'seances' && (
<div style={{ position: 'relative', flexShrink: 0 }}>
<label
style={{
...colorSwatchBtn,
background: homeSectionColors[key] ?? 'var(--brand-1)',
}}
title="Couleur de ce bloc"
>
<input
type="color"
value={homeSectionColors[key] ?? '#e03030'}
onChange={(e) => setHomeSectionColor(key, e.target.value)}
style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
/>
</label>
{homeSectionColors[key] && (
<button
onClick={() => setHomeSectionColor(key, null)}
style={colorResetBtn}
title="Revenir à la couleur par défaut"
>✕</button>
)}
</div>
)}
{meta.toggleable ? (
<button
onClick={() => setHomeSectionVisible(key as keyof typeof homeSections, !visible)}
style={{
...switchTrack,
background: visible ? 'var(--brand-1)' : 'var(--bg-elevated)',
justifyContent: visible ? 'flex-end' : 'flex-start',
}}
>
<span style={switchThumb} />
</button>
) : (
<span style={{ color: 'var(--text-micro)', fontSize: 10, fontWeight: 700, flexShrink: 0, width: 44, textAlign: 'center' }}>FIXE</span>
)}
</div>
);
})}
</div>
</>
)}
</div>
)}
</div>
)}

{/* ═══ Catégorie : Objectifs & calories ═══ */}
{shouldShowCategory('objectifs') && (
<div style={categoryWrapper} ref={(el) => { categoryRefs.current.objectifs = el; }}>
<CategoryHeader id="objectifs" />
{isBodyVisible('objectifs') && (
<div style={categoryBody}>
{/* Badges de progression */}
<p style={subLabel}>BADGES & RÉCOMPENSES</p>
<div style={{ ...toggleRow, marginBottom: 20 }}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Afficher les badges</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
Paliers de progression (séances, régularité, cardio, poids, records) sur l'écran Profil.
</p>
</div>
<button
onClick={() => setBadgesEnabled(!badgesEnabled)}
style={{
...switchTrack,
background: badgesEnabled ? 'var(--brand-1)' : 'var(--bg-elevated)',
justifyContent: badgesEnabled ? 'flex-end' : 'flex-start',
}}
>
<span style={switchThumb} />
</button>
</div>

{/* Calories (estimation) */}
<p style={subLabel}>CALORIES (ESTIMATION)</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
Utilisé pour estimer les calories brûlées quand aucun capteur de fréquence cardiaque n'est connecté.
</p>
<div style={{ ...toggleRow, marginBottom: 20 }}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{caloriesPerHour} kcal/h</p>
</div>
<button onClick={() => setCaloriesPerHour(caloriesPerHour - 10)} style={stepperBtn}>−</button>
<button onClick={() => setCaloriesPerHour(caloriesPerHour + 10)} style={stepperBtn}>+</button>
</div>

{/* Objectif hebdo */}
<p style={subLabel}>OBJECTIF HEBDO</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
Nombre de séances (muscu) visées par semaine, affiché avec l'anneau de progression sur l'accueil.
</p>
<div style={{ ...toggleRow, marginBottom: 20 }}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{weeklySessionGoal} séance{weeklySessionGoal > 1 ? 's' : ''} / semaine</p>
</div>
<button onClick={() => setWeeklySessionGoal(weeklySessionGoal - 1)} style={stepperBtn}>−</button>
<button onClick={() => setWeeklySessionGoal(weeklySessionGoal + 1)} style={stepperBtn}>+</button>
</div>

{/* Cardio (vélo, marche, course...) */}
<p style={subLabel}>CARDIO — CALORIES PAR ACTIVITÉ</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
Réglage des kcal/h utilisées pour estimer les calories brûlées lors d'une activité cardio.
</p>
<div>
{CARDIO_TYPES.map((t) => (
<div key={t} style={{ ...toggleRow, marginBottom: 6 }}>
<div style={{ flex: 1 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>
{CARDIO_TYPE_LABELS[t].emoji} {CARDIO_TYPE_LABELS[t].label}
</p>
</div>
<span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, width: 66, textAlign: 'center' }}>
{cardioKcalPerHour[t]} kcal/h
</span>
<button onClick={() => setCardioKcalPerHour(t, cardioKcalPerHour[t] - 25)} style={stepperBtn}>−</button>
<button onClick={() => setCardioKcalPerHour(t, cardioKcalPerHour[t] + 25)} style={stepperBtn}>+</button>
</div>
))}
</div>
</div>
)}
</div>
)}

{/* ═══ Catégorie : Données & compte ═══ */}
{shouldShowCategory('donnees') && (
<div style={categoryWrapper} ref={(el) => { categoryRefs.current.donnees = el; }}>
<CategoryHeader id="donnees" />
{isBodyVisible('donnees') && (
<div style={categoryBody}>
<p style={subLabel}>SAUVEGARDE</p>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
Exporter : télécharge tout ton historique et tes réglages. Importer : restaure une sauvegarde PPL Tracker,
ou analyse n'importe quel autre fichier (Excel, CSV, JSON, texte) pour en faire un nouveau programme.
</p>
<div style={{ display: 'flex', gap: 8, marginBottom: importMsg ? 8 : 20 }}>
<button onClick={handleExport} style={{ ...restBtn, flex: 1, padding: '12px 8px' }}>⬇ Exporter</button>
<button onClick={() => importInputRef.current?.click()} style={{ ...restBtn, flex: 1, padding: '12px 8px' }}>⬆ Importer</button>
<input
ref={importInputRef}
type="file"
accept=".json,.csv,.txt,.xlsx,.xls,text/*,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
style={{ display: 'none' }}
onChange={(e) => {
const file = e.target.files?.[0];
if (file) handleImportFile(file);
e.target.value = '';
}}
/>
</div>
{importMsg && (
<p style={{ color: '#f5a623', fontSize: 11, marginBottom: 20, lineHeight: '15px' }}>{importMsg}</p>
)}

<p style={{ ...subLabel, marginTop: 4 }}>COMPTE</p>
{!isSupabaseConfigured ? (
<p style={{ color: 'var(--text-dim)', fontSize: 11, lineHeight: '16px' }}>
Pas encore configuré. Il manque les variables d'environnement Supabase côté Vercel
(VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY) — à ajouter dans Project Settings → Environment
Variables, avec les valeurs de Settings → API du projet Supabase, puis redéployer.
</p>
) : authLoading ? (
<p style={{ color: 'var(--text-dim)', fontSize: 12 }}>Vérification de la session...</p>
) : user ? (
<div style={{ ...toggleRow, marginBottom: 0 }}>
<div style={{ flex: 1, minWidth: 0 }}>
<p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
{user.email}
</p>
<p style={{ color: SYNC_STATUS_META[syncStatus ?? 'idle'].color, fontSize: 11, marginTop: 2 }}>
{syncStatus && syncStatus !== 'idle'
? SYNC_STATUS_META[syncStatus].label
: 'Connecté.'}
{syncStatus === 'synced' && formatSyncTime(lastSyncedAt) ? ` — ${formatSyncTime(lastSyncedAt)}` : ''}
</p>
</div>
<button onClick={handleSignOut} style={{ ...restBtn, flexShrink: 0, width: 'auto', padding: '10px 14px' }}>
Se déconnecter
</button>
</div>
) : (
<>
<p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 12, lineHeight: '16px' }}>
Crée un compte ou connecte-toi pour synchroniser tes séances et réglages entre plusieurs appareils.
</p>
<button onClick={onOpenAccount} style={{ ...restBtn, padding: '12px 8px' }}>
Se connecter / créer un compte
</button>
</>
)}
</div>
)}
</div>
)}

</div>
</div>
</div>
);
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: 'var(--bg-base)' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 40px' };
// Écran large/paysage (tablette, fenêtre navigateur large) : sidebar fixe à
// gauche + contenu scrollable à droite, plutôt que tout empiler en colonne.
const landscapeRow: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', minHeight: '100%' };
const landscapeSidebar: React.CSSProperties = {
position: 'sticky', top: 0, flexShrink: 0, width: 96,
display: 'flex', flexDirection: 'column', gap: 4, padding: '24px 8px',
borderRight: '1px solid var(--border-subtle)',
};
const landscapeSidebarBtn: React.CSSProperties = {
display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
padding: '10px 4px', borderRadius: 12, cursor: 'pointer',
};
// Téléphone / écran étroit-vertical : onglets horizontaux qui filtrent sur
// une seule catégorie à la fois (façon barre d'onglets), au lieu de tout
// empiler et devoir scroller pour retrouver une section.
const portraitTabsRow: React.CSSProperties = {
display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto',
};
const portraitTabBtn: React.CSSProperties = {
display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
padding: '9px 10px', borderRadius: 12, cursor: 'pointer', flex: 1, minWidth: 64,
};
const headerRow: React.CSSProperties = {
display: 'flex', alignItems: 'center', gap: 14,
paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 18,
borderBottom: '1px solid var(--border-subtle)', marginBottom: 20,
};
const backBtn: React.CSSProperties = {
width: 36, height: 36, background: 'var(--bg-elevated)', borderRadius: 'var(--icon-radius)',
color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
display: 'flex', alignItems: 'center', justifyContent: 'center',
flexShrink: 0, border: '1px solid var(--border-strong)',
};
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.3 };
const subtitleStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12, marginTop: 2 };
const settingsSearchWrap: React.CSSProperties = {
display: 'flex', alignItems: 'center', gap: 8,
background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
borderRadius: 14, padding: '10px 14px', marginBottom: 14,
};
const settingsSearchInput: React.CSSProperties = {
flex: 1, background: 'transparent', border: 'none', outline: 'none',
color: 'var(--text-primary)', fontSize: 14,
};
const settingsSearchClear: React.CSSProperties = {
width: 22, height: 22, borderRadius: 11, flexShrink: 0,
background: 'var(--bg-higher)', border: '1px solid var(--border-strong)',
color: 'var(--text-dim)', fontSize: 11, cursor: 'pointer',
display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const subLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 12 };
// Bandeau explicatif affiché en haut de la catégorie Apparence quand le
// mode simplifié est actif (voir Réglages avancés ci-dessus).
const simplicityBanner: React.CSSProperties = {
background: 'var(--bg-elevated)', border: '1px solid var(--border)',
borderRadius: 14, padding: '10px 14px', marginBottom: 14,
};
// Pilule Système/Clair/Sombre : fond neutre discret (pas la couleur
// d'accent) pour rester proche de la référence Claude.ai — seul l'onglet
// actif se détache, via un fond clair + légère ombre, du reste du groupe.
const themeModePill: React.CSSProperties = {
display: 'flex', gap: 2, padding: 3,
background: 'var(--bg-elevated)', borderRadius: 12,
};
const themeModeBtn: React.CSSProperties = {
flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
padding: '8px 4px', borderRadius: 9, cursor: 'pointer',
transition: 'background 0.15s ease, color 0.15s ease',
};
const categoryWrapper: React.CSSProperties = {
background: 'var(--bg-surface)', border: '1px solid var(--border)',
borderRadius: 16, marginBottom: 12, overflow: 'hidden',
};
const categoryHeaderBtn: React.CSSProperties = {
display: 'flex', alignItems: 'center', gap: 10, width: '100%',
padding: '14px 14px', cursor: 'pointer', background: 'transparent',
};
const categoryHeaderLabel: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 15, fontWeight: 800 };
const categoryHeaderDesc: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, marginTop: 2 };
const categoryBody: React.CSSProperties = {
padding: '4px 14px 16px', borderTop: '1px solid var(--border-subtle)',
};
const swatchGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 };
const swatchBtn: React.CSSProperties = {
display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
padding: '10px 4px', borderRadius: 14, cursor: 'pointer',
background: 'var(--bg-elevated)',
};
const segmentRow: React.CSSProperties = { display: 'flex', gap: 8 };
const segmentBtn: React.CSSProperties = {
flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
padding: '12px 4px', borderRadius: 14, cursor: 'pointer',
border: '1px solid var(--border-strong)', transition: 'background 0.2s, color 0.2s',
};
const toggleRow: React.CSSProperties = {
display: 'flex', alignItems: 'center', gap: 12,
background: 'var(--bg-elevated)', border: '1px solid var(--border)',
borderRadius: 14, padding: '12px 14px', marginBottom: 8,
};
const switchTrack: React.CSSProperties = {
width: 44, height: 26, borderRadius: 13, padding: 3,
display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer',
transition: 'background 0.2s',
};
const switchThumb: React.CSSProperties = {
width: 20, height: 20, borderRadius: '50%', background: '#fff',
boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'transform 0.2s',
};
const reorderCol: React.CSSProperties = {
display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
};
const restBtn: React.CSSProperties = {
flex: 1, padding: '10px 2px', borderRadius: 12, cursor: 'pointer',
fontSize: 12, fontWeight: 700, textAlign: 'center',
border: '1px solid var(--border-strong)', transition: 'background 0.2s, color 0.2s',
};
const reorderBtn: React.CSSProperties = {
width: 26, height: 20, borderRadius: 6,
background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
color: 'var(--text-muted)', fontSize: 9, cursor: 'pointer',
display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const colorSwatchBtn: React.CSSProperties = {
display: 'block', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
border: '2px solid var(--border-strong)', marginRight: 10,
};
const colorResetBtn: React.CSSProperties = {
position: 'absolute', top: -6, right: 2, width: 14, height: 14, borderRadius: 7,
background: 'var(--bg-higher)', border: '1px solid var(--border-strong)',
color: 'var(--text-dim)', fontSize: 8, cursor: 'pointer',
display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
};
const dayGroup: React.CSSProperties = {
background: 'var(--bg-elevated)', border: '1px solid var(--border)',
borderRadius: 14, marginBottom: 8, overflow: 'hidden',
};
const dayHeaderBtn: React.CSSProperties = {
display: 'flex', alignItems: 'center', width: '100%',
padding: '12px 14px', cursor: 'pointer',
};
const exRestRow: React.CSSProperties = {
display: 'flex', alignItems: 'center', gap: 6,
padding: '8px 2px', borderTop: '1px solid var(--border-subtle)',
};
const stepperBtn: React.CSSProperties = {
width: 28, height: 28, borderRadius: 8, flexShrink: 0,
background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
color: 'var(--text-muted)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const resetBtn: React.CSSProperties = {
width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginLeft: 2,
background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
color: 'var(--brand-1)', fontSize: 13, cursor: 'pointer',
display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const programCard: React.CSSProperties = {
flex: 1, textAlign: 'left', borderRadius: 14, padding: '12px 14px',
cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s',
};
const programDeleteBtn: React.CSSProperties = {
width: 32, borderRadius: 10, flexShrink: 0,
background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
color: 'var(--text-dim)', fontSize: 13, cursor: 'pointer',
display: 'flex', alignItems: 'center', justifyContent: 'center',
};
