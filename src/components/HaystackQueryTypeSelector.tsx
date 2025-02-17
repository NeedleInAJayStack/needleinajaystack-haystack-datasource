import { AsyncSelect, InlineField } from '@grafana/ui';
import React, { } from 'react';
import { QueryType } from 'types';
import { DataSource, queryTypes } from '../datasource';

export interface HaystackQueryTypeSelectorProps {
  datasource: DataSource | null;
  type?: string;
  refId: string;
  onChange: (type: string) => void;
}

export function HaystackQueryTypeSelector({ datasource, type, refId, onChange }: HaystackQueryTypeSelectorProps) {
  const onTypeChange = (event: QueryType | null) => {
    onChange(event?.value ?? queryTypeDefault.value!);
  };

  const queryTypeDefault = queryTypes[0];
  function queryTypeFromValue(value?: string): QueryType | null {
    return queryTypes.find((queryType) => queryType.value === value) ?? null;
  }

  async function defaultQueryTypes(): Promise<QueryType[]> {
    return new Promise<QueryType[]>((resolve) => { resolve(queryTypes);})
  }
  
  return (
    <InlineField label="Type">
      <AsyncSelect
        loadOptions={() => {
          return datasource?.loadOps(refId) ?? defaultQueryTypes();
        }}
        defaultOptions
        value={queryTypeFromValue(type)}
        width={30}
        onChange={(queryType) => {
          // QueryType comes back as a SelectableValue, so we just convert it to the QueryType
          onTypeChange(queryTypeFromValue(queryType.value ?? ""));
        }}
      />
    </InlineField>
  );
}
