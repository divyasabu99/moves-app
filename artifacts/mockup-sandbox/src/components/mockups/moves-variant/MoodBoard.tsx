import React, { useState } from 'react';

// ── Design hypothesis ────────────────────────────────────────────────────────
// Current model: fill a form (vibe + date + time + people + budget + neighborhoods).
// This hypothesis: you know what kind of night you want when you *see* it, not
// when you describe it. So: browse 6 atmospheric scene cards, tap one, then
// confirm 3 quick logistics below. The planning path becomes:
//   Browse visuals → tap vibe → confirm logistics → generate
// vs the current form model:
//   Fill 6+ fields → press generate
//
// Information architecture is fundamentally different:
// - Primary axis: visual recognition, not verbal recall
// - Logistics collapse to 3 inline controls instead of 6 form sections
// - No scrolling until after you choose a vibe; the choice is the dominant act
// ────────────────────────────────────────────────────────────────────────────

const BG = '#0F0D0A';
const FG = '#F0EAD8';
const MUTED = '#7A6E60';
const BORDER = '#2C2518';
const PRIMARY = '#D4A853';    // amber gold
const PRIMARY_FG = '#0F0D0A';
const ACCENT = '#8B6BAE';     // muted plum

// Each vibe card: gradient simulates the atmospheric photo
const VIBES = [
  {
    id: 'dinner',
    label: 'Dinner & Drinks',
    sub: 'Restaurant → cocktail bar',
    icon: '🕯️',
    grad: 'linear-gradient(145deg, #2A1A0F 0%, #4A2C15 50%, #1F120A 100%)',
    glow: '#C4703C',
  },
  {
    id: 'date',
    label: 'Date Night',
    sub: 'Intimate, romantic',
    icon: '✦',
    grad: 'linear-gradient(145deg, #1A0F20 0%, #3D1F4A 50%, #140A1A 100%)',
    glow: '#8B6BAE',
  },
  {
    id: 'night-out',
    label: 'Night Out',
    sub: 'Bar crawl, dancing',
    icon: '◈',
    grad: 'linear-gradient(145deg, #0A0D1F 0%, #1A2040 50%, #080A18 100%)',
    glow: '#4F7FFF',
  },
  {
    id: 'brunch',
    label: 'Brunch Run',
    sub: 'Morning through afternoon',
    icon: '☀',
    grad: 'linear-gradient(145deg, #1F1A0A 0%, #3D3410 50%, #181508 100%)',
    glow: '#D4A853',
  },
  {
    id: 'foodie',
    label: 'Foodie Crawl',
    sub: 'Neighborhood spot-hopping',
    icon: '◉',
    grad: 'linear-gradient(145deg, #0F1A0A 0%, #1E3515 50%, #0A1208 100%)',
    glow: '#5BA058',
  },
  {
    id: 'low-key',
    label: 'Low-Key Vibes',
    sub: 'Easy evening, no rush',
    icon: '∿',
    grad: 'linear-gradient(145deg, #141414 0%, #252525 50%, #101010 100%)',
    glow: '#8A8A8A',
  },
] as const;

type VibeId = typeof VIBES[number]['id'];

const DATES = ['Tonight', 'Tomorrow', 'Sat', 'Sun'];
const BUDGETS = ['$', '$$', '$$$'];
const NEIGHBORHOODS = ['Any', 'West Village', 'Williamsburg', 'SoHo', 'LES', 'Greenpoint'];

