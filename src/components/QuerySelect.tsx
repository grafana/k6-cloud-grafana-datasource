import { SelectableValue } from '@grafana/data';
import { InlineFormLabel, Select } from '@grafana/ui';
import React from 'react';

interface ProjectSelectProps {
  label: string;
  value: SelectableValue<string> | undefined;
  options: SelectableValue<string>[];
  onChange: (item: SelectableValue<string>) => void;
  width?: number;
  allowCustomValue?: boolean;
}
export function QuerySelect({
  value,
  options,
  onChange,
  label,
  width = 6,
  allowCustomValue = false,
}: ProjectSelectProps) {
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
