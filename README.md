# Grafana Datasource Plugin for Project Haystack

This is a [Grafana](https://grafana.com/grafana/) plugin that supports direct communication with a
[Project Haystack API Server](https://project-haystack.org/doc/docHaystack/HttpApi). It handles authentication
and supports standard Haystack API operations as well as custom Axon execution, which is supported by
[SkySpark](https://skyfoundry.com/product) and [Haxall](https://haxall.io/).

## Usage

To use this package, you should already have a working Grafana server. For instructions on how to install and configure
Grafana, see [here](https://grafana.com/docs/grafana/latest/)

### Installation

TODO

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

- Eval: Evaluate a free-form Axon expression. Grafana variables may be injected into the query, with the supported
variables listed below. *Note: Not all Haystack servers support this functionality*
- HisRead: Display the history of a single point over the selected time range.
- Read: Display the records matching a filter. Since this is not timeseries data, it can only be viewed in Grafana's
"Table" view.

#### Variables

Some queries support injecting values from the Grafana UI. The following variables are supported:

- `$__timeRange_start`: DateTime start of the selected Grafana time range
- `$__timeRange_end`: DateTime end of the selected Grafana time range
- `$__maxDataPoints`: Number representing the pixel width of Grafana's display panel.
- `$__interval`: Number representing Grafana's recommended data interval. This is the duration of the time range, 
divided by the number of pixels, delivered in units of minutes.

To use them, simply use the value in the input string like this:

```
[{ts: $__timeRange_start, v0: 0}, {ts: $__timeRange_end, v0: 10}].toGrid
```

# Continuing Work

* [ ] Publish plugin