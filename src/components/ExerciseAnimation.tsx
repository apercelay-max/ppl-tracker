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

const PullUp = () => (
  <svg viewBox="0 0 60 88" fill="none">
    <rect x="4" y="4" width="52" height="4" rx="2" fill={EQ}/>
    <line x1="18" y1="6" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="12;20;12" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="22;14;22" dur="2s" repeatCount="indefinite"/>
    </line>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="32;20;32" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x1="42" y1="6" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="48;40;48" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="22;14;22" dur="2s" repeatCount="indefinite"/>
    </line>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="30;30;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="32;20;32" dur="2s" repeatCount="indefinite"/>
    </line>
    <circle cx="30" r="7" stroke={C} strokeWidth="2">
      <animate attributeName="cy" values="40;28;40" dur="2s" repeatCount="indefinite"/>
    </circle>
    <line x1="30" x2="30" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="47;35;47" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="62;50;62" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x2="22" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="62;50;62" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="80;68;80" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x2="38" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="62;50;62" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="80;68;80" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

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
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="60;42;60" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="28;32;28" dur="1.8s" repeatCount="indefinite"/>
    </line>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="60;42;60" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="34;38;34" dur="1.8s" repeatCount="indefinite"/>
    </line>
  </svg>
);

const Curl = () => (
  <svg viewBox="0 0 60 90" fill="none">
    <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
    <line x1="30" y1="19" x2="30" y2="48" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="22" y2="72" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="22" y1="72" x2="20" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="38" y2="72" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="72" x2="40" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="26" x2="14" y2="42" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="14" y1="42" x2="12" y2="56" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="26" x2="46" y2="36" stroke={C} strokeWidth={W} {...lp}/>
    <line x1="46" y1="36" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="52;38;52" dur="1.6s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="54;18;54" dur="1.6s" repeatCount="indefinite"/>
    </line>
  </svg>
);

