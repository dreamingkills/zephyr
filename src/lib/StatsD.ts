import { StatsD } from "node-statsd";

let Stats = new StatsD();
Stats.socket.on(`error`, (err) => {
    console.log(`!!! StatsD error: ${err}`);
});

export { Stats as StatsD }