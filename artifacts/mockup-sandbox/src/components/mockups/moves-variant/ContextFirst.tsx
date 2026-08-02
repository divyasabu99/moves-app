import React, { useState } from 'react';

// ── Design hypothesis ────────────────────────────────────────────────────────
// Current MoodBoard: "You know your vibe when you see it." → Grid of scenes → pick → fill logistics.
//
// This hypothesis: "You know your constraints, not your vibe."
// Tell MOVES *when*, *who*, and *energy level* — three big tap-target questions.
// MOVES infers the right moves and surfaces 2 targeted recommendations with
// reasoning ("Ideal for a date night on a Sunday evening").
//
// The vibe is a recommendation, not a selection.
// No grid. No logistics form. Three taps → personalized itinerary.
//
// Information architecture shift:
//   Current: Vibe (visual recognition) → Logistics (form confirmation)
//   This:    Context (constraints) → Vibe (AI inference) → Confirm (single tap)
// ────────────────────────────────────────────────────────────────────────────

// ── Warm Editorial color scale ──────────────────────────────────────────────
const BG        = '#1C1710';
const CARD      = '#26201A';
const FG        = '#F2E8D4';
const MUTED     = '#8C7D69';
const BORDER    = '#3D3125';
const PRIMARY   = '#D4A853';
const PRIMARY_FG = '#1C1710';
const ACCENT    = '#8B6BAE';

type Step = 'when' | 'who' | 'energy' | 'results' | 'confirmed';
interface Answers { when: string | null; who: string | null; energy: string | null; }

const VIBES_DATA = [
  {
    id: 'dinner', label: 'Dinner & Drinks', sub: 'Restaurant → cocktail bar', icon: '🕯️',
    grad: 'linear-gradient(145deg, #2A1A0F 0%, #4A2C15 50%, #1F120A 100%)', glow: '#C4703C',
    stops: ['Cozy restaurant', 'Craft cocktail bar', 'Nightcap'],
  },
  {
    id: 'date', label: 'Date Night', sub: 'Intimate, romantic', icon: '✦',
    grad: 'linear-gradient(145deg, #1A0F20 0%, #3D1F4A 50%, #140A1A 100%)', glow: '#8B6BAE',
    stops: ['Wine bar', 'Small plates', 'Late dessert'],
  },
  {
    id: 'night-out', label: 'Night Out', sub: 'Bar crawl, dancing', icon: '◈',
    grad: 'linear-gradient(145deg, #0A0D1F 0%, #1A2040 50%, #080A18 100%)', glow: '#4F7FFF',
    stops: ['Pre-game bar', 'Live music venue', 'Dance floor'],
  },
  {
    id: 'brunch', label: 'Brunch Run', sub: 'Morning through afternoon', icon: '☀',
    grad: 'linear-gradient(145deg, #1F1A0A 0%, #3D3410 50%, #181508 100%)', glow: '#D4A853',
    stops: ['Brunch spot', 'Coffee walk', 'Afternoon drink'],
  },
  {
    id: 'low-key', label: 'Low-Key Vibes', sub: 'Easy evening, no rush', icon: '∿',
    grad: 'linear-gradient(145deg, #141414 0%, #252525 50%, #101010 100%)', glow: '#8A8A8A',
    stops: ['Neighborhood bar', 'Snack spot', 'Easy wind-down'],
  },
  {
    id: 'foodie', label: 'Foodie Crawl', sub: 'Neighborhood spot-hopping', icon: '◉',
    grad: 'linear-gradient(145deg, #0F1A0A 0%, #1E3515 50%, #0A1208 100%)', glow: '#5BA058',
    stops: ['Local gem #1', 'Street food', 'Chef\'s table'],
  },
];

