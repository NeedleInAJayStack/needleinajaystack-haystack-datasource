import { Cascader, Icon, InlineField, Input } from '@grafana/ui';
import React, { ChangeEvent } from 'react';
import { DEFAULT_QUERY, HaystackQuery } from 'types';
import CascadingDropdown from './CascadingDropdown';
import { DataSource } from 'datasource';

export interface HaystackQueryInputProps {
  datasource: DataSource | null;
  query: HaystackQuery;
  onChange: (query: string) => void;
}

export function HaystackQueryInput({ datasource, query, onChange }: HaystackQueryInputProps) {
  const onQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  let width = 100;
  switch (query.type) {
    case "eval":
      return (
        <InlineField>
          <Input
            width={width}
            prefix={<Icon name="angle-right" />}
            onChange={onQueryChange}
            value={query.eval}
            placeholder={DEFAULT_QUERY.eval}
          />
        </InlineField>
      );
    case "hisRead":
      return (
        <div>
          <Cascader
            width={100}
            options={[
              { label: "a", value: "a", items: [
                { label: "a1", value: "a1" },
                { label: "a2", value: "a2" },
              ]},
              { label: "b", value: "b" },
            ]}
            onSelect={(value) => {
              console.log(value)
            }}
          />
          <CascadingDropdown datasource={datasource} query={query} />
          <InlineField>
            <Input
              width={width}
              prefix={'@'}
              onChange={onQueryChange}
              value={query.hisRead}
              placeholder={DEFAULT_QUERY.hisRead}
            />
          </InlineField>
        </div>
      );
    case "read":
      return (
        <InlineField>
          <Input
            width={width}
            prefix={<Icon name="filter" />}
            onChange={onQueryChange}
            value={query.read}
            placeholder={DEFAULT_QUERY.read}
          />
        </InlineField>
      );
  }
  return <p>Select a query type</p>;
}