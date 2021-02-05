import dayjs from "dayjs";

export interface BaseCard {
  id: number;
  group_name: string | null;
  group_id: number | null;
  idol_id: number;
  subgroup_id: number | null;
  idol_name: string;
  birthday: string;
  subgroup_name: string | null;
  image_url: string;
  rarity: number;
  serial_total: number;
  serial_limit: number;
  num_generated: number;
  emoji: string | null;
  archived: boolean;
  activated: boolean;
}

export interface Frame {
  id: number;
  frame_name: string;
  frame_url: string;
  dye_mask_url: string;
}

export class GameBaseCard {
  id: number;
  group?: string;
  groupId?: number;
  subgroup?: string;
  idolId: number;
  subgroupId?: number;
  name: string;
  image: string;
  rarity: number;
  serialTotal: number;
  serialLimit: number;
  totalGenerated: number;
  emoji?: string;
  archived: boolean;
  birthday?: string;
  activated: boolean;

  constructor(card: BaseCard) {
    this.id = card.id;

    this.group = card.group_name || undefined;
    this.groupId = card.group_id || undefined;

    this.subgroup = card.subgroup_name || undefined;
    this.subgroupId = card.subgroup_id || undefined;

    this.name = card.idol_name;
    this.idolId = card.idol_id;

    this.image = card.image_url;
    this.rarity = card.rarity;
    this.serialLimit = card.serial_limit;
    this.serialTotal = card.serial_total;
    this.totalGenerated = card.num_generated;
    this.emoji = card.emoji || undefined;
    this.archived = card.archived;
    this.activated = card.activated;
    if (card.birthday)
      this.birthday = dayjs(card.birthday).format(`YYYY-MM-DD`);
  }
}

export class GameFrame {
  id: number;
  frameName: string;
  frameUrl: string;
  dyeMaskUrl: string;
  constructor(data: Frame) {
    this.id = data.id;
    this.frameName = data.frame_name;
    this.frameUrl = data.frame_url;
    this.dyeMaskUrl = data.dye_mask_url;
  }
}
