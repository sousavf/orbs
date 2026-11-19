import { match, P } from 'ts-pattern';
import { avatarGenerateResponse, avatarOpenaiResponse } from '../../types/avatar.types';
import { avatarActionSweep } from './avatar-action.sweep';
import { avatarQuerySettings } from './avatar-query.settings';
import { AVATAR_GENERATE } from './avatar.constants';
import { avatarGeneratorHeaders, avatarGeneratorUrl, avatarSrc, avatarUnavailable } from './avatar.utils';
import type { AvatarServiceDeps } from '../../types/avatar.types';
import type { AvatarGenerateInput, BotAvatarImage } from '@repo/contracts/universal';

export async function avatarActionGenerate(deps: AvatarServiceDeps, { description }: AvatarGenerateInput): Promise<BotAvatarImage> {
  await avatarActionSweep(deps);

  const settings = await avatarQuerySettings(deps);
  const prompt = `${description}, ${AVATAR_GENERATE.styleSuffix}`;

  const bytes = await match(settings.generatorKind)
    .with('automatic1111', async () => {
      const response = await fetch(avatarGeneratorUrl(settings.generatorUrl, AVATAR_GENERATE.path), {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          prompt,
          negative_prompt: AVATAR_GENERATE.negativePrompt,
          width: AVATAR_GENERATE.size,
          height: AVATAR_GENERATE.size,
          batch_size: 1,
        }),
        signal: AbortSignal.timeout(AVATAR_GENERATE.timeoutMs),
      }).catch(() => null);

      if (!response) {
        avatarUnavailable('Image generator could not be reached');
      }

      if (!response.ok) {
        avatarUnavailable(`Image generator failed with status ${response.status}`);
      }

      const body = avatarGenerateResponse.safeParse(await response.json().catch(() => null));

      if (!body.success) {
        avatarUnavailable('Image generator returned an unexpected response');
      }

      return Buffer.from(body.data.images[0]?.replace(/^data:[^,]*,/, '') ?? '', 'base64');
    })
    .with('openai', async () => {
      const response = await fetch(avatarGeneratorUrl(settings.generatorUrl, AVATAR_GENERATE.openaiPath), {
        method: 'POST',
        headers: await avatarGeneratorHeaders(deps, { 'content-type': 'application/json', accept: 'application/json' }),
        body: JSON.stringify({
          prompt,
          n: 1,
          size: AVATAR_GENERATE.openaiSize,
          model: settings.generatorModel || undefined,
        }),
        signal: AbortSignal.timeout(AVATAR_GENERATE.timeoutMs),
      }).catch(() => null);

      if (!response) {
        avatarUnavailable('Image generator could not be reached');
      }

      if (!response.ok) {
        avatarUnavailable(`Image generator failed with status ${response.status}`);
      }

      const body = avatarOpenaiResponse.safeParse(await response.json().catch(() => null));

      return match(body.success ? body.data.data[0] : undefined)
        .with({ b64_json: P.string }, ({ b64_json }) => Buffer.from(b64_json, 'base64'))
        .with({ url: P.string }, async ({ url }) => {
          const image = await fetch(url, { signal: AbortSignal.timeout(AVATAR_GENERATE.timeoutMs) }).catch(() => null);

          if (!image?.ok) {
            avatarUnavailable('Image generator image could not be downloaded');
          }

          return Buffer.from(await image.arrayBuffer());
        })
        .otherwise(() => avatarUnavailable('Image generator returned an unexpected response'));
    })
    .exhaustive();

  const imageId = await deps.images.actions.save({ file: new File([bytes], 'avatar.png', { type: 'image/png' }) }).catch((error: unknown) =>
    match(error)
      .with({ syscall: P.string }, () => {
        throw error;
      })
      .otherwise(() => avatarUnavailable('Image generator returned an unusable image', error)));

  return { kind: 'image', src: avatarSrc(imageId) };
}
