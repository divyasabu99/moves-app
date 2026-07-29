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

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', width: '90vw', marginLeft: '5vw', height: '100%', gap: '6vw' }}>
        {/* Left text */}
        <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.88vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'flex-start', marginBottom: '2.5vh' }}>
            The Solution
          </div>
          <h2 style={{ fontSize: '3.8vw', fontWeight: 800, margin: '0 0 2.5vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>Your city. Your vibe.<br /><span style={{ color: '#4F7FFF' }}>AI-curated.</span></h2>
          <p style={{ fontSize: '1.7vw', fontWeight: 300, color: 'rgba(255,255,255,0.65)', margin: '0 0 4vh 0', lineHeight: 1.55, maxWidth: '38vw' }}>
            MOVES learns your favorite spots, understands your crew's vibe, and builds the perfect night — automatically.
          </p>
          {/* Bullet 1 */}
          <div style={{ display: 'flex', gap: '1.2vw', marginBottom: '2.2vh', alignItems: 'flex-start' }}>
            <div style={{ width: '1.4vw', height: '1.4vw', borderRadius: '0.3vw', backgroundColor: 'rgba(79,127,255,0.2)', border: '1px solid rgba(79,127,255,0.4)', flexShrink: 0, marginTop: '0.3vh' }} />
            <p style={{ fontSize: '1.7vw', fontWeight: 400, color: 'rgba(255,255,255,0.82)', margin: 0, lineHeight: 1.4 }}>Save your go-to spots, organized by category</p>
          </div>
          {/* Bullet 2 */}
          <div style={{ display: 'flex', gap: '1.2vw', marginBottom: '2.2vh', alignItems: 'flex-start' }}>
            <div style={{ width: '1.4vw', height: '1.4vw', borderRadius: '0.3vw', backgroundColor: 'rgba(79,127,255,0.2)', border: '1px solid rgba(79,127,255,0.4)', flexShrink: 0, marginTop: '0.3vh' }} />
            <p style={{ fontSize: '1.7vw', fontWeight: 400, color: 'rgba(255,255,255,0.82)', margin: 0, lineHeight: 1.4 }}>Set the vibe: occasion, size, budget, and start time</p>
          </div>
          {/* Bullet 3 */}
          <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
            <div style={{ width: '1.4vw', height: '1.4vw', borderRadius: '0.3vw', backgroundColor: 'rgba(79,127,255,0.2)', border: '1px solid rgba(79,127,255,0.4)', flexShrink: 0, marginTop: '0.3vh' }} />
            <p style={{ fontSize: '1.7vw', fontWeight: 400, color: 'rgba(255,255,255,0.82)', margin: 0, lineHeight: 1.4 }}>Receive a time-slotted itinerary, ready to share with your crew</p>
          </div>
        </div>

        {/* Right — phone wireframe mock */}
        <div style={{ width: '28vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '22vw', height: '62vh', backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2vw', boxShadow: '0 3vh 6vh rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Phone top bar */}
            <div style={{ padding: '1.8vw 1.8vw 1.2vw', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5vw' }}>
              <div style={{ width: '0.7vw', height: '0.7vw', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
              <div style={{ width: '0.7vw', height: '0.7vw', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
              <div style={{ width: '0.7vw', height: '0.7vw', borderRadius: '50%', backgroundColor: '#27C93F' }} />
              <div style={{ flex: 1, textAlign: 'center', fontSize: '0.9vw', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Friday Night Plan</div>
            </div>
            {/* AI result rows */}
            <div style={{ flex: 1, padding: '1.5vw', display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
              <div style={{ fontSize: '0.85vw', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5vh' }}>Your Move — 3 stops</div>
              <div style={{ backgroundColor: 'rgba(79,127,255,0.1)', border: '1px solid rgba(79,127,255,0.2)', borderRadius: '0.7vw', padding: '1.2vw' }}>
                <div style={{ fontSize: '0.85vw', color: '#4F7FFF', fontWeight: 600, marginBottom: '0.4vh' }}>7:00 PM — Dinner</div>
                <div style={{ fontSize: '1vw', fontWeight: 600, color: '#FFFFFF' }}>Don Angie</div>
                <div style={{ fontSize: '0.85vw', color: 'rgba(255,255,255,0.45)' }}>West Village · Italian · $$</div>
              </div>
              <div style={{ backgroundColor: 'rgba(124,107,240,0.1)', border: '1px solid rgba(124,107,240,0.2)', borderRadius: '0.7vw', padding: '1.2vw' }}>
                <div style={{ fontSize: '0.85vw', color: '#7C6BF0', fontWeight: 600, marginBottom: '0.4vh' }}>9:30 PM — Drinks</div>
                <div style={{ fontSize: '1vw', fontWeight: 600, color: '#FFFFFF' }}>attaboy</div>
                <div style={{ fontSize: '0.85vw', color: 'rgba(255,255,255,0.45)' }}>LES · Cocktail Bar · $$$</div>
              </div>
              <div style={{ backgroundColor: 'rgba(39,201,63,0.08)', border: '1px solid rgba(39,201,63,0.18)', borderRadius: '0.7vw', padding: '1.2vw' }}>
                <div style={{ fontSize: '0.85vw', color: '#27C93F', fontWeight: 600, marginBottom: '0.4vh' }}>11:30 PM — Late Night</div>
                <div style={{ fontSize: '1vw', fontWeight: 600, color: '#FFFFFF' }}>Elsewhere</div>
                <div style={{ fontSize: '0.85vw', color: 'rgba(255,255,255,0.45)' }}>Bushwick · Venue · $</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>03 / 10</div>
    </div>
  );
}
