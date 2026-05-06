"use client";

import React, { useMemo, useState } from "react";
import {
  Plus,
  Inbox,
  GitBranch,
  ClipboardList,
  RotateCcw,
  Search,
  CircleAlert,
  Sparkles,
} from "lucide-react";

const SIGNAL = "signal";
const NOISE = "noise";
const UNSURE = "unsure";

type InputType = typeof SIGNAL | typeof NOISE | typeof UNSURE;

type SignalInput = {
  id: number;
  text: string;
  type: InputType;
};

type Decision = {
  id: number;
  title: string;
  matters: string;
  ignored: string;
  tradeoff: string;
  confidence: number;
  outcome: string | null;
};

const initialInputs: SignalInput[] = [
  { id: 1, text: "A key customer repeated the same complaint for the third time", type: SIGNAL },
  { id: 2, text: "The team says meetings feel useful, but decisions keep moving to next week", type: UNSURE },
  { id: 3, text: "A competitor launched a feature that looks impressive on social media", type: NOISE },
  { id: 4, text: "Support tickets are stable, but resolution time increased by 28%", type: SIGNAL },
  { id: 5, text: "One loud stakeholder is pushing for an urgent roadmap change", type: UNSURE },
  { id: 6, text: "Two teams solved the same problem differently without knowing it", type: SIGNAL },
  { id: 7, text: "A Slack thread got emotional but did not change any decision", type: NOISE },
  { id: 8, text: "The same approval bottleneck appeared in three separate projects", type: SIGNAL },
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
  },
  {
    id: 2,
    title: "Delay Feature X?",
    matters: "Stability before expansion",
    ignored: "Client pressure this week",
    tradeoff: "Short-term dissatisfaction for lower system risk",
    confidence: 3,
    outcome: "same",
  },
];

