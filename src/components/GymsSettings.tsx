import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { CATALOG_EQUIPMENT, type Equipment } from '../data/exercisesCatalog';
import type { Gym } from '../utils/gymAdapt';

// ─── Réglages → Mes salles ─────────────────────────────────────────────────
// Une salle = le matériel qu'on y trouve. Tout est facultatif : une salle sans
// rien de renseigné se comporte exactement comme avant (aucune substitution,
// pas d'aide au chargement). C'est ce qui permet d'ajouter la salle de
// vacances en 10 secondes sans avoir à tout décrire.

const PLATE_CHOICES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];
const INCREMENTS = [1, 1.25, 2, 2.5, 5];

export const GymsSettings: React.FC = () => {
  const gyms = useWorkoutStore((s) => s.gyms);
  const activeGymId = useWorkoutStore((s) => s.activeGymId);
  const addGym = useWorkoutStore((s) => s.addGym);
  const updateGym = useWorkoutStore((s) => s.updateGym);
  const removeGym = useWorkoutStore((s) => s.removeGym);
  const duplicateGym = useWorkoutStore((s) => s.duplicateGym);
  const setActiveGym = useWorkoutStore((s) => s.setActiveGym);
  const plateHelperEnabled = useWorkoutStore((s) => s.plateHelperEnabled);
  const setPlateHelperEnabled = useWorkoutStore((s) => s.setPlateHelperEnabled);

  const [openId, setOpenId] = useState<string | null>(null);
  const [machineDrafts, setMachineDrafts] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const ajouterSalle = () => {
    const id = addGym('Nouvelle salle');
    setOpenId(id);
  };

  const ajouterMachine = (gym: Gym) => {
    const nom = (machineDrafts[gym.id] ?? '').trim();
    if (!nom) return;
    const machines = gym.machines ?? [];
    if (!machines.some((m) => m.toLowerCase() === nom.toLowerCase())) {
      updateGym(gym.id, { machines: [...machines, nom] });
    }
    setMachineDrafts((d) => ({ ...d, [gym.id]: '' }));
  };

  return (
    <div>
      <p style={intro}>
        Chaque salle a son matériel. Quand tu démarres une séance, l'appli te demande où tu es
        (seulement à partir de deux salles) et te prévient si un exercice n'y est pas faisable.
        Tout est facultatif : une salle sans rien de renseigné ne change rien.
      </p>

      {gyms.map((gym) => {
        const ouverte = openId === gym.id;
        const active = gym.id === activeGymId;
        const machines = gym.machines ?? [];
        return (
          <div key={gym.id} style={{ ...carte, borderColor: active ? 'rgba(var(--brand-1-rgb),0.4)' : 'var(--border)' }}>
            <button onClick={() => setOpenId(ouverte ? null : gym.id)} style={enTete}>
              <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <span style={nomSalle}>{gym.name}</span>
                <span style={resume}>
                  {gym.plates.length > 0 ? `${gym.plates.length} tailles de disques` : 'disques non renseignés'}
                  {' · '}{gym.availableEquipment.length} types de matériel
                  {machines.length > 0 ? ` · ${machines.length} machines` : ''}
                </span>
              </span>
              {active && <span style={badgeActive}>habituelle</span>}
              <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{ouverte ? '▾' : '▸'}</span>
            </button>

            {ouverte && (
              <div style={{ padding: '4px 2px 2px' }}>
                <p style={label}>NOM</p>
                <input
                  value={gym.name}
                  onChange={(e) => updateGym(gym.id, { name: e.target.value })}
                  placeholder="Basic-Fit République, salle de l'hôtel…"
                  style={champ}
                />

                <p style={label}>BARRES</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {([['barKg', 'Olympique'], ['ezBarKg', 'Barre EZ']] as const).map(([cle, titre]) => (
                    <div key={cle} style={champBloc}>
                      <p style={champLabel}>{titre}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={String(gym[cle])}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value.replace(',', '.'));
                            if (!isNaN(v) && v > 0) updateGym(gym.id, { [cle]: v } as Partial<Gym>);
                          }}
                          style={{ ...champ, marginBottom: 0 }}
                        />
                        <span style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 700 }}>kg</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p style={label}>DISQUES DISPONIBLES (PAR PAIRE)</p>
                <div style={puces}>
                  {PLATE_CHOICES.map((disque) => {
                    const on = gym.plates.includes(disque);
                    return (
                      <button
                        key={disque}
                        onClick={() => updateGym(gym.id, {
                          plates: on ? gym.plates.filter((v) => v !== disque) : [...gym.plates, disque],
                        })}
                        style={puce(on)}
                      >
                        {String(disque).replace('.', ',')} kg
                      </button>
                    );
                  })}
                </div>

                <p style={label}>PLUS PETIT ÉCART AILLEURS (HALTÈRES, MACHINES)</p>
                <div style={puces}>
                  {INCREMENTS.map((inc) => (
                    <button
                      key={inc}
                      onClick={() => updateGym(gym.id, { otherIncrementKg: inc })}
                      style={puce(gym.otherIncrementKg === inc)}
                    >
                      {String(inc).replace('.', ',')} kg
                    </button>
                  ))}
                </div>

                <p style={label}>MATÉRIEL PRÉSENT</p>
                <p style={aide}>
                  Ce qui n'est pas coché fera proposer un remplacement au démarrage d'une séance.
                </p>
                <div style={puces}>
                  {CATALOG_EQUIPMENT.filter((eq) => eq !== 'Autre').map((eq: Equipment) => {
                    const on = gym.availableEquipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        onClick={() => updateGym(gym.id, {
                          availableEquipment: on
                            ? gym.availableEquipment.filter((e) => e !== eq)
                            : [...gym.availableEquipment, eq],
                        })}
                        style={puce(on)}
                      >
                        {eq}
                      </button>
                    );
                  })}
                </div>

                <p style={label}>MACHINES DE CETTE SALLE</p>
                <p style={aide}>
                  Presse à cuisses, pec-deck, tirage vertical… Tant que tu n'as pas coché « ma liste
                  est complète », ça reste une simple note et l'appli ne remplace rien à cause de ça.
                </p>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input
                    value={machineDrafts[gym.id] ?? ''}
                    onChange={(e) => setMachineDrafts((d) => ({ ...d, [gym.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterMachine(gym); } }}
                    placeholder="Ajouter une machine"
                    style={{ ...champ, marginBottom: 0, flex: 1 }}
                  />
                  <button onClick={() => ajouterMachine(gym)} style={boutonAjout}>Ajouter</button>
                </div>
                {machines.length > 0 && (
                  <div style={puces}>
                    {machines.map((m) => (
                      <span key={m} style={puceMachine}>
                        {m}
                        <button
                          onClick={() => updateGym(gym.id, { machines: machines.filter((x) => x !== m) })}
                          style={croix}
                          aria-label={`Retirer ${m}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => updateGym(gym.id, { machinesListComplete: !gym.machinesListComplete })}
                  style={ligneToggle(!!gym.machinesListComplete)}
                >
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    <span style={toggleTitre}>Ma liste de machines est complète</span>
                    <span style={toggleAide}>
                      Si c'est coché, un exercice qui demande une machine absente de la liste sera remplacé.
                    </span>
                  </span>
                  <span style={interrupteur(!!gym.machinesListComplete)}>
                    <span style={pastille(!!gym.machinesListComplete)} />
                  </span>
                </button>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                  {!active && (
                    <button onClick={() => setActiveGym(gym.id)} style={actionBtn}>
                      Définir comme salle habituelle
                    </button>
                  )}
                  <button onClick={() => { const id = duplicateGym(gym.id); if (id) setOpenId(id); }} style={actionBtn}>
                    Dupliquer
                  </button>
                  {gyms.length > 1 && (
                    confirmDelete === gym.id ? (
                      <>
                        <button
                          onClick={() => { removeGym(gym.id); setConfirmDelete(null); setOpenId(null); }}
                          style={{ ...actionBtn, color: '#fff', background: '#b83030', borderColor: '#b83030' }}
                        >
                          Confirmer la suppression
                        </button>
                        <button onClick={() => setConfirmDelete(null)} style={actionBtn}>Annuler</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDelete(gym.id)} style={{ ...actionBtn, color: '#c04a4a' }}>
                        Supprimer
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button onClick={ajouterSalle} style={boutonAjouterSalle}>＋ Ajouter une salle</button>

      <button onClick={() => setPlateHelperEnabled(!plateHelperEnabled)} style={ligneToggle(plateHelperEnabled)}>
        <span style={{ flex: 1, textAlign: 'left' }}>
          <span style={toggleTitre}>Aide au chargement</span>
          <span style={toggleAide}>
            Affiche « par côté : 20 + 10 » sous la série en cours, sur les exercices à la barre.
          </span>
        </span>
        <span style={interrupteur(plateHelperEnabled)}>
          <span style={pastille(plateHelperEnabled)} />
        </span>
      </button>
    </div>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────

const intro: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 11, marginBottom: 12, lineHeight: '15px',
};
const carte: React.CSSProperties = {
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 16, padding: '4px 12px 8px', marginBottom: 8,
};
const enTete: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
  background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px 0',
};
const nomSalle: React.CSSProperties = {
  display: 'block', color: 'var(--text-primary)', fontSize: 14, fontWeight: 700,
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};
const resume: React.CSSProperties = {
  display: 'block', color: 'var(--text-dim)', fontSize: 10.5, marginTop: 2,
};
const badgeActive: React.CSSProperties = {
  flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
  color: 'var(--brand-1)', background: 'rgba(var(--brand-1-rgb),0.12)',
  border: '1px solid rgba(var(--brand-1-rgb),0.35)', borderRadius: 8, padding: '4px 7px',
};
const label: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: 1.2, margin: '12px 0 6px',
};
const aide: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 10.5, lineHeight: '14px', marginBottom: 8,
};
const champ: React.CSSProperties = {
  width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-strong)',
  borderRadius: 10, padding: '9px 11px', color: 'var(--text-primary)',
  fontSize: 13, fontWeight: 600, marginBottom: 4,
};
const champBloc: React.CSSProperties = { flex: 1, minWidth: 0 };
const champLabel: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, marginBottom: 5,
};
const puces: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 };
const puce = (on: boolean): React.CSSProperties => ({
  padding: '7px 11px', borderRadius: 11, fontSize: 12, fontWeight: 700, cursor: 'pointer',
  background: on ? 'rgba(var(--brand-1-rgb),0.16)' : 'var(--bg-base)',
  border: `1px solid ${on ? 'rgba(var(--brand-1-rgb),0.45)' : 'var(--border-strong)'}`,
  color: on ? 'var(--brand-1)' : 'var(--text-muted)',
});
const puceMachine: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 6px 6px 11px', borderRadius: 11, fontSize: 12, fontWeight: 600,
  background: 'var(--bg-base)', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)',
};
const croix: React.CSSProperties = {
  width: 18, height: 18, borderRadius: 6, border: 'none', cursor: 'pointer',
  background: 'var(--bg-higher)', color: 'var(--text-dim)', fontSize: 9,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const boutonAjout: React.CSSProperties = {
  flexShrink: 0, padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
  background: 'var(--bg-higher)', border: '1px solid var(--border-strong)',
  color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700,
};
const boutonAjouterSalle: React.CSSProperties = {
  width: '100%', padding: '12px', borderRadius: 14, cursor: 'pointer', marginBottom: 12,
  background: 'transparent', border: '1px dashed var(--border-strong)',
  color: 'var(--brand-1)', fontSize: 13, fontWeight: 700,
};
const actionBtn: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
  background: 'var(--bg-base)', border: '1px solid var(--border-strong)',
  color: 'var(--text-muted)', fontSize: 11.5, fontWeight: 700,
};
const ligneToggle = (on: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 12, width: '100%', marginTop: 10,
  padding: '11px 13px', borderRadius: 14, cursor: 'pointer',
  background: on ? 'rgba(var(--brand-1-rgb),0.1)' : 'var(--bg-elevated)',
  border: `1px solid ${on ? 'rgba(var(--brand-1-rgb),0.35)' : 'var(--border)'}`,
});
const toggleTitre: React.CSSProperties = {
  display: 'block', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700,
};
const toggleAide: React.CSSProperties = {
  display: 'block', color: 'var(--text-dim)', fontSize: 10.5, marginTop: 2, lineHeight: '14px',
};
const interrupteur = (on: boolean): React.CSSProperties => ({
  width: 44, height: 26, borderRadius: 13, flexShrink: 0, position: 'relative',
  background: on ? 'var(--brand-1)' : 'var(--bg-higher)',
  border: '1px solid var(--border-strong)', transition: 'background 0.2s',
});
const pastille = (on: boolean): React.CSSProperties => ({
  position: 'absolute', top: 2, left: on ? 20 : 2,
  width: 20, height: 20, borderRadius: 10, background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.35)', transition: 'left 0.2s cubic-bezier(0.34, 1.4, 0.64, 1)',
});
