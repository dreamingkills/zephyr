import Eris from "eris";
import { DB } from "./lib/database";
import { Zephyr } from "./structures/client/Zephyr";

Object.defineProperty(Eris.User.prototype, "tag", {
  enumerable: false,
  get: function () {
    return `${this.username}#${this.discriminator}`;
  },
});

Promise.all([DB.connect()]).then(() => new Zephyr().start());
