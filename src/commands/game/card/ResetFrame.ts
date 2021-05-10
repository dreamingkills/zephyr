import { Message, PartialEmoji, User } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ReactionCollector } from "eris-collector";
import { GameUserCard } from "../../../structures/game/UserCard";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class ResetFrame extends BaseCommand {
  id = `would`;
  names = [`resetframe`, `rf`];
  description = `Resets the frame of a card to default.`;
  usage = [`$CMD$ <card>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const rawIdentifier = options[0];
    let card: GameUserCard;
    if (!rawIdentifier) {
      card = await CardService.getLastCard(profile);
    } else card = await CardService.getUserCardByIdentifier(rawIdentifier);
    const trueIdentifier = card.id.toString(36);

    if (card.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(card);

    if (card.frameName?.includes("Default"))
      throw new ZephyrError.FrameAlreadyDefaultError(card);

    if (card.frameName?.includes("Signature"))
      throw new ZephyrError.CannotRemoveFrameError();

    const confirmation = await this.send(
      msg.channel,
      `${Zephyr.config.discord.emoji.warn} Really reset the frame of \`${trueIdentifier}\`?`
    );

    const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
      user.id === msg.author.id &&
      emoji.id === Zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(Zephyr, confirmation, filter, {
      time: 30000,
      max: 1,
    });
    collector.on("error", async (e: Error) => {
      await this.handleError(msg, msg.author, e);
    });

    collector.on("collect", async () => {
      await CardService.changeCardFrame(card, 1);
      await confirmation.edit(
        `${Zephyr.config.discord.emoji.check} Reset the frame of \`${trueIdentifier}\`.`
      );
      collector.en;
      return;
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await confirmation.edit(
          `${Zephyr.config.discord.emoji.warn} Did not reset the frame.`
        );
        await confirmation.removeReaction(
          `check:${Zephyr.config.discord.emojiId.check}`,
          Zephyr.user.id
        );
        return;
      }
    });

    await this.react(
      confirmation,
      `check:${Zephyr.config.discord.emojiId.check}`
    );
    return;
  }
}
