import React, { ChangeEvent, ReactNode } from 'react';
import { Button, Field, Form, Icon, InlineField, Input, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from '../datasource';
import { DEFAULT_QUERY, HaystackDataSourceOptions, HaystackQuery } from '../types';

type Props = QueryEditorProps<DataSource, HaystackQuery, HaystackDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery }: Props) {
  const onTypeChange = (event: SelectableValue<number>) => {
    let queryTypeIndex = event.value ?? queryTypeDefault.value;
    onChange({ ...query, type: queryTypes[queryTypeIndex].label });
  };
  const onEvalChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, type: 'Eval', eval: event.target.value });
  };
  const onHisReadChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, type: 'HisRead', hisRead: event.target.value });
  };
  const onReadChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, type: 'Read', read: event.target.value });
  };

  const queryTypes = [
    { label: 'Eval', value: 0, description: 'Evaluate an Axon expression' },
    { label: 'HisRead', value: 1, description: 'Read the history of a point' },
    { label: 'Read', value: 2, description: 'Read the records matched by a filter' }
  ];
  const queryTypeDefault = queryTypes[0];
  function queryTypeFromLabel(label: string) {
    return queryTypes.find(queryType => queryType.label == label) ?? queryTypeDefault
  }

  const SelectComponent = () => {
    return (
    <Field>
      <Select
        options={queryTypes}
        value={queryTypeFromLabel(query.type)}
        defaultValue={queryTypeDefault}
        width={30}
        onChange={ queryType => {
          onTypeChange(queryType);
        }}
      />
    </Field>
    );
  };

  function renderQuery(): ReactNode {
    let queryType = queryTypeFromLabel(query.type);
    switch(queryType.value) {
      case 0: // Eval
        return (
        <Field>
          <InlineField label="Axon" labelWidth="auto" tooltip="An Axon expression to evaluate on the Haystack server">
            <Input width={100} prefix={<Icon name="angle-right" />} onChange={onEvalChange} value={query.eval} placeholder={DEFAULT_QUERY.eval} />
          </InlineField>
        </Field>
        );
      case 1: // HisRead
        return (
        <Field>
          <InlineField label="Point ID" labelWidth="auto" tooltip="The ID of the point to read">
            <Input width={100} prefix={"@"} onChange={onHisReadChange} value={query.hisRead} placeholder={DEFAULT_QUERY.hisRead} />
          </InlineField>
        </Field>
        );
      case 2: // Read
        return (
        <Field>
          <InlineField label="Filter" labelWidth="auto" tooltip="A filter for the desired records">
            <Input width={100} prefix={<Icon name="filter" />} onChange={onReadChange} value={query.read} placeholder={DEFAULT_QUERY.read} />
          </InlineField>
        </Field>
        );
    }
    return <p>Select a query type</p>
  }

  function onSubmit(newQuery: Partial<HaystackQuery>) {
    query = { ...query, ...newQuery }
    onRunQuery();
  }

  return (
    <div className="gf-form">
      <Form
        onSubmit={onSubmit}
      >{({register, errors}) => {
        return (
          <div>
            <SelectComponent/>
            {renderQuery()}
            <Button type="submit">Run</Button>
          </div>
        )
      }}</Form>
    </div>
  );
}
