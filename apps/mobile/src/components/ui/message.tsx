import { roomsImageFrame } from '@repo/client/client';
import { cva } from 'cva';
import { FileText } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { cn } from '@/lib/cn';
import { Icon } from './icon';
import { markdownColorContext } from './markdown';
import { Text, textContext } from './text';
import type { BotBubble } from '@repo/client/client';
import type { VariantProps } from 'cva';
import type { ImageURISource, ViewProps } from 'react-native';

const messageVariants = cva({
  base: 'w-full flex-row items-end gap-2 px-5 py-1',
  variants: { from: { user: 'justify-end', assistant: 'justify-start' } },
});

const messageStackVariants = cva({
  base: 'min-w-0 gap-1',
  variants: { from: { user: 'w-4/5 items-end', assistant: 'w-full items-start' } },
});

/** The bubble's outline. Every card in the transcript wears it, so they read as one family. */
export const messageOutline = 'border border-black/10 dark:border-white/15';

/** The assistant bubble's surface: cards, previews and the typing pill use it as is. */
export const messageSurface = cn('rounded-3xl bg-secondary', messageOutline);

/** The icon tile that leads a card's header or footer. */
export const messageTile = cn('size-8 items-center justify-center rounded-lg bg-background', messageOutline);

/** An inner block of a card, such as an options list, a field or tool output. */
export const messageInset = cn('rounded-xl bg-background', messageOutline);

const messageBubbleVariants = cva({
  base: cn('max-w-full min-w-0 rounded-3xl px-3.5 py-2.5', messageOutline),
  variants: {
    from: { user: 'bg-primary', assistant: 'bg-secondary' },
    wide: { true: 'w-full', false: '' },
  },
});

type MessageFrom = NonNullable<VariantProps<typeof messageVariants>['from']>;

interface MessageProps extends ViewProps {
  from: MessageFrom;
  /** Opens the message actions, like a long press in Messages. */
  onLongPress?: () => void;
  isGrouped?: boolean;
}

export function Message({ from, onLongPress, isGrouped = true, className, children, ...props }: MessageProps) {
  return (
    <View {...props} className={cn(messageVariants({ from }), className)}>
      <Pressable accessible={isGrouped} className={messageStackVariants({ from })} delayLongPress={300} disabled={!onLongPress} onLongPress={onLongPress}>
        {children}
      </Pressable>
    </View>
  );
}

interface MessageBubbleProps extends ViewProps {
  from: MessageFrom;
  /** Content that needs the full width, such as a live HTML preview. */
  wide?: boolean;
  /** The bot's colour for the owner's bubbles; the primary colour when absent. */
  bubble?: BotBubble;
}

export function MessageBubble({ from, wide = false, bubble, className, style, children, ...props }: MessageBubbleProps) {
  const [onPrimary] = useCSSVariable(['--color-primary-foreground']).map(String);
  const markdownColor = from === 'user' ? bubble?.foreground ?? onPrimary : undefined;
  const tone = from === 'user' && !bubble ? 'on-primary' : 'default';

  return (
    <View
      {...props}
      className={cn(messageBubbleVariants({ from, wide }), className)}
      style={[{ borderCurve: 'continuous' }, style, bubble && from === 'user' ? { backgroundColor: bubble.background } : undefined]}
    >
      <markdownColorContext.Provider value={markdownColor}>
        <textContext.Provider value={{ tone }}>
          {children}
        </textContext.Provider>
      </markdownColorContext.Provider>
    </View>
  );
}

interface MessageQuoteProps {
  children: string;
}

/** The message a reply answers, quoted at the top of the bubble. */
export function MessageQuote({ children }: MessageQuoteProps) {
  return (
    <View className="mb-1.5 border-l-2 border-muted-foreground/40 pl-2 opacity-80">
      <Text numberOfLines={2} variant="small">{children}</Text>
    </View>
  );
}

interface MessageImageProps {
  source: ImageURISource;
  name: string;
}

/** A sent photo framed in its own shape within limits; a muted block holds its place while it loads. */
export function MessageImage({ source, name }: MessageImageProps) {
  const [size, setSize] = useState<{ width: number; height: number }>();

  return (
    <View accessibilityLabel={name} accessibilityRole="image" className={cn('max-w-full overflow-hidden rounded-3xl bg-muted', messageOutline)} style={[{ borderCurve: 'continuous' }, roomsImageFrame(size)]}>
      <Image className="size-full" resizeMode="cover" source={source} onLoad={(event) => setSize(event.nativeEvent.source)} />
    </View>
  );
}

interface MessageFileProps {
  name: string;
}

export function MessageFile({ name }: MessageFileProps) {
  return (
    <View className={cn(messageSurface, 'h-8 max-w-full flex-row items-center gap-1.5 rounded-full px-3')}>
      <Icon icon={FileText} tone="muted" />
      <Text className="shrink" numberOfLines={1} variant="featured-name">{name}</Text>
    </View>
  );
}

interface MessageCodeProps {
  children: string;
  tone?: 'default' | 'destructive';
}

/** Code a tool ran or returned, framed like the other inner blocks of a card. */
export function MessageCode({ children, tone = 'default' }: MessageCodeProps) {
  return (
    <ScrollView className={cn('max-h-64 grow-0', messageInset)} contentContainerClassName="px-3 py-2" nestedScrollEnabled>
      <Text selectable tone={tone === 'destructive' ? 'destructive' : 'muted'} variant="trace-code">{children}</Text>
    </ScrollView>
  );
}
