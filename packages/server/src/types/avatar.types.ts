import { z } from 'zod';
import type { AvatarImageService } from '../services/avatar/avatar-image.service';
import type { BotService } from '../services/bot/bot.service';
import type { CredentialsService } from '../services/credentials/credentials.service';
import type { SettingsService } from '../services/settings/settings.service';
import type { Bot } from '@repo/contracts/universal';

export interface AvatarImageDeps {
  root: string;
}

export interface AvatarImageParams {
  imageId: string;
}

export interface AvatarImageSaveParams {
  file: File;
}

export interface AvatarImageRenderParams {
  avatar: Bot['avatar'];
  size: number;
}

export interface AvatarImageEntry extends AvatarImageParams {
  modifiedAt: number;
}

export interface AvatarServiceDeps {
  bots: BotService;
  credentials: CredentialsService;
  images: AvatarImageService;
  settings: SettingsService;
}

export const avatarOptionsResponse = z.object({ sd_model_checkpoint: z.string() });

export const avatarGenerateResponse = z.object({ images: z.array(z.string().min(1)).min(1) });

export const avatarOpenaiResponse = z.object({
  data: z.array(z.object({
    b64_json: z.string().min(1).optional(),
    url: z.url({ protocol: /^https?$/ }).optional(),
  })).min(1),
});
