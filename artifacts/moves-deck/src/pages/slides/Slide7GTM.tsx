export default function Slide7GTM() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C0F1A', fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: '-15vh', right: '-8vw', width: '48vw', height: '48vw', borderRadius: '50%', backgroundColor: '#4F7FFF', opacity: 0.05, filter: 'blur(9vw)' }} />
      <div style={{ position: 'absolute', bottom: '-20vh', left: '-10vw', width: '50vw', height: '50vw', borderRadius: '50%', backgroundColor: '#7C6BF0', opacity: 0.05, filter: 'blur(11vw)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4vw 4vw', opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '5vh', left: '5vw', display: 'flex', alignItems: 'center', gap: '0.8vw', zIndex: 10 }}>
        <div style={{ width: '1.8vw', height: '1.8vw', backgroundColor: '#4F7FFF', borderRadius: '0.35vw' }} />
        <span style={{ fontSize: '1.1vw', fontWeight: 700, letterSpacing: '-0.02em' }}>MOVES</span>
      </div>
      <div style={{ position: 'absolute', top: '5vh', right: '5vw', fontSize: '1vw', color: 'rgba(255,255,255,0.45)', zIndex: 10 }}>2026</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', paddingTop: '14vh', paddingLeft: '5vw', paddingRight: '5vw' }}>
        {/* Header */}
        <div style={{ marginBottom: '5vh' }}>
          <div style={{ display: 'inline-flex', padding: '0.5vh 1.2vw', backgroundColor: 'rgba(79,127,255,0.12)', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '2vw', color: '#4F7FFF', fontSize: '0.88vw', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2vh' }}>
            Go-to-Market
          </div>
          <h2 style={{ fontSize: '3.8vw', fontWeight: 800, margin: '0 0 1vh 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>NYC first. Then everywhere.</h2>
          <p style={{ fontSize: '1.5vw', fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: 0 }}>A proven city-by-city playbook, starting with the most demanding market</p>
        </div>

        {/* Two phase columns */}
        <div style={{ display: 'flex', gap: '3vw' }}>
          {/* Phase 1 */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(79,127,255,0.28)', borderRadius: '1.2vw', padding: '3vh 2.5vw', boxShadow: '0 2vh 5vh rgba(79,127,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2vw', marginBottom: '3vh' }}>
              <div style={{ padding: '0.5vh 1.2vw', backgroundColor: '#4F7FFF', borderRadius: '0.4vw', fontSize: '0.85vw', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phase 1</div>
              <span style={{ fontSize: '1.2vw', fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>Months 1 – 6</span>
            </div>
            <div style={{ fontSize: '2vw', fontWeight: 700, marginBottom: '2.5vh', lineHeight: 1.2 }}>NYC Launch</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh' }}>
              <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', backgroundColor: 'rgba(79,127,255,0.2)', border: '1px solid rgba(79,127,255,0.4)', flexShrink: 0, marginTop: '0.3vh' }} />
                <div>
                  <div style={{ fontSize: '1.5vw', fontWeight: 600, marginBottom: '0.3vh' }}>Influencer Partnerships</div>
                  <div style={{ fontSize: '1.25vw', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>NYC nightlife creators and micro-influencers seeding organic content</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', backgroundColor: 'rgba(79,127,255,0.2)', border: '1px solid rgba(79,127,255,0.4)', flexShrink: 0, marginTop: '0.3vh' }} />
                <div>
                  <div style={{ fontSize: '1.5vw', fontWeight: 600, marginBottom: '0.3vh' }}>Campus Ambassadors</div>
                  <div style={{ fontSize: '1.25vw', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>NYU, Columbia, Fordham reps driving peer-to-peer growth</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', backgroundColor: 'rgba(79,127,255,0.2)', border: '1px solid rgba(79,127,255,0.4)', flexShrink: 0, marginTop: '0.3vh' }} />
                <div>
                  <div style={{ fontSize: '1.5vw', fontWeight: 600, marginBottom: '0.3vh' }}>Organic Social</div>
                  <div style={{ fontSize: '1.25vw', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>Instagram and TikTok content showcasing real MOVES in real neighborhoods</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', backgroundColor: 'rgba(79,127,255,0.2)', border: '1px solid rgba(79,127,255,0.4)', flexShrink: 0, marginTop: '0.3vh' }} />
                <div>
                  <div style={{ fontSize: '1.5vw', fontWeight: 600, marginBottom: '0.3vh' }}>Launch Venue Partners</div>
                  <div style={{ fontSize: '1.25vw', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>Co-marketing with 20 hand-picked NYC venues at launch</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 2 */}
          <div style={{ flex: 1, backgroundColor: '#131726', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.2vw', padding: '3vh 2.5vw', boxShadow: '0 2vh 4vh rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2vw', marginBottom: '3vh' }}>
              <div style={{ padding: '0.5vh 1.2vw', backgroundColor: 'rgba(124,107,240,0.25)', border: '1px solid rgba(124,107,240,0.4)', borderRadius: '0.4vw', fontSize: '0.85vw', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C6BF0' }}>Phase 2</div>
              <span style={{ fontSize: '1.2vw', fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>Months 7 – 18</span>
            </div>
            <div style={{ fontSize: '2vw', fontWeight: 700, marginBottom: '2.5vh', lineHeight: 1.2 }}>Multi-City Expansion</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh' }}>
              <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', backgroundColor: 'rgba(124,107,240,0.15)', border: '1px solid rgba(124,107,240,0.3)', flexShrink: 0, marginTop: '0.3vh' }} />
                <div>
                  <div style={{ fontSize: '1.5vw', fontWeight: 600, marginBottom: '0.3vh' }}>City Rollout</div>
                  <div style={{ fontSize: '1.25vw', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>Chicago, LA, Miami, Boston using the proven NYC playbook</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', backgroundColor: 'rgba(124,107,240,0.15)', border: '1px solid rgba(124,107,240,0.3)', flexShrink: 0, marginTop: '0.3vh' }} />
                <div>
                  <div style={{ fontSize: '1.5vw', fontWeight: 600, marginBottom: '0.3vh' }}>Venue Network</div>
                  <div style={{ fontSize: '1.25vw', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>Paid placement and booking integrations with venue groups</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', backgroundColor: 'rgba(124,107,240,0.15)', border: '1px solid rgba(124,107,240,0.3)', flexShrink: 0, marginTop: '0.3vh' }} />
                <div>
                  <div style={{ fontSize: '1.5vw', fontWeight: 600, marginBottom: '0.3vh' }}>Paid Acquisition</div>
                  <div style={{ fontSize: '1.25vw', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>Performance marketing + referral incentive program</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', backgroundColor: 'rgba(124,107,240,0.15)', border: '1px solid rgba(124,107,240,0.3)', flexShrink: 0, marginTop: '0.3vh' }} />
                <div>
                  <div style={{ fontSize: '1.5vw', fontWeight: 600, marginBottom: '0.3vh' }}>Press and App Store</div>
                  <div style={{ fontSize: '1.25vw', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>Lifestyle media coverage and App Store editorial featuring</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '4.5vh', left: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MOVES INC.</div>
      <div style={{ position: 'absolute', bottom: '4.5vh', right: '5vw', fontSize: '0.9vw', color: 'rgba(255,255,255,0.32)' }}>10 / 11</div>
    </div>
  );
}
