import express from "express";
import bodyparser from "body-parser";
import { Zephyr } from "../structures/client/Zephyr";

export class WebhookListener {
  public async init(zephyr: Zephyr) {
    const app = express();
    const port = zephyr.config.topgg.webhook.port;
    const auth = zephyr.config.topgg.webhook.auth;

    app.use(bodyparser.json());
    app.listen(port, () =>
      console.log(`Top.gg listener is running on PORT ${port}.`)
    );

    app.post(`/vote`, async (req, res) => {
      if (req.headers.authorization !== auth) {
        console.log(
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
        console.log("Test request received, authorization OK.");
        // return;
      }

      if (!body.user) return;

      await zephyr.handleVote(body.user, body.isWeekend);

      res.status(200).end();
    });
  }
}
