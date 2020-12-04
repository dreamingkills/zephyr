export interface BaseCard {
  id: number;
  identifier: string;
  flavor_text?: string;
  group_name?: string;
  subgroup_name?: string;
  individual_name: string;
  rarity: number;
  serial_total: number;
  serial_limit: number;
}
export interface Frame {
  id: number;
  frame_name: string;
  frame_url: string;
}
export class GameBaseCard {
  id: number;
  identifier: string;
  flavor?: string;
  group?: string;
  subgroup?: string;
  name: string;
  rarity: number;
  serialTotal: number;
  serialLimit: number;
  constructor(card: BaseCard) {
    this.id = card.id;
    this.identifier = card.identifier;
    this.flavor = card.flavor_text;
    this.group = card.group_name;
    this.subgroup = card.subgroup_name;
    this.name = card.individual_name;
    this.rarity = card.rarity;
    this.serialLimit = card.serial_limit;
    this.serialTotal = card.serial_total;
  }
}
export class GameFrame {
  id: number;
  frameName: string;
  frameUrl: string;
  constructor(data: Frame) {
    this.id = data.id;
    this.frameName = data.frame_name;
    this.frameUrl = data.frame_url;
  }
}
