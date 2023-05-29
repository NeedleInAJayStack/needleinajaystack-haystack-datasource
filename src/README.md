# Haystack Data Source Plugin

This is a [Grafana](https://grafana.com/grafana/) data source plugin that supports direct communication with a
[Project Haystack API Server](https://project-haystack.org/doc/docHaystack/HttpApi). It handles authentication
and supports standard Haystack API operations as well as custom Axon execution, which is supported by
[SkySpark](https://skyfoundry.com/product) and [Haxall](https://haxall.io/).

## Usage

### Create a Data Source

To create a new data source, select `Data Sources` from the Configuration menu represented by the gear icon on the left
panel. Click `Add Data Source`, and then select `Haystack` from the list. Next, fill in the name of the data source,
the API URL, and the credentials to use to access the data. It is typically a good idea to create a dedicated user
to access the data. Once complete, select `Save & Test`. If you get a green check mark, the connection was successful!

### Query Data

To query data from the data source, create a new panel in a dashboard. If you do not have any dashboards yet, create
one by selecting `+ New Dashboard` from the Dashboard menu in the left panel.

Once within the panel editor, select your Haystack data source in the Data Sources menu. Next, select the type of
Haystack query that should be performed. The supported queries are:

- Eval: Evaluate a free-form Axon expression. _Note: Not all Haystack servers support this functionality_
- HisRead: Display the history of a single point over the selected time range.
- HisRead via filter: Read multiple points using a filter, and display their histories over the selected time range.
- Read: Display the records matching a filter. Since this is not timeseries data, it is best viewed in Grafana's
  "Table" view.

#### Variable Usage

Grafana template variables can be injected into queries using the ordinary syntax, e.g. `$varName`.

We also support injecting a few special variables from the time-range selector into the Eval and Read requests:

- `$__timeRange_start`: DateTime start of the selected Grafana time range
- `$__timeRange_end`: DateTime end of the selected Grafana time range
- `$__maxDataPoints`: Number representing the pixel width of Grafana's display panel.
- `$__interval`: Number representing Grafana's recommended data interval. This is the duration of the time range,
  divided by the number of pixels, delivered in units of minutes.

To use them, simply enter the value in the input string. Below is an example of using the variables in an Eval query:

```
> [{ts: $__timeRange_start, v0: 0}, {ts: $__timeRange_end, v0: 10}].toGrid
```

### Query Variables

You can use the Haystack connector to source variables. Create a query and then enter the column that contains the
variable values. If no column is specified, the first one is used.

The value injected by the variable exactly matches the displayed value, with the exception of Ref types, where the
injected value is only the ID portion (i.e. the dis name is not included in the interpolation). Multiple-select values
are combined with commas, (`red,blue`), but this may be customized using the
[advanced variable format options](https://grafana.com/docs/grafana/latest/dashboards/variables/variable-syntax/#advanced-variable-format-options).

### Alerting

[Standard grafana alerting](https://grafana.com/docs/grafana/latest/alerting/) is supported by this data source.

## Support

You can view the code, contribute, or request support on this project's
[GitHub repo](https://github.com/NeedleInAJayStack/needleinajaystack-haystack-datasource)
