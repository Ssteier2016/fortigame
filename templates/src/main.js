import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";
import InventoryScene from "./scenes/InventoryScene.js";
import CombatScene from "./scenes/CombatScene.js";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "game",
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [GameScene, InventoryScene, CombatScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
