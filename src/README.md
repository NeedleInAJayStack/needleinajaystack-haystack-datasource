# Haystack Data Source Plugin

This is a [Grafana](https://grafana.com/grafana/) data source plugin that supports direct communication with a
[Project Haystack API Server](https://project-haystack.org/doc/docHaystack/HttpApi). It handles authentication
and supports standard Haystack API operations as well as custom Axon execution.

Some popular servers with Haystack APIs are:

- [SkySpark](https://skyfoundry.com/product)
- [Tridium Niagara](https://www.tridium.com/us/en/Products/niagara) (via [NHaystack](https://github.com/ci-richard-mcelhinney/nhaystack))
- [Siemens Desigo Optic](https://www.siemens.com/us/en/products/buildingtechnologies/automation/desigo-optic.html)
- [Fin Framework](https://www.j2inn.com/finframework)
- [Haxall](https://haxall.io/)
- [WideSky Cloud](https://widesky.cloud/products/widesky-cloud/)

## Usage

### Create a Data Source

Follow the [Grafana instructions](https://grafana.com/docs/grafana/latest/administration/data-source-management/#add-a-data-source)
to create a new Haystack datasource. Next, fill in the required information:

- The name of the data source.
- The root Haystack API URL. The URLs for some popular Haystack servers are listed below:
  - SkySpark: `http://<host>/api/<proj>/`
  - Haxall: `http://<host>/api/`
  - NHaystack: `http://<host>/`
- The username and password. It is best practice to create a dedicated user for the Grafana integration.

Once complete, select `Save & Test`. If you get a green check mark, the connection was successful!

### Query Data

To query data from the data source, [create a dashboard](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/create-dashboard/)
and add a new panel.

Select your Haystack data source in the Data Sources menu. Next, select the type of Haystack query that should be
performed (only queries supported by your data source are shown):

- Eval: Evaluate a free-form Axon expression. _Note: Not all Haystack servers support this functionality_
- HisRead: Display the history of a single point over the selected time range.
- HisRead via filter: Read multiple points using a filter, and display their histories over the selected time range.
- Read: Display the records matching a filter. Since this is not timeseries data, it is best viewed in Grafana's
  "Table" view.

#### Variable Usage

[Grafana variables](https://grafana.com/docs/grafana/latest/dashboards/variables/) can be injected into Haystack queries
using the [ordinary syntax](https://grafana.com/docs/grafana/latest/dashboards/variables/variable-syntax/),
e.g. `$varName`.

We also support a few special variables from the selected time-range:

- `$__timeRange_start`: DateTime start of the selected Grafana time range
- `$__timeRange_end`: DateTime end of the selected Grafana time range
- `$__maxDataPoints`: Number representing the pixel width of Grafana's display panel.
- `$__interval`: Number representing Grafana's recommended data interval. This is the duration of the time range,
  divided by the number of pixels, delivered in units of minutes.

To use them, simply enter the value in the input string. Below is an example of using the variables in an Eval query:

```
> read(temp).hisRead($__timeRange_start..$__timeRange_end).hisInterpolate()
```

### Query Variables

You can use the Haystack connector to source new variables. Create a query and then enter the name of the column that
contains the variable values. If no column is specified, the first one is used.

The value injected by the variable exactly matches the displayed value, with the exception of Ref types, where the
injected value is only the ID portion (i.e. the dis name is not included in the interpolation). Multiple-select values
are combined with commas, (`red,blue`), but this may be customized using the
[advanced variable format options](https://grafana.com/docs/grafana/latest/dashboards/variables/variable-syntax/#advanced-variable-format-options).

### Alerting

[Standard grafana alerting](https://grafana.com/docs/grafana/latest/alerting/) is supported by this data source.

## Support

You can view the code, contribute, or request support on this project's
[GitHub repo](https://github.com/NeedleInAJayStack/needleinajaystack-haystack-datasource)
