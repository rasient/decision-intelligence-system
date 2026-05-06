"use client";

import React, { useMemo, useState } from "react";
import {
  Inbox, GitBranch, ClipboardList, RotateCcw, Search, CircleAlert,
  Sparkles, Brain, Activity, TimerReset, SlidersHorizontal,
  Database, ShieldCheck, Waypoints, Plus, Users, Zap
} from "lucide-react";

const SIGNAL = "signal";
const NOISE = "noise";
const UNSURE = "unsure";

type InputType = typeof SIGNAL | typeof NOISE | typeof UNSURE;

type SignalInput = {
  id: number;
  text: string;
  type: InputType;
  source: string;
  team: string;
  ageDays: number;
  confidence: number;
};

type Decision = {
  id: number;
  title: string;
  matters: string;
  ignored: string;
  tradeoff: string;
  confidence: number;
  outcome: string | null;
  latencyDays: number;
  affectedTeams: string[];
};

const initialInputs: SignalInput[] = [
  { id: 1, text: "A key customer repeated the same complaint for the third time", type: SIGNAL, source: "CRM", team: "Customer Success", ageDays: 2, confidence: 88 },
  { id: 2, text: "Meetings feel useful, but decisions keep moving to next week", type: UNSURE, source: "Calendar", team: "Leadership", ageDays: 8, confidence: 63 },
  { id: 3, text: "A competitor launched an impressive-looking feature on social media", type: NOISE, source: "Market scan", team: "Product", ageDays: 1, confidence: 72 },
  { id: 4, text: "Support tickets are stable, but resolution time increased by 28%", type: SIGNAL, source: "Support", team: "Operations", ageDays: 5, confidence: 91 },
  { id: 5, text: "One loud stakeholder is pushing for an urgent roadmap change", type: UNSURE, source: "Slack", team: "Product", ageDays: 3, confidence: 58 },
  { id: 6, text: "Two teams solved the same problem differently without knowing it", type: SIGNAL, source: "Jira", team: "Engineering", ageDays: 12, confidence: 84 },
  { id: 7, text: "A Slack thread got emotional but did not change any decision", type: NOISE, source: "Slack", team: "Sales", ageDays: 1, confidence: 67 },
  { id: 8, text: "The same approval bottleneck appeared in three separate projects", type: SIGNAL, source: "Jira", team: "Operations", ageDays: 16, confidence: 94 },
];

const initialDecisions: Decision[] = [
  {
    id: 1,
    title: "Should we hire a PM?",
    matters: "Delivery speed and ownership clarity",
    ignored: "Short-term cost and onboarding friction",
    tradeoff: "Slower ramp-up now for better scale later",
    confidence: 4,
    outcome: null,
    latencyDays: 12,
    affectedTeams: ["Product", "Engineering"],
  },
  {
    id: 2,
    title: "Delay Feature X?",
    matters: "Stability before expansion",
    ignored: "Client pressure this week",
    tradeoff: "Short-term dissatisfaction for lower system risk",
    confidence: 3,
    outcome: "same",
    latencyDays: 5,
    affectedTeams: ["Product", "Sales", "Support"],
  },
  {
    id: 3,
    title: "Merge duplicate workflows?",
    matters: "Reduce rework and hidden coordination cost",
    ignored: "Temporary disruption to existing team routines",
    tradeoff: "Short-term friction for long-term coherence",
    confidence: 5,
    outcome: "better",
    latencyDays: 21,
    affectedTeams: ["Engineering", "Operations"],
  },
];

const memoryPatterns = [
  { title: "Approval bottleneck pattern", description: "Repeated signals show decisions slow down when ownership crosses Product → Operations.", seen: 4, risk: "High" },
  { title: "Cost ignored in scaling decisions", description: "Several decisions ignored onboarding or operating cost, later creating coordination load.", seen: 3, risk: "Medium" },
  { title: "Stable surface, degraded flow", description: "Metrics looked stable while resolution time and handoff latency were degrading.", seen: 2, risk: "High" },
];

