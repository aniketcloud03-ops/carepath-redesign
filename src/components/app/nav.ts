import { Bed, FileText, Robot, SquaresFour, UserPlus, Users } from "@phosphor-icons/react/ssr";

export const NAV = [
  {
    group: "Workspace",
    items: [{ to: "/", label: "Overview", hint: "Today at a glance", icon: SquaresFour }],
  },
  {
    group: "Patient care",
    items: [
      { to: "/patients/new", label: "Register patient", hint: "Scan Aadhaar or PAN", icon: UserPlus },
      { to: "/patients", label: "Patients", hint: "Search all records", icon: Users },
      { to: "/admissions", label: "Admissions", hint: "Admit & discharge", icon: Bed },
    ],
  },
  {
    group: "Insights",
    items: [
      { to: "/reports", label: "Medical reports", hint: "Upload & summarise", icon: FileText },
      { to: "/assistant", label: "AI assistant", hint: "Ask in plain English", icon: Robot },
    ],
  },
] as const;

export type NavPath = (typeof NAV)[number]["items"][number]["to"];
