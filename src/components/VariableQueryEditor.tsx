import React, { useState } from 'react';
import { HaystackQuery, HaystackVariableQuery } from '../types';
import { HaystackQueryTypeSelector } from './HaystackQueryTypeSelector';
import { HaystackQueryInput } from './HaystackQueryInput';

interface VariableQueryProps {
  query: HaystackVariableQuery;
  onChange: (query: HaystackVariableQuery, definition: string) => void;
}

const blankQuery: Partial<HaystackQuery> = {
  refId: "variable",
  type: '',
  eval: '',
  hisRead: '',
  read: '',
};

export const VariableQueryEditor: React.FC<VariableQueryProps> = ({ onChange, query: variableQuery }) => {
  const [state, setState] = useState(variableQuery);

  const saveQuery = () => {
    let query =  state.query ?? blankQuery
    let type = query.type;
    let queryCmd = "";
    if (query.type === "hisRead") {
      queryCmd = query.hisRead
    } else if (query.type === "eval") {
      queryCmd = query.eval
    } else if (query.type === "read") {
      queryCmd = query.read
    }
    let column = "none";
    if (state.column !== undefined && state.column !== '') {
      column = `'${state.column}'`;
    }
    onChange(state, `Type: '${type}' Query: '${queryCmd}' Column: ${column}`);
  };

  const onTypeChange = (newType: string) => {
    let query = {...state.query ?? blankQuery};
    query.type = newType;
    setState({ ...state, query: query});
  };

  const onQueryChange = (newQuery: string) => {
    let query = {...state.query ?? blankQuery};
    if (state.query.type === "hisRead") {
      query.hisRead = newQuery
    } else if (state.query.type === "eval") {
      query.eval = newQuery
    } else if (state.query.type === "read") {
      query.read = newQuery
    }
    setState({ ...state, query: query});
  };

  const onColumnChange = (event: React.FormEvent<HTMLInputElement>) => {
    setState({...state, column: event.currentTarget.value,});
  };

  return (
    <div onBlur={saveQuery}>
      <HaystackQueryTypeSelector
        datasource={null}
        type={state.query?.type ?? blankQuery.type}
        refId={state.query?.refId ?? blankQuery.refId}
        onChange={onTypeChange}
      />
      <HaystackQueryInput
        query={state.query ?? blankQuery}
        onChange={onQueryChange}
      />
      <div className="gf-form">
        <span className="gf-form-label width-10">Column</span>
        <input
          name="column"
          className="gf-form-input"
          onChange={onColumnChange}
          value={state.column}
        />
      </div>
    </div>
  );
};