export default function MoodBoard() {
  const [chosen, setChosen] = useState<VibeId | null>(null);
  const [date, setDate] = useState('Tonight');
  const [people, setPeople] = useState(2);
  const [budget, setBudget] = useState('$$');
  const [hood, setHood] = useState('Any');

  const chosenVibe = VIBES.find(v => v.id === chosen);
  const isReady = chosen !== null;

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: BG,
      fontFamily: "'Inter', system-ui, sans-serif",
      color: FG,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* ── Status bar ── */}
      <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>9:41</span>
        <div style={{ width: 25, height: 12, borderRadius: 3, border: `1px solid ${MUTED}`, display: 'flex', alignItems: 'center', padding: '0 2px' }}>
          <div style={{ width: '75%', height: 7, borderRadius: 2, background: FG }} />
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ padding: '4px 20px 0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 17,
          background: PRIMARY + '22', border: `1.5px solid ${PRIMARY}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ color: PRIMARY, fontSize: 13, fontWeight: 700 }}>D</span>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ color: PRIMARY, fontSize: 16, fontWeight: 300, letterSpacing: '0.35em' }}>MOVES</span>
        </div>
        <div style={{ width: 34 }} />
      </div>

      {/* ── Big question ── */}
      <div style={{ padding: '20px 20px 14px', flexShrink: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {chosen
            ? <>Tonight's move:<br /><span style={{ color: PRIMARY }}>{chosenVibe?.label}</span></>
            : <>What kind of<br />night?</>
          }
        </div>
        {!chosen && (
          <div style={{ fontSize: 12, color: MUTED, marginTop: 6, letterSpacing: '0.02em' }}>
            Tap a vibe to start planning
          </div>
        )}
        {chosen && (
          <button onClick={() => setChosen(null)} style={{
            marginTop: 6, background: 'none', border: 'none', cursor: 'pointer',
            color: MUTED, fontSize: 12, padding: 0, textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}>
            Change vibe
          </button>
        )}
      </div>

      {/* ── Vibe grid (2-col, scrollable within its zone) ── */}
      <div style={{
        flex: chosen ? '0 0 auto' : '1 1 auto',
        overflowY: chosen ? 'hidden' : 'auto',
        padding: '0 20px',
        transition: 'flex 0.3s ease',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          paddingBottom: chosen ? 0 : 16,
        }}>
          {VIBES.map(v => {
            const active = chosen === v.id;
            const dimmed = chosen !== null && !active;
            return (
              <button
                key={v.id}
                onClick={() => setChosen(v.id)}
                style={{
                  position: 'relative',
                  height: chosen ? 64 : 118,
                  borderRadius: 14,
                  border: `1.5px solid ${active ? v.glow : BORDER}`,
                  background: v.grad,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  opacity: dimmed ? 0.4 : 1,
                  transition: 'all 0.25s ease',
                  boxShadow: active ? `0 0 20px ${v.glow}55, inset 0 0 0 1px ${v.glow}44` : 'none',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                }}
              >
                {/* Atmosphere glow orb */}
                <div style={{
                  position: 'absolute',
                  top: '15%', left: '50%', transform: 'translateX(-50%)',
                  width: 50, height: 50,
                  background: `radial-gradient(circle, ${v.glow}55 0%, transparent 70%)`,
                  borderRadius: '50%',
                }} />

                {/* Icon */}
                {!chosen && (
                  <div style={{
                    position: 'absolute', top: 14, left: 14,
                    fontSize: 22, lineHeight: 1,
                    filter: `drop-shadow(0 0 8px ${v.glow})`,
                  }}>
                    {v.icon}
                  </div>
                )}

                {/* Label area */}
                <div style={{
                  padding: chosen ? '0 12px' : '0 12px 12px',
                  width: '100%',
                  height: chosen ? '100%' : 'auto',
                  display: 'flex', flexDirection: 'column', justifyContent: chosen ? 'center' : 'flex-end',
                }}>
                  <div style={{
                    fontSize: chosen ? 12 : 13,
                    fontWeight: 700,
                    color: active ? v.glow : FG,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {active && <span style={{ marginRight: 5 }}>✓</span>}
                    {v.label}
                  </div>
                  {!chosen && (
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 2, fontWeight: 400 }}>
                      {v.sub}
                    </div>
                  )}
                </div>

                {/* Noise texture overlay */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 14,
                  background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
                  backgroundSize: 'cover',
                  pointerEvents: 'none',
                  opacity: 0.5,
                }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Logistics panel — slides up after choosing ── */}
      <div style={{
        flexShrink: 0,
        padding: '0 20px',
        overflow: 'hidden',
        maxHeight: chosen ? 400 : 0,
        opacity: chosen ? 1 : 0,
        transition: 'max-height 0.35s ease, opacity 0.3s ease',
      }}>
        {/* Divider */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${PRIMARY}33, transparent)`, margin: '12px 0 16px' }} />

        {/* WHEN */}
        <LogRow label="WHEN">
          <div style={{ display: 'flex', gap: 6 }}>
            {DATES.map(d => (
              <Chip key={d} active={date === d} onClick={() => setDate(d)} accent={PRIMARY} accentFg={PRIMARY_FG}>
                {d}
              </Chip>
            ))}
          </div>
        </LogRow>

        {/* WHO */}
        <LogRow label="WHO">
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#1C1810', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', width: 'fit-content' }}>
            <StepBtn onClick={() => setPeople(p => Math.max(1, p - 1))} disabled={people <= 1}>−</StepBtn>
            <div style={{ width: 40, textAlign: 'center', fontSize: 16, fontWeight: 700, color: FG, borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, lineHeight: '40px' }}>
              {people}
            </div>
            <StepBtn onClick={() => setPeople(p => Math.min(12, p + 1))} disabled={people >= 12}>+</StepBtn>
          </div>
        </LogRow>

        {/* SPEND */}
        <LogRow label="SPEND">
          <div style={{ display: 'flex', gap: 6 }}>
            {BUDGETS.map(b => (
              <Chip key={b} active={budget === b} onClick={() => setBudget(b)} accent={ACCENT} accentFg="#fff">
                {b}
              </Chip>
            ))}
          </div>
        </LogRow>

        {/* WHERE */}
        <LogRow label="WHERE">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {NEIGHBORHOODS.map(n => (
              <Chip key={n} active={hood === n} onClick={() => setHood(n)} accent={PRIMARY} accentFg={PRIMARY_FG} small>
                {n}
              </Chip>
            ))}
          </div>
        </LogRow>
      </div>

      {/* ── CTA ── */}
      <div style={{
        flexShrink: 0,
        padding: '10px 20px',
        paddingBottom: 28,
      }}>
        <button
          disabled={!isReady}
          style={{
            width: '100%',
            padding: '15px 0',
            borderRadius: 14,
            border: 'none',
            background: isReady
              ? `linear-gradient(135deg, ${PRIMARY} 0%, #B8872E 100%)`
              : BORDER,
            color: isReady ? PRIMARY_FG : MUTED,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.04em',
            cursor: isReady ? 'pointer' : 'default',
            boxShadow: isReady ? `0 4px 24px ${PRIMARY}44` : 'none',
            transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {isReady ? (
            <>
              <span>Build the move</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke={PRIMARY_FG} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          ) : (
            <span>Pick a vibe to continue</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function LogRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
      <div style={{
        width: 52, flexShrink: 0,
        fontSize: 9, fontWeight: 600,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: MUTED, paddingTop: 10,
      }}>
        {label}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children, accent, accentFg, small }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
  accent: string; accentFg: string; small?: boolean;
}) {
  return (
    <button onClick={onClick} style={{
      padding: small ? '5px 10px' : '7px 13px',
      borderRadius: 100,
      border: `1px solid ${active ? accent : BORDER}`,
      background: active ? accent : '#1C1810',
      color: active ? accentFg : FG,
      fontSize: small ? 11 : 12,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      boxShadow: active ? `0 2px 8px ${accent}44` : 'none',
      transition: 'all 0.15s',
    }}>
      {children}
    </button>
  );
}

function StepBtn({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 40, height: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', border: 'none', cursor: disabled ? 'default' : 'pointer',
      color: disabled ? BORDER : FG, fontSize: 20, fontWeight: 300,
    }}>
      {children}
    </button>
  );
}
