import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, FileText, UploadSimple } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";

export function Dropzone({
  onFile,
  busy,
  done,
  title,
  hint,
  busyLabel,
  accept = "application/pdf,image/*",
  fileName,
  children,
}: {
  onFile: (f: File) => void;
  busy?: boolean | undefined;
  done?: boolean | undefined;
  title: string;
  hint: string;
  busyLabel?: ReactNode;
  accept?: string;
  fileName?: string | undefined;
  children?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !busy && input.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !busy && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && !busy) onFile(f);
      }}
      className={cn(
        "group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed p-6 text-center transition-all duration-300",
        over
          ? "scale-[1.01] border-coral bg-coral-soft"
          : done
            ? "border-success/40 bg-success-soft/50"
            : "border-input bg-muted/40 hover:border-primary/40 hover:bg-primary-soft/40",
        busy && "cursor-wait",
      )}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <AnimatePresence mode="wait">
        {busy ? (
          <motion.div
            key="busy"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="relative h-28 w-24 overflow-hidden rounded-2xl border bg-card shadow-lift">
              <div className="space-y-2 p-3">
                {[70, 90, 55, 80, 60, 85].map((w, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full bg-muted shimmer"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
              <div className="absolute inset-x-0 h-8 -translate-y-1/2 animate-scan bg-gradient-to-b from-transparent via-coral/40 to-transparent">
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-coral shadow-coral" />
              </div>
            </div>
            <div className="mt-5 font-semibold">{busyLabel ?? "Reading document…"}</div>
            {fileName && <div className="mt-1 text-xs text-muted-foreground">{fileName}</div>}
          </motion.div>
        ) : done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="flex flex-col items-center"
          >
            <CheckCircle weight="fill" className="size-14 text-success" />
            <div className="mt-3 font-semibold">Done — details filled in below</div>
            {fileName && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <FileText weight="fill" /> {fileName}
              </div>
            )}
            <div className="mt-3 text-xs font-semibold text-primary">
              Click to upload a different file
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <span className="grid size-16 place-items-center rounded-2xl bg-sunrise text-coral-foreground shadow-coral transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3">
              <UploadSimple weight="fill" className="size-7" />
            </span>
            <div className="mt-4 text-base font-semibold">{title}</div>
            <div className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</div>
            <div className="mt-4 rounded-full bg-card px-4 py-1.5 text-xs font-semibold text-primary shadow-soft">
              Drag & drop or click to browse · PDF, JPG, PNG
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
