import React, { PureComponent } from 'react';

import { LegacyForms } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { K6VariableQuery, K6VariableQueryType } from 'types';
import { getTypeFromVariableQueryEnum } from 'utils';

import { queryTypeOptions as options } from './QueryEditor/QueryTypeSelect';

const { Select } = LegacyForms;

interface VariableQueryProps {
  query: K6VariableQuery;
  onChange: (query: K6VariableQuery, definition: string) => void;
}

interface State {
  query: K6VariableQuery;
}

const toQuery = (type: number): K6VariableQuery | null => {
  switch (type) {
    case K6VariableQueryType.ORGANIZATIONS:
      return { qtype: type, query: '' };
    case K6VariableQueryType.PROJECTS:
      return { qtype: type, query: '$organization' };
    case K6VariableQueryType.TESTS:
      return { qtype: type, query: '$organization.$project' };
    case K6VariableQueryType.TEST_RUNS:
      return { qtype: type, query: '$organization.$project.$test' };
    default:
      return null;
  }
};

export class VariableQueryEditor extends PureComponent<VariableQueryProps, State> {
  constructor(props: Readonly<VariableQueryProps>) {
    super(props);
    this.state = {
      query: props.query,
    };
  }

  saveQuery = () => {
    const { onChange } = this.props;
    onChange(this.state.query, `list of ${getTypeFromVariableQueryEnum(this.state.query.qtype)}`);
  };

  onQueryTypeChange = (item: SelectableValue<string>) => {
    const query = toQuery(Number(item.value));

    if (query === null) {
      return;
    }

    this.setState({
      query,
    });
  };

  render() {
    const current = options.find((item) => item.value === String(this.state.query.qtype));

    return (
      <div className="gf-form">
        <span className="gf-form-label width-10">Query</span>
        <Select
          options={options}
          value={current}
          allowCustomValue={false}
          onBlur={this.saveQuery}
          onChange={this.onQueryTypeChange}
        />
      </div>
    );
  }
}
