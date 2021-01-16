import Eris, { TextChannel } from "eris";

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
