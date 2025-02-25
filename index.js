import config from "./config";

const BossStatus = Java.type("net.minecraft.entity.boss.BossStatus");
const PREFIX = "&8[&6PT&8]&r";

let currentGoldorPhase = 0;
let lastLocation = null;

const ClassColor = {
  Healer: "&d",
  Tank: "&a",
  Mage: "&b",
  Berserk: "&6",
  Archer: "&c"
};

const playSound = () => {
  let count = 0;
  const playNext = () => {
    if (count >= 120) return;
    World.playSound("note.harp", 0.7, 1.6);
    count++;
    setTimeout(playNext, 3);
  };
  playNext();
};

const showTitle = text => {
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

const isPlayerInArea = (entity, x1, x2, y1, y2, z1, z2) => {
  const x = entity.getX();
  const y = entity.getY();
  const z = entity.getZ();
  return (
    x >= Math.min(x1, x2) && x <= Math.max(x1, x2) &&
    y >= Math.min(y1, y2) && y <= Math.max(y1, y2) &&
    z >= Math.min(z1, z2) && z <= Math.max(z1, z2)
  );
};

const tablistRegex = /\[(?:.+)\] (.+) \((Berserk|Archer|Mage|Tank|Healer) ([a-zA-Z]+)\)/;

const getClassOf = name => {
  const foundLine = TabList.getNames().find(line =>
    line.removeFormatting().includes(name)
  );
  if (!foundLine) return { color: "&f", className: "?" };

  const match = foundLine.removeFormatting().match(tablistRegex);
  if (!match) return { color: "&f", className: "?" };

  const className = match[2];
  return { color: ClassColor[className] || "&f", className };
};

const getIsInGoldor = () => {
  const bossName = BossStatus.field_82827_c;
  return bossName ? bossName.removeFormatting().includes("Goldor") : false;
};

register("chat", message => {
  if (message === "[BOSS] Storm: I should have known that I stood no chance.")
    currentGoldorPhase = 1;
  if ((message.includes("(7/7)") || message.includes("(8/8)")) && !message.includes(":"))
    currentGoldorPhase += 1;
}).setCriteria("${message}");

const zones = [
  {
    name: "At SS",
    phaseCondition: phase => phase === 0,
    coords: [106, 110, 118, 122, 92, 96],
    formatMessage: (playerName, playerInfo) =>
      `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eAt SS!`
  },
  {
    name: "At EE2",
    phaseCondition: phase => phase === 1,
    coords: [52, 56, 107, 111, 129, 133],
    formatMessage: (playerName, playerInfo) =>
      `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eAt EE2!`
  },
  {
    name: "At EE3",
    phaseCondition: phase => phase === 2,
    coords: [0, 4, 107, 111, 100, 104],
    formatMessage: (playerName, playerInfo) =>
      `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eAt EE3!`
  },
  {
    name: "At Core",
    phaseCondition: phase => phase >= 2,
    coords: [52, 56, 113, 117, 49, 53],
    formatMessage: (playerName, playerInfo) =>
      `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eAt Core!`
  },
  {
    name: "In Core",
    phaseCondition: phase => phase >= 2,
    coords: [41, 68, 110, 150, 59, 117],
    formatMessage: (playerName, playerInfo) =>
      `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eIn Core!`
  },
  {
    name: "At Mid",
    phaseCondition: phase => phase === 4,
    coords: [47, 61, 58, 72, 69, 83],
    formatMessage: (playerName, playerInfo) =>
      `${playerInfo.color}${playerName} (${playerInfo.className[0]}) &eAt Mid!`
  }
];

register("step", () => {
  if (!World.isLoaded || !config.toggled || getIsInGoldor()) return;

  World.getAllPlayers().forEach(entity => {
    if (
      entity.isInvisible() ||
      entity.getPing() !== 1 ||
      entity.getName() === Player.getName()
    ) return;

    const playerName = entity.getName();
    const playerInfo = getClassOf(playerName);

    zones.forEach(zone => {
      const [x1, x2, y1, y2, z1, z2] = zone.coords;
      if (
        isPlayerInArea(entity, x1, x2, y1, y2, z1, z2) &&
        lastLocation !== zone.name &&
        zone.phaseCondition(currentGoldorPhase)
      ) {
        const message = zone.formatMessage(playerName, playerInfo);
        ChatLib.chat(`${PREFIX} ${message}`);
        showTitle(message);
        lastLocation = zone.name;
      }
    });
  });
}).setFps(5);

register("command", () => config.openGUI())
  .setName("PositionalTitles")
  .setAliases(["PosTitles", "PTitles", "PT"]);

register("worldUnload", () => {
  currentGoldorPhase = 0;
  lastLocation = null;
});

///// DEBUG /////
register("command", () => {
  currentGoldorPhase += 1;
  ChatLib.chat(`${PREFIX} currentGoldorPhase now: ${currentGoldorPhase}`);
}).setName("addGoldorPhase");

register("command", () => {
  currentGoldorPhase = 0;
  ChatLib.chat(`${PREFIX} currentGoldorPhase now: ${currentGoldorPhase}`);
}).setName("resetGoldorPhase");

register("command", () => {
  const info = getClassOf(Player.getName());
  ChatLib.chat(`${PREFIX} Class: ${info.color}${info.className}`);
}).setName("playerClass");

register("command", () => showTitle("test"))
  .setName("testTitle");
