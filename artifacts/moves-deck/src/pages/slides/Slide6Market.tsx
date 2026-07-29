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
        <div style={{ display: 'flex', gap: '2.5vw', width: '100%', marginBottom: '4vh' }}>
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(79,127,255,0.22)', borderRadius: '1.2vw', padding: '3vh 2.5vw', textAlign: 'center', boxShadow: '0 2vh 4vh rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5vh' }}>Total Addressable Market</div>
            <div style={{ fontSize: '5.5vw', fontWeight: 800, color: '#4F7FFF', lineHeight: 1, marginBottom: '1vh' }}>$52B</div>
            <div style={{ fontSize: '1.3vw', fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>US out-of-home dining<br />and nightlife spending</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(124,107,240,0.28)', borderRadius: '1.2vw', padding: '3vh 2.5vw', textAlign: 'center', boxShadow: '0 2vh 5vh rgba(124,107,240,0.12)' }}>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5vh' }}>Serviceable Addressable Market</div>
            <div style={{ fontSize: '5.5vw', fontWeight: 800, color: '#7C6BF0', lineHeight: 1, marginBottom: '1vh' }}>$8.4B</div>
            <div style={{ fontSize: '1.3vw', fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>Digital social discovery<br />and planning apps</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(39,201,63,0.2)', borderRadius: '1.2vw', padding: '3vh 2.5vw', textAlign: 'center', boxShadow: '0 2vh 4vh rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5vh' }}>Serviceable Obtainable Market</div>
            <div style={{ fontSize: '5.5vw', fontWeight: 800, color: '#27C93F', lineHeight: 1, marginBottom: '1vh' }}>$200M</div>
            <div style={{ fontSize: '1.3vw', fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>NYC metro, Year 3<br />projection</div>
          </div>
        </div>

        {/* Bar chart mock */}
        <div style={{ width: '100%', height: '18vh', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1vw', padding: '1.5vw 2vw', display: 'flex', alignItems: 'flex-end', gap: '1.2vw' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh', flex: 1 }}>
            <div style={{ width: '100%', height: '5vh', backgroundColor: 'rgba(79,127,255,0.25)', borderRadius: '0.3vw' }} />
            <span style={{ fontSize: '1vw', color: 'rgba(255,255,255,0.3)' }}>Q1</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh', flex: 1 }}>
            <div style={{ width: '100%', height: '7vh', backgroundColor: 'rgba(79,127,255,0.3)', borderRadius: '0.3vw' }} />
            <span style={{ fontSize: '1vw', color: 'rgba(255,255,255,0.3)' }}>Q2</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh', flex: 1 }}>
            <div style={{ width: '100%', height: '6vh', backgroundColor: 'rgba(79,127,255,0.3)', borderRadius: '0.3vw' }} />
            <span style={{ fontSize: '1vw', color: 'rgba(255,255,255,0.3)' }}>Q3</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh', flex: 1 }}>
            <div style={{ width: '100%', height: '9vh', backgroundColor: 'rgba(79,127,255,0.35)', borderRadius: '0.3vw' }} />
            <span style={{ fontSize: '1vw', color: 'rgba(255,255,255,0.3)' }}>Q4</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh', flex: 1 }}>
            <div style={{ width: '100%', height: '8vh', backgroundColor: 'rgba(124,107,240,0.3)', borderRadius: '0.3vw' }} />
            <span style={{ fontSize: '1vw', color: 'rgba(255,255,255,0.3)' }}>Q5</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh', flex: 1 }}>
            <div style={{ width: '100%', height: '11vh', backgroundColor: 'rgba(124,107,240,0.35)', borderRadius: '0.3vw' }} />
            <span style={{ fontSize: '1vw', color: 'rgba(255,255,255,0.3)' }}>Q6</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh', flex: 1 }}>
            <div style={{ width: '100%', height: '10vh', backgroundColor: 'rgba(124,107,240,0.4)', borderRadius: '0.3vw' }} />
            <span style={{ fontSize: '1vw', color: 'rgba(255,255,255,0.3)' }}>Q7</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh', flex: 1 }}>
            <div style={{ width: '100%', height: '13vh', backgroundColor: '#7C6BF0', borderRadius: '0.3vw', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '25%', background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)', borderRadius: '0.3vw 0.3vw 0 0' }} />
            </div>
            <span style={{ fontSize: '1vw', color: 'rgba(255,255,255,0.3)' }}>Q8</span>
          </div>
        </div>
        <div style={{ alignSelf: 'flex-start', fontSize: '1vw', color: 'rgba(255,255,255,0.28)', marginTop: '1vh' }}>Urban social app market growth projection — estimates only</div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>06 / 10</div>
    </div>
  );
}
