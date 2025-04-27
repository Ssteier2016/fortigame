import Phaser from "phaser";
import io from "socket.io-client";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.players = {};
  }

  preload() {
    this.load.tilemapTiledJSON("palermo", "assets/maps/palermo.json");
    this.load.image("tiles", "assets/tilesets/palermo.png");
    this.load.spritesheet("player", "assets/sprites/player.png", { frameWidth: 32, frameHeight: 32 });
    this.load.image("jaguar", "assets/sprites/jaguar.png");
    this.load.image("chimera", "assets/sprites/chimera.png");
    this.load.image("condor", "assets/sprites/condor.png");
  }

  create() {
    const map = this.make.tilemap({ key: "palermo" });
    const tileset = map.addTilesetImage("tileset", "tiles");
    const groundLayer = map.createLayer("Ground", tileset, 0, 0);
    const collisionLayer = map.createLayer("Collisions", tileset, 0, 0);
    collisionLayer.setCollisionByProperty({ collides: true });

    this.player = this.physics.add.sprite(100, 100, "player");
    this.physics.add.collider(this.player, collisionLayer);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.socket = io();
    this.socket.on("connect", () => {
      this.socket.emit("newPlayer", { x: this.player.x, y: this.player.y });
    });

    this.socket.on("updatePlayers", (players) => {
      Object.keys(players).forEach((id) => {
        if (id !== this.socket.id) {
          if (!this.players[id]) {
            this.players[id] = this.physics.add.sprite(players[id].x, players[id].y, "player");
            this.physics.add.collider(this.players[id], collisionLayer);
          } else {
            this.players[id].setPosition(players[id].x, players[id].y);
          }
        }
      });
    });

    const wildCard = this.physics.add.sprite(200, 200, "jaguar").setInteractive();
    this.physics.add.collider(wildCard, collisionLayer);
    wildCard.on("pointerdown", () => {
      this.scene.start("CombatScene", { opponent: { cardId: "#001", name: "Jaguar", attackLife: 50 } });
    });

    this.input.keyboard.on("keydown-I", () => {
      this.scene.start("InventoryScene");
    });
  }

  update() {
    const speed = 100;
    this.player.body.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(speed);
    }
    if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.body.setVelocityY(speed);
    }

    this.socket.emit("updatePosition", { x: this.player.x, y: this.player.y });
  }
}
