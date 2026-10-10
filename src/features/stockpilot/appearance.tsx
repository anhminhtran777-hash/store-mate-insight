import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const themes = [
  { id: "forest", name: "Forest", description: "Off-white · evergreen", dark: false },
  { id: "night", name: "Nightfall", description: "Charcoal · mint", dark: true },
  { id: "daylight", name: "Daylight", description: "Cool white · ocean blue", dark: false },
] as const;
type Theme = (typeof themes)[number]["id"];
const AppearanceContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("forest");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "night");
    return () => {
      delete document.documentElement.dataset.theme;
      document.documentElement.classList.remove("dark");
    };
  }, [theme]);
  return <AppearanceContext.Provider value={{ theme, setTheme }}>{children}</AppearanceContext.Provider>;
}

export function AppearanceSettings() {
  const appearance = useContext(AppearanceContext);
  if (!appearance) throw new Error("Appearance settings require AppearanceProvider");
  return (
    <div>
      <h2>Appearance</h2>
      <h3 className="appearance-label">Workspace theme</h3>
      <div className="theme-options" role="group" aria-label="Workspace theme">
        {themes.map((theme) => (
          <Button key={theme.id} variant="outline" className="theme-option" aria-pressed={appearance.theme === theme.id} onClick={() => appearance.setTheme(theme.id)}>
            <span className="theme-preview" data-theme={theme.id} aria-hidden="true">
              <span className="theme-preview-nav"><i /><i /><i /></span>
              <span className="theme-preview-main"><span className="theme-preview-title" /><span className="theme-preview-panels"><i /><i /></span><span className="theme-preview-chart"><i /><i /><i /><i /><i /></span></span>
            </span>
            <span className="theme-option-title">{theme.name}<span className="theme-check">{appearance.theme === theme.id && <Check size={16} />}</span></span>
            <span className="theme-description">{theme.description}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}