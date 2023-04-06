import React, { ChangeEvent, ReactNode } from 'react';
import { AsyncSelect, Button, Form, Icon, InlineField, Input, VerticalGroup } from '@grafana/ui';
import { DataFrame, DataQueryRequest, Field, getDefaultTimeRange, QueryEditorProps, SelectableValue, Vector } from '@grafana/data';
import { DataSource } from '../datasource';
import { DEFAULT_QUERY, HaystackDataSourceOptions, HaystackQuery } from '../types';

type Props = QueryEditorProps<DataSource, HaystackQuery, HaystackDataSourceOptions>;

export function QueryEditor({ datasource, query, onChange, onRunQuery, range, app }: Props) {
  const onTypeChange = (event: SelectableValue<string>) => {
    onChange({ ...query, type: event.value ?? queryTypeDefault.value! });
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

  interface QueryType extends SelectableValue<string> {
    apiRequirements: string[];
  } 

  const queryTypes: QueryType[] = [
    { label: 'Read', value: "read", apiRequirements: ["read"], description: 'Read the records matched by a filter' },
    { label: 'HisRead', value: "hisRead", apiRequirements: ["hisRead"], description: 'Read the history of a point' },
    { label: 'Eval', value: "eval", apiRequirements: ["eval"], description: 'Evaluate an Axon expression' },
  ];
  const queryTypeDefault = queryTypes[0];
  function queryTypeFromLabel(label: string) {
    return queryTypes.find((queryType) => queryType.value === label);
  }

  const SelectComponent = () => {
    return (
      <InlineField label="Type">
        <AsyncSelect
          loadOptions={loadOps}
          defaultOptions
          value={queryTypeFromLabel(query.type)}
          width={30}
          onChange={(queryType) => {
            onTypeChange(queryType);
          }}
        />
      </InlineField>
    );
  };

  // Queries the available ops from the datasource on only returns the ones that are supported.
  const loadOps = () => {
    let opsRequest: DataQueryRequest<HaystackQuery> = {
      requestId: 'ops',
      dashboardId: 0,
      interval: '0',
      intervalMs: 0,
      panelId: 0,
      range: range ?? getDefaultTimeRange(),
      scopedVars: {},
      targets: [{ type: 'ops' , eval: "", read: "", hisRead: "", refId: query.refId}],
      timezone: 'UTC',
      app: 'ops',
      startTime: 0,
    }
    return datasource.query(opsRequest).toPromise().then((result) => {
      if(result?.state === 'Error') {
        return [];
      }
      let frame = result?.data?.find((frame: DataFrame) => {
        return frame.refId === query.refId
      })
      let opSymbols = frame?.fields?.find((field: Field<any, Vector<string>>) => {
        return field.name === 'def'
      }).values ?? [];
      let ops: string[] = opSymbols.map((opSymbol: string) => {
        if (opSymbol.startsWith('^op:')) {
          return opSymbol.substring(4);
        } else {
          return opSymbol;
        }
      });

      return queryTypes.filter((queryType) => {
        return queryType.apiRequirements.every((apiRequirement) => {
          return ops.find((op) => {
            return op === apiRequirement
          }) !== undefined;
        });
      });
    });
  }

  function renderQuery(): ReactNode {
    let width = 100;
    let queryType = queryTypeFromLabel(query.type);
    switch (queryType?.value) {
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