function recommend(answers: Answers): [typeof VIBES_DATA[0], typeof VIBES_DATA[0], string, string] {
  const { energy, who, when } = answers;
  if (energy === 'WILD') return [VIBES_DATA[2], VIBES_DATA[0], 'Matches high-energy groups perfectly', 'Great backup for a lively night'];
  if (when === 'AFTERNOON') return [VIBES_DATA[3], VIBES_DATA[5], 'Perfect window for a daytime run', 'Explore spots before the evening crowd'];
  if (who === 'DATE') return [VIBES_DATA[1], VIBES_DATA[0], 'Ideal for two — intimate venues nearby', 'A classic date with great spots'];
  if (energy === 'CHILL') return [VIBES_DATA[4], VIBES_DATA[0], 'Fits a relaxed evening perfectly', 'Still a great night, no pressure'];
  if (who === 'BIG') return [VIBES_DATA[2], VIBES_DATA[0], 'Built for big groups that want to move', 'Solid choice for a group dinner first'];
  return [VIBES_DATA[0], VIBES_DATA[1], 'Classic match for your evening', 'Romantic alternative if plans shift'];
}

const STEP_META = [
  { q: 'When are you free?', hint: 'We\'ll find what\'s right for the time' },
  { q: 'Who\'s coming?', hint: 'Helps us pick the right kind of spot' },
  { q: 'What\'s the energy?', hint: 'Set the tone for your night' },
];

const WHEN_OPTS = [
  { v: 'AFTERNOON', label: 'This Afternoon', sub: '2:00 – 6:00 PM', icon: '☀' },
  { v: 'EVENING',   label: 'Tonight',         sub: '6:00 – 10:00 PM', icon: '🌆' },
  { v: 'LATE',      label: 'Late Night',       sub: '10:00 PM +',      icon: '🌙' },
  { v: 'WEEKEND',   label: 'This Weekend',     sub: 'Saturday or Sunday', icon: '📅' },
];
const WHO_OPTS = [
  { v: 'SOLO',  label: 'Just Me',     sub: 'Solo exploration',  icon: '👤' },
  { v: 'DATE',  label: 'Date Night',  sub: 'Two of us',          icon: '✦' },
  { v: 'SMALL', label: 'Small Crew',  sub: '3 – 5 people',       icon: '◈' },
  { v: 'BIG',   label: 'Big Group',   sub: '6 or more',          icon: '◉' },
];
const ENERGY_OPTS = [
  { v: 'CHILL',  label: 'Chill',  sub: 'Low-key, relaxed, no agenda', icon: '∿' },
  { v: 'EASY',   label: 'Easy',   sub: 'Casual and social',            icon: '◌' },
  { v: 'LIVELY', label: 'Lively', sub: 'Energetic, fun, a real night', icon: '◈' },
  { v: 'WILD',   label: 'Wild',   sub: 'Dancing, loud, full send',     icon: '⚡' },
];

