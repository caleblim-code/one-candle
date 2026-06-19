"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import s from './landing.module.css';

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const ChevronDown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
);

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mockupActive, setMockupActive] = useState(false);
  const [chartAnimate, setChartAnimate] = useState(false);
  const [countersStarted, setCountersStarted] = useState(false);
  const [counterValues, setCounterValues] = useState({ traders: '0', trades: '0', brokers: '0' });

  const revealRefs = useRef<(HTMLElement | null)[]>([]);
  const faqContentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRef = useRef<HTMLDivElement | null>(null);

  const addRevealRef = useCallback((el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  }, []);

  // Sticky Nav
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Scroll Reveal
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(s.active);
        }
      });
    }, { threshold: 0.15 });

    revealRefs.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  // Mockup + chart animation
  useEffect(() => {
    const mockupEl = document.getElementById('mockup-wrapper');
    if (!mockupEl) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setMockupActive(true);
          setChartAnimate(true);
        }
      });
    }, { threshold: 0.15 });
    observer.observe(mockupEl);
    return () => observer.disconnect();
  }, []);

  // Counter Animation
  useEffect(() => {
    if (!counterRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countersStarted) {
          setCountersStarted(true);
          animateCounters();
        }
      });
    }, { threshold: 0.15 });
    observer.observe(counterRef.current);
    return () => observer.disconnect();
  }, [countersStarted]);

  const animateCounters = () => {
    const targets = [
      { key: 'traders', target: 100, suffix: 'K+', isFloat: false },
      { key: 'trades', target: 20.2, suffix: 'B', isFloat: true },
      { key: 'brokers', target: 500, suffix: '+', isFloat: false },
    ];
    targets.forEach(({ key, target, suffix, isFloat }) => {
      let start = 0;
      const duration = 2000;
      const stepTime = 40;
      const steps = duration / stepTime;
      const increment = target / steps;
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) { start = target; clearInterval(timer); }
        const val = isFloat ? start.toFixed(1) + suffix : Math.floor(start) + suffix;
        setCounterValues(prev => ({ ...prev, [key]: val }));
      }, stepTime);
    });
  };

  const toggleFaq = (idx: number) => {
    if (openFaq === idx) {
      if (faqContentRefs.current[idx]) {
        faqContentRefs.current[idx]!.style.maxHeight = '0';
        faqContentRefs.current[idx]!.style.opacity = '0';
      }
      setOpenFaq(null);
    } else {
      // close previous
      if (openFaq !== null && faqContentRefs.current[openFaq]) {
        faqContentRefs.current[openFaq]!.style.maxHeight = '0';
        faqContentRefs.current[openFaq]!.style.opacity = '0';
      }
      setOpenFaq(idx);
      if (faqContentRefs.current[idx]) {
        faqContentRefs.current[idx]!.style.maxHeight = faqContentRefs.current[idx]!.scrollHeight + 'px';
        faqContentRefs.current[idx]!.style.opacity = '1';
      }
    }
  };

  const faqData = [
    { q: 'Is there a free trial?', a: 'Yes, we offer a fully functional 7-day free trial on both the Basic and Pro plans. You can cancel at any time before the trial ends without being charged.' },
    { q: 'Which brokers are supported?', a: 'We support over 500+ brokers and platforms, including Interactive Brokers, TD Ameritrade, Robinhood, NinjaTrader, MT4, MT5, cTrader, and Webull.' },
    { q: 'Can I use OneCandle for prop firm accounts?', a: 'Absolutely. Our Pro plan includes Prop Firm Sync, which automatically tracks trailing drawdowns, daily loss limits, and profit targets to keep you compliant.' },
    { q: 'Does it work for stocks, forex, crypto, and futures?', a: 'Yes, OneCandle tracks multi-asset portfolios seamlessly. It recognizes different contract sizes and pip values automatically for completely accurate P&L calculation.' },
    { q: 'How does trade replay work?', a: 'Trade Replay reconstructs your trade on an interactive chart exactly as the market printed it. You can step forward bar by bar to see what you saw at the moment of execution.' },
    { q: 'Can I cancel anytime?', a: 'Yes, there are no long-term contracts. You can easily cancel your subscription at any time right from your billing dashboard.' },
  ];

  const brokers = ['Interactive Brokers','Robinhood','TD Ameritrade','MT4','MT5','cTrader','Webull','Tastytrade','NinjaTrader','Tradovate'];

  return (
    <>
      {/* Nav */}
      <nav className={`${s.nav} ${scrolled ? s.navScrolled : ''}`}>
        <div className={`${s.container} ${s.navContent}`}>
          <Link href="/" className={s.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            OneCandle
          </Link>
          <div className={s.navLinks}>
            <a href="#features">Features</a>
            <a href="#analytics">Analytics</a>
            <a href="#pricing">Pricing</a>
          </div>
          <Link href="/signup" className="btn btn-primary">Start Free Trial</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroBlob}></div>
        <div className={s.container}>
          <h1 className={`${s.heroTitle} ${s.reveal}`} ref={addRevealRef}>Stop Guessing.<br/>Start Trading With Data.</h1>
          <p className={`${s.subheadline} ${s.reveal}`} ref={addRevealRef}>The all-in-one trading journal that syncs your broker, analyzes every trade, and tells you exactly where you&apos;re losing money.</p>

          <div className={`${s.heroCtas} ${s.reveal}`} ref={addRevealRef}>
            <Link href="/signup" className="btn btn-primary">Get Started Free</Link>
            <a href="#analytics" className="btn btn-ghost">Watch Demo &rarr;</a>
          </div>

          <div className={`${s.socialProofBar} ${s.reveal}`} ref={(el) => { addRevealRef(el); counterRef.current = el; }}>
            <div className={s.proofItem}>
              <span className={s.stars}>★★★★★</span>
              <span>Trusted by <span className={`${s.counter} mono`}>{counterValues.traders}</span> traders</span>
            </div>
            <div className={s.proofItem}>
              <span className={`${s.counter} mono`}>{counterValues.trades}</span>
              <span>trades journaled</span>
            </div>
            <div className={s.proofItem}>
              <span className={`${s.counter} mono`}>{counterValues.brokers}</span>
              <span>broker integrations</span>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className={`${s.heroMockupWrapper} ${s.reveal}`} ref={addRevealRef} id="mockup-wrapper">
            <div className={`${s.dashboardMockup} ${mockupActive ? s.dashboardMockupActive : ''}`}>
              <div className={s.mockupHeader}>
                <div className={s.mockupDots}><span></span><span></span><span></span></div>
              </div>
              <div className={s.mockupBody}>
                <div className={s.mockupChart}>
                  <svg className={s.chartSvg} viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="heroGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,150 L50,130 L100,160 L150,110 L200,120 L250,70 L300,90 L350,40 L400,60 L450,20 L500,30 L500,200 L0,200 Z" fill="url(#heroGradient)"></path>
                    <path className={`${s.chartLine} ${chartAnimate ? s.chartLineAnimate : ''}`} d="M0,150 L50,130 L100,160 L150,110 L200,120 L250,70 L300,90 L350,40 L400,60 L450,20 L500,30" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <div className={s.mockupStatsRow}>
                  <div className={s.mStatCard}><div className={s.mStatLabel}>Win Rate</div><div className={`${s.mStatValue} mono`}>64.2%</div></div>
                  <div className={s.mStatCard}><div className={s.mStatLabel}>Profit Factor</div><div className={`${s.mStatValue} mono`}>2.3</div></div>
                  <div className={s.mStatCard}><div className={s.mStatLabel}>Total Trades</div><div className={`${s.mStatValue} mono`}>847</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className={`${s.logosSection} ${s.reveal}`} ref={addRevealRef}>
        <div className={s.logosHeading}>Connects with every platform you trade on</div>
        <div className={s.marqueeWrapper}>
          <div className={s.marqueeContent}>
            {[...brokers, ...brokers].map((b, i) => <div key={i} className={s.brokerPill}>{b}</div>)}
          </div>
        </div>
      </section>

      {/* Problem Solution */}
      <section className={`${s.problemSolution} ${s.container} ${s.reveal}`} ref={addRevealRef}>
        <div className={s.splitCard}>
          <div className={s.psSide}>
            <h3>The Old Way</h3>
            <ul className={s.psList}>
              <li><span className={`${s.psIcon} ${s.psIconRed}`}>✗</span> Manual spreadsheets that break constantly</li>
              <li><span className={`${s.psIcon} ${s.psIconRed}`}>✗</span> No idea which setups are actually profitable</li>
              <li><span className={`${s.psIcon} ${s.psIconRed}`}>✗</span> Forgetting your emotional state mid-trade</li>
              <li><span className={`${s.psIcon} ${s.psIconRed}`}>✗</span> Prop firm rules you keep accidentally breaking</li>
              <li><span className={`${s.psIcon} ${s.psIconRed}`}>✗</span> Reviewing trades days later when context is gone</li>
            </ul>
          </div>
          <div className={`${s.psSide} ${s.solutionSide}`}>
            <h3>The OneCandle Way</h3>
            <ul className={s.psList}>
              <li><span className={`${s.psIcon} ${s.psIconGreen}`}>✓</span> Syncs 500+ brokers automatically without errors</li>
              <li><span className={`${s.psIcon} ${s.psIconGreen}`}>✓</span> Visual reports show exactly what&apos;s working</li>
              <li><span className={`${s.psIcon} ${s.psIconGreen}`}>✓</span> Real-time notes tag your mood and execution</li>
              <li><span className={`${s.psIcon} ${s.psIconGreen}`}>✓</span> Built-in tracking for all major prop firm rules</li>
              <li><span className={`${s.psIcon} ${s.psIconGreen}`}>✓</span> Bar-by-bar trade replay to relive the moment</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`${s.features} ${s.container}`}>
        <div className={s.sectionHeader}><h2>Everything You Need to Trade Like a Pro</h2></div>
        <div className={s.featuresGrid}>
          {[
            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>, title: 'Auto-Import Trades', desc: 'Sync 500+ brokers instantly. Your trades appear automatically with full price data, chart visuals, and execution points.' },
            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, title: '50+ Analytics Reports', desc: 'Win rate, profit factor, expectancy, R-multiples, performance by time of day, setup, and more.' },
            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>, title: 'Trade Replay', desc: 'Replay any trade bar by bar to see exactly what happened and why.' },
            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, title: 'AI Insights', desc: 'Get personalized AI feedback on your patterns, mistakes, and blind spots.' },
            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, title: 'Real-Time Trade Notes', desc: 'Write notes before, during, and after trades — then link them to the trade when it syncs.' },
            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title: 'Prop Firm Sync', desc: 'Track trailing drawdown rules, funded account limits, and stay compliant automatically.' },
          ].map((f, i) => (
            <div key={i} className={`${s.featureCard} ${s.reveal}`} ref={addRevealRef}>
              <div className={s.fIcon}>{f.icon}</div>
              <h3 className={s.fTitle}>{f.title}</h3>
              <p className={s.fDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Analytics Dashboard Preview */}
      <section id="analytics" className={`${s.analyticsPreview} ${s.container} ${s.reveal}`} ref={addRevealRef}>
        <div className={s.sectionHeader}><h2>Your Performance. Crystal Clear.</h2></div>
        <div className={s.liveDash}>
          <div className={s.ldHeader}>
            <h3>Live Dashboard Preview</h3>
            <div className="btn btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Last 30 Days</div>
          </div>
          <div className={s.ldBody}>
            <div className={s.ldGrid}>
              <div className={s.ldChartBox}>
                <div className={s.ldChartHeader}>
                  <div>
                    <div className={s.ldChartTitle}>Net P&L</div>
                    <div className={`${s.ldChartVal} mono`}>+$12,450.00</div>
                  </div>
                </div>
                <div className={s.ldSvgContainer}>
                  <svg className={s.chartSvg} viewBox="0 0 600 250" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="dashGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,200 L60,180 L120,210 L180,150 L240,160 L300,100 L360,120 L420,60 L480,80 L540,30 L600,40 L600,250 L0,250 Z" fill="url(#dashGradient)"></path>
                    <path className={`${s.chartLine} ${chartAnimate ? s.chartLineAnimate : ''}`} d="M0,200 L60,180 L120,210 L180,150 L240,160 L300,100 L360,120 L420,60 L480,80 L540,30 L600,40" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
              </div>
              <div className={s.ldStatsGrid}>
                <div className={s.mStatCard}><div className={s.mStatLabel}>Win Rate</div><div className={`${s.mStatValue} mono`}>64%</div></div>
                <div className={s.mStatCard}><div className={s.mStatLabel}>Profit Factor</div><div className={`${s.mStatValue} mono`}>2.3</div></div>
                <div className={s.mStatCard}><div className={s.mStatLabel}>Total Trades</div><div className={`${s.mStatValue} mono`}>847</div></div>
                <div className={s.mStatCard}><div className={s.mStatLabel}>Best Day</div><div className={`${s.mStatValue} mono`}>+$4,280</div></div>
              </div>
            </div>
            <div className={s.ldTableBox}>
              <table className={s.ldTable}>
                <thead><tr><th>Ticker</th><th>Direction</th><th>Tag</th><th>Net P&L</th></tr></thead>
                <tbody>
                  <tr><td><span className="mono" style={{fontWeight:'bold'}}>NQ</span></td><td>Long</td><td><span className={s.ldTag}>A+ Setup</span></td><td className={`${s.win} mono`}>+$1,250.00</td></tr>
                  <tr><td><span className="mono" style={{fontWeight:'bold'}}>ES</span></td><td>Short</td><td><span className={s.ldTag}>Reversal</span></td><td className={`${s.win} mono`}>+$840.00</td></tr>
                  <tr><td><span className="mono" style={{fontWeight:'bold'}}>TSLA</span></td><td>Long</td><td><span className={s.ldTag}>Breakout</span></td><td className={`${s.loss} mono`}>-$320.00</td></tr>
                  <tr><td><span className="mono" style={{fontWeight:'bold'}}>GC</span></td><td>Short</td><td><span className={s.ldTag}>Scalp</span></td><td className={`${s.win} mono`}>+$450.00</td></tr>
                  <tr><td><span className="mono" style={{fontWeight:'bold'}}>AAPL</span></td><td>Long</td><td><span className={s.ldTag}>News</span></td><td className={`${s.win} mono`}>+$620.00</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`${s.testimonials} ${s.container} ${s.reveal}`} ref={addRevealRef}>
        <div className={s.testiGrid}>
          {[
            { quote: "I went from losing money consistently to being profitable within 3 months. OneCandle showed me I was overtrading during the first 30 minutes — I never would have noticed without the data.", name: "Marcus T.", role: "Futures Trader", initial: "M" },
            { quote: "The prop firm tracking alone is worth the subscription. I passed my first funded challenge after two failed attempts because I finally understood my drawdown patterns.", name: "Priya S.", role: "Forex Trader", initial: "P" },
            { quote: "Every serious trader I know uses OneCandle. It's the difference between guessing and knowing.", name: "James R.", role: "Day Trader & Educator", initial: "J" },
          ].map((t, i) => (
            <div key={i} className={s.testiCard}>
              <p className={s.testiQuote}>&ldquo;{t.quote}&rdquo;</p>
              <div className={s.testiAuthor}>
                <div className={s.testiAvatar}>{t.initial}</div>
                <div className={s.testiInfo}><h4>{t.name}</h4><p>{t.role}</p></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`${s.pricing} ${s.container} ${s.reveal}`} ref={addRevealRef}>
        <div className={s.sectionHeader}><h2>Simple, Transparent Pricing</h2></div>
        <div className={s.billingToggle}>
          <span>Monthly</span>
          <div className={s.toggleSwitch} onClick={() => setAnnual(!annual)}>
            <div className={`${s.toggleKnob} ${annual ? s.toggleKnobAnnual : ''}`}></div>
          </div>
          <span>Annual</span>
          <span className={s.saveBadge}>Save ~15%</span>
        </div>
        <div className={s.pricingGrid}>
          <div className={s.priceCard}>
            <h3 className={s.pName}>Basic Plan</h3>
            <div className={`${s.pPrice} mono`}>{annual ? '$24' : '$29'}</div>
            <div className={s.pPeriod}>per month</div>
            <ul className={s.pList}>
              <li><CheckIcon /> 1 trading account</li>
              <li><CheckIcon /> Auto broker sync</li>
              <li><CheckIcon /> Core analytics reports</li>
              <li><CheckIcon /> 3 playbooks</li>
              <li><CheckIcon /> Trade notes & tagging</li>
            </ul>
            <Link href="/signup" className="btn btn-ghost" style={{ width: '100%' }}>Start Basic</Link>
          </div>
          <div className={`${s.priceCard} ${s.priceCardPopular}`}>
            <div className={s.popularBadge}>Most Popular</div>
            <h3 className={s.pName}>Pro Plan</h3>
            <div className={`${s.pPrice} mono`}>{annual ? '$33' : '$49'}</div>
            <div className={s.pPeriod}>per month</div>
            <ul className={s.pList}>
              <li><CheckIcon /> Everything in Basic, plus:</li>
              <li><CheckIcon /> Unlimited accounts</li>
              <li><CheckIcon /> Trade Replay</li>
              <li><CheckIcon /> Backtesting (10 years of data)</li>
              <li><CheckIcon /> AI Insights</li>
              <li><CheckIcon /> Prop Firm Sync</li>
              <li><CheckIcon /> Priority support</li>
            </ul>
            <Link href="/signup" className="btn btn-primary" style={{ width: '100%' }}>Start Pro Free</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={`${s.faq} ${s.reveal}`} ref={addRevealRef}>
        <div className={s.sectionHeader}><h2>Frequently Asked Questions</h2></div>
        {faqData.map((item, i) => (
          <div key={i} className={s.accordionItem}>
            <button className={s.accordionBtn} onClick={() => toggleFaq(i)}>
              {item.q}
              <span className={`${s.accordionIcon} ${openFaq === i ? s.accordionIconOpen : ''}`}><ChevronDown /></span>
            </button>
            <div className={s.accordionContent} ref={el => { faqContentRefs.current[i] = el; }}>
              <p>{item.a}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Final CTA */}
      <section className={`${s.finalCta} ${s.reveal}`} ref={addRevealRef}>
        <div className={s.ctaBlob}></div>
        <div className={s.container}>
          <h2>Your Next Profitable Trade Starts With Knowing Your Last One.</h2>
          <p>Join 100,000+ traders who use OneCandle to turn data into discipline.</p>
          <Link href="/signup" className="btn btn-primary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}>Start Your Free Trial Today</Link>
          <span className={s.ctaSmall}>No credit card required · Cancel anytime</span>
        </div>
      </section>

      {/* Footer */}
      <footer className={s.footer}>
        <div className={s.container}>
          <div className={s.footerGrid}>
            <div className={s.footerBrand}>
              <Link href="/" className={s.logo}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                OneCandle
              </Link>
              <p>Trade smarter. Journal better.</p>
            </div>
            <div>
              <h4 className={s.footerColTitle}>Product</h4>
              <div className={s.footerLinks}><a href="#features">Features</a><a href="#analytics">Analytics</a><a href="#">Prop Firm Sync</a><a href="#pricing">Pricing</a></div>
            </div>
            <div>
              <h4 className={s.footerColTitle}>Company</h4>
              <div className={s.footerLinks}><a href="#">About Us</a><a href="#">Careers</a><a href="#">Contact</a><a href="#">Affiliates</a></div>
            </div>
            <div>
              <h4 className={s.footerColTitle}>Resources</h4>
              <div className={s.footerLinks}><a href="#">Blog</a><a href="#">Help Center</a><a href="#">Trading Guides</a><a href="#">Community</a></div>
            </div>
          </div>
          <div className={s.footerBottom}>
            <p>&copy; 2026 OneCandle. All rights reserved.</p>
            <div className={s.socialIcons}>
              <a href="#" aria-label="Twitter"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
              <a href="#" aria-label="YouTube"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg></a>
              <a href="#" aria-label="Discord"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
