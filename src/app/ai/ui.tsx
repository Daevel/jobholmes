"use client";

import { useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type AiFunnelSnapshot = {
  applications: number;
  screenings: number;
  technicals: number;
  offers: number;
  strongMatches: number;
  rejected: number;
  screeningRate: number;
  technicalRate: number;
};

export type AiAnalystConversation = {
  id: string;
  title: string;
  updatedAt: string;
};

export type AiAnalystMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const suggestedQuestions = [
  "Where is my funnel bottleneck?",
  "How are my Strong applications performing?",
  "What patterns do you see in my rejections?",
  "Am I applying to too many Stretch roles?",
  "What should I change in my application strategy?",
];

export function AiAnalystClient({
  snapshot,
  initialConversations,
  initialMessages,
  initialSelectedConversationId,
}: {
  snapshot: AiFunnelSnapshot;
  initialConversations: AiAnalystConversation[];
  initialMessages: AiAnalystMessage[];
  initialSelectedConversationId: string | null;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState(initialSelectedConversationId);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshConversations(selectedId?: string) {
    const response = await fetch("/api/ai/conversations");
    if (!response.ok) return;
    const data = (await response.json()) as { conversations: Array<AiAnalystConversation & { lastOpenaiResponseId?: string | null; createdAt?: string }> };
    setConversations(data.conversations.map((conversation) => ({ id: conversation.id, title: conversation.title, updatedAt: conversation.updatedAt })));
    if (selectedId) setSelectedConversationId(selectedId);
  }

  async function selectConversation(conversationId: string) {
    if (conversationId === selectedConversationId || isSending) return;
    setSelectedConversationId(conversationId);
    setIsLoadingMessages(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error("Could not load messages.");
      const data = (await response.json()) as { messages: AiAnalystMessage[] };
      setMessages(data.messages);
    } catch {
      setError("Could not load that analysis. Please try again.");
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function createNewAnalysis() {
    if (isSending) return;
    setError(null);

    try {
      const response = await fetch("/api/ai/conversations", { method: "POST" });
      if (!response.ok) throw new Error("Could not create analysis.");
      const data = (await response.json()) as { conversation: AiAnalystConversation };
      const conversation = { id: data.conversation.id, title: data.conversation.title, updatedAt: data.conversation.updatedAt };
      setConversations((current) => [conversation, ...current]);
      setSelectedConversationId(conversation.id);
      setMessages([]);
    } catch {
      setError("Could not create a new analysis. Please try again.");
    }
  }

  async function sendMessage(message = draft) {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setError(null);
    setDraft("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId: selectedConversationId ?? undefined }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "JobHolmes could not complete the analysis. Please try again.");
      }

      setSelectedConversationId(data.conversation.id);
      setMessages((current) => [
        ...current,
        normalizeMessage(data.userMessage),
        normalizeMessage(data.assistantMessage),
      ]);
      await refreshConversations(data.conversation.id);
    } catch (sendError) {
      setDraft(trimmed);
      setError(sendError instanceof Error ? sendError.message : "JobHolmes could not complete the analysis. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <SnapshotCards snapshot={snapshot} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]" aria-label="AI analyses">
        <ClientSectionCard title="Analyses" action={<ClientButton variant="secondary" onClick={createNewAnalysis} disabled={isSending}>New analysis</ClientButton>}>
          <div className="p-3">
            {conversations.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm leading-6 text-slate-500">No saved analyses yet. Ask a question to start.</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 xl:block xl:space-y-2 xl:overflow-visible xl:pb-0">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={`min-w-[220px] rounded-lg border px-3 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500 xl:min-w-0 xl:w-full ${conversation.id === selectedConversationId ? "border-indigo-200 bg-indigo-50 text-indigo-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                    onClick={() => selectConversation(conversation.id)}
                    type="button"
                  >
                    <span className="block truncate text-sm font-semibold">{conversation.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{formatTimestamp(conversation.updatedAt)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ClientSectionCard>

        <ClientSectionCard className="min-w-0" title="Conversation">
          <div className="flex min-h-[560px] min-w-0 flex-col">
            <div className="min-w-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">
              {isLoadingMessages ? <p className="text-sm text-slate-500">Loading analysis...</p> : null}
              {!isLoadingMessages && messages.length === 0 ? <EmptyConversation onPick={sendMessage} disabled={isSending} /> : null}
              {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
              {isSending ? <p className="text-sm font-medium text-slate-500">Analyzing your job search...</p> : null}
            </div>

            <form
              className="border-t border-slate-100 p-4 sm:p-5"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              {error ? <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              <label className="sr-only" htmlFor="ai-message">Ask JobHolmes</label>
              <textarea
                className="min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                disabled={isSending}
                id="ai-message"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask JobHolmes about your job search..."
                value={draft}
              />
              <div className="mt-3 flex justify-end">
                <ClientButton disabled={isSending || draft.trim().length === 0} type="submit">Send</ClientButton>
              </div>
            </form>
          </div>
        </ClientSectionCard>
      </section>
    </div>
  );
}

function ClientSectionCard({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{title}</h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function ClientButton({ children, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  const variantClass = variant === "primary" ? "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-indigo-500";
  return (
    <button className={`inline-flex min-h-10 w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${variantClass}`} {...props}>
      {children}
    </button>
  );
}

function SnapshotCards({ snapshot }: { snapshot: AiFunnelSnapshot }) {
  const cards = [
    { label: "Applications", value: snapshot.applications.toString() },
    { label: "Screening rate", value: `${snapshot.screeningRate}%` },
    { label: "Technical rate", value: `${snapshot.technicalRate}%` },
    { label: "Offers", value: snapshot.offers.toString() },
    { label: "Strong matches", value: snapshot.strongMatches.toString() },
    { label: "Rejected", value: snapshot.rejected.toString() },
  ];

  return (
    <section className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" aria-label="AI funnel snapshot">
      {cards.map((card) => (
        <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{card.value}</p>
        </article>
      ))}
    </section>
  );
}

function EmptyConversation({ onPick, disabled }: { onPick: (message: string) => void; disabled: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6">
      <p className="text-sm leading-6 text-slate-600">Ask JobHolmes about your applications, funnel conversion, rejection patterns or role targeting.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestedQuestions.map((question) => (
          <button key={question} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={disabled} onClick={() => onPick(question)} type="button">
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: AiAnalystMessage }) {
  const isUser = message.role === "user";

  return (
    <article className={isUser ? "ml-auto max-w-2xl rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3" : "max-w-3xl border-l-2 border-slate-200 pl-4"}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{isUser ? "You" : "JobHolmes"}</p>
      <div className="mt-2 space-y-3 text-sm leading-6 text-slate-800">
        {message.content.split(/\n{2,}/).map((paragraph, index) => (
          <p key={`${message.id}-${index}`} className="whitespace-pre-wrap break-words">{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

function normalizeMessage(message: AiAnalystMessage): AiAnalystMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
    createdAt: message.createdAt,
  };
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
