const base = import.meta.env.BASE_URL;

export default function Slide1Title() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      {/* Hero image */}
      <img src={`${base}hero.png`} crossOrigin="anonymous" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.32 }} />
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(12,15,26,0.97) 30%, rgba(12,15,26,0.6) 65%, rgba(12,15,26,0.88) 100%)' }} />
      {/* Grid texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />
      {/* Blue glow */}
      <div style={{ position: 'absolute', top: '-15vh', right: '-8vw', width: '48vw', height: '48vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.07, filter: 'blur(9vw)' }} />
      {/* Purple glow */}
      <div style={{ position: 'absolute', bottom: '-20vh', left: '-12vw', width: '55vw', height: '55vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.07, filter: 'blur(11vw)' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '8vw' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '0.6vh 1.4vw', backgroundColor: 'rgba(124,107,240,0.15)', border: '1px solid rgba(124,107,240,0.32)', borderRadius: '2vw', color: '#7C6BF0', fontSize: '0.9vw', fontWeight: 600, marginBottom: '3vh', letterSpacing: '0.1em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
          Investor Preview · 2026
        </div>
        {/* Title */}
        <h1 style={{ fontSize: '11vw', fontWeight: 800, margin: '0 0 2vh 0', lineHeight: 0.9, letterSpacing: '-0.04em' }}>MOVES</h1>
        {/* Subtitle */}
        <p style={{ fontSize: '2.2vw', fontWeight: 300, color: 'rgba(255,255,255,0.7)', margin: '0 0 6vh 0', lineHeight: 1.4, maxWidth: '42vw' }}>Plan your day or night. Powered by AI —<br />but really, powered by <span style={{ color: '#FFFFFF', fontWeight: 500 }}>your saves</span>.</p>
        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '1.2vw' }}>
          <div style={{ padding: '0.8vh 1.8vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.22)', borderRadius: '0.4vw', fontSize: '1.05vw', fontWeight: 500 }}>NYC</div>
          <div style={{ padding: '0.8vh 1.8vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.22)', borderRadius: '0.4vw', fontSize: '1.05vw', fontWeight: 500 }}>Social Planning</div>
          <div style={{ padding: '0.8vh 1.8vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.22)', borderRadius: '0.4vw', fontSize: '1.05vw', fontWeight: 500 }}>AI-Powered</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>01 / 10</div>
    </div>
  );
}
