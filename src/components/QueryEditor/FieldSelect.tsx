import React, { useCallback, useMemo } from 'react';
import { SelectableValue } from '@grafana/data';
import { InlineFormLabel, Select } from '@grafana/ui';

interface FieldSelectProps {
  label: string;
  onChange: (item: SelectableValue<string>) => void;
  width?: number;
  allowCustomValue?: boolean;
  options: Array<SelectableValue<string>>;
  value: string;
}

export function FieldSelect({
  options,
  value,
  onChange,
  label,
  width = 6,
  allowCustomValue = false,
}: FieldSelectProps) {
  const selected = useMemo(() => {
    return options.find((option) => option.value === value);
  }, [value, options]);

  const handleCreateOption = useCallback(
    (customValue: string) => {
      allowCustomValue && onChange({ value: customValue });
    },
    [onChange, allowCustomValue]
  );

  return (
    <div className="gf-form">
      <InlineFormLabel className="query-keyword" width={width}>
        {label}
      </InlineFormLabel>
      <Select
        menuPlacement="bottom"
        options={options}
        value={selected}
        onChange={onChange}
        allowCustomValue={allowCustomValue}
        onCreateOption={handleCreateOption}
      />
    </div>
  );
}