const Dip = () => (
  <svg viewBox="0 0 60 88" fill="none">
    <style>{`@keyframes dip-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(14px)}} .dip-b{animation:dip-b 2s ease-in-out infinite}`}</style>
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

const PushUp = () => (
  <svg viewBox="0 0 80 56" fill="none">
    <line x1="0" y1="52" x2="80" y2="52" stroke={EQ} strokeWidth="2"/>
    <ellipse cx="64" cy="51" rx="5" ry="2" fill={EQ}/>
    <line x1="14" y1="16" x2="58" y2="38" stroke={G} strokeWidth={W} {...lp}/>
    <circle cx="14" cy="8" r="6" stroke={C} strokeWidth="2"/>
    <line x1="14" y1="14" x2="12" y2="22" stroke={C} strokeWidth={W} {...lp}/>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="y2" values="38;46;38" dur="2s" repeatCount="indefinite"/>
    </line>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="y2" values="46;50;46" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

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
    <line x1="30" y1="30" x2="16" y2="40" stroke={C} strokeWidth={W} {...lp}/>
    <line x1="30" y1="30" x2="44" y2="40" stroke={C} strokeWidth={W} {...lp}/>
    <line x1="16" y1="40" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="y2" values="26;58;26" dur="1.6s" repeatCount="indefinite"/>
    </line>
    <line x1="44" y1="40" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="y2" values="26;58;26" dur="1.6s" repeatCount="indefinite"/>
    </line>
  </svg>
);

const Squat = () => (
  <svg viewBox="0 0 60 90" fill="none">
    <style>{`@keyframes sq-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(12px)}} .sq-b{animation:sq-b 2s ease-in-out infinite}`}</style>
    <line x1="4" y1="86" x2="56" y2="86" stroke={EQ} strokeWidth="2"/>
    <ellipse cx="21" cy="86" rx="5" ry="2" fill={EQ}/>
    <ellipse cx="39" cy="86" rx="5" ry="2" fill={EQ}/>
    <g className="sq-b">
      <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
      <line x1="30" y1="19" x2="30" y2="44" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="28" x2="10" y2="34" stroke={C} strokeWidth={W} {...lp}/>
      <line x1="30" y1="28" x2="50" y2="34" stroke={C} strokeWidth={W} {...lp}/>
      <line x1="30" y1="44" stroke={G} strokeWidth={W} {...lp}>
        <animate attributeName="x2" values="16;8;16" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="62;66;62" dur="2s" repeatCount="indefinite"/>
      </line>
      <line x1="30" y1="44" stroke={G} strokeWidth={W} {...lp}>
        <animate attributeName="x2" values="44;52;44" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="62;66;62" dur="2s" repeatCount="indefinite"/>
      </line>
    </g>
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="21;21;21" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="86;86;86" dur="2s" repeatCount="indefinite"/>
    </line>
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="39;39;39" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="86;86;86" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

const Lunge = () => (
  <svg viewBox="0 0 70 88" fill="none">
    <style>{`@keyframes lg-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)}} .lg-b{animation:lg-b 2s ease-in-out infinite}`}</style>
    <line x1="0" y1="84" x2="70" y2="84" stroke={EQ} strokeWidth="2"/>
    <g className="lg-b">
      <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
      <line x1="30" y1="19" x2="30" y2="44" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="28" x2="16" y2="38" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="28" x2="44" y2="38" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="44" x2="50" y2="60" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="44" x2="14" y2="60" stroke={G} strokeWidth={W} {...lp}/>
    </g>
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="70;80;70" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="84;84;84" dur="2s" repeatCount="indefinite"/>
    </line>
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="70;80;70" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="84;84;84" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

const Calf = () => (
  <svg viewBox="0 0 60 88" fill="none">
    <style>{`@keyframes calf-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)}} .calf-b{animation:calf-b 1.8s ease-in-out infinite}`}</style>
    <line x1="4" y1="84" x2="56" y2="84" stroke={EQ} strokeWidth="2"/>
    <ellipse cx="30" cy="84" rx="8" ry="2.5" fill={EQ}/>
    <g className="calf-b">
      <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
      <line x1="30" y1="19" x2="30" y2="44" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="28" x2="16" y2="40" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="28" x2="44" y2="40" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="44" x2="24" y2="64" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="30" y1="44" x2="36" y2="64" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="24" y1="64" x2="28" y2="76" stroke={C} strokeWidth={W} {...lp}/>
      <line x1="36" y1="64" x2="32" y2="76" stroke={C} strokeWidth={W} {...lp}/>
    </g>
  </svg>
);

const BackExt = () => (
  <svg viewBox="0 0 80 64" fill="none">
    <rect x="28" y="38" width="44" height="5" rx="2" fill={EQ}/>
    <rect x="52" y="43" width="4" height="14" rx="2" fill={EQ}/>
    <rect x="60" y="43" width="4" height="14" rx="2" fill={EQ}/>
    <rect x="24" y="36" width="8" height="8" rx="3" fill={EQ}/>
    <line x1="28" y1="40" x2="72" y2="40" stroke={G} strokeWidth={W} {...lp}/>
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="6;4;6" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="56;36;56" dur="2s" repeatCount="indefinite"/>
    </line>
    <circle r="6" stroke={C} strokeWidth="2">
      <animate attributeName="cx" values="4;2;4" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="48;30;48" dur="2s" repeatCount="indefinite"/>
    </circle>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="54;36;54" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="58;28;58" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

const Hollow = () => (
  <svg viewBox="0 0 80 48" fill="none">
    <line x1="0" y1="44" x2="80" y2="44" stroke={EQ} strokeWidth="2"/>
    <line x1="14" y1="36" x2="56" y2="36" stroke={G} strokeWidth={W} {...lp}/>
    <circle cx="8" cy="32" r="6" stroke={C} strokeWidth="2"/>
    <line x1="14" y1="34" stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="y2" values="22;20;22" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x1="56" y1="36" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y2" values="26;22;26" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x1="56" y1="36" stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="70;72;70" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="26;22;26" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

const Pullover = () => (
  <svg viewBox="0 0 60 90" fill="none">
    <circle cx="30" cy="12" r="7" stroke={C} strokeWidth="2"/>
    <line x1="30" y1="19" x2="30" y2="48" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="22" y2="70" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="22" y1="70" x2="20" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="30" y1="48" x2="38" y2="70" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="70" x2="40" y2="84" stroke={G} strokeWidth={W} {...lp}/>
    <circle cx="30" cy="4" r="3" fill={EQ}/>
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

const InclinePress = () => (
  <svg viewBox="0 0 80 64" fill="none">
    <rect x="8" y="46" width="56" height="5" rx="2" fill={EQ}/>
    <rect x="12" y="30" width="5" height="18" rx="2" fill={EQ}/>
    <rect x="14" y="51" width="4" height="10" rx="2" fill={EQ}/>
    <rect x="58" y="51" width="4" height="10" rx="2" fill={EQ}/>
    <circle cx="14" cy="22" r="6" stroke={C} strokeWidth="2"/>
    <line x1="16" y1="28" x2="62" y2="46" stroke={G} strokeWidth={W} {...lp}/>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="18;16;18" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="48;22;48" dur="2s" repeatCount="indefinite"/>
    </line>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="36;34;36" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="52;26;52" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

const RearDelt = () => (
  <svg viewBox="0 0 60 80" fill="none">
    <circle cx="14" cy="34" r="6" stroke={C} strokeWidth="2"/>
    <line x1="14" y1="40" x2="32" y2="28" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="32" y1="28" x2="38" y2="44" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="44" x2="34" y2="64" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="34" y1="64" x2="32" y2="76" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="38" y1="44" x2="44" y2="64" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="44" y1="64" x2="46" y2="76" stroke={G} strokeWidth={W} {...lp}/>
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

const HipThrust = () => (
  <svg viewBox="0 0 80 56" fill="none">
    <line x1="0" y1="52" x2="80" y2="52" stroke={EQ} strokeWidth="2"/>
    <rect x="4" y="28" width="18" height="5" rx="2" fill={EQ}/>
    <rect x="6" y="33" width="4" height="14" rx="2" fill={EQ}/>
    <rect x="14" y="33" width="4" height="14" rx="2" fill={EQ}/>
    <circle cx="14" cy="22" r="6" stroke={C} strokeWidth="2"/>
    <line x1="14" y1="28" x2="32" y2="30" stroke={G} strokeWidth={W} {...lp}/>
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="30;22;30" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="38;28;38" dur="2s" repeatCount="indefinite"/>
    </line>
    <line x1="50" y1="44" x2="60" y2="52" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="54" y1="44" x2="64" y2="52" stroke={G} strokeWidth={W} {...lp}/>
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="y1" values="38;28;38" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="44;44;44" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

const Crunch = () => (
  <svg viewBox="0 0 80 52" fill="none">
    <line x1="0" y1="48" x2="80" y2="48" stroke={EQ} strokeWidth="2"/>
    <line x1="42" y1="34" x2="56" y2="46" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="50" y1="34" x2="64" y2="46" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="28" y1="36" x2="42" y2="34" stroke={G} strokeWidth={W} {...lp}/>
    <line x1="28" y1="38" x2="50" y2="34" stroke={G} strokeWidth={W} {...lp}/>
    <line stroke={G} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="6;10;6" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="38;30;38" dur="2s" repeatCount="indefinite"/>
    </line>
    <circle r="6" stroke={C} strokeWidth="2">
      <animate attributeName="cx" values="6;10;6" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="30;24;30" dur="2s" repeatCount="indefinite"/>
    </circle>
    <line stroke={C} strokeWidth={W} {...lp}>
      <animate attributeName="x2" values="14;18;14" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="22;16;22" dur="2s" repeatCount="indefinite"/>
    </line>
  </svg>
);

const Plank = () => (
  <svg viewBox="0 0 80 48" fill="none">
    <style>{`@keyframes plank-b { 0%,100%{opacity:1} 50%{opacity:0.5}} .plank-b{animation:plank-b 2.5s ease-in-out infinite}`}</style>
    <line x1="0" y1="44" x2="80" y2="44" stroke={EQ} strokeWidth="2"/>
    <g className="plank-b">
      <circle cx="10" cy="22" r="6" stroke={C} strokeWidth="2"/>
      <line x1="10" y1="28" x2="60" y2="36" stroke={G} strokeWidth={W} {...lp}/>
      <line x1="20" y1="32" x2="16" y2="44" stroke={C} strokeWidth={W} {...lp}/>
      <line x1="36" y1="35" x2="32" y2="44" stroke={C} strokeWidth={W} {...lp}/>
      <ellipse cx="60" cy="42" rx="5" ry="2.5" fill={G}/>
    </g>
  </svg>
);

const AMIM_COMPONENTS: Record<string, React.FC> = {
  pullup: PullUp, row: Row, curl: Curl, dip: Dip, pushup: PushUp,
  fly: Fly, lateral: Lateral, pushdown: PushDown, squat: Squat,
  lunge: Lunge, calf: Calf, backext: BackExt, hollow: Hollow,
  pullover: Pullover, inclinepress: InclinePress, reardelt: RearDelt,
  hipthrust: HipThrust, crunch: Crunch, plank: Plank,
};

interface Props { exerciseId: string; size?: number; }

export const ExerciseAnimation: React.FC<Props> = ({ exerciseId, size = 60 }) => {
  const type = EXERCISE_ANIM_MAP[exerciseId];
  const Comp = type ? AMIM_COMPONENTS[type] : null;
  if (!Comp) return null;
  return (
    <div style={{
      width: size, height: size, borderRadius: 12,
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
