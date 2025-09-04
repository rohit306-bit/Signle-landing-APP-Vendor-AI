// index.tsx
// TypeScript React single-page landing for VendoAI
// Fixed syntax issues (missing semicolon) and converted to a self-contained, type-safe TSX file.
// Requirements: React 18+, TypeScript, Tailwind CSS configured.

import React, { useEffect, useState } from 'react';

type Vendor = {
  id?: string;
  name: string;
  services?: string;
  summary?: string;
};

function Navbar(): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b dark:bg-gray-900/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-2 font-bold text-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="#2563EB" />
          </svg>
          VendoAI
        </a>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#problem" className="text-sm font-medium text-gray-700 hover:text-blue-600">Problem</a>
          <a href="#solution" className="text-sm font-medium text-gray-700 hover:text-blue-600">Solution</a>
          <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-blue-600">Pricing</a>
          <a href="#contact" className="text-sm font-medium text-gray-700 hover:text-blue-600">Contact</a>
          <button className="ml-4 rounded-lg px-3 py-2 bg-blue-600 text-white text-sm">Request Demo</button>
        </nav>

        <button className="md:hidden p-2" onClick={() => setOpen((s) => !s)} aria-label="Toggle menu">
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6L18 18" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white dark:bg-gray-900">
          <div className="px-4 py-4 space-y-3">
            <a href="#problem" className="block text-sm font-medium text-gray-700">Problem</a>
            <a href="#solution" className="block text-sm font-medium text-gray-700">Solution</a>
            <a href="#pricing" className="block text-sm font-medium text-gray-700">Pricing</a>
            <a href="#contact" className="block text-sm font-medium text-gray-700">Contact</a>
            <div className="pt-2">
              <button className="w-full rounded-lg px-4 py-2 bg-blue-600 text-white">Request Demo</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }): JSX.Element {
  return (
    <div className="rounded-2xl border p-5 bg-white dark:bg-gray-800 shadow-sm">
      <div className="font-semibold">{title}</div>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{desc}</div>
    </div>
  );
}

