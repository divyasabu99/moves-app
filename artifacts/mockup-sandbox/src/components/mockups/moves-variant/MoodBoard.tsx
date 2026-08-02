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

// ── Warm Editorial color scale (matched from WarmEditorial.tsx) ───────────────
const BG         = '#1C1710';    // candlelit dark brown
const CARD       = '#26201A';    // elevated surface
const CARD_ALT   = '#2C2519';    // slightly lighter surface (calendar popup etc.)
const FG         = '#F2E8D4';    // warm parchment
const MUTED      = '#8C7D69';    // warm grey-tan
const FG_SUBTLE  = '#574D41';    // very subtle text
const BORDER     = '#3D3125';    // warm, more-visible border
const PRIMARY    = '#D4A853';    // amber gold — unchanged
const PRIMARY_FG = '#1C1710';    // dark on amber
const ACCENT     = '#8B6BAE';    // muted plum — unchanged

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
  {
    id: 'sports',
    label: 'Sports Day',
    sub: 'Watch party or live game',
    icon: '⚡',
    grad: 'linear-gradient(145deg, #0F1A0A 0%, #1A3010 50%, #0A1A18 100%)',
    glow: '#4CAF50',
  },
  {
    id: 'self-care',
    label: 'Self Care Day',
    sub: 'Spa, wellness, reset',
    icon: '◌',
    grad: 'linear-gradient(145deg, #1A0F18 0%, #2E1A30 50%, #140F1C 100%)',
    glow: '#E091C0',
  },
  {
    id: 'park',
    label: 'Park Day',
    sub: 'Outdoors, picnic, fresh air',
    icon: '✿',
    grad: 'linear-gradient(145deg, #0A160A 0%, #152A12 50%, #081008 100%)',
    glow: '#7BC67A',
  },
  {
    id: 'dog-day',
    label: 'Dog Day',
    sub: 'Dog-friendly spots & parks',
    icon: '◎',
    grad: 'linear-gradient(145deg, #1A1408 0%, #332A10 50%, #141008 100%)',
    glow: '#D4A853',
  },
] as const;

type VibeId = typeof VIBES[number]['id'];

const BUDGETS = ['$', '$$', '$$$'];
const NEIGHBORHOODS = ['West Village', 'Williamsburg', 'SoHo', 'LES', 'Greenpoint', 'Astoria'];

