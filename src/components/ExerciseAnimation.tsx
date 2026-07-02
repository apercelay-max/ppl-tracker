import React from 'react';

export const EXERCISE_ANIM_MAP: Record<string, string> = {
  'pull-a-1': 'pullup',   'pull-b-1': 'pullup',
  'pull-a-2': 'row',
  'pull-a-3': 'curl',     'pull-a-4': 'curl',
  'pull-b-3': 'curl',     'pull-b-4': 'curl',
  'push-a-1': 'dip',      'push-b-5': 'dip',
  'push-a-2': 'pushup',
  'push-a-3': 'fly',      'push-b-2': 'fly',
  'push-a-4': 'lateral',  'push-b-3': 'lateral',
  'push-a-5': 'pushdown',
  'legs-a-1': 'squat',
  'legs-a-2': 'lunge',    'legs-b-1': 'lunge',
  'legs-a-3': 'calf',     'legs-b-3': 'calf',
  'legs-a-4': 'backext',
  'legs-a-5': 'hollow',
  'pull-b-2': 'pullover',
  'push-b-1': 'inclinepress',
  'push-b-4': 'reardelt',
  'legs-b-2': 'hipthrust',
  'legs-b-4': 'crunch',
  'legs-b-5': 'plank',
};

const C = 'var(--brand-1)';
const G = '#7a7a90';
const EQ = '#404050';
const W = 2.5;
const lp = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

// ─── TRACTION (pull-up) ───────────────────────────────────────────────────────
const PullUp = () => (
  <svg viewBox="0 0 60 88" fill="none">
    <rect x="4" y="4" width="52" height="4" rx="2" fill={EQ}/>
    {/* Bras gauche : main fixée, coude + épaule animent */}
    <line x1="18" y1="6" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="12;20;12" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="22;14;22" dur="2s" repeatCount="indefinite"/>
    </line>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="12;20;12" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="22;14;22" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="32;20;32" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Bras droit */}
    <line x1="42" y1="6" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="48;40;48" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="22;14;22" dur="2s" repeatCount="indefinite"/>
    </line>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="48;40;48" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="22;14;22" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="32;20;32" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Tête */}
    <circle cx="30" r="7" stroke={C} strokeWidth="2">
      <animate attributeName="cy" values="40;28;40" dur="2s" repeatCount="indefinite"/>
    </circle>
    {/* Buste */}
    <line x1="30" x2="30" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="47;35;47" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="62;50;62" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Jambe gauche */}
    <line x2="22" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="62;50;62" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="80;68;80" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Jambe droite */}
    <line x2="38" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="62;50;62" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="80;68;80" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── ROW (tirage assis) ───────────────────────────────────────────────────────
