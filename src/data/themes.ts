// Thèmes partagés avec l'app Repas & Courses — mêmes couleurs, mêmes noms.
// Chaque thème est traduit en variables CSS PPL au moment de l'application.

export type ThemeId =
  | "classicLight" | "classicDark" | "aube" | "soleil" | "ocean" | "foret"
  | "crepuscule" | "nuit" | "lavande" | "menthe" | "neon" | "corail"
  | "chrome" | "diamant";

type Palette = {
  text: string; mutedForeground: string;
  background: string; card: string; cardBorder: string;
  primary: string; primaryForeground: string;
  muted: string; border: string;
  success: string; warning: string; destructive: string;
  frigo: string; placard: string;
  numColor: string;
};

export type AppTheme = {
  id: ThemeId;
  name: string;
  emoji: string;
  gradient: string[];
  isDark: boolean;
  p: Palette;
};

export const THEMES: Record<ThemeId, AppTheme> = {
  classicLight: {
    id: "classicLight", name: "Classique clair", emoji: "☀️",
    gradient: ["#F8F9FA", "#FFFFFF"], isDark: false,
    p: {
      text: "#111827", mutedForeground: "#6B7280",
      background: "#F8F9FA", card: "#FFFFFF", cardBorder: "#E5E7EB",
      primary: "#3B5BDB", primaryForeground: "#FFFFFF",
      muted: "#F3F4F6", border: "#E5E7EB",
      success: "#22C55E", warning: "#F59E0B", destructive: "#EF4444",
      frigo: "#3B82F6", placard: "#8B5CF6", numColor: "#111827",
    },
  },
  classicDark: {
    id: "classicDark", name: "Classique sombre", emoji: "🌙",
    gradient: ["#0F172A", "#1E293B"], isDark: true,
    p: {
      text: "#F9FAFB", mutedForeground: "#94A3B8",
      background: "#0F172A", card: "#1E293B", cardBorder: "#334155",
      primary: "#818CF8", primaryForeground: "#FFFFFF",
      muted: "#1E293B", border: "#334155",
      success: "#4ADE80", warning: "#FCD34D", destructive: "#F87171",
      frigo: "#60A5FA", placard: "#A78BFA", numColor: "#818CF8",
    },
  },
  aube: {
    id: "aube", name: "Aube", emoji: "🌅",
    gradient: ["#FF9A9E", "#FAD0C4", "#FFE9D0"], isDark: false,
    p: {
      text: "#3D0C11", mutedForeground: "#8B4251",
      background: "#FF9A9E", card: "rgba(255,255,255,0.72)", cardBorder: "rgba(255,255,255,0.5)",
      primary: "#C0294A", primaryForeground: "#FFFFFF",
      muted: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.45)",
      success: "#1E7E34", warning: "#D97706", destructive: "#B91C1C",
      frigo: "#2563EB", placard: "#7C3AED", numColor: "#C0294A",
    },
  },
  soleil: {
    id: "soleil", name: "Soleil", emoji: "🌞",
    gradient: ["#F7971E", "#FFD200"], isDark: false,
    p: {
      text: "#3D2000", mutedForeground: "#7A4A00",
      background: "#F7971E", card: "rgba(255,255,255,0.70)", cardBorder: "rgba(255,255,255,0.55)",
      primary: "#C05C00", primaryForeground: "#FFFFFF",
      muted: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.45)",
      success: "#15803D", warning: "#B45309", destructive: "#B91C1C",
      frigo: "#1D4ED8", placard: "#6D28D9", numColor: "#C05C00",
    },
  },
  ocean: {
    id: "ocean", name: "Océan", emoji: "🌊",
    gradient: ["#0A2342", "#126872", "#1A9DAA"], isDark: true,
    p: {
      text: "#FFFFFF", mutedForeground: "rgba(255,255,255,0.65)",
      background: "#0A2342", card: "rgba(255,255,255,0.10)", cardBorder: "rgba(255,255,255,0.15)",
      primary: "#67E8F9", primaryForeground: "#0A2342",
      muted: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.15)",
      success: "#4ADE80", warning: "#FCD34D", destructive: "#F87171",
      frigo: "#93C5FD", placard: "#C4B5FD", numColor: "#67E8F9",
    },
  },
  foret: {
    id: "foret", name: "Forêt", emoji: "🌲",
    gradient: ["#0B3D2E", "#1A6B4A", "#2D9A6B"], isDark: true,
    p: {
      text: "#FFFFFF", mutedForeground: "rgba(255,255,255,0.65)",
      background: "#0B3D2E", card: "rgba(255,255,255,0.10)", cardBorder: "rgba(255,255,255,0.15)",
      primary: "#86EFAC", primaryForeground: "#0B3D2E",
      muted: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.15)",
      success: "#86EFAC", warning: "#FCD34D", destructive: "#FCA5A5",
      frigo: "#93C5FD", placard: "#C4B5FD", numColor: "#86EFAC",
    },
  },
  crepuscule: {
    id: "crepuscule", name: "Crépuscule", emoji: "🌇",
    gradient: ["#614385", "#A0526B", "#F4A261"], isDark: true,
    p: {
      text: "#FFFFFF", mutedForeground: "rgba(255,255,255,0.70)",
      background: "#614385", card: "rgba(255,255,255,0.12)", cardBorder: "rgba(255,255,255,0.18)",
      primary: "#FED7AA", primaryForeground: "#614385",
      muted: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.18)",
      success: "#86EFAC", warning: "#FCD34D", destructive: "#FCA5A5",
      frigo: "#93C5FD", placard: "#E9D5FF", numColor: "#FED7AA",
    },
  },
  nuit: {
    id: "nuit", name: "Nuit", emoji: "🌃",
    gradient: ["#0F0C29", "#302B63", "#24243E"], isDark: true,
    p: {
      text: "#FFFFFF", mutedForeground: "rgba(255,255,255,0.55)",
      background: "#0F0C29", card: "rgba(255,255,255,0.07)", cardBorder: "rgba(255,255,255,0.10)",
      primary: "#A5B4FC", primaryForeground: "#0F0C29",
      muted: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.10)",
      success: "#86EFAC", warning: "#FDE68A", destructive: "#FCA5A5",
      frigo: "#93C5FD", placard: "#C4B5FD", numColor: "#A5B4FC",
    },
  },
  lavande: {
    id: "lavande", name: "Lavande", emoji: "💜",
    gradient: ["#9D50BB", "#6E48AA", "#C9B8F5"], isDark: true,
    p: {
      text: "#FFFFFF", mutedForeground: "rgba(255,255,255,0.70)",
      background: "#9D50BB", card: "rgba(255,255,255,0.12)", cardBorder: "rgba(255,255,255,0.20)",
      primary: "#E9D5FF", primaryForeground: "#6E48AA",
      muted: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.18)",
      success: "#86EFAC", warning: "#FDE68A", destructive: "#FCA5A5",
      frigo: "#BAE6FD", placard: "#E9D5FF", numColor: "#E9D5FF",
    },
  },
  menthe: {
    id: "menthe", name: "Menthe", emoji: "🍃",
    gradient: ["#11998E", "#38EF7D"], isDark: false,
    p: {
      text: "#0A2E28", mutedForeground: "#155B4E",
      background: "#11998E", card: "rgba(255,255,255,0.72)", cardBorder: "rgba(255,255,255,0.55)",
      primary: "#059669", primaryForeground: "#FFFFFF",
      muted: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.5)",
      success: "#065F46", warning: "#92400E", destructive: "#991B1B",
      frigo: "#1D4ED8", placard: "#6D28D9", numColor: "#059669",
    },
  },
  neon: {
    id: "neon", name: "Néon", emoji: "⚡",
    gradient: ["#0D0D0D", "#1A0030", "#0D0D0D"], isDark: true,
    p: {
      text: "#FFFFFF", mutedForeground: "rgba(255,255,255,0.55)",
      background: "#0D0D0D", card: "rgba(255,255,255,0.05)", cardBorder: "rgba(57,255,20,0.30)",
      primary: "#39FF14", primaryForeground: "#0D0D0D",
      muted: "rgba(255,255,255,0.06)", border: "rgba(57,255,20,0.25)",
      success: "#39FF14", warning: "#FFD600", destructive: "#FF2079",
      frigo: "#00E5FF", placard: "#D400FF", numColor: "#39FF14",
    },
  },
  corail: {
    id: "corail", name: "Corail", emoji: "🪸",
    gradient: ["#FF6B6B", "#FF8E53", "#FFB347"], isDark: false,
    p: {
      text: "#2D0A00", mutedForeground: "#7A2E10",
      background: "#FF6B6B", card: "rgba(255,255,255,0.75)", cardBorder: "rgba(255,255,255,0.6)",
      primary: "#C0392B", primaryForeground: "#FFFFFF",
      muted: "rgba(255,255,255,0.42)", border: "rgba(255,255,255,0.5)",
      success: "#1A5C38", warning: "#9A3412", destructive: "#7F1D1D",
      frigo: "#1D4ED8", placard: "#6D28D9", numColor: "#C0392B",
    },
  },
  chrome: {
    id: "chrome", name: "Chrome 3D", emoji: "🔩",
    gradient: ["#BDC3C7", "#95A5A6", "#D5D8DC"], isDark: false,
    p: {
      text: "#1A1A2E", mutedForeground: "#4A5568",
      background: "#BDC3C7", card: "rgba(255,255,255,0.82)", cardBorder: "rgba(255,255,255,0.9)",
      primary: "#2C3E50", primaryForeground: "#FFFFFF",
      muted: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.7)",
      success: "#1E8449", warning: "#B7770D", destructive: "#922B21",
      frigo: "#154360", placard: "#4A235A", numColor: "#1A1A2E",
    },
  },
  diamant: {
    id: "diamant", name: "Diamant 3D", emoji: "💎",
    gradient: ["#0B0C10", "#1F2833", "#0B0C10"], isDark: true,
    p: {
      text: "#C5C6C7", mutedForeground: "rgba(197,198,199,0.65)",
      background: "#0B0C10", card: "rgba(31,40,51,0.90)", cardBorder: "rgba(102,252,241,0.25)",
      primary: "#66FCF1", primaryForeground: "#0B0C10",
      muted: "rgba(255,255,255,0.06)", border: "rgba(102,252,241,0.20)",
      success: "#66FCF1", warning: "#FFE066", destructive: "#FF4C60",
      frigo: "#45A8F5", placard: "#B794F4", numColor: "#66FCF1",
    },
  },
};

