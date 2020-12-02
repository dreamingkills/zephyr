export class GameDroppedCard {
  id: number;
  identifier: string;
  serialNumber: number;
  frameUrl: string;

  constructor(data: {
    id: number;
    identifier: string;
    serialNumber: number;
    frameUrl: string;
  }) {
    this.id = data.id;
    this.identifier = data.identifier;
    this.serialNumber = data.serialNumber;
    this.frameUrl = data.frameUrl;
  }
}
