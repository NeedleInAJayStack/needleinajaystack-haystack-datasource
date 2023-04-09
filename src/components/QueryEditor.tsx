import React, { ChangeEvent, ReactNode } from 'react';
import { AsyncSelect, Button, Form, Icon, InlineField, Input, VerticalGroup } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource, queryTypes } from '../datasource';
import { DEFAULT_QUERY, HaystackDataSourceOptions, HaystackQuery, QueryType } from '../types';

type Props = QueryEditorProps<DataSource, HaystackQuery, HaystackDataSourceOptions>;

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const onTypeChange = (event: QueryType | null) => {
    onChange({ ...query, type: event?.value ?? queryTypeDefault.value! });
  };
  const onEvalChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, type: 'eval', eval: event.target.value });
  };
  const onHisReadChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, type: 'hisRead', hisRead: event.target.value });
  };
  const onReadChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, type: 'read', read: event.target.value });
  };

  const queryTypeDefault = queryTypes[0];
  function queryTypeFromValue(value: string): QueryType | null {
    return queryTypes.find((queryType) => queryType.value === value) ?? null;
  }

  const SelectComponent = () => {
    return (
      <InlineField label="Type">
        <AsyncSelect
          loadOptions={() => {return datasource.loadOps(query.refId);}}
          defaultOptions
          value={queryTypeFromValue(query.type)}
          width={30}
          onChange={(queryType) => {
            // QueryType comes back as a SelectableValue, so we just convert it to the QueryType
            onTypeChange(queryTypeFromValue(queryType.value ?? ""));
          }}
        />
      </InlineField>
    );
  };

  function renderQuery(): ReactNode {
    let width = 100;
    switch (query.type) {
      case "eval":
        return (
          <InlineField>
            <Input
              width={width}
              prefix={<Icon name="angle-right" />}
              onChange={onEvalChange}
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
              onChange={onHisReadChange}
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
              onChange={onReadChange}
              value={query.read}
              placeholder={DEFAULT_QUERY.read}
            />
          </InlineField>
        );
    }
    return <p>Select a query type</p>;
  }

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
              <SelectComponent />
              {renderQuery()}
              <Button type="submit" >Run</Button>
            </VerticalGroup>
          );
        }}
      </Form>
    </div>
  );
}