function Badge({ type }: { type: InputType }) {
  const styles: Record<InputType, string> = {
    signal: "bg-green-100 text-green-700 border-green-200",
    noise: "bg-gray-100 text-gray-600 border-gray-200",
    unsure: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const labels: Record<InputType, string> = {
    signal: "Signal",
    noise: "Noise",
    unsure: "Not sure",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

function StatCard({ label, value, note, darkMode }: { label: string; value: number; note: string; darkMode: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{note}</p>
    </div>
  );
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
        active ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-950"
      }`}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

function AssistCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
      <div className="flex items-center gap-2 font-semibold">
        <Sparkles size={16} /> OpenAI assist
      </div>
      <p className="mt-2">{children}</p>
    </div>
  );
}

function Panel({ children, darkMode }: { children: React.ReactNode; darkMode: boolean }) {
  return (
    <section className={`rounded-3xl border p-6 shadow-sm ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
      {children}
    </section>
  );
}

function Field({
  label,
  helper,
  placeholder,
  value,
  onChange,
  darkMode,
}: {
  label: string;
  helper?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  darkMode: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      {helper && <p className={`mt-1 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{helper}</p>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-600 ${
          darkMode ? "border-gray-800 bg-gray-950 text-white" : "border-gray-200 bg-gray-50 text-gray-950"
        }`}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1">{value}</p>
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
  const [draft, setDraft] = useState({
    title: "",
    matters: "",
    ignored: "",
    tradeoff: "",
    confidence: 3,
  });

  const stats = useMemo(() => {
    const signal = inputs.filter((i) => i.type === SIGNAL).length;
    const noise = inputs.filter((i) => i.type === NOISE).length;
    const unsure = inputs.filter((i) => i.type === UNSURE).length;
    return { signal, noise, unsure };
  }, [inputs]);

  const canSaveDecision = draft.title && draft.matters && draft.ignored && draft.tradeoff;

  const addInput = () => {
    if (!newInput.trim()) return;
    setInputs([{ id: Date.now(), text: newInput.trim(), type: newType }, ...inputs]);
    setNewInput("");
    setNewType(SIGNAL);
  };

  const saveDecision = () => {
    if (!canSaveDecision) return;
    setDecisions([{ id: Date.now(), ...draft, outcome: null }, ...decisions]);
    setDraft({ title: "", matters: "", ignored: "", tradeoff: "", confidence: 3 });
    setScreen("log");
  };

  const reviewDecision = (id: number, outcome: string) => {
    setDecisions(decisions.map((d) => (d.id === id ? { ...d, outcome } : d)));
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-950 text-white" : "bg-[#f7f5ef] text-gray-950"}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">
        <header className={`flex flex-col justify-between gap-4 rounded-3xl border p-5 shadow-sm md:flex-row md:items-center ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-950 text-white">
              <GitBranch size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Decision Intelligence System</h1>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Turn signals, decisions, and feedback into organizational intelligence.
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                darkMode ? "bg-white text-gray-950" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {darkMode ? "Light" : "Dark"}
            </button>
            <NavButton active={screen === "inbox"} icon={Inbox} label="Inbox" onClick={() => setScreen("inbox")} />
            <NavButton active={screen === "builder"} icon={Plus} label="Builder" onClick={() => setScreen("builder")} />
            <NavButton active={screen === "log"} icon={ClipboardList} label="Log" onClick={() => setScreen("log")} />
            <NavButton active={screen === "review"} icon={RotateCcw} label="Review" onClick={() => setScreen("review")} />
          </nav>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard darkMode={darkMode} label="Signals" value={stats.signal} note="Inputs worth acting on" />
          <StatCard darkMode={darkMode} label="Noise" value={stats.noise} note="Inputs intentionally ignored" />
          <StatCard darkMode={darkMode} label="Uncertain" value={stats.unsure} note="Patterns to watch" />
        </section>

        {screen === "inbox" && (
          <main className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel darkMode={darkMode}>
              <h2 className="text-xl font-semibold">Capture input</h2>
              <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Every input must be classified before it can affect a decision.
              </p>

              <textarea
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                placeholder="What happened? Example: Team is waiting on legal approval."
                className={`mt-5 min-h-32 w-full rounded-2xl border p-4 text-sm outline-none focus:border-blue-600 ${
                  darkMode ? "border-gray-800 bg-gray-950 text-white" : "border-gray-200 bg-gray-50 text-gray-950"
                }`}
              />

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  [SIGNAL, "Signal"],
                  [NOISE, "Noise"],
                  [UNSURE, "Not sure"],
                ].map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setNewType(type as InputType)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      newType === type
                        ? "border-blue-600 bg-blue-600 text-white"
                        : darkMode
                        ? "border-gray-800 bg-gray-950 text-gray-300 hover:bg-gray-800"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={addInput}
                className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
                disabled={!newInput.trim()}
              >
                Add input
              </button>
            </Panel>

            <Panel darkMode={darkMode}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Input inbox</h2>
                  <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Chaos becomes useful once it is filtered.
                  </p>
                </div>
                <Search className="text-gray-400" size={20} />
              </div>

              <AssistCard>
                Suggested pattern: repeated bottlenecks and delayed decisions may indicate a coordination issue, not an execution issue.
              </AssistCard>

              <div className="mt-5 space-y-3">
                {inputs.map((input) => (
                  <div
                    key={input.id}
                    className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${
                      darkMode ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <p className="text-sm font-medium">{input.text}</p>
                    <Badge type={input.type} />
                  </div>
                ))}
              </div>
            </Panel>
          </main>
        )}

        {screen === "builder" && (
          <main className={`mx-auto w-full max-w-3xl rounded-3xl border p-6 shadow-sm ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
            <h2 className="text-xl font-semibold">Decision builder</h2>
            <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              You cannot save a decision until the trade-off is explicit.
            </p>

            <AssistCard>
              AI should not decide for the leader. It should surface assumptions, missing trade-offs, and possible blind spots.
            </AssistCard>

            <div className="mt-6 space-y-5">
              <Field darkMode={darkMode} label="Decision" placeholder="Should we hire a new PM?" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
              <Field darkMode={darkMode} label="What matters?" placeholder="Growth, stability, delivery speed..." value={draft.matters} onChange={(v) => setDraft({ ...draft, matters: v })} />
              <Field darkMode={darkMode} label="What are you ignoring?" helper="If you don’t define this, the system will decide it for you." placeholder="Short-term cost, client pressure, discomfort..." value={draft.ignored} onChange={(v) => setDraft({ ...draft, ignored: v })} />
              <Field darkMode={darkMode} label="Trade-off accepted" placeholder="What are you willing to pay for this choice?" value={draft.tradeoff} onChange={(v) => setDraft({ ...draft, tradeoff: v })} />

              <div>
                <label className="text-sm font-semibold">Confidence: {draft.confidence}/5</label>
                <input type="range" min="1" max="5" value={draft.confidence} onChange={(e) => setDraft({ ...draft, confidence: Number(e.target.value) })} className="mt-3 w-full" />
              </div>

              <button disabled={!canSaveDecision} onClick={saveDecision} className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
                Save decision
              </button>
            </div>
          </main>
        )}

        {screen === "log" && (
          <Panel darkMode={darkMode}>
            <h2 className="text-xl font-semibold">Decision log</h2>
            <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              The visibility layer: what mattered, what was ignored, and what trade-off was accepted.
            </p>

            <AssistCard>
              AI can summarize decision patterns over time: recurring ignored risks, repeated assumptions, and signals that were misclassified.
            </AssistCard>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {decisions.map((decision) => (
                <article key={decision.id} className={`rounded-3xl border p-5 ${darkMode ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">{decision.title}</h3>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Confidence {decision.confidence}/5</span>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <Info label="Focus" value={decision.matters} />
                    <Info label="Ignored" value={decision.ignored} />
                    <Info label="Trade-off" value={decision.tradeoff} />
                  </div>
                  {decision.ignored.toLowerCase().includes("cost") && (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                      <CircleAlert size={17} /> Cost has been ignored in multiple recent decisions.
                    </div>
                  )}
                </article>
              ))}
            </div>
          </Panel>
        )}

        {screen === "review" && (
          <Panel darkMode={darkMode}>
            <h2 className="text-xl font-semibold">Feedback loop</h2>
            <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              A decision is not complete until the system learns from it.
            </p>

            <AssistCard>
              AI can compare expected vs actual outcomes and ask: was the signal wrong, the interpretation wrong, or the decision too late?
            </AssistCard>

            <div className="mt-6 space-y-4">
              {decisions.map((decision) => (
                <article key={decision.id} className={`rounded-3xl border p-5 ${darkMode ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="font-semibold">{decision.title}</h3>
                      <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Was the outcome better, same, or worse?</p>
                    </div>
                    <div className="flex gap-2">
                      {[
                        ["better", "Better"],
                        ["same", "Same"],
                        ["worse", "Worse"],
                      ].map(([outcome, label]) => (
                        <button key={outcome} onClick={() => reviewDecision(decision.id, outcome)} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${decision.outcome === outcome ? "bg-blue-600 text-white" : darkMode ? "bg-gray-900 text-gray-300 hover:bg-gray-800" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        )}

        <button onClick={() => setScreen("inbox")} className="fixed bottom-5 right-5 z-50 rounded-full bg-blue-600 px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700 md:hidden">
          + Capture
        </button>
      </div>
    </div>
  );
}
