import React, { useState } from 'react';

// ── Design tokens: Warm Editorial direction ─────────────────────────────────
// Original MOVES: electric hot-pink (#FF4B6E) + orange on near-black cold void.
// This variation: amber gold + plum on candlelit dark brown.
// Emotional register shifts from "nightclub launch sequence" → "neighborhood journal,
// printed on warm stock, found in a West Village coffee shop."
const C = {
  bg: '#1C1710',
  card: '#26201A',
  cardAlt: '#2C2519',
  border: '#3D3125',
  primary: '#D4A853',       // amber gold
  primaryFg: '#1C1710',     // dark on amber
  accent: '#8B6BAE',        // muted plum
  accentFg: '#F5EFF8',
  fg: '#F2E8D4',            // warm parchment
  fgMuted: '#8C7D69',       // warm grey-tan
  fgSubtle: '#574D41',      // very subtle
  chip: '#302619',
  chipActive: '#D4A853',
};

const VIBES = [
  'Dinner & Drinks', 'Date Night', 'Museum Day', 'Brunch Run',
  'Night Out', 'Foodie Crawl', 'Cultural Day', 'Low-Key Vibes',
];

const DATE_OPTIONS = ['Today', 'Tomorrow', 'Saturday', 'Sunday', 'Monday'];
const BUDGET = ['$', '$$', '$$$', '$$$$'];
const HOODS = ['West Village', 'Williamsburg', 'SoHo', 'Greenpoint', 'LES', 'Park Slope'];

