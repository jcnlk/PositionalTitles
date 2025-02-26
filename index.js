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
  InCore: false,
  AtMid: false
}

const ClassColor = {
  Healer: "&d",
  Tank: "&a",
  Mage: "&b",
  Berserk: "&c",
  Archer: "&6"
};

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

function showAlert(text) {
  ChatLib.chat(`${PREFIX} ` + text)
  showTitle(text);
}

function isPlayerInArea(x1, x2, y1, y2, z1, z2, entity = Player.getPlayer()) {
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

function getIsInMaxor() {
  const bossName = BossStatus.field_82827_c;
  if (!bossName) return false;
  return bossName.removeFormatting().includes("Maxor");
}

function getIsInStorm() {
  const bossName = BossStatus.field_82827_c;
  if (!bossName) return false;
  return bossName.removeFormatting().includes("Storm");
}

function getIsInGoldor() {
  const bossName = BossStatus.field_82827_c;
  if (!bossName) return false;
  return bossName.removeFormatting().includes("Goldor");
}

function getIsInNecron() {
  const bossName = BossStatus.field_82827_c;
  if (!bossName) return false;
  return bossName.removeFormatting().includes("Necron");
}

register("chat", message => {
  if (message === "[BOSS] Storm: I should have known that I stood no chance.") currentGoldorPhase = 1;
  if ((message.includes("(7/7)") || message.includes("(8/8)")) && !message.includes(":")) currentGoldorPhase += 1;
}).setCriteria("${message}");

register("step", () => {
  if (!World.isLoaded || !config.toggled) return;

  World.getAllPlayers().forEach(entity => {
    if (entity.isInvisible() || entity.getPing() !== 1 || entity.getName() === Player.getName()) return;

    const playerName = entity.getName();
    const playerInfo = getClassOf(playerName);
    const isInMaxor = getIsInMaxor();
    const isInStorm = getIsInStorm();
    const isInGoldor = getIsInGoldor();
    const isInNecron = getIsInNecron();

    if (entity.getY() < 205 && entity.getY() > 164 && !lastLocation.AtP2 && isInMaxor && playerInfo.className !== "Healer") {
      const message = `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eAt P2!`;
      lastLocation.AtP2 = true;
      showAlert(message);
    }
    if (isPlayerInArea(106, 110, 118, 122, 92, 96, entity) && !lastLocation.AtSS && (isInStorm || isInGoldor)) {
      const message = `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eAt SS!`;
      lastLocation.AtSS = true;
      showAlert(message);
    }
    if (isPlayerInArea(52, 56, 107, 111, 129, 133, entity) && !lastLocation.AtEE2 && currentGoldorPhase === 1 && isInGoldor) {
      const message = `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eAt EE2!`;
      lastLocation.AtEE2 = true;
      showAlert(message);
    }
    if (isPlayerInArea(0, 4, 107, 111, 100, 104, entity) && !lastLocation.AtEE3&& currentGoldorPhase === 2 && isInGoldor) {
      const message = `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eAt EE3!`;
      lastLocation.AtEE3 = true;
      showAlert(message);
    }
    if (isPlayerInArea(52, 56, 113, 117, 49, 53, entity) && !lastLocation.AtCore && (currentGoldorPhase === 2 || currentGoldorPhase === 3) && isInGoldor) {
      const message = `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eAt Core!`;
      lastLocation.AtCore = true;
      showAlert(message);
    }
    if (isPlayerInArea(41, 68, 110, 150, 59, 117, entity) && !lastLocation.InCore && currentGoldorPhase === 4 && isInGoldor) {
      const message = `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eIn Core!`;
      lastLocation.InCore = true;
      showAlert(message);
    }
    if (isPlayerInArea(47, 61, 58, 72, 69, 83, entity) && !lastLocation.AtMid && (isInNecron)) {
      const message = `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eAt Mid!`;
      lastLocation.AtMid = true;
      showAlert(message);
    }
  });
}).setFps(3);

register("command", () => config.openGUI())
  .setName("PositionalTitles")
  .setAliases(["PositionalTitle", "PosTitles", "PosTitle", "PTitles", "PTitle"]);

register("worldUnload", () => {
  currentGoldorPhase = 0;
  Object.keys(lastLocation).forEach(key => lastLocation[key] = false);
});