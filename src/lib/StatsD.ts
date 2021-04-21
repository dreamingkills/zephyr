import { StatsD } from "node-statsd";
import { Logger } from "./logger/Logger";

const Stats = new StatsD();
Stats.socket.on(`error`, (err) => {
  Logger.error(`StatsD error: ${err}`);
});

export { Stats as StatsD };
