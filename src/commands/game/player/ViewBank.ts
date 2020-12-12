import { Message } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

export default class ViewBank extends BaseCommand {
  names = ["bank", "b"];
  description = "Shows you the contents of your bit bank.";
  subcommands = ["deposit <amount>", "withdraw <amount>"];
  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const subcommand = this.options[0]?.toLowerCase();
    if (subcommand === "deposit") {
      let amount = parseInt(this.options[1], 10);
      if (this.options[1].toLowerCase() === "all") amount = profile.bits;

      if (isNaN(amount) || amount < 1) {
        throw new ZephyrError.InvalidAmountError("bits");
      }
      if (amount > profile.bits)
        throw new ZephyrError.NotEnoughBitsError(profile.bits, amount);

      await ProfileService.removeBitsFromProfile(profile, amount);
      const newProfile = await ProfileService.addBitsToBank(profile, amount);

      const embed = new MessageEmbed()
        .setAuthor(
          `Bank | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(
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
      await msg.channel.createMessage({ embed });
      return;
    } else if (subcommand === "withdraw") {
      let amount = parseInt(this.options[1], 10);
      if (this.options[1].toLowerCase() === "all") amount = profile.bitsBank;

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

      const embed = new MessageEmbed()
        .setAuthor(
          `Bank | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(
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
      await msg.channel.createMessage({ embed });
      return;
    }
    const embed = new MessageEmbed()
      .setAuthor(`Bank | ${msg.author.tag}`, msg.author.avatarURL)
      .setDescription(
        `${this.zephyr.config.discord.emoji.bank} Your bank contains...` +
          `\n— ${
            this.zephyr.config.discord.emoji.bits
          }**${profile.bitsBank.toLocaleString()}**`
      );
    await msg.channel.createMessage({ embed });
  }
}
