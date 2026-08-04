export default function Slide6Market() {
  const funnel = [
    { label: 'US adults 20–35', value: '67M', sub: 'Census 2024', color: 'rgba(255,255,255,0.55)', bar: 1 },
    { label: 'Save places & plan group outings', value: '40M', sub: '60% filter — active planners only', color: '#4F7FFF', bar: 0.6 },
    { label: 'Would adopt MOVES', value: '16M', sub: '40% of SAM — discounted from 80% survey intent', color: '#7C6BF0', bar: 0.24 },
    { label: '3-year target (5% penetration)', value: '800K', sub: 'Conservative for a well-distributed app', color: '#27C93F', bar: 0.065 },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '5vh', left: '25vw', width: '40vw', height: '40vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.06, filter: 'blur(12vw)' }} />
      <div style={{ position: 'absolute', bottom: '-10vh', right: '5vw', width: '35vw', height: '35vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.05, filter: 'blur(9vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />

      {/* Header bar */}
      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', height: '100%', paddingTop: '12vh', paddingBottom: '9vh', paddingLeft: '5vw', paddingRight: '5vw', gap: '4vw', boxSizing: 'border-box' }}>

        {/* LEFT — funnel */}
        <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.85vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'flex-start', marginBottom: '2vh' }}>
            Market Opportunity · Bottoms-Up
          </div>
          <h2 style={{ fontSize: '3.2vw', fontWeight: 800, margin: '0 0 0.8vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            800K reachable users<br /><span style={{ color: '#4F7FFF' }}>in 3 years, US only</span>
          </h2>
          <p style={{ fontSize: '1.2vw', fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: '0 0 3vh 0' }}>
            UK, Canada, and Australia add a comparable second market
          </p>

          {/* Funnel bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4vh' }}>
            {funnel.map((row, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5vh' }}>
                  <span style={{ fontSize: '1vw', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: '1.4vw', fontWeight: 800, color: row.color }}>{row.value}</span>
                </div>
                <div style={{ width: '100%', height: '0.5vh', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '0.3vw', overflow: 'hidden' }}>
                  <div style={{ width: `${row.bar * 100}%`, height: '100%', backgroundColor: row.color, borderRadius: '0.3vw', opacity: 0.8 }} />
                </div>
                <div style={{ fontSize: '0.78vw', color: 'rgba(255,255,255,0.32)', marginTop: '0.3vh' }}>{row.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — revenue math */}
        <div style={{ flex: 0.9, display: 'flex', flexDirection: 'column', gap: '1.8vh', justifyContent: 'center' }}>

          {/* Per-user math card */}
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(79,127,255,0.25)', borderRadius: '1vw', padding: '2.2vh 2vw', boxShadow: '0 1.5vh 4vh rgba(79,127,255,0.08)' }}>
            <div style={{ fontSize: '0.78vw', fontWeight: 600, color: '#4F7FFF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.4vh' }}>Revenue per active user / year</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8vh', marginBottom: '1.5vh' }}>
              {[
                ['Avg group bill', '$168', '4 people × $42 avg spend'],
                ['Outings / month', '2', 'Survey median'],
                ['Commission rate', '5%', 'OpenTable-comparable'],
                ['Venue coverage', '40%', 'Partnered venues at launch'],
              ].map(([label, val, note]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.8vw' }}>
                  <span style={{ fontSize: '0.95vw', color: 'rgba(255,255,255,0.5)', flex: 1 }}>{label}</span>
                  <span style={{ fontSize: '1vw', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{val}</span>
                  <span style={{ fontSize: '0.75vw', color: 'rgba(255,255,255,0.28)', width: '9vw', textAlign: 'right' }}>{note}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.2vh', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1vw', color: 'rgba(255,255,255,0.6)' }}>Annual revenue / user</span>
              <span style={{ fontSize: '2.2vw', fontWeight: 800, color: '#4F7FFF' }}>~$80</span>
            </div>
          </div>

          {/* Milestone table */}
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1vw', padding: '2vh 2vw' }}>
            <div style={{ fontSize: '0.78vw', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.2vh' }}>Revenue milestones</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9vh' }}>
              {[
                { users: '100K', rev: '$8M', highlight: false },
                { users: '400K', rev: '$32M', highlight: false },
                { users: '800K', rev: '$64M', highlight: true },
              ].map(row => (
                <div key={row.users} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9vh 1vw', backgroundColor: row.highlight ? 'rgba(79,127,255,0.1)' : 'rgba(255,255,255,0.025)', border: `1px solid ${row.highlight ? 'rgba(79,127,255,0.25)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '0.5vw' }}>
                  <span style={{ fontSize: '1vw', color: 'rgba(255,255,255,0.6)' }}>{row.users} active users</span>
                  <span style={{ fontSize: '1.3vw', fontWeight: 800, color: row.highlight ? '#4F7FFF' : 'rgba(255,255,255,0.75)' }}>{row.rev} ARR</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.82vw', color: 'rgba(255,255,255,0.28)', lineHeight: 1.5 }}>
            Commission-only model. MOVES+ ($3.99/mo for 100+ saves) layers on top<br />as a secondary revenue stream for power users.
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>06 / 10</div>
    </div>
  );
}
