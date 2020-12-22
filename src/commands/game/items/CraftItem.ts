import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { recipes } from "../../../assets/recipes.json";
import { items } from "../../../assets/items.json";
import { BaseItem } from "../../../structures/game/Item";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { renderRecipe } from "../../../lib/ZephyrUtils";
import { Recipe } from "../../../structures/game/Recipe";
import { ReactionCollector } from "eris-collector";

export default class CraftItem extends BaseCommand {
  names = ["craft"];
  description = "Shows the status of various timers.";
  developerOnly = true;
  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const recipeQuery = recipes.filter(
      (r) => r.query === this.options.join(" ").toLowerCase()
    )[0] as Recipe;

    if (!recipeQuery) throw new ZephyrError.RecipeNotFoundError();

    const requiredBaseItems = recipeQuery.ingredients.map(
      (i) => items.filter((b) => b.id === i.itemId)[0]
    ) as BaseItem[];
    const requiredItemCounts = recipeQuery.ingredients.map((i) => i.count);

    const requiredUserItems = [];

    for (let base of requiredBaseItems) {
      const userItem = await ProfileService.getItem(
        profile,
        base.id,
        base.name
      );

      const ingredientCount =
        requiredItemCounts[requiredBaseItems.indexOf(base)];

      if (userItem.count < ingredientCount)
        throw new ZephyrError.NotEnoughOfItemError(base.name);

      requiredUserItems.push(userItem);
    }

    const embed = new MessageEmbed()
      .setAuthor(
        `Crafting | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `Please confirm that you would like to craft **${
          recipeQuery.name
        }**.\n${renderRecipe(recipeQuery)}` +
          `**Notice**: Crafting is not reversible!`
      );

    const confirmation = await msg.channel.createMessage({ embed });

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(this.zephyr, confirmation, filter, {
      time: 30000,
      max: 1,
    });

    collector.on("collect", async () => {
      await ProfileService.removeItems(
        profile,
        requiredBaseItems.map((b) => {
          return {
            item: b,
            count: requiredItemCounts[requiredBaseItems.indexOf(b)],
          };
        })
      );
      await ProfileService.addItems(
        profile,
        recipeQuery.result.map((r) => {
          const resultBaseItem = items.filter((i) => i.id === r.itemId)[0];
          return { item: resultBaseItem, count: r.count };
        })
      );

      await confirmation.edit({
        embed: embed.setFooter(`🛠️ You've crafted ${recipeQuery.name}!`),
      });
      collector.stop();
      return;
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await confirmation.edit({
          embed: embed.setFooter(`🕒 This crafting confirmation has expired.`),
        });
      }

      try {
        await confirmation.removeReactions();
      } catch {}
    });

    await confirmation.addReaction(
      `check:${this.zephyr.config.discord.emojiId.check}`
    );
  }
}
