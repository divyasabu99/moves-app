export default function Slide6Market() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '5vh', left: '25vw', width: '40vw', height: '40vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.06, filter: 'blur(12vw)' }} />
      <div style={{ position: 'absolute', bottom: '-10vh', right: '5vw', width: '35vw', height: '35vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.05, filter: 'blur(9vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '14vh', paddingLeft: '5vw', paddingRight: '5vw' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '5vh' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.88vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2vh' }}>
            Market Opportunity
          </div>
          <h2 style={{ fontSize: '3.8vw', fontWeight: 800, margin: '0 0 1.2vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>Urban social planning is underserved</h2>
          <p style={{ fontSize: '1.5vw', fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: 0 }}>A large, fragmented category with no dominant mobile-first solution</p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: '2.5vw', width: '100%', marginBottom: '3vh' }}>
          {/* TAM */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(79,127,255,0.22)', borderRadius: '1.2vw', padding: '3vh 2.5vw', textAlign: 'center', boxShadow: '0 2vh 4vh rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5vh' }}>Total Addressable Market</div>
            <div style={{ fontSize: '5.5vw', fontWeight: 800, color: '#4F7FFF', lineHeight: 1, marginBottom: '1vh' }}>$52B</div>
            <div style={{ fontSize: '1.15vw', fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, marginBottom: '1.2vh' }}>US out-of-home dining<br />and nightlife spending</div>
            <div style={{ fontSize: '0.85vw', color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>National Restaurant Association,<br />US Bureau of Labor Statistics</div>
          </div>

          {/* SAM */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(124,107,240,0.28)', borderRadius: '1.2vw', padding: '3vh 2.5vw', textAlign: 'center', boxShadow: '0 2vh 5vh rgba(124,107,240,0.12)' }}>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5vh' }}>Serviceable Addressable Market</div>
            <div style={{ fontSize: '5.5vw', fontWeight: 800, color: '#7C6BF0', lineHeight: 1, marginBottom: '1vh' }}>$8.4B</div>
            <div style={{ fontSize: '1.15vw', fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, marginBottom: '1.2vh' }}>US digital social discovery<br />and planning apps</div>
            <div style={{ fontSize: '0.85vw', color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>Statista, App Annie,<br />internal market sizing</div>
          </div>

          {/* SOM — honestly labeled */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.2vw', padding: '3vh 2.5vw', textAlign: 'center', boxShadow: '0 2vh 4vh rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5vh' }}>Serviceable Obtainable Market</div>
            <div style={{ fontSize: '5.5vw', fontWeight: 800, color: 'rgba(255,255,255,0.75)', lineHeight: 1, marginBottom: '1vh' }}>TBD</div>
            <div style={{ fontSize: '1.15vw', fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, marginBottom: '1.2vh' }}>NYC metro, Year 3<br />revenue target</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4vw', padding: '0.4vh 0.8vw', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.4vw' }}>
              <div style={{ width: '0.4vw', height: '0.4vw', borderRadius: '50%', backgroundColor: 'rgba(255,190,80,0.8)' }} />
              <span style={{ fontSize: '0.82vw', color: 'rgba(255,190,80,0.8)', fontWeight: 500 }}>In progress — replacing with sourced data</span>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.8vw', padding: '1.5vh 2vw', display: 'flex', alignItems: 'center', gap: '1.5vw' }}>
          <div style={{ width: '0.4vw', height: '0.4vw', borderRadius: '50%', backgroundColor: 'rgba(255,190,80,0.7)', flexShrink: 0 }} />
          <p style={{ fontSize: '1.1vw', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>
            TAM sourced from National Restaurant Association (2024) and US BLS consumer expenditure data. SAM derived from Statista app market reports. SOM to be replaced with a bottom-up model based on NYC user and venue partner targets — do not cite in investor materials until sourced.
          </p>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>06 / 10</div>
    </div>
  );
}
