export default function Slide10TheAsk() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      {/* Glows */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60vw', height: '60vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.06, filter: 'blur(14vw)' }} />
      <div style={{ position: 'absolute', bottom: '-15vh', right: '-8vw', width: '40vw', height: '40vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.07, filter: 'blur(9vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />
      {/* Header bar */}
      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      {/* Main layout */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', height: '100%', paddingLeft: '5vw', paddingRight: '5vw', gap: '4vw' }}>

        {/* Left — headline + raise */}
        <div style={{ width: '30vw', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.88vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'flex-start', marginBottom: '2.5vh' }}>
            The Ask
          </div>
          <h2 style={{ fontSize: '4vw', fontWeight: 800, margin: '0 0 2vh 0', lineHeight: 1.05, letterSpacing: '-0.03em' }}>Start the<br />engine.</h2>
          <div style={{ fontSize: '7vw', fontWeight: 800, color: '#4F7FFF', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: '0.8vh' }}>$300k</div>
          <div style={{ fontSize: '1.35vw', fontWeight: 300, color: 'rgba(255,255,255,0.5)', marginBottom: '4vh', lineHeight: 1.5 }}>Pre-seed · 12-month runway<br />NYC launch + venue partner platform</div>

          <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: '3vh' }} />

          <div style={{ fontSize: '1.5vw', fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.01em', marginBottom: '0.5vh' }}>contact@movesapp.io</div>
          <div style={{ fontSize: '1.15vw', fontWeight: 300, color: 'rgba(255,255,255,0.38)' }}>deck available under NDA</div>
        </div>

        {/* Right — use of funds breakdown */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.6vh' }}>

          {/* NYC Growth */}
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(79,127,255,0.3)', borderRadius: '1vw', padding: '2.2vh 2.2vw', boxShadow: '0 1.5vh 4vh rgba(79,127,255,0.1)', display: 'flex', alignItems: 'center', gap: '2.5vw' }}>
            <div style={{ width: '7vw', flexShrink: 0 }}>
              <div style={{ fontSize: '3vw', fontWeight: 800, color: '#4F7FFF', lineHeight: 1 }}>45%</div>
              <div style={{ fontSize: '1.05vw', fontWeight: 500, color: '#4F7FFF', marginTop: '0.2vh' }}>$135k</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.4vw', fontWeight: 700, marginBottom: '0.6vh' }}>NYC Growth &amp; Marketing</div>
              <div style={{ fontSize: '1.15vw', color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }}>Micro-influencer and nightlife creator seeding, campus ambassador program at NYU and Columbia, launch events and organic content production</div>
            </div>
          </div>

          {/* Engineering */}
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(124,107,240,0.25)', borderRadius: '1vw', padding: '2.2vh 2.2vw', boxShadow: '0 1.5vh 4vh rgba(124,107,240,0.08)', display: 'flex', alignItems: 'center', gap: '2.5vw' }}>
            <div style={{ width: '7vw', flexShrink: 0 }}>
              <div style={{ fontSize: '3vw', fontWeight: 800, color: '#7C6BF0', lineHeight: 1 }}>35%</div>
              <div style={{ fontSize: '1.05vw', fontWeight: 500, color: '#7C6BF0', marginTop: '0.2vh' }}>$105k</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.4vw', fontWeight: 700, marginBottom: '0.6vh' }}>Product &amp; Engineering</div>
              <div style={{ fontSize: '1.15vw', color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }}>Venue partner dashboard and event feed, home feed personalization, place import pipeline, iOS polish and app store submission</div>
            </div>
          </div>

          {/* Venue BD */}
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1vw', padding: '2.2vh 2.2vw', display: 'flex', alignItems: 'center', gap: '2.5vw' }}>
            <div style={{ width: '7vw', flexShrink: 0 }}>
              <div style={{ fontSize: '3vw', fontWeight: 800, color: 'rgba(255,190,80,0.9)', lineHeight: 1 }}>12%</div>
              <div style={{ fontSize: '1.05vw', fontWeight: 500, color: 'rgba(255,190,80,0.7)', marginTop: '0.2vh' }}>$36k</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.4vw', fontWeight: 700, marginBottom: '0.6vh' }}>Venue Business Development</div>
              <div style={{ fontSize: '1.15vw', color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }}>Signing the first 50 NYC venue partners, co-marketing agreements, and onboarding them onto the event promotion platform</div>
            </div>
          </div>

          {/* Operations */}
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1vw', padding: '2.2vh 2.2vw', display: 'flex', alignItems: 'center', gap: '2.5vw' }}>
            <div style={{ width: '7vw', flexShrink: 0 }}>
              <div style={{ fontSize: '3vw', fontWeight: 800, color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>8%</div>
              <div style={{ fontSize: '1.05vw', fontWeight: 500, color: 'rgba(255,255,255,0.35)', marginTop: '0.2vh' }}>$24k</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.4vw', fontWeight: 700, marginBottom: '0.6vh' }}>Operations &amp; Legal</div>
              <div style={{ fontSize: '1.15vw', color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }}>Entity setup, contracts, IP filings, hosting infrastructure, and tooling costs for the first year</div>
            </div>
          </div>

        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>10 / 10</div>
    </div>
  );
}
