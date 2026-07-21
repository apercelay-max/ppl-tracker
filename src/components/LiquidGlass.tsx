// LiquidGlass.tsx — composants "Liquid Glass" (verre liquide façon Apple WWDC 2025)
// Aucune ressource propriétaire : uniquement CSS/SVG/WebGL maison + Framer Motion.
// Usage bar du bas PPL : <GlassPanel className="fixed bottom-0 inset-x-0"><GlassButton>...</GlassButton></GlassPanel>

import React, { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// ---------- Types communs ----------
export type GlassColor = "neutral" | "blue" | "purple" | "green" | "red";

export interface GlassBaseProps {
  intensity?: number;      // 0..1, force du flou/opacité verre (def 0.6)
  interactive?: boolean;   // active le highlight qui suit la souris
  animated?: boolean;      // active hover/press animations
  glow?: boolean;          // halo lumineux supplémentaire
  color?: GlassColor;      // teinte
  radius?: number;         // border-radius en px
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

const colorTint: Record<GlassColor, string> = {
  neutral: "255,255,255",
  blue: "160,200,255",
  purple: "200,170,255",
  green: "170,255,210",
  red: "255,180,180",
};

// ---------- Hook: highlight qui suit la souris (perf: motion values, pas de re-render React) ----------
function usePointerGlow(ref: React.RefObject<HTMLElement>, enabled: boolean) {
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const sx = useSpring(x, { stiffness: 200, damping: 25, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 25, mass: 0.4 });

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      // requestAnimationFrame implicite via motion values -> pas de setState
      x.set(((e.clientX - rect.left) / rect.width) * 100);
      y.set(((e.clientY - rect.top) / rect.height) * 100);
    },
    [enabled, ref, x, y]
  );

  return { sx, sy, onMove };
}

// ---------- Noise texture (SVG data-uri, généré une seule fois, 2-3% opacité) ----------
const NOISE_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
    <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>
    <rect width='100%' height='100%' filter='url(#n)'/>
  </svg>`);

// ---------- Coeur : le "verre" lui-même ----------
const GlassSurface: React.FC<
  GlassBaseProps & { as?: "div" | "button"; role?: string }
> = ({
  intensity = 0.6,
  interactive = true,
  animated = true,
  glow = false,
  color = "neutral",
  radius = 24,
  className = "",
  children,
  onClick,
  as = "div",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { sx, sy, onMove } = usePointerGlow(ref, interactive);
  const [pressed, setPressed] = useState(false);
  const tint = colorTint[color];

  // clamp intensity -> valeurs CSS
  const blur = 20 + intensity * 30; // 20-50px
  const bgTop = 0.18 + intensity * 0.18;
  const bgBottom = 0.05 + intensity * 0.06;

  const Comp: any = motion[as === "button" ? "button" : "div"];

  return (
    <Comp
      ref={ref}
      onPointerMove={onMove}
      onPointerDown={() => animated && setPressed(true)}
      onPointerUp={() => animated && setPressed(false)}
      onPointerLeave={() => animated && setPressed(false)}
      onClick={onClick}
      className={`lg-surface ${glow ? "lg-glow" : ""} ${className}`}
      style={{
        borderRadius: radius,
        backdropFilter: `blur(${blur}px) saturate(180%) brightness(1.05)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(180%) brightness(1.05)`,
        background: `linear-gradient(180deg, rgba(${tint},${bgTop}), rgba(${tint},${bgBottom}))`,
        border: `1px solid rgba(${tint},0.25)`,
        boxShadow:
          "inset 0 1px 1px rgba(255,255,255,.45), inset 0 -1px 1px rgba(0,0,0,.08), 0 20px 40px rgba(0,0,0,.15)",
        willChange: "transform, filter",
        transform: "translateZ(0)",
      }}
      animate={
        animated
          ? { scale: pressed ? 0.98 : 1 }
          : undefined
      }
      whileHover={animated ? { scale: 1.02, filter: "brightness(1.03)" } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      {/* Highlight qui suit la souris */}
      {interactive && (
        <motion.span
          aria-hidden
          className="lg-highlight"
          style={{
            left: useMotionValue(0), // placeholder pour cohérence types
            background: useMemo(
              () => `radial-gradient(circle, rgba(255,255,255,.45), transparent 65%)`,
              []
            ),
          }}
          animate={{
            // positionné via CSS vars pilotées par sx/sy (perf, pas de reflow)
          }}
          ref={(el: HTMLSpanElement | null) => {
            if (!el) return;
            sx.on("change", (v) => (el.style.setProperty("--gx", `${v}%`)));
            sy.on("change", (v) => (el.style.setProperty("--gy", `${v}%`)));
          }}
        />
      )}
      {/* Bruit fin */}
      <span
        aria-hidden
        className="lg-noise"
        style={{ backgroundImage: `url("${NOISE_SVG}")` }}
      />
      {/* Réfraction légère (displacement map SVG, fallback sans WebGL) */}
      <RefractionLayer />
      <span className="lg-content">{children}</span>
    </Comp>
  );
};

// ---------- Réfraction : displacement map SVG (fallback fiable, pas de dépendance WebGL) ----------
const RefractionLayer: React.FC = () => (
  <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
    <filter id="lg-refraction">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.008 0.03"
        numOctaves="2"
        seed="7"
        result="noise"
      />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
    </filter>
  </svg>
);

// ---------- API publique ----------
export const GlassPanel: React.FC<GlassBaseProps> = (props) => (
  <GlassSurface as="div" {...props} />
);

export const GlassCard: React.FC<GlassBaseProps> = (props) => (
  <GlassSurface as="div" radius={props.radius ?? 20} {...props} />
);

export const GlassButton: React.FC<GlassBaseProps> = (props) => (
  <GlassSurface as="button" radius={props.radius ?? 16} interactive animated {...props} />
);

export const GlassDialog: React.FC<GlassBaseProps> = (props) => (
  <GlassSurface as="div" radius={props.radius ?? 28} glow {...props} />
);

export default GlassSurface;