const Row = () => (
  <svg viewBox="0 0 80 64" fill="none">
    <rect x="4" y="44" width="22" height="4" rx="2" fill={EQ}/>
    <rect x="70" y="22" width="6" height="6" rx="1" fill={EQ}/>
    <line x1="73" y1="25" x2="73" y2="44" stroke={EQ} strokeWidth="1.5"/>
    <circle cx="20" cy="18" r="7" stroke={C} strokeWidth="2"/>
    <line x1="20" y1="25" x2="18" y2="44" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="18" y1="44" x2="6" y2="46" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="6" y1="46" x2="8" y2="58" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="18" y1="44" x2="10" y2="46" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="10" y1="46" x2="12" y2="58" stroke={G} strokeWidth={W} {...lp}/>
    {/* Bras qui tirent */}
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="20;28;20" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="32;32;32" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="60;42;60" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="28;32;28" dur="1.8s" repeatCount="indefinite"/>
    </line>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="20;28;20" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="38;38;38" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="60;42;60" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="34;38;34" dur="1.8s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── CURL (biceps) ─────────────────────────────────────────────────────────────
const Curl = () => (
  <svg viewBox="0 0 60 90" fill="none">
    <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
    <line x1="30" y1="19" x2="30" y2="48" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="22" y2="72" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="22" y1="72" x2="20" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="38" y2="72" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="72" x2="40" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    {/* Bras gauche passif */}
    <line x1="30" y1="26" x2="14" y2="42" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="14" y1="42" x2="12" y2="56" stroke={G} strokeWidth={W} {...lp}/>
    {/* Bras droit : haut du bras fixe */}
    <line x1="30" y1="26" x2="46" y2="36" stroke={C} strokeWidth={W} {...lp}/>
    {/* Avant-bras qui monte (curl) */}
    <line x1="46" y1="36" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="52;38;52" dur="1.6s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="54;18;54" dur="1.6s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── DIPS ──────────────────────────────────────────────────────────────────────
// Les mains restent fixées sur les barres parallèles ; seuls le buste, les
// coudes et les jambes descendent puis remontent (flexion des coudes).
const Dip = () => (
  <svg viewBox="0 0 60 88" fill="none">
    <rect x="4" y="14" width="12" height="4" rx="2" fill={EQ}/>
    <rect x="44" y="14" width="12" height="4" rx="2" fill={EQ}/>
    <rect x="6" y="18" width="4" height="26" rx="2" fill={EQ}/>
    <rect x="50" y="18" width="4" height="26" rx="2" fill={EQ}/>
    {/* Tête */}
    <circle cx="30" r="7" stroke={C} strokeWidth="2">
      <animate attributeName="cy" values="14;28;14" dur="2s" repeatCount="indefinite"/>
    </circle>
    {/* Buste (nuque → hanche) */}
    <line x1="30" x2="30" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="21;35;21" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="44;58;44" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Jambes (suivent la hanche, pendent librement) */}
    <line x1="30" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="44;58;44" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="24;24;24" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="64;78;64" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x1="30" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="44;58;44" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="36;36;36" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="64;78;64" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Bras gauche : main fixée à la barre, coude qui plie */}
    <line x1="10" y1="16" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="18;6;18" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="20;32;20" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x2="30" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="18;6;18" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="20;32;20" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="21;35;21" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Bras droit : symétrique */}
    <line x1="50" y1="16" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="42;54;42" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="20;32;20" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x2="30" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="42;54;42" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="20;32;20" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="21;35;21" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── POMPE (push-up) ───────────────────────────────────────────────────────────
// Mains et pieds restent au sol ; les épaules, la tête et le bassin
// descendent ensemble quand les coudes plient, puis remontent.
const PushUp = () => (
  <svg viewBox="0 0 80 56" fill="none">
    <line x1="0" y1="52" x2="80" y2="52" stroke={EQ} strokeWidth="2"/>
    <ellipse cx="66" cy="51" rx="5" ry="2" fill={EQ}/>
    {/* Tête */}
    <circle cx="14" r="6" stroke={C} strokeWidth="2">
      <animate attributeName="cy" values="12;34;12" dur="2s" repeatCount="indefinite"/>
    </circle>
    {/* Buste (épaule → hanche) */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="18;18;18" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="20;42;20" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="44;44;44" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="26;46;26" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Jambes (hanche → pieds fixes) */}
    <line x2="66" y2="51" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="44;44;44" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="26;46;26" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Bras : main fixée au sol, coude qui plie */}
    <line x1="14" y1="48" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="16;4;16" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="34;40;34" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x2="18" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="16;4;16" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="34;40;34" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="20;42;20" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── FLY (écarté) ──────────────────────────────────────────────────────────────
