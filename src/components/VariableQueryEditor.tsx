import React, { PureComponent } from 'react';
import { HaystackDataSourceOptions, HaystackQuery, HaystackVariableQuery } from '../types';
import { HaystackQueryTypeSelector } from './HaystackQueryTypeSelector';
import { HaystackQueryInput } from './HaystackQueryInput';
import { InlineField, Input } from '@grafana/ui';
import { DataSource } from 'datasource';
import { QueryEditorProps } from '@grafana/data';

type VariableQueryProps = QueryEditorProps<DataSource, HaystackQuery, HaystackDataSourceOptions, HaystackVariableQuery>;

interface VariableState {
  query: HaystackVariableQuery;
  refId?: string;
}

export const VARIABLE_REF_ID = "variable";

export class VariableQueryEditor extends PureComponent<VariableQueryProps, VariableState> {
  constructor(props: VariableQueryProps) {
    super(props);
    this.state = { 
        query: props.query
    };
  }

  variableInputWidth = 30;

  saveQuery() {
    // refId must match but doesn't get set originally so set should set it on every change
    this.setState({ ...this.state, refId: VARIABLE_REF_ID});

    // Returning a display string in `onChange` no longer seems to be used by Grafana?

    // let type = this.state.query.type;
    // let queryCmd = "";
    // if (this.state.query.type === "eval") {
    //   queryCmd = this.state.query.eval
    // } else if (this.state.query.type === "hisRead") {
    //   queryCmd = this.state.query.hisRead
    // } else if (this.state.query.type === "hisReadFilter") {
    //   queryCmd = this.state.query.hisReadFilter
    // } else if (this.state.query.type === "read") {
    //   queryCmd = this.state.query.read
    // }
    // let column = "none";
    // if (this.state.query.column !== undefined && this.state.query.column !== '') {
    //   column = `'${this.state.query.column}'`;
    // }
    // let displayColumn = "none";
    // if (this.state.query.displayColumn !== undefined && this.state.query.displayColumn !== '') {
    //   displayColumn = `'${this.state.query.displayColumn}'`;
    // }
    // let displayString = `${type}: '${queryCmd}', Column: ${column}, Display: ${displayColumn}`
    this.props.onChange(this.state.query);
  };

  onTypeChange(newType: string) {
    this.setState({ ...this.state, query: {...this.state.query, type: newType}});
  };

  onQueryChange(newQuery: string) {
    if (this.props.query.type === "eval") {
      this.setState({ ...this.state, query: { ...this.props.query, eval: newQuery }});
    } else if (this.props.query.type === "hisRead") {
      this.setState({ ...this.state, query: { ...this.props.query, hisRead: newQuery }});
    } else if (this.props.query.type === "hisReadFilter") {
      this.setState({ ...this.state, query: { ...this.props.query, hisReadFilter: newQuery }});
    } else if (this.props.query.type === "read") {
      this.setState({ ...this.state, query: { ...this.props.query, read: newQuery }});
    }
  };

  onColumnChange(event: React.FormEvent<HTMLInputElement>) {
    this.setState({ ...this.state, query: {...this.props.query, column: event.currentTarget.value,}});
  };

  onDisplayColumnChange(event: React.FormEvent<HTMLInputElement>) {
    this.setState({ ...this.state, query: {...this.props.query, displayColumn: event.currentTarget.value,}});
  };

  render() {
    return (
      <div onBlur={() => this.saveQuery()}>
        <HaystackQueryTypeSelector
          datasource={null}
          type={this.state.query.type}
          refId={this.state.query.refId ?? VARIABLE_REF_ID}
          onChange={(e) => this.onTypeChange(e)}
        />
        <HaystackQueryInput
          query={this.state.query}
          onChange={(e) => this.onQueryChange(e)}
        />
        <InlineField label="Column">
          <Input
            width={this.variableInputWidth}
            onChange={(e) => this.onColumnChange(e)}
            value={this.state.query.column}
            placeholder="Defaults to 'id' or first column"
          />
        </InlineField>
        <InlineField label="Display Column">
          <Input
            width={this.variableInputWidth}
            onChange={(e) => this.onDisplayColumnChange(e)}
            value={this.state.query.displayColumn}
            placeholder="Defaults to 'Column'"
          />
        </InlineField>
      </div>
    );
  }
}
