export default function SlideAsk() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '5vh', left: '20vw', width: '50vw', height: '50vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.07, filter: 'blur(13vw)' }} />
      <div style={{ position: 'absolute', bottom: '-20vh', right: '0', width: '40vw', height: '40vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.06, filter: 'blur(10vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', paddingLeft: '5vw', paddingRight: '5vw', paddingBottom: '8vh', boxSizing: 'border-box' }}>

        {/* Badge */}
        <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.88vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2.5vh' }}>
          The Ask
        </div>

        {/* Raise amount */}
        <div style={{ textAlign: 'center', marginBottom: '5vh' }}>
          <div style={{ fontSize: '1.4vw', color: 'rgba(255,255,255,0.45)', marginBottom: '1vh' }}>Raising a pre-seed round of</div>
          <div style={{ fontSize: '8vw', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', background: 'linear-gradient(135deg, #4F7FFF 0%, #7C6BF0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            $[XXX]K
          </div>
          <div style={{ fontSize: '1.4vw', color: 'rgba(255,255,255,0.35)', marginTop: '1vh' }}>on a [SAFE / convertible note / priced round] at [cap / terms]</div>
        </div>

        {/* Use of funds */}
        <div style={{ width: '100%', maxWidth: '80vw', display: 'flex', gap: '2.5vw', marginBottom: '4vh' }}>
          {[
            { pct: '[X]%', label: 'Product & Engineering', detail: 'Finish Google Maps import, AI plan generation, group voting flow', color: '#4F7FFF' },
            { pct: '[X]%', label: 'NYC Launch & GTM', detail: 'Influencer partnerships, campus ambassadors, venue outreach for 20 launch partners', color: '#7C6BF0' },
            { pct: '[X]%', label: 'Operations & Legal', detail: 'Incorporation, IP, initial overhead through 12 months of runway', color: 'rgba(255,255,255,0.5)' },
          ].map(item => (
            <div key={item.label} style={{ flex: 1, backgroundColor: '#131726', border: `1px solid ${item.color}33`, borderRadius: '1vw', padding: '2.5vh 2vw', textAlign: 'center', boxShadow: `0 1.5vh 4vh ${item.color}10` }}>
              <div style={{ fontSize: '3.5vw', fontWeight: 800, color: item.color, lineHeight: 1, marginBottom: '0.8vh' }}>{item.pct}</div>
              <div style={{ fontSize: '1.05vw', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '0.8vh' }}>{item.label}</div>
              <div style={{ fontSize: '0.92vw', color: 'rgba(255,255,255,0.4)', lineHeight: 1.45 }}>{item.detail}</div>
            </div>
          ))}
        </div>

        {/* Milestones this gets us to */}
        <div style={{ width: '100%', maxWidth: '80vw', backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1vw', padding: '2vh 3vw', display: 'flex', alignItems: 'center', gap: '4vw' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8vw', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8vh' }}>This round gets us to</div>
            <div style={{ fontSize: '1.2vw', color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>
              10,000 active NYC users · 20 venue commission partners · Series A proof points
            </div>
          </div>
          <div style={{ width: '1px', height: '5vh', backgroundColor: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8vw', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8vh' }}>Runway</div>
            <div style={{ fontSize: '1.2vw', color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>
              [X] months to first revenue and Series A raise
            </div>
          </div>
          <div style={{ width: '1px', height: '5vh', backgroundColor: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8vw', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8vh' }}>Contact</div>
            <div style={{ fontSize: '1.2vw', color: '#4F7FFF', fontWeight: 600 }}>
              [YOUR EMAIL]
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>12 / 12</div>
    </div>
  );
}
