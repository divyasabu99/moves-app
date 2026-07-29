export default function Slide10TheAsk() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      {/* Center glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60vw', height: '60vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.07, filter: 'blur(14vw)' }} />
      <div style={{ position: 'absolute', bottom: '-15vh', right: '-8vw', width: '40vw', height: '40vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.08, filter: 'blur(9vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      {/* Center content */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'rgba(19,23,38,0.7)', backdropFilter: 'blur(2vw)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2vw', padding: '5vh 5vw', width: '62vw', boxShadow: '0 4vh 8vh rgba(0,0,0,0.55)' }}>
          {/* Top badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3.5vh' }}>
            <div style={{ padding: '0.6vh 1.5vw', backgroundColor: 'rgba(79,127,255,0.15)', border: '1px solid rgba(79,127,255,0.32)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.9vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Seed Round
            </div>
          </div>

          {/* Title + raise */}
          <div style={{ textAlign: 'center', marginBottom: '4vh' }}>
            <h2 style={{ fontSize: '4.2vw', fontWeight: 800, margin: '0 0 1.5vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>Join the Round</h2>
            <div style={{ fontSize: '6vw', fontWeight: 800, color: '#4F7FFF', lineHeight: 1, marginBottom: '0.8vh' }}>$1.5M</div>
            <div style={{ fontSize: '1.5vw', fontWeight: 300, color: 'rgba(255,255,255,0.5)' }}>18-month runway · Seed stage</div>
          </div>

          {/* Divider */}
          <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: '3.5vh' }} />

          {/* Use of funds */}
          <div style={{ marginBottom: '4vh' }}>
            <div style={{ fontSize: '0.9vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '2.5vh' }}>Use of Funds</div>
            <div style={{ display: 'flex', gap: '2vw' }}>
              <div style={{ flex: 1, backgroundColor: 'rgba(79,127,255,0.1)', border: '1px solid rgba(79,127,255,0.2)', borderRadius: '0.8vw', padding: '2vh 1.5vw', textAlign: 'center' }}>
                <div style={{ fontSize: '2.8vw', fontWeight: 800, color: '#4F7FFF', lineHeight: 1 }}>60%</div>
                <div style={{ fontSize: '1.2vw', fontWeight: 500, marginTop: '0.8vh' }}>Engineering</div>
                <div style={{ fontSize: '1.05vw', color: 'rgba(255,255,255,0.45)', marginTop: '0.3vh' }}>Product and infrastructure</div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'rgba(124,107,240,0.1)', border: '1px solid rgba(124,107,240,0.2)', borderRadius: '0.8vw', padding: '2vh 1.5vw', textAlign: 'center' }}>
                <div style={{ fontSize: '2.8vw', fontWeight: 800, color: '#7C6BF0', lineHeight: 1 }}>25%</div>
                <div style={{ fontSize: '1.2vw', fontWeight: 500, marginTop: '0.8vh' }}>Growth</div>
                <div style={{ fontSize: '1.05vw', color: 'rgba(255,255,255,0.45)', marginTop: '0.3vh' }}>NYC launch and marketing</div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.8vw', padding: '2vh 1.5vw', textAlign: 'center' }}>
                <div style={{ fontSize: '2.8vw', fontWeight: 800, color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>15%</div>
                <div style={{ fontSize: '1.2vw', fontWeight: 500, marginTop: '0.8vh' }}>Operations</div>
                <div style={{ fontSize: '1.05vw', color: 'rgba(255,255,255,0.45)', marginTop: '0.3vh' }}>Legal, ops, and team</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6vw', fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.01em' }}>contact@movesapp.io</div>
            <div style={{ fontSize: '1.2vw', fontWeight: 300, color: 'rgba(255,255,255,0.4)', marginTop: '0.5vh' }}>deck available under NDA</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>10 / 10</div>
    </div>
  );
}
