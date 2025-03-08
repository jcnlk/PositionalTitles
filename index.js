import config from "./config";

const PREFIX = "&8[&6PT&8]&r";
const tablistClassRegex = /\[(?:.+)\] (.+) \((Berserk|Archer|Mage|Tank|Healer) ([a-zA-Z]+)\)/;
const BossStatus = Java.type("net.minecraft.entity.boss.BossStatus");

let currentGoldorPhase = 0;

const lastLocation = {
  AtP2: false,
  AtSS: false,
  AtEE2: false,
  AtEE3: false,
  AtCore: false,
  InGoldorTunnel: false,
  AtMid: false,
  Ati4Entry: false,
  AtP5: false
}

const ClassColor = {
  Healer: "&d",
  Tank: "&a",
  Mage: "&b",
  Berserk: "&c",
  Archer: "&6"
};

// At P2
const validP2Msg = ["at p2", "in p2"];
const isValidP2 = playerInfo => !lastLocation.AtP2 && isInBoss("Maxor") && playerInfo.className !== "Healer";
// At SS
const validAtSSMsg = ["at ss", "at simon says"];
const isValidAtSS = () => !lastLocation.AtSS && (isInBoss("Storm") || isInBoss("Goldor"));
// At EE2
const validEE2Msg = ["early enter 2", "pre enter 2", "at ee2", "entered 3.2"];
const isValidEE2 = () => !lastLocation.AtEE2 && currentGoldorPhase === 1;
// At EE3
const validEE3Msg = ["early enter 3", "pre enter 3", "at ee3", "entered 3.3"];
const isValidEE3 = () => !lastLocation.AtEE3 && currentGoldorPhase === 2;
// At Core
const validAtCoreMsg = ["at core", "pre enter 4", "early enter 4", "at ee4", "entered 3.4"];
const isValidAtCore = () => !lastLocation.AtCore && (currentGoldorPhase === 2 || currentGoldorPhase === 3);
// In Goldor Tunnel
const validInGoldorTunnelMsg = ["in goldor tunnel", "inside goldor tunnel", "in core", "entered 3.5", "at ee5", "at pre enter 5"];
const isValidInGoldorTunnel = () => !lastLocation.InGoldorTunnel && currentGoldorPhase === 4;
// At Mid
const validAtMidMsg = ["at mid", "in mid"];
const isValidAtMid = () => !lastLocation.AtMid && isInBoss("Necron");
//At i4 Entry
const validAti4EntryMsg = ["i4 entry"];
const isValidAti4Entry = playerInfo => !lastLocation.Ati4Entry && isInBoss("Storm") && playerInfo.className === "Healer";
// At P5
const validAtP5Msg = ["at p5", "in p5"];
const isValidAtP5 = () => !lastLocation.AtP5 && isInBoss("Necron");

function playSound() {
  let count = 0;
  const playNext = () => {
    if (count >= 120) return;
    World.playSound("note.harp", 0.7, 1.6);
    count++;
    setTimeout(playNext, 3);
  };
  playNext();
};

function showTitle(text) {
  const overlay = register("renderOverlay", () => {
    const scale = 1.7;
    const screenWidth = Renderer.screen.getWidth();
    const screenHeight = Renderer.screen.getHeight();
    const yPos = screenHeight * 0.25;
    Renderer.translate(screenWidth / 2, yPos);
    Renderer.scale(scale, scale);
    Renderer.drawStringWithShadow(
      text,
      -Renderer.getStringWidth(text) / 2,
      0
    );
  });
  playSound();
  setTimeout(() => overlay.unregister(), 2000);
};

function showAlert(playerName, playerInfo, text) {
  ChatLib.chat(`${PREFIX} ${playerInfo.color}${playerName} (${playerInfo.className[0]}) &e${text}`);
  showTitle(`${playerInfo.color}${playerName} (${playerInfo.className[0]}) &e${text}`);
}

function isPlayerInArea(x1, x2, y1, y2, z1, z2, entity = Player) {
  const x = entity.getX();
  const y = entity.getY();
  const z = entity.getZ();
  return (
    x >= Math.min(x1, x2) && x <= Math.max(x1, x2) &&
    y >= Math.min(y1, y2) && y <= Math.max(y1, y2) &&
    z >= Math.min(z1, z2) && z <= Math.max(z1, z2)
  );
};

function getClassOf(name) {
  const foundLine = TabList.getNames().find(line =>
    line.removeFormatting().includes(name)
  );
  if (!foundLine) return { color: "&f", className: "?" };

  const match = foundLine.removeFormatting().match(tablistClassRegex);
  if (!match) return { color: "&f", className: "?" };

  const className = match[2];
  return { color: ClassColor[className] || "&f", className };
};

function isInBoss(boss) {
  const bossName = BossStatus.field_82827_c;
  if (!bossName) return false;
  return bossName.removeFormatting().includes(boss);
}

register("chat", message => {
  if (message === "[BOSS] Storm: I should have known that I stood no chance.") currentGoldorPhase = 1;
  if ((message.includes("(7/7)") || message.includes("(8/8)")) && !message.includes(":")) currentGoldorPhase += 1;
}).setCriteria("${message}");

