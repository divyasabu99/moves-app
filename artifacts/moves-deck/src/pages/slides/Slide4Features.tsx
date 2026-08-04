export default function Slide4Features() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '-15vh', left: '20vw', width: '40vw', height: '40vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.06, filter: 'blur(10vw)' }} />
      <div style={{ position: 'absolute', bottom: '-20vh', right: '5vw', width: '45vw', height: '45vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.05, filter: 'blur(9vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '15vh', paddingBottom: '12vh', paddingLeft: '5vw', paddingRight: '5vw' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '5vh' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.88vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2vh' }}>
            Product
          </div>
          <h2 style={{ fontSize: '3.8vw', fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-0.03em' }}>Three tabs. One perfect night.</h2>
        </div>

        {/* Three columns */}
        <div style={{ display: 'flex', gap: '2.5vw', width: '100%' }}>
          {/* Plan */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(79,127,255,0.25)', borderRadius: '1.2vw', padding: '3vh 2.5vw', boxShadow: '0 2vh 4vh rgba(0,0,0,0.35)' }}>
            <div style={{ width: '3.5vw', height: '3.5vw', backgroundColor: 'rgba(79,127,255,0.18)', border: '1px solid rgba(79,127,255,0.35)', borderRadius: '0.8vw', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5vh' }}>
              <div style={{ width: '1.5vw', height: '1.5vw', backgroundColor: '#4F7FFF', borderRadius: '0.3vw' }} />
            </div>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: '#4F7FFF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1vh' }}>Plan Tab</div>
            <div style={{ fontSize: '2vw', fontWeight: 700, marginBottom: '1.5vh', lineHeight: 1.2 }}>AI Itinerary Builder</div>
            <div style={{ fontSize: '1.45vw', fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '2.5vh' }}>Generate complete nights out from a form or plain-text chat prompt.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '0.35vw', height: '0.35vw', borderRadius: '50%', backgroundColor: '#4F7FFF', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.72)' }}>Structured form mode</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '0.35vw', height: '0.35vw', borderRadius: '50%', backgroundColor: '#4F7FFF', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.72)' }}>Natural language chat</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '0.35vw', height: '0.35vw', borderRadius: '50%', backgroundColor: '#4F7FFF', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.72)' }}>Time-slotted routing</span>
              </div>
            </div>
          </div>

          {/* Places */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(124,107,240,0.25)', borderRadius: '1.2vw', padding: '3vh 2.5vw', boxShadow: '0 2vh 4vh rgba(0,0,0,0.35)' }}>
            <div style={{ width: '3.5vw', height: '3.5vw', backgroundColor: 'rgba(124,107,240,0.18)', border: '1px solid rgba(124,107,240,0.35)', borderRadius: '0.8vw', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5vh' }}>
              <div style={{ width: '1.5vw', height: '1.5vw', backgroundColor: '#7C6BF0', borderRadius: '50%' }} />
            </div>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: '#7C6BF0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1vh' }}>Places Tab</div>
            <div style={{ fontSize: '2vw', fontWeight: 700, marginBottom: '1.5vh', lineHeight: 1.2 }}>Personal Spot Library</div>
            <div style={{ fontSize: '1.45vw', fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '2.5vh' }}>Search, save, and curate your favorite NYC venues in one place.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '0.35vw', height: '0.35vw', borderRadius: '50%', backgroundColor: '#7C6BF0', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.72)' }}>Category, cuisine, rating filters</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '0.35vw', height: '0.35vw', borderRadius: '50%', backgroundColor: '#7C6BF0', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.72)' }}>Map + list view toggle</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '0.35vw', height: '0.35vw', borderRadius: '50%', backgroundColor: '#7C6BF0', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.72)' }}>Google Maps bulk import</span>
              </div>
            </div>
          </div>

          {/* Groups */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(39,201,63,0.22)', borderRadius: '1.2vw', padding: '3vh 2.5vw', boxShadow: '0 2vh 4vh rgba(0,0,0,0.35)' }}>
            <div style={{ width: '3.5vw', height: '3.5vw', backgroundColor: 'rgba(39,201,63,0.12)', border: '1px solid rgba(39,201,63,0.28)', borderRadius: '0.8vw', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5vh' }}>
              <div style={{ width: '0.5vw', height: '0.5vw', borderRadius: '50%', backgroundColor: '#27C93F' }} />
            </div>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: '#27C93F', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1vh' }}>Groups</div>
            <div style={{ fontSize: '2vw', fontWeight: 700, marginBottom: '1.5vh', lineHeight: 1.2 }}>Crew Collaboration</div>
            <div style={{ fontSize: '1.45vw', fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '2.5vh' }}>Create or join a group — pool spots and plan nights together.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '0.35vw', height: '0.35vw', borderRadius: '50%', backgroundColor: '#27C93F', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.72)' }}>Invite via shareable code</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '0.35vw', height: '0.35vw', borderRadius: '50%', backgroundColor: '#27C93F', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.72)' }}>Pooled member spot libraries</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '0.35vw', height: '0.35vw', borderRadius: '50%', backgroundColor: '#27C93F', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.72)' }}>Shared Move history</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>04 / 12</div>
    </div>
  );
}
