import { AutoSizeInput, Icon, InlineField } from '@grafana/ui';
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

  let minWidth = 50;
  switch (query.type) {
    case "eval":
      return (
        <InlineField>
          <AutoSizeInput
            minWidth={minWidth}
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
          <AutoSizeInput
            minWidth={minWidth}
            prefix={'@'}
            onChange={onQueryChange}
            value={query.hisRead}
            placeholder={DEFAULT_QUERY.hisRead}
          />
        </InlineField>
      );
    case "hisReadFilter":
      return (
        <InlineField>
          <AutoSizeInput
            minWidth={minWidth}
            prefix={<Icon name="filter" />}
            onChange={onQueryChange}
            value={query.hisReadFilter}
            placeholder={DEFAULT_QUERY.hisReadFilter}
          />
        </InlineField>
      );
    case "read":
      return (
        <InlineField>
          <AutoSizeInput
            minWidth={minWidth}
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
