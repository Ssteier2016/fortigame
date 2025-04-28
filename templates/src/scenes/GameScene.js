import Phaser from "phaser";
import io from "socket.io-client";
import VirtualJoystickPlugin from "@rexrainbow/phaser3-rex-plugins/plugins/virtualjoystick-plugin.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.players = {};
  }

  preload() {
    // Recursos gráficos comentados temporalmente hasta que se suban
    // this.load.tilemapTiledJSON("palermo", "../assets/maps/palermo.json");
    // this.load.image("tiles", "../assets/tilesets/palermo.png");
    // this.load.spritesheet("player", "../assets/sprites/player.png", { frameWidth: 32, frameHeight: 32 });
    // this.load.image("jaguar", "../assets/sprites/jaguar.png");
    // this.load.image("chimera", "../assets/sprites/chimera.png");
    // this.load.image("condor", "../assets/sprites/condor.png");
    this.load.plugin("rexvirtualjoystickplugin", VirtualJoystickPlugin, true);
  }

  create() {
    // Crear un fondo básico para evitar pantalla en blanco
    this.add.rectangle(400, 300, 800, 600, 0x000000);

    // Mapa y colisiones comentados hasta que se añadan recursos
    /*
    const map = this.make.tilemap({ key: "palermo" });
    const tileset = map.addTilesetImage("tileset", "tiles");
    const groundLayer = map.createLayer("Ground", tileset, 0, 0);
    const collisionLayer = map.createLayer("Collisions", tileset, 0, 0);
    collisionLayer.setCollisionByProperty({ collides: true });
    */

    // Jugador como un rectángulo placeholder
    this.player = this.physics.add.rectangle(100, 100, 32, 32, 0xffffff);
    this.physics.world.enable(this.player);
    // this.physics.add.collider(this.player, collisionLayer); // Comentado
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 800, 600); // Límites temporales

    // Animaciones comentadas hasta que se añada player.png
    /*
    this.anims.create({
      key: "walk-down",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk-up",
      frames: this.anims.generateFrameNumbers("player", { start: 8, end: 15 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk-left",
      frames: this.anims.generateFrameNumbers("player", { start: 16, end: 23 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk-right",
      frames: this.anims.generateFrameNumbers("player", { start: 24, end: 31 }),
      frameRate: 10,
      repeat: -1,
    });
    */

    this.cursors = this.input.keyboard.createCursorKeys();
    this.joystick = this.plugins.get("rexvirtualjoystickplugin").add(this, {
      x: 100,
      y: window.innerHeight - 100,
      radius: 50,
      base: this.add.circle(0, 0, 50, 0x888888),
      thumb: this.add.circle(0, 0, 25, 0xcccccc),
    });

    this.socket = io();
    this.socket.on("connect", () => {
      this.socket.emit("newPlayer", { x: this.player.x, y: this.player.y });
    });

    this.socket.on("updatePlayers", (players) => {
      Object.keys(players).forEach((id) => {
        if (id !== this.socket.id) {
          if (!this.players[id]) {
            this.players[id] = this.physics.add.rectangle(players[id].x, players[id].y, 32, 32, 0x00ff00);
            this.physics.world.enable(this.players[id]);
            // this.physics.add.collider(this.players[id], collisionLayer); // Comentado
          } else {
            this.players[id].setPosition(players[id].x, players[id].y);
          }
        }
      });
    });

    // Cartas como rectángulos placeholders
    const wildCard = this.physics.add.rectangle(200, 200, 64, 64, 0xff0000).setInteractive();
    // this.physics.add.collider(wildCard, collisionLayer); // Comentado
    wildCard.on("pointerdown", () => {
      this.scene.start("CombatScene", { opponent: { cardId: "#001", name: "Jaguar", attackLife: 50 } });
    });

    const collectibleCard = this.physics.add.rectangle(250, 150, 64, 64, 0x0000ff).setInteractive();
    // this.physics.add.collider(collectibleCard, collisionLayer); // Comentado
    collectibleCard.on("pointerdown", () => {
      this.socket.emit("collectCard", { cardId: "#003", name: "Cóndor", attackLife: 30 });
      collectibleCard.destroy();
    });

    const cardPackage = this.physics.add.rectangle(300, 300, 64, 64, 0xffff00).setInteractive();
    // this.physics.add.collider(cardPackage, collisionLayer); // Comentado
    cardPackage.on("pointerdown", () => {
      this.socket.emit("collectCard", { cardId: "#002", name: "Quimera", attackLife: 70 });
      cardPackage.destroy();
    });

    this.input.keyboard.on("keydown-I", () => {
      this.scene.start("InventoryScene");
    });
  }

  update() {
    const speed = 100;
    this.player.body.setVelocity(0);

    let direction = null;
    if (this.cursors.left.isDown || this.joystick.left) {
      this.player.body.setVelocityX(-speed);
      direction = "walk-left";
    } else if (this.cursors.right.isDown || this.joystick.right) {
      this.player.body.setVelocityX(speed);
      direction = "walk-right";
    }
    if (this.cursors.up.isDown || this.joystick.up) {
      this.player.body.setVelocityY(-speed);
      direction = "walk-up";
    } else if (this.cursors.down.isDown || this.joystick.down) {
      this.player.body.setVelocityY(speed);
      direction = "walk-down";
    }

    if (direction) {
      // this.player.anims.play(direction, true); // Comentado
    } else {
      // this.player.anims.stop(); // Comentado
    }

    this.socket.emit("updatePosition", { x: this.player.x, y: this.player.y });
  }
}
