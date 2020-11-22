import { Message } from "eris";

interface Command {
  names: string[];
  description: string;
  exec(msg: Message): Promise<void>;
}
export abstract class BaseCommand implements Command {
  names: string[] = [];
  description: string = "This command has no description!";
  abstract exec(msg: Message): Promise<void>;
}
