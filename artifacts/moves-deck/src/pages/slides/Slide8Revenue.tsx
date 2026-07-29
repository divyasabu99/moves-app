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
          <h2 style={{ fontSize: '3.8vw', fontWeight: 800, margin: '0 0 1vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>Three compounding revenue streams</h2>
          <p style={{ fontSize: '1.5vw', fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Consumer subscriptions anchor the model — venue revenue scales with the network</p>
        </div>

        {/* Revenue columns */}
        <div style={{ display: 'flex', gap: '2.5vw', width: '100%' }}>
          {/* MOVES Pro */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(79,127,255,0.3)', borderRadius: '1.2vw', padding: '3vh 2.5vw', boxShadow: '0 2vh 5vh rgba(79,127,255,0.12)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: '#4F7FFF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1vh' }}>Subscription</div>
            <div style={{ fontSize: '2vw', fontWeight: 700, marginBottom: '0.5vh', lineHeight: 1.2 }}>MOVES Pro</div>
            <div style={{ fontSize: '3.5vw', fontWeight: 800, color: '#4F7FFF', lineHeight: 1, marginBottom: '0.5vh' }}>$9.99</div>
            <div style={{ fontSize: '1.2vw', color: 'rgba(255,255,255,0.45)', marginBottom: '2.5vh' }}>per month</div>
            <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '2.5vh' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(79,127,255,0.25)', border: '1px solid rgba(79,127,255,0.5)', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.75)' }}>Unlimited AI plan generation</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(79,127,255,0.25)', border: '1px solid rgba(79,127,255,0.5)', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.75)' }}>Advanced filters and sorting</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(79,127,255,0.25)', border: '1px solid rgba(79,127,255,0.5)', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.75)' }}>Priority Google Maps import</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(79,127,255,0.25)', border: '1px solid rgba(79,127,255,0.5)', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.75)' }}>Ad-free experience</span>
              </div>
            </div>
          </div>

          {/* Group Plans */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(124,107,240,0.3)', borderRadius: '1.2vw', padding: '3vh 2.5vw', boxShadow: '0 2vh 5vh rgba(124,107,240,0.12)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: '#7C6BF0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1vh' }}>Group Subscription</div>
            <div style={{ fontSize: '2vw', fontWeight: 700, marginBottom: '0.5vh', lineHeight: 1.2 }}>Group Plans</div>
            <div style={{ fontSize: '3.5vw', fontWeight: 800, color: '#7C6BF0', lineHeight: 1, marginBottom: '0.5vh' }}>$4.99</div>
            <div style={{ fontSize: '1.2vw', color: 'rgba(255,255,255,0.45)', marginBottom: '2.5vh' }}>per member / month</div>
            <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '2.5vh' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(124,107,240,0.2)', border: '1px solid rgba(124,107,240,0.5)', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.75)' }}>Shared group spot library</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(124,107,240,0.2)', border: '1px solid rgba(124,107,240,0.5)', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.75)' }}>AI plans from pooled taste</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(124,107,240,0.2)', border: '1px solid rgba(124,107,240,0.5)', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.75)' }}>Group itinerary sharing</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(124,107,240,0.2)', border: '1px solid rgba(124,107,240,0.5)', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.75)' }}>Collaborative Move history</span>
              </div>
            </div>
          </div>

          {/* Venue Partnerships */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.2vw', padding: '3vh 2.5vw', boxShadow: '0 2vh 4vh rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.85vw', fontWeight: 600, color: 'rgba(255,190,80,0.9)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1vh' }}>B2B / Revenue Share</div>
            <div style={{ fontSize: '2vw', fontWeight: 700, marginBottom: '0.5vh', lineHeight: 1.2 }}>Venue Partners</div>
            <div style={{ fontSize: '3.5vw', fontWeight: 800, color: 'rgba(255,190,80,0.9)', lineHeight: 1, marginBottom: '0.5vh' }}>10%</div>
            <div style={{ fontSize: '1.2vw', color: 'rgba(255,255,255,0.45)', marginBottom: '2.5vh' }}>booking commission</div>
            <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '2.5vh' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(255,190,80,0.12)', border: '1px solid rgba(255,190,80,0.35)', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.75)' }}>Sponsored placement in results</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(255,190,80,0.12)', border: '1px solid rgba(255,190,80,0.35)', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.75)' }}>Reservation booking fees</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(255,190,80,0.12)', border: '1px solid rgba(255,190,80,0.35)', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.75)' }}>Featured "MOVES Pick" badge</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                <div style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', backgroundColor: 'rgba(255,190,80,0.12)', border: '1px solid rgba(255,190,80,0.35)', flexShrink: 0 }} />
                <span style={{ fontSize: '1.35vw', color: 'rgba(255,255,255,0.75)' }}>Venue analytics dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>08 / 10</div>
    </div>
  );
}
