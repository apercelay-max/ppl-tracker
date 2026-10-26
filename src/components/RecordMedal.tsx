import React from 'react';

interface RecordMedalProps {
  size?: number;
}

// Médaille de la bannière « Nouveau record ! ». Elle apparaît avec la bannière
// (montée à chaque record, démontée ensuite) : elle tourne sur elle-même, un
// reflet la traverse, et huit étincelles partent de son centre. Tout se joue au
// montage, en CSS pur (voir .rm-* dans index.css).
export const RecordMedal: React.FC<RecordMedalProps> = ({ size = 34 }) => (
  <span className="rm" style={{ width: size, height: size }} aria-hidden="true">
    <span className="rm-disc">
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z" />
      </svg>
      <i className="rm-shine" />
    </span>
    <span className="rm-sparks">
      {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ '--a': `${i * 45}deg` } as React.CSSProperties} />)}
    </span>
  </span>
);
