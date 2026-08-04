export default function SlideCompetition() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '-10vh', right: '-5vw', width: '42vw', height: '42vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.05, filter: 'blur(10vw)' }} />
      <div style={{ position: 'absolute', bottom: '-15vh', left: '-8vw', width: '40vw', height: '40vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.05, filter: 'blur(10vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', paddingTop: '12vh', paddingBottom: '9vh', paddingLeft: '5vw', paddingRight: '5vw', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ marginBottom: '3.5vh' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.85vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.8vh' }}>
            Competitive Landscape
          </div>
          <h2 style={{ fontSize: '3vw', fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Everyone votes on places. <span style={{ color: '#4F7FFF' }}>MOVES votes on complete nights.</span>
          </h2>
        </div>

        {/* Comparison table */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0', minHeight: 0 }}>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr 1.4fr', gap: '0', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '0.8vw 0.8vw 0 0', borderTop: '1px solid rgba(255,255,255,0.08)', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '1.2vh 0' }}>
            <div style={{ padding: '0 1.5vw', fontSize: '0.78vw', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feature</div>
            {[
              { name: 'Google Maps', sub: 'Incumbent' },
              { name: 'Someday', sub: 'Wishlist app' },
              { name: 'Mindtrip', sub: 'Closest rival' },
              { name: 'Stippl', sub: 'Funded · 250K users' },
              { name: 'MOVES', sub: 'Us', highlight: true },
            ].map(col => (
              <div key={col.name} style={{ padding: '0.5vh 1vw', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: col.highlight ? '1vw' : '0.95vw', fontWeight: col.highlight ? 800 : 600, color: col.highlight ? '#4F7FFF' : 'rgba(255,255,255,0.75)' }}>{col.name}</div>
                <div style={{ fontSize: '0.72vw', color: 'rgba(255,255,255,0.3)', marginTop: '0.2vh' }}>{col.sub}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          {[
            {
              label: 'Import Google Maps saves',
              vals: ['Lists only', '✗', 'Partial*', '✗', '✓'],
            },
            {
              label: 'AI builds complete itineraries',
              vals: ['✗', '✗', 'Unverified', '✗', '✓'],
            },
            {
              label: 'Group votes on full plans',
              vals: ['✗', '✗', '✗', '✗', '✓'],
            },
            {
              label: 'Votes on individual places',
              vals: ['Emoji only', '✗', '✗', '✓', '✗'],
            },
            {
              label: 'Local (not just travel)',
              vals: ['✓', '✓', 'Partial', '✓', '✓'],
            },
            {
              label: 'Memory of past outings',
              vals: ['✗', '✗', '✗', 'Basic', '✓'],
            },
          ].map((row, i) => (
            <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr 1.4fr', backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ padding: '1.3vh 1.5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{row.label}</div>
              {row.vals.map((v, j) => {
                const isUs = j === 4;
                const isGood = v === '✓';
                const isBad = v === '✗';
                return (
                  <div key={j} style={{ padding: '1.3vh 1vw', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', backgroundColor: isUs ? 'rgba(79,127,255,0.06)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{
                      fontSize: isGood || isBad ? '1.1vw' : '0.88vw',
                      fontWeight: isUs ? 700 : 400,
                      color: isUs && isGood ? '#4F7FFF' : isGood ? '#27C93F' : isBad ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.45)',
                    }}>{v}</span>
                  </div>
                );
              })}
            </div>
          ))}

          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', borderRadius: '0 0 0.8vw 0.8vw', padding: '1vh 1.5vw' }}>
            <span style={{ fontSize: '0.75vw', color: 'rgba(255,255,255,0.25)' }}>*Mindtrip Google Maps import may be pin-by-pin, not bulk — unconfirmed. Competitive data from Aug 2026 research.</span>
          </div>
        </div>

        {/* Bottom callout */}
        <div style={{ marginTop: '2vh', backgroundColor: 'rgba(79,127,255,0.08)', border: '1px solid rgba(79,127,255,0.2)', borderRadius: '0.8vw', padding: '1.4vh 2vw' }}>
          <p style={{ fontSize: '1.05vw', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
            <strong style={{ color: '#4F7FFF' }}>The Google Maps objection, answered:</strong> Google Maps lets groups vote on individual venues in a shared list. MOVES generates 2–3 AI-curated complete itineraries from your saves, then lets the group vote on the whole night — not the individual stops. That's a different product.
          </p>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>09 / 12</div>
    </div>
  );
}
