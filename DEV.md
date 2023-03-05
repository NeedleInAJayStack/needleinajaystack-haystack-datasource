# Development

## Environment
To get a development environment up and running, first ensure the following are installed:

1. go
2. mage
3. yarn
4. docker
5. [Haxall](https://haxall.io/doc/docHaxall/Setup)

Then run the following in **different terminals**:

1. Build the front-end and listen for javascript changes:

```bash
yarn dev
```

2. Build the back-end and inject it into a docker image:

```bash
mage -v && docker-compose up
```

3. Run Haxall (the below command is an example):

```bash
./bin/hx run ./proj/test
```

## Usage

Create a new data source, select "Haystack", and provide it the details for the Haxall server
that was started. In order to reference your host machine's network, use the url 
`http://host.docker.internal:8080/api/`. Click "Save and Test" and make sure that it is
reported as working.

Create a new dashboard and panel, and use this axon query to test the connection:

```
[{ts: now()-1hr, v0: 0}, {ts: now(), v0: 10}].toGrid
```

Note that if your grid's first column is a date-time you can use it with the timeseries chart.
Alternatively, nearly every Axon query can be visualized using the table view.


# TODO

* [ ] Add support for interpolating Grafana settings (time range, interval, etc)
* [ ] Add support for non-eval queries (read, hisRead, etc)