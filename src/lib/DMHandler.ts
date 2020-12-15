import { Zephyr } from "../structures/client/Zephyr";
import { ProfileService } from "./database/services/game/ProfileService";

export class DMHandler {
  private timeout!: NodeJS.Timeout;
  public init(zephyr: Zephyr): void {
    this.timeout = setInterval(async () => {
      const eligible = await ProfileService.getAvailableReminderRecipients();
      const success: { id: string; type: 1 | 2 | 3 }[] = [];
      const failed = [];
      for (let p of eligible) {
        try {
          const user = await zephyr.fetchUser(p.discordId);
          let [claim, drop] = [false, false];
          if (p.claimReminder && !p.claimReminded) claim = true;
          if (p.dropReminder && !p.dropReminded) drop = true;

          if (!claim && !drop) return;

          let type: 1 | 2 | 3 | undefined;

          let message = `**${user.tag}!** `;
          if (claim && drop) {
            message += `You can now **drop** and **claim** again!`;
            type = 3;
          } else if (claim && !drop) {
            message += `You can now **claim** again!`;
            type = 1;
          } else if (!claim && drop) {
            message += `You can now **drop** again!`;
            type = 2;
          }

          if (!type) continue;

          const dmChannel = await user.getDMChannel();
          await dmChannel.createMessage(message);
          success.push({ id: p.discordId, type });
        } catch {
          failed.push(p);
          continue;
        }
      }

      if (success.length > 0) await ProfileService.setUserReminded(success);
      if (failed.length > 0) await ProfileService.disableReminders(failed);
    }, 30000);
  }

  public stop(): void {
    clearTimeout(this.timeout);
  }
}
