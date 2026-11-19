import { avatarActionProbe } from './avatar-action.probe';
import { avatarQuerySettings } from './avatar-query.settings';
import { AVATAR_GENERATE } from './avatar.constants';
import type { AvatarServiceDeps } from '../../types/avatar.types';
import type { AvatarConfigureInput } from '@repo/contracts/universal';

export async function avatarActionConfigure(deps: AvatarServiceDeps, { generatorKind, generatorUrl, generatorModel, generatorApiKey }: AvatarConfigureInput) {
  const current = await avatarQuerySettings(deps);
  const isKindSwitch = generatorKind !== undefined && generatorKind !== current.generatorKind;
  const hasDefaultUrl = current.generatorUrl === AVATAR_GENERATE.defaultUrls[current.generatorKind];
  const url = generatorUrl ?? (isKindSwitch && hasDefaultUrl ? AVATAR_GENERATE.defaultUrls[generatorKind] : undefined);
  const apiKey = generatorApiKey ?? (url !== undefined && url !== current.generatorUrl ? null : generatorApiKey);

  const records = [
    { key: AVATAR_GENERATE.kindSetting, value: generatorKind },
    { key: AVATAR_GENERATE.urlSetting, value: url },
    { key: AVATAR_GENERATE.modelSetting, value: generatorModel },
  ].flatMap(({ key, value }) => (value === undefined ? [] : [{ key, value }]));

  await deps.settings.actions.set({ records });

  if (apiKey !== undefined) {
    await deps.credentials.actions.set({ key: AVATAR_GENERATE.apiKeyCredential, value: apiKey });
  }

  return avatarActionProbe(deps);
}
