import { match } from 'ts-pattern';
import { avatarOptionsResponse } from '../../types/avatar.types';
import { avatarQuerySettings } from './avatar-query.settings';
import { AVATAR_GENERATE } from './avatar.constants';
import { avatarGeneratorHeaders, avatarGeneratorUrl } from './avatar.utils';
import type { AvatarServiceDeps } from '../../types/avatar.types';
import type { AvatarStatus } from '@repo/contracts/universal';

export async function avatarActionProbe(deps: AvatarServiceDeps): Promise<AvatarStatus> {
  const settings = await avatarQuerySettings(deps);
  const hasApiKey = await deps.credentials.queries.has({ key: AVATAR_GENERATE.apiKeyCredential });
  const unavailable = { ...settings, isAvailable: false, model: null, hasApiKey };

  return match(settings.generatorKind)
    .with('automatic1111', async () => {
      const response = await fetch(avatarGeneratorUrl(settings.generatorUrl, AVATAR_GENERATE.optionsPath), {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(AVATAR_GENERATE.probeTimeoutMs),
      }).catch(() => null);

      if (!response?.ok) {
        return unavailable;
      }

      const body = avatarOptionsResponse.safeParse(await response.json().catch(() => null));

      return body.success ? { ...settings, isAvailable: true, model: body.data.sd_model_checkpoint, hasApiKey } : unavailable;
    })
    .with('openai', async () => {
      const response = await fetch(avatarGeneratorUrl(settings.generatorUrl, AVATAR_GENERATE.openaiModelsPath), {
        headers: await avatarGeneratorHeaders(deps, { accept: 'application/json' }),
        signal: AbortSignal.timeout(AVATAR_GENERATE.probeTimeoutMs),
      }).catch(() => null);

      return response?.ok ? { ...settings, isAvailable: true, model: settings.generatorModel || null, hasApiKey } : unavailable;
    })
    .exhaustive();
}
