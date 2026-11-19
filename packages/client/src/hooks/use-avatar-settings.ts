import { m } from '@repo/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AVATAR_SETTINGS } from '../services/avatar/avatar.constants';
import { useRpc } from './use-rpc';
import type { AvatarConfigureInput } from '@repo/contracts/universal';

export function useAvatarSettings() {
  const queryClient = useQueryClient();
  const { rpc } = useRpc();

  const settings = useQuery({
    ...rpc.avatars.settings.queryOptions(),
    staleTime: AVATAR_SETTINGS.staleMs,
    refetchOnWindowFocus: true,
  });

  const configure = useMutation(rpc.avatars.configure.mutationOptions({
    meta: { error: m.settings_save_failed() },
    onSuccess: (saved) => queryClient.setQueryData(rpc.avatars.settings.queryKey(), saved),
  }));

  return {
    generatorKind: settings.data?.generatorKind,
    generatorUrl: settings.data?.generatorUrl,
    generatorModel: settings.data?.generatorModel ?? '',
    hasApiKey: settings.data?.hasApiKey ?? false,
    isAvailable: settings.data?.isAvailable ?? false,
    isChecking: settings.isFetching,
    model: settings.data?.model ?? null,
    recheck: () => void settings.refetch(),
    isPending: configure.isPending,
    configure: (input: AvatarConfigureInput) => configure.mutate(input),
  };
}