function Tile({ label, sub, icon, active, onClick }: {
  label: string; sub: string; icon: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      flex: 1,
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px',
      borderRadius: 14,
      border: `1.5px solid ${active ? PRIMARY : BORDER}`,
      background: active ? PRIMARY + '15' : CARD,
      cursor: 'pointer',
      transition: 'all 0.15s',
      boxShadow: active ? `0 0 0 1px ${PRIMARY}33, 0 4px 16px ${PRIMARY}1A` : 'none',
      textAlign: 'left',
    }}>
      {/* Icon circle */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: active ? PRIMARY + '22' : BORDER + '55',
        border: `1px solid ${active ? PRIMARY + '66' : BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, transition: 'all 0.15s',
        filter: active ? `drop-shadow(0 0 6px ${PRIMARY}88)` : 'none',
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: active ? PRIMARY : FG, lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.3 }}>{sub}</div>
      </div>
      {/* Check */}
      <div style={{
        width: 20, height: 20, borderRadius: 10, flexShrink: 0,
        border: `1.5px solid ${active ? PRIMARY : BORDER}`,
        background: active ? PRIMARY : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {active && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke={PRIMARY_FG} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  );
}

export default function ContextFirst() {
  const [step, setStep]       = useState<Step>('when');
  const [answers, setAnswers] = useState<Answers>({ when: null, who: null, energy: null });
  const [chosen, setChosen]   = useState<string | null>(null);

  const pick = (field: keyof Answers, value: string) => {
    const next = { ...answers, [field]: value };
    setAnswers(next);
    setTimeout(() => {
      if (field === 'when') setStep('who');
      else if (field === 'who') setStep('energy');
      else setStep('results');
    }, 280);
  };

  const stepNum = step === 'when' ? 0 : step === 'who' ? 1 : step === 'energy' ? 2 : 3;
  const [rec0, rec1, reason0, reason1] = step === 'results' || step === 'confirmed'
    ? recommend(answers)
    : [VIBES_DATA[0], VIBES_DATA[1], '', ''];

  const chosenRec = chosen === rec0.id ? rec0 : rec1;

  return (
    <div style={{
      width: '100%', height: '100vh', background: BG,
      fontFamily: "'Inter', system-ui, sans-serif", color: FG,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* Status bar */}
      <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>9:41</span>
        <div style={{ width: 25, height: 12, borderRadius: 3, border: `1px solid ${MUTED}`, display: 'flex', alignItems: 'center', padding: '0 2px' }}>
          <div style={{ width: '75%', height: 7, borderRadius: 2, background: FG }} />
        </div>
      </div>

      {/* Header */}
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

      {/* Amber hairline */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${PRIMARY}40, transparent)`, margin: '8px 20px 0', flexShrink: 0 }} />

      {/* Step dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 20px 0', flexShrink: 0 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            height: 3, borderRadius: 2,
            background: i < stepNum ? PRIMARY : i === stepNum ? PRIMARY : BORDER,
            width: i === stepNum ? 28 : 8,
            opacity: i > stepNum ? 0.35 : 1,
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px 0', overflow: 'hidden' }}>

        {/* Question heading */}
        {(step === 'when' || step === 'who' || step === 'energy') && (
          <div style={{ marginBottom: 16, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 5 }}>
              {stepNum + 1} of 3
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              {STEP_META[stepNum].q}
            </div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 5 }}>
              {STEP_META[stepNum].hint}
            </div>
          </div>
        )}

        {/* WHEN */}
        {step === 'when' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {WHEN_OPTS.map(o => (
              <Tile key={o.v} label={o.label} sub={o.sub} icon={o.icon}
                active={answers.when === o.v} onClick={() => pick('when', o.v)} />
            ))}
          </div>
        )}

        {/* WHO */}
        {step === 'who' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {WHO_OPTS.map(o => (
              <Tile key={o.v} label={o.label} sub={o.sub} icon={o.icon}
                active={answers.who === o.v} onClick={() => pick('who', o.v)} />
            ))}
          </div>
        )}

        {/* ENERGY */}
        {step === 'energy' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {ENERGY_OPTS.map(o => (
              <Tile key={o.v} label={o.label} sub={o.sub} icon={o.icon}
                active={answers.energy === o.v} onClick={() => pick('energy', o.v)} />
            ))}
          </div>
        )}

        {/* RESULTS */}
        {step === 'results' && (
          <>
            {/* Heading + answer chips */}
            <div style={{ flexShrink: 0, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 5 }}>Your moves</div>
              <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                Here's what fits tonight
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {[answers.when, answers.who, answers.energy].map((a, i) => (
                  <div key={i} style={{
                    padding: '3px 10px', borderRadius: 100,
                    background: CARD, border: `1px solid ${BORDER}`,
                    fontSize: 11, color: MUTED,
                  }}>{a}</div>
                ))}
                <button onClick={() => { setAnswers({ when: null, who: null, energy: null }); setStep('when'); }} style={{
                  padding: '3px 10px', borderRadius: 100, background: 'none',
                  border: `1px dashed ${BORDER}`, fontSize: 11, color: MUTED,
                  cursor: 'pointer',
                }}>Edit ↩</button>
              </div>
            </div>

            {/* Recommendation cards */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[{ rec: rec0, reason: reason0, best: true }, { rec: rec1, reason: reason1, best: false }].map(({ rec, reason, best }) => (
                <button
                  key={rec.id}
                  onClick={() => { setChosen(rec.id); setStep('confirmed'); }}
                  style={{
                    flex: 1, position: 'relative',
                    borderRadius: 16,
                    border: `1.5px solid ${best ? rec.glow + '88' : rec.glow + '44'}`,
                    background: rec.grad,
                    cursor: 'pointer', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    padding: 0, textAlign: 'left',
                    boxShadow: best ? `0 4px 28px ${rec.glow}33` : `0 2px 12px ${rec.glow}18`,
                  }}
                >
                  {/* Glow orb */}
                  <div style={{
                    position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)',
                    width: 70, height: 70,
                    background: `radial-gradient(circle, ${rec.glow}44 0%, transparent 70%)`,
                    borderRadius: '50%',
                  }} />
                  {/* Icon */}
                  <div style={{
                    position: 'absolute', top: 16, left: 16,
                    fontSize: 26, lineHeight: 1,
                    filter: `drop-shadow(0 0 10px ${rec.glow})`,
                  }}>{rec.icon}</div>
                  {/* Badge */}
                  {best && (
                    <div style={{
                      position: 'absolute', top: 14, right: 14,
                      background: PRIMARY, borderRadius: 100, padding: '3px 10px',
                      fontSize: 9, fontWeight: 700, color: PRIMARY_FG, letterSpacing: '0.08em',
                    }}>BEST FIT</div>
                  )}
                  {/* Content */}
                  <div style={{ padding: '0 16px 14px', width: '100%' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: rec.glow, lineHeight: 1.2 }}>{rec.label}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{reason}</div>
                    {/* Stop pills */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                      {rec.stops.map((s, j) => (
                        <span key={j} style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          fontSize: 10, color: FG + '99',
                          background: 'rgba(0,0,0,0.28)',
                          borderRadius: 100, padding: '2px 8px',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}>
                          {j > 0 && <span style={{ color: rec.glow + '88' }}>→</span>}
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* CONFIRMED */}
        {step === 'confirmed' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 0 20px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 36,
              background: PRIMARY + '1A', border: `2px solid ${PRIMARY}88`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
              boxShadow: `0 0 32px ${PRIMARY}33`,
            }}>{chosenRec.icon}</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: FG }}>{chosenRec.label}</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>Building your itinerary…</div>
            </div>
            {/* Animated dots */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: 3,
                  background: PRIMARY,
                  opacity: 0.4 + i * 0.2,
                  animation: `pulse ${0.8 + i * 0.15}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer hint / CTA */}
      <div style={{ padding: '10px 20px 28px', flexShrink: 0 }}>
        {(step === 'when' || step === 'who' || step === 'energy') && (
          <p style={{ textAlign: 'center', fontSize: 12, color: BORDER, margin: 0 }}>
            {stepNum === 0 ? 'Three quick questions — no form to fill' : stepNum === 1 ? 'Two more after this' : 'Last one, then your moves appear'}
          </p>
        )}
        {step === 'results' && (
          <button
            onClick={() => { setChosen(rec0.id); setStep('confirmed'); }}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${PRIMARY}, #B8872E)`,
              color: PRIMARY_FG, fontSize: 15, fontWeight: 700,
              letterSpacing: '0.04em', cursor: 'pointer',
              boxShadow: `0 4px 24px ${PRIMARY}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span>Go with best fit</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke={PRIMARY_FG} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {step === 'confirmed' && (
          <button
            onClick={() => { setStep('when'); setAnswers({ when: null, who: null, energy: null }); setChosen(null); }}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 14, border: `1px solid ${BORDER}`,
              background: 'transparent', color: MUTED, fontSize: 13, cursor: 'pointer',
            }}
          >
            ← Start over
          </button>
        )}
      </div>
    </div>
  );
}
