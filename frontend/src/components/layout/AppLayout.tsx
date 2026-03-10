import { useMemo, useState, useCallback } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Calendar, Users, Dumbbell, Menu, X } from "lucide-react";
import { useCoaches } from "@/hooks/useCoaches";
import { useCoachContext } from "@/context/CoachContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const navItems = [
  { to: "/", label: "Calendário", icon: Calendar },
  { to: "/athletes", label: "Atletas", icon: Users },
  { to: "/exercises", label: "Exercícios", icon: Dumbbell },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border px-5 py-3">
        <p className="text-[11px] font-medium text-muted-foreground/60 tracking-wide uppercase">
          Gestão de Treinos v2.0
        </p>
      </div>
    </>
  );
}

export default function AppLayout() {
  const { data: coaches, isLoading: coachesLoading } = useCoaches();
  const { activeCoach, setActiveCoach } = useCoachContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const coachItems = useMemo(
    () =>
      coaches?.reduce<Record<string, string>>(
        (acc, c) => ({ ...acc, [c.id]: c.name }),
        {},
      ) ?? {},
    [coaches],
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-border px-5">
          <Dumbbell className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">
            Gestão de Atletas
          </span>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold tracking-tight">
              Gestão de Atletas
            </span>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={closeMobile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <SidebarContent onNavClick={closeMobile} />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold md:hidden">Gestão de Atletas</h1>
          </div>
          <div className="hidden md:block" />

          <Select
            value={activeCoach?.id ?? null}
            onValueChange={(val) => {
              const coach = coaches?.find((c) => c.id === val);
              if (coach) setActiveCoach(coach);
            }}
            items={coachItems}
          >
            <SelectTrigger className="w-48" disabled={coachesLoading}>
              <SelectValue placeholder="Selecionar treinador..." />
            </SelectTrigger>
            <SelectContent>
              {coaches?.map((coach) => (
                <SelectItem key={coach.id} value={coach.id}>
                  {coach.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