register("tick", () => {
  if (!World.isLoaded) return;
  if (!config.toggled) return;

  World.getAllPlayers().forEach(entity => {
    if (entity.getPing() !== 1) return; // Skip non-player entities
    const playerName = entity.getName();
    if (playerName === Player.getName()) return; // Skip us
    const playerInfo = getClassOf(playerName);
    if (!playerInfo.className) return; // not in dungeon

    if (entity.getY() < 205 && entity.getY() > 164 && !lastLocation.AtP2 && isInBoss("Maxor") && playerInfo.className !== "Healer") {
      lastLocation.AtP2 = true;
      showAlert(playerName, playerInfo, "At P2!");
    }
    if (isPlayerInArea(106, 110, 118, 122, 92, 96, entity) && !lastLocation.AtSS && (isInBoss("Storm") || isInBoss("Goldor"))) {
      lastLocation.AtSS = true;
      showAlert(playerName, playerInfo, "At SS!");
    }
    if (isPlayerInArea(49, 58, 108, 115, 129, 133, entity) && !lastLocation.AtEE2 && currentGoldorPhase === 1) {
      lastLocation.AtEE2 = true;
      showAlert(playerName, playerInfo, "At Pre Enter 2!");
    }
    if (isPlayerInArea(0, 4, 108, 115, 98, 107, entity) && !lastLocation.AtEE3 && currentGoldorPhase === 2) {
      lastLocation.AtEE3 = true;
      showAlert(playerName, playerInfo, "At Pre Enter 3!");
    }
    if (isPlayerInArea(52, 56, 113, 117, 49, 53, entity) && !lastLocation.AtCore && (currentGoldorPhase === 2 || currentGoldorPhase === 3)) {
      lastLocation.AtCore = true;
      showAlert(playerName, playerInfo, "At Core!");
    }
    if (isPlayerInArea(41, 68, 110, 150, 59, 117, entity) && !lastLocation.InGoldorTunnel && currentGoldorPhase === 4) {
      lastLocation.InGoldorTunnel = true;
      showAlert(playerName, playerInfo, "Inside Goldor Tunnel");
    }
    if (isPlayerInArea(47, 61, 64, 75, 69, 83, entity) && !lastLocation.AtMid && isInBoss("Necron")) {
      lastLocation.AtMid = true;
      showAlert(playerName, playerInfo, "At Mid!");
    }
    if (entity.getY() < 50 && entity.getY() > 4 && !lastLocation.AtP5 && isInBoss("Necron")) {
      lastLocation.AtP5 = true;
      showAlert(playerName, playerInfo, "At P5!");
    }
    if (isPlayerInArea(91, 93, 129, 133, 44, 46, entity) && !lastLocation.Ati4Entry && isInBoss("Storm") && playerInfo.className !== "Healer") {
      lastLocation.Ati4Entry = true;
      showAlert(playerName, playerInfo, "At i4 Entry!");
    }
  });
});

register("chat", (player, message) => {
  const name = player.replace(/\[.*?\]\s*/, ""); // remove rank
  if (name === Player.getName()) return; // skip us
  let msg = message.toLocaleLowerCase();

  const playerInfo = getClassOf(name);

  if (isValidP2(playerInfo) && validP2Msg.some(term => msg.includes(term))) {
    lastLocation.AtP2 = true;
    showAlert(name, playerInfo, "At P2!");
  }
  if (isValidAtSS() && validAtSSMsg.some(term => msg.includes(term))) {
    lastLocation.AtSS = true;
    showAlert(name, playerInfo, "At SS!");
  }
  if (isValidEE2() && validEE2Msg.some(term => msg.includes(term))) {
    lastLocation.AtEE2 = true;
    showAlert(name, playerInfo, "At Pre Enter 2!");
  }
  if (isValidEE3() && validEE3Msg.some(term => msg.includes(term))) {
    lastLocation.AtEE3 = true;
    showAlert(name, playerInfo, "At Pre Enter 3!");
  }
  if (isValidAtCore() && validAtCoreMsg.some(term => msg.includes(term))) {
    lastLocation.AtCore = true;
    showAlert(name, playerInfo, "At Core!");
  }
  if (isValidInGoldorTunnel() && validInGoldorTunnelMsg.some(term => msg.includes(term))) {
    lastLocation.InGoldorTunnel = true;
    showAlert(name, playerInfo, "Inside Goldor Tunnel!");
  }
  if (isValidAtMid() && validAtMidMsg.some(term => msg.includes(term))) {
    lastLocation.AtMid = true;
    showAlert(name, playerInfo, "At Mid!");
  }
  if (isValidAti4Entry(playerInfo) && validAti4EntryMsg.some(term => msg.includes(term))) {
    lastLocation.Ati4Entry = true;
    showAlert(name, playerInfo, "At i4 Entry!");
  }
  if (isValidAtP5() && validAtP5Msg.some(term => msg.includes(term))) {
    lastLocation.AtP5 = true;
    showAlert(name, playerInfo, "At P5!");
  }
}).setCriteria("Party > ${player}: ${message}");

register("command", () => config.openGUI())
  .setName("PositionalTitles")
  .setAliases(["PositionalTitle", "PosTitles", "PosTitle", "PTitles", "PTitle"]);

register("worldUnload", () => {
  currentGoldorPhase = 0;
  Object.keys(lastLocation).forEach(key => lastLocation[key] = false);
});