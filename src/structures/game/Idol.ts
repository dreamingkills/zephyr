export interface Idol {
  id: number;
  idol_name: string;
  birthday: string | null | undefined;
}

export class GameIdol {
  id: number;
  name: string;
  birthday: string | undefined;
  constructor(idol: Idol) {
    this.id = idol.id;
    this.name = idol.idol_name;
    this.birthday = idol.birthday || undefined;
  }
}
