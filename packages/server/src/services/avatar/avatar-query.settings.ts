import { avatarSettings } from '@repo/contracts/universal';
import { AVATAR_GENERATE } from './avatar.constants';
import type { AvatarServiceDeps } from '../../types/avatar.types';
import type { AvatarSettings } from '@repo/contracts/universal';

export async function avatarQuerySettings({ settings }: AvatarServiceDeps): Promise<AvatarSettings> {
  const records = await settings.queries.get({ keys: [AVATAR_GENERATE.kindSetting, AVATAR_GENERATE.urlSetting, AVATAR_GENERATE.modelSetting] });
  const avatarRead = (key: string) => records.find((record) => record.key === key)?.value;

  const generatorKind = avatarSettings.shape.generatorKind.catch(AVATAR_GENERATE.defaultKind).parse(avatarRead(AVATAR_GENERATE.kindSetting));

  return {
    generatorKind,
    generatorUrl: avatarSettings.shape.generatorUrl.catch(AVATAR_GENERATE.defaultUrls[generatorKind]).parse(avatarRead(AVATAR_GENERATE.urlSetting)),
    generatorModel: avatarSettings.shape.generatorModel.catch('').parse(avatarRead(AVATAR_GENERATE.modelSetting)),
  };
}
