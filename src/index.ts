import { DB } from "./lib/database";
import { Zephyr } from "./structures/client/Zephyr";
Promise.all([DB.connect()]).then(() => new Zephyr().start());
