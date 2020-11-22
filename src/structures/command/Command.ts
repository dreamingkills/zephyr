import { Message } from "discord.js";

interface CommandInterface {
  names: string[];
  description: string;
  exec(msg: Message): Promise<void>;
}
export abstract class Command implements CommandInterface {
  names: string[] = [];
  description: string = "This command has no description!";
  abstract exec(msg: Message): Promise<void>;
}
