import { StatsD } from "node-statsd";

const Stats = new StatsD();
Stats.socket.on(`error`, (err) => {
  console.log(`!!! StatsD error: ${err}`);
});

export { Stats as StatsD };
