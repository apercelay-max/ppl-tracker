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

const C = '#e03030';
const G = '#7a7a90';
const EQ = '#404050';
const W = 2.5;
const lp = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

// ââ PULL-UP âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const PullUp = () => (
  <svg viewBox="0 0 60 88" fill="none">
    <rect x="4" y="4" width="52" height="4" rx="2" fill={EQ}/>
    {/* Left arm: hand fixed, elbow+shoulder animate */}
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
    {/* Right arm */}
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
    {/* Head */}
    <circle cx="30" r="7" stroke={C} strokeWidth="2">
      <animate attributeName="cy" values="40;28;40" dur="2s" repeatCount="indefinite"/>
    </circle>
    {/* Body */}
    <line x1="30" x2="30" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="47;35;47" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="62;50;62" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Left leg */}
    <line x2="22" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="62;50;62" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="80;68;80" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Right leg */}
    <line x2="38" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="62;50;62" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="80;68;80" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ââ ROW (seated cable) ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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
    {/* Arms pull */}
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

// ââ CURL ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const Curl = () => (
  <svg viewBox="0 0 60 90" fill="none">
    <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
    <line x1="30" y1="19" x2="30" y2="48" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="22" y2="72" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="22" y1="72" x2="20" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="38" y2="72" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="72" x2="40" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    {/* Left arm passive */}
    <line x1="30" y1="26" x2="14" y2="42" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="14" y1="42" x2="12" y2="56" stroke={G} strokeWidth={W} {...lp}/>
    {/* Right upper arm */}
    <line x1="30" y1="26" x2="46" y2="36" stroke={C} strokeWidth={W} {...lp}/>
    {/* Right forearm curls */}
    <line x1="46" y1="36" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="52;38;52" dur="1.6s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="54;18;54" dur="1.6s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ââ DIP âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const Dip = () => (
  <svg viewBox="0 0 60 88" fill="none">
    <style>{`
      @keyframes dip-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(14px)} }
      .dip-b { animation: dip-b 2s ease-in-out infinite; }
    `}</style>
    <rect x="4" y="14" width="12" height="4" rx="2" fill={EQ}/>
    <rect x="44" y="14" width="12" height="4" rx="2" fill={EQ}/>
    <rect x="6" y="18" width="4" height="26" rx="2" fill={EQ}/>
    <rect x="50" y="18" width="4" height="26" rx="2" fill={EQ}/>
    <g className="dip-b">
      <line x1="8" y1="16" x2="24" y2="28" stroke={C} strokeWidth={W} {...lp}/>
      <line x1="52" y1="16" x2="36" y2="28" stroke={C} strokeWidth={W} {...lp}/>
      <circle cx="30" cy="16" r="7" stroke={C} strokeWidth="2"/>
      <line x1="30" y1="23" x2="30" y2="46" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="46" x2="24" y2="66" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="24" y1="66" x2="22" y2="80" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="46" x2="36" y2="66" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="36" y1="66" x2="38" y2="80" stroke={G} strokeWidth={W} {...lp}/>
    </g>
  </svg>
);

// ââ PUSH-UP âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const PushUp = () => (
  <svg viewBox="0 0 80 56" fill="none">
    <line x1="0" y1="52" x2="80" y2="52" stroke={EQ} strokeWidth="2"/>
    {/* Feet stay on floor */}
    <ellipse cx="64" cy="51" rx="5" ry="2" fill={EQ}/>
    {/* Hands animate up/down */}
    <line x1="14" y1="16" x2="58" y2="38" stroke={G} strokeWidth={W} {...lp}/>
    <circle cx="14" cy="8" r="6" stroke={C} strokeWidth="2"/>
    <line x1="14" y1="14" x2="12" y2="22" stroke={C} strokeWidth={W} {...lp}/>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="12;14;12" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="22;30;22" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="16;18;16" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="38;46;38" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x1="36" y1="30" x2="34" y2="38" stroke={C} strokeWidth={W} {...lp}/>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="34;36;34" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="38;46;38" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="38;40;38" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="46;50;46" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ââ FLY âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

