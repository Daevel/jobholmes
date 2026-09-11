/** Picks the OpenAI response ids worth deleting out of a conversation's messages, dropping nulls. */
export function selectOpenaiResponseIdsToDelete(messages: Array<{ openaiResponseId: string | null }>): string[] {
  return messages
    .map((message) => message.openaiResponseId)
    .filter((id): id is string => Boolean(id));
}
