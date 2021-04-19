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
        const names = value.toString().split(`,`);

        const include = [];
        const exclude = [];

        for (let name of names) {
          const not = name.startsWith(`!`);
          if (not) name = name.slice(1);

          const specific = name.startsWith(`"`) && name.endsWith(`"`);
          if (specific) name = name.slice(1, -1);

          if (not) {
            if (specific) {
              exclude.push(
                `LOWER(idol.idol_name) != LOWER(${DB.connection.escape(name)})`
              );
            } else
              exclude.push(
                `LOWER(idol.idol_name) NOT LIKE CONCAT("%", ${DB.connection.escape(
                  name
                )}, "%")`
              );
          } else {
            if (specific) {
              include.push(
                `LOWER(idol.idol_name) = LOWER(${DB.connection.escape(name)})`
              );
            } else {
              include.push(
                `LOWER(idol.idol_name) LIKE CONCAT("%", ${DB.connection.escape(
                  name
                )}, "%")`
              );
            }
          }
        }

        let finalQuery = ` ((`;

        if (include.length > 0) {
          finalQuery += `${include.join(` OR `)}`;
        }
        if (exclude.length > 0) {
          if (include.length > 0) {
            finalQuery += ` AND (${exclude.join(` AND `)})`;
          } else finalQuery += `${exclude.join(` AND `)}`;
        }

        finalQuery += `))`;

        queryOptions.push(`${finalQuery}`);
      } else if (["group", "g"].includes(prop)) {
        if (!value) {
          queryOptions.push(` subgroup.group_id IS NULL`);
          continue;
        }

        const groups = value.toString().split(`,`);

        const include = [];
        const exclude = [];

        for (let name of groups) {
          const not = name.startsWith(`!`);
          if (not) name = name.slice(1);

          const specific = name.startsWith(`"`) && name.endsWith(`"`);
          if (specific) name = name.slice(1, -1);

          if (not) {
            if (specific) {
              exclude.push(
                `
                (
                  LOWER(base_group.group_name)
                    != LOWER(${DB.connection.escape(name)})
                  AND
                  (
                    LOWER(base_group.alias)
                      != LOWER(${DB.connection.escape(name)})
                    OR
                    base_group.alias IS NULL
                  )
                )
                `
              );
            } else
              exclude.push(
                `
                (
                  LOWER(base_group.group_name) 
                    NOT LIKE
                    CONCAT("%", ${DB.connection.escape(name)}, "%")
                  AND
                  (
                    LOWER(base_group.alias)
                      NOT LIKE
                      CONCAT("%", ${DB.connection.escape(name)}, "%")
                    OR
                    base_group.alias IS NULL
                  )
                )
                `
              );
          } else {
            if (specific) {
              include.push(
                `
                (
                  LOWER(base_group.group_name)
                    = LOWER(${DB.connection.escape(name)})
                  OR
                  LOWER(base_group.alias)
                    = LOWER(${DB.connection.escape(name)})
                )
                `
              );
            } else {
              include.push(
                `
                (
                  LOWER(base_group.group_name)
                    LIKE CONCAT("%", ${DB.connection.escape(name)}, "%")
                  OR
                  LOWER(base_group.alias)
                    = LOWER(${DB.connection.escape(name)})
                )`
              );
            }
          }
        }

        let finalQuery = ` ((`;

        if (include.length > 0) {
          finalQuery += `${include.join(` OR `)}`;
        }
        if (exclude.length > 0) {
          if (include.length > 0) {
            finalQuery += ` AND (${exclude.join(` AND `)})`;
          } else finalQuery += `${exclude.join(` AND `)}`;
        }

        finalQuery += `))`;

        queryOptions.push(`${finalQuery}`);
      } else if (["subgroup", "sg"].includes(prop)) {
        if (!value) {
          queryOptions.push(` subgroup.subgroup_name IS NULL`);
        }

        const subgroups = value.toString().split(`,`);

        const include = [];
        const exclude = [];

        for (let name of subgroups) {
          const not = name.startsWith(`!`);
          if (not) name = name.slice(1);

          const specific = name.startsWith(`"`) && name.endsWith(`"`);
          if (specific) name = name.slice(1, -1);

          if (not) {
            if (specific) {
              exclude.push(
                `LOWER(subgroup.subgroup_name) != LOWER(${DB.connection.escape(
                  name
                )})`
              );
            } else
              exclude.push(
                `LOWER(subgroup.subgroup_name) NOT LIKE CONCAT("%", ${DB.connection.escape(
                  name
                )}, "%")`
              );
          } else {
            if (specific) {
              include.push(
                `LOWER(subgroup.subgroup_name) = LOWER(${DB.connection.escape(
                  name
                )})`
              );
            } else {
              include.push(
                `LOWER(subgroup.subgroup_name) LIKE CONCAT("%", ${DB.connection.escape(
                  name
                )}, "%")`
              );
            }
          }
        }

        let finalQuery = ` ((`;

        if (include.length > 0) {
          finalQuery += `${include.join(` OR `)}`;
        }
        if (exclude.length > 0) {
          if (include.length > 0) {
            finalQuery += ` AND (${exclude.join(` AND `)})`;
          } else finalQuery += `${exclude.join(` AND `)}`;
        }

        finalQuery += `))`;

        queryOptions.push(`${finalQuery}`);
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
        if (!value.toString()) {
          queryOptions.push(` user_card.tag_id IS NULL`);
          continue;
        }

        const tagNames = value
          .toString()
          ?.split(`,`)
          .map((t) => t?.trim());

        const targetTags = tags.filter((t) => tagNames.includes(t.name));

        if (targetTags[0]) {
          queryOptions.push(
            ` user_card.tag_id IN (${DB.connection.escape(
              targetTags.map((t) => t.id)
            )})`
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
      } else if ([`dyed`].includes(prop)) {
        if (value === `true`) {
          queryOptions.push(` user_card.dye_r IS NOT NULL`);
        } else if (value === "false") {
          queryOptions.push(` user_card.dye_r IS NULL`);
        }
      }
    }
    return queryOptions;
  }
}
