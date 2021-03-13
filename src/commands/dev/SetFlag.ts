import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { MessageEmbed } from "../../structures/client/RichEmbed";

export default class SetFlag extends BaseCommand {
  names = [`setflag`];
  description = `Changes the status of a flag.`;
  usage = [`$CMD$ <flag> <true/false>`];
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.InvalidFlagNameError();
    if (!options[1] || ![`true`, `false`].includes(options[1].toLowerCase()))
      throw new ZephyrError.InvalidFlagValueError();

    const flags = this.zephyr.flags;

    const flagName = options[0];
    const flagValue = options[1].toLowerCase();

    const flagExists = Object.keys(flags).find((k) => k === flagName);

    if (!flagExists) throw new ZephyrError.FlagNotFoundError();

    const value = flagValue === `true`;

    flags[flagName as keyof typeof flags] = value;

    const embed = new MessageEmbed(`Set Flag`, msg.author).setDescription(
      `The flag \`${flagName}\` is now \`${value}\`.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
