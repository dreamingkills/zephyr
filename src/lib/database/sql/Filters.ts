import { DB } from "..";
import { GameTag } from "../../../structures/game/Tag";

export interface Filter {
  [key: string]: string | number;
}

export class FilterService {
  public static parseOptions(options: Filter, tags: GameTag[]): string[] {
    const queryOptions: string[] = [];

    for (let [prop, value] of Object.entries(options)) {
      if (["issue", "i", "serial", "s", "print", "p"].includes(prop)) {
        const targetIssues = [];

        for (let issue of value.toString().split(`,`)) {
          if ([`<`, `>`, `/`].includes(issue[0])) {
            const trueIssue = parseInt(issue.slice(1), 10);

            if (isNaN(trueIssue) || trueIssue < 1) continue;

            switch (issue[0]) {
              case `<`: {
                queryOptions.push(
                  ` user_card.serial_number < ${DB.connection.escape(
                    trueIssue
                  )}`
                );
                break;
              }
              case `>`: {
                queryOptions.push(
                  ` user_card.serial_number > ${DB.connection.escape(
                    trueIssue
                  )}`
                );
                break;
              }
              case `/`: {
                queryOptions.push(
                  ` user_card.serial_number % ${DB.connection.escape(
                    trueIssue
                  )} = 0`
                );
                break;
              }
            }
          } else {
            const issueNumber = parseInt(issue, 10);

            if (isNaN(issueNumber) || issueNumber < 1) continue;

            targetIssues.push(issueNumber);
          }
        }

        if (targetIssues.length < 1) continue;

        queryOptions.push(
          ` user_card.serial_number IN (${DB.connection.escape(targetIssues)})`
        );
      } else if (["name", "n"].includes(prop)) {
        const names = value
          .toString()
          .split(`,`)
          .map(
            (n) =>
              `LOWER(idol.idol_name) LIKE CONCAT("%",${DB.connection.escape(
                n
              )},"%")`
          );

        queryOptions.push(` (${names.join(` OR `)})`);
      } else if (["group", "g"].includes(prop)) {
        if (!value) {
          queryOptions.push(` subgroup.group_id IS NULL`);
          continue;
        }

        const groups = value
          .toString()
          .split(`,`)
          .map(
            (n) =>
              `LOWER(base_group.group_name) LIKE CONCAT("%",${DB.connection.escape(
                n
              )},"%") OR LOWER(base_group.alias) LIKE CONCAT("%",${DB.connection.escape(
                n
              )},"%")`
          );

        queryOptions.push(` (${groups.join(` OR `)})`);
      } else if (["subgroup", "sg"].includes(prop)) {
        if (!value) {
          queryOptions.push(` subgroup.subgroup_name IS NULL`);
        }

        const subgroups = value
          .toString()
          .split(`,`)
          .map(
            (n) =>
              `LOWER(subgroup.subgroup_name) LIKE CONCAT("%",${DB.connection.escape(
                n
              )},"%")`
          );

        queryOptions.push(` (${subgroups.join(` OR `)})`);
      } else if (["wear", "w", "condition", "c"].includes(prop)) {
        const targetWears = [];

        for (let wear of value.toString().split(`,`)) {
          if ([`<`, `>`].includes(wear[0])) {
            const trueWear = parseInt(wear.slice(1), 10);

            if (isNaN(trueWear) || trueWear < 1) continue;

            switch (wear[0]) {
              case `<`: {
                queryOptions.push(
                  ` user_card.wear < ${DB.connection.escape(trueWear)}`
                );
                break;
              }
              case `>`: {
                queryOptions.push(
                  ` user_card.wear > ${DB.connection.escape(trueWear)}`
                );
                break;
              }
            }
          } else {
            const wearNumber = parseInt(wear, 10);

            if (isNaN(wearNumber) || wearNumber < 0 || wearNumber > 5) continue;

            targetWears.push(wearNumber);
          }
        }

        if (targetWears.length < 1) continue;

        queryOptions.push(
          ` user_card.wear IN (${DB.connection.escape(targetWears)})`
        );
      } else if (["tag", "t"].includes(prop)) {
        const tag = tags.filter(
          (t) => t.name === value.toString()?.toLowerCase()
        )[0];
        if (!value.toString()) {
          queryOptions.push(` user_card.tag_id IS NULL`);
          continue;
        }
        if (tag && value) {
          queryOptions.push(
            ` user_card.tag_id=${DB.connection.escape(tag.id)}`
          );
          continue;
        }

        queryOptions.push(` user_card.tag_id=-1`);
      } else if (["frame", "f"].includes(prop)) {
        if (value === "true") {
          queryOptions.push(` user_card.frame!=1`);
        } else if (value === "false") {
          queryOptions.push(` user_card.frame=1`);
        }
      }
    }
    return queryOptions;
  }
}
