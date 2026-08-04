export default function SlideTraction() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '-10vh', left: '20vw', width: '45vw', height: '45vw', borderRadius: '50%', backgroundColor: '#27C93F', opacity: 0.05, filter: 'blur(12vw)' }} />
      <div style={{ position: 'absolute', bottom: '-15vh', right: '5vw', width: '35vw', height: '35vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.05, filter: 'blur(9vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', height: '100%', paddingTop: '12vh', paddingBottom: '9vh', paddingLeft: '5vw', paddingRight: '5vw', gap: '4vw', boxSizing: 'border-box' }}>

        {/* LEFT — header + survey stats */}
        <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(39,201,63,0.12)', border: '1px solid rgba(39,201,63,0.3)', borderRadius: '2vw', color: '#27C93F', fontSize: '0.85vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'flex-start', marginBottom: '2vh' }}>
            Traction
          </div>
          <h2 style={{ fontSize: '3.2vw', fontWeight: 800, margin: '0 0 0.8vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            The problem is real.<br /><span style={{ color: '#27C93F' }}>The demand is validated.</span>
          </h2>
          <p style={{ fontSize: '1.2vw', fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: '0 0 3vh 0', lineHeight: 1.5 }}>
            Survey of 20–35 year-olds in NYC conducted Aug 2026
          </p>

          {/* Big stats */}
          <div style={{ display: 'flex', gap: '2vw', marginBottom: '3vh' }}>
            {[
              { val: '9 / 10', label: 'save places digitally', sub: 'Maps, IG, TikTok, notes' },
              { val: '80%', label: 'positive reaction to Moves', sub: 'discounted to 40% for real-world adoption' },
              { val: '4', label: 'avg group size', sub: 'per outing, per survey' },
            ].map(s => (
              <div key={s.val} style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(39,201,63,0.2)', borderRadius: '0.9vw', padding: '2vh 1.5vw', textAlign: 'center' }}>
                <div style={{ fontSize: '2.8vw', fontWeight: 800, color: '#27C93F', lineHeight: 1, marginBottom: '0.5vh' }}>{s.val}</div>
                <div style={{ fontSize: '1vw', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.3vh' }}>{s.label}</div>
                <div style={{ fontSize: '0.82vw', color: 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Additional validation rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
            {[
              { icon: '◉', label: 'Working prototype', detail: 'Full iOS/Android app live — save, plan, and group features built and running' },
              { icon: '◉', label: 'Venue partnerships', detail: 'Planning stage — venue outreach launching alongside product launch in NYC' },
              { icon: '◉', label: 'Waitlist', detail: '50 early sign-ups ahead of launch' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.7vw', padding: '1.2vh 1.4vw' }}>
                <span style={{ fontSize: '0.7vw', color: '#27C93F', marginTop: '0.4vh', flexShrink: 0 }}>{r.icon}</span>
                <div>
                  <span style={{ fontSize: '1.05vw', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{r.label} </span>
                  <span style={{ fontSize: '1.05vw', fontWeight: 300, color: 'rgba(255,255,255,0.45)' }}>— {r.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — quote card + insight */}
        <div style={{ flex: 0.85, display: 'flex', flexDirection: 'column', gap: '2vh', justifyContent: 'center' }}>

          {/* Pull quote */}
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(79,127,255,0.25)', borderRadius: '1vw', padding: '2.5vh 2.5vw', boxShadow: '0 1.5vh 4vh rgba(79,127,255,0.08)' }}>
            <div style={{ fontSize: '1.5vw', color: '#4F7FFF', fontWeight: 700, marginBottom: '1.5vh', lineHeight: 1 }}>"</div>
            <p style={{ fontSize: '1.35vw', fontWeight: 400, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55, margin: '0 0 2vh 0', fontStyle: 'italic' }}>
              "I have like 200 places saved on Google Maps and I've been to maybe 10 of them. Every time we try to plan something we just end up at the same spots."
            </p>
            <div style={{ fontSize: '0.88vw', color: 'rgba(255,255,255,0.35)' }}>— Survey respondent, 27, NYC</div>
          </div>

          {/* Key insight card */}
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1vw', padding: '2.2vh 2.2vw' }}>
            <div style={{ fontSize: '0.78vw', fontWeight: 600, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.2vh' }}>Key insight from survey</div>
            <p style={{ fontSize: '1.25vw', color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, margin: 0 }}>
              The "where should we go?" conversation happens <strong style={{ color: '#FFFFFF' }}>at least twice a month</strong> for 7 in 10 respondents — and takes over 30 minutes to resolve more than half the time.
            </p>
          </div>

          <div style={{ fontSize: '0.82vw', color: 'rgba(255,255,255,0.25)', lineHeight: 1.5, paddingLeft: '0.5vw' }}>
            Survey conducted informally. Replace with formal study or app analytics once available.
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>06 / 11</div>
    </div>
  );
}
