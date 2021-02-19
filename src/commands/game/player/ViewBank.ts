import { Message } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

export default class ViewBank extends BaseCommand {
  names = ["bank"];
  description = "Shows you the contents of your bit bank.";
  subcommands = ["deposit <amount>", "withdraw <amount>"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const subcommand = options[0]?.toLowerCase();
    if (subcommand === "deposit") {
      let amount = parseInt(options[1], 10);
      if (options[1]?.toLowerCase() === "all") amount = profile.bits;

      if (isNaN(amount) || amount < 1) {
        throw new ZephyrError.InvalidAmountError("bits");
      }
      if (amount > profile.bits)
        throw new ZephyrError.NotEnoughBitsError(profile.bits, amount);

      await ProfileService.removeBitsFromProfile(profile, amount);
      const newProfile = await ProfileService.addBitsToBank(profile, amount);

      const embed = new MessageEmbed(`Bank`, msg.author).setDescription(
        `${this.zephyr.config.discord.emoji.bank} You deposited ${
          this.zephyr.config.discord.emoji.bits
        }**${amount.toLocaleString()}** to your bank.` +
          `\n— New bank balance: ${
            this.zephyr.config.discord.emoji.bits
          }**${newProfile.bitsBank.toLocaleString()}**` +
          `\n— New balance: ${
            this.zephyr.config.discord.emoji.bits
          }**${newProfile.bits.toLocaleString()}**`
      );

      await this.send(msg.channel, embed);
      return;
    } else if (subcommand === "withdraw") {
      let amount = parseInt(options[1], 10);
      if (options[1]?.toLowerCase() === "all") amount = profile.bitsBank;

      if (isNaN(amount) || amount < 1) {
        throw new ZephyrError.InvalidAmountError("bits");
      }
      if (amount > profile.bitsBank)
        throw new ZephyrError.NotEnoughBitsInBankError(profile.bits, amount);

      await ProfileService.addBitsToProfile(profile, amount);
      const newProfile = await ProfileService.withdrawBitsFromBank(
        profile,
        amount
      );

      const embed = new MessageEmbed(`Bank`, msg.author).setDescription(
        `${this.zephyr.config.discord.emoji.bank} You withdrew ${
          this.zephyr.config.discord.emoji.bits
        }**${amount.toLocaleString()}** from your bank.` +
          `\n— New bank balance: ${
            this.zephyr.config.discord.emoji.bits
          }**${newProfile.bitsBank.toLocaleString()}**` +
          `\n— New balance: ${
            this.zephyr.config.discord.emoji.bits
          }**${newProfile.bits.toLocaleString()}**`
      );

      await this.send(msg.channel, embed);
      return;
    }
    const embed = new MessageEmbed(`Bank`, msg.author).setDescription(
      `${this.zephyr.config.discord.emoji.bank} Your bank contains...` +
        `\n— ${
          this.zephyr.config.discord.emoji.bits
        }**${profile.bitsBank.toLocaleString()}**`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