const aiPatterns = [
  "Repeated bottlenecks suggest a coordination issue, not an execution issue.",
  "Leadership confidence is high while operational confidence is lower. Possible perception gap.",
  "Signals older than 10 days are still unresolved. Latency risk is accumulating.",
  "Several decisions optimize for speed while ignoring onboarding cost.",
];

const teamPerceptions = [
  { team: "Leadership", status: "Stable", score: 82 },
  { team: "Product", status: "Overloaded", score: 61 },
  { team: "Engineering", status: "Blocked", score: 54 },
  { team: "Operations", status: "Fragile", score: 48 },
  { team: "Sales", status: "Urgent", score: 69 },
];

const consequenceNodes = [
  ["Delayed hiring", "Team overload"],
  ["Team overload", "Decision latency"],
  ["Decision latency", "Coordination breakdown"],
  ["Coordination breakdown", "Client friction"],
  ["Client friction", "Revenue risk"],
];

const externalSources = [
  { name: "Slack", status: "Mock connected", signals: 14 },
  { name: "Jira", status: "Mock connected", signals: 9 },
  { name: "Calendar", status: "Mock connected", signals: 6 },
  { name: "CRM", status: "Mock connected", signals: 4 },
  { name: "Support", status: "Mock connected", signals: 11 },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ type }: { type: InputType }) {
  const styles: Record<InputType, string> = {
    signal: "bg-green-100 text-green-700 border-green-200",
    noise: "bg-gray-100 text-gray-600 border-gray-200",
    unsure: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };
  const labels: Record<InputType, string> = { signal: "Signal", noise: "Noise", unsure: "Not sure" };
  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[type]}`}>{labels[type]}</span>;
}

function StatCard({ label, value, note, darkMode }: { label: string; value: number | string; note: string; darkMode: boolean }) {
  return (
    <div className={cx("rounded-2xl border p-4 shadow-sm", darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white")}>
      <p className={cx("text-xs font-medium uppercase tracking-wide", darkMode ? "text-gray-400" : "text-gray-500")}>{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className={cx("mt-1 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>{note}</p>
    </div>
  );
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cx("flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition", active ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-950")}>
      <Icon size={17} />{label}
    </button>
  );
}

function AssistCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
      <div className="flex items-center gap-2 font-semibold"><Sparkles size={16} /> OpenAI assist</div>
      <p className="mt-2">{children}</p>
    </div>
  );
}

function Panel({ children, darkMode }: { children: React.ReactNode; darkMode: boolean }) {
  return <section className={cx("rounded-3xl border p-6 shadow-sm", darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white")}>{children}</section>;
}

function Field({ label, helper, placeholder, value, onChange, darkMode }: { label: string; helper?: string; placeholder: string; value: string; onChange: (value: string) => void; darkMode: boolean }) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      {helper && <p className={cx("mt-1 text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>{helper}</p>}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cx("mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-600", darkMode ? "border-gray-800 bg-gray-950 text-white" : "border-gray-200 bg-gray-50 text-gray-950")} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1">{value}</p></div>;
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white"><Icon size={21} /></div>
      <div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-gray-500">{subtitle}</p></div>
    </div>
  );
}

export default function DecisionIntelligenceSystem() {
  const [screen, setScreen] = useState("inbox");
  const [darkMode, setDarkMode] = useState(false);
  const [inputs, setInputs] = useState<SignalInput[]>(initialInputs);
  const [decisions, setDecisions] = useState<Decision[]>(initialDecisions);
  const [newInput, setNewInput] = useState("");
  const [newType, setNewType] = useState<InputType>(SIGNAL);
  const [scenarioSpeed, setScenarioSpeed] = useState(65);
  const [scenarioQuality, setScenarioQuality] = useState(55);
  const [scenarioCost, setScenarioCost] = useState(40);
  const [draft, setDraft] = useState({ title: "", matters: "", ignored: "", tradeoff: "", confidence: 3 });

  const stats = useMemo(() => {
    const signal = inputs.filter((i) => i.type === SIGNAL).length;
    const noise = inputs.filter((i) => i.type === NOISE).length;
    const unsure = inputs.filter((i) => i.type === UNSURE).length;
    const integrity = Math.round(inputs.reduce((acc, i) => acc + i.confidence, 0) / inputs.length);
    const latency = Math.round(decisions.reduce((acc, d) => acc + d.latencyDays, 0) / decisions.length);
    return { signal, noise, unsure, integrity, latency };
  }, [inputs, decisions]);

  const scenarioRisk = Math.min(100, Math.round((scenarioSpeed * 0.55 + (100 - scenarioQuality) * 0.35 + (100 - scenarioCost) * 0.1)));
  const canSaveDecision = draft.title && draft.matters && draft.ignored && draft.tradeoff;

  const addInput = () => {
    if (!newInput.trim()) return;
    setInputs([{ id: Date.now(), text: newInput.trim(), type: newType, source: "Manual", team: "Leadership", ageDays: 0, confidence: newType === SIGNAL ? 80 : newType === NOISE ? 60 : 55 }, ...inputs]);
    setNewInput("");
    setNewType(SIGNAL);
  };

  const saveDecision = () => {
    if (!canSaveDecision) return;
    setDecisions([{ id: Date.now(), ...draft, outcome: null, latencyDays: 0, affectedTeams: ["Leadership"] }, ...decisions]);
    setDraft({ title: "", matters: "", ignored: "", tradeoff: "", confidence: 3 });
    setScreen("log");
  };

  const reviewDecision = (id: number, outcome: string) => {
    setDecisions(decisions.map((d) => (d.id === id ? { ...d, outcome } : d)));
  };

  return (
    <div className={cx("min-h-screen", darkMode ? "bg-gray-950 text-white" : "bg-[#f7f5ef] text-gray-950")}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">
        <header className={cx("flex flex-col justify-between gap-4 rounded-3xl border p-5 shadow-sm md:flex-row md:items-center", darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white")}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-950 text-white"><GitBranch size={22} /></div>
            <div><h1 className="text-2xl font-bold tracking-tight">Decision Intelligence System</h1><p className={cx("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Turn signals, decisions, and feedback into organizational intelligence.</p></div>
          </div>

          <nav className="flex flex-wrap gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className={cx("rounded-xl px-4 py-2 text-sm font-medium transition", darkMode ? "bg-white text-gray-950" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}>{darkMode ? "Light" : "Dark"}</button>
            <NavButton active={screen === "inbox"} icon={Inbox} label="Inbox" onClick={() => setScreen("inbox")} />
            <NavButton active={screen === "builder"} icon={Plus} label="Builder" onClick={() => setScreen("builder")} />
            <NavButton active={screen === "log"} icon={ClipboardList} label="Log" onClick={() => setScreen("log")} />
            <NavButton active={screen === "review"} icon={RotateCcw} label="Review" onClick={() => setScreen("review")} />
            <NavButton active={screen === "intelligence"} icon={Brain} label="Intelligence" onClick={() => setScreen("intelligence")} />
            <NavButton active={screen === "simulation"} icon={SlidersHorizontal} label="Simulation" onClick={() => setScreen("simulation")} />
          </nav>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <StatCard darkMode={darkMode} label="Signals" value={stats.signal} note="Worth acting on" />
          <StatCard darkMode={darkMode} label="Noise" value={stats.noise} note="Intentionally ignored" />
          <StatCard darkMode={darkMode} label="Uncertain" value={stats.unsure} note="Patterns to watch" />
          <StatCard darkMode={darkMode} label="Integrity" value={`${stats.integrity}%`} note="Signal quality score" />
          <StatCard darkMode={darkMode} label="Latency" value={`${stats.latency}d`} note="Avg decision delay" />
        </section>

        {screen === "inbox" && (
          <main className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel darkMode={darkMode}>
              <h2 className="text-xl font-semibold">Capture input</h2>
              <p className={cx("mt-1 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Every input must be classified before it can affect a decision.</p>
              <textarea value={newInput} onChange={(e) => setNewInput(e.target.value)} placeholder="What happened? Example: Team is waiting on legal approval." className={cx("mt-5 min-h-32 w-full rounded-2xl border p-4 text-sm outline-none focus:border-blue-600", darkMode ? "border-gray-800 bg-gray-950 text-white" : "border-gray-200 bg-gray-50 text-gray-950")} />
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[[SIGNAL, "Signal"], [NOISE, "Noise"], [UNSURE, "Not sure"]].map(([type, label]) => (
                  <button key={type} onClick={() => setNewType(type as InputType)} className={cx("rounded-2xl border px-4 py-3 text-sm font-medium transition", newType === type ? "border-blue-600 bg-blue-600 text-white" : darkMode ? "border-gray-800 bg-gray-950 text-gray-300 hover:bg-gray-800" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}>{label}</button>
                ))}
              </div>
              <button onClick={addInput} className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40" disabled={!newInput.trim()}>Add input</button>
              <AssistCard>Future OpenAI layer: classify the input, detect missing context, and suggest whether this is signal, noise, or an early weak signal.</AssistCard>
            </Panel>

            <Panel darkMode={darkMode}>
              <div className="flex items-center justify-between gap-3">
                <div><h2 className="text-xl font-semibold">Input inbox</h2><p className={cx("mt-1 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Chaos becomes useful once it is filtered.</p></div>
                <Search className="text-gray-400" size={20} />
              </div>
              <div className="mt-5 space-y-3">
                {inputs.map((input) => (
                  <div key={input.id} className={cx("rounded-2xl border p-4", darkMode ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-gray-50")}>
                    <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium">{input.text}</p><Badge type={input.type} /></div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500"><span>{input.source}</span><span>•</span><span>{input.team}</span><span>•</span><span>{input.ageDays}d old</span><span>•</span><span>{input.confidence}% confidence</span></div>
                  </div>
                ))}
              </div>
            </Panel>
          </main>
        )}

        {screen === "builder" && (
          <main className={cx("mx-auto w-full max-w-3xl rounded-3xl border p-6 shadow-sm", darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white")}>
            <h2 className="text-xl font-semibold">Decision builder</h2>
            <p className={cx("mt-1 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>You cannot save a decision until the trade-off is explicit.</p>
            <AssistCard>AI should not decide for the leader. It should surface assumptions, missing trade-offs, and possible blind spots.</AssistCard>
            <div className="mt-6 space-y-5">
              <Field darkMode={darkMode} label="Decision" placeholder="Should we hire a new PM?" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
              <Field darkMode={darkMode} label="What matters?" placeholder="Growth, stability, delivery speed..." value={draft.matters} onChange={(v) => setDraft({ ...draft, matters: v })} />
              <Field darkMode={darkMode} label="What are you ignoring?" helper="If you don’t define this, the system will decide it for you." placeholder="Short-term cost, client pressure, discomfort..." value={draft.ignored} onChange={(v) => setDraft({ ...draft, ignored: v })} />
              <Field darkMode={darkMode} label="Trade-off accepted" placeholder="What are you willing to pay for this choice?" value={draft.tradeoff} onChange={(v) => setDraft({ ...draft, tradeoff: v })} />
              <div><label className="text-sm font-semibold">Confidence: {draft.confidence}/5</label><input type="range" min="1" max="5" value={draft.confidence} onChange={(e) => setDraft({ ...draft, confidence: Number(e.target.value) })} className="mt-3 w-full" /></div>
              <button disabled={!canSaveDecision} onClick={saveDecision} className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">Save decision</button>
            </div>
          </main>
        )}

        {screen === "log" && (
          <Panel darkMode={darkMode}>
            <h2 className="text-xl font-semibold">Decision log</h2>
            <p className={cx("mt-1 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>The visibility layer: what mattered, what was ignored, and what trade-off was accepted.</p>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {decisions.map((decision) => (
                <article key={decision.id} className={cx("rounded-3xl border p-5", darkMode ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-gray-50")}>
                  <div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold">{decision.title}</h3><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Confidence {decision.confidence}/5</span></div>
                  <div className="mt-4 space-y-3 text-sm"><Info label="Focus" value={decision.matters} /><Info label="Ignored" value={decision.ignored} /><Info label="Trade-off" value={decision.tradeoff} /><Info label="Affected teams" value={decision.affectedTeams.join(", ")} /></div>
                  {decision.latencyDays > 10 && <div className="mt-4 flex items-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800"><CircleAlert size={17} /> Latency risk: this decision waited {decision.latencyDays} days.</div>}
                </article>
              ))}
            </div>
          </Panel>
        )}

        {screen === "review" && (
          <Panel darkMode={darkMode}>
            <h2 className="text-xl font-semibold">Feedback loop</h2>
            <p className={cx("mt-1 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>A decision is not complete until the system learns from it.</p>
            <AssistCard>AI can compare expected vs actual outcomes and ask: was the signal wrong, the interpretation wrong, or the decision too late?</AssistCard>
            <div className="mt-6 space-y-4">
              {decisions.map((decision) => (
                <article key={decision.id} className={cx("rounded-3xl border p-5", darkMode ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-gray-50")}>
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div><h3 className="font-semibold">{decision.title}</h3><p className={cx("mt-1 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Was the outcome better, same, or worse?</p></div>
                    <div className="flex gap-2">{[["better", "Better"], ["same", "Same"], ["worse", "Worse"]].map(([outcome, label]) => <button key={outcome} onClick={() => reviewDecision(decision.id, outcome)} className={cx("rounded-xl px-4 py-2 text-sm font-medium transition", decision.outcome === outcome ? "bg-blue-600 text-white" : darkMode ? "bg-gray-900 text-gray-300 hover:bg-gray-800" : "bg-white text-gray-600 hover:bg-gray-100")}>{label}</button>)}</div>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        )}

        {screen === "intelligence" && (
          <main className="grid gap-6 lg:grid-cols-2">
            <Panel darkMode={darkMode}>
              <SectionTitle icon={Brain} title="Organizational memory" subtitle="The system remembers recurring patterns instead of treating every issue as new." />
              <div className="mt-6 space-y-4">{memoryPatterns.map((p) => <div key={p.title} className={cx("rounded-2xl border p-4", darkMode ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-gray-50")}><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{p.title}</h3><span className={cx("rounded-full px-3 py-1 text-xs font-medium", p.risk === "High" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800")}>{p.risk} risk</span></div><p className="mt-2 text-sm text-gray-500">{p.description}</p><p className="mt-2 text-xs text-gray-500">Seen {p.seen} times</p></div>)}</div>
            </Panel>

            <Panel darkMode={darkMode}>
              <SectionTitle icon={Sparkles} title="AI pattern detection" subtitle="AI-assisted reflection on decision patterns and system behavior." />
              <div className="mt-6 space-y-3">{aiPatterns.map((p, idx) => <div key={idx} className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">{p}</div>)}</div>
            </Panel>

            <Panel darkMode={darkMode}>
              <SectionTitle icon={Users} title="Cross-team perception map" subtitle="Detect where teams see different realities." />
              <div className="mt-6 space-y-4">{teamPerceptions.map((team) => <div key={team.team}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">{team.team}</span><span className="text-gray-500">{team.status} · {team.score}%</span></div><div className={cx("h-3 rounded-full", darkMode ? "bg-gray-800" : "bg-gray-100")}><div className={cx("h-3 rounded-full", team.score < 55 ? "bg-red-500" : team.score < 70 ? "bg-yellow-500" : "bg-green-500")} style={{ width: `${team.score}%` }} /></div></div>)}</div>
            </Panel>

            <Panel darkMode={darkMode}>
              <SectionTitle icon={Waypoints} title="Decision consequence graph" subtitle="Show how one delayed decision can create downstream effects." />
              <div className="mt-6 space-y-3">{consequenceNodes.map(([from, to], idx) => <div key={idx} className={cx("flex items-center gap-3 rounded-2xl border p-3 text-sm", darkMode ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-gray-50")}><span className="font-medium">{from}</span><span className="text-blue-600">→</span><span>{to}</span></div>)}</div>
            </Panel>

            <Panel darkMode={darkMode}>
              <SectionTitle icon={ShieldCheck} title="Signal integrity scoring" subtitle="Score whether the organization is seeing reality clearly enough." />
              <div className="mt-6"><div className="text-5xl font-bold">{stats.integrity}%</div><p className="mt-2 text-sm text-gray-500">Current signal quality based on confidence, source diversity, age, and classification clarity.</p></div>
            </Panel>

            <Panel darkMode={darkMode}>
              <SectionTitle icon={TimerReset} title="Latency detection" subtitle="Detect when truth arrived too late to act cheaply." />
              <div className="mt-6 space-y-3">{decisions.map((d) => <div key={d.id} className={cx("rounded-2xl border p-4", darkMode ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-gray-50")}><div className="flex items-center justify-between gap-3"><span className="font-medium">{d.title}</span><span className={cx("rounded-full px-3 py-1 text-xs font-medium", d.latencyDays > 10 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>{d.latencyDays} days</span></div></div>)}</div>
            </Panel>

            <Panel darkMode={darkMode}>
              <SectionTitle icon={Database} title="External signal ingestion" subtitle="Mock connectors for future Slack, Jira, Calendar, CRM, and Support data." />
              <div className="mt-6 space-y-3">{externalSources.map((source) => <div key={source.name} className={cx("flex items-center justify-between rounded-2xl border p-4", darkMode ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-gray-50")}><div><p className="font-medium">{source.name}</p><p className="text-xs text-gray-500">{source.status}</p></div><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">{source.signals} signals</span></div>)}</div>
            </Panel>

            <Panel darkMode={darkMode}>
              <SectionTitle icon={Activity} title="System health model" subtitle="Not a KPI dashboard — a coherence model." />
              <div className="mt-6 grid grid-cols-2 gap-3">{[["Coordination quality", 58], ["Decision latency", 64], ["Signal integrity", stats.integrity], ["Perception alignment", 52]].map(([label, value]) => <div key={String(label)} className={cx("rounded-2xl border p-4", darkMode ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-gray-50")}><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}%</p></div>)}</div>
            </Panel>
          </main>
        )}

        {screen === "simulation" && (
          <main className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel darkMode={darkMode}>
              <SectionTitle icon={SlidersHorizontal} title="Scenario simulation" subtitle="Explore trade-offs before committing to a decision." />
              <div className="mt-6 space-y-6">
                <div><label className="text-sm font-semibold">Optimize for speed: {scenarioSpeed}%</label><input className="mt-3 w-full" type="range" min="0" max="100" value={scenarioSpeed} onChange={(e) => setScenarioSpeed(Number(e.target.value))} /></div>
                <div><label className="text-sm font-semibold">Protect quality: {scenarioQuality}%</label><input className="mt-3 w-full" type="range" min="0" max="100" value={scenarioQuality} onChange={(e) => setScenarioQuality(Number(e.target.value))} /></div>
                <div><label className="text-sm font-semibold">Control cost: {scenarioCost}%</label><input className="mt-3 w-full" type="range" min="0" max="100" value={scenarioCost} onChange={(e) => setScenarioCost(Number(e.target.value))} /></div>
              </div>
            </Panel>

            <Panel darkMode={darkMode}>
              <SectionTitle icon={Zap} title="Simulated consequence" subtitle="A simple model for showing likely system pressure." />
              <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-6 text-blue-900"><p className="text-sm font-medium uppercase tracking-wide">Coordination risk</p><p className="mt-3 text-6xl font-bold">{scenarioRisk}%</p><p className="mt-4 text-sm">If speed rises faster than quality and cost control, coordination risk increases. This is not a prediction — it is a thinking aid.</p></div>
              <div className="mt-6 space-y-3"><div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">Likely trade-off: faster execution may increase rework and hidden handoff cost.</div><div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">Recommended next question: what must become explicit before speed is increased?</div></div>
            </Panel>
          </main>
        )}

        <button onClick={() => setScreen("inbox")} className="fixed bottom-5 right-5 z-50 rounded-full bg-blue-600 px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700 md:hidden">+ Capture</button>
      </div>
    </div>
  );
}
