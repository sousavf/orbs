import { AVATAR } from '@repo/contracts/universal';
import { Errors } from '@repo/errors/universal';
import { log } from '@repo/logger/server';
import { AVATAR_GENERATE, AVATAR_IMAGE } from './avatar.constants';
import type { AvatarServiceDeps } from '../../types/avatar.types';

export function avatarSrc(imageId: string) {
  return `${AVATAR.pathPrefix}${imageId}${AVATAR_IMAGE.extension}`;
}

export function avatarImageIdFromSrc(src: string) {
  return src.slice(AVATAR.pathPrefix.length, -AVATAR_IMAGE.extension.length);
}

export function avatarGeneratorUrl(generatorUrl: string, path: string) {
  return new URL(path, generatorUrl.endsWith('/') ? generatorUrl : `${generatorUrl}/`);
}

export async function avatarGeneratorHeaders({ credentials }: AvatarServiceDeps, headers: Record<string, string>) {
  const apiKey = await credentials.queries.get({ key: AVATAR_GENERATE.apiKeyCredential });

  return apiKey ? { ...headers, authorization: `Bearer ${apiKey}` } : headers;
}

export function avatarUnavailable(message: string, cause?: ErrorOptions['cause']): never {
  log.warn({
    tag: 'avatar',
    message,
    error: cause,
  });

  throw new Errors.UPSTREAM_UNAVAILABLE({ internal: message, cause });
}
