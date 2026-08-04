export default function Slide5HowItWorks() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '10vh', left: '20vw', width: '40vw', height: '40vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.06, filter: 'blur(12vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '15vh', paddingLeft: '5vw', paddingRight: '5vw' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '6vh' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.88vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2vh' }}>
            How It Works
          </div>
          <h2 style={{ fontSize: '3.8vw', fontWeight: 800, margin: '0 0 1.5vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>Three steps to a perfect night</h2>
          <p style={{ fontSize: '1.6vw', fontWeight: 300, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.4 }}>From saved spot to shared itinerary in under 60 seconds</p>
        </div>

        {/* Step cards */}
        <div style={{ display: 'flex', gap: '2vw', width: '100%', alignItems: 'stretch', position: 'relative' }}>
          {/* Connector line */}
          <div style={{ position: 'absolute', top: '5vh', left: '17vw', right: '17vw', height: '1px', backgroundColor: 'rgba(79,127,255,0.25)', zIndex: 0 }} />

          {/* Step 1 */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.2vw', padding: '3vh 2.5vw', boxShadow: '0 2vh 4vh rgba(0,0,0,0.35)', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '4vw', height: '4vw', borderRadius: '50%', backgroundColor: '#4F7FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5vh', boxShadow: '0 1vh 2vh rgba(79,127,255,0.3)' }}>
              <span style={{ fontSize: '1.6vw', fontWeight: 800, color: '#FFFFFF' }}>01</span>
            </div>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: '#4F7FFF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1vh' }}>Save</div>
            <div style={{ fontSize: '2vw', fontWeight: 700, marginBottom: '1.5vh', lineHeight: 1.2 }}>Build Your Library</div>
            <p style={{ fontSize: '1.45vw', fontWeight: 400, color: 'rgba(255,255,255,0.62)', lineHeight: 1.55, margin: 0 }}>Search Google Places or import from your existing lists. Tag each spot by category — Dinner, Drinks, Late Night, Brunch.</p>
          </div>

          {/* Step 2 */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(124,107,240,0.3)', borderRadius: '1.2vw', padding: '3vh 2.5vw', boxShadow: '0 2vh 5vh rgba(124,107,240,0.15)', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '4vw', height: '4vw', borderRadius: '50%', backgroundColor: '#7C6BF0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5vh', boxShadow: '0 1vh 2vh rgba(124,107,240,0.35)' }}>
              <span style={{ fontSize: '1.6vw', fontWeight: 800, color: '#FFFFFF' }}>02</span>
            </div>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: '#7C6BF0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1vh' }}>Plan</div>
            <div style={{ fontSize: '2vw', fontWeight: 700, marginBottom: '1.5vh', lineHeight: 1.2 }}>Set Your Vibe</div>
            <p style={{ fontSize: '1.45vw', fontWeight: 400, color: 'rgba(255,255,255,0.62)', lineHeight: 1.55, margin: 0 }}>Choose occasion, party size, budget, neighborhood, and start time — or just type what you're feeling in natural language.</p>
          </div>

          {/* Step 3 */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.2vw', padding: '3vh 2.5vw', boxShadow: '0 2vh 4vh rgba(0,0,0,0.35)', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '4vw', height: '4vw', borderRadius: '50%', backgroundColor: 'rgba(79,127,255,0.2)', border: '2px solid #4F7FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5vh' }}>
              <span style={{ fontSize: '1.6vw', fontWeight: 800, color: '#4F7FFF' }}>03</span>
            </div>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1vh' }}>Go</div>
            <div style={{ fontSize: '2vw', fontWeight: 700, marginBottom: '1.5vh', lineHeight: 1.2 }}>Your Night, Built</div>
            <p style={{ fontSize: '1.45vw', fontWeight: 400, color: 'rgba(255,255,255,0.62)', lineHeight: 1.55, margin: 0 }}>MOVES returns a time-slotted itinerary from your own places, optimized for flow, distance, and vibe. Share with one tap.</p>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>05 / 11</div>
    </div>
  );
}
