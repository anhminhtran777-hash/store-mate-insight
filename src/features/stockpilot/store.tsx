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
import { initialState, demoProducts, type StoreState } from "./model";
type DemoContext = {
  state: StoreState;
  setState: Dispatch<SetStateAction<StoreState>>;
  selectedId: string;
  select: (id: string) => void;
  user: string;
  setUser: (user: string) => void;
  storeName: string;
  setStoreName: (n: string) => void;
  pinned: boolean;
  setPinned: (b: boolean) => void;
  budget: number;
  setBudget: (n: number) => void;
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
  const [user, setUser] = useState("Alex Morgan");
  const [storeName, setStoreName] = useState("Corner Market");
  const [pinned, setPinned] = useState(true);
  const [budget, setBudget] = useState(1500);
  return (
    <Context.Provider
      value={{
        state,
        setState,
        selectedId,
        select,
        user,
        setUser,
        storeName,
        setStoreName,
        pinned,
        setPinned,
        budget,
        setBudget,
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
