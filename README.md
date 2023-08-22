# BullMQ Dashboard

Launches Web BullMQ dashboard.

## Usage

```
docker run -p 3000:3000 -it igrek8/bullmq-dashboard --bullmq-prefix bull --redis-host host.docker.internal
```

> Make sure Redis is running locally

## Options

```
Usage: bullmq-dashboard [options]

Launches UI to a dashboard to manage BullMQ (https://github.com/felixmosh/bull-board)

Options:
  --host <host>                UI host (default: "localhost")
  --port <port>                UI port (default: 3000)
  --bullmq-prefix [prefix...]  BullMQ prefix (default: [])
  --bull-prefix [prefix...]    Bull prefix (default: [])
  --redis-host <host>          Redis host (default: "localhost")
  --redis-port <host>          Redis port (default: 6379)
  --redis-password <password>  Redis password
  -h, --help                   display help for command
```
