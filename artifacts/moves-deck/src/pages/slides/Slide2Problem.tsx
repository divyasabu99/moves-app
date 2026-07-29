export default function Slide2Problem() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      {/* BG glows */}
      <div style={{ position: 'absolute', top: '-20vh', right: '-10vw', width: '50vw', height: '50vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.05, filter: 'blur(8vw)' }} />
      <div style={{ position: 'absolute', bottom: '-25vh', left: '-12vw', width: '55vw', height: '55vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.05, filter: 'blur(10vw)' }} />
      {/* Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />
      {/* Header */}
      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', width: '90vw', marginLeft: '5vw', height: '100%', gap: '6vw' }}>
        {/* Left */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(255,90,90,0.12)', border: '1px solid rgba(255,90,90,0.28)', borderRadius: '2vw', color: '#FF7070', fontSize: '0.88vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'flex-start', marginBottom: '2.5vh' }}>
            The Problem
          </div>
          <h2 style={{ fontSize: '3.8vw', fontWeight: 800, margin: '0 0 3.5vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>Planning NYC nights<br /><span style={{ color: 'rgba(255,255,255,0.45)' }}>is broken.</span></h2>

          {/* Bullet 1 */}
          <div style={{ display: 'flex', gap: '1.2vw', marginBottom: '2.2vh', alignItems: 'flex-start' }}>
            <div style={{ width: '0.4vw', height: '0.4vw', borderRadius: '50%', backgroundColor: '#FF7070', marginTop: '1.1vh', flexShrink: 0 }} />
            <p style={{ fontSize: '1.8vw', fontWeight: 400, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.4 }}>Infinite venue options, zero curation — discovery is exhausting</p>
          </div>
          {/* Bullet 2 */}
          <div style={{ display: 'flex', gap: '1.2vw', marginBottom: '2.2vh', alignItems: 'flex-start' }}>
            <div style={{ width: '0.4vw', height: '0.4vw', borderRadius: '50%', backgroundColor: '#FF7070', marginTop: '1.1vh', flexShrink: 0 }} />
            <p style={{ fontSize: '1.8vw', fontWeight: 400, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.4 }}>Group chats spiral for hours before anyone decides</p>
          </div>
          {/* Bullet 3 */}
          <div style={{ display: 'flex', gap: '1.2vw', marginBottom: '2.2vh', alignItems: 'flex-start' }}>
            <div style={{ width: '0.4vw', height: '0.4vw', borderRadius: '50%', backgroundColor: '#FF7070', marginTop: '1.1vh', flexShrink: 0 }} />
            <p style={{ fontSize: '1.8vw', fontWeight: 400, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.4 }}>Saved spots scattered across Maps, Yelp, Instagram, notes</p>
          </div>
          {/* Bullet 4 */}
          <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
            <div style={{ width: '0.4vw', height: '0.4vw', borderRadius: '50%', backgroundColor: '#FF7070', marginTop: '1.1vh', flexShrink: 0 }} />
            <p style={{ fontSize: '1.8vw', fontWeight: 400, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.4 }}>No tool connects personal taste with group planning</p>
          </div>
        </div>

        {/* Right — chat chaos mock */}
        <div style={{ width: '30vw', display: 'flex', flexDirection: 'column', gap: '1.8vh' }}>
          {/* Card 1 */}
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1vw', padding: '2vw', boxShadow: '0 2vh 4vh rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '0.9vw', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.5vh' }}>Group Chat — Friday Night</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '2vw', height: '2vw', borderRadius: '50%', backgroundColor: 'rgba(79,127,255,0.3)', flexShrink: 0 }} />
                <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '0.4vw', padding: '0.8vh 1vw', fontSize: '1.1vw', color: 'rgba(255,255,255,0.7)' }}>idk where should we go</div>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '2vw', height: '2vw', borderRadius: '50%', backgroundColor: 'rgba(124,107,240,0.3)', flexShrink: 0 }} />
                <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '0.4vw', padding: '0.8vh 1vw', fontSize: '1.1vw', color: 'rgba(255,255,255,0.7)' }}>maybe that place from last time?</div>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '2vw', height: '2vw', borderRadius: '50%', backgroundColor: 'rgba(255,112,112,0.3)', flexShrink: 0 }} />
                <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '0.4vw', padding: '0.8vh 1vw', fontSize: '1.1vw', color: 'rgba(255,255,255,0.7)' }}>ugh just pick something</div>
              </div>
            </div>
          </div>
          {/* Card 2 */}
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(255,112,112,0.2)', borderRadius: '1vw', padding: '2vw', boxShadow: '0 2vh 4vh rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '0.9vw', fontWeight: 600, color: 'rgba(255,112,112,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.5vh' }}>Result: 2 hours later</div>
            <div style={{ fontSize: '1.6vw', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Still no plan.</div>
            <div style={{ fontSize: '1.2vw', fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginTop: '0.8vh' }}>Night cancelled.</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>02 / 10</div>
    </div>
  );
}
