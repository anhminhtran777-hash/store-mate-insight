import { useState } from "react";
import { ArrowUp, Leaf, PackagePlus, TrendingUp } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { useStock Genie } from "./store";
import { isLowStock, money } from "./model";
type ChatMessage = { role: "user" | "assistant"; text: string };
export function Assistant() {
  const { state, setState, user } = useStock Genie();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi Alex, I’m your Stock Genie assistant. I’ve reviewed your inventory. Ask me about stock trends, products to reorder, or your inventory value.",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const low = state.products.filter(isLowStock);
  const reply = (text: string) => {
    if (!text.trim() || busy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    setTimeout(() => {
      const active = state.products.filter((p) => !p.archived);
      const answer = /value|cost|profit/i.test(text)
        ? `Your current inventory is worth **${money(active.reduce((n, p) => n + p.stock * p.cost, 0))} at cost**, with a retail value of **${money(active.reduce((n, p) => n + p.stock * p.price, 0))}**. Beverages hold the most units. Prioritize replenishing fast-moving essentials before adding slow-moving stock.`
        : /reorder|low|order/i.test(text)
          ? low.length
            ? `**${low.length} products need attention.** Based on their current stock and reorder points:\n\n${low.map((p) => `- **${p.name}**: ${p.stock} remaining (reorder point ${p.threshold}). Recommended order: **${Math.max(p.threshold * 2 - p.stock, 12)} units** from ${p.supplier}.`).join("\n")}\n\nYou can create draft purchase orders below, review them, then approve them in Purchase Orders.`
            : "All active products are above their reorder points. No replenishment is needed right now."
          : `Over the last six months, demand peaked in August. Your store currently has **${active.reduce((n, p) => n + p.stock, 0)} units** across **${active.length} products**.\n\nOctober sales are outpacing receipts for several products, especially beverages and dairy. **${low.length} products are at or below their reorder point.** Replenish milk and popular snacks first to avoid lost sales.\n\nThese are simulated insights based on your current demo inventory.`;
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
      setBusy(false);
    }, 900);
  };
  const draftOrders = () => {
    const groups = new Map<string, { productId: string; quantity: number }[]>();
    const covered = new Set(
      state.orders
        .filter((o) => o.status !== "Received")
        .flatMap((o) => o.lines.map((l) => l.productId)),
    );
    low
      .filter((p) => !covered.has(p.id))
      .forEach((p) =>
        groups.set(p.supplier, [
          ...(groups.get(p.supplier) || []),
          { productId: p.id, quantity: Math.max(p.threshold * 2 - p.stock, 12) },
        ]),
      );
    if (!groups.size) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "All low-stock products already have an open purchase order. Review the existing drafts in Purchase Orders.",
        },
      ]);
      return;
    }
    const time = new Date().toISOString();
    setState((s) => ({
      ...s,
      orders: [
        ...Array.from(groups, ([supplier, lines], i) => ({
          id: `PO-${1043 + s.orders.length + i}`,
          supplier,
          lines,
          status: "Draft" as const,
          date: "Oct 10, 2026",
        })),
        ...s.orders,
      ],
      activities: [
        {
          id: time,
          product: `${groups.size} purchase orders`,
          actor: user,
          action: "Draft orders created",
          time,
        },
        ...s.activities,
      ],
    }));
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: `Created **${groups.size} draft orders** for uncovered low-stock products. They’re ready for your review in Purchase Orders. Stock won’t change until the approved orders are received.`,
      },
    ]);
  };
  return (
    <div className="assistant-layout">
      <div className="assistant-header">
        <div className="assistant-identity">
          <Leaf size={25} />
        </div>
        <h2>A little clarity for your shelves.</h2>
        <p>
          Stock Genie Assistant <span className="demo-label">Simulated AI</span>
        </p>
      </div>
      <div className="chat-wrap">
        <Conversation className="chat-conversation">
          <ConversationContent>
            {messages.map((m, i) => (
              <Message from={m.role} key={i}>
                <MessageContent className={m.role === "user" ? "chat-user" : ""}>
                  <MessageResponse>{m.text}</MessageResponse>
                </MessageContent>
              </Message>
            ))}
            {busy && <Shimmer>Reviewing your inventory...</Shimmer>}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="chat-suggestions">
          <Button variant="outline" onClick={() => reply("Summarize inventory trends")}>
            <TrendingUp />
            Inventory trends
          </Button>
          <Button variant="outline" onClick={() => reply("Which products should I reorder?")}>
            <PackagePlus />
            What should I reorder?
          </Button>
          <Button variant="secondary" onClick={draftOrders} disabled={!low.length}>
            Create reorder drafts
          </Button>
        </div>
        <PromptInput onSubmit={({ text }) => reply(text)}>
          <PromptInputTextarea placeholder="Ask about your inventory..." disabled={busy} />
          <PromptInputFooter className="justify-end">
            <span className="mr-auto text-xs text-muted-foreground">
              Using current demo inventory
            </span>
            <PromptInputSubmit status={busy ? "submitted" : "ready"} disabled={busy}>
              <ArrowUp />
            </PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