// ââ LATERAL RAISE âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

// ââ PUSH-DOWN (tricep) ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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
    {/* Upper arms fixed */}
    <line x1="30" y1="30" x2="16" y2="40" stroke={C} strokeWidth={W} {...lp}/>
    <line x1="30" y1="30" x2="44" y2="40" stroke={C} strokeWidth={W} {...lp}/>
    {/* Forearms push down */}
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

// ââ SQUAT âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const Squat = () => (
  <svg viewBox="0 0 60 90" fill="none">
    <style>{`
      @keyframes sq-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(12px)} }
      .sq-b { animation: sq-b 2s ease-in-out infinite; }
    `}</style>
    <line x1="4" y1="86" x2="56" y2="86" stroke={EQ} strokeWidth="2"/>
    <ellipse cx="21" cy="86" rx="5" ry="2" fill={EQ}/>
    <ellipse cx="39" cy="86" rx="5" ry="2" fill={EQ}/>
    <g className="sq-b">
      <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
      <line x1="30" y1="19" x2="30" y2="44" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="28" x2="10" y2="34" stroke={C} strokeWidth={W} {...lp}/>
      <line x1="30" y1="28" x2="50" y2="34" stroke={C} strokeWidth={W} {...lp}/>
      {/* Thighs */}
      <line x1="30" y1="44" stroke={G} strokeWidth={W} {...lp}>
        <animate attributeName="x2" values="16;8;16" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="62;66;62" dur="2s" repeatCount="indefinite"/>
      </line>
      <line x1="30" y1="44" stroke={G} strokeWidth={W} {...lp}>
        <animate attributeName="x2" values="44;52;44" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="62;66;62" dur="2s" repeatCount="indefinite"/>
      </line>
    </g>
    {/* Shins: knee to fixed foot */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="16;8;16" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="74;78;74" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="21;21;21" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="86;86;86" dur="2s" repeatCount="indefinite"/>
    </line>
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="44;52;44" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="74;78;74" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="39;39;39" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="86;86;86" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ââ LUNGE âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const Lunge = () => (
  <svg viewBox="0 0 70 88" fill="none">
    <style>{`
      @keyframes lg-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }
      .lg-b { animation: lg-b 2s ease-in-out infinite; }
    `}</style>
    <line x1="0" y1="84" x2="70" y2="84" stroke={EQ} strokeWidth="2"/>
    <g className="lg-b">
      <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
      <line x1="30" y1="19" x2="30" y2="44" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="28" x2="16" y2="38" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="28" x2="44" y2="38" stroke={G} strokeWidth={W} {...lp}/>
      {/* Front thigh */}
      <line x1="30" y1="44" x2="50" y2="60" stroke={G} strokeWidth={W} {...lp}/>
      {/* Back thigh */}
      <line x1="30" y1="44" x2="14" y2="60" stroke={G} strokeWidth={W} {...lp}/>
    </g>
    {/* Front shin to fixed foot */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="50;50;50" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="70;80;70" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="54;54;54" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="84;84;84" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Back shin (knee near floor) */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="14;14;14" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="70;80;70" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="16;16;16" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="84;84;84" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ââ CALF RAISE ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const Calf = () => (
  <svg viewBox="0 0 60 88" fill="none">
    <style>{`
      @keyframes calf-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      .calf-b { animation: calf-b 1.8s ease-in-out infinite; }
    `}</style>
    <line x1="4" y1="84" x2="56" y2="84" stroke={EQ} strokeWidth="2"/>
    {/* Toes stay roughly fixed */}
    <ellipse cx="30" cy="84" rx="8" ry="2.5" fill={EQ}/>
    <g className="calf-b">
      <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
      <line x1="30" y1="19" x2="30" y2="44" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="28" x2="16" y2="40" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="28" x2="44" y2="40" stroke={G} strokeWidth={W} {...lp}/>
      {/* Thighs */}
      <line x1="30" y1="44" x2="24" y2="64" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="44" x2="36" y2="64" stroke={G} strokeWidth={W} {...lp}/>
      {/* Shins */}
      <line x1="24" y1="64" x2="28" y2="76" stroke={C} strokeWidth={W} {...lp}/>
      <line x1="36" y1="64" x2="32" y2="76" stroke={C} strokeWidth={W} {...lp}/>
    </g>
  </svg>
);

// ââ BACK EXTENSION ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const BackExt = () => (
  <svg viewBox="0 0 80 64" fill="none">
    {/* GHD bench */}
    <rect x="28" y="38" width="44" height="5" rx="2" fill={EQ}/>
    <rect x="52" y="43" width="4" height="14" rx="2" fill={EQ}/>
    <rect x="60" y="43" width="4" height="14" rx="2" fill={EQ}/>
    {/* Hip anchor */}
    <rect x="24" y="36" width="8" height="8" rx="3" fill={EQ}/>
    {/* Legs (fixed horizontal) */}
    <line x1="28" y1="40" x2="72" y2="40" stroke={G} strokeWidth={W} {...lp}/>
    {/* Torso: animates from bent down to extended */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="24;24;24" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="40;40;40" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="6;4;6" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="56;36;56" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Head */}
    <circle r="6" stroke={C} strokeWidth="2">
      <animate attributeName="cx" values="4;2;4" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="48;30;48" dur="2s" repeatCount="indefinite"/>
    </circle>
    {/* Arms */}
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="4;4;4" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="54;36;54" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="14;10;14" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="58;28;58" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ââ HOLLOW BODY âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const Hollow = () => (
  <svg viewBox="0 0 80 48" fill="none">
    <line x1="0" y1="44" x2="80" y2="44" stroke={EQ} strokeWidth="2"/>
    {/* Back on floor */}
    <line x1="14" y1="36" x2="56" y2="36" stroke={G} strokeWidth={W} {...lp}/>
    {/* Head */}
    <circle cx="8" cy="32" r="6" stroke={C} strokeWidth="2"/>
    {/* Arms extended overhead */}
    <line x1="14" y1="34" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="4;6;4" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="22;20;22" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x1="14" y1="34" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="10;12;10" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="20;18;20" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Legs raised */}
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

// ââ PULLOVER ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const Pullover = () => (
  <svg viewBox="0 0 60 90" fill="none">
    <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
    <line x1="30" y1="19" x2="30" y2="48" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="22" y2="70" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="22" y1="70" x2="20" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="38" y2="70" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="70" x2="40" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    {/* Pulley overhead */}
    <circle cx="30" cy="4" r="3" fill={EQ}/>
    {/* Arms sweep from overhead to hips */}
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

// ââ INCLINE PRESS âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const InclinePress = () => (
  <svg viewBox="0 0 80 64" fill="none">
    {/* Incline bench */}
    <rect x="8" y="46" width="56" height="5" rx="2" fill={EQ}/>
    <rect x="12" y="30" width="5" height="18" rx="2" fill={EQ}/>
    <rect x="14" y="51" width="4" height="10" rx="2" fill={EQ}/>
    <rect x="58" y="51" width="4" height="10" rx="2" fill={EQ}/>
    {/* Head */}
    <circle cx="14" cy="22" r="6" stroke={C} strokeWidth="2"/>
    {/* Body on incline */}
    <line x1="16" y1="28" x2="62" y2="46" stroke={G} strokeWidth={W} {...lp}/>
    {/* Arms press up */}
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

// ââ REAR DELT âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const RearDelt = () => (
  <svg viewBox="0 0 60 80" fill="none">
    {/* Figure bent over ~45Â° */}
    <circle cx="14" cy="34" r="6" stroke={C} strokeWidth="2"/>
    <line x1="14" y1="40" x2="32" y2="28" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="32" y1="28" x2="38" y2="44" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="44" x2="34" y2="64" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="34" y1="64" x2="32" y2="76" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="44" x2="44" y2="64" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="44" y1="64" x2="46" y2="76" stroke={G} strokeWidth={W} {...lp}/>
    {/* Arms flap back */}
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

// ââ HIP THRUST ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const HipThrust = () => (
  <svg viewBox="0 0 80 56" fill="none">
    <line x1="0" y1="52" x2="80" y2="52" stroke={EQ} strokeWidth="2"/>
    {/* Bench (shoulders rest on) */}
    <rect x="4" y="28" width="18" height="5" rx="2" fill={EQ}/>
    <rect x="6" y="33" width="4" height="14" rx="2" fill={EQ}/>
    <rect x="14" y="33" width="4" height="14" rx="2" fill={EQ}/>
    {/* Head */}
    <circle cx="14" cy="22" r="6" stroke={C} strokeWidth="2"/>
    {/* Upper body on bench */}
    <line x1="14" y1="28" x2="32" y2="30" stroke={G} strokeWidth={W} {...lp}/>
    {/* Hips animate up/down */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="32;32;32" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="30;22;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="50;48;50" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="38;28;38" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Shins + feet */}
    <line x1="50" y1="44" x2="60" y2="52" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="54" y1="44" x2="64" y2="52" stroke={G} strokeWidth={W} {...lp}/>
    {/* Thighs connect hips to knees */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="50;48;50" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="38;28;38" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="52;50;52" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="44;44;44" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ââ CRUNCH ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const Crunch = () => (
  <svg viewBox="0 0 80 52" fill="none">
    <line x1="0" y1="48" x2="80" y2="48" stroke={EQ} strokeWidth="2"/>
    {/* Legs bent, feet on floor */}
    <line x1="42" y1="34" x2="56" y2="46" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="50" y1="34" x2="64" y2="46" stroke={G} strokeWidth={W} {...lp}/>
    {/* Thighs */}
    <line x1="28" y1="36" x2="42" y2="34" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="28" y1="38" x2="50" y2="34" stroke={G} strokeWidth={W} {...lp}/>
    {/* Upper body curls up */}
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="28;26;28" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="37;37;37" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="6;10;6" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="38;30;38" dur="2s" repeatCount="indefinite"/>
    </line>
    {/* Head */}
    <circle r="6" stroke={C} strokeWidth="2">
      <animate attributeName="cx" values="6;10;6" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="30;24;30" dur="2s" repeatCount="indefinite"/>
    </circle>
    {/* Arms (hands behind head) */}
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x1" values="6;10;6" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="26;20;26" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="14;18;14" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="22;16;22" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

// ââ PLANK âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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
      {/* Forearms on floor */}
      <line x1="20" y1="32" x2="16" y2="44" stroke={C} strokeWidth={W} {...lp}/>
      <line x1="36" y1="35" x2="32" y2="44" stroke={C} strokeWidth={W} {...lp}/>
      {/* Feet */}
      <ellipse cx="60" cy="42" rx="5" ry="2.5" fill={G}/>
    </g>
  </svg>
);

// ââ MAP âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

// ââ MAIN EXPORT âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
interface Props { exerciseId: string; size?: number; }

export const ExerciseAnimation: React.FC<Props> = ({ exerciseId, size = 60 }) => {
  const type = EXERCISE_ANIM_MAP[exerciseId];
  const Comp = type ? ANIM_COMPONENTS[type] : null;
  if (!Comp) return null;
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 12,
      background: 'rgba(224,48,48,0.06)',
      border: '1px solid rgba(224,48,48,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{ width: size - 10, height: size - 10 }}>
        <Comp />
      </div>
    </div>
  );
};
