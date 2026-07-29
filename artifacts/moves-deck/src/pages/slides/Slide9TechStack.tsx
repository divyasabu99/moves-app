export default function Slide9TechStack() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '-15vh', right: '-8vw', width: '48vw', height: '48vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.05, filter: 'blur(10vw)' }} />
      <div style={{ position: 'absolute', bottom: '-20vh', left: '-10vw', width: '50vw', height: '50vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.05, filter: 'blur(11vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', width: '90vw', marginLeft: '5vw', height: '100%', gap: '6vw' }}>
        {/* Left */}
        <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.88vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'flex-start', marginBottom: '2.5vh' }}>
            Architecture
          </div>
          <h2 style={{ fontSize: '3.8vw', fontWeight: 800, margin: '0 0 2vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>Built to scale<br /><span style={{ color: 'rgba(255,255,255,0.4)' }}>from day one.</span></h2>
          <p style={{ fontSize: '1.6vw', fontWeight: 300, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, maxWidth: '36vw', marginBottom: '4vh', marginTop: 0 }}>
            A modern, cross-platform stack with a scalable API backend, relational database, and AI layer — designed for rapid iteration and city-scale load.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8vh' }}>
            <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
              <div style={{ width: '1.4vw', height: '1.4vw', borderRadius: '0.3vw', backgroundColor: 'rgba(79,127,255,0.2)', border: '1px solid rgba(79,127,255,0.4)', flexShrink: 0, marginTop: '0.3vh' }} />
              <p style={{ fontSize: '1.6vw', fontWeight: 400, color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: 1.4 }}>iOS, Android, and Web from a single codebase</p>
            </div>
            <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
              <div style={{ width: '1.4vw', height: '1.4vw', borderRadius: '0.3vw', backgroundColor: 'rgba(79,127,255,0.2)', border: '1px solid rgba(79,127,255,0.4)', flexShrink: 0, marginTop: '0.3vh' }} />
              <p style={{ fontSize: '1.6vw', fontWeight: 400, color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: 1.4 }}>Stateless JWT auth — no sessions, scales horizontally</p>
            </div>
            <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
              <div style={{ width: '1.4vw', height: '1.4vw', borderRadius: '0.3vw', backgroundColor: 'rgba(79,127,255,0.2)', border: '1px solid rgba(79,127,255,0.4)', flexShrink: 0, marginTop: '0.3vh' }} />
              <p style={{ fontSize: '1.6vw', fontWeight: 400, color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: 1.4 }}>AI layer swappable — not locked to a single provider</p>
            </div>
          </div>
        </div>

        {/* Right — stack cards */}
        <div style={{ width: '32vw', display: 'flex', flexDirection: 'column', gap: '1.4vh' }}>
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(79,127,255,0.22)', borderRadius: '0.8vw', padding: '1.8vh 1.8vw', display: 'flex', alignItems: 'center', gap: '1.5vw' }}>
            <div style={{ width: '2.8vw', height: '2.8vw', borderRadius: '0.5vw', backgroundColor: 'rgba(79,127,255,0.18)', border: '1px solid rgba(79,127,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: '#4F7FFF' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.3vw', fontWeight: 700 }}>React Native / Expo</div>
              <div style={{ fontSize: '1.1vw', color: 'rgba(255,255,255,0.45)' }}>iOS · Android · Web</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.8vw', padding: '1.8vh 1.8vw', display: 'flex', alignItems: 'center', gap: '1.5vw' }}>
            <div style={{ width: '2.8vw', height: '2.8vw', borderRadius: '0.5vw', backgroundColor: 'rgba(124,107,240,0.15)', border: '1px solid rgba(124,107,240,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '0.2vw', backgroundColor: '#7C6BF0' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.3vw', fontWeight: 700 }}>Node.js / Express / TypeScript</div>
              <div style={{ fontSize: '1.1vw', color: 'rgba(255,255,255,0.45)' }}>REST API backend</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.8vw', padding: '1.8vh 1.8vw', display: 'flex', alignItems: 'center', gap: '1.5vw' }}>
            <div style={{ width: '2.8vw', height: '2.8vw', borderRadius: '0.5vw', backgroundColor: 'rgba(39,201,63,0.1)', border: '1px solid rgba(39,201,63,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: '1.2vw', height: '0.8vw', borderRadius: '0.15vw', backgroundColor: '#27C93F' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.3vw', fontWeight: 700 }}>PostgreSQL</div>
              <div style={{ fontSize: '1.1vw', color: 'rgba(255,255,255,0.45)' }}>Users · places · groups · moves</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.8vw', padding: '1.8vh 1.8vw', display: 'flex', alignItems: 'center', gap: '1.5vw' }}>
            <div style={{ width: '2.8vw', height: '2.8vw', borderRadius: '0.5vw', backgroundColor: 'rgba(255,190,80,0.1)', border: '1px solid rgba(255,190,80,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(255,190,80,0.9)' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.3vw', fontWeight: 700 }}>OpenAI API</div>
              <div style={{ fontSize: '1.1vw', color: 'rgba(255,255,255,0.45)' }}>Natural language plan generation</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.8vw', padding: '1.8vh 1.8vw', display: 'flex', alignItems: 'center', gap: '1.5vw' }}>
            <div style={{ width: '2.8vw', height: '2.8vw', borderRadius: '0.5vw', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '0.2vw', backgroundColor: 'rgba(255,255,255,0.35)' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.3vw', fontWeight: 700 }}>Google Places API</div>
              <div style={{ fontSize: '1.1vw', color: 'rgba(255,255,255,0.45)' }}>Real-time place search and enrichment</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>09 / 10</div>
    </div>
  );
}
