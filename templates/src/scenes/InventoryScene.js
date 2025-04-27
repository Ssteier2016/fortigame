import Phaser from "phaser";

export default class InventoryScene extends Phaser.Scene {
  constructor() {
    super("InventoryScene");
  }

  preload() {
    this.load.image("jaguar", "../../assets/sprites/jaguar.png");
    this.load.image("chimera", "../../assets/sprites/chimera.png");
    this.load.image("condor", "../../assets/sprites/condor.png");
  }

  create() {
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

    const cards = [
      { cardId: "#001", name: "Jaguar", attackLife: 50, experience: 0, level: 1 },
      { cardId: "#002", name: "Quimera", attackLife: 70, experience: 0, level: 1 },
      { cardId: "#003", name: "Cóndor", attackLife: 30, experience: 0, level: 1 },
    ];

    cards.forEach((card, index) => {
      const x = 200 + (index % 2) * 400;
      const y = 200 + Math.floor(index / 2) * 200;

      this.add.rectangle(x, y, 150, 200, 0xffffff);
      this.add.image(x, y - 50, card.name.toLowerCase()).setScale(0.5);
      this.add.text(x + 50, y - 90, card.cardId, { color: "#000" });
      this.add.text(x - 60, y - 90, card.attackLife, { color: "#00ff00" });
      this.add.text(x - 60, y + 80, `${card.experience}exp./${card.level}lv.`, { color: "#000" });
    });

    this.add.text(700, 50, "X", { color: "#fff", fontSize: "32px" })
      .setInteractive()
      .on("pointerdown", () => this.scene.start("GameScene"));
  }
}
