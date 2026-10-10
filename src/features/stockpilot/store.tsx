import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  type Context as ReactContext,
} from "react";
import { initialState, demoProducts, demoProfiles, type StoreState, type Role } from "./model";
type DemoContext = {
  state: StoreState;
  setState: Dispatch<SetStateAction<StoreState>>;
  selectedId: string;
  select: (id: string) => void;
  user: string;
  setUser: (user: string) => void;
  role: Role;
  setRole: (role: Role) => void;
  storeName: string;
  setStoreName: (n: string) => void;
  pinned: boolean;
  setPinned: (b: boolean) => void;
  budget: number;
  setBudget: (n: number) => void;
  notificationStatus: Record<string, "read" | "dismissed">;
  setNotificationStatus: Dispatch<SetStateAction<Record<string, "read" | "dismissed">>>;
};
// Keep one context instance across hot reloads so provider and consumers always match.
const globalKey = "__stockpilotContext__";
const globalStore = globalThis as unknown as Record<string, ReactContext<DemoContext | null> | undefined>;
const Context: ReactContext<DemoContext | null> =
  globalStore[globalKey] ?? (globalStore[globalKey] = createContext<DemoContext | null>(null));
export function StockPilotProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  // Catalogue updates also reach an already-open demo without resetting its transactions.
  useEffect(() => {
    setState((current) => {
      const existing = new Set(current.products.map((p) => p.id));
      const additions = demoProducts.filter((p) => !existing.has(p.id));
      return additions.length ? { ...current, products: [...current.products, ...additions] } : current;
    });
  }, [demoProducts]);
  const [selectedId, select] = useState("p1");
  const [user, setUser] = useState(demoProfiles.Manager);
  const [role, setRole] = useState<Role>("Manager");
  const [storeName, setStoreName] = useState("Corner Market");
  const [pinned, setPinned] = useState(true);
  const [budget, setBudget] = useState(1500);
  const [notificationStatus, setNotificationStatus] = useState<Record<string, "read" | "dismissed">>({});
  return (
    <Context.Provider
      value={{
        state,
        setState,
        selectedId,
        select,
        user,
        setUser,
        role,
        setRole,
        storeName,
        setStoreName,
        pinned,
        setPinned,
        budget,
        setBudget,
        notificationStatus,
        setNotificationStatus,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStockPilot() {
  const value = useContext(Context);
  if (!value) throw new Error("StockPilot provider missing");
  return value;
}