function Section({ id, title, subtitle, children }: { id?: string; title?: string; subtitle?: string; children?: React.ReactNode }): JSX.Element {
  return (
    <section id={id} className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{title}</h2>
            {subtitle && <p className="mt-3 text-base sm:text-lg text-gray-600">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export default function App(): JSX.Element {
  const [subscribeEmail, setSubscribeEmail] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);
  const [rfpResult, setRfpResult] = useState<string | null>(null);
  const [vendorQuery, setVendorQuery] = useState<string>('');
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [toast]);

  async function handleSubscribe(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
    }

    if (!subscribeEmail) {
      setToast('Please enter an email address.');
      return;
    }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail })
      });

      if (res.ok) {
        setToast('Subscribed successfully.');
        setSubscribeEmail('');
      } else {
        const j = await res.json();
        setToast(j?.error || 'Subscription failed.');
      }
    } catch (err) {
      setToast('Network error.');
    }
  }

  async function generateRFP(goal: string, scope: string, budget: string) {
    setRfpResult(null);
    try {
      const res = await fetch('/api/rfps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, scope, budget })
      });
      if (res.ok) {
        const json = await res.json();
        setRfpResult(json?.draft || json?.rfp || 'No RFP returned.');
      } else {
        setRfpResult('RFP generation failed.');
      }
    } catch (err) {
      setRfpResult('Network error.');
    }
  }

  async function searchVendors(query: string) {
    setVendors([]);
    try {
      const res = await fetch(`/api/vendors/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          // previous simple backend returned array
          setVendors(json as Vendor[]);
        } else if (json?.vendors && Array.isArray(json.vendors)) {
          setVendors(json.vendors as Vendor[]);
        } else {
          setVendors([]);
        }
      } else {
        setVendors([]);
      }
    } catch (err) {
      setVendors([]);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">AI‑Driven Vendor Management, Simplified</h1>
            <p className="mt-4 text-lg text-blue-100/90 max-w-2xl">
              Discover vendors, auto‑draft RFPs, evaluate proposals, sign SLAs, and track delivery — in one place.
            </p>
            <div className="mt-6 flex gap-3">
              <button className="rounded-2xl px-4 py-2 bg-white text-blue-600 font-semibold" onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}>Start Free Trial</button>
              <button className="rounded-2xl px-4 py-2 border border-white/40">Request a Demo</button>
            </div>
          </div>

          <div>
            <div className="rounded-2xl bg-white/90 p-4 shadow-lg text-black">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Project Delivery Dashboard</div>
                <div className="text-xs text-gray-500">Real-time</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-gray-500">Active Projects</div>
                  <div className="mt-1 text-xl font-bold">27</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-gray-500">On-time</div>
                  <div className="mt-1 text-xl font-bold">96%</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-gray-500">Risk Alerts</div>
                  <div className="mt-1 text-xl font-bold">3</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <Section id="problem" title="The Problem" subtitle="Fragmented vendor operations burn time, budget, and trust.">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border p-6 bg-white">Companies waste time, money, and resources managing vendors.</div>
          <div className="rounded-2xl border p-6 bg-white">Unstructured processes: RFPs, proposals, contracts, delivery, renewals.</div>
          <div className="rounded-2xl border p-6 bg-white">Delays, inefficiencies, compliance risks, and poor performance.</div>
        </div>
      </Section>

      {/* Solution */}
      <Section id="solution" title="Our Solution" subtitle="An end-to-end platform to discover, evaluate, contract, and deliver with confidence.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard title="Verified Marketplace" desc="Discover vetted vendors with ratings, capacity, and certifications." />
          <FeatureCard title="AI RFP Builder" desc="Turn objectives into structured RFPs and auto-match best-fit vendors." />
          <FeatureCard title="Auto Scoring" desc="Weighted, auditable scoring for proposals." />
          <FeatureCard title="Contracts & SLAs" desc="Digital contracts, clause libraries, e-signature, and SLA tracking." />
          <FeatureCard title="Delivery Tracking" desc="Milestones, approvals and dependencies in one live board." />
          <FeatureCard title="Renewals & Compliance" desc="Forecast renewals, track spend, and export compliance reports." />
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6 bg-white">
            <h3 className="font-semibold mb-3">Generate an RFP draft</h3>
            <RfpForm onGenerate={generateRFP} />
            {rfpResult && <pre className="mt-3 max-h-48 overflow-auto text-xs p-3 border rounded">{rfpResult}</pre>}
          </div>

          <div className="rounded-2xl border p-6 bg-white">
            <h3 className="font-semibold mb-3">Find vendors</h3>
            <div className="flex gap-3">
              <input value={vendorQuery} onChange={(e) => setVendorQuery(e.target.value)} placeholder="Search vendors (e.g., fintech KYC)" className="flex-1 rounded-xl border px-3 py-2" />
              <button className="rounded-xl px-4 py-2 bg-blue-600 text-white" onClick={() => searchVendors(vendorQuery)}>Search</button>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {vendors.length === 0 && <div className="text-sm text-gray-500">No results yet. Try a query.</div>}
              {vendors.map((v, i) => (
                <div key={i} className="rounded-xl border p-3 bg-white">
                  <div className="font-semibold">{v.name}</div>
                  <div className="text-xs text-gray-500">{v.services}</div>
                  <div className="mt-2 text-sm text-gray-700">{v.summary}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section id="pricing" title="Business Model" subtitle="Flexible pricing for teams of every size.">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border p-6 bg-white">
            <div className="text-xl font-semibold">Starter</div>
            <div className="mt-2 text-3xl font-bold">Free</div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Up to 3 projects</li>
              <li>Email support</li>
            </ul>
            <button className="mt-4 rounded-xl px-4 py-2 bg-blue-600 text-white">Choose</button>
          </div>

          <div className="rounded-2xl border p-6 bg-white">
            <div className="text-xl font-semibold">Growth</div>
            <div className="mt-2 text-3xl font-bold">₹29,999</div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Unlimited RFPs</li>
              <li>Scoring engine</li>
            </ul>
            <button className="mt-4 rounded-xl px-4 py-2 bg-blue-600 text-white">Choose</button>
          </div>

          <div className="rounded-2xl border p-6 bg-white">
            <div className="text-xl font-semibold">Enterprise</div>
            <div className="mt-2 text-3xl font-bold">Custom</div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>SSO/SAML</li>
              <li>Audit logs</li>
            </ul>
            <button className="mt-4 rounded-xl px-4 py-2 bg-blue-600 text-white">Contact Sales</button>
          </div>
        </div>
      </Section>

      {/* Contact & Subscribe */}
      <Section id="contact" title="Talk to our team" subtitle="Tell us about your needs and we'll tailor a demo.">
        <div className="max-w-3xl mx-auto">
          <LeadForm onSubmit={async (data) => {
            try {
              const res = await fetch('/api/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (res.ok) {
                setToast('Demo request submitted.');
              } else {
                setToast('Submission failed.');
              }
            } catch (err) {
              setToast('Network error.');
            }
          }} />

          <div className="mt-8">
            <form onSubmit={(e) => { e.preventDefault(); handleSubscribe(); }} className="flex gap-3">
              <input value={subscribeEmail} onChange={(e) => setSubscribeEmail(e.target.value)} placeholder="Work email" className="flex-1 rounded-xl border px-3 py-2" />
              <button type="submit" className="rounded-xl px-4 py-2 bg-blue-600 text-white">Subscribe</button>
            </form>
          </div>
        </div>
      </Section>

      <Footer />

      {toast && <div className="fixed right-4 bottom-4 bg-black text-white px-4 py-2 rounded">{toast}</div>}
    </div>
  );

  async function searchVendors(query: string) {
    // small wrapper that uses outer searchVendors to perform actual fetch
    await searchVendorsInner(query);
  }

  async function searchVendorsInner(query: string) {
    try {
      const res = await fetch(`/api/vendors/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          setVendors(json as Vendor[]);
        } else if (json?.vendors && Array.isArray(json.vendors)) {
          setVendors(json.vendors as Vendor[]);
        } else {
          setVendors([]);
        }
      }
    } catch (err) {
      setVendors([]);
    }
  }
}

