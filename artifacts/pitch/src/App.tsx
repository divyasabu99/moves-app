import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const SCRIPT = `[PAUSE — breathe, look at camera]

Every Friday, the same thing happens.

Someone texts the group chat: "What are we doing tonight?"

And then... nothing. Forty-five minutes of "I don't know, what do you want to do?"

Someone drops a Yelp link. Someone else says they've been there. Someone says they're not feeling Italian. Someone goes quiet. And by 9 PM, you're at the same bar you always go to — not because you wanted to be there, but because no one had the energy to decide anything else.

This isn't a small annoyance. This is every weekend. For millions of people. In every city.

[PAUSE]

My name is [YOUR NAME]. I grew up [YOUR BACKGROUND — city, context]. I've lived in New York for [X years], and I love this city the way you love something that constantly overwhelms you. There is no better place in the world to have a night out. And there is no harder place to actually plan one.

I've had hundreds of conversations with people my age about this. And every single time, I hear the same things. "I have so many places saved but I never use the list." "I know the city, I just can't think straight on a Friday afternoon." "My friends are impossible to coordinate."

The information isn't the problem. The activation is.

[PAUSE]

So I built MOVES.

MOVES is a personal spot library and AI planning tool. You save the places you already know — restaurants, bars, venues, coffee shops — organized by vibe, neighborhood, and category. Then when you're ready to go out, you tell MOVES what you're feeling: four people, West Village, dinner and drinks, tonight at seven. And MOVES builds you a time-slotted itinerary from your own places — not from an algorithm that doesn't know you.

The tagline is: Your plan. Powered by AI. But the truth is — it's powered by YOU. Your saves. Your taste. Your city.

[PAUSE]

Here's why I'm committing my life to this.

I think the way we experience cities is about to change. For the last twenty years, discovery apps have gotten incredible at helping you find new places. But no one has built the layer that sits on top — the one that helps you use what you already know, with the people you actually want to see.

MOVES is that layer. And once someone builds their library — once they've got sixty saved spots and ten nights planned — they're not going back to texting a group chat and hoping for the best.

The habit is sticky. The data compounds. And the network — when a group of friends all use MOVES together — becomes something no one else can replicate.

I'm not building a reservation app. I'm not building a discovery app. I'm building the operating system for your social life. And I want to start with New York, prove it works in the hardest market in the world, and take it everywhere.

[PAUSE]

We're raising $300,000. Twelve months of runway to launch in NYC, sign our first fifty venue partners, and get to the metrics that make the Series A obvious.

If you've ever cancelled plans because no one could decide where to go — you already understand why this has to exist.

I'd love to tell you more. Thank you.`;

const SPEED_MAP = {
  slow: 0.4,
  medium: 0.7,
  fast: 1.1,
} as const;

type Speed = keyof typeof SPEED_MAP;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState<Speed>('medium');
  const [progress, setProgress] = useState(0);

  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const scrollPosRef = useRef<number>(0);

  // Parse lines to render
  const lines = SCRIPT.split('\n');

  // Timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Scroll loop
  const animateScroll = useCallback((time: number) => {
    if (lastTimeRef.current != undefined) {
      const delta = time - lastTimeRef.current;
      // We use the delta to ensure smooth scrolling regardless of refresh rate,
      // normalizing to roughly 60fps (16.66ms per frame).
      const speedMultiplier = delta / 16.66;
      const amountToScroll = SPEED_MAP[speed] * speedMultiplier;
      
      scrollPosRef.current += amountToScroll;
      window.scrollTo(0, scrollPosRef.current);
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animateScroll);
  }, [speed]);

  useEffect(() => {
    if (isRunning) {
      scrollPosRef.current = window.scrollY;
      requestRef.current = requestAnimationFrame(animateScroll);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      lastTimeRef.current = undefined;
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning, animateScroll]);

  // Track progress based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)));
      } else {
        setProgress(0);
      }
      
      // Update our internal ref in case the user manually scrolled
      if (!isRunning) {
        scrollPosRef.current = scrollTop;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Init calculate
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isRunning]);

  const togglePlayback = () => {
    setIsRunning(!isRunning);
  };

  const resetAll = () => {
    setIsRunning(false);
    setElapsed(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    scrollPosRef.current = 0;
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (val === 0) setSpeed('slow');
    if (val === 1) setSpeed('medium');
    if (val === 2) setSpeed('fast');
  };

  const getSliderValue = () => {
    if (speed === 'slow') return 0;
    if (speed === 'medium') return 1;
    return 2;
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Progress Bar Fixed at Top */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-muted z-50">
        <div 
          className="h-full bg-primary transition-all duration-100 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Script Container */}
      <main className="max-w-[1000px] mx-auto px-6 md:px-12 pt-[60vh] pb-[80vh]">
        {lines.map((line, index) => {
          if (line.trim() === '') {
            return <div key={index} className="h-6" />;
          }

          if (line.startsWith('[PAUSE') && line.endsWith(']')) {
            return (
              <div 
                key={index} 
                className="my-16 text-center"
              >
                <span className="inline-block px-4 py-2 border border-muted/50 rounded-full text-muted-foreground/60 italic text-xl md:text-2xl tracking-widest font-medium">
                  {line.slice(1, -1)}
                </span>
              </div>
            );
          }

          // Split by placeholders
          const parts = line.split(/(\[.*?\])/g);

          return (
            <p 
              key={index} 
              className="mb-10 text-3xl md:text-[2.75rem] leading-[1.6] md:leading-[1.7] font-medium max-w-[60ch] mx-auto text-center"
            >
              {parts.map((part, i) => {
                if (part.startsWith('[') && part.endsWith(']')) {
                  return (
                    <span 
                      key={i} 
                      className="text-primary bg-primary/10 px-3 py-1 rounded-md mx-1 whitespace-nowrap shadow-[inset_0_0_0_1px_rgba(79,127,255,0.2)] font-semibold inline-block"
                    >
                      {part}
                    </span>
                  );
                }
                return <span key={i}>{part}</span>;
              })}
            </p>
          );
        })}
      </main>

      {/* Controls Bar Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-background/80 backdrop-blur-xl border-t border-white/5 pb-safe z-50">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Time & Core Controls */}
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
            <div className="font-mono text-2xl font-bold w-[5ch] tracking-tight">
              {formatTime(elapsed)}
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={togglePlayback}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                {isRunning ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </button>
              
              <button 
                onClick={resetAll}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all active:scale-95 border border-white/5"
                title="Reset"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Speed Slider */}
          <div className="flex items-center gap-4 w-full md:w-auto md:min-w-[300px]">
            <span className="text-sm font-medium text-muted-foreground w-12 text-right">Slow</span>
            <div className="relative flex-1">
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="1"
                value={getSliderValue()}
                onChange={handleSpeedChange}
              />
              <div className="absolute top-5 left-0 w-full flex justify-between px-1 pointer-events-none">
                <div className="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
                <div className="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
                <div className="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
              </div>
            </div>
            <span className="text-sm font-medium text-muted-foreground w-12 text-left">Fast</span>
          </div>

        </div>
      </div>
    </div>
  );
}
