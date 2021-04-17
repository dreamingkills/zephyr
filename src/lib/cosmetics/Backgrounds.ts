import { loadImage } from "canvas";
import {
  GameAlbumBackground,
  IntermediateBackground,
} from "../../structures/game/Album";
import { CosmeticGetter } from "../database/sql/game/shop/CosmeticGetter";

class BackgroundService {
  private backgrounds: GameAlbumBackground[] = [];

  public async loadBackgrounds(): Promise<GameAlbumBackground[]> {
    const backgrounds = await CosmeticGetter.getBackgrounds();

    const finalBackgrounds = [];
    for (let background of backgrounds) {
      const intermediate: IntermediateBackground = {
        id: background.id,
        background_name: background.background_name,
        image: await loadImage(background.image_url),
      };

      finalBackgrounds.push(new GameAlbumBackground(intermediate));
    }

    this.backgrounds = finalBackgrounds;
    return this.backgrounds;
  }

  public getBackgroundById(id: number): GameAlbumBackground | undefined {
    return this.backgrounds.find((background) => background.id === id);
  }

  public getBackgroundByName(name: string): GameAlbumBackground | undefined {
    return this.backgrounds.find((background) =>
      background.name.toLowerCase().startsWith(name.toLowerCase())
    );
  }

  public async init() {
    await this.loadBackgrounds();
    return;
  }
}

export const Backgrounds = new BackgroundService();
