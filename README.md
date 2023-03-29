# Grafana Data Source Plugin for Project Haystack

This is a [Grafana](https://grafana.com/grafana/) plugin that supports direct communication with a
[Project Haystack API Server](https://project-haystack.org/doc/docHaystack/HttpApi). It handles authentication
and supports standard Haystack API operations as well as custom Axon execution, which is supported by
[SkySpark](https://skyfoundry.com/product) and [Haxall](https://haxall.io/).

## Usage

To use this package, you should already have a working Grafana server. For instructions on how to install and configure
Grafana, see [here](https://grafana.com/docs/grafana/latest/)

For more usage information, see the [plugin readme](./src/README.md)

## Contributing

Contributions are very welcome! For details on how to develop this plugin, see the
[development guide](./DEVELOPMENT_GUIDE.md).

## Continuing Work

* [ ] Publish plugin
* [ ] Consider enabling multi-point hisRead (through filters)