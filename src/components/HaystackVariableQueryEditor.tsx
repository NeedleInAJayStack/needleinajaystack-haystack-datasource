import React from 'react';
import { HaystackDataSourceOptions, HaystackQuery, HaystackVariableQuery } from '../types';
import { HaystackQueryTypeSelector } from './HaystackQueryTypeSelector';
import { HaystackQueryInput } from './HaystackQueryInput';
import { QueryEditorProps } from '@grafana/data';
import { InlineField, Input, Stack } from '@grafana/ui';
import { DataSource } from 'datasource';

export type Props = QueryEditorProps<DataSource, HaystackQuery, HaystackDataSourceOptions, HaystackVariableQuery>;

const refId = 'HaystackVariableQueryEditor-VariableQuery';

export const HaystackVariableQueryEditor = ({ onChange, query }: Props) => {
  let variableInputWidth = 30;

  // Computes the query string and calls the onChange function. Should be used instead of onChange for all mutating functions.
  const onChangeAndSave = (query: HaystackVariableQuery) => {
    let type = query.type;
    let queryCmd = "";
    if (query.type === "eval") {
      queryCmd = query.eval ?? "";
    } else if (query.type === "hisRead") {
      queryCmd = query.hisRead ?? "";
    } else if (query.type === "hisReadFilter") {
      queryCmd = query.hisReadFilter ?? "";
    } else if (query.type === "read") {
      queryCmd = query.read ?? "";
    }
    let column = "none";
    if (query.column !== undefined && query.column !== '') {
      column = `'${query.column}'`;
    }
    let displayColumn = "none";
    if (query.displayColumn !== undefined && query.displayColumn !== '') {
      displayColumn = `'${query.displayColumn}'`;
    }
    let displayString = `${type}: '${queryCmd}', Column: ${column}, Display: ${displayColumn}`
    onChange({ ...query, query: displayString });
  };

  const onTypeChange = (newType: string) => {
    onChangeAndSave({ ...query, type: newType});
  };

  const onQueryChange = (newQuery: string) => {
    if (query.type === "eval") {
      onChangeAndSave({ ...query, refId: refId, eval: newQuery });
    } else if (query.type === "hisRead") {
      onChangeAndSave({ ...query, refId: refId, hisRead: newQuery });
    } else if (query.type === "hisReadFilter") {
      onChangeAndSave({ ...query, refId: refId, hisReadFilter: newQuery });
    } else if (query.type === "read") {
      onChangeAndSave({ ...query, refId: refId, read: newQuery });
    }
  };

  const onColumnChange = (event: React.FormEvent<HTMLInputElement>) => {
    onChangeAndSave({...query, column: event.currentTarget.value });
  };

  const onDisplayColumnChange = (event: React.FormEvent<HTMLInputElement>) => {
    onChangeAndSave({...query, displayColumn: event.currentTarget.value });
  };

  const handleBlur = () => {
    if (query.query !== undefined && query.query !== "") {
      onChange({ ...query, refId: refId });
    }
  };

  return (
    <Stack
      direction="column"
      alignItems="flex-start"
    >
      <HaystackQueryTypeSelector
        datasource={null}
        type={query.type}
        refId={query.refId}
        onChange={onTypeChange}
      />
      <HaystackQueryInput
        query={query}
        onChange={onQueryChange}
      />
      <InlineField label="Column">
        <Input
          width={variableInputWidth}
          onBlur={handleBlur}
          onChange={onColumnChange}
          value={query.column}
          placeholder="Defaults to 'id' or first column"
        />
      </InlineField>
      <InlineField label="Display Column">
        <Input
          width={variableInputWidth}
          onBlur={handleBlur}
          onChange={onDisplayColumnChange}
          value={query.displayColumn}
          placeholder="Defaults to 'Column'"
        />
      </InlineField>
    </Stack>
  );
};
