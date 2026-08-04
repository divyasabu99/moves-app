export default function Slide3Solution() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '-20vh', right: '-10vw', width: '50vw', height: '50vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.06, filter: 'blur(9vw)' }} />
      <div style={{ position: 'absolute', bottom: '-25vh', left: '-12vw', width: '55vw', height: '55vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.06, filter: 'blur(11vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', width: '90vw', marginLeft: '5vw', height: '100%', gap: '5vw' }}>
        {/* Left text */}
        <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.88vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'flex-start', marginBottom: '2.5vh' }}>
            The Solution
          </div>
          <h2 style={{ fontSize: '3.6vw', fontWeight: 800, margin: '0 0 1.5vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            From your saves<br />to a <span style={{ color: '#4F7FFF' }}>complete plan</span>
          </h2>
          <p style={{ fontSize: '1.5vw', fontWeight: 300, color: 'rgba(255,255,255,0.6)', margin: '0 0 3.5vh 0', lineHeight: 1.55, maxWidth: '40vw' }}>
            MOVES is a plan-decision product. Your group doesn't vote on individual places — they choose between two or three complete itineraries, built from places you've already saved.
          </p>

          {/* Steps */}
          {[
            { n: '01', label: 'Import your saves', detail: 'Sync your Google Maps saved places in one tap — your existing list becomes your personal planning library' },
            { n: '02', label: 'AI builds complete plans', detail: 'Set vibe, budget, and group size — MOVES generates 2–3 full itineraries with cost, menus, and timing' },
            { n: '03', label: 'Group picks a plan', detail: 'Share Plan A, Plan B, Plan C to your group — they vote on the whole night, not individual spots' },
            { n: '04', label: 'It remembers', detail: 'Every outing is logged — where you went, who came, what you spent — so future plans get sharper' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', gap: '1.2vw', marginBottom: '1.8vh', alignItems: 'flex-start' }}>
              <div style={{ width: '2vw', height: '2vw', borderRadius: '0.4vw', backgroundColor: 'rgba(79,127,255,0.15)', border: '1px solid rgba(79,127,255,0.35)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.72vw', fontWeight: 800, color: '#4F7FFF', letterSpacing: '0.02em' }}>{step.n}</span>
              </div>
              <div>
                <span style={{ fontSize: '1.35vw', fontWeight: 600, color: '#FFFFFF' }}>{step.label} </span>
                <span style={{ fontSize: '1.25vw', fontWeight: 300, color: 'rgba(255,255,255,0.55)' }}>— {step.detail}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right — phone mock showing Plan A / Plan B vote */}
        <div style={{ width: '26vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '22vw', height: '62vh', backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2vw', boxShadow: '0 3vh 6vh rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top bar */}
            <div style={{ padding: '1.4vw 1.8vw 1vw', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9vw', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Friday Night</span>
              <span style={{ fontSize: '0.75vw', color: 'rgba(79,127,255,0.8)', fontWeight: 600 }}>3 friends voting</span>
            </div>
            {/* Plans */}
            <div style={{ flex: 1, padding: '1.2vw', display: 'flex', flexDirection: 'column', gap: '1.2vh', overflowY: 'hidden' }}>
              {/* Plan A */}
              <div style={{ backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.35)', borderRadius: '0.8vw', padding: '1.1vw' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8vh' }}>
                  <span style={{ fontSize: '0.85vw', fontWeight: 800, color: '#4F7FFF' }}>Plan A</span>
                  <span style={{ fontSize: '0.7vw', color: 'rgba(255,255,255,0.4)' }}>~$65/person</span>
                </div>
                {[
                  { time: '7 PM', name: 'Don Angie', tag: 'Dinner · $$' },
                  { time: '9:30 PM', name: 'attaboy', tag: 'Cocktails · $$$' },
                ].map(s => (
                  <div key={s.name} style={{ display: 'flex', gap: '0.7vw', alignItems: 'center', marginBottom: '0.4vh' }}>
                    <span style={{ fontSize: '0.7vw', color: '#4F7FFF', fontWeight: 600, width: '3.5vw', flexShrink: 0 }}>{s.time}</span>
                    <span style={{ fontSize: '0.82vw', fontWeight: 600 }}>{s.name}</span>
                    <span style={{ fontSize: '0.7vw', color: 'rgba(255,255,255,0.4)' }}>{s.tag}</span>
                  </div>
                ))}
                <div style={{ marginTop: '0.8vh', display: 'flex', alignItems: 'center', gap: '0.4vw' }}>
                  <div style={{ display: 'flex', gap: '0.2vw' }}>
                    {['#4F7FFF', '#7C6BF0', 'rgba(255,255,255,0.3)'].map((c, i) => (
                      <div key={i} style={{ width: '1.1vw', height: '1.1vw', borderRadius: '50%', backgroundColor: c, border: '1px solid rgba(255,255,255,0.15)' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.72vw', color: 'rgba(255,255,255,0.45)' }}>2 votes</span>
                </div>
              </div>

              {/* Plan B */}
              <div style={{ backgroundColor: 'rgba(124,107,240,0.08)', border: '1px solid rgba(124,107,240,0.22)', borderRadius: '0.8vw', padding: '1.1vw' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8vh' }}>
                  <span style={{ fontSize: '0.85vw', fontWeight: 800, color: '#7C6BF0' }}>Plan B</span>
                  <span style={{ fontSize: '0.7vw', color: 'rgba(255,255,255,0.4)' }}>~$45/person</span>
                </div>
                {[
                  { time: '7:30 PM', name: 'Rezdôra', tag: 'Dinner · $$' },
                  { time: '10 PM', name: 'Elsewhere', tag: 'Late night · $' },
                ].map(s => (
                  <div key={s.name} style={{ display: 'flex', gap: '0.7vw', alignItems: 'center', marginBottom: '0.4vh' }}>
                    <span style={{ fontSize: '0.7vw', color: '#7C6BF0', fontWeight: 600, width: '3.5vw', flexShrink: 0 }}>{s.time}</span>
                    <span style={{ fontSize: '0.82vw', fontWeight: 600 }}>{s.name}</span>
                    <span style={{ fontSize: '0.7vw', color: 'rgba(255,255,255,0.4)' }}>{s.tag}</span>
                  </div>
                ))}
                <div style={{ marginTop: '0.8vh', display: 'flex', alignItems: 'center', gap: '0.4vw' }}>
                  <div style={{ display: 'flex', gap: '0.2vw' }}>
                    {['rgba(255,255,255,0.3)'].map((c, i) => (
                      <div key={i} style={{ width: '1.1vw', height: '1.1vw', borderRadius: '50%', backgroundColor: c, border: '1px solid rgba(255,255,255,0.15)' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.72vw', color: 'rgba(255,255,255,0.45)' }}>1 vote</span>
                </div>
              </div>

              {/* Google Maps objection handler */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.6vw', padding: '0.9vw 1vw', marginTop: 'auto' }}>
                <div style={{ fontSize: '0.7vw', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>vs Google Maps lists</span><br />
                  Google votes on individual places. MOVES votes on complete nights.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>03 / 11</div>
    </div>
  );
}
