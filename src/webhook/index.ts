import express from "express";
import { Logger } from "../lib/logger/Logger";
import { Zephyr } from "../structures/client/Zephyr";

export class WebhookListener {
  public async init() {
    const app = express();
    const port = Zephyr.config.topgg.webhook.port;
    const auth = Zephyr.config.topgg.webhook.auth;

    app.use(express.json());
    app.listen(port, () =>
      Logger.info(`Top.gg listener is running on port ${port}.`)
    );

    app.post(`/vote`, async (req, res) => {
      if (req.headers.authorization !== auth) {
        Logger.error(
          "Authorization header did not match." +
            `\n- ${req.headers.authorization}`
        );
        return;
      }

      const body = req.body as {
        bot: string;
        user: string;
        type: "upvote" | "test";
        query: string;
        isWeekend: boolean;
      };

      if (body.type === "test") {
        Logger.info("Test request received, authorization OK.");
        // return;
      }

      if (!body.user) return;

      res.status(200).end();

      await Zephyr.handleVote(body.user, body.isWeekend);
    });
  }
}
