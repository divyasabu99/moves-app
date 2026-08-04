export default function Slide2Problem() {
  const saves = [
    'Lilia — Williamsburg', 'Llama Inn — Greenpoint', 'Thai Villa — Astoria',
    'Niche Niche — NoHo', 'Cecchi\'s — West Village', 'Bar Blondeau — Wythe',
    'Lucali — Carroll Gardens', 'Le Crocodile — Williamsburg', 'Mr. Purple — LES',
    'Superiority Burger', 'Atomix', 'Cote', 'Don Angie', 'attaboy',
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '-20vh', right: '-10vw', width: '50vw', height: '50vw', borderRadius: '50%', backgroundColor: '#FF5050', opacity: 0.04, filter: 'blur(8vw)' }} />
      <div style={{ position: 'absolute', bottom: '-25vh', left: '-12vw', width: '55vw', height: '55vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.04, filter: 'blur(10vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', height: '100%', paddingTop: '12vh', paddingBottom: '9vh', paddingLeft: '5vw', paddingRight: '5vw', gap: '3vw', boxSizing: 'border-box', alignItems: 'stretch' }}>

        {/* LEFT — header + saves graveyard */}
        <div style={{ flex: 1.05, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.28)', borderRadius: '2vw', color: '#FF7070', fontSize: '0.88vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'flex-start', marginBottom: '2vh' }}>
            The Problem
          </div>
          <h2 style={{ fontSize: '3.4vw', fontWeight: 800, margin: '0 0 0.8vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Your saves are a graveyard.<br /><span style={{ color: 'rgba(255,255,255,0.4)' }}>Your group chat is a dead end.</span>
          </h2>
          <p style={{ fontSize: '1.2vw', fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: '0 0 2.5vh 0', lineHeight: 1.5 }}>
            People save hundreds of places across Google Maps, TikTok, and Instagram — and almost never go.
          </p>

          {/* Saves graveyard mock */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '1vw', padding: '1.8vh 1.8vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5vh' }}>
              <div style={{ fontSize: '0.82vw', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Google Maps — Saved Places
              </div>
              <div style={{ fontSize: '0.82vw', color: 'rgba(255,80,80,0.7)', fontWeight: 600 }}>247 places</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7vh', overflow: 'hidden', flex: 1 }}>
              {saves.map((place, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8vw', padding: '0.6vh 0.8vw', backgroundColor: 'rgba(255,255,255,0.025)', borderRadius: '0.4vw', opacity: i > 9 ? 0.3 : 1 - i * 0.04 }}>
                  <div style={{ width: '0.55vw', height: '0.55vw', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.92vw', color: 'rgba(255,255,255,0.6)', flex: 1 }}>{place}</span>
                  <span style={{ fontSize: '0.72vw', color: 'rgba(255,255,255,0.2)' }}>
                    {i === 0 ? 'saved 3 years ago' : i === 1 ? 'saved 2 years ago' : i < 5 ? 'saved 18 months ago' : 'saved'}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.2vh', padding: '0.8vh 1vw', backgroundColor: 'rgba(255,80,80,0.08)', borderRadius: '0.5vw', border: '1px solid rgba(255,80,80,0.18)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.88vw', color: 'rgba(255,100,100,0.8)', fontWeight: 500 }}>Never visited. Never acted on. Just a longer list.</span>
            </div>
          </div>
        </div>

        {/* RIGHT — group chat deadlock */}
        <div style={{ flex: 0.9, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingTop: '4vh' }}>
          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1vw', padding: '2vh 1.8vw', marginBottom: '2vh', flex: 1 }}>
            <div style={{ fontSize: '0.82vw', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.5vh' }}>Group Chat — Friday Night</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
              {[
                { color: 'rgba(79,127,255,0.35)', msg: 'what are we doing tonight' },
                { color: 'rgba(124,107,240,0.35)', msg: 'idk you pick' },
                { color: 'rgba(255,112,112,0.35)', msg: 'that place from last time?' },
                { color: 'rgba(79,127,255,0.35)', msg: 'which one lol' },
                { color: 'rgba(124,107,240,0.35)', msg: 'idk just pick something' },
                { color: 'rgba(255,112,112,0.35)', msg: '🤷' },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.8vw', alignItems: 'center' }}>
                  <div style={{ width: '1.8vw', height: '1.8vw', borderRadius: '50%', backgroundColor: m.color, flexShrink: 0 }} />
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.4vw', padding: '0.7vh 0.9vw', fontSize: '1vw', color: 'rgba(255,255,255,0.65)' }}>{m.msg}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#131726', border: '1px solid rgba(255,80,80,0.22)', borderRadius: '1vw', padding: '1.8vh 1.8vw' }}>
            <div style={{ fontSize: '0.82vw', fontWeight: 600, color: 'rgba(255,100,100,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.2vh' }}>2 hours later</div>
            <div style={{ fontSize: '1.7vw', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '0.5vh' }}>Still no plan.</div>
            <div style={{ fontSize: '1.15vw', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>Same bar as last month. Or night cancelled.</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>02 / 12</div>
    </div>
  );
}
