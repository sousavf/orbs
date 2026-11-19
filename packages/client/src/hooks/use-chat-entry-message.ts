import { useQuery } from '@tanstack/react-query';
import { CHAT } from '../services/chat/chat.constants';
import { chatMessages } from '../services/chat/chat.utils';
import { useRpc } from './use-rpc';
import type { ChatViewerParams } from '../types/chat.types';

export function useChatEntryMessage({ bot, entryId }: Omit<ChatViewerParams, 'attachmentId'>) {
  const { rpc } = useRpc();

  const { data: page } = useQuery({
    ...rpc.conversation.history.queryOptions({ input: { botId: bot.id, afterEntryId: Math.max(0, (entryId ?? 1) - 1), limit: CHAT.aroundPageSize } }),
    enabled: entryId !== undefined,
  });

  const messages = chatMessages({
    entries: page?.items ?? [],
    bot,
    bots: [],
  });

  return messages.find((item) => entryId !== undefined && item.metadata?.entryIds.includes(entryId));
}
