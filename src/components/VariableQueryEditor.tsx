import React, { useState } from 'react';
import { HaystackVariableQuery } from '../types';

interface VariableQueryProps {
  query: HaystackVariableQuery;
  onChange: (query: HaystackVariableQuery, definition: string) => void;
}

export const VariableQueryEditor: React.FC<VariableQueryProps> = ({ onChange, query }) => {
  const [state, setState] = useState(query);

  const saveQuery = () => {
    onChange(state, `Eval: ${state.eval} Column: ${state.column}`);
  };

  const handleChange = (event: React.FormEvent<HTMLInputElement>) =>
    setState({
      ...state,
      [event.currentTarget.name]: event.currentTarget.value,
    });

  return (
    <>
      <div className="gf-form">
        <span className="gf-form-label width-10">Eval</span>
        <input
          name="eval"
          className="gf-form-input"
          onBlur={saveQuery}
          onChange={handleChange}
          value={state.eval}
        />
      </div>
      <div className="gf-form">
        <span className="gf-form-label width-10">Column</span>
        <input
          name="column"
          className="gf-form-input"
          onBlur={saveQuery}
          onChange={handleChange}
          value={state.column}
        />
      </div>
    </>
  );
};
