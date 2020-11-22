import { Message } from "eris";
import { GameProfile } from "../game/Profile";

export interface Command {
  names: string[];
  description: string;
  exec(msg: Message, profile: GameProfile): Promise<void>;
}
export abstract class BaseCommand implements Command {
  names: string[] = [];
  description: string = "This command has no description!";
  abstract exec(msg: Message, profile: GameProfile): Promise<void>;
}