export const THEME_LIST: AppTheme[] = Object.values(THEMES);

// hex + alpha (ne s'applique qu'aux couleurs hex — toutes les couleurs
// d'accent des palettes sont en hex)
const a = (hex: string, alpha: string) => hex.startsWith("#") ? hex + alpha : hex;

function buildVars(t: AppTheme): Record<string, string> {
  const p = t.p;
  return {
    "--bg-gradient": `linear-gradient(160deg, ${t.gradient.join(", ")})`,
    "--bg-base": p.background,
    "--bg-surface": p.card,
    "--bg-card": p.card,
    "--bg-elevated": p.muted,
    "--bg-higher": p.muted,
    "--border-subtle": p.border,
    "--border": p.border,
    "--border-mid": p.cardBorder,
    "--border-strong": p.cardBorder,
    "--text-primary": p.text,
    "--text-secondary": p.text,
    "--text-muted": p.mutedForeground,
    "--text-dim": p.mutedForeground,
    "--text-micro": p.mutedForeground,
    "--overlay-bg": t.isDark ? "rgba(0,0,0,0.93)" : "rgba(180,180,205,0.9)",
    "--bg-red-tint": a(p.destructive, "1A"),
    "--bg-red-input": a(p.destructive, "1F"),
    "--bg-gold-tint": a(p.warning, "1F"),
    "--bg-green-tint": a(p.success, "1F"),
    "--bg-blue-tint": a(p.frigo, "1F"),
    "--border-gold-tint": a(p.warning, "40"),
    "--border-green-tint": a(p.success, "40"),
    "--border-blue-tint": a(p.frigo, "40"),
    "--border-ss-tint": a(p.success, "40"),
    "--text-gold-label": p.warning,
    "--text-gold-body": p.mutedForeground,
    "--text-gold-footer": p.mutedForeground,
    "--text-ss-label": p.success,
    "--text-ss-body": p.mutedForeground,
    "--scrollbar-track": "transparent",
    "--scrollbar-thumb": p.border,
    "--accent": p.primary,
    "--accent-contrast": p.primaryForeground,
    "--accent-2": p.placard,
    "--num-color": p.numColor,
  };
}

/** Applique un thème (ou "system", ou les anciens "dark"/"light"). */
export function applyTheme(id: string) {
  let themeId = id === "dark" ? "classicDark" : id === "light" ? "classicLight" : id;
  if (themeId === "system") {
    const prefersDark = typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    themeId = prefersDark ? "classicDark" : "classicLight";
  }
  const t = THEMES[themeId as ThemeId] ?? THEMES.classicDark;
  const root = document.documentElement;
  const vars = buildVars(t);
  for (const k of Object.keys(vars)) root.style.setProperty(k, vars[k]);
  root.setAttribute("data-theme", t.isDark ? "dark" : "light");
}
