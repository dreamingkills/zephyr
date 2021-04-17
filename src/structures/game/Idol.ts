interface Idol {
  readonly id: number;
  readonly idol_name: string;
  readonly birthday: string | null | undefined;
}

export class GameIdol {
  readonly id: number;
  readonly name: string;
  readonly birthday: string | undefined;
  constructor(idol: Idol) {
    this.id = idol.id;
    this.name = idol.idol_name;
    this.birthday = idol.birthday || undefined;
  }
}