function RfpForm({ onGenerate }: { onGenerate: (goal: string, scope: string, budget: string) => Promise<void> }): JSX.Element {
  const [goal, setGoal] = useState<string>('');
  const [scope, setScope] = useState<string>('');
  const [budget, setBudget] = useState<string>('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onGenerate(goal, scope, budget);
      }}
      className="grid gap-3"
    >
      <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal (e.g., build mobile app)" className="rounded-xl border px-3 py-2" required />
      <input value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Scope (key features)" className="rounded-xl border px-3 py-2" />
      <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget (₹)" className="rounded-xl border px-3 py-2" />
      <button type="submit" className="rounded-xl px-4 py-2 bg-blue-600 text-white">Generate RFP</button>
    </form>
  );
}

function LeadForm({ onSubmit }: { onSubmit: (data: { name: string; email: string; company: string; size?: string; message?: string }) => Promise<void> }): JSX.Element {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({ name, email, company, size, message });
      }}
      className="grid md:grid-cols-2 gap-3"
    >
      <input value={name} onChange={(e) => setName(e.target.value)} name="name" placeholder="Full name" required className="rounded-xl border px-3 py-2" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} name="email" type="email" placeholder="Work email" required className="rounded-xl border px-3 py-2" />
      <input value={company} onChange={(e) => setCompany(e.target.value)} name="company" placeholder="Company" required className="rounded-xl border px-3 py-2" />
      <input value={size} onChange={(e) => setSize(e.target.value)} name="size" placeholder="Team size" className="rounded-xl border px-3 py-2" />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} name="message" placeholder="Tell us about your goals" className="rounded-xl border px-3 py-2 md:col-span-2" />
      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" className="rounded-xl px-4 py-2 bg-blue-600 text-white">Request a Demo</button>
      </div>
    </form>
  );
}

function Footer(): JSX.Element {
  return (
    <footer className="border-t py-10 text-sm bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
        <div>
          <div className="font-bold text-lg">VendoAI</div>
          <p className="mt-2 text-gray-600">The AI platform for end-to-end vendor acquisition.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Product</div>
          <ul className="space-y-2 text-gray-600">
            <li><a href="#solution">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#contact">FAQ</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Company</div>
          <ul className="space-y-2 text-gray-600">
            <li>About</li>
            <li>Security</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Legal</div>
          <ul className="space-y-2 text-gray-600">
            <li>Privacy</li>
            <li>Terms</li>
            <li>DPA</li>
          </ul>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-gray-500">© {new Date().getFullYear()} VendoAI. All rights reserved.</div>
    </footer>
  );
}
