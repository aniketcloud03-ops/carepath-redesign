import { useState, type ReactNode } from "react";
import { Plus, Tag, Trash } from "@phosphor-icons/react/ssr";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import type { FieldType } from "@/lib/types";

const TYPES: { v: FieldType; l: string }[] = [
  { v: "text", l: "Text" },
  { v: "number", l: "Number" },
  { v: "date", l: "Date" },
  { v: "select", l: "Dropdown list" },
  { v: "boolean", l: "Yes / No" },
];

export function ManageFieldsDialog({ children }: { children: ReactNode }) {
  const { fields, addField, removeField } = useStore();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldType>("text");
  const [options, setOptions] = useState("");

  const add = () => {
    const key = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (!key) return toast.error("Give the field a name");
    if (fields.some((f) => f.key === key)) return toast.error("A field with that name already exists");
    addField({ key, label: label.trim(), type, options: type === "select" ? options.split(",").map((o) => o.trim()).filter(Boolean) : undefined });
    toast.success(`“${label.trim()}” added to the registration form`);
    setLabel("");
    setOptions("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Custom fields</DialogTitle>
          <DialogDescription>Add extra questions to the registration form — like blood group or allergies.</DialogDescription>
        </DialogHeader>
        <ul className="max-h-56 space-y-2 overflow-y-auto">
          {fields.map((f) => (
            <li key={f.key} className="flex items-center gap-3 rounded-2xl border bg-muted/40 px-3.5 py-2.5">
              <Tag weight="fill" className="size-4 text-coral" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{f.label}</div>
                <div className="text-xs text-muted-foreground">{TYPES.find((t) => t.v === f.type)?.l}{f.options ? ` · ${f.options.join(", ")}` : ""}</div>
              </div>
              <Button variant="ghost" size="icon" className="size-8 hover:bg-destructive-soft hover:text-destructive" onClick={() => removeField(f.key)} aria-label={`Remove ${f.label}`}>
                <Trash weight="fill" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="space-y-3 rounded-2xl border border-dashed p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
            <div className="space-y-1.5">
              <Label>Field name</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Occupation" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {type === "select" && (
            <div className="space-y-1.5">
              <Label>Choices (comma separated)</Label>
              <Input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Option A, Option B" className="h-11 rounded-xl" />
            </div>
          )}
          <Button onClick={add} className="w-full"><Plus weight="bold" /> Add field</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
