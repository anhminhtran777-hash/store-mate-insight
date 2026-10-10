import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { initialState, type StoreState } from "./model";
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
};
const Context = createContext<DemoContext | null>(null);
export function StockPilotProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const [selectedId, select] = useState("p1");
  const [user, setUser] = useState("Alex Morgan");
  const [storeName, setStoreName] = useState("Corner Market");
  const [pinned, setPinned] = useState(true);
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
