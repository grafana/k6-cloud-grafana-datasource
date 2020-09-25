import React, { ChangeEvent, PureComponent } from 'react';

import { LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';

import { K6CloudDataSourceOptions, K6CloudSecureJsonData } from '../types';

const { SecretFormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<K6CloudDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  // Secure field (only sent to the backend)
  onAPITokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonData: {
        apiToken: event.target.value,
      },
    });
  };

  onResetAPIToken = () => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        apiToken: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        apiToken: '',
      },
    });
  };

  render() {
    const { options } = this.props;
    const { secureJsonFields } = options;
    const secureJsonData = (options.secureJsonData || {}) as K6CloudSecureJsonData;

    return (
      <div className="gf-form-group">
        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={(secureJsonFields && secureJsonFields.apiToken) as boolean}
              value={secureJsonData.apiToken || ''}
              label="API Token"
              placeholder="Your k6 Cloud API Token"
              labelWidth={6}
              inputWidth={20}
              onReset={this.onResetAPIToken}
              onChange={this.onAPITokenChange}
            />
          </div>
        </div>
      </div>
    );
  }
}
