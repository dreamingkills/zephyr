import { Message } from "eris";
import { addReaction } from "../../lib/discord/message/addReaction";
import { createMessage } from "../../lib/discord/message/createMessage";
import { editMessage } from "../../lib/discord/message/editMessage";
import { MessageEmbed } from "../client/RichEmbed";
import { Zephyr } from "../client/Zephyr";
import { GameProfile } from "../game/Profile";

export interface Command {
  names: string[];
  description: string;
  usage: string[];
  subcommands: string[];
  allowDm: boolean;
  exec(msg: Message, profile: GameProfile, options: string[]): Promise<void>;
}

export abstract class BaseCommand implements Command {
  names: string[] = [];
  description: string = "This command has no description!";
  usage: string[] = [];
  subcommands: string[] = [];
  allowDm: boolean = false;
  developerOnly: boolean = false;
  moderatorOnly: boolean = false;

  zephyr!: Zephyr;

  abstract exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void>;

  public async run(msg: Message, profile: GameProfile, zephyr: Zephyr) {
    this.zephyr = zephyr;
    const options = msg.content
      .split(" ")
      .slice(1)
      .filter((v) => v);

    await this.exec(msg, profile, options);
  }

  public selfDestruct(): string {
    return "💥 Self destructing...";
  }

  public async handleError(msg: Message, error: Error): Promise<void> {
    const embed = new MessageEmbed(`Error`, msg.author).setDescription(
      error.message
    );
    await createMessage(msg.channel, embed);
    return;
  }

  public send = createMessage;
  public react = addReaction;
  public edit = editMessage;
}
