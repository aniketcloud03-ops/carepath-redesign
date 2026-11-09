import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Bed,
  ChartBar,
  ClockCountdown,
  Code,
  Copy,
  Lightbulb,
  PaperPlaneRight,
  Pill,
  Quotes,
  Robot,
  ShieldCheck,
  Table,
  UserCircle,
} from "@phosphor-icons/react/ssr";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { askAgent, SUGGESTIONS, type AgentAnswer } from "@/lib/ai-agent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI assistant — MediPulse" },
      {
        name: "description",
        content: "Ask questions about patients, medicines, insurance and stays in plain English.",
      },
      { property: "og:title", content: "AI assistant — MediPulse" },
      {
        property: "og:description",
        content: "Ask questions about your patient records in plain English.",
      },
    ],
  }),
  component: AssistantPage,
});

const ICONS = [Pill, ShieldCheck, Quotes, ClockCountdown, Bed, ChartBar];

type Msg = { id: number; q: string; a?: AgentAnswer };

function AssistantPage() {
  const store = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || busy) return;
    const id = Date.now();
    setMsgs((m) => [...m, { id, q: text }]);
    setInput("");
    setBusy(true);
    const a = await askAgent(text, store);
    setMsgs((m) => m.map((x) => (x.id === id ? { ...x, a } : x)));
    setBusy(false);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-4xl flex-col">
      <AnimatePresence mode="wait">
        {msgs.length === 0 ? (
          <motion.div
            key="intro"
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-1 flex-col items-center justify-center py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 16 }}
              className="relative mb-6"
            >
              <span className="absolute inset-0 rounded-3xl bg-sunrise opacity-50 blur-xl" />
              <span className="relative grid size-20 place-items-center rounded-3xl bg-forest text-primary-foreground shadow-forest">
                <Robot weight="fill" className="size-10" />
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-3xl font-semibold sm:text-4xl"
            >
              Ask about your patients
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-3 max-w-lg text-muted-foreground"
            >
              Type a question the way you'd ask a colleague. The assistant searches the records and
              shows the answer, the table and the exact query it ran.
            </motion.p>
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06, delayChildren: 0.35 } },
              }}
              className="mt-10 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {SUGGESTIONS.map((s, i) => {
                const I = ICONS[i] ?? Robot;
                return (
                  <motion.button
                    key={s.q}
                    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                    onClick={() => ask(s.q)}
                    className="surface surface-lift group flex flex-col items-start gap-3 p-4 text-left"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-sunrise group-hover:text-coral-foreground">
                      <I weight="fill" className="size-5" />
                    </span>
                    <span className="font-semibold">{s.title}</span>
                    <span className="text-sm leading-snug text-muted-foreground">{s.q}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 space-y-8 py-4"
          >
            {msgs.map((m) => (
              <div key={m.id} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-end gap-3"
                >
                  <div className="max-w-[80%] rounded-3xl rounded-br-lg bg-primary px-5 py-3 text-primary-foreground shadow-forest">
                    {m.q}
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                    <UserCircle weight="fill" className="size-5" />
                  </span>
                </motion.div>
                <div className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sunrise text-coral-foreground">
                    <Robot weight="fill" className="size-5" />
                  </span>
                  {m.a ? <AnswerCard a={m.a} /> : <Thinking />}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sticky bottom-4 mt-6">
        {msgs.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {SUGGESTIONS.slice(0, 4).map((s) => (
              <button
                key={s.q}
                onClick={() => ask(s.q)}
                disabled={busy}
                className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-soft transition-colors hover:border-primary/30 hover:text-foreground disabled:opacity-50"
              >
                {s.title}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 rounded-3xl border bg-card p-2 pl-5 shadow-lift focus-within:ring-3 focus-within:ring-ring/30"
        >
          <Lightbulb weight="fill" className="size-5 shrink-0 text-warning" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. How many days did Rajesh Kumar stay in hospital?"
            className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-hidden placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="lg"
            variant="sunrise"
            disabled={!input.trim() || busy}
            className="rounded-2xl"
          >
            <PaperPlaneRight weight="fill" /> <span className="hidden sm:inline">Ask</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="surface flex items-center gap-3 px-5 py-4">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-coral"
            animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">Searching patient records…</span>
    </div>
  );
}

function AnswerCard({ a }: { a: AgentAnswer }) {
  const [tab, setTab] = useState<"table" | "sql">("table");
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      className="surface min-w-0 flex-1 overflow-hidden"
    >
      <div className="p-5">
        <div className="eyebrow mb-1.5 text-coral">Answer</div>
        <Typewriter text={a.explanation} />
      </div>
      <div className="flex items-center justify-between gap-3 border-y bg-muted/40 px-3 py-2">
        <div className="flex gap-1">
          {(
            [
              ["table", `Results · ${a.rows.length}`, Table],
              ["sql", "Query used", Code],
            ] as const
          ).map(([k, l, I]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                tab === k ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === k && (
                <motion.span
                  layoutId={`ans-${a.sql.length}-${a.rows.length}`}
                  className="absolute inset-0 rounded-lg bg-card shadow-soft"
                />
              )}
              <I weight="fill" className="relative size-4" />
              <span className="relative">{l}</span>
            </button>
          ))}
        </div>
        {tab === "sql" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={() => {
              navigator.clipboard.writeText(a.sql);
              toast.success("Query copied");
            }}
          >
            <Copy weight="fill" /> Copy
          </Button>
        )}
      </div>
      <AnimatePresence mode="wait">
        {tab === "table" ? (
          <motion.div
            key="t"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-h-96 overflow-auto"
          >
            {a.rows.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No matching records.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr>
                    {a.columns.map((c) => (
                      <th
                        key={c}
                        className="whitespace-nowrap border-b px-4 py-2.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {a.rows.map((r, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.04 }}
                      className="border-b last:border-0 even:bg-muted/30"
                    >
                      {r.map((c, j) => (
                        <td
                          key={j}
                          className={cn("px-4 py-2.5 align-top", j === 0 && "font-semibold")}
                        >
                          {c}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        ) : (
          <motion.pre
            key="s"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-x-auto bg-sidebar p-5 font-mono text-[13px] leading-relaxed text-sidebar-foreground"
          >
            {a.sql}
          </motion.pre>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(
      () => setN((v) => (v >= text.length ? (clearInterval(t), v) : v + 2)),
      14,
    );
    return () => clearInterval(t);
  }, [text]);
  return (
    <p className="text-[15px] leading-relaxed">
      {text.slice(0, n)}
      {n < text.length && (
        <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-coral" />
      )}
    </p>
  );
}
