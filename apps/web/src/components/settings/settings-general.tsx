import { GIF_PROVIDER_LABELS } from '@repo/client/client';
import { useAvatarSettings, useChatDefaults, useChatHideVerbose, useNotificationSettings } from '@repo/client/react';
import { avatarGeneratorKind, avatarSettings, gifProvider, notificationPlatform } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '@repo/ui/panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { SettingsGroup } from '@repo/ui/settings/settings-group';
import { Switch } from '@repo/ui/switch';
import { ClientOnly } from '@tanstack/react-router';
import { useId, useState } from 'react';
import type { AvatarGeneratorKind, NotificationPlatform } from '@repo/contracts/universal';
import type { KeyboardEvent } from 'react';

const SETTINGS_NOTIFY_PREFER = {
  phone: m.settings_notify_prefer_phone,
  computer: m.settings_notify_prefer_computer,
} satisfies Record<NotificationPlatform, () => string>;

const SETTINGS_AVATAR_GENERATOR_KIND = {
  automatic1111: m.settings_avatar_generator_kind_automatic1111,
  openai: m.settings_avatar_generator_kind_openai,
} satisfies Record<AvatarGeneratorKind, () => string>;

function SettingsGeneralNotifications() {
  const id = useId();

  const [permission, setPermission] = useState(() =>
    Object.hasOwn(globalThis, 'Notification') && !window.__electrobunSendToHost ? Notification.permission : 'granted',
  );

  return (
    <PanelRow>
      <PanelContent>
        <Label htmlFor={id}>{m.settings_general_notifications()}</Label>
        {permission === 'denied' ? <PanelDescription>{m.settings_general_notifications_blocked()}</PanelDescription> : null}
      </PanelContent>
      <Button
        disabled={permission !== 'default'}
        id={id}
        size="sm"
        variant="outline"
        onClick={() => void Notification.requestPermission().then(setPermission)}
      >
        {permission === 'granted' ? m.settings_general_notifications_on() : m.settings_general_notifications_enable()}
      </Button>
    </PanelRow>
  );
}

function SettingsGeneralAvatarGenerator() {
  const avatars = useAvatarSettings();
  const [draft, setDraft] = useState<string | null>(null);
  const [modelDraft, setModelDraft] = useState<string | null>(null);
  const [keyDraft, setKeyDraft] = useState('');
  const id = useId();
  const kindId = useId();
  const modelId = useId();
  const keyId = useId();
  const value = draft ?? avatars.generatorUrl ?? '';
  const parsed = avatarSettings.shape.generatorUrl.safeParse(value.trim());
  const isLoading = avatars.generatorUrl === undefined || avatars.generatorKind === undefined;
  const isOpenai = avatars.generatorKind === 'openai';
  const modelValue = modelDraft ?? avatars.generatorModel;

  function save() {
    if (parsed.success && parsed.data !== avatars.generatorUrl) {
      avatars.configure({ generatorUrl: parsed.data });
    }

    setDraft(null);
  }

  function saveModel() {
    const next = modelValue.trim();

    if (next !== avatars.generatorModel) {
      avatars.configure({ generatorModel: next });
    }

    setModelDraft(null);
  }

  function saveKey() {
    const next = keyDraft.trim();

    if (next) {
      avatars.configure({ generatorApiKey: next });
    }

    setKeyDraft('');
  }

  function blurOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }

  function statusLabel() {
    if (!avatars.isAvailable) {
      return m.settings_avatar_generator_disconnected();
    }

    return avatars.model ? m.settings_avatar_generator_connected_model({ model: avatars.model }) : m.settings_avatar_generator_connected();
  }

  return (
    <>
      <PanelRow>
        <PanelContent>
          <PanelTitle asChild>
            <h3>{m.settings_avatar_generator()}</h3>
          </PanelTitle>
          <PanelDescription>
            {isOpenai ? m.settings_avatar_generator_help_openai() : (
              <>
                {m.settings_avatar_generator_help_before()}
                {' '}
                <code className="font-mono text-foreground">{m.settings_avatar_generator_help_command()}</code>
                {m.settings_avatar_generator_help_after()}
              </>
            )}
          </PanelDescription>
        </PanelContent>
      </PanelRow>
      <PanelRow>
        <PanelContent>
          <Label htmlFor={kindId}>{m.settings_avatar_generator_kind()}</Label>
        </PanelContent>
        <Select
          disabled={avatars.isPending || isLoading}
          value={avatars.generatorKind ?? ''}
          onValueChange={(kind) => avatars.configure({ generatorKind: avatarGeneratorKind.parse(kind) })}
        >
          <SelectTrigger className="w-auto" id={kindId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {avatarGeneratorKind.options.map((kind) => <SelectItem key={kind} value={kind}>{SETTINGS_AVATAR_GENERATOR_KIND[kind]()}</SelectItem>)}
          </SelectContent>
        </Select>
      </PanelRow>
      <PanelRow>
        <PanelContent>
          <Label htmlFor={id}>{m.settings_avatar_generator_url()}</Label>
        </PanelContent>
        <Input
          aria-invalid={!parsed.success}
          className="w-64"
          disabled={avatars.isPending || isLoading}
          id={id}
          inputMode="url"
          value={value}
          onBlur={save}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={blurOnEnter}
        />
      </PanelRow>
      {isOpenai ? (
        <>
          <PanelRow>
            <PanelContent>
              <Label htmlFor={modelId}>{m.settings_avatar_generator_model()}</Label>
            </PanelContent>
            <Input
              className="w-64"
              disabled={avatars.isPending || isLoading}
              id={modelId}
              placeholder={m.settings_avatar_generator_model_placeholder()}
              value={modelValue}
              onBlur={saveModel}
              onChange={(event) => setModelDraft(event.target.value)}
              onKeyDown={blurOnEnter}
            />
          </PanelRow>
          <PanelRow>
            <PanelContent>
              <Label htmlFor={keyId}>{m.settings_avatar_generator_api_key()}</Label>
            </PanelContent>
            <div className="flex items-center gap-2">
              <Input
                autoComplete="off"
                className="w-64"
                disabled={avatars.isPending || isLoading}
                id={keyId}
                placeholder={avatars.hasApiKey ? m.settings_avatar_generator_api_key_saved() : undefined}
                type="password"
                value={keyDraft}
                onBlur={saveKey}
                onChange={(event) => setKeyDraft(event.target.value)}
                onKeyDown={blurOnEnter}
              />
              {avatars.hasApiKey ? (
                <Button
                  disabled={avatars.isPending}
                  size="sm"
                  variant="ghost"
                  onClick={() => avatars.configure({ generatorApiKey: null })}
                >
                  {m.settings_avatar_generator_api_key_remove()}
                </Button>
              ) : null}
            </div>
          </PanelRow>
        </>
      ) : null}
      <PanelRow>
        <PanelContent>
          <output
            className={avatars.isAvailable ? 'text-sm text-success' : 'text-sm text-muted-foreground'}
          >
            {isLoading ? m.settings_avatar_generator_checking() : statusLabel()}
          </output>
        </PanelContent>
        <Button
          disabled={avatars.isChecking || avatars.isPending || isLoading}
          size="sm"
          variant="ghost"
          onClick={avatars.recheck}
        >
          {avatars.isChecking ? m.settings_avatar_generator_checking() : m.settings_avatar_generator_check()}
        </Button>
      </PanelRow>
    </>
  );
}

