import Eris, { TextChannel } from "eris";
import { DB } from "./lib/database";
import { FontLoader } from "./lib/FontLoader";
import { Zephyr } from "./structures/client/Zephyr";
import events from "events";

Object.defineProperty(Eris.User.prototype, "tag", {
  enumerable: false,
  get: function () {
    return `${this.username}#${this.discriminator}`;
  },
});
Object.defineProperty(Eris.Message.prototype, "textChannel", {
  enumerable: false,
  get: function () {
    return this.channel as TextChannel;
  },
});

events.captureRejections = true;

Promise.all([DB.connect(), FontLoader.init()]).then(() => new Zephyr().start());
