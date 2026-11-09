import { useState, type ReactNode } from "react";
import { ArrowsClockwise, Database, Key, ShieldCheck, Trash } from "@phosphor-icons/react/ssr";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";

export function SettingsDialog({ children }: { children: ReactNode }) {
  const { apiKey, setApiKey, resetSample, clearAll, patients } = useStore();
  const [key, setKey] = useState(apiKey ?? "");
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setKey(apiKey ?? "");
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden">
        <div className="bg-forest grain px-6 py-5 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary-foreground">Settings</DialogTitle>
            <DialogDescription className="text-primary-foreground/75">
              Connect the AI service and manage demo data.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-6 px-6 pb-6 pt-2">
          <section className="space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <Key weight="fill" className="size-5 text-coral" /> Gemini API key
            </div>
            <p className="text-sm text-muted-foreground">
              Used to read Aadhaar cards, summarise reports and answer questions. Stored only in
              this browser.
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Paste your key (AIza…)"
                className="h-11 rounded-xl"
              />
              <Button
                onClick={() => {
                  setApiKey(key.trim());
                  toast.success("API key saved");
                  setOpen(false);
                }}
              >
                Save
              </Button>
            </div>
            {apiKey && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
                <ShieldCheck weight="fill" className="size-4" /> Key configured
              </p>
            )}
          </section>
          <section className="space-y-3 rounded-2xl border bg-muted/60 p-4">
            <div className="flex items-center gap-2 font-semibold">
              <Database weight="fill" className="size-5 text-primary" /> Data
            </div>
            <p className="text-sm text-muted-foreground">
              {patients.length} patients currently stored.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetSample();
                  toast.success("Sample patients loaded");
                }}
              >
                <ArrowsClockwise weight="fill" /> Load sample data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive-soft hover:text-destructive"
                onClick={() => {
                  clearAll();
                  toast("All records cleared");
                }}
              >
                <Trash weight="fill" /> Clear all records
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
