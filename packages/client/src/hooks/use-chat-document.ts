import { useQuery } from '@tanstack/react-query';
import { chatQueries } from '../services/chat/chat.client';
import { CHAT } from '../services/chat/chat.constants';
import { roomsMessageCaption } from '../services/rooms/rooms.utils';
import { useChatEntryMessage } from './use-chat-entry-message';
import { useRpc } from './use-rpc';
import type { ChatViewerParams } from '../types/chat.types';

export function useChatDocument({ bot, entryId, attachmentId }: ChatViewerParams) {
  const rpcs = useRpc();
  const url = `${CHAT.attachmentScheme}${attachmentId}`;
  const message = useChatEntryMessage({ bot, entryId });
  const file = message?.parts.find((part) => part.type === 'file' && part.url === url);
  const metadata = file ? message?.metadata : undefined;
  const { data, isPending, isError, refetch } = useQuery(chatQueries.attachmentText(rpcs, { botId: bot.id, attachmentId }));

  return {
    name: (file?.type === 'file' ? file.filename : undefined) ?? data?.name ?? '',
    caption: roomsMessageCaption(metadata),
    text: data?.text ?? '',
    isPending,
    isError,
    isTooLarge: data?.isTooLarge ?? false,
    retry: () => void refetch(),
  };
}