export function SettingsGeneral() {
  const verbose = useChatHideVerbose();
  const defaults = useChatDefaults();
  const notify = useNotificationSettings();
  const verboseId = useId();

  return (
    <SettingsGroup title={m.settings_general()}>
      <PanelRow>
        <PanelContent>
          <Label htmlFor={verboseId}>{m.settings_general_verbose()}</Label>
        </PanelContent>
        <Switch
          checked={verbose.hideVerbose}
          disabled={verbose.isPending}
          id={verboseId}
          onCheckedChange={verbose.setHideVerbose}
        />
      </PanelRow>
      <PanelRow>
        <PanelContent>
          <PanelTitle>{m.settings_gifs()}</PanelTitle>
          <PanelDescription>{m.settings_gifs_credit()}</PanelDescription>
        </PanelContent>
        <Select
          disabled={defaults.isPending || !defaults.settings}
          value={defaults.settings?.gifProvider ?? ''}
          onValueChange={(value) => defaults.configure({ gifProvider: gifProvider.parse(value) })}
        >
          <SelectTrigger aria-label={m.settings_gifs()} className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {gifProvider.options.map((provider) => <SelectItem key={provider} value={provider}>{GIF_PROVIDER_LABELS[provider]()}</SelectItem>)}
          </SelectContent>
        </Select>
      </PanelRow>
      <ClientOnly>
        <SettingsGeneralNotifications />
      </ClientOnly>
      <PanelRow>
        <PanelContent>
          <PanelTitle>{m.settings_notify_prefer()}</PanelTitle>
        </PanelContent>
        <Select
          disabled={notify.isPending || !notify.prefer}
          value={notify.prefer ?? ''}
          onValueChange={(value) => notify.setPrefer(notificationPlatform.parse(value))}
        >
          <SelectTrigger aria-label={m.settings_notify_prefer()} className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {notificationPlatform.options.map((platform) => <SelectItem key={platform} value={platform}>{SETTINGS_NOTIFY_PREFER[platform]()}</SelectItem>)}
          </SelectContent>
        </Select>
      </PanelRow>
      <SettingsGeneralAvatarGenerator />
    </SettingsGroup>
  );
}
