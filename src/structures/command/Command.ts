import { Message } from "eris";
import { Zephyr } from "../client/Zephyr";
import { GameProfile } from "../game/Profile";

export interface Command {
  names: string[];
  description: string;
  usage: string[];
  subcommands: string[];
  exec(msg: Message, profile: GameProfile): Promise<void>;
}
export abstract class BaseCommand implements Command {
  names: string[] = [];
  description: string = "This command has no description!";
  usage: string[] = [];
  subcommands: string[] = [];
  zephyr!: Zephyr;
  options!: string[];
  abstract exec(msg: Message, profile: GameProfile): Promise<void>;

  public async run(msg: Message, profile: GameProfile, zephyr: Zephyr) {
    this.zephyr = zephyr;
    this.options = msg.content.split(" ").slice(1);
    await this.exec(msg, profile);
  }
}
