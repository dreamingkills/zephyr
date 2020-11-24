import Eris, { TextChannel } from "eris";
import { DB } from "./lib/database";
import { Zephyr } from "./structures/client/Zephyr";

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

Promise.all([DB.connect()]).then(() => new Zephyr().start());
