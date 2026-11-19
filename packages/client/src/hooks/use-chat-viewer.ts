import { CHAT } from '../services/chat/chat.constants';
import { roomsFileImages, roomsMessageCaption } from '../services/rooms/rooms.utils';
import { useChatEntryMessage } from './use-chat-entry-message';
import type { ChatViewerParams } from '../types/chat.types';
import type { RoomsFilePart } from '../types/rooms.types';

export function useChatViewer({ bot, entryId, attachmentId }: ChatViewerParams) {
  const url = `${CHAT.attachmentScheme}${attachmentId}`;
  const message = useChatEntryMessage({ bot, entryId });
  const found = roomsFileImages(message);
  const metadata = found.some((file) => file.url === url) ? message?.metadata : undefined;
  const fallback: RoomsFilePart = { type: 'file', mediaType: 'image/*', url };
  const images = metadata ? found : [fallback];

  return {
    images,
    index: Math.max(0, images.findIndex((file) => file.url === url)),
    caption: roomsMessageCaption(metadata),
  };
}
