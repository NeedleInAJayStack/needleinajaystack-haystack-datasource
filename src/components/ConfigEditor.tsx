import React, { ChangeEvent } from 'react';
import { InlineField, Input, SecretInput } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { HaystackDataSourceOptions, HaystackSecureJsonData } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<HaystackDataSourceOptions> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const onUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      url: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      username: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  // Secure field (only sent to the backend)
  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        password: event.target.value,
      },
    });
  };

  const onResetPassword = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        password: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        password: '',
      },
    });
  };

  const { jsonData, secureJsonFields } = options;
  const secureJsonData = (options.secureJsonData || {}) as HaystackSecureJsonData;

  return (
    <div className="gf-form-group">
      <InlineField label="URL" labelWidth={12}>
        <Input
          onChange={onUrlChange}
          value={jsonData.url || ''}
          placeholder="e.g. http://mywebsite.com/api/"
          width={60}
        />
      </InlineField>
      <InlineField label="Username" labelWidth={12}>
        <Input
          onChange={onUsernameChange}
          value={jsonData.username || ''}
          placeholder="It's a good idea to create a user specifically for this connection"
          width={60}
        />
      </InlineField>
      <InlineField label="Password" labelWidth={12}>
        <SecretInput
          isConfigured={(secureJsonFields && secureJsonFields.password) as boolean}
          value={secureJsonData.password || ''}
          placeholder=""
          width={60}
          onReset={onResetPassword}
          onChange={onPasswordChange}
        />
      </InlineField>
    </div>
  );
}
