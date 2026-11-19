import { useChatDocument } from '@repo/client/react';
import { attachmentView } from '@repo/contracts/universal';
import { RoomsChatDocument } from '@repo/ui/rooms/rooms-chat-document';
import { createFileRoute } from '@tanstack/react-router';
import { useDialogNavigation } from '@/hooks/use-dialog-navigation';
import { roomsDirectBot } from '@/services/rooms/rooms.client';

export const Route = createFileRoute('/_chat/rooms/direct/$handle/files/$attachmentId')({
  validateSearch: attachmentView,
  loader: async ({ context, params }) => ({ bot: await roomsDirectBot(context.queryClient, params) }),
  component: DirectFileReaderRoute,
});

function DirectFileReaderRoute() {
  const { handle, attachmentId } = Route.useParams();
  const { entryId } = Route.useSearch();
  const { bot } = Route.useLoaderData();
  const { handleOpenChange } = useDialogNavigation({ to: '/rooms/direct/$handle', params: { handle } });

  const document = useChatDocument({
    bot,
    entryId,
    attachmentId,
  });

  return (
    <RoomsChatDocument
      attachmentId={attachmentId}
      botId={bot.id}
      caption={document.caption}
      isError={document.isError}
      isPending={document.isPending}
      isTooLarge={document.isTooLarge}
      name={document.name}
      text={document.text}
      onOpenChange={handleOpenChange}
      onRetry={document.retry}
    />
  );
}
