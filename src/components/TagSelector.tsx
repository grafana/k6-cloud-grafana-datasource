import _ from 'lodash';
import React, { PureComponent } from 'react';

import { Icon, InlineFormLabel, Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { K6SeriesTag } from 'types';

type TagSelectorStateProps = {
  tag: K6SeriesTag;
  keys: string[];
  values: string[];
  onChange: (id: number, key: string, value: string) => void;
  onDelete: (id: number) => void;
};
type TagSelectorState = {
  id: number;
  key: string;
  value: string;
};

export class TagSelector extends PureComponent<TagSelectorStateProps, TagSelectorState> {
  constructor(props: Readonly<TagSelectorStateProps>) {
    super(props);
    this.state = {
      id: props.tag.id,
      key: props.tag.key,
      value: props.tag.value,
    };
  }

  async componentDidUpdate() {
    const { tag } = this.props;
    this.setState({
      id: tag.id,
      key: tag.key,
      value: tag.value,
    });
  }

  onKeyChange = (item: SelectableValue<string>) => {
    this.props.onChange(this.state.id, item.value!, '');
  };

  onValueChange = (item: SelectableValue<string>) => {
    this.props.onChange(this.state.id, this.state.key, item.value!);
  };

  onDeleteClick = () => {
    const { onDelete } = this.props;
    onDelete(this.state.id);
  };

  render() {
    const keys = _.map(this.props.keys, (item) => {
      return {
        label: item,
        value: item,
      };
    });
    const values = _.map(this.props.values, (item) => {
      return {
        label: item,
        value: item,
      };
    });

    const currentKey = keys.find((item) => item.value === this.state.key);
    const currentValue = values.find((item) => item.value === this.state.value);

    return (
      <div className="gf-form-inline">
        <div className="gf-form">
          <Select value={currentKey} options={keys} onChange={this.onKeyChange} />
          <InlineFormLabel className="query-keyword" width={2}>
            =
          </InlineFormLabel>
          <Select value={currentValue} options={values} onChange={this.onValueChange} />
        </div>
        <div className="gf-form" onClick={this.onDeleteClick}>
          <a className="gf-form-label query-part">
            <Icon name="minus-circle" />
          </a>
        </div>
      </div>
    );
  }
}
