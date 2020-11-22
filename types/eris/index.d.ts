import Eris from "eris";
declare module "eris" {
  interface User {
    tag: string = "ooga ";
  }
}
