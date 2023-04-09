import React, {  } from 'react';
import { Button, Form, VerticalGroup } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../datasource';
import { HaystackDataSourceOptions, HaystackQuery } from '../types';
import { HaystackQueryTypeSelector } from './HaystackQueryTypeSelector';
import { HaystackQueryInput } from './HaystackQueryInput';

type Props = QueryEditorProps<DataSource, HaystackQuery, HaystackDataSourceOptions>;

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const onTypeChange = (newType: string) => {
    onChange({ ...query, type: newType });
  };
  const onQueryChange = (newQuery: string) => {
    if (query.type === "hisRead") {
      onChange({ ...query, hisRead: newQuery });
    } else if (query.type === "eval") {
      onChange({ ...query, eval: newQuery });
    } else if (query.type === "read") {
      onChange({ ...query, read: newQuery });
    }
  };

  function onSubmit(newQuery: Partial<HaystackQuery>) {
    query = { ...query, ...newQuery };
    console.info('onSubmit', query);
    onRunQuery();
  }

  return (
    <div className="gf-form">
      <Form onSubmit={onSubmit}>
        {({ register, errors }) => {
          return (
            <VerticalGroup>
              <HaystackQueryTypeSelector
                datasource={datasource}
                type={query.type}
                refId={query.refId}
                onChange={onTypeChange}
              />
              <HaystackQueryInput
                query={query}
                onChange={onQueryChange}
              />
              <Button type="submit" >Run</Button>
            </VerticalGroup>
          );
        }}
      </Form>
    </div>
  );
}