const TIME_SLOTS = [
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
  '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:00 PM',
  '12:00 AM','1:00 AM','2:00 AM',
];

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function MoodBoard() {
  const [chosen, setChosen] = useState<VibeId | null>(null);
  const today = new Date();
  const [calOpen, setCalOpen] = useState(false);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calDay, setCalDay] = useState<number | null>(today.getDate());
  const [startTime, setStartTime] = useState('7:00 PM');
  const [endTime, setEndTime] = useState('10:00 PM');
  const [people, setPeople] = useState(2);
  const [budget, setBudget] = useState('$$');
  const [hood, setHood] = useState('');
  const [hoodInput, setHoodInput] = useState('');
  const [hoodFocused, setHoodFocused] = useState(false);

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

        {/* Chat — always visible */}
        <button style={{
          width: 34, height: 34, borderRadius: 17, flexShrink: 0,
          background: '#26201A', border: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C5.58 2 2 5.13 2 9c0 1.9.8 3.63 2.1 4.9L3 17l3.4-1.1C7.5 16.6 8.72 17 10 17c4.42 0 8-3.13 8-7s-3.58-7-8-7z"
              stroke={MUTED} strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
            <circle cx="7" cy="9" r="0.9" fill={MUTED}/>
            <circle cx="10" cy="9" r="0.9" fill={MUTED}/>
            <circle cx="13" cy="9" r="0.9" fill={MUTED}/>
          </svg>
        </button>
      </div>

      {/* ── Warm amber hairline (Warm Editorial signature) ── */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${PRIMARY}40, transparent)`, margin: '8px 20px 0', flexShrink: 0 }} />

      {/* ── Big question / chosen summary ── */}
      <div style={{ padding: '20px 20px 14px', flexShrink: 0 }}>
        {!chosen ? (
          <>
            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              What kind of<br />vibe?
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 6, letterSpacing: '0.02em' }}>
              Tap a vibe to start planning
            </div>
          </>
        ) : (
          /* Single chosen-vibe row — grid is completely hidden */
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: chosenVibe?.grad,
            border: `1.5px solid ${chosenVibe?.glow}`,
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: `0 0 24px ${chosenVibe?.glow}44`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Glow orb */}
            <div style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              width: 60, height: 60,
              background: `radial-gradient(circle, ${chosenVibe?.glow}44 0%, transparent 70%)`,
              borderRadius: '50%', pointerEvents: 'none',
            }} />
            {/* Icon */}
            <div style={{ fontSize: 26, lineHeight: 1, filter: `drop-shadow(0 0 8px ${chosenVibe?.glow})`, flexShrink: 0 }}>
              {chosenVibe?.icon}
            </div>
            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: chosenVibe?.glow }}>{chosenVibe?.label}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{chosenVibe?.sub}</div>
            </div>
            {/* Change button */}
            <button onClick={() => setChosen(null)} style={{
              flexShrink: 0, background: 'rgba(0,0,0,0.35)',
              border: `1px solid ${BORDER}`, borderRadius: 20,
              padding: '5px 11px', cursor: 'pointer',
              fontSize: 11, fontWeight: 500, color: MUTED,
              zIndex: 1,
            }}>
              Change
            </button>
          </div>
        )}
      </div>

      {/* ── Vibe grid — only shown before a choice is made ── */}
      {!chosen && <div style={{
        flex: '1 1 auto',
        overflowY: 'auto',
        padding: '0 20px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          paddingBottom: 16,
        }}>
          {VIBES.map(v => (
              <button
                key={v.id}
                onClick={() => setChosen(v.id)}
                style={{
                  position: 'relative',
                  height: 118,
                  borderRadius: 14,
                  border: `1.5px solid ${BORDER}`,
                  background: v.grad,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
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
                <div style={{
                  position: 'absolute', top: 14, left: 14,
                  fontSize: 22, lineHeight: 1,
                  filter: `drop-shadow(0 0 8px ${v.glow})`,
                }}>
                  {v.icon}
                </div>

                {/* Label area */}
                <div style={{
                  padding: '0 12px 12px',
                  width: '100%',
                }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: FG,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {v.label}
                  </div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 2, fontWeight: 400 }}>
                    {v.sub}
                  </div>
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
          ))}
        </div>
      </div>}

      {/* ── Logistics panel — slides up after choosing ── */}
      <div style={{
        flexShrink: 0,
        padding: '0 20px',
        overflow: 'hidden',
        maxHeight: chosen ? 800 : 0,
        opacity: chosen ? 1 : 0,
        transition: 'max-height 0.35s ease, opacity 0.3s ease',
      }}>
        {/* Divider */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${PRIMARY}33, transparent)`, margin: '12px 0 16px' }} />

        {/* DATE — trigger button + popup calendar */}
        <LogRow label="DATE">
          <div style={{ position: 'relative' }}>
            {/* Trigger */}
            <button onClick={() => setCalOpen(o => !o)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: CARD, border: `1px solid ${calOpen ? PRIMARY + '88' : BORDER}`,
              borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="2" width="14" height="13" rx="2" stroke={calOpen ? PRIMARY : MUTED} strokeWidth="1.5"/>
                  <path d="M1 6h14" stroke={calOpen ? PRIMARY : MUTED} strokeWidth="1.5"/>
                  <path d="M5 1v2M11 1v2" stroke={calOpen ? PRIMARY : MUTED} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 13, color: calDay ? FG : MUTED, fontWeight: calDay ? 500 : 400 }}>
                  {calDay
                    ? new Date(calYear, calMonth, calDay).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    : 'Pick a date'}
                </span>
              </div>
              <span style={{ color: MUTED, fontSize: 10 }}>{calOpen ? '▲' : '▼'}</span>
            </button>

            {/* Popup calendar */}
            {calOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 10,
                background: CARD_ALT, border: `1px solid ${PRIMARY}55`,
                borderRadius: 12, overflow: 'hidden',
                boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${PRIMARY}22`,
              }}>
                {/* Month nav */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px' }}>
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 18, padding: '0 4px', lineHeight: 1 }}>‹</button>
                  <span style={{ fontSize: 12, fontWeight: 600, color: FG, letterSpacing: '0.06em' }}>
                    {new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 18, padding: '0 4px', lineHeight: 1 }}>›</button>
                </div>
                {/* Day-of-week header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px' }}>
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: 9, fontWeight: 600, color: MUTED, paddingBottom: 4, letterSpacing: '0.04em' }}>{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px 10px', gap: '2px 0' }}>
                  {buildCalendar(calYear, calMonth).map((day, i) => {
                    if (!day) return <div key={i} />;
                    const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                    const isSelected = day === calDay;
                    const isPast = new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    return (
                      <button key={i} onClick={() => { if (!isPast) { setCalDay(day); setCalOpen(false); } }} style={{
                        height: 30, borderRadius: 8, border: 'none',
                        background: isSelected ? PRIMARY : isToday ? PRIMARY + '28' : 'transparent',
                        color: isSelected ? PRIMARY_FG : isPast ? BORDER : isToday ? PRIMARY : FG,
                        fontSize: 12, fontWeight: isSelected || isToday ? 700 : 400,
                        cursor: isPast ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{day}</button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </LogRow>

        {/* TIME — start + end dropdowns */}
        <LogRow label="TIME">
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Start', value: startTime, set: setStartTime, accent: PRIMARY },
              { label: 'End',   value: endTime,   set: setEndTime,   accent: ACCENT  },
            ].map(({ label, value, set, accent }) => (
              <div key={label} style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
                <div style={{ position: 'relative' }}>
                  <select
                    value={value}
                    onChange={e => set(e.target.value)}
                    style={{
                      width: '100%', appearance: 'none', WebkitAppearance: 'none',
                      background: CARD, border: `1px solid ${BORDER}`,
                      borderRadius: 10, padding: '9px 32px 9px 12px',
                      color: FG, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {TIME_SLOTS.map(t => <option key={t} value={t} style={{ background: CARD }}>{t}</option>)}
                  </select>
                  {/* Custom chevron */}
                  <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 3.5L5 6.5L8 3.5" stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </LogRow>

        {/* WHO */}
        <LogRow label="WHO">
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', width: 'fit-content' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Text input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: CARD,
              border: `1px solid ${hoodFocused ? PRIMARY + '88' : hood && !NEIGHBORHOODS.includes(hood) ? PRIMARY + '66' : BORDER}`,
              borderRadius: 10,
              padding: '8px 11px',
              transition: 'border-color 0.15s',
            }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="6" cy="6" r="4.5" stroke={hoodFocused ? PRIMARY : MUTED} strokeWidth="1.5" />
                <path d="M10 10L12.5 12.5" stroke={hoodFocused ? PRIMARY : MUTED} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                value={hoodInput}
                onChange={e => {
                  setHoodInput(e.target.value);
                  // Clear chip selection while typing
                  if (hood && NEIGHBORHOODS.includes(hood)) setHood('');
                }}
                onFocus={() => setHoodFocused(true)}
                onBlur={() => setHoodFocused(false)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && hoodInput.trim()) {
                    setHood(hoodInput.trim());
                    setHoodInput('');
                  }
                }}
                placeholder="Type a neighborhood…"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: FG, fontSize: 13, fontFamily: 'inherit',
                  '::placeholder': { color: MUTED },
                } as React.CSSProperties}
              />
              {/* Show active custom hood as a tag, or clear button while typing */}
              {hood && !NEIGHBORHOODS.includes(hood) && !hoodInput && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: PRIMARY, borderRadius: 100, padding: '2px 8px',
                  fontSize: 11, fontWeight: 600, color: PRIMARY_FG, flexShrink: 0,
                }}>
                  {hood}
                  <span
                    onClick={() => setHood('')}
                    style={{ cursor: 'pointer', opacity: 0.7, fontSize: 13, lineHeight: 1 }}
                  >×</span>
                </div>
              )}
              {hoodInput && (
                <span
                  onClick={() => setHoodInput('')}
                  style={{ cursor: 'pointer', color: MUTED, fontSize: 16, lineHeight: 1, flexShrink: 0 }}
                >×</span>
              )}
            </div>

            {/* Preset chips — filtered by input */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {NEIGHBORHOODS
                .filter(n => !hoodInput || n.toLowerCase().includes(hoodInput.toLowerCase()))
                .map(n => (
                  <Chip
                    key={n}
                    active={hood === n}
                    onClick={() => { setHood(n); setHoodInput(''); }}
                    accent={PRIMARY}
                    accentFg={PRIMARY_FG}
                    small
                  >
                    {n}
                  </Chip>
                ))
              }
              {/* "Use this" hint when typing something not in list */}
              {hoodInput && !NEIGHBORHOODS.some(n => n.toLowerCase() === hoodInput.toLowerCase()) && (
                <button
                  onClick={() => { setHood(hoodInput.trim()); setHoodInput(''); }}
                  style={{
                    padding: '5px 10px', borderRadius: 100,
                    border: `1px dashed ${PRIMARY}88`,
                    background: PRIMARY + '12',
                    color: PRIMARY, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <span style={{ fontSize: 13 }}>+</span> "{hoodInput.trim()}"
                </button>
              )}
            </div>
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
      background: active ? accent : CARD,
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
