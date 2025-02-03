import React, { useState } from 'react';
import { HaystackVariableQuery } from '../types';
import { HaystackQueryTypeSelector } from './HaystackQueryTypeSelector';
import { HaystackQueryInput } from './HaystackQueryInput';
import { InlineField, Input } from '@grafana/ui';

interface VariableQueryProps {
  query: HaystackVariableQuery;
  onChange: (query: HaystackVariableQuery, definition: string) => void;
}

export const VARIABLE_REF_ID = "variable";

export const VariableQueryEditor: React.FC<VariableQueryProps> = ({ onChange, query: variableQuery }) => {
  let variableInputWidth = 30;
  const [query, setState] = useState(variableQuery);

  const saveQuery = () => {
    // refId must match but doesn't get set originally so set should set it on every change
    setState({ ...query, refId: VARIABLE_REF_ID});

    let type = query.type;
    let queryCmd = "";
    if (query.type === "eval") {
      queryCmd = query.eval
    } else if (query.type === "hisRead") {
      queryCmd = query.hisRead
    } else if (query.type === "hisReadFilter") {
      queryCmd = query.hisReadFilter
    } else if (query.type === "read") {
      queryCmd = query.read
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
    onChange(query, displayString);
  };

  const onTypeChange = (newType: string) => {
    setState({ ...query, type: newType});
  };

  const onQueryChange = (newQuery: string) => {
    if (query.type === "eval") {
      setState({ ...query, eval: newQuery });
    } else if (query.type === "hisRead") {
      setState({ ...query, hisRead: newQuery });
    } else if (query.type === "hisReadFilter") {
      setState({ ...query, hisReadFilter: newQuery });
    } else if (query.type === "read") {
      setState({ ...query, read: newQuery });
    }
  };

  const onColumnChange = (event: React.FormEvent<HTMLInputElement>) => {
    setState({...query, column: event.currentTarget.value,});
  };

  const onDisplayColumnChange = (event: React.FormEvent<HTMLInputElement>) => {
    setState({...query, displayColumn: event.currentTarget.value,});
  };

  return (
    <div onBlur={saveQuery}>
      <HaystackQueryTypeSelector
        datasource={null}
        type={query.type}
        refId={query.refId ?? VARIABLE_REF_ID}
        onChange={onTypeChange}
      />
      <HaystackQueryInput
        query={query}
        onChange={onQueryChange}
      />
      <InlineField label="Column">
        <Input
          width={variableInputWidth}
          onChange={onColumnChange}
          value={query.column}
          placeholder="Defaults to 'id' or first column"
        />
      </InlineField>
      <InlineField label="Display Column">
        <Input
          width={variableInputWidth}
          onChange={onDisplayColumnChange}
          value={query.displayColumn}
          placeholder="Defaults to 'Column'"
        />
      </InlineField>
    </div>
  );
};
