import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { recipes } from "../../../assets/recipes.json";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { renderRecipe } from "../../../lib/utility/text/TextUtils";

export default class ShowRecipes extends BaseCommand {
  names = ["recipes"];
  description = "Shows recipes available to craft.";
  allowDm = true;

  async exec(msg: Message): Promise<void> {
    const embed = new MessageEmbed().setAuthor(
      `Recipes | ${msg.author.tag}`,
      msg.author.dynamicAvatarURL("png")
    );

    const prefix = this.zephyr.getPrefix(msg.guildID!);

    for (let recipe of recipes) {
      embed.addField({
        name: recipe.name,
        value: `\`${prefix}craft ${recipe.query}\`\n` + renderRecipe(recipe),
        inline: true,
      });
    }

    await this.send(msg.channel, embed);
    return;
  }
}
