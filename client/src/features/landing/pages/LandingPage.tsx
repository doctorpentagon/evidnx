import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Check,
  FileSpreadsheet,
  GraduationCap,
  Menu,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const workflow = [
  { icon: FileSpreadsheet, title: "Bring your data", body: "Import CSV or Excel, paste a table, or collect responses with a questionnaire." },
  { icon: ShieldCheck, title: "Check before testing", body: "Review variable types, missing data, assumptions, and the usable sample before analysis." },
  { icon: BarChart3, title: "Run the right analysis", body: "See the recommended method, why it fits, alternatives, effect sizes, tables, and responsive charts." },
  { icon: BookOpenCheck, title: "Explain and report", body: "Turn validated results into plain-language or academic writing with methods and limitations kept visible." },
];

const audiences = [
  { name: "Starter", forWhom: "Undergraduates and independent learners", price: "Free beta", features: ["Guided data checks", "Core statistical analyses", "Learning explanations"] },
  { name: "Pro", forWhom: "Researchers and young professionals", price: "Coming after beta", features: ["Deeper analysis workflows", "Report and citation tools", "Reusable projects and exports"] },
  { name: "Teams", forWhom: "Labs, NGOs, consultants and organisations", price: "Talk to us", features: ["Shared standards", "Review workflows", "Organisation-ready controls"] },
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-white text-ink">
      <header className="sticky top-0 z-40 border-b border-surface-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="EvidNX home">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-extrabold text-white">E</span>
            <span className="text-heading-sm font-bold">EvidNX</span>
          </Link>
          <nav className="hidden items-center gap-7 text-secondary font-medium md:flex" aria-label="Primary navigation">
            <a href="#how-it-works" className="hover:text-brand-600">How it works</a>
            <a href="#learning" className="hover:text-brand-600">Learn</a>
            <a href="#pricing" className="hover:text-brand-600">Pricing</a>
            <Link to="/app" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-500 px-5 text-white hover:bg-brand-600">
              Open workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
          <button className="flex h-11 w-11 items-center justify-center rounded-md border border-surface-border md:hidden" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Toggle navigation">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {menuOpen ? (
          <nav className="border-t border-surface-border px-4 py-4 md:hidden" aria-label="Mobile navigation">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              <a href="#how-it-works" className="min-h-11 rounded-md px-3 py-2.5" onClick={() => setMenuOpen(false)}>How it works</a>
              <a href="#learning" className="min-h-11 rounded-md px-3 py-2.5" onClick={() => setMenuOpen(false)}>Learn</a>
              <a href="#pricing" className="min-h-11 rounded-md px-3 py-2.5" onClick={() => setMenuOpen(false)}>Pricing</a>
              <Link to="/app" className="mt-2 inline-flex min-h-11 items-center justify-center rounded-md bg-brand-500 px-5 font-semibold text-white">Open workspace</Link>
            </div>
          </nav>
        ) : null}
      </header>

      <main>
        <section className="overflow-hidden bg-gradient-to-b from-brand-50 to-white">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-helper font-semibold uppercase tracking-wide text-brand-700">
                <Sparkles className="h-4 w-4" /> Guided statistics, evidence first
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
                From raw data to a result you can explain and defend.
              </h1>
              <p className="mt-6 max-w-2xl text-body-lg text-ink-muted sm:text-xl">
                EvidNX helps students, researchers, analysts and young professionals prepare data, choose appropriate statistical methods, check assumptions, understand results, and build clear reports—without hiding the evidence behind the answer.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/app" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-500 px-6 font-semibold text-white shadow-card hover:bg-brand-600">
                  Explore the workspace <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-md border border-surface-border bg-white px-6 font-semibold hover:border-brand-300 hover:text-brand-700">
                  See the analysis flow
                </a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-secondary text-ink-secondary">
                {["No coding required", "Assumptions made visible", "Learn while you analyse"].map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-ai-500" />{item}</span>)}
              </div>
            </div>

            <div className="relative rounded-2xl border border-surface-border bg-white p-4 shadow-card sm:p-6">
              <div className="rounded-xl bg-navy-800 p-5 text-white">
                <p className="text-helper font-semibold uppercase tracking-wider text-brand-200">Recommended analysis</p>
                <p className="mt-2 text-heading font-bold">Welch’s independent-samples t-test</p>
                <p className="mt-2 text-secondary text-navy-100">Two independent groups, numeric outcome, unequal variances detected.</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-ai-200 bg-ai-50 p-4"><p className="text-helper font-semibold uppercase text-ai-700">Assumptions</p><p className="mt-1 font-semibold">Safe with correction</p><p className="mt-1 text-secondary text-ink-muted">Normality acceptable; pooled variance rejected.</p></div>
                <div className="rounded-lg border border-surface-border p-4"><p className="text-helper font-semibold uppercase text-ink-muted">Effect and uncertainty</p><p className="mt-1 font-semibold">Difference + 95% CI</p><p className="mt-1 text-secondary text-ink-muted">Report practical size, not only a p-value.</p></div>
              </div>
              <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4">
                <p className="font-semibold text-brand-800">What this means</p>
                <p className="mt-1 text-secondary text-ink-secondary">The groups differ, but EvidNX keeps the sample, assumptions, effect size and limitations beside the explanation.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl"><p className="text-secondary font-semibold text-brand-600">One connected workflow</p><h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">The test is only one part of trustworthy analysis.</h2><p className="mt-4 text-body-lg text-ink-muted">EvidNX connects preparation, method choice, diagnostics, interpretation and reporting so users can see how a conclusion was reached.</p></div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {workflow.map(({ icon: Icon, title, body }, index) => <article key={title} className="rounded-xl border border-surface-border bg-white p-5 shadow-card"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span><p className="mt-5 text-helper font-bold text-brand-600">0{index + 1}</p><h3 className="mt-1 text-heading-sm font-semibold">{title}</h3><p className="mt-2 text-secondary text-ink-muted">{body}</p></article>)}
            </div>
          </div>
        </section>

        <section id="learning" className="scroll-mt-20 bg-navy-800 py-16 text-white sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500"><GraduationCap className="h-6 w-6" /></span><h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Education belongs inside the analysis.</h2><p className="mt-4 text-body-lg text-navy-100">Open a concise explanation beside the result you are viewing. Learn what the statistic measures, why assumptions matter, what alternatives exist, and what the method cannot prove.</p></div>
            <div className="rounded-xl border border-navy-400 bg-navy-700 p-6"><p className="text-helper font-semibold uppercase tracking-wide text-brand-200">Contextual lesson</p><h3 className="mt-2 text-heading font-bold">Why Welch instead of the pooled t-test?</h3><p className="mt-3 text-secondary text-navy-100">Welch’s correction allows the groups to have different variances and sample sizes. It preserves the mean-comparison question without changing to a rank-based hypothesis.</p><div className="mt-5 rounded-lg bg-navy-800 p-4 text-secondary text-navy-100">EvidNX will show the diagnostic, decision rule and selected calculation together.</div></div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center"><p className="text-secondary font-semibold text-brand-600">Accessible by design</p><h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Start learning and analysing before paying.</h2><p className="mt-4 text-body-lg text-ink-muted">Pricing will grow with depth and collaboration—not by hiding basic statistical understanding.</p></div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {audiences.map((tier, index) => <article key={tier.name} className={`rounded-xl border p-6 ${index === 1 ? "border-brand-300 bg-brand-50 shadow-card" : "border-surface-border bg-white"}`}><p className="text-heading-sm font-bold">{tier.name}</p><p className="mt-1 text-secondary text-ink-muted">{tier.forWhom}</p><p className="mt-6 text-heading font-bold text-brand-700">{tier.price}</p><ul className="mt-6 space-y-3 text-secondary">{tier.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-ai-500" />{feature}</li>)}</ul></article>)}
            </div>
            <p className="mt-5 text-center text-helper text-ink-muted">Pricing is indicative while the validated beta is being built. No payment flow is active yet.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-border bg-surface-canvas"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-secondary text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>© 2026 EvidNX. Understand the evidence behind the answer.</p><Link to="/app" className="font-semibold text-brand-700">Open workspace</Link></div></footer>
    </div>
  );
}
