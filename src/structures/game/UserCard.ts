import { Frames } from "../../lib/cosmetics/Frames";
import { CardService } from "../../lib/database/services/game/CardService";
import { GameBaseCard } from "./BaseCard";
import { GameFrame } from "./Frame";
// ALTER TABLE user_card ADD COLUMN experience INT(11) DEFAULT 0;
export interface UserCard {
  readonly id: number;
  readonly card_id: number;
  readonly serial_number: number;
  readonly discord_id: string;
  readonly wear: 0 | 1 | 2 | 3 | 4 | 5;
  readonly frame: number;
  readonly text_color_hex: Buffer;
  readonly dye_mask_url: string;
  readonly dye_r: number | null;
  readonly dye_g: number | null;
  readonly dye_b: number | null;
  readonly tag_id: number | null;
  readonly vaulted: boolean;
  readonly experience: number;
}

export class GameUserCard {
  readonly id: number;
  readonly baseCardId: number;
  readonly serialNumber: number;
  readonly discordId: string;
  readonly wear: 0 | 1 | 2 | 3 | 4 | 5;
  readonly frame: GameFrame;
  readonly textColor: string;
  readonly dyeMaskUrl: string;
  readonly dye: {
    r: number;
    g: number;
    b: number;
  };
  readonly vaulted: boolean;
  readonly experience: number;

  readonly tagId: number | undefined;

  constructor(data: UserCard) {
    this.id = data.id;
    this.baseCardId = data.card_id;
    this.serialNumber = data.serial_number;
    this.discordId = data.discord_id;
    this.wear = data.wear;

    this.frame = Frames.getFrameById(data.frame || 1)!;
    this.textColor = data.text_color_hex?.toString() || `000000`;
    this.dyeMaskUrl = data.dye_mask_url;
    this.vaulted = data.vaulted;
    this.experience = data.experience;

    this.tagId = data.tag_id || undefined;

    let r, g, b;

    if (data.dye_r || data.dye_r === 0) {
      r = data.dye_r;
    } else r = -1;
    if (data.dye_g || data.dye_g === 0) {
      g = data.dye_g;
    } else g = -1;
    if (data.dye_b || data.dye_b === 0) {
      b = data.dye_b;
    } else b = -1;

    this.dye = { r, g, b };
  }

  public async fetch(): Promise<GameUserCard> {
    return await CardService.getUserCardById(this.id);
  }
}

export class MockUserCard {
  readonly id: number;
  readonly baseCard: GameBaseCard;
  readonly serialNumber: number;

  readonly frame: GameFrame;
  readonly dye: { r: number; g: number; b: number };

  constructor(data: {
    id: number;
    baseCard: GameBaseCard;
    serialNumber: number;
    frame: GameFrame;
    dye: { r: number; g: number; b: number };
  }) {
    this.id = data.id;
    this.baseCard = data.baseCard;
    this.serialNumber = data.serialNumber;

    this.frame = data.frame;
    this.dye = data.dye;
  }
}
