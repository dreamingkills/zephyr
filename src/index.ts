import "./extensions";

import { DB } from "./lib/database";
import { FontLoader } from "./lib/FontLoader";
import { Zephyr } from "./structures/client/Zephyr";
import events from "events";

events.captureRejections = true;

Promise.all([DB.connect(), FontLoader.init()]).then(() => new Zephyr().start());
