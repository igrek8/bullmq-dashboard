import { BullAdapter } from "@bull-board/api/bullAdapter.js";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { program } from "commander";
import { Queue as BullMQQueue } from "bullmq";
import { Redis } from "ioredis";
import BullQueue from "bull";
import express from "express";

program
  .name("bullmq-dashboard")
  .description("Launches UI to a dashboard to manage BullMQ (https://github.com/felixmosh/bull-board)")
  .option("--host <host>", "UI host", "localhost")
  .option("--port <port>", "UI port", 3000)
  .option("--bullmq-prefix [prefix...]", "BullMQ prefix", [])
  .option("--bull-prefix [prefix...]", "Bull prefix", [])
  .option("--redis-host <host>", "Redis host", "localhost")
  .option("--redis-port <host>", "Redis port", 6379)
  .option("--redis-password <password>", "Redis password")
  .action((options) => {
    const app = express();

    const serverAdapter = new ExpressAdapter();

    const redis = new Redis({
      host: options.redisHost,
      port: options.redistPort,
      password: options.redistPassword,
      commandTimeout: 1000,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    });

    const bullMQQueues = [];
    const bullQueues = [];

    const board = createBullBoard({
      queues: [],
      serverAdapter,
    });

    app.disable("x-powered-by");

    app.get("/health", (_req, res) => {
      res.status(redis.status === "ready" ? 200 : 503).end();
    });

    app.get("/api/queues", async (_req, _res, next) => {
      const visited = new Set();

      // Closing Bull queues
      for (const queue of bullMQQueues) {
        await queue.close();
      }

      // Looking for new BullMQ queues
      for (const prefix of options.bullmqPrefix) {
        for (const key of await redis.keys(`${prefix}:*`)) {
          const [, queue] = key.split(":");
          if (visited.has(queue)) {
            continue;
          }
          bullMQQueues.push(
            new BullMQQueue(queue, {
              connection: redis,
              sharedConnection: true,
              prefix,
            })
          );
          visited.add(queue);
        }
      }

      // Closing Bull queues
      for (const queue of bullQueues) {
        await queue.close();
      }

      // Looking for new Bull queues
      for (const prefix of options.bullPrefix) {
        for (const key of await redis.keys(`${prefix}:*`)) {
          const [, queue] = key.split(":");
          if (visited.has(queue)) {
            continue;
          }
          bullQueues.push(
            new BullQueue(queue, {
              connection: redis,
              prefix,
            })
          );
          visited.add(queue);
        }
      }

      board.replaceQueues([
        ...bullMQQueues.map((queue) => {
          return new BullMQAdapter(queue);
        }),
        ...bullQueues.map((queue) => {
          return new BullAdapter(queue);
        }),
      ]);
      next();
    });

    app.use(serverAdapter.getRouter());

    const server = app.listen(options.port, () => {
      console.log(`Accepting at http://${options.host}:${options.port}`);
    });

    process.on("SIGINT", async () => {
      console.log("Shutdown...");
      server.close();
      redis.disconnect(false);
    });
  });

program.parse();
