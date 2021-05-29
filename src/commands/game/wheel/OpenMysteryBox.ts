import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";
import { GameItem } from "../../../structures/game/Item";
import { ReactionCollector } from "eris-collector";
import { Logger } from "../../../lib/logger/Logger";
import { getItemById, getItemByName } from "../../../assets/Items";
import * as ZephyrError from "../../../structures/error/ZephyrError";

export default class OpenMysteryBox extends BaseCommand {
  id = `ramona`;
  names = [`mysterybox`, `mb`, `open`];
  description = `Opens the Mystery Box for a random prize - requires a **Key**.`;
  usage = [`$CMD$`];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const keyPrefab = getItemByName(`Key`);

    if (!keyPrefab) {
      Logger.error(`No Key item found (.mysterybox)!`);
      throw new ZephyrError.KeyItemNotFoundError();
    }

    let keys: GameItem;

    try {
      const keysItem = await ProfileService.getItem(profile, 47, `Key`);

      keys = keysItem;
    } catch (e) {
      const prefix = Zephyr.getPrefix(msg.guildID);

      const embed = new MessageEmbed(`Mystery Box`, msg.author).setDescription(
        `**You don't have any keys!**\nYou can use \`${prefix}daily\` to get one per day.`
      );

      await this.send(msg.channel, embed);
      return;
    }

    const confirmationEmbed = new MessageEmbed(`Mystery Box`, msg.author)
      .setDescription(`Really use **one Key** to open a Mystery Box?`)
      .setFooter(
        `🗝️ You have ${keys.quantity} key${keys.quantity === 1 ? `` : `s`}.`
      );

    const confirmationMessage = await this.send(msg.channel, confirmationEmbed);

    const confirmed: boolean = await new Promise(async (res) => {
      const filter = (_m: any, emoji: PartialEmoji, user: User) => {
        return emoji.name === `✅` && user.id === msg.author.id;
      };

      const collector = new ReactionCollector(
        Zephyr,
        confirmationMessage,
        filter,
        { time: 15000 }
      );

      collector.on(`error`, (e: Error) => {
        Logger.error(e);
        res(false);
      });

      collector.on(`collect`, () => {
        res(true);
        collector.stop();
      });

      collector.on(`end`, (_collected: unknown, reason: string) => {
        if (reason !== `time`) return;

        res(false);
      });

      await this.react(confirmationMessage, `✅`);
    });

    if (!confirmed) {
      await this.edit(
        confirmationMessage,
        confirmationEmbed.setFooter(`🕒 This confirmation has expired.`)
      );

      return;
    }

    // await this.delete(confirmationMessage);

    const prizeWeights = this.prizes.map((p) => p.rarity);
    const randomPrize = Zephyr.chance.weighted(this.prizes, prizeWeights);

    await ProfileService.removeItems(profile, [{ item: keyPrefab, count: 1 }]);

    let embedBody = `You open the Mystery Box and receive... `;

    switch (randomPrize.type) {
      case `bits`: {
        await ProfileService.addBitsToProfile(profile, randomPrize.amount);

        embedBody += `**${randomPrize.amount} bits**!`;
        break;
      }
      case `cubits`: {
        await ProfileService.addCubits(profile, randomPrize.amount);

        embedBody += `**${randomPrize.amount} cubits**!`;
        break;
      }
      case `darkframe`: {
        const darkDefaultFrame = getItemById(33);

        if (!darkDefaultFrame) {
          Logger.error(`Dark Default Frame not found (.mysterybox)!`);
          await ProfileService.addItems(profile, [
            { item: keyPrefab, count: 1 },
          ]);

          throw new ZephyrError.UnexpectedWheelError();
        }

        await ProfileService.addItems(profile, [
          { item: darkDefaultFrame, count: randomPrize.amount },
        ]);

        embedBody += `**${randomPrize.amount}x Dark Default Frame**!`;
        break;
      }
      case `dye`: {
        const dyeBottle = getItemById(2);

        if (!dyeBottle) {
          Logger.error(`Dye Bottle not found (.mysterybox)!`);
          await ProfileService.addItems(profile, [
            { item: keyPrefab, count: 1 },
          ]);

          throw new ZephyrError.UnexpectedWheelError();
        }

        await ProfileService.addItems(profile, [
          { item: dyeBottle, count: randomPrize.amount },
        ]);

        embedBody += `**${randomPrize.amount}x Dye Bottle**!`;
        break;
      }
      case `mintdust`: {
        const mintDust = getItemById(10);

        if (!mintDust) {
          Logger.error(`Mint Dust not found (.mysterybox)!`);
          await ProfileService.addItems(profile, [
            { item: keyPrefab, count: 1 },
          ]);

          throw new ZephyrError.UnexpectedWheelError();
        }

        await ProfileService.addItems(profile, [
          { item: mintDust, count: randomPrize.amount },
        ]);

        embedBody += `**${randomPrize.amount}x Mint Dust**!`;
        break;
      }
      case `tokens`: {
        const token = getItemById(30);

        if (!token) {
          Logger.error(`X Token not found (.mysterybox)!`);
          await ProfileService.addItems(profile, [
            { item: keyPrefab, count: 1 },
          ]);

          throw new ZephyrError.UnexpectedWheelError();
        }

        await ProfileService.addItems(profile, [
          { item: token, count: randomPrize.amount },
        ]);

        embedBody += `**${randomPrize.amount}x X Token**!`;
        break;
      }
      case `key`: {
        await ProfileService.addItems(profile, [
          { item: keyPrefab, count: randomPrize.amount },
        ]);

        embedBody += `**${randomPrize.amount}x Key**!`;
      }
    }

    const embed = new MessageEmbed(`Mystery Box`, msg.author)
      .setDescription(embedBody)
      .setFooter(
        `🗝️ You have ${keys.quantity - 1} key${
          keys.quantity - 1 === 1 ? `` : `s`
        } remaining.`
      );

    await this.edit(confirmationMessage, embed);

    return;
  }

  private prizes: Prize[] = [
    { type: `tokens`, amount: 10, rarity: 0.1 },
    { type: `darkframe`, amount: 1, rarity: 1 },
    { type: `key`, amount: 3, rarity: 5 },
    { type: `tokens`, amount: 1, rarity: 9 },
    { type: `dye`, amount: 1, rarity: 10 },
    { type: `mintdust`, amount: 3, rarity: 15 },
    { type: `cubits`, amount: 8, rarity: 20 },
    { type: `bits`, amount: 250, rarity: 20 },
  ];
}

type PrizeType =
  | `bits`
  | `cubits`
  | `tokens`
  | `mintdust`
  | `dye`
  | `darkframe`
  | `key`;
type Prize = { type: PrizeType; amount: number; rarity: number };
