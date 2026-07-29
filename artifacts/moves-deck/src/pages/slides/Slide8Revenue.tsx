export default function Slide8Revenue() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '-10vh', left: '20vw', width: '45vw', height: '45vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.06, filter: 'blur(12vw)' }} />
      <div style={{ position: 'absolute', bottom: '-15vh', right: '5vw', width: '38vw', height: '38vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.05, filter: 'blur(9vw)' }} />
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
            Revenue Drivers
          </div>
          <h2 style={{ fontSize: '3.8vw', fontWeight: 800, margin: '0 0 1vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>Venue partnerships drive the business</h2>
          <p style={{ fontSize: '1.5vw', fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: 0 }}>MOVES is free for most users — venues pay to reach highly-intent audiences</p>
        </div>

        {/* Two-column layout — venue partnerships hero on left */}
        <div style={{ display: 'flex', gap: '2.5vw', width: '100%', alignItems: 'stretch' }}>

          {/* MAIN: Venue Partnerships */}
          <div style={{ flex: 1.6, backgroundColor: '#131726', border: '1px solid rgba(79,127,255,0.32)', borderRadius: '1.2vw', padding: '3.5vh 3vw', boxShadow: '0 2vh 6vh rgba(79,127,255,0.14)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '3vh' }}>
              <div>
                <div style={{ fontSize: '0.85vw', fontWeight: 600, color: '#4F7FFF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8vh' }}>Primary Revenue · B2B</div>
                <div style={{ fontSize: '2.2vw', fontWeight: 700, lineHeight: 1.15 }}>Venue Partnerships</div>
              </div>
              <div style={{ padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.15)', border: '1px solid rgba(79,127,255,0.3)', borderRadius: '0.5vw', fontSize: '1.1vw', fontWeight: 700, color: '#4F7FFF', whiteSpace: 'nowrap' }}>Rev share + CPM</div>
            </div>

            {/* Event feed example */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.8vw', padding: '2vh 2vw', marginBottom: '3vh' }}>
              <div style={{ fontSize: '0.85vw', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.5vh' }}>Home Feed — Event surfaced from a saved place</div>
              <div style={{ backgroundColor: '#0C0F1A', border: '1px solid rgba(79,127,255,0.25)', borderRadius: '0.6vw', padding: '1.5vh 1.5vw', display: 'flex', gap: '1.5vw', alignItems: 'center' }}>
                <div style={{ width: '3.5vw', height: '3.5vw', backgroundColor: 'rgba(79,127,255,0.2)', borderRadius: '0.5vw', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '1.5vw', height: '1.5vw', backgroundColor: '#4F7FFF', borderRadius: '50%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8vw', marginBottom: '0.4vh' }}>
                    <span style={{ fontSize: '1.25vw', fontWeight: 700 }}>Sommelier's Table Pop-Up</span>
                    <span style={{ fontSize: '0.8vw', fontWeight: 600, padding: '0.2vh 0.6vw', backgroundColor: 'rgba(79,127,255,0.2)', border: '1px solid rgba(79,127,255,0.4)', borderRadius: '0.3vw', color: '#4F7FFF' }}>MOVES PICK</span>
                  </div>
                  <div style={{ fontSize: '1.05vw', color: 'rgba(255,255,255,0.5)' }}>Maison Premiere · Williamsburg · Sat 7 PM – 11 PM</div>
                  <div style={{ fontSize: '1.05vw', color: 'rgba(255,255,255,0.65)', marginTop: '0.4vh' }}>You saved this spot in April. They're hosting a ticketed wine dinner this weekend.</div>
                </div>
              </div>
            </div>

            {/* Three revenue pillars */}
            <div style={{ display: 'flex', gap: '1.5vw' }}>
              <div style={{ flex: 1, backgroundColor: 'rgba(79,127,255,0.07)', border: '1px solid rgba(79,127,255,0.15)', borderRadius: '0.7vw', padding: '1.8vh 1.5vw' }}>
                <div style={{ fontSize: '1vw', fontWeight: 700, color: '#4F7FFF', marginBottom: '0.8vh' }}>Event Promotion</div>
                <div style={{ fontSize: '1.2vw', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>Venues pay to surface events to users who've already saved their spot — highest-intent audience possible</div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'rgba(79,127,255,0.07)', border: '1px solid rgba(79,127,255,0.15)', borderRadius: '0.7vw', padding: '1.8vh 1.5vw' }}>
                <div style={{ fontSize: '1vw', fontWeight: 700, color: '#4F7FFF', marginBottom: '0.8vh' }}>MOVES Pick Badge</div>
                <div style={{ fontSize: '1.2vw', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>Sponsored placement in AI-generated itineraries and search results, labeled transparently</div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'rgba(79,127,255,0.07)', border: '1px solid rgba(79,127,255,0.15)', borderRadius: '0.7vw', padding: '1.8vh 1.5vw' }}>
                <div style={{ fontSize: '1vw', fontWeight: 700, color: '#4F7FFF', marginBottom: '0.8vh' }}>Booking Commission</div>
                <div style={{ fontSize: '1.2vw', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>10% commission on reservations and ticket sales driven through the app</div>
              </div>
            </div>
          </div>

          {/* SECONDARY: MOVES+ subscription */}
          <div style={{ flex: 0.9, backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.2vw', padding: '3.5vh 2.5vw', boxShadow: '0 2vh 4vh rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8vh' }}>Secondary · Consumer</div>
            <div style={{ fontSize: '2.2vw', fontWeight: 700, marginBottom: '0.5vh', lineHeight: 1.15 }}>MOVES+</div>
            <div style={{ fontSize: '4.5vw', fontWeight: 800, color: '#7C6BF0', lineHeight: 1, marginBottom: '0.4vh' }}>$5</div>
            <div style={{ fontSize: '1.2vw', color: 'rgba(255,255,255,0.45)', marginBottom: '3vh' }}>per month</div>

            <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '3vh' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh', flex: 1 }}>
              {/* Free tier */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.6vw', padding: '1.5vh 1.5vw' }}>
                <div style={{ fontSize: '1vw', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '0.6vh' }}>Free tier</div>
                <div style={{ fontSize: '1.25vw', fontWeight: 500 }}>Save up to 50 places</div>
                <div style={{ fontSize: '1.1vw', color: 'rgba(255,255,255,0.45)', marginTop: '0.3vh' }}>Unlimited Move generation</div>
              </div>
              {/* Plus tier */}
              <div style={{ backgroundColor: 'rgba(124,107,240,0.1)', border: '1px solid rgba(124,107,240,0.28)', borderRadius: '0.6vw', padding: '1.5vh 1.5vw' }}>
                <div style={{ fontSize: '1vw', fontWeight: 600, color: '#7C6BF0', marginBottom: '0.6vh' }}>MOVES+ — $5/mo</div>
                <div style={{ fontSize: '1.25vw', fontWeight: 500 }}>Unlimited places</div>
                <div style={{ fontSize: '1.1vw', color: 'rgba(255,255,255,0.55)', marginTop: '0.3vh', lineHeight: 1.4 }}>For power users who want to build a full personal library beyond 50 spots</div>
              </div>
            </div>

            <div style={{ marginTop: '3vh', fontSize: '1.1vw', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              Keeps MOVES free for most users while monetizing heavy savers — low churn, high LTV.
            </div>
          </div>

        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>08 / 10</div>
    </div>
  );
}