const Fly = () => (
  <svg viewBox="0 0 80 58" fill="none">
    <rect x="10" y="32" width="58" height="5" rx="2" fill={EQ}/>
    <rect x="14" y="37" width="4" height="14" rx="2" fill={EQ}/>
    <rect x="62" y="37" width="4" height="14" rx="2" fill={EQ}/>
    <circle cx="16" cy="24" r="6" stroke={C} strokeWidth="2"/>
    <line x1="16" y1="30" x2="60" y2="32" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="31" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="8;12;8" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="16;32;16" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x1="46" y1="31" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="70;66;70" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="16;32;16" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── ÉLÉVATION LATÉRALE ─────────────────────────────────────────────────────────
const Lateral = () => (
  <svg viewBox="0 0 60 88" fill="none">
    <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
    <line x1="30" y1="19" x2="30" y2="48" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="22" y2="70" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="22" y1="70" x2="20" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="38" y2="70" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="70" x2="40" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="26" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="14;2;14" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="44;22;44" dur="1.8s" repeatCount="indefinite"/>
    </line>
    <line x1="30" y1="26" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="46;58;46" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="44;22;44" dur="1.8s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── EXTENSION TRICEPS (poulie) ─────────────────────────────────────────────────
const PushDown = () => (
  <svg viewBox="0 0 60 88" fill="none">
    <circle cx="30" cy="4" r="4" fill={EQ}/>
    <line x1="30" y1="8" x2="30" y2="16" stroke={EQ} strokeWidth="1.5"/>
    <circle cx="30" cy="18" r="7" stroke={C} strokeWidth="2"/>
    <line x1="30" y1="25" x2="30" y2="52" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="52" x2="22" y2="74" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="22" y1="74" x2="20" y2="86" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="52" x2="38" y2="74" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="74" x2="40" y2="86" stroke={G} strokeWidth={W} {...lp}/>
    {/* Haut des bras fixe */}
    <line x1="30" y1="30" x2="16" y2="40" stroke={C} strokeWidth={W} {...lp}/>
    <line x1="30" y1="30" x2="44" y2="40" stroke={C} strokeWidth={W} {...lp}/>
    {/* Avant-bras qui poussent vers le bas */}
    <line x1="16" y1="40" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="18;16;18" dur="1.6s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="26;58;26" dur="1.6s" repeatCount="indefinite"/>
    </line>
    <line x1="44" y1="40" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="42;44;42" dur="1.6s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="26;58;26" dur="1.6s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── SQUAT ─────────────────────────────────────────────────────────────────────
// Les pieds restent fixes au sol ; la barre suit les épaules, les hanches
// reculent et descendent, les genoux avancent légèrement au-dessus des pieds.
const Squat = () => (
  <svg viewBox="0 0 60 90" fill="none">
    <line x1="4" y1="86" x2="56" y2="86" stroke={EQ} strokeWidth="2"/>
    <ellipse cx="21" cy="86" rx="5" ry="2" fill={EQ}/>
    <ellipse cx="39" cy="86" rx="5" ry="2" fill={EQ}/>
    {/* Tête */}
    <circle cx="30" r="7" stroke={C} strokeWidth="2">
      <animate attributeName="cy" values="12;24;12" dur="2s" repeatCount="indefinite"/>
    </circle>
    {/* Buste (nuque → hanche) */}
    <line x1="30" x2="30" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="19;31;19" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="44;60;44" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Barre sur les épaules */}
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="26;38;26" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="10;10;10" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="32;44;32" dur="2s" repeatCount="indefinite"/>
    </line>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="26;38;26" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="50;50;50" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="32;44;32" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Cuisse gauche (hanche → genou) */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="44;60;44" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="24;14;24" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="64;70;64" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Tibia gauche (genou → pied fixe) */}
    <line x2="21" y2="86" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="24;14;24" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="64;70;64" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Cuisse droite */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="44;60;44" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="36;46;36" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="64;70;64" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Tibia droit */}
    <line x2="39" y2="86" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="36;46;36" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="64;70;64" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── FENTE (lunge) ───────────────────────────────────────────────────────────
// Le pied avant et l'appui du pied arrière restent fixes au sol ; le buste
// descend à la verticale pendant que le genou arrière plie vers le sol.
const Lunge = () => (
  <svg viewBox="0 0 70 88" fill="none">
    <line x1="0" y1="84" x2="70" y2="84" stroke={EQ} strokeWidth="2"/>
    <ellipse cx="54" cy="84" rx="5" ry="2" fill={EQ}/>
    <ellipse cx="15" cy="84" rx="5" ry="2" fill={EQ}/>
    {/* Tête */}
    <circle cx="30" r="7" stroke={C} strokeWidth="2">
      <animate attributeName="cy" values="12;20;12" dur="2s" repeatCount="indefinite"/>
    </circle>
    {/* Buste */}
    <line x1="30" x2="30" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="19;27;19" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="44;54;44" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Cuisse avant (hanche → genou avant) */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="44;54;44" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="46;50;46" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="54;64;54" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Tibia avant (genou → pied fixe) */}
    <line x2="54" y2="84" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="46;50;46" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="54;64;54" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Cuisse arrière (hanche → genou arrière) */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="44;54;44" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="18;16;18" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="54;78;54" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Tibia arrière (genou → appui du pied fixe) */}
    <line x2="15" y2="84" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="18;16;18" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="54;78;54" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── MOLLETS (extension) ───────────────────────────────────────────────────────
