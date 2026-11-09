import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bed, FileText, Robot, UserPlus } from "@phosphor-icons/react/ssr";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STEPS = [
  {
    to: "/patients/new",
    icon: UserPlus,
    title: "Register the patient",
    text: "Upload an Aadhaar or PAN card — details fill in automatically.",
  },
  {
    to: "/admissions",
    icon: Bed,
    title: "Admit when they arrive",
    text: "Pick the patient and reason. Stay length counts itself.",
  },
  {
    to: "/reports",
    icon: FileText,
    title: "Upload test reports",
    text: "Get a 2-line summary, lab values and medicines in seconds.",
  },
  {
    to: "/assistant",
    icon: Robot,
    title: "Ask anything",
    text: "Type a question in plain English — no SQL needed.",
  },
] as const;

export function HelpDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">How MediPulse works</DialogTitle>
          <DialogDescription>Four steps cover a patient's full journey.</DialogDescription>
        </DialogHeader>
        <ol className="mt-2 space-y-3">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.to}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i }}
            >
              <DialogClose asChild>
                <Link
                  to={s.to}
                  className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-soft"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <s.icon weight="fill" className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="eyebrow">Step {i + 1}</span>
                    <span className="block font-semibold">{s.title}</span>
                    <span className="block text-sm text-muted-foreground">{s.text}</span>
                  </span>
                </Link>
              </DialogClose>
            </motion.li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
