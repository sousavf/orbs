import { CHAT } from '@repo/client/client';
import { useChatAttachmentUrl } from '@repo/client/web';
import { m } from '@repo/i18n/client';
import { useRef } from 'react';
import { match } from 'ts-pattern';
import IconLucideDownload from '~icons/lucide/download';
import { cn } from '../../lib/cn';
import { Response } from '../ai/response';
import { Button } from '../button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../dialog';
import { Skeleton } from '../skeleton';
import type { RoomsDocumentKind } from '@repo/client/client';

const ROOMS_CHAT_DOCUMENT = { skeletonWidths: ['w-2/5', 'w-full', 'w-11/12', 'w-4/5', 'w-1/3', 'w-full', 'w-3/4'] } as const;

interface RoomsChatDocumentProps {
  botId: string
  attachmentId: string
  name: string
  caption?: string
  kind: RoomsDocumentKind
  text: string
  isPending: boolean
  isError: boolean
  isTooLarge: boolean
  onRetry: () => void
  onOpenChange: (open: boolean) => void
}

export function RoomsChatDocument({
  botId,
  attachmentId,
  name,
  caption,
  kind,
  text,
  isPending,
  isError,
  isTooLarge,
  onRetry,
  onOpenChange,
}: RoomsChatDocumentProps) {
  const url = useChatAttachmentUrl(botId, CHAT.attachmentScheme + attachmentId);
  const reader = useRef<HTMLElement>(null);

  const isPdf = kind === 'pdf';

  const skeleton = (
    <output className="flex flex-col gap-3">
      {ROOMS_CHAT_DOCUMENT.skeletonWidths.map((width, index) => <Skeleton className={cn('h-4', width)} key={index} />)}
    </output>
  );

  const body = match({
    kind,
    hasUrl: url !== undefined,
    isPending,
    isError,
    isTooLarge,
    isEmpty: text.trim() === '',
  })
    .with({ isPending: true }, () => skeleton)
    .with({ isError: true }, () => (
      <div className="flex flex-col items-start gap-3 text-sm" role="alert">
        <p className="text-muted-foreground">{m.rooms_document_error()}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>{m.rooms_activity_retry()}</Button>
      </div>
    ))
    .with({ kind: 'pdf', hasUrl: false }, () => skeleton)
    .with({ kind: 'pdf' }, () => (
      <object aria-label={m.rooms_document_label({ name })} className="block size-full" data={url} type="application/pdf">
        <p className="p-5 text-sm text-muted-foreground">{m.rooms_document_pdf_fallback()}</p>
      </object>
    ))
    .with({ isTooLarge: true }, () => <p className="text-sm text-muted-foreground">{m.rooms_document_too_large()}</p>)
    .with({ isEmpty: true }, () => <p className="text-sm text-muted-foreground">{m.rooms_document_empty()}</p>)
    .otherwise(() => <Response className="text-sm wrap-anywhere">{text}</Response>);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        {...(caption ? {} : { 'aria-describedby': undefined })}
        className={cn('flex max-h-[85vh] min-w-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl', isPdf && 'h-[85vh] sm:max-w-5xl')}
        flush
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          reader.current?.focus();
        }}
      >
        <div className="flex items-center gap-2 border-b border-border/50 py-3 pr-14 pl-5">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <DialogTitle className="truncate leading-tight">{name}</DialogTitle>
            {caption ? <DialogDescription>{caption}</DialogDescription> : null}
          </div>
          <Button asChild size="icon-sm" variant="ghost">
            <a aria-disabled={!url} aria-label={m.rooms_media_download({ name })} download={name} href={url}>
              <IconLucideDownload className="size-4" />
            </a>
          </Button>
        </div>
        <section
          aria-label={m.rooms_document_label({ name })}
          ref={reader}
          tabIndex={-1}
          className={cn('scrollbar min-h-0 flex-1 outline-none [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset', isPdf ? 'overflow-hidden p-0' : 'overflow-auto p-5')}
        >
          {body}
        </section>
      </DialogContent>
    </Dialog>
  );
}
