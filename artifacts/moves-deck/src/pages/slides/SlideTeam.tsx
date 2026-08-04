export default function SlideTeam() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '-15vh', left: '25vw', width: '45vw', height: '45vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.06, filter: 'blur(11vw)' }} />
      <div style={{ position: 'absolute', bottom: '-20vh', right: '5vw', width: '38vw', height: '38vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.05, filter: 'blur(9vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', width: '90vw', marginLeft: '5vw', height: '100%', gap: '6vw' }}>

        {/* Left — founder card */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.88vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'flex-start', marginBottom: '2.5vh' }}>
            Team
          </div>
          <h2 style={{ fontSize: '3.6vw', fontWeight: 800, margin: '0 0 3.5vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Why me.<br /><span style={{ color: 'rgba(255,255,255,0.38)' }}>Why now.</span>
          </h2>

          {/* Founder card */}
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '1.2vw', padding: '2.8vh 2.5vw', boxShadow: '0 2vh 5vh rgba(79,127,255,0.1)', marginBottom: '2.5vh' }}>
            <div style={{ display: 'flex', gap: '2vw', alignItems: 'flex-start', marginBottom: '2vh' }}>
              {/* Avatar placeholder */}
              <div style={{ width: '6vw', height: '6vw', borderRadius: '50%', backgroundColor: 'rgba(79,127,255,0.18)', border: '2px solid rgba(79,127,255,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.8vw', fontWeight: 800, color: '#4F7FFF' }}>DS</span>
              </div>
              <div>
                <div style={{ fontSize: '2.2vw', fontWeight: 800, lineHeight: 1.1, marginBottom: '0.4vh' }}>Divya Sabu</div>
                <div style={{ fontSize: '1.1vw', color: '#4F7FFF', fontWeight: 600 }}>Founder & CEO</div>
              </div>
            </div>

            {/* Background bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4vh' }}>
              {[
                'Background in Finance, Supply Chain, and Product Development — built for the operational complexity of launching a marketplace',
                'Domain expertise across the full stack from unit economics to user experience',
                'The group planner for every outing — firsthand experience of the exact friction MOVES solves',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1vw', alignItems: 'flex-start' }}>
                  <div style={{ width: '1.3vw', height: '1.3vw', borderRadius: '0.3vw', backgroundColor: 'rgba(79,127,255,0.15)', border: '1px solid rgba(79,127,255,0.3)', flexShrink: 0, marginTop: '0.25vh' }} />
                  <p style={{ fontSize: '1.25vw', fontWeight: 400, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.4, fontStyle: item.startsWith('[') ? 'italic' : 'normal' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '1.2vw', fontWeight: 300, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.55 }}>
            Looking for a technical co-founder and early design collaborator as part of this raise.
          </p>
        </div>

        {/* Right — "why now" context */}
        <div style={{ flex: 0.9, display: 'flex', flexDirection: 'column', gap: '2vh', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.82vw', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5vh' }}>Why this, why now</div>

          {[
            { heading: 'The behavior already exists', body: 'People save hundreds of places across Google Maps, TikTok, and Instagram. The habit is there. The utility layer is missing.' },
            { heading: 'AI makes it possible today', body: 'GPT-4o can now understand personal taste, group constraints, and venue context well enough to generate plans people actually want to use.' },
            { heading: 'No one owns this yet', body: 'Stippl has 250K users but no Google Maps import. Mindtrip is travel-focused. The local group planning slot is still wide open.' },
          ].map(item => (
            <div key={item.heading} style={{ backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.9vw', padding: '2vh 2vw' }}>
              <div style={{ fontSize: '1.1vw', fontWeight: 700, color: 'rgba(255,255,255,0.88)', marginBottom: '0.5vh' }}>{item.heading}</div>
              <div style={{ fontSize: '1.05vw', fontWeight: 300, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>11 / 11</div>
    </div>
  );
}
