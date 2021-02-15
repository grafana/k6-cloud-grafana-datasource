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
    const type: K6VariableQueryType = Number(item.value!) as K6VariableQueryType;
    switch (type) {
      case K6VariableQueryType.ORGANIZATIONS:
        this.setState({ query: { qtype: type, query: '' } });
        break;
      case K6VariableQueryType.PROJECTS:
        this.setState({ query: { qtype: type, query: '$organization' } });
        break;
      case K6VariableQueryType.TESTS:
        this.setState({ query: { qtype: type, query: '$organization.$project' } });
        break;
      case K6VariableQueryType.TEST_RUNS:
        this.setState({ query: { qtype: type, query: '$organization.$project.$test' } });
        break;
    }
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
