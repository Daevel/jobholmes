import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiConversations, aiMessages } from "@/db/schema";

export type AiConversation = typeof aiConversations.$inferSelect;
export type AiMessage = typeof aiMessages.$inferSelect;

export function listConversationsForUser(userId: string) {
  return db
    .select({
      id: aiConversations.id,
      title: aiConversations.title,
      lastOpenaiResponseId: aiConversations.lastOpenaiResponseId,
      createdAt: aiConversations.createdAt,
      updatedAt: aiConversations.updatedAt,
    })
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt));
}

export async function createConversationForUser(userId: string, title = "Job search analysis") {
  const [conversation] = await db
    .insert(aiConversations)
    .values({
      userId,
      title,
      updatedAt: new Date(),
    })
    .returning();

  return conversation;
}

export async function getConversationForUser(userId: string, conversationId: string) {
  const [conversation] = await db
    .select()
    .from(aiConversations)
    .where(and(eq(aiConversations.userId, userId), eq(aiConversations.id, conversationId)))
    .limit(1);

  return conversation ?? null;
}

export async function getConversationMessagesForUser(userId: string, conversationId: string) {
  const conversation = await getConversationForUser(userId, conversationId);
  if (!conversation) return null;

  const messages = await db
    .select({
      id: aiMessages.id,
      conversationId: aiMessages.conversationId,
      role: aiMessages.role,
      content: aiMessages.content,
      openaiResponseId: aiMessages.openaiResponseId,
      inputTokens: aiMessages.inputTokens,
      outputTokens: aiMessages.outputTokens,
      createdAt: aiMessages.createdAt,
    })
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(aiMessages.createdAt);

  return messages;
}

export async function appendUserMessage(userId: string, conversationId: string, content: string) {
  const conversation = await getConversationForUser(userId, conversationId);
  if (!conversation) return null;

  const [message] = await db
    .insert(aiMessages)
    .values({ conversationId, role: "user", content })
    .returning();

  await touchConversation(userId, conversationId);
  return message;
}

export async function appendAssistantMessage({
  userId,
  conversationId,
  content,
  openaiResponseId,
  inputTokens,
  outputTokens,
}: {
  userId: string;
  conversationId: string;
  content: string;
  openaiResponseId: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
}) {
  const conversation = await getConversationForUser(userId, conversationId);
  if (!conversation) return null;

  const [message] = await db
    .insert(aiMessages)
    .values({
      conversationId,
      role: "assistant",
      content,
      openaiResponseId,
      inputTokens: inputTokens ?? null,
      outputTokens: outputTokens ?? null,
    })
    .returning();

  await updateLastOpenaiResponseId(userId, conversationId, openaiResponseId);
  return message;
}

export async function updateLastOpenaiResponseId(userId: string, conversationId: string, responseId: string) {
  const [conversation] = await db
    .update(aiConversations)
    .set({ lastOpenaiResponseId: responseId, updatedAt: new Date() })
    .where(and(eq(aiConversations.userId, userId), eq(aiConversations.id, conversationId)))
    .returning();

  return conversation ?? null;
}

function touchConversation(userId: string, conversationId: string) {
  return db
    .update(aiConversations)
    .set({ updatedAt: new Date() })
    .where(and(eq(aiConversations.userId, userId), eq(aiConversations.id, conversationId)));
}
