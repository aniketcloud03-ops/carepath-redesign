import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { EcgLine, LogoMark } from "./Logo";

const KEY = "medipulse-intro-seen";

/** Short cinematic intro, once per browser session. */
export function Splash() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (window.sessionStorage.getItem(KEY)) {
      setShow(false);
      return;
    }
    window.sessionStorage.setItem(KEY, "1");
    const t = setTimeout(() => setShow(false), 2100);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] grid place-items-center bg-canopy text-sidebar-foreground"
          exit={{ opacity: 0, filter: "blur(12px)", scale: 1.04 }}
          transition={{ duration: 0.7, ease: [0.7, 0, 0.3, 1] }}
        >
          <div className="pointer-events-none absolute -top-40 right-0 size-[520px] rounded-full bg-sunrise opacity-25 blur-3xl" />
          <div className="flex flex-col items-center gap-5">
            <motion.div
              initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
            >
              <LogoMark className="size-16 rounded-3xl" />
            </motion.div>
            <motion.h1
              className="font-display text-3xl font-semibold"
              initial={{ opacity: 0, y: 14, letterSpacing: "0.2em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "-0.02em" }}
              transition={{ delay: 0.35, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
            >
              MediPulse
            </motion.h1>
            <EcgLine className="h-10 w-56 text-sidebar-primary" delay={0.5} duration={1.2} />
            <motion.p
              className="text-sm text-sidebar-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Patient records, simplified.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
