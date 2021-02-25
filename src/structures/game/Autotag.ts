export interface Autotag {
  id: number;
  discord_id: string;
  autotag_key: `idol` | `group` | `wear` | `issue`;
  autotag_value: number;
  priority: number;
  tag_id: number;
}

export class GameAutotag {
  id: number;
  discordId: string;
  key: `idol` | `group` | `wear` | `issue`;
  value: number;
  priority: number;
  tagId: number;
  constructor(autotag: Autotag) {
    this.id = autotag.id;
    this.discordId = autotag.discord_id;
    this.key = autotag.autotag_key;
    this.value = autotag.autotag_value;
    this.priority = autotag.priority;
    this.tagId = autotag.tag_id;
  }
}
