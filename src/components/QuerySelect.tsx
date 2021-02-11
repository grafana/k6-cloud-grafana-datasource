import { SelectableValue } from '@grafana/data';
import { InlineFormLabel, Select } from '@grafana/ui';
import React from 'react';

interface ProjectSelectProps {
  label: string;
  onChange: (item: SelectableValue<string>) => void;
  width?: number;
  allowCustomValue?: boolean;
  data: any[];
}
export function QuerySelect({
  data = [undefined, []],
  onChange,
  label,
  width = 6,
  allowCustomValue = false,
}: ProjectSelectProps) {
  const [value, options] = data;
  return (
    <div className="gf-form">
      <InlineFormLabel className="query-keyword" width={width}>
        {label}
      </InlineFormLabel>
      <Select
        options={options}
        value={value}
        onChange={onChange}
        allowCustomValue={allowCustomValue}
        onCreateOption={(customValue) => {
          onChange({ value: customValue });
        }}
      />
    </div>
  );
}
