import { AppShell, PageHeader } from "@/components/application-ui";
import { getAiFunnelSnapshot } from "@/lib/ai/context";
import { getConversationMessagesForUser, listConversationsForUser } from "@/lib/ai/conversations";
import { requireCurrentUser } from "@/lib/current-user";
import { AiAnalystClient, type AiAnalystConversation, type AiAnalystMessage } from "./ui";

export default async function AiPage() {
  const user = await requireCurrentUser();
  const [snapshot, conversations] = await Promise.all([getAiFunnelSnapshot(user.id), listConversationsForUser(user.id)]);
  const selectedConversation = conversations[0] ?? null;
  const messages = selectedConversation ? await getConversationMessagesForUser(user.id, selectedConversation.id) : [];

  return (
    <AppShell accountLabel={user.name || user.email} contentSize="wide" currentPath="/ai">
      <PageHeader subtitle="Ask questions about your job-search funnel and application patterns." title="AI Analyst" />
      <AiAnalystClient
        initialConversations={conversations.map(serializeConversation)}
        initialMessages={(messages ?? []).map(serializeMessage)}
        initialSelectedConversationId={selectedConversation?.id ?? null}
        snapshot={snapshot}
      />
    </AppShell>
  );
}

function serializeConversation(conversation: Awaited<ReturnType<typeof listConversationsForUser>>[number]): AiAnalystConversation {
  return {
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

function serializeMessage(message: NonNullable<Awaited<ReturnType<typeof getConversationMessagesForUser>>>[number]): AiAnalystMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}
