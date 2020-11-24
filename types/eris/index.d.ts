import Eris from "eris";
declare module "eris" {
  interface User {
    tag: string;
  }
  interface Message {
    textChannel: TextChannel;
  }
}
