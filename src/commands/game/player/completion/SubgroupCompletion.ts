import { Message } from "eris";
import { CardService } from "../../../../lib/database/services/game/CardService";
import { CompletionService } from "../../../../lib/database/services/game/CompletionService";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { ChoiceEmbed } from "../../../../structures/client/ChoiceEmbed";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { GameProfile } from "../../../../structures/game/Profile";

export default class SubgroupCompletion extends BaseCommand {
  names = ["compl"];
  description = "";
  usage = [];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    let subgroup: string | undefined;
    let group: string | undefined;

    if (!options[0]) {
      const lastCard = await ProfileService.getLastCard(profile);
      const lastBase = this.zephyr.getCard(lastCard.baseCardId);

      subgroup = lastBase.subgroup ?? undefined;
      group = lastBase.group ?? undefined;
    } else {
      const nameQuery = options.join(" ")?.trim();

      const dbSubgroup = await CardService.findSubgroups(nameQuery!);

      if (dbSubgroup.length > 1) {
        const embed = new MessageEmbed()
          .setAuthor(
            `Completion | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(
            `I found multiple matches for **${nameQuery!}**.\nPlease reply with a number to confirm which subgroup you're talking about.\n`
          );

        const choiceEmbed = new ChoiceEmbed(
          this.zephyr,
          msg,
          embed,
          dbSubgroup.map((sg) => `**${sg.group}** ${sg.name}`)
        );

        const choice = await choiceEmbed.ask();

        if (choice === undefined) return;

        const chosenSubgroup = dbSubgroup[choice];
        subgroup = chosenSubgroup.name;
        group = chosenSubgroup.group;
      } else {
        subgroup = dbSubgroup[0].name;
        group = dbSubgroup[0].group;
      }
    }

    console.log(group, subgroup);

    const completion = await CompletionService.subgroupCompletion(
      profile,
      group!,
      subgroup!
    );

    console.log(completion);

    const embed = new MessageEmbed().setAuthor(
      `Completion | ${msg.author.tag}`,
      msg.author.dynamicAvatarURL("png")
    );

    await msg.channel.createMessage({ embed });
  }
}