export default function WarmEditorial() {
  const [vibe, setVibe] = useState('Dinner & Drinks');
  const [date, setDate] = useState('Tonight');
  const [party, setParty] = useState(2);
  const [budget, setBudget] = useState(['$$']);
  const [hoods, setHoods] = useState<string[]>([]);

  const toggleBudget = (b: string) =>
    setBudget(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  const toggleHood = (h: string) =>
    setHoods(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        background: C.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
        overflowY: 'auto',
        color: C.fg,
      }}
    >
      {/* Status bar shimmer */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.fgMuted }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <rect x="0" y="4" width="3" height="8" rx="1" fill={C.fgMuted} />
            <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill={C.fgMuted} />
            <rect x="9" y="0.5" width="3" height="11.5" rx="1" fill={C.fgMuted} />
            <rect x="13.5" y="0" width="2.5" height="12" rx="1" fill={C.fg} />
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M8 2.5C10.2 2.5 12.2 3.4 13.6 4.9L15 3.5C13.2 1.7 10.7 0.5 8 0.5C5.3 0.5 2.8 1.7 1 3.5L2.4 4.9C3.8 3.4 5.8 2.5 8 2.5Z" fill={C.fg} />
            <path d="M8 6C9.3 6 10.5 6.5 11.4 7.3L12.8 5.9C11.5 4.7 9.8 4 8 4C6.2 4 4.5 4.7 3.2 5.9L4.6 7.3C5.5 6.5 6.7 6 8 6Z" fill={C.fg} />
            <circle cx="8" cy="10" r="1.5" fill={C.fg} />
          </svg>
          <div style={{ width: 25, height: 12, borderRadius: 3, border: `1px solid ${C.fgMuted}`, display: 'flex', alignItems: 'center', padding: '0 2px' }}>
            <div style={{ width: '75%', height: 7, borderRadius: 2, background: C.fg }} />
          </div>
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ padding: '8px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Avatar — warm amber ring instead of cold blue */}
        <div style={{
          width: 36, height: 36, borderRadius: 18,
          background: C.primary + '22',
          border: `1.5px solid ${C.primary}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: C.primary, fontSize: 14, fontWeight: 700 }}>D</span>
        </div>

        {/* Logo — different typographic treatment: lighter weight + tracked spacing */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{
            color: C.primary,
            fontSize: 17,
            fontWeight: 300,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
          }}>
            MOVES
          </span>
        </div>

        {/* Mode toggle — pill with softer styling */}
        <div style={{
          display: 'flex',
          background: C.card,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
          padding: 2,
          flexShrink: 0,
        }}>
          {['Form', 'Chat'].map(m => (
            <div key={m} style={{
              padding: '5px 12px',
              borderRadius: 16,
              background: m === 'Form' ? C.cardAlt : 'transparent',
              fontSize: 12,
              fontWeight: m === 'Form' ? 600 : 400,
              color: m === 'Form' ? C.fg : C.fgMuted,
              cursor: 'pointer',
            }}>{m}</div>
          ))}
        </div>
      </div>

      {/* ── Thin amber divider ── */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.primary}40, transparent)`, margin: '0 20px' }} />

      <div style={{ padding: '0 20px', paddingBottom: 100 }}>

        {/* ── VIBE ── */}
        <Section label="VIBE">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {VIBES.map(v => {
              const active = vibe === v;
              return (
                <button key={v} onClick={() => setVibe(v)} style={{
                  padding: '9px 16px',
                  borderRadius: 100,
                  border: `1px solid ${active ? C.primary : C.border}`,
                  background: active ? C.primary : C.chip,
                  color: active ? C.primaryFg : C.fg,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  // Warm editorial touch: active chips look like a wax seal stamp
                  boxShadow: active ? `0 2px 8px ${C.primary}55` : 'none',
                }}>
                  {v}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── DATE ── */}
        <Section label="DATE">
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {DATE_OPTIONS.map(d => {
              const active = date === d;
              return (
                <button key={d} onClick={() => setDate(d)} style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: `1px solid ${active ? C.primary : C.border}`,
                  background: active ? C.primary + '18' : C.card,
                  color: active ? C.primary : C.fg,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {d}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── TIME ── */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Section label="STARTS">
              <DropdownMock value="7:00 PM" />
            </Section>
          </div>
          <div style={{ flex: 1 }}>
            <Section label="ENDS">
              <DropdownMock value="10:00 PM" accent={C.accent} />
            </Section>
          </div>
        </div>

        {/* ── PARTY SIZE ── */}
        <Section label="PEOPLE">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: 'hidden',
            width: 'fit-content',
          }}>
            <button onClick={() => setParty(p => Math.max(1, p - 1))} style={{
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: party > 1 ? C.fg : C.fgSubtle, fontSize: 20,
            }}>−</button>
            <div style={{
              width: 52, textAlign: 'center',
              fontSize: 18, fontWeight: 700, color: C.fg,
              borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
              lineHeight: '44px',
            }}>{party}</div>
            <button onClick={() => setParty(p => Math.min(12, p + 1))} style={{
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: party < 12 ? C.fg : C.fgSubtle, fontSize: 20,
            }}>+</button>
          </div>
        </Section>

        {/* ── BUDGET ── */}
        <Section label="BUDGET" hint="pick one or more">
          <div style={{ display: 'flex', gap: 8 }}>
            {BUDGET.map(b => {
              const active = budget.includes(b);
              return (
                <button key={b} onClick={() => toggleBudget(b)} style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  border: `1px solid ${active ? C.accent : C.border}`,
                  background: active ? C.accent + '22' : C.card,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  boxShadow: active ? `0 2px 8px ${C.accent}33` : 'none',
                }}>
                  <span style={{ color: active ? C.accent : C.fg, fontSize: 14, fontWeight: active ? 700 : 400 }}>{b}</span>
                  <span style={{ color: active ? C.accent + 'CC' : C.fgMuted, fontSize: 10, fontWeight: 400 }}>
                    {['Cheap', 'Moderate', 'Upscale', 'Splurge'][BUDGET.indexOf(b)]}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── NEIGHBORHOODS ── */}
        <Section label="NEIGHBORHOODS" hint="optional">
          {/* Selected tags */}
          {hoods.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {hoods.map(h => (
                <button key={h} onClick={() => toggleHood(h)} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 10px 5px 12px',
                  borderRadius: 100,
                  background: C.primary,
                  border: 'none',
                  color: C.primaryFg,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  {h} <span style={{ opacity: 0.7, fontSize: 14 }}>×</span>
                </button>
              ))}
            </div>
          )}

          {/* Search input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
            padding: '10px 14px', marginBottom: 10,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke={C.fgMuted} strokeWidth="1.5" />
              <path d="M10 10L12.5 12.5" stroke={C.fgMuted} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ color: C.fgMuted, fontSize: 13 }}>Search neighborhoods…</span>
          </div>

          {/* Suggestion chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {HOODS.filter(h => !hoods.includes(h)).map(h => (
              <button key={h} onClick={() => toggleHood(h)} style={{
                padding: '6px 12px', borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.chip,
                color: C.fg, fontSize: 12, fontWeight: 400, cursor: 'pointer',
              }}>
                {h}
              </button>
            ))}
          </div>
        </Section>

        {/* ── Group planning ── */}
        <Section label="GROUP" hint="optional">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: C.card, borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: '13px 14px',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: C.cardAlt,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <circle cx="8" cy="7" r="3" stroke={C.fgMuted} strokeWidth="1.5" />
                <circle cx="14" cy="9" r="2.5" stroke={C.fgMuted} strokeWidth="1.5" />
                <path d="M2 17c0-3 2.7-5 6-5s6 2 6 5" stroke={C.fgMuted} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 14.5c1.5 0 4 1 4 3" stroke={C.fgMuted} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.fg, fontSize: 13, fontWeight: 500 }}>Plan with a group</div>
              <div style={{ color: C.fgMuted, fontSize: 11, marginTop: 2 }}>Use places saved by your crew too</div>
            </div>
            {/* Toggle circle */}
            <div style={{
              width: 22, height: 22, borderRadius: 11,
              border: `1.5px solid ${C.border}`,
              background: 'transparent',
            }} />
          </div>
        </Section>
      </div>

      {/* ── CTA Button — floated at bottom ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '16px 20px 32px',
        background: `linear-gradient(to top, ${C.bg} 70%, transparent)`,
      }}>
        <button style={{
          width: '100%',
          padding: '16px 0',
          borderRadius: 14,
          border: 'none',
          background: `linear-gradient(135deg, ${C.primary}, #B8872E)`,
          color: C.primaryFg,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          // Warm glow instead of cold blue drop shadow
          boxShadow: `0 4px 24px ${C.primary}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span>Let's Move</span>
          {/* Subtle forward arrow */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke={C.primaryFg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        {/* Section labels: tracked, spaced, editorial weight */}
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#8C7D69',
          // Warm editorial touch: thin amber underline under label
          borderBottom: '1px solid #3D3125',
          paddingBottom: 3,
        }}>
          {label}
        </span>
        {hint && (
          <span style={{ fontSize: 10, color: '#574D41', fontWeight: 400 }}>· {hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function DropdownMock({ value, accent }: { value: string; accent?: string }) {
  const borderCol = accent ? accent + '66' : '#3D3125';
  const textCol = accent ? accent : '#F2E8D4';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#26201A', border: `1px solid ${borderCol}`,
      borderRadius: 12, padding: '11px 14px',
      cursor: 'pointer',
    }}>
      <span style={{ color: textCol, fontSize: 14, fontWeight: accent ? 600 : 400 }}>{value}</span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 4.5L6 8.5L10 4.5" stroke={textCol} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