// La pointe des pieds reste fixe au sol (pivot) ; tout le corps s'élève
// quand les talons décollent, puis redescend.
const Calf = () => (
  <svg viewBox="0 0 60 88" fill="none">
    <line x1="4" y1="84" x2="56" y2="84" stroke={EQ} strokeWidth="2"/>
    <ellipse cx="30" cy="84" rx="8" ry="2.5" fill={EQ}/>
    {/* Tête */}
    <circle cx="30" r="7" stroke={C} strokeWidth="2">
      <animate attributeName="cy" values="12;2;12" dur="1.8s" repeatCount="indefinite"/>
    </circle>
    {/* Buste */}
    <line x1="30" x2="30" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="19;9;19" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="44;34;44" dur="1.8s" repeatCount="indefinite"/>
    </line>
    {/* Cuisse gauche */}
    <line x1="30" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="44;34;44" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="24;24;24" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="64;54;64" dur="1.8s" repeatCount="indefinite"/>
    </line>
    {/* Mollet gauche (genou → cheville ; le talon se lève, la cheville monte moins) */}
    <line x2="27" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="24;24;24" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="64;54;64" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="80;74;80" dur="1.8s" repeatCount="indefinite"/>
    </line>
    {/* Cuisse droite */}
    <line x1="30" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="44;34;44" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="36;36;36" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="64;54;64" dur="1.8s" repeatCount="indefinite"/>
    </line>
    {/* Mollet droit */}
    <line x2="33" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="36;36;36" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="64;54;64" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="80;74;80" dur="1.8s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── EXTENSION LOMBAIRE (GHD) ───────────────────────────────────────────────────
const BackExt = () => (
  <svg viewBox="0 0 80 64" fill="none">
    {/* Banc GHD */}
    <rect x="28" y="38" width="44" height="5" rx="2" fill={EQ}/>
    <rect x="52" y="43" width="4" height="14" rx="2" fill={EQ}/>
    <rect x="60" y="43" width="4" height="14" rx="2" fill={EQ}/>
    {/* Ancrage des hanches */}
    <rect x="24" y="36" width="8" height="8" rx="3" fill={EQ}/>
    {/* Jambes (fixes, horizontales) */}
    <line x1="28" y1="40" x2="72" y2="40" stroke={G} strokeWidth={W} {...lp}/>
    {/* Buste : passe de plié à tendu */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="24;24;24" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="40;40;40" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="6;4;6" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="56;36;56" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Tête */}
    <circle r="6" stroke={C} strokeWidth="2">
      <animate attributeName="cx" values="4;2;4" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="48;30;48" dur="2s" repeatCount="indefinite"/>
    </circle>
    {/* Bras */}
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="4;4;4" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="54;36;54" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="14;10;14" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="58;28;58" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── GAINAGE CREUX (hollow body) ────────────────────────────────────────────────
const Hollow = () => (
  <svg viewBox="0 0 80 48" fill="none">
    <line x1="0" y1="44" x2="80" y2="44" stroke={EQ} strokeWidth="2"/>
    {/* Dos au sol */}
    <line x1="14" y1="36" x2="56" y2="36" stroke={G} strokeWidth={W} {...lp}/>
    {/* Tête */}
    <circle cx="8" cy="32" r="6" stroke={C} strokeWidth="2"/>
    {/* Bras tendus au-dessus de la tête */}
    <line x1="14" y1="34" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="4;6;4" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="22;20;22" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x1="14" y1="34" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="10;12;10" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="20;18;20" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Jambes levées */}
    <line x1="56" y1="36" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="70;72;70" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="26;22;26" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x1="56" y1="36" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="68;70;68" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="22;18;22" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── PULLOVER ────────────────────────────────────────────────────────────────
const Pullover = () => (
  <svg viewBox="0 0 60 90" fill="none">
    <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
    <line x1="30" y1="19" x2="30" y2="48" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="22" y2="70" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="22" y1="70" x2="20" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="38" y2="70" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="70" x2="40" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    {/* Poulie en hauteur */}
    <circle cx="30" cy="4" r="3" fill={EQ}/>
    {/* Bras qui balayent de la tête vers les hanches */}
    <line x1="30" y1="28" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="16;8;16" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="8;44;8" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x1="30" y1="28" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="44;52;44" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="8;44;8" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── DÉVELOPPÉ INCLINÉ ───────────────────────────────────────────────────────
const InclinePress = () => (
  <svg viewBox="0 0 80 64" fill="none">
    {/* Banc incliné */}
    <rect x="8" y="46" width="56" height="5" rx="2" fill={EQ}/>
    <rect x="12" y="30" width="5" height="18" rx="2" fill={EQ}/>
    <rect x="14" y="51" width="4" height="10" rx="2" fill={EQ}/>
    <rect x="58" y="51" width="4" height="10" rx="2" fill={EQ}/>
    {/* Tête */}
    <circle cx="14" cy="22" r="6" stroke={C} strokeWidth="2"/>
    {/* Corps sur le banc incliné */}
    <line x1="16" y1="28" x2="62" y2="46" stroke={G} strokeWidth={W} {...lp}/>
    {/* Bras qui poussent vers le haut */}
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="26;26;26" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="34;34;34" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="18;16;18" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="48;22;48" dur="2s" repeatCount="indefinite"/>
    </line>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="40;40;40" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="39;39;39" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="36;34;36" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="52;26;52" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── OISEAU (deltoïde postérieur) ────────────────────────────────────────────
const RearDelt = () => (
  <svg viewBox="0 0 60 80" fill="none">
    {/* Buste penché à environ 45° */}
    <circle cx="14" cy="34" r="6" stroke={C} strokeWidth="2"/>
    <line x1="14" y1="40" x2="32" y2="28" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="32" y1="28" x2="38" y2="44" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="44" x2="34" y2="64" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="34" y1="64" x2="32" y2="76" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="44" x2="44" y2="64" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="44" y1="64" x2="46" y2="76" stroke={G} strokeWidth={W} {...lp}/>
    {/* Bras qui s'ouvrent vers l'arrière */}
    <line x1="24" y1="33" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="22;14;22" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="46;22;46" dur="1.8s" repeatCount="indefinite"/>
    </line>
    <line x1="24" y1="33" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="28;20;28" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="48;24;48" dur="1.8s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── HIP THRUST ────────────────────────────────────────────────────────────────
const HipThrust = () => (
  <svg viewBox="0 0 80 56" fill="none">
    <line x1="0" y1="52" x2="80" y2="52" stroke={EQ} strokeWidth="2"/>
    {/* Banc (épaules posées dessus) */}
    <rect x="4" y="28" width="18" height="5" rx="2" fill={EQ}/>
    <rect x="6" y="33" width="4" height="14" rx="2" fill={EQ}/>
    <rect x="14" y="33" width="4" height="14" rx="2" fill={EQ}/>
    {/* Tête */}
    <circle cx="14" cy="22" r="6" stroke={C} strokeWidth="2"/>
    {/* Haut du corps sur le banc */}
    <line x1="14" y1="28" x2="32" y2="30" stroke={G} strokeWidth={W} {...lp}/>
    {/* Hanches qui montent/descendent */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="32;32;32" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="30;22;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="50;48;50" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="38;28;38" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Tibias + pieds */}
    <line x1="50" y1="44" x2="60" y2="52" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="54" y1="44" x2="64" y2="52" stroke={G} strokeWidth={W} {...lp}/>
    {/* Cuisses relient les hanches aux genoux */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="50;48;50" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="38;28;38" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="52;50;52" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="44;44;44" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── CRUNCH ────────────────────────────────────────────────────────────────────
const Crunch = () => (
  <svg viewBox="0 0 80 52" fill="none">
    <line x1="0" y1="48" x2="80" y2="48" stroke={EQ} strokeWidth="2"/>
    {/* Jambes pliées, pieds au sol */}
    <line x1="42" y1="34" x2="56" y2="46" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="50" y1="34" x2="64" y2="46" stroke={G} strokeWidth={W} {...lp}/>
    {/* Cuisses */}
    <line x1="28" y1="36" x2="42" y2="34" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="28" y1="38" x2="50" y2="34" stroke={G} strokeWidth={W} {...lp}/>
    {/* Haut du corps qui s'enroule */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="28;26;28" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="37;37;37" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="6;10;6" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="38;30;38" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Tête */}
    <circle r="6" stroke={C} strokeWidth="2">
      <animate attributeName="cx" values="6;10;6" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="30;24;30" dur="2s" repeatCount="indefinite"/>
    </circle>
    {/* Bras (mains derrière la tête) */}
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="6;10;6" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="26;20;26" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="14;18;14" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="22;16;22" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ─── GAINAGE (plank) ───────────────────────────────────────────────────────────
const Plank = () => (
  <svg viewBox="0 0 80 48" fill="none">
    <style>{`
      @keyframes plank-b { 0%,100%{opacity:1} 50%{opacity:0.5} }
      .plank-b { animation: plank-b 2.5s ease-in-out infinite; }
    `}</style>
    <line x1="0" y1="44" x2="80" y2="44" stroke={EQ} strokeWidth="2"/>
    <g className="plank-b">
      <circle cx="10" cy="22" r="6" stroke={C} strokeWidth="2"/>
      <line x1="10" y1="28" x2="60" y2="36" stroke={G} strokeWidth={W} {...lp}/>
      {/* Avant-bras au sol */}
      <line x1="20" y1="32" x2="16" y2="44" stroke={C} strokeWidth={W} {...lp}/>
      <line x1="36" y1="35" x2="32" y2="44" stroke={C} strokeWidth={W} {...lp}/>
      {/* Pieds */}
      <ellipse cx="60" cy="42" rx="5" ry="2.5" fill={G}/>
    </g>
  </svg>
);

// ─── TABLE DE CORRESPONDANCE ────────────────────────────────────────────────────
const ANIM_COMPONENTS: Record<string, React.FC> = {
  pullup: PullUp,
  row: Row,
  curl: Curl,
  dip: Dip,
  pushup: PushUp,
  fly: Fly,
  lateral: Lateral,
  pushdown: PushDown,
  squat: Squat,
  lunge: Lunge,
  calf: Calf,
  backext: BackExt,
  hollow: Hollow,
  pullover: Pullover,
  inclinepress: InclinePress,
  reardelt: RearDelt,
  hipthrust: HipThrust,
  crunch: Crunch,
  plank: Plank,
};

// ─── EXPORT PRINCIPAL ────────────────────────────────────────────────────────
interface Props { exerciseId: string; size?: number; }

export const ExerciseAnimation: React.FC<Props> = ({ exerciseId, size = 60 }) => {
  const type = EXERCISE_ANIM_MAP[exerciseId];
  const Comp = type ? ANIM_COMPONENTS[type] : null;
  if (!Comp) return null;
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 'var(--icon-radius)',
      background: 'rgba(var(--brand-1-rgb),0.06)',
      border: '1px solid rgba(var(--brand-1-rgb),0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{ width: size - 10, height: size - 10 }}>
        <Comp />
      </div>
    </div>
  );
};
