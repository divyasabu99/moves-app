import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const queryClient = new QueryClient();

const QAS = [
  {
    q: "What problem are you solving?",
    a: "Going out in NYC should be easy — but the logistics of getting a friend group to actually commit, plan, and move together is exhausting. The group chat fills with \"down for whatever\" replies, someone picks a bar, half the group doesn't want to go, the plan dies. The problem isn't desire — it's friction. People want to do more together; they just can't get out of the planning loop."
  },
  {
    q: "Why now?",
    a: "Three forces converged: AI is finally good enough to generate relevant, personalized recommendations (not just generic Yelp lists). Post-COVID, people are actively spending on IRL social experiences again — nightlife, dining, and events are rebounding above pre-pandemic levels. And smartphones are now fully context-aware — location, calendar, contacts — so a group coordination app can actually act on real constraints, not just suggestions."
  },
  {
    q: "Who is your target customer?",
    a: "Urban 21–35 year olds — friend groups, couples, coworkers — in NYC first, expanding to other dense metros. They're social by default, have disposable income to spend on experiences, and already live on their phones. They're not looking for another discovery app; they're looking for something that actually gets the group out the door."
  },
  {
    q: "How does MOVES work?",
    a: "A user creates a \"Move\" — picks a vibe (late night, chill dinner, wild card), sets a time and neighborhood, and invites their crew. MOVES AI generates a curated itinerary: venue one, then two, then three — tailored to the group's collective history and preferences. The group votes and locks the plan. One tap to confirm; no more coordination overhead. The shared Move lives in the app so everyone has the details without a chaotic group thread."
  },
  {
    q: "How do you make money?",
    a: "Two streams. Consumer: a MOVES Pro subscription ($7.99/month) for power planners — priority AI suggestions, saved spots, private group vibes. B2B: venue partnerships and promoted placement for bars, restaurants, and event promoters who want to reach groups in active planning mode. We're not charging per booking; we're charging for access to intent at its hottest moment."
  },
  {
    q: "What's your traction?",
    a: "[YOUR ANSWER — e.g. \"X active users, Y moves completed per week, Z% week-over-week growth since launch\"]"
  },
  {
    q: "How big is the market?",
    a: "The NYC nightlife and group dining market alone is $5B+ annually. Nationally, the US experiences economy (dining, nightlife, live events) exceeds $350B. Group coordination apps are an underpenetrated wedge into this: no one owns \"going out together\" as a category yet. Even 1% of the NYC market at a $10 ARPU is a $50M ARR business — and MOVES is designed to expand city by city."
  },
  {
    q: "Who are your competitors?",
    a: "Current alternatives are wrong-category tools: WhatsApp/iMessage for coordination (no planning intelligence), Yelp/Google Maps for discovery (solo, not group), Fever/Eventbrite for ticketed events (not flexible social plans). The closer comp is something like OpenTable for groups — but OpenTable is reservation-first; MOVES is vibe-first. No one is doing AI-powered group social planning at this level."
  },
  {
    q: "What's your competitive moat?",
    a: "Network effects compound quickly in a social app — the more of a friend group that's on MOVES, the stickier it is for everyone. We're also accumulating proprietary data on group preference patterns that no competitor has (who goes with whom, what combos work, time-of-night conversion by vibe). Venue relationships reinforce the data flywheel. And being NYC-first, not everywhere-mediocre, means our quality signal starts high."
  },
  {
    q: "Tell me about the team.",
    a: "[YOUR ANSWER — founder background, why you're the right person to build this, key team members and their relevant experience]"
  },
  {
    q: "What's your go-to-market strategy?",
    a: "NYC-first, campus-to-city expansion. We're seeding through college social networks (resident advisors, Greek life, sports teams) and young professional networks (company offsites, alumni groups). Every shared Move is ambient marketing — the invite notification is the growth loop. We're also partnering with 10–15 anchor venues per neighborhood who actively promote MOVES to their regulars. No paid acquisition until organic retention is proven."
  },
  {
    q: "What are you raising and how will you use it?",
    a: "[YOUR ANSWER — e.g. \"We're raising $Xm at a $Ym valuation. The capital will be used for: (1) engineering team expansion, (2) NYC venue partnership program, (3) 3-city expansion by Q4.\"]"
  },
  {
    q: "What's been your biggest mistake so far?",
    a: "[YOUR ANSWER — be honest and specific; investors respect self-awareness more than spin]"
  },
  {
    q: "What's not working right now?",
    a: "[YOUR ANSWER — one real challenge you're actively working through]"
  },
  {
    q: "What does success look like in 3–5 years?",
    a: "MOVES is the default way friend groups in 10+ US cities plan their nights out. 5M+ monthly active users. $50M+ ARR from a mix of Pro subscriptions and venue partnerships. We've built the richest dataset on group social behavior anywhere — and that data becomes the foundation for the next thing: predictive social discovery, not just reactive planning. The long game is owning the social occasion layer."
  },
  {
    q: "Why are you the right person to build this?",
    a: "[YOUR ANSWER — your specific insight, lived experience, or unfair advantage that makes you uniquely suited to this problem]"
  }
];

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0C0F1A]/70 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="font-extrabold text-2xl tracking-tighter text-white">
          MOVES
        </div>
        <a 
          href="/moves-deck/" 
          className="text-white/50 hover:text-white transition-colors text-sm font-medium hidden sm:block"
        >
          View Deck
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="pt-40 md:pt-52 pb-24 px-6 relative">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#4F7FFF]/15 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-[#7C6BF0]/15 blur-[120px] rounded-full mix-blend-screen" />
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
             <span className="w-2 h-2 rounded-full bg-[#4F7FFF] shadow-[0_0_12px_#4F7FFF] animate-pulse" />
             <span className="text-xs font-semibold tracking-[0.15em] uppercase text-white/90">Investor FAQ</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
            Plan your night.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F7FFF] to-[#7C6BF0]">
              Powered by AI.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 max-w-2xl font-light leading-relaxed">
            The questions we get most. Everything you need to know about how we're turning the friction of group coordination into the future of social discovery.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function AnswerContent({ text }: { text: string }) {
  if (text.startsWith('[YOUR ANSWER')) {
    const rawText = text.replace(/^\[YOUR ANSWER\s*(?:—\s*)?/, '').replace(/\]$/, '');
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/10 p-6 md:p-8 backdrop-blur-sm group-hover:bg-white/[0.04] transition-colors duration-500 mt-4">
        {/* Animated edge highlight */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#4F7FFF] to-[#7C6BF0]" />
        
        {/* Subtle glow on hover */}
        <div className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-2xl pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-[#4F7FFF]/10 to-[#7C6BF0]/10" />
        </div>
        
        <span className="text-white/40 italic text-xs uppercase tracking-[0.2em] font-medium mb-3 block">Founder Input Required</span>
        <p className="text-white/70 font-light text-lg md:text-xl leading-relaxed relative z-10">
          {rawText}
        </p>
      </div>
    );
  }
  return (
    <p className="text-white/70 font-light text-lg md:text-xl leading-relaxed">
      {text}
    </p>
  );
}

function FAQItem({ faq, index }: { faq: typeof QAS[0], index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="text-white/20 font-mono text-xl pt-1 md:pt-1.5 w-12 shrink-0 select-none">
          {(index + 1).toString().padStart(2, '0')}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-6 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all duration-300">
            {faq.q}
          </h2>
          <AnswerContent text={faq.a} />
        </div>
      </div>
    </motion.div>
  );
}

function FAQList() {
  return (
    <section className="px-6 pb-32 md:pb-48">
      <div className="max-w-4xl mx-auto space-y-20 md:space-y-24">
        {QAS.map((faq, idx) => (
          <FAQItem key={idx} index={idx} faq={faq} />
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 md:py-16 px-6 bg-[#0C0F1A]">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center">
        <a 
          href="/moves-deck/" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all duration-300 text-sm font-medium tracking-wide group"
        >
          <span>Return to Pitch Deck</span>
          <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
        </a>
        <p className="text-white/20 text-xs font-mono mt-8 uppercase tracking-[0.2em]">
          Built with MOVES
        </p>
      </div>
    </footer>
  );
}

function FAQPage() {
  return (
    <div className="min-h-screen w-full bg-[#0C0F1A] selection:bg-[#4F7FFF]/30">
      <Header />
      <main>
        <Hero />
        <FAQList />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Switch>
          <Route path="/" component={FAQPage} />
          {/* Catch-all route gracefully falls back to FAQ if user navigates to an unknown route */}
          <Route component={FAQPage} />
        </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
