import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { Avatar } from "./bits";

export function PatientSelect({ value, onChange, exclude = [] }: { value: string; onChange: (v: string) => void; exclude?: number[] }) {
  const { patients } = useStore();
  const list = patients.filter((p) => !exclude.includes(p.id));
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-14 rounded-xl text-left [&>span]:flex [&>span]:items-center [&>span]:gap-3">
        <SelectValue placeholder="Choose a patient…" />
      </SelectTrigger>
      <SelectContent className="rounded-2xl">
        {list.length === 0 && <div className="p-3 text-sm text-muted-foreground">No patients available</div>}
        {list.map((p) => (
          <SelectItem key={p.id} value={String(p.id)} className="rounded-xl py-2">
            <span className="flex items-center gap-3">
              <Avatar name={p.fullName} id={p.id} className="size-8 rounded-lg text-[11px]" />
              <span>
                <span className="block font-semibold">{p.fullName}</span>
                <span className="block text-xs text-muted-foreground">#{p.id} · {p.age ?? "—"} yrs · {p.gender}</span>
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
