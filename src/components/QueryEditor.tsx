import React, { ChangeEvent } from 'react';
import { Button, Icon, InlineField, Input } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery }: Props) {
  const onExprChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, expr: event.target.value });
  };

  const { expr } = query;

  return (
    <div className="gf-form">
      <InlineField label="Axon" labelWidth="auto" tooltip="An Axon expression to evaluate on the Haystack server">
        <Input width={100} prefix={<Icon name="angle-right" />} onChange={onExprChange} value={expr || ''} />
      </InlineField>
      <Button type="submit" onClick={onRunQuery}>Run</Button>
    </div>
  );
}
