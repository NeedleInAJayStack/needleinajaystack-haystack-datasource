import { Icon, InlineField, Input } from '@grafana/ui';
import React, { ChangeEvent } from 'react';
import { DEFAULT_QUERY, HaystackQuery } from 'types';

export interface HaystackQueryInputProps {
  query: HaystackQuery;
  onChange: (query: string) => void;
}

export function HaystackQueryInput({ query, onChange }: HaystackQueryInputProps) {
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
        <InlineField>
          <Input
            width={width}
            prefix={'@'}
            onChange={onQueryChange}
            value={query.hisRead}
            placeholder={DEFAULT_QUERY.hisRead}
          />
        </InlineField>
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