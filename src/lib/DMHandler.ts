import { Zephyr } from "../structures/client/Zephyr";
import { ProfileService } from "./database/services/game/ProfileService";
import dayjs from "dayjs";
import { createMessage } from "./discord/message/createMessage";

export class DMHandler {
  public remindersEnabled = true;

  public async handle(zephyr: Zephyr): Promise<void> {
    const eligible = await ProfileService.getAvailableReminderRecipients();
    const success: { id: string; type: 1 | 2 | 3 }[] = [];
    const failed = [];
    for (let p of eligible) {
      if (p.blacklisted) {
        failed.push(p);
        continue;
      }
      const user = await zephyr.fetchUser(p.discordId);
      if (!user) {
        failed.push(p);
        continue;
      }
      let [claim, drop] = [false, false];

      const now = dayjs(Date.now());
      const nextClaim = dayjs(p.claimNext);
      const nextDrop = dayjs(p.dropNext);

      if (nextClaim < now && p.claimReminder && !p.claimReminded) claim = true;
      if (nextDrop < now && p.dropReminder && !p.dropReminded) drop = true;

      if (!claim && !drop) continue;

      let type: 1 | 2 | 3 | undefined;

      let message = `**${user.tag}!** `;
      if (claim && drop) {
        message += `You can now **drop** and **claim** again!`;
        type = 1;
      } else if (claim && !drop) {
        message += `You can now **claim** again!`;
        type = 2;
      } else if (!claim && drop) {
        message += `You can now **drop** again!`;
        type = 3;
      }

      if (!type) continue;

      const dmChannel = await user.getDMChannel();

      try {
        await createMessage(dmChannel, message);
        success.push({ id: p.discordId, type });
        break;
      } catch (e) {
        failed.push(p);
        continue;
      }
    }

    if (success.length > 0) await ProfileService.setUserReminded(success);
    if (failed.length > 0) await ProfileService.disableReminders(failed);

    if (this.remindersEnabled) setTimeout(() => this.handle(zephyr), 30000);
  }
}
