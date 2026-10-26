// Suppression « en douceur » d'une ligne de liste : elle glisse de côté, s'efface
// et se replie sur elle-même, PUIS la suppression réelle a lieu. Les lignes du
// dessous remontent donc en continu au lieu de sauter d'un coup.
//
// Cet utilitaire n'enlève rien lui-même : `done` (la vraie suppression, dans le
// store) n'est appelé qu'à la fin de l'animation. Sans animation possible (animation
// réduite, navigateur ancien), `done` part tout de suite : la suppression ne dépend
// jamais de l'animation pour avoir lieu.
const GAP = 8; // écart entre les lignes dans ces listes (gap du conteneur flex)

export function removeRow(trigger: HTMLElement, rowSelector: string, done: () => void): void {
  const row = trigger.closest<HTMLElement>(rowSelector);
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!row || reduced || typeof row.animate !== 'function') { done(); return; }

  const height = row.offsetHeight;
  row.style.overflow = 'hidden';
  row.style.pointerEvents = 'none'; // un second toucher pendant l'animation ne doit rien relancer
  let finished = false;
  const finish = () => { if (!finished) { finished = true; done(); } };
  row.animate(
    [
      { opacity: 1, transform: 'translateX(0)', height: `${height}px`, marginBottom: '0px', paddingTop: getComputedStyle(row).paddingTop, paddingBottom: getComputedStyle(row).paddingBottom, borderTopWidth: getComputedStyle(row).borderTopWidth, borderBottomWidth: getComputedStyle(row).borderBottomWidth, offset: 0 },
      { opacity: 0, transform: 'translateX(-28px)', height: `${height}px`, offset: 0.45 },
      // marginBottom négatif : annule l'écart (gap) laissé par la ligne repliée.
      { opacity: 0, transform: 'translateX(-28px)', height: '0px', marginBottom: `-${GAP}px`, paddingTop: '0px', paddingBottom: '0px', borderTopWidth: '0px', borderBottomWidth: '0px', offset: 1 },
    ],
    { duration: 420, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
  ).onfinish = finish;
  // Filet de sécurité : si l'animation n'aboutit jamais (onglet masqué), on supprime quand même.
  window.setTimeout(finish, 900);
}
