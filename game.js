"use strict";

const WORLD = { width: 960, height: 540 };
const RING = { left: 132, right: 828, top: 168, bottom: 450 };
const ROUND_LENGTH = 90;
const MIN_FIGHTER_SPACE = 74;
const PEER_PREFIX = "lobby-boxing-";
const PLAYER_GUARD_DRAIN = 8;
const AI_GUARD_DRAIN = 4.8;
const AI_GUARD_STAMINA_FLOOR = 20;
const WORLD_RESULT_LOCK_MS = 1000;
const MAX_PARTICLES = 180;
const SETTINGS_KEY = "ringsideLastBellSettingsV1";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  openBtn: document.getElementById("openBtn"),
  aiBtn: document.getElementById("aiBtn"),
  localBtn: document.getElementById("localBtn"),
  hostBtn: document.getElementById("hostBtn"),
  leaveBtn: document.getElementById("leaveBtn"),
  joinBtn: document.getElementById("joinBtn"),
  copyBtn: document.getElementById("copyBtn"),
  startBtn: document.getElementById("startBtn"),
  restartBtn: document.getElementById("restartBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  toggleHelpBtn: document.getElementById("toggleHelpBtn"),
  showHelpBtn: document.getElementById("showHelpBtn"),
  tutorialPanel: document.getElementById("tutorialPanel"),
  tutorialBody: document.getElementById("tutorialBody"),
  joinCode: document.getElementById("joinCode"),
  lobbyCode: document.getElementById("lobbyCode"),
  styleSelect: document.getElementById("styleSelect"),
  stylePreview: document.getElementById("stylePreview"),
  difficultySelect: document.getElementById("difficultySelect"),
  muteToggle: document.getElementById("muteToggle"),
  motionToggle: document.getElementById("motionToggle"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  worldCard: document.getElementById("worldCard"),
  worldAreaText: document.getElementById("worldAreaText"),
  worldLevelText: document.getElementById("worldLevelText"),
  worldXpText: document.getElementById("worldXpText"),
  worldXpBar: document.getElementById("worldXpBar"),
  worldMoneyText: document.getElementById("worldMoneyText"),
  worldSkillText: document.getElementById("worldSkillText"),
  worldObjectiveText: document.getElementById("worldObjectiveText"),
  worldPromptText: document.getElementById("worldPromptText"),
  worldUpgradeBtn: document.getElementById("worldUpgradeBtn"),
  worldSaveBtn: document.getElementById("worldSaveBtn"),
  worldExitBtn: document.getElementById("worldExitBtn"),
  saveSlotSelect: document.getElementById("saveSlotSelect"),
  newGameBtn: document.getElementById("newGameBtn"),
  resetSaveBtn: document.getElementById("resetSaveBtn"),
  upgradePanel: document.getElementById("upgradePanel"),
  upgradeList: document.getElementById("upgradeList"),
  statusLabel: document.getElementById("statusLabel"),
  localName: document.getElementById("localName"),
  modeText: document.getElementById("modeText"),
  healthText: document.getElementById("healthText"),
  bodyText: document.getElementById("bodyText"),
  blockText: document.getElementById("blockText"),
  staminaText: document.getElementById("staminaText"),
  healthBar: document.getElementById("healthBar"),
  bodyBar: document.getElementById("bodyBar"),
  blockBar: document.getElementById("blockBar"),
  staminaBar: document.getElementById("staminaBar"),
  roleText: document.getElementById("roleText"),
  comboText: document.getElementById("comboText"),
  enemyText: document.getElementById("enemyText"),
  styleText: document.getElementById("styleText"),
  momentumText: document.getElementById("momentumText"),
  clockText: document.getElementById("clockText"),
  feed: document.getElementById("feed"),
};

const ARCHETYPES = {
  balanced: {
    label: "Balanced",
    head: 100,
    body: 118,
    stamina: 100,
    block: 80,
    power: 6,
    speed: 6,
    reach: 1,
    recovery: 1,
    counterBonus: 1.42,
    toughness: 1,
  },
  boxer: {
    label: "Out Boxer",
    head: 92,
    body: 110,
    stamina: 112,
    block: 72,
    power: 5.2,
    speed: 8.4,
    reach: 1.12,
    recovery: 1.18,
    counterBonus: 1.46,
    toughness: 0.95,
  },
  brawler: {
    label: "Brawler",
    head: 104,
    body: 116,
    stamina: 92,
    block: 76,
    power: 8.8,
    speed: 5,
    reach: 0.96,
    recovery: 0.9,
    counterBonus: 1.38,
    toughness: 1.05,
  },
  tank: {
    label: "Pressure Tank",
    head: 118,
    body: 132,
    stamina: 88,
    block: 100,
    power: 7,
    speed: 4.4,
    reach: 0.94,
    recovery: 0.82,
    counterBonus: 1.3,
    toughness: 1.2,
  },
  counter: {
    label: "Counter Specialist",
    head: 96,
    body: 112,
    stamina: 104,
    block: 86,
    power: 6.4,
    speed: 7.2,
    reach: 1.04,
    recovery: 1.1,
    counterBonus: 1.68,
    toughness: 0.98,
  },
};

const AI_STYLES = ["balanced", "boxer", "brawler", "tank", "counter"];
const STYLE_DESCRIPTIONS = {
  balanced: "Average stats. Good for learning spacing, blocking, and basic combos.",
  boxer: "Speed, reach, and stamina. Lower durability, so stay outside and jab.",
  brawler: "High power. Slower and more stamina-hungry, but scary up close.",
  tank: "Durable with strong block. Slow speed and recovery, built for pressure.",
  counter: "Strong counter damage and recovery. Best when slipping and punishing.",
};
const AI_DIFFICULTY = {
  easy: { label: "Easy", attack: 0.78, guard: 0.5, slip: 0.3, reaction: 1.18, punish: 0.7, spacing: 0.9 },
  normal: { label: "Normal", attack: 1.25, guard: 1.05, slip: 1.05, reaction: 0.82, punish: 1.18, spacing: 1 },
  hard: { label: "Hard", attack: 1.72, guard: 1.45, slip: 1.75, reaction: 0.62, punish: 1.8, spacing: 1.08 },
};
const INPUT_BUFFER = 0.15;
const MAX_REMOTE_ATTACKS = 3;
const WORLD_SAVE_KEY = "ringsideLastBellSaveV1";
const WORLD_SAVE_SLOT_KEY = "ringsideLastBellActiveSlotV1";
const WORLD_SAVE_SLOTS = ["slot1", "slot2", "slot3"];
const WORLD_STATS = [
  ["power", "Power"],
  ["speed", "Speed"],
  ["defence", "Defence"],
  ["endurance", "Endurance"],
  ["chin", "Chin"],
  ["body", "Body Toughness"],
  ["technique", "Technique"],
];
const WORLD_ASSETS = {
  gym: "assets/rustbell-gym.png",
  oldtown: "assets/oldtown-streets.png",
  dockyard: "assets/dockyard.png",
  market: "assets/neon-market.png",
  underground: "assets/dockyard.png",
  stadium: "assets/neon-market.png",
  portraits: "assets/portrait-sheet.png",
  chapter1Portraits: "assets/chapter1-portraits.png",
  chapter2Portraits: "assets/chapter2-portraits.png",
  chapter3Portraits: "assets/chapter3-portraits.png",
};
const PUNCH_SLOTS = {
  light: { action: "jab", key: "J", label: "Light" },
  power: { action: "hook", key: "K", label: "Power" },
  body: { action: "body", key: "U", label: "Body" },
};
const PUNCH_MOVES = {
  jab: {
    id: "jab",
    name: "Jab",
    short: "Jab",
    slot: "light",
    attackClass: "jab",
    target: "head",
    stamina: 14,
    fatigue: 1.6,
    damage: (power) => 7 + power * 1.15,
    range: 104,
    duration: 0.24,
    hitAt: 0.12,
    cooldown: 0.28,
    knockback: 12,
    staminaDamage: (power) => 2 + power * 0.12,
    blockDamage: (power) => 8 + power * 0.45,
  },
  doubleJab: {
    id: "doubleJab",
    name: "Double Jab",
    short: "2-Jab",
    slot: "light",
    attackClass: "jab",
    target: "head",
    stamina: 20,
    fatigue: 2.15,
    damage: (power) => 7.8 + power * 1.05,
    range: 108,
    duration: 0.3,
    hitAt: 0.12,
    cooldown: 0.32,
    knockback: 10,
    staminaDamage: (power) => 2.5 + power * 0.12,
    blockDamage: (power) => 9 + power * 0.42,
    extraHit: 0.45,
  },
  checkHook: {
    id: "checkHook",
    name: "Check Hook",
    short: "Chk Hook",
    slot: "light",
    attackClass: "hook",
    target: "head",
    stamina: 24,
    fatigue: 2.9,
    damage: (power) => 9 + power * 1.28,
    range: 88,
    duration: 0.32,
    hitAt: 0.17,
    cooldown: 0.42,
    knockback: 18,
    staminaDamage: (power) => 4 + power * 0.14,
    blockDamage: (power) => 14 + power * 0.55,
    counterDamage: 1.28,
  },
  cross: {
    id: "cross",
    name: "Cross",
    short: "Cross",
    slot: "power",
    attackClass: "jab",
    target: "head",
    stamina: 24,
    fatigue: 3.2,
    damage: (power) => 11 + power * 1.45,
    range: 112,
    duration: 0.34,
    hitAt: 0.17,
    cooldown: 0.43,
    knockback: 17,
    staminaDamage: (power) => 4 + power * 0.16,
    blockDamage: (power) => 13 + power * 0.62,
  },
  hook: {
    id: "hook",
    name: "Hook",
    short: "Hook",
    slot: "power",
    attackClass: "hook",
    target: "head",
    stamina: 32,
    fatigue: 5,
    damage: (power) => 13 + power * 1.75,
    range: 86,
    duration: 0.42,
    hitAt: 0.23,
    cooldown: 0.58,
    knockback: 22,
    staminaDamage: (power) => 5 + power * 0.22,
    blockDamage: (power) => 18 + power * 0.9,
    missVulnerable: 0.5,
  },
  uppercut: {
    id: "uppercut",
    name: "Uppercut",
    short: "Upper",
    slot: "power",
    attackClass: "hook",
    target: "head",
    stamina: 34,
    fatigue: 4.7,
    damage: (power) => 12 + power * 1.65,
    range: 72,
    duration: 0.38,
    hitAt: 0.21,
    cooldown: 0.56,
    knockback: 13,
    staminaDamage: (power) => 4 + power * 0.18,
    blockDamage: (power) => 22 + power * 1,
    stunBonus: 0.2,
    missVulnerable: 0.42,
  },
  overhand: {
    id: "overhand",
    name: "Overhand",
    short: "Overhand",
    slot: "power",
    attackClass: "hook",
    target: "head",
    stamina: 42,
    fatigue: 6.7,
    damage: (power) => 17 + power * 2.05,
    range: 92,
    duration: 0.56,
    hitAt: 0.33,
    cooldown: 0.78,
    knockback: 30,
    staminaDamage: (power) => 7 + power * 0.26,
    blockDamage: (power) => 26 + power * 1.05,
    missVulnerable: 0.78,
  },
  body: {
    id: "body",
    name: "Body Shot",
    short: "Body",
    slot: "body",
    attackClass: "body",
    target: "body",
    stamina: 22,
    fatigue: 3.4,
    damage: (power) => 8 + power * 1.18,
    range: 78,
    duration: 0.36,
    hitAt: 0.19,
    cooldown: 0.45,
    knockback: 14,
    staminaDamage: (power) => 10 + power * 0.32,
    blockDamage: (power) => 13 + power * 0.7,
    capDamage: 1.7,
  },
  liverShot: {
    id: "liverShot",
    name: "Liver Shot",
    short: "Liver",
    slot: "body",
    attackClass: "body",
    target: "body",
    stamina: 30,
    fatigue: 4.8,
    damage: (power) => 10 + power * 1.35,
    range: 72,
    duration: 0.42,
    hitAt: 0.23,
    cooldown: 0.58,
    knockback: 11,
    staminaDamage: (power) => 18 + power * 0.42,
    blockDamage: (power) => 15 + power * 0.72,
    capDamage: 3.4,
    stunBonus: 0.14,
    missVulnerable: 0.28,
  },
  shovelHook: {
    id: "shovelHook",
    name: "Shovel Hook",
    short: "Shovel",
    slot: "body",
    attackClass: "hook",
    target: "body",
    stamina: 28,
    fatigue: 4.1,
    damage: (power) => 11 + power * 1.48,
    range: 76,
    duration: 0.4,
    hitAt: 0.22,
    cooldown: 0.55,
    knockback: 16,
    staminaDamage: (power) => 12 + power * 0.28,
    blockDamage: (power) => 20 + power * 0.9,
    capDamage: 2.2,
    counterDamage: 1.12,
    missVulnerable: 0.44,
  },
};
const WORLD_SKILLS = [
  { id: "doubleJab", move: "doubleJab", tree: "Speed Boxer", name: "Double Jab", cost: 1, effect: "Equip on J. Fast two-touch jab that chips through guards and starts combos." },
  { id: "cross", move: "cross", tree: "Speed Boxer", name: "Cross", cost: 1, effect: "Equip on K. Straighter than a hook, longer reach, safer for out-boxing." },
  { id: "uppercut", move: "uppercut", tree: "Power Brawler", name: "Uppercut", cost: 1, effect: "Equip on K. Short-range guard breaker with extra stun." },
  { id: "liverShot", move: "liverShot", tree: "Body Hunter", name: "Liver Shot", cost: 1, effect: "Equip on U. Heavy stamina-cap damage if you get inside." },
  { id: "checkHook", move: "checkHook", tree: "Defensive Counter", name: "Check Hook", cost: 1, effect: "Equip on J. Strong counter punch when enemies rush or whiff." },
  { id: "overhand", move: "overhand", tree: "Power Brawler", name: "Overhand", cost: 2, effect: "Equip on K. Huge shot, huge risk if it misses." },
  { id: "shovelHook", move: "shovelHook", tree: "Body Hunter", name: "Shovel Hook", cost: 1, effect: "Equip on U. A rising body hook that cracks guards but is risky on a whiff." },
];

const BOSS_MECHANICS = {
  brick: {
    init(actor) {
      actor.bossState = { fightId: actor.bossState?.fightId, cooldown: randomBetween(8, 12), windup: 0, warned: false };
      pushFeed("Boss tip: Slip Mason's loaded overhand. Blocking it hurts badly.");
    },
    update(actor, target, dt) {
      const state = actor.bossState;
      if (!state || actor.stunned > 0) return true;
      if (state.windup > 0) {
        state.windup -= dt;
        actor.guard = false;
        actor.aiMove = "guard";
        actor.facing = target.x >= actor.x ? 1 : -1;
        if (state.windup <= 0 && !actor.attack) {
          state.brickSpecial = true;
          if (!startAttack(actor, "overhand")) state.cooldown = 1.2;
        }
        return false;
      }
      state.cooldown -= dt;
      if (state.cooldown <= 0 && !actor.attack && actor.attackCooldown <= 0) {
        state.windup = 0.85;
        state.cooldown = randomBetween(8, 12);
        addFloater(actor.x, actor.y - 158, "BRICK IS LOADING UP", "#fff0a8");
        pushFeed("Mason loads a fight-ending overhand.");
        addShake(3);
        return false;
      }
      return true;
    },
    beforeAttack(actor, target, attack) {
      if (!actor.bossState?.brickSpecial || attack.type !== "overhand") return;
      attack.bossSpecial = "brickOverhand";
      attack.name = "Brick Overhand";
      attack.short = "Brick";
      attack.damage *= 1.42;
      attack.blockDamage *= 1.75;
      attack.staminaDamage += 12;
      attack.range += 8;
      attack.duration *= 1.15;
      attack.hitAt *= 1.08;
      attack.missVulnerable = 1.05;
    },
    beforeDamage(actor, target, attack, info) {
      if (attack.bossSpecial !== "brickOverhand") return;
      if (ringPressure(target).ropes) info.damage *= 1.16;
      if (!info.blocked) info.damage *= 1.18;
    },
    afterHit(actor, target, attack, info) {
      if (attack.bossSpecial !== "brickOverhand") return;
      if (info.blocked) {
        target.block = Math.max(0, target.block - 18);
        target.stamina = Math.max(0, target.stamina - 18);
        target.stunned = Math.max(target.stunned, 0.24);
        addFloater(target.x, target.y - 142, "BLOCK CRUSHED", "#f26b55");
      }
    },
    afterAttack(actor, target, attack) {
      if (attack.bossSpecial === "brickOverhand" && !attack.landed) {
        actor.vulnerable = Math.max(actor.vulnerable, 1.05);
        addFloater(actor.x, actor.y - 144, "MASON WHIFFED", "#79d1a2");
        pushFeed("Mason missed the Brick Overhand. Punish him now.");
      }
    },
    getHudText(actor) {
      if (actor.bossState?.windup > 0) return "Mason: loaded overhand incoming";
      return "Mason: slip the loaded overhand";
    },
    draw(actor) {
      if (!actor.bossState?.windup) return;
      ctx.save();
      ctx.strokeStyle = "#fff0a8";
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.55 + Math.sin(performance.now() / 70) * 0.18;
      ctx.beginPath();
      ctx.ellipse(actor.x, actor.y - 72, 58, 88, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
  },
  needle: {
    init(actor) {
      actor.bossState = { fightId: actor.bossState?.fightId, marks: 0, warnedCross: false };
      pushFeed("Boss tip: Sofia's jabs add Needle Marks. Body shots remove marks.");
    },
    beforeAttack(actor, target, attack) {
      const state = actor.bossState;
      if (!state || attack.type !== "cross" || state.marks < 3) return;
      attack.bossSpecial = "needleCross";
      attack.name = "Needle Cross";
      attack.short = "Needle";
      attack.damage *= 1.32;
      attack.staminaDamage += 14;
      attack.blockDamage *= 1.25;
      state.warnedCross = true;
      addFloater(actor.x, actor.y - 152, "NEEDLE CROSS", "#fff0a8");
      pushFeed("Sofia has three marks. The next cross is empowered.");
    },
    afterHit(actor, target, attack, info) {
      const state = actor.bossState;
      if (!state || info.blocked) return;
      if (attack.bossSpecial === "needleCross") {
        state.marks = 0;
        state.warnedCross = false;
        addFloater(target.x, target.y - 138, "MARKS RESET", "#9eb7ff");
        return;
      }
      if (["jab", "doubleJab", "cross"].includes(attack.type)) {
        const add = attack.type === "doubleJab" ? 2 : 1;
        const before = state.marks;
        state.marks = clamp(state.marks + add, 0, 3);
        addFloater(target.x, target.y - 132, `NEEDLE MARK ${state.marks}`, "#fff0a8");
        if (state.marks >= 3 && before < 3) pushFeed("Needle Cross is ready. Body shot Sofia to remove a mark.");
      }
    },
    afterTargetHit(actor, target, attack, info) {
      const state = actor.bossState;
      if (!state || info.blocked || attack.target !== "body" || state.marks <= 0) return;
      state.marks = Math.max(0, state.marks - 1);
      addFloater(actor.x, actor.y - 142, "MARK REMOVED", "#79d1a2");
      pushFeed("Body shot breaks Sofia's rhythm.");
    },
    getHudText(actor) {
      return `Sofia: Needle Marks ${actor.bossState?.marks || 0}/3`;
    },
    draw(actor, target) {
      const marks = actor.bossState?.marks || 0;
      if (!marks) return;
      ctx.save();
      ctx.fillStyle = "#fff0a8";
      for (let i = 0; i < marks; i += 1) {
        ctx.beginPath();
        ctx.arc(target.x - 18 + i * 18, target.y - 146, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  },
  pressure: {
    init(actor) {
      actor.bossState = { fightId: actor.bossState?.fightId, pressureBurst: 0, ropeWarn: 0, phaseBurstDone: false };
      pushFeed("Boss tip: Nero is stronger on the ropes. Body shots and counters break pressure.");
    },
    update(actor, target, dt) {
      const state = actor.bossState;
      if (!state) return true;
      state.pressureBurst = Math.max(0, state.pressureBurst - dt);
      state.ropeWarn = Math.max(0, state.ropeWarn - dt);
      if (ringPressure(target).ropes && state.ropeWarn <= 0) {
        addFloater(target.x, target.y - 132, "ROPE PRESSURE", "#f26b55");
        state.ropeWarn = 1.8;
      }
      return true;
    },
    onPhaseChange(actor, oldPhase, newPhase) {
      if (newPhase !== 2 || actor.bossState?.phaseBurstDone) return;
      actor.bossState.pressureBurst = 5;
      actor.bossState.phaseBurstDone = true;
      addFloater(actor.x, actor.y - 158, "NERO CUTS OFF THE RING", "#f26b55");
      pushFeed("Nero starts cutting off the ring. Counter or body-shot to break pressure.");
    },
    beforeDamage(actor, target, attack, info) {
      if (attack.target !== "body") return;
      const pressure = ringPressure(target);
      if (pressure.ropes) info.damage *= 1.1;
      if (pressure.cornered && ["shovelHook", "liverShot"].includes(attack.type)) {
        info.damage *= 1.18;
        info.extraCapDamage = (info.extraCapDamage || 0) + 1.2;
      }
    },
    afterHit(actor, target, attack, info) {
      if (info.blocked || attack.target !== "body") return;
      const pressure = ringPressure(target);
      if (!pressure.ropes) return;
      target.stamina = Math.max(0, target.stamina - 8);
      target.staminaCap = Math.max(target.maxStamina * 0.35, target.staminaCap - (pressure.cornered ? 1.3 : 0.6));
    },
    afterTargetHit(actor, target, attack, info) {
      const state = actor.bossState;
      if (!state?.pressureBurst || info.blocked) return;
      if (info.counterHit || attack.target === "body") {
        state.pressureBurst = Math.max(0, state.pressureBurst - 3.4);
        addFloater(actor.x, actor.y - 144, "PRESSURE BROKEN", "#79d1a2");
        pushFeed("You broke Nero's pressure burst.");
      }
    },
    getHudText(actor) {
      return actor.bossState?.pressureBurst > 0 ? "Nero: pressure burst active" : "Nero: stay off the ropes";
    },
  },
  counter: {
    init(actor) {
      if (actor.bossState?.fightId === "crown-enforcer") {
        actor.bossState = { fightId: "crown-enforcer", bellHealth: 100, smashCooldown: 4.2, goingBell: false, smashWindup: 0, bellX: RING.right - 84, bellY: RING.top + 78 };
        pushFeed("Boss tip: Protect the Old Gym Bell. Interrupt Bell Smash before it lands.");
      }
    },
    update(actor, target, dt) {
      const state = actor.bossState;
      if (state?.fightId !== "crown-enforcer") return true;
      if (state.bellHealth <= 0) return false;
      state.smashCooldown = Math.max(0, state.smashCooldown - dt);
      if (!state.goingBell && state.smashCooldown <= 0 && !actor.attack && actor.stunned <= 0) {
        state.goingBell = true;
        state.smashWindup = 0;
        addFloater(actor.x, actor.y - 144, "PROTECT THE BELL", "#fff0a8");
        pushFeed("The Enforcer ignores you and goes for the bell.");
      }
      if (!state.goingBell) return true;
      actor.guard = false;
      const dist = distancePoint(actor.x, actor.y, state.bellX, state.bellY);
      if (state.smashWindup > 0) {
        state.smashWindup -= dt;
        actor.facing = state.bellX >= actor.x ? 1 : -1;
        if (state.smashWindup <= 0) {
          state.bellHealth = Math.max(0, state.bellHealth - 22);
          addFloater(state.bellX, state.bellY - 44, `BELL ${state.bellHealth}%`, "#f26b55");
          pushFeed(`Bell Smash landed. Bell health ${state.bellHealth}%.`);
          addShake(8);
          addFlash(0.12);
          state.goingBell = false;
          state.smashCooldown = 5.4;
          if (state.bellHealth <= 0) finishMatch(actor, "Bell destroyed");
        }
        return false;
      }
      if (dist < 58) {
        state.smashWindup = 1.1;
        addFloater(actor.x, actor.y - 150, "BELL SMASH", "#f26b55");
        return false;
      }
      moveFighter(actor, Math.sign(state.bellX - actor.x), Math.sign(state.bellY - actor.y) * 0.45, dt, 0.72);
      actor.facing = state.bellX >= actor.x ? 1 : -1;
      return false;
    },
    afterTargetHit(actor, target, attack, info) {
      const state = actor.bossState;
      if (state?.fightId !== "crown-enforcer" || !state.goingBell || info.damage <= 0) return;
      state.goingBell = false;
      state.smashWindup = 0;
      state.smashCooldown = 4.6;
      addFloater(actor.x, actor.y - 142, "INTERRUPTED", "#79d1a2");
      pushFeed("Bell Smash interrupted.");
    },
    getHudText(actor) {
      const state = actor.bossState;
      return state?.fightId === "crown-enforcer" ? `Protect the bell: ${Math.ceil(state.bellHealth)}%` : "";
    },
    draw(actor) {
      const state = actor.bossState;
      if (state?.fightId !== "crown-enforcer") return;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
      roundedRect(state.bellX - 52, state.bellY - 86, 104, 54, 8);
      ctx.fill();
      ctx.fillStyle = "#e8b923";
      ctx.beginPath();
      ctx.arc(state.bellX, state.bellY - 58, 17, Math.PI, 0);
      ctx.lineTo(state.bellX + 18, state.bellY - 38);
      ctx.lineTo(state.bellX - 18, state.bellY - 38);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
      roundedRect(state.bellX - 42, state.bellY - 26, 84, 8, 5);
      ctx.fill();
      ctx.fillStyle = state.bellHealth > 35 ? "#79d1a2" : "#f26b55";
      roundedRect(state.bellX - 42, state.bellY - 26, 84 * clamp(state.bellHealth / 100, 0, 1), 8, 5);
      ctx.fill();
      ctx.fillStyle = "#fff7e8";
      ctx.font = "900 11px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`BELL ${Math.ceil(state.bellHealth)}%`, state.bellX, state.bellY - 5);
      ctx.restore();
    },
  },
  darius: {
    init(actor) {
      actor.bossState = { fightId: actor.bossState?.fightId, slots: [], adaptSlot: "", adaptTimer: 0, readCooldown: 0, warningCooldown: 0 };
      pushFeed("Boss tip: Darius reads repeated punches. Mix light, body, and power.");
    },
    update(actor, target, dt) {
      const state = actor.bossState;
      if (!state) return true;
      state.adaptTimer = Math.max(0, state.adaptTimer - dt);
      state.readCooldown = Math.max(0, state.readCooldown - dt);
      state.warningCooldown = Math.max(0, state.warningCooldown - dt);
      if (state.adaptTimer <= 0) state.adaptSlot = "";
      if (state.adaptSlot && target.attack?.slot === state.adaptSlot && target.attack.elapsed < target.attack.hitAt && state.readCooldown <= 0 && actor.slipCooldown <= 0 && Math.random() < 0.48) {
        startSlip(actor, { left: actor.facing > 0, right: actor.facing < 0, up: Math.random() < 0.5, down: false });
        state.readCooldown = 1.25;
        addFloater(actor.x, actor.y - 150, "DARIUS READS YOU", "#fff0a8");
      }
      return true;
    },
    afterAttack(actor, target, attack, info) {
      if (info?.source !== "target") return;
      const state = actor.bossState;
      if (!state || !attack.slot) return;
      state.slots.push(attack.slot);
      state.slots = state.slots.slice(-4);
      const repeats = state.slots.filter((slot) => slot === attack.slot).length;
      if (state.slots.length >= 3 && repeats >= 3 && state.warningCooldown <= 0) {
        state.adaptSlot = attack.slot;
        state.adaptTimer = 4.8;
        state.warningCooldown = 2.2;
        addFloater(target.x, target.y - 152, "STOP REPEATING", "#f26b55");
        pushFeed("Darius has read your pattern. Mix your punches.");
      } else if (new Set(state.slots).size >= 3 && state.adaptSlot) {
        state.adaptSlot = "";
        state.adaptTimer = 0;
        addFloater(actor.x, actor.y - 140, "MIX-UP", "#79d1a2");
      }
    },
    getHudText(actor) {
      return actor.bossState?.adaptSlot ? `Darius read: ${actor.bossState.adaptSlot}` : "Darius: mix your punches";
    },
  },
  champion: {
    init(actor) {
      actor.bossState = { fightId: actor.bossState?.fightId, slots: [], adaptSlot: "", readCooldown: 0, phaseTextShown: 1 };
      pushFeed("Boss tip: Victor changes style each phase. Cut off, survive, then mix up.");
      addFloater(actor.x, actor.y - 158, "PHASE 1: OUT-BOXER", "#9eb7ff");
      pushFeed("Victor tests you from range.");
    },
    update(actor, target, dt) {
      const state = actor.bossState;
      if (!state) return true;
      state.readCooldown = Math.max(0, state.readCooldown - dt);
      if (actor.aiPhase === 3 && state.adaptSlot && target.attack?.slot === state.adaptSlot && target.attack.elapsed < target.attack.hitAt && state.readCooldown <= 0 && actor.slipCooldown <= 0 && Math.random() < 0.38) {
        startSlip(actor, { left: actor.facing > 0, right: actor.facing < 0, up: false, down: true });
        state.readCooldown = 1.2;
        addFloater(actor.x, actor.y - 150, "RUSTBELL READ", "#fff0a8");
      }
      return true;
    },
    onPhaseChange(actor, oldPhase, newPhase) {
      if (newPhase === 2) {
        addFloater(actor.x, actor.y - 158, "PHASE 2: BRAWLER", "#f26b55");
        pushFeed("Victor stops boxing and starts breaking.");
        addShake(8);
        addFlash(0.14);
      } else if (newPhase === 3) {
        addFloater(actor.x, actor.y - 158, "PHASE 3: COUNTER", "#fff0a8");
        pushFeed("Victor fights like he remembers Rustbell.");
        addShake(6);
        addFlash(0.12);
      }
    },
    afterAttack(actor, target, attack, info) {
      if (info?.source !== "target") return;
      const state = actor.bossState;
      if (!state || target.aiPhase !== 3 || !attack.slot) return;
      state.slots.push(attack.slot);
      state.slots = state.slots.slice(-4);
      const repeats = state.slots.filter((slot) => slot === attack.slot).length;
      state.adaptSlot = repeats >= 3 ? attack.slot : "";
    },
    getHudText(actor) {
      return actor.aiPhase === 2 ? "Victor: brawler phase" : actor.aiPhase === 3 ? "Victor: counter phase, mix up" : "Victor: out-boxer phase";
    },
    draw(actor) {
      const color = actor.aiPhase === 2 ? "rgba(214, 59, 52, 0.12)" : actor.aiPhase === 3 ? "rgba(255, 240, 168, 0.1)" : "rgba(158, 183, 255, 0.1)";
      ctx.save();
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, WORLD.width, WORLD.height);
      ctx.restore();
    },
  },
};

const DEFAULT_PUNCH_LOADOUT = { light: "jab", power: "hook", body: "body" };
const DEFAULT_UNLOCKED_PUNCHES = Object.values(DEFAULT_PUNCH_LOADOUT);
const UPGRADE_SKILL_KEYS = ["8", "9", "0", "-", "=", "q", "r"];
const WORLD_AREAS = {
  gym: {
    label: "Rustbell Gym",
    image: "gym",
    bounds: { left: 70, right: 890, top: 115, bottom: 470 },
    walk: [
      { left: 110, right: 870, top: 408, bottom: 470 },
      { left: 190, right: 850, top: 318, bottom: 448 },
      { left: 430, right: 850, top: 235, bottom: 360 },
    ],
    blocked: [
      { left: 70, right: 410, top: 115, bottom: 304 },
      { left: 570, right: 690, top: 372, bottom: 432 },
      { left: 815, right: 895, top: 250, bottom: 355 },
    ],
    start: { x: 470, y: 380 },
    exits: [
      { id: "gymExit", label: "Oldtown Streets", x: 126, y: 452, radius: 50, to: "oldtown", spawn: { x: 170, y: 420 }, nextStep: 4 },
    ],
  },
  oldtown: {
    label: "Oldtown Streets",
    image: "oldtown",
    bounds: { left: 85, right: 875, top: 220, bottom: 472 },
    walk: [
      { left: 80, right: 890, top: 330, bottom: 470 },
      { left: 145, right: 835, top: 260, bottom: 365 },
      { left: 455, right: 710, top: 225, bottom: 340 },
    ],
    blocked: [
      { left: 80, right: 430, top: 220, bottom: 255 },
      { left: 710, right: 890, top: 220, bottom: 292 },
      { left: 83, right: 132, top: 350, bottom: 470 },
      { left: 808, right: 875, top: 390, bottom: 470 },
    ],
    start: { x: 170, y: 420 },
    exits: [
      { id: "gymDoor", label: "Rustbell Gym", x: 145, y: 405, radius: 58, to: "gym", spawn: { x: 154, y: 422 } },
      { id: "dockGate", label: "Dockyard", x: 846, y: 365, radius: 58, to: "dockyard", spawn: { x: 150, y: 410 }, availableStep: 15 },
      { id: "marketAlley", label: "Neon Market", x: 482, y: 254, radius: 56, to: "market", spawn: { x: 180, y: 412 }, availableStep: 21 },
    ],
  },
  dockyard: {
    label: "Dockyard",
    image: "dockyard",
    bounds: { left: 92, right: 872, top: 218, bottom: 468 },
    walk: [
      { left: 96, right: 846, top: 318, bottom: 464 },
      { left: 160, right: 792, top: 260, bottom: 360 },
      { left: 310, right: 662, top: 218, bottom: 316 },
    ],
    blocked: [
      { left: 92, right: 258, top: 218, bottom: 264 },
      { left: 646, right: 872, top: 218, bottom: 304 },
      { left: 716, right: 872, top: 386, bottom: 468 },
      { left: 176, right: 272, top: 418, bottom: 468 },
      { left: 492, right: 570, top: 224, bottom: 282 },
    ],
    start: { x: 150, y: 410 },
    exits: [
      { id: "oldtownGate", label: "Oldtown Streets", x: 118, y: 410, radius: 58, to: "oldtown", spawn: { x: 815, y: 365 } },
      { id: "undergroundGate", label: "Underground Arena", x: 812, y: 388, radius: 62, to: "underground", spawn: { x: 174, y: 420 }, availableStep: 29, nextStep: 30 },
    ],
  },
  market: {
    label: "Neon Market",
    image: "market",
    bounds: { left: 92, right: 872, top: 214, bottom: 468 },
    walk: [
      { left: 116, right: 842, top: 328, bottom: 466 },
      { left: 218, right: 780, top: 268, bottom: 360 },
      { left: 390, right: 668, top: 224, bottom: 318 },
    ],
    blocked: [
      { left: 92, right: 278, top: 214, bottom: 310 },
      { left: 720, right: 872, top: 218, bottom: 326 },
      { left: 92, right: 210, top: 386, bottom: 468 },
      { left: 744, right: 872, top: 398, bottom: 468 },
      { left: 300, right: 382, top: 226, bottom: 288 },
    ],
    start: { x: 180, y: 412 },
    exits: [
      { id: "oldtownMarketGate", label: "Oldtown Streets", x: 132, y: 416, radius: 58, to: "oldtown", spawn: { x: 482, y: 284 } },
      { id: "crownArch", label: "Crown District", x: 820, y: 344, radius: 58, to: "crown", spawn: { x: 156, y: 416 }, availableStep: 42 },
    ],
  },
  crown: {
    label: "Crown District",
    image: "market",
    bounds: { left: 92, right: 872, top: 214, bottom: 468 },
    walk: [
      { left: 116, right: 842, top: 328, bottom: 466 },
      { left: 208, right: 790, top: 270, bottom: 365 },
      { left: 410, right: 692, top: 226, bottom: 320 },
    ],
    blocked: [
      { left: 92, right: 258, top: 214, bottom: 302 },
      { left: 720, right: 872, top: 216, bottom: 314 },
      { left: 92, right: 190, top: 392, bottom: 468 },
      { left: 780, right: 872, top: 396, bottom: 468 },
      { left: 300, right: 392, top: 226, bottom: 292 },
    ],
    start: { x: 156, y: 416 },
    exits: [
      { id: "crownMarketGate", label: "Neon Market", x: 132, y: 416, radius: 58, to: "market", spawn: { x: 802, y: 348 } },
      { id: "stadiumGate", label: "Champion Stadium", x: 820, y: 340, radius: 60, to: "stadium", spawn: { x: 152, y: 414 }, availableStep: 48 },
    ],
  },
  stadium: {
    label: "Champion Stadium",
    image: "stadium",
    bounds: { left: 86, right: 874, top: 202, bottom: 470 },
    walk: [
      { left: 108, right: 856, top: 342, bottom: 468 },
      { left: 176, right: 820, top: 270, bottom: 382 },
      { left: 310, right: 700, top: 214, bottom: 334 },
    ],
    blocked: [
      { left: 86, right: 214, top: 202, bottom: 318 },
      { left: 748, right: 874, top: 202, bottom: 318 },
      { left: 86, right: 176, top: 394, bottom: 470 },
      { left: 802, right: 874, top: 392, bottom: 470 },
    ],
    start: { x: 152, y: 414 },
    exits: [
      { id: "stadiumExit", label: "Crown District", x: 132, y: 416, radius: 58, to: "crown", spawn: { x: 790, y: 342 } },
    ],
  },
  underground: {
    label: "Underground Arena",
    image: "underground",
    bounds: { left: 86, right: 874, top: 212, bottom: 470 },
    walk: [
      { left: 104, right: 856, top: 340, bottom: 468 },
      { left: 180, right: 820, top: 278, bottom: 382 },
      { left: 310, right: 690, top: 224, bottom: 326 },
    ],
    blocked: [
      { left: 86, right: 236, top: 212, bottom: 312 },
      { left: 718, right: 874, top: 214, bottom: 326 },
      { left: 92, right: 168, top: 386, bottom: 470 },
      { left: 792, right: 874, top: 390, bottom: 470 },
      { left: 438, right: 530, top: 228, bottom: 286 },
    ],
    start: { x: 174, y: 420 },
    exits: [
      { id: "undergroundExit", label: "Dockyard", x: 132, y: 422, radius: 58, to: "dockyard", spawn: { x: 782, y: 392 } },
    ],
  },
};
const WORLD_ENTITIES = {
  marcus: { id: "marcus", area: "gym", name: "Coach Marcus", x: 724, y: 334, radius: 58, portrait: 0 },
  jax: { id: "jax", area: "gym", name: "Jax", x: 288, y: 382, radius: 54, portrait: 1, maxStep: 27 },
  bag: { id: "bag", area: "gym", name: "Heavy Bag", x: 526, y: 290, radius: 54 },
  upgrade: { id: "upgrade", area: "gym", name: "Training Corner", x: 742, y: 430, radius: 58 },
  emptyChair: {
    id: "emptyChair",
    area: "gym",
    name: "Jax's Chair",
    x: 288,
    y: 382,
    radius: 48,
    availableStep: 34,
  },
  tapePlayer: {
    id: "tapePlayer",
    area: "gym",
    name: "Old TV",
    x: 518,
    y: 342,
    radius: 48,
    availableStep: 23,
  },
  mina: {
    id: "mina",
    area: "gym",
    name: "Mina",
    x: 612,
    y: 340,
    radius: 54,
    portrait: 0,
    portraitSheet: "chapter2Portraits",
    availableStep: 13,
  },
  scrapper: {
    id: "scrapper",
    area: "oldtown",
    name: "Oldtown Scrapper",
    x: 640,
    y: 384,
    radius: 62,
    portrait: 2,
    availableStep: 4,
    fight: {
      id: "oldtown-scrapper",
      name: "Oldtown Scrapper",
      style: "brawler",
      difficulty: "easy",
      rewardXp: 75,
      rewardMoney: 55,
      objectiveFlag: "scrapperDefeated",
      nextStep: 5,
    },
  },
  rico: {
    id: "rico",
    area: "oldtown",
    name: "Rico Lane",
    x: 316,
    y: 348,
    radius: 58,
    portrait: 0,
    portraitSheet: "chapter1Portraits",
    availableStep: 7,
    fight: {
      id: "rico-lane",
      name: "Rico Lane",
      style: "boxer",
      difficulty: "easy",
      rewardXp: 70,
      rewardMoney: 45,
      nextStep: 8,
      preferredAttack: "doubleJab",
      bossPattern: "runner",
      aiAttackRange: 118,
      mods: { speed: 1.1, stamina: 8 },
    },
  },
  tess: {
    id: "tess",
    area: "oldtown",
    name: "Tess Marrow",
    x: 504,
    y: 424,
    radius: 58,
    portrait: 1,
    portraitSheet: "chapter1Portraits",
    availableStep: 8,
    fight: {
      id: "tess-marrow",
      name: "Tess Marrow",
      style: "counter",
      difficulty: "normal",
      rewardXp: 85,
      rewardMoney: 55,
      nextStep: 9,
      preferredAttack: "checkHook",
      bossPattern: "counter",
      aiAttackRange: 108,
      mods: { power: 0.6, body: 12, recovery: 0.05 },
    },
  },
  bigAl: {
    id: "bigAl",
    area: "oldtown",
    name: "Big Al",
    x: 746,
    y: 410,
    radius: 62,
    portrait: 2,
    portraitSheet: "chapter1Portraits",
    availableStep: 9,
    fight: {
      id: "big-al",
      name: "Big Al",
      style: "tank",
      difficulty: "normal",
      rewardXp: 95,
      rewardMoney: 65,
      nextStep: 10,
      preferredAttack: "uppercut",
      bossPattern: "tank",
      aiAttackRange: 98,
      mods: { head: 14, body: 20, block: 14, speed: -0.35 },
    },
  },
  mason: {
    id: "mason",
    area: "oldtown",
    name: "Mason \"Brick\" Doyle",
    x: 610,
    y: 304,
    radius: 70,
    portrait: 3,
    portraitSheet: "chapter1Portraits",
    availableStep: 11,
    fight: {
      id: "mason-brick-doyle",
      name: "Mason \"Brick\" Doyle",
      style: "brawler",
      difficulty: "hard",
      rewardXp: 140,
      rewardMoney: 110,
      nextStep: 12,
      boss: true,
      preferredAttack: "overhand",
      bossPattern: "brick",
      aiAttackRange: 102,
      mods: { power: 1.4, head: 28, body: 20, block: 12, stamina: 12 },
    },
  },
  dockBruiser: {
    id: "dockBruiser",
    area: "dockyard",
    name: "Cal Rook",
    x: 496,
    y: 382,
    radius: 64,
    portrait: 1,
    portraitSheet: "chapter2Portraits",
    availableStep: 15,
    fight: {
      id: "cal-rook",
      name: "Cal Rook",
      style: "brawler",
      difficulty: "normal",
      rewardXp: 105,
      rewardMoney: 85,
      nextStep: 16,
      intro: "You came for Friday money? It leaves with bruises.",
      returnArea: "dockyard",
      returnX: 496,
      returnY: 404,
      storyFlag: "sawDockyardFights",
      preferredAttack: "overhand",
      bossPattern: "slugger",
      aiAttackRange: 102,
      mods: { power: 0.9, head: 10, body: 12, stamina: 8 },
    },
  },
  bodySnatcher: {
    id: "bodySnatcher",
    area: "dockyard",
    name: "Vera Hooks",
    x: 698,
    y: 346,
    radius: 64,
    portrait: 2,
    portraitSheet: "chapter2Portraits",
    availableStep: 16,
    fight: {
      id: "vera-hooks",
      name: "Vera Hooks",
      style: "counter",
      difficulty: "normal",
      rewardXp: 120,
      rewardMoney: 95,
      nextStep: 17,
      intro: "Hands high, ribs open. Everybody gives me something.",
      returnArea: "dockyard",
      returnX: 698,
      returnY: 368,
      storyFlag: "feltDockyardBodyShots",
      preferredAttack: "liverShot",
      bossPattern: "bodyHunter",
      aiAttackRange: 106,
      mods: { power: 0.7, speed: 0.25, body: 18, stamina: 12, recovery: 0.08 },
    },
  },
  sofia: {
    id: "sofia",
    area: "dockyard",
    name: "Sofia \"Needle\" Reyes",
    x: 586,
    y: 282,
    radius: 68,
    portrait: 3,
    portraitSheet: "chapter2Portraits",
    availableStep: 18,
    fight: {
      id: "sofia-needle-reyes",
      name: "Sofia \"Needle\" Reyes",
      style: "boxer",
      difficulty: "hard",
      rewardXp: 165,
      rewardMoney: 130,
      nextStep: 19,
      intro: "The Crown likes winners who don't ask questions.",
      returnArea: "dockyard",
      returnX: 586,
      returnY: 314,
      boss: true,
      storyFlag: "crownCircuitMentioned",
      victoryFeed: "Sofia leaves you with one name: The Crown Circuit.",
      preferredAttack: "doubleJab",
      bossPattern: "needle",
      aiAttackRange: 126,
      mods: { speed: 1.05, stamina: 18, block: 10, recovery: 0.16, head: 8 },
    },
  },
  mara: {
    id: "mara",
    area: "market",
    name: "Mara Vale",
    x: 326,
    y: 338,
    radius: 58,
    portrait: 1,
    portraitSheet: "chapter3Portraits",
    availableStep: 21,
  },
  tapeRunner: {
    id: "tapeRunner",
    area: "market",
    name: "Tape Runner",
    x: 654,
    y: 392,
    radius: 62,
    portrait: 2,
    portraitSheet: "chapter3Portraits",
    availableStep: 22,
    fight: {
      id: "tape-runner",
      name: "Tape Runner",
      style: "boxer",
      difficulty: "hard",
      rewardXp: 150,
      rewardMoney: 105,
      nextStep: 23,
      intro: "Crowe pays for quiet. You should learn that word.",
      returnArea: "market",
      returnX: 654,
      returnY: 414,
      storyFlag: "kaiTapeRecovered",
      victoryFeed: "You recover Kai's cracked tape from the runner's bag.",
      preferredAttack: "cross",
      bossPattern: "runner",
      aiAttackRange: 124,
      mods: { speed: 1.0, stamina: 18, recovery: 0.2, block: 8 },
    },
  },
  crownScout: {
    id: "crownScout",
    area: "market",
    name: "Crown Scout",
    x: 780,
    y: 342,
    radius: 56,
    portrait: 3,
    portraitSheet: "chapter3Portraits",
    availableStep: 26,
  },
  eliasCrowe: {
    id: "eliasCrowe",
    area: "crown",
    name: "Elias Crowe",
    x: 616,
    y: 316,
    radius: 64,
    portrait: 3,
    portraitSheet: "chapter3Portraits",
    availableStep: 42,
    maxStep: 43,
  },
  kai: {
    id: "kai",
    area: "gym",
    name: "Kai",
    x: 448,
    y: 336,
    radius: 58,
    portrait: 0,
    portraitSheet: "chapter3Portraits",
    availableStep: 24,
  },
  gateFighter: {
    id: "gateFighter",
    area: "underground",
    name: "Basement Gatekeeper",
    x: 430,
    y: 398,
    radius: 64,
    portrait: 2,
    portraitSheet: "chapter2Portraits",
    availableStep: 30,
    fight: {
      id: "basement-gatekeeper",
      name: "Basement Gatekeeper",
      style: "tank",
      difficulty: "normal",
      rewardXp: 120,
      rewardMoney: 95,
      nextStep: 31,
      intro: "No ticket, no mercy. That's the door price.",
      returnArea: "underground",
      returnX: 430,
      returnY: 418,
      preferredAttack: "uppercut",
      bossPattern: "tank",
      aiAttackRange: 104,
      mods: { head: 14, body: 16, block: 16, stamina: 10 },
    },
  },
  dirtyFighter: {
    id: "dirtyFighter",
    area: "underground",
    name: "Razor Finn",
    x: 650,
    y: 348,
    radius: 66,
    portrait: 3,
    portraitSheet: "chapter2Portraits",
    availableStep: 31,
    fight: {
      id: "razor-finn",
      name: "Razor Finn",
      style: "brawler",
      difficulty: "hard",
      rewardXp: 155,
      rewardMoney: 120,
      nextStep: 32,
      intro: "Your friend already signed. You are just late.",
      returnArea: "underground",
      returnX: 650,
      returnY: 370,
      storyFlag: "foughtThroughUnderground",
      victoryFeed: "The crowd points toward the back room. Jax's fight is already over.",
      preferredAttack: "overhand",
      bossPattern: "slugger",
      aiAttackRange: 108,
      mods: { power: 1.1, speed: 0.25, head: 18, stamina: 14, recovery: 0.06 },
    },
  },
  jaxArena: {
    id: "jaxArena",
    area: "underground",
    name: "Jax",
    x: 758,
    y: 410,
    radius: 56,
    portrait: 1,
    availableStep: 32,
    maxStep: 32,
  },
  jaxMother: {
    id: "jaxMother",
    area: "oldtown",
    name: "Mrs. Bell",
    x: 264,
    y: 382,
    radius: 56,
    portrait: 1,
    portraitSheet: "chapter1Portraits",
    availableStep: 36,
  },
  nero: {
    id: "nero",
    area: "underground",
    name: "Nero Black",
    x: 560,
    y: 288,
    radius: 72,
    portrait: 3,
    portraitSheet: "chapter2Portraits",
    availableStep: 38,
    fight: {
      id: "nero-black",
      name: "Nero Black",
      style: "brawler",
      difficulty: "hard",
      rewardXp: 210,
      rewardMoney: 160,
      nextStep: 39,
      intro: "Jax signed his name. You signed your grief. I collect both.",
      returnArea: "underground",
      returnX: 560,
      returnY: 330,
      boss: true,
      storyFlag: "neroDefeated",
      victoryFeed: "Nero falls, and the underground goes quiet for the first time all night.",
      preferredAttack: "shovelHook",
      bossPattern: "pressure",
      aiAttackRange: 112,
      mods: { power: 1.4, speed: 0.45, head: 26, body: 24, stamina: 18, recovery: 0.1 },
    },
  },
  memorialWall: {
    id: "memorialWall",
    area: "gym",
    name: "Memorial Wall",
    x: 824,
    y: 286,
    radius: 54,
    availableStep: 39,
  },
  crownEnforcer: {
    id: "crownEnforcer",
    area: "gym",
    name: "Crown Enforcer",
    x: 520,
    y: 424,
    radius: 68,
    portrait: 3,
    portraitSheet: "chapter3Portraits",
    availableStep: 44,
    fight: {
      id: "crown-enforcer",
      name: "Crown Enforcer",
      style: "counter",
      difficulty: "hard",
      rewardXp: 240,
      rewardMoney: 0,
      nextStep: 45,
      intro: "Crowe said break the bell first. Fighters follow sound.",
      boss: true,
      storyFlag: "gymDefended",
      victoryFeed: "The enforcer leaves empty-handed, but smoke is already crawling under the gym door.",
      preferredAttack: "checkHook",
      bossPattern: "counter",
      aiAttackRange: 118,
      mods: { power: 1.18, speed: 0.82, head: 18, body: 16, block: 20, stamina: 18, recovery: 0.18 },
    },
  },
  gymBell: {
    id: "gymBell",
    area: "gym",
    name: "Old Gym Bell",
    x: 706,
    y: 250,
    radius: 50,
    availableStep: 46,
  },
  dariusVale: {
    id: "dariusVale",
    area: "stadium",
    name: "Darius Vale",
    x: 488,
    y: 348,
    radius: 72,
    portrait: 2,
    portraitSheet: "chapter3Portraits",
    availableStep: 49,
    fight: {
      id: "darius-vale",
      name: "Darius Vale",
      style: "counter",
      difficulty: "hard",
      rewardXp: 280,
      rewardMoney: 180,
      nextStep: 50,
      intro: "Marcus taught me too. Tonight I find out which lesson survived.",
      boss: true,
      storyFlag: "dariusDefeated",
      victoryFeed: "Darius touches his glove to the canvas for Marcus and steps aside.",
      preferredAttack: "cross",
      bossPattern: "darius",
      aiAttackRange: 122,
      mods: { power: 1.28, speed: 0.9, head: 28, body: 22, block: 22, stamina: 24, recovery: 0.2 },
    },
  },
  victorKane: {
    id: "victorKane",
    area: "stadium",
    name: "Victor Kane",
    x: 660,
    y: 318,
    radius: 78,
    portrait: 3,
    portraitSheet: "chapter3Portraits",
    availableStep: 50,
    fight: {
      id: "victor-kane",
      name: "Victor Kane",
      style: "balanced",
      difficulty: "hard",
      rewardXp: 420,
      rewardMoney: 260,
      nextStep: 51,
      intro: "I was Rustbell once. I just learned the bell rings louder for people who own it.",
      boss: true,
      storyFlag: "victorDefeated",
      victoryFeed: "Victor stays on one knee, not beaten cleanly by you, but by the thing he almost became.",
      preferredAttack: "cross",
      bossPattern: "champion",
      aiAttackRange: 132,
      mods: { power: 1.65, speed: 1.08, head: 42, body: 34, block: 30, stamina: 34, recovery: 0.24 },
    },
  },
  endingLastBell: {
    id: "endingLastBell",
    area: "stadium",
    name: "Last Bell Ending",
    x: 370,
    y: 410,
    radius: 58,
    availableStep: 51,
    maxStep: 51,
  },
  endingRevenge: {
    id: "endingRevenge",
    area: "stadium",
    name: "Revenge Ending",
    x: 504,
    y: 410,
    radius: 58,
    availableStep: 51,
    maxStep: 51,
  },
  endingCrown: {
    id: "endingCrown",
    area: "stadium",
    name: "Crown Ending",
    x: 638,
    y: 410,
    radius: 58,
    availableStep: 51,
    maxStep: 51,
  },
  oldBoxer: {
    id: "oldBoxer",
    area: "oldtown",
    name: "Old Boxer Eli",
    x: 418,
    y: 292,
    radius: 54,
    portrait: 2,
    portraitSheet: "chapter1Portraits",
    availableStep: 14,
  },
  minaWorkbench: {
    id: "minaWorkbench",
    area: "gym",
    name: "Mina's Workbench",
    x: 620,
    y: 430,
    radius: 54,
    availableStep: 15,
  },
  jaxWraps: {
    id: "jaxWraps",
    area: "oldtown",
    name: "Jax's Old Wraps",
    x: 530,
    y: 438,
    radius: 46,
    availableStep: 34,
  },
  jaxJacket: {
    id: "jaxJacket",
    area: "dockyard",
    name: "Jax's Jacket",
    x: 340,
    y: 356,
    radius: 48,
    availableStep: 34,
  },
  gymRecords: {
    id: "gymRecords",
    area: "market",
    name: "Old Gym Records",
    x: 602,
    y: 300,
    radius: 48,
    availableStep: 34,
  },
  roadworkRoute: {
    id: "roadworkRoute",
    area: "oldtown",
    name: "Roadwork Route",
    x: 214,
    y: 334,
    radius: 48,
    availableStep: 7,
  },
};
const WORLD_DIALOGUE = {
  prologue: {
    speaker: "Rustbell, Years Ago",
    portrait: 0,
    text: "Kai was the fighter every kid in Rustbell copied. Fast hands. Quiet smile. Rustbell Gym rang the bell for him like he already owned tomorrow.",
    next: "prologueCrown",
  },
  prologueCrown: {
    speaker: "The Crown Circuit",
    portrait: 0,
    text: "Then a rich league came calling. They told Kai to throw a fight. Kai refused, because some losses cost more than winning ever pays.",
    next: "prologueBell",
  },
  prologueBell: {
    speaker: "The Last Bell",
    portrait: 0,
    text: "After the bell, the other fighter kept swinging. The ref looked away. Kai survived, but the ring took pieces no doctor could put back.",
    next: "prologueNow",
  },
  prologueNow: {
    speaker: "Rustbell Gym",
    portrait: 0,
    text: "Now Kai is gone, Marcus blames himself, and the power company wants money by Friday. If the lights go out, the gym dies with them.",
    next: "prologueRent",
  },
  prologueRent: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "Mason Doyle's crew took the rent box. You are angry. Good. But anger without footwork gets kids buried.",
    next: "prologueStart",
  },
  prologueStart: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "Start small. Listen. Move. Win enough to keep the lights on, then maybe we find out why Crown is still hanging over this place.",
    prologueDone: true,
  },
  marcusIntro: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "Mason Doyle's crew took the rent box. Footwork first. Anger second. Move to the tape and show me you can listen.",
  },
  jaxIntro: {
    speaker: "Jax",
    portrait: 1,
    text: "If you win, I'm saying I trained you.",
  },
  bag: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "Good. The kid outside works for Mason. Win clean, bring back enough to keep the lights on.",
  },
  firstStreet: {
    speaker: "Jax",
    portrait: 1,
    text: "That Scrapper by the corner is Mason's collector. He acts tough because nobody has called him on it yet.",
  },
  firstWin: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "Good. Now learn why winning still costs something.",
  },
  jaxMason: {
    speaker: "Jax",
    portrait: 1,
    text: "Mason's crew is shaking down Oldtown. Start with Rico. He runs his mouth and his feet.",
  },
  marcusMason: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "Brick Doyle throws slow, but he throws like a door falling off its hinges. Slip first.",
  },
  chapterOneDone: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "The lights stay on. For tonight. Don't confuse that with peace.",
  },
  chapterTwoStart: {
    speaker: "Jax",
    portrait: 1,
    text: "Dockyard pays Friday money. Bad money, yeah, but my mum's rent doesn't care where it came from.",
  },
  minaDockLead: {
    speaker: "Mina",
    portrait: 0,
    portraitSheet: "chapter2Portraits",
    text: "Those bruises aren't street work. Dockyard fighters dig at the ribs until breathing feels expensive.",
  },
  dockArrival: {
    speaker: "Dockyard",
    text: "The air tastes like salt, diesel, and people pretending they are not scared.",
  },
  minaBodyWarning: {
    speaker: "Mina",
    portrait: 0,
    portraitSheet: "chapter2Portraits",
    text: "See? Body shots steal tomorrow from you. Sofia Reyes is next. Fast jab. No wasted steps.",
  },
  chapterTwoDone: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "Needle Reyes fought on the same undercard as Kai's last match. If Crown is sniffing around, this gets ugly.",
  },
  chapterThreeLead: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "If Sofia mentioned a tape, Neon Market will know. Dirty things always find a stall when rent is due.",
  },
  maraTapeLead: {
    speaker: "Mara Vale",
    portrait: 1,
    portraitSheet: "chapter3Portraits",
    text: "I don't sell memories. I sell proof. Crown sent a runner for Kai's tape before you got here.",
  },
  marketArrival: {
    speaker: "Neon Market",
    text: "Neon buzzes over wet concrete. Everyone here knows something. Nobody says it first.",
  },
  tapeReveal: {
    speaker: "Old TV",
    text: "The tape stutters: Kai drops his hands after the bell. The ref looks away. Marcus reaches for the towel too late.",
  },
  kaiReturn: {
    speaker: "Kai",
    portrait: 0,
    portraitSheet: "chapter3Portraits",
    text: "I didn't leave because I forgot you. I left because every time I looked at you, I saw myself walking back into that ring.",
  },
  marcusTapeAfter: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "I should have thrown the towel before pride got louder than sense. Don't make my mistake heroic.",
  },
  crownScoutTease: {
    speaker: "Crown Scout",
    portrait: 3,
    portraitSheet: "chapter3Portraits",
    text: "Elias Crowe notices survivors. Keep winning and he will offer you a cleaner cage.",
  },
  chapterFourStart: {
    speaker: "Jax",
    portrait: 1,
    text: "Dockyard's underground card pays tonight. I know what you are going to say. Say it after my mum's rent is handled.",
  },
  minaJaxWarning: {
    speaker: "Mina",
    portrait: 0,
    portraitSheet: "chapter2Portraits",
    text: "Jax smiles when he's scared. He was smiling too much. If you follow him, follow fast.",
  },
  undergroundArrival: {
    speaker: "Underground Arena",
    text: "The basement shakes with cheap speakers and expensive fear. Nobody here looks at the exits.",
    temporary: true,
  },
  jaxFinal: {
    speaker: "Jax",
    portrait: 1,
    text: "Did I win?",
    next: "jaxFinalPlayer",
  },
  jaxFinalPlayer: {
    speaker: "You",
    text: "Yeah. You won.",
    next: "jaxFinalLast",
  },
  jaxFinalLast: {
    speaker: "Jax",
    portrait: 1,
    text: "Good. Don't tell my mum I was scared.",
  },
  emptyChair: {
    speaker: "Mina",
    portrait: 0,
    portraitSheet: "chapter2Portraits",
    text: "That's his chair. Nobody moves it. Not today.",
    next: "emptyChairMarcus",
  },
  emptyChairMarcus: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "Winning did not save him. Remember that before the city teaches you the wrong lesson.",
  },
  jaxChairInspect: {
    speaker: "Jax's Chair",
    text: "The room keeps leaving space for a joke that does not come.",
    temporary: true,
  },
  chapterFiveChair: {
    speaker: "Jax's Chair",
    text: "His jacket hangs over the back. One sleeve is still inside out, like he meant to fix it when he came back.",
  },
  chapterFiveMinaLead: {
    speaker: "Mina",
    portrait: 0,
    portraitSheet: "chapter2Portraits",
    text: "His mum should not hear it from the street. Give me a minute. Then we go.",
  },
  tellHisMum: {
    speaker: "Mrs. Bell",
    portrait: 1,
    portraitSheet: "chapter1Portraits",
    text: "He used to say this gym made him brave. I think he was brave before any of you noticed.",
    next: "tellHisMumMina",
  },
  tellHisMumMina: {
    speaker: "Mina",
    portrait: 0,
    portraitSheet: "chapter2Portraits",
    text: "There is nothing useful to say. So we stay. That is the useful part.",
  },
  kaiAfterJax: {
    speaker: "Kai",
    portrait: 0,
    portraitSheet: "chapter3Portraits",
    text: "Nero Black runs the room that fed Jax to the crowd. You can fight him, but do not call revenge justice.",
  },
  memorialWallBuild: {
    speaker: "Memorial Wall",
    text: "Jax Bell. Kai's old gloves. Names from fights nobody reported. The wall does not fix anything. It refuses to forget.",
    next: "chapterFiveDone",
  },
  chapterFiveDone: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "This is what Crown cannot buy. Remembering people as people.",
  },
  chapterSixStart: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "Crowe sent a car with clean seats and dirty terms. Neon Market has the messenger. Hear him. Do not belong to him.",
  },
  crownScoutSummons: {
    speaker: "Crown Scout",
    portrait: 3,
    portraitSheet: "chapter3Portraits",
    text: "Mr. Crowe invites you upstairs. Bring your grief. He likes fighters who think pain makes them expensive.",
  },
  crownDistrictArrival: {
    speaker: "Crown District",
    text: "Glass towers stare down at Rustbell like the city was built to prove who gets to breathe easier.",
    temporary: true,
  },
  eliasOffer: {
    speaker: "Elias Crowe",
    portrait: 3,
    portraitSheet: "chapter3Portraits",
    text: "I can keep your gym alive. I can make your name safe. All I need is the part of you that still says no.",
    next: "eliasOfferPlayer",
  },
  eliasOfferPlayer: {
    speaker: "You",
    text: "Rustbell is not for sale.",
    next: "eliasOfferCrowe",
  },
  eliasOfferCrowe: {
    speaker: "Elias Crowe",
    portrait: 3,
    portraitSheet: "chapter3Portraits",
    text: "Everything is for sale. Some people just need smoke to see the price tag.",
  },
  marcusCroweWarning: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "A man like Crowe does not lose an argument. He changes the room until you cannot breathe in it. Stay close tonight.",
  },
  marcusFinal: {
    speaker: "Smoke Over Rustbell",
    text: "The enforcer is gone. The old records are wet. The gloves are safe. The bell is still warm from Marcus's hands.",
    next: "marcusFinalPlayer",
  },
  marcusFinalPlayer: {
    speaker: "You",
    text: "Why didn't you leave?",
    next: "marcusFinalMarcus",
  },
  marcusFinalMarcus: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "Because this place was never just wood and lights.",
    next: "marcusFinalPlayerTwo",
  },
  marcusFinalPlayerTwo: {
    speaker: "You",
    text: "It's just a gym.",
    next: "marcusFinalLast",
  },
  marcusFinalLast: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "No. It's where scared kids came when they had nowhere else.",
  },
  kaiKeys: {
    speaker: "Kai",
    portrait: 0,
    portraitSheet: "chapter3Portraits",
    text: "Marcus left you the keys. He left me the job I kept running from. Tomorrow, I train you.",
    next: "chapterSixDone",
  },
  chapterSixDone: {
    speaker: "Old Gym Bell",
    text: "The bell rings once. Not for victory. For everyone still standing.",
  },
  chapterSevenStart: {
    speaker: "Kai",
    portrait: 0,
    portraitSheet: "chapter3Portraits",
    text: "Last lesson. Do not fight Victor to become him. Fight so nobody has to become either of you.",
    next: "chapterSevenBell",
  },
  chapterSevenBell: {
    speaker: "Old Gym Bell",
    text: "The sound is cracked. It still reaches the street.",
  },
  stadiumArrival: {
    speaker: "Champion Stadium",
    text: "The crowd is bright, clean, and loud enough to hide almost anything.",
    temporary: true,
  },
  dariusIntro: {
    speaker: "Darius Vale",
    portrait: 2,
    portraitSheet: "chapter3Portraits",
    text: "Marcus said a fighter is what they protect when nobody is clapping. Show me he was right.",
  },
  victorAfter: {
    speaker: "Victor Kane",
    portrait: 3,
    portraitSheet: "chapter3Portraits",
    text: "Crowe has contracts, tapes, doctors, referees. Beat me and you still need to decide what kind of winner walks out.",
  },
  endingBest: {
    speaker: "The Last Bell",
    text: "You refuse Crowe and let Victor stand. He gives evidence. Crown falls loudly. Rustbell Gym reopens for kids who need somewhere warm.",
    next: "endingBestKai",
  },
  endingBestKai: {
    speaker: "Kai",
    portrait: 0,
    portraitSheet: "chapter3Portraits",
    text: "You did not save everything. Nobody does. But you protected what was left.",
  },
  endingRevenge: {
    speaker: "Revenge",
    text: "Crowe is exposed, but mercy leaves the room with Victor. Kai watches the crowd cheer and sees the same old machine wearing your face.",
    next: "endingRevengeKai",
  },
  endingRevengeKai: {
    speaker: "Kai",
    portrait: 0,
    portraitSheet: "chapter3Portraits",
    text: "You won. That is the worst part.",
  },
  endingCrown: {
    speaker: "The Crown",
    text: "You sign Crowe's contract. The gym gets new lights, sponsor paint, and silence. Jax's memorial comes down first.",
    next: "endingCrownMina",
  },
  endingCrownMina: {
    speaker: "Mina",
    portrait: 0,
    portraitSheet: "chapter2Portraits",
    text: "I fixed the bags. I fixed the lights. I cannot fix what you just sold.",
  },
  oldBoxerIntro: {
    speaker: "Old Boxer Eli",
    portrait: 2,
    portraitSheet: "chapter1Portraits",
    text: "Marcus taught me to breathe before fear picked a name. I can teach you a quiet drill. No crowd. No bell.",
  },
  minaWorkbenchIntro: {
    speaker: "Mina",
    portrait: 0,
    portraitSheet: "chapter2Portraits",
    text: "Hold the pad steady while I stitch. Miss the rhythm and I sew your sleeve to the bag. Again.",
  },
  roadworkIntro: {
    speaker: "Coach Marcus",
    portrait: 0,
    text: "Roadwork when it rains teaches you who is lying about wanting it. Hit the cones. No shortcuts through walls.",
  },
  jaxWrapsLine: {
    speaker: "Jax's Old Wraps",
    text: "The tape is grey at the knuckles. He wrote jokes on the inside so nobody else could see them.",
  },
  jaxJacketLine: {
    speaker: "Jax's Jacket",
    text: "It still smells like rain and gym chalk. One pocket has a bus ticket he never used.",
  },
  gymRecordsLine: {
    speaker: "Old Gym Records",
    text: "Names, weights, losses, small victories. Proof that Rustbell was always more than its champions.",
  },
};

const WORLD_AMBIENT_LINES = {
  marcus: [
    { id: "c1-before-footwork", min: 0, max: 0, speaker: "Coach Marcus", portrait: 0, text: "You want answers, start with your feet. A fighter who trips over anger is just a kid swinging at air." },
    { id: "c1-bag", min: 1, max: 3, speaker: "Coach Marcus", portrait: 0, text: "The bag does not hit back, which is why cowards love it. Use it anyway. Basics save lives." },
    { id: "c1-scrapper", min: 4, max: 4, speaker: "Coach Marcus", portrait: 0, text: "That Scrapper is not your enemy. He is a symptom. Still, symptoms hurt when ignored." },
    { id: "c1-crew", min: 7, max: 9, speaker: "Coach Marcus", portrait: 0, text: "Mason's boys win by making people look at the floor. Keep your chin up. Literally and otherwise." },
    { id: "c1-mason", min: 11, max: 11, speaker: "Coach Marcus", portrait: 0, text: "Brick Doyle loads up before he throws. See the shoulder, leave the room, make him pay rent for missing." },
    { id: "c2-warning", min: 14, max: 18, speaker: "Coach Marcus", portrait: 0, text: "Dockyard money always arrives with a hook hidden in it. Ask what it wants from you before you take it." },
    { id: "c3-tape", min: 21, max: 26, speaker: "Coach Marcus", portrait: 0, text: "Proof hurts because it stops you pretending. Find the tape, then decide what kind of fighter you are." },
    { id: "c4-chair", min: 34, max: 40, speaker: "Coach Marcus", portrait: 0, text: "Some rounds do not end when the bell rings. You keep breathing anyway. That is not victory. It is work." },
  ],
  jax: [
    { id: "c1-start", min: 0, max: 3, speaker: "Jax", portrait: 1, text: "If you win, I am saying I trained you. If you lose, I am saying Marcus trained you." },
    { id: "c1-scrapper", min: 4, max: 5, speaker: "Jax", portrait: 1, text: "Scrapper talks big, but he flinches when people step toward him. Try stepping toward him." },
    { id: "c1-scrapper-after", min: 4, max: 5, speaker: "Jax", portrait: 1, text: "Bring back the rent box if he has it. Bring back your teeth if he does not." },
    { id: "c1-rico", min: 7, max: 7, speaker: "Jax", portrait: 1, text: "Rico runs like he owes the pavement money. Cut him off instead of chasing." },
    { id: "c1-tess", min: 8, max: 8, speaker: "Jax", portrait: 1, text: "Tess waits for you to get bored and stupid. Do not give her both." },
    { id: "c1-al", min: 9, max: 10, speaker: "Jax", portrait: 1, text: "Big Al looks impossible until he breathes. Everybody breathes." },
    { id: "c1-after", min: 12, max: 12, speaker: "Jax", portrait: 1, text: "Lights stayed on. That means I can keep pretending this place has heating." },
    { id: "c2-money", min: 14, max: 19, speaker: "Jax", portrait: 1, text: "Do not look at me like that. Friday money is ugly, but rent notices are uglier." },
    { id: "c3-kai", min: 24, max: 26, speaker: "Jax", portrait: 1, text: "Kai coming back should feel good, right? So why does everyone look like they heard a siren?" },
  ],
  mina: [
    { id: "c2-start", min: 13, max: 14, speaker: "Mina", portrait: 0, portraitSheet: "chapter2Portraits", text: "I can fix a treadmill. I cannot fix a fighter who thinks pain is a plan." },
    { id: "c2-body", min: 15, max: 17, speaker: "Mina", portrait: 0, portraitSheet: "chapter2Portraits", text: "When they dig the body, breathe small. Panic spends oxygen faster than punches do." },
    { id: "c2-sofia", min: 18, max: 19, speaker: "Mina", portrait: 0, portraitSheet: "chapter2Portraits", text: "Sofia is not cruel. That makes her scarier. She has convinced herself this is just business." },
    { id: "c3-market", min: 21, max: 23, speaker: "Mina", portrait: 0, portraitSheet: "chapter2Portraits", text: "Neon Market sells rumors by weight. Buy the heavy one." },
    { id: "c3-kai", min: 24, max: 26, speaker: "Mina", portrait: 0, portraitSheet: "chapter2Portraits", text: "Kai looks at the ring like it still has teeth." },
    { id: "c4-before", min: 29, max: 32, speaker: "Mina", portrait: 0, portraitSheet: "chapter2Portraits", text: "If you find Jax, do not argue first. Bring him home first. Be angry later." },
    { id: "c4-after", min: 34, max: 40, speaker: "Mina", portrait: 0, portraitSheet: "chapter2Portraits", text: "I keep reaching for a joke and finding nothing there. I hate that." },
  ],
  mara: [
    { id: "c3-before-runner", min: 21, max: 22, speaker: "Mara Vale", portrait: 1, portraitSheet: "chapter3Portraits", text: "People think secrets are hidden. They are not. They are just priced correctly." },
    { id: "c3-after-runner", min: 23, max: 27, speaker: "Mara Vale", portrait: 1, portraitSheet: "chapter3Portraits", text: "That tape will not make you feel better. It will make the lie smaller." },
  ],
  kai: [
    { id: "c3-return", min: 25, max: 27, speaker: "Kai", portrait: 0, portraitSheet: "chapter3Portraits", text: "Marcus taught me how to fight. Nobody taught me what to do after surviving." },
    { id: "c4-after-jax", min: 33, max: 40, speaker: "Kai", portrait: 0, portraitSheet: "chapter3Portraits", text: "Do not turn grief into a weapon unless you are ready for it to point both ways." },
  ],
  crownScout: [
    { id: "c3-offer", min: 27, max: 29, speaker: "Crown Scout", portrait: 3, portraitSheet: "chapter3Portraits", text: "Crowe does not recruit fighters. He buys pressure and waits to see who breaks usefully." },
  ],
  tapePlayer: [
    { id: "after-tape", min: 24, max: 40, speaker: "Old TV", text: "The tape deck clicks at the empty part after the bell. Somehow that part sounds loudest." },
  ],
  emptyChair: [
    { id: "chair", min: 34, max: 40, speaker: "Jax's Chair", text: "The room keeps leaving space for a joke that does not come." },
  ],
  jaxMother: [
    { id: "after-visit", min: 37, max: 40, speaker: "Mrs. Bell", portrait: 1, portraitSheet: "chapter1Portraits", text: "If you fight for him, do not only fight angry. Jax hated quiet rooms. Fill yours with people." },
  ],
  memorialWall: [
    { id: "wall-after", min: 40, max: 50, speaker: "Memorial Wall", text: "Fresh paint. Old names. A bell rope waiting for the next round." },
  ],
  eliasCrowe: [
    { id: "offer-after", min: 43, max: 43, speaker: "Elias Crowe", portrait: 3, portraitSheet: "chapter3Portraits", text: "Sentiment is useful. It makes people predictable." },
  ],
  crownEnforcer: [
    { id: "before-fight", min: 44, max: 44, speaker: "Crown Enforcer", portrait: 3, portraitSheet: "chapter3Portraits", text: "You can stand there, or you can move. Crowe pays either way." },
  ],
  gymBell: [
    { id: "after-marcus", min: 47, max: 55, speaker: "Old Gym Bell", text: "The rope is frayed, but it holds. So does the room." },
  ],
  dariusVale: [
    { id: "waiting", min: 49, max: 49, speaker: "Darius Vale", portrait: 2, portraitSheet: "chapter3Portraits", text: "I remember Marcus wrapping my hands too tight because he thought fear leaked through loose tape." },
  ],
  victorKane: [
    { id: "waiting", min: 50, max: 50, speaker: "Victor Kane", portrait: 3, portraitSheet: "chapter3Portraits", text: "The first time Crown paid me, I slept like a child. The second time, I stopped sleeping." },
  ],
};

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  guard: false,
};

const remoteInput = {
  up: false,
  down: false,
  left: false,
  right: false,
  guard: false,
};

const secondInput = {
  up: false,
  down: false,
  left: false,
  right: false,
  guard: false,
};

const fighters = [
  createFighter({
    name: "Red",
    x: 356,
    y: 332,
    side: "left",
    color: "#f0c36b",
    shorts: "#149b93",
    glove: "#d63b34",
  }),
  createFighter({
    name: "Blue",
    x: 604,
    y: 332,
    side: "right",
    color: "#b87952",
    shorts: "#3d9856",
    glove: "#f1b832",
  }),
];

const player = fighters[0];
const enemy = fighters[1];
const particles = [];
const floaters = [];
const localAttackQueue = [];
const remoteAttackQueue = [];
const pendingAttacks = [null, null];

let activeMode = "menu";
let playMode = "ai";
let localIndex = 0;
let roundTime = ROUND_LENGTH;
let resultTitle = "";
let resultSubtitle = "";
let lastTime = 0;
let screenShake = 0;
let hitStop = 0;
let screenFlash = 0;
let dpr = 1;
let netSendTimer = 0;
let inputSendTimer = 0;
let localStyle = "balanced";
let remoteStyle = "balanced";
let aiStyle = "brawler";
let aiDifficulty = "normal";
let paused = false;
let debugMode = false;
let tutorialVisible = true;
let audioMuted = false;
let reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;
let hostRematchRequested = false;
let guestRematchRequested = false;
let resultBreakdown = "";
let audioContext = null;
let pendingWorldFight = null;
let worldInteractTarget = null;
let worldMessageTimer = 0;
let queuedWorldFightId = "";
let worldResult = null;
let worldResultUnlockAt = 0;
let activeSaveSlot = "slot1";
let activeMinigame = null;
let ambience = null;

const worldImages = {};
Object.entries(WORLD_ASSETS).forEach(([key, src]) => {
  const image = new Image();
  image.src = src;
  worldImages[key] = image;
});

let worldState = createDefaultWorldState();

const network = {
  peer: null,
  conn: null,
  code: "",
  connected: false,
  connecting: false,
};

function createFighter(config) {
  return {
    ...config,
    maxHealth: 106,
    health: 106,
    maxHeadHealth: 100,
    headHealth: 100,
    maxBodyHealth: 118,
    bodyHealth: 118,
    maxStamina: 100,
    staminaCap: 100,
    stamina: 100,
    maxBlock: 80,
    block: 80,
    style: "balanced",
    styleLabel: "Balanced",
    power: 6,
    speed: 6,
    reach: 1,
    recovery: 1,
    counterBonus: 1.42,
    toughness: 1,
    facing: config.side === "left" ? 1 : -1,
    guard: false,
    attack: null,
    attackCooldown: 0,
    slipTimer: 0,
    evadeTimer: 0,
    slipCooldown: 0,
    slipDx: 0,
    slipDy: 0,
    slipCounterTimer: 0,
    vulnerable: 0,
    hitFlash: 0,
    aiTimer: 0,
    aiMove: "close",
    stunned: 0,
    rocked: 0,
    combo: 0,
    comboTimer: 0,
    lastAttackType: "",
    chainTimer: 0,
    momentum: 0,
    worldSkills: [],
    punchLoadout: { light: "jab", power: "hook", body: "body" },
    lastAttackSlot: "",
    bossPattern: "",
    aiAttackRange: 104,
    aiPhase: 1,
    bossState: {},
  };
}

function createDefaultWorldState() {
  return {
    area: "gym",
    x: WORLD_AREAS.gym.start.x,
    y: WORLD_AREAS.gym.start.y,
    chapter: 1,
    objectiveStep: 0,
    xp: 0,
    level: 1,
    money: 20,
    skillPoints: 0,
    stats: {
      power: 0,
      speed: 0,
      defence: 0,
      endurance: 0,
      chin: 0,
      body: 0,
      technique: 0,
    },
    unlockedSkills: [],
    unlockedPunches: ["jab", "hook", "body"],
    punchLoadout: {
      light: "jab",
      power: "hook",
      body: "body",
    },
    unlockedAreas: ["gym", "oldtown"],
    completedQuests: [],
    defeatedEnemies: [],
    storyChoices: {},
    gymUpgrades: [],
    heardAmbientLines: [],
    sideQuests: {},
    minigameBest: {},
    memoryItems: [],
    dialogue: null,
    upgradeOpen: false,
    menuOpen: false,
    savedAt: 0,
  };
}

function punchMove(id) {
  return PUNCH_MOVES[id] || PUNCH_MOVES.jab;
}

function slotForAction(action) {
  if (action === PUNCH_SLOTS.light.action) return "light";
  if (action === PUNCH_SLOTS.power.action) return "power";
  if (action === PUNCH_SLOTS.body.action) return "body";
  return PUNCH_MOVES[action]?.slot || "";
}

function resolveAttackForFighter(index, type) {
  if (type === "slip") return "slip";
  const directMove = PUNCH_MOVES[type];
  const slot = slotForAction(type);
  if (playMode === "open-world" && index === 0 && slot) {
    const equipped = worldState.punchLoadout?.[slot];
    if (equipped && PUNCH_MOVES[equipped]) return equipped;
  }
  return directMove ? directMove.id : "";
}

function sanitizeUnlockedPunches(source) {
  const unlocked = new Set(DEFAULT_UNLOCKED_PUNCHES);
  if (Array.isArray(source)) {
    source.forEach((id) => {
      if (PUNCH_MOVES[id]) unlocked.add(id);
    });
  }
  return [...unlocked];
}

function sanitizePunchLoadout(loadout, unlocked = DEFAULT_UNLOCKED_PUNCHES) {
  const owned = new Set(unlocked);
  const safe = { ...DEFAULT_PUNCH_LOADOUT };
  Object.keys(PUNCH_SLOTS).forEach((slot) => {
    const moveId = loadout?.[slot];
    const move = PUNCH_MOVES[moveId];
    if (move && move.slot === slot && owned.has(move.id)) safe[slot] = move.id;
  });
  return safe;
}

function punchUnlockForMove(moveId) {
  return WORLD_SKILLS.find((skill) => skill.move === moveId);
}

function isWorldPunchUnlocked(moveId) {
  return (worldState.unlockedPunches || DEFAULT_UNLOCKED_PUNCHES).includes(moveId);
}

function resetFighter(fighter, index) {
  applyFighterStyle(fighter, styleForFighter(index));
  fighter.x = index === 0 ? 356 : 604;
  fighter.y = index === 0 ? 332 : 328;
  fighter.facing = index === 0 ? 1 : -1;
  fighter.headHealth = 100;
  fighter.bodyHealth = 118;
  fighter.staminaCap = 100;
  fighter.stamina = 100;
  fighter.block = 80;
  fighter.guard = false;
  fighter.attack = null;
  fighter.attackCooldown = 0;
  fighter.slipTimer = 0;
  fighter.evadeTimer = 0;
  fighter.slipCooldown = 0;
  fighter.slipDx = 0;
  fighter.slipDy = 0;
  fighter.slipCounterTimer = 0;
  fighter.vulnerable = 0;
  fighter.hitFlash = 0;
  fighter.aiTimer = 0.1;
  fighter.aiMove = "close";
  fighter.stunned = 0;
  fighter.rocked = 0;
  fighter.combo = 0;
  fighter.comboTimer = 0;
  fighter.lastAttackType = "";
  fighter.lastAttackSlot = "";
  fighter.chainTimer = 0;
  fighter.momentum = 0;
  fighter.preferredAttack = "";
  fighter.punchLoadout = { light: "jab", power: "hook", body: "body" };
  fighter.bossPattern = "";
  fighter.aiAttackRange = 104;
  fighter.aiPhase = 1;
  fighter.bossState = {};
  fighter.headHealth = fighter.maxHeadHealth;
  fighter.bodyHealth = fighter.maxBodyHealth;
  fighter.staminaCap = fighter.maxStamina;
  fighter.stamina = fighter.maxStamina;
  fighter.block = fighter.maxBlock;
  updateHealthTotal(fighter);
}

function styleForFighter(index) {
  if (playMode === "ai" && index !== localIndex) return aiStyle;
  if (playMode === "local") return index === 0 ? localStyle : remoteStyle;
  if (playMode === "open-world") return index === 0 ? localStyle : remoteStyle;
  if (playMode === "pvp-host") return index === 0 ? localStyle : remoteStyle;
  if (playMode === "pvp-guest") return index === 1 ? localStyle : remoteStyle;
  return index === localIndex ? localStyle : aiStyle;
}

function applyFighterStyle(fighter, style) {
  const profile = ARCHETYPES[style] || ARCHETYPES.balanced;
  fighter.style = style;
  fighter.styleLabel = profile.label;
  fighter.maxHeadHealth = profile.head;
  fighter.maxBodyHealth = profile.body;
  fighter.maxStamina = profile.stamina;
  fighter.maxBlock = profile.block;
  fighter.power = profile.power;
  fighter.speed = profile.speed;
  fighter.reach = profile.reach;
  fighter.recovery = profile.recovery;
  fighter.counterBonus = profile.counterBonus;
  fighter.toughness = profile.toughness;
}

function resetMatch(modeLabel) {
  fighters.forEach(resetFighter);
  particles.length = 0;
  floaters.length = 0;
  localAttackQueue.length = 0;
  remoteAttackQueue.length = 0;
  pendingAttacks[0] = null;
  pendingAttacks[1] = null;
  roundTime = ROUND_LENGTH;
  resultTitle = "";
  resultSubtitle = "";
  resultBreakdown = "";
  worldResult = null;
  paused = false;
  activeMode = "fight";
  const message = modeLabel === "pvp" ? "PVP match started." : modeLabel === "local" ? "Local 2P match started." : modeLabel === "world" ? `${pendingWorldFight?.name || "Street fight"} started.` : `AI match started against ${ARCHETYPES[aiStyle].label} on ${AI_DIFFICULTY[aiDifficulty].label}.`;
  pushFeed(message);
  hostRematchRequested = false;
  guestRematchRequested = false;
  if (playMode === "pvp-host" && network.connected) {
    sendNet({ type: "rematch-start", state: serializeState() });
  }
  sendStateNow();
  updateUi();
}

function startAiMatch() {
  syncLocalStyle();
  aiDifficulty = ui.difficultySelect.value;
  closeNetwork();
  playMode = "ai";
  localIndex = 0;
  aiStyle = AI_STYLES[Math.floor(Math.random() * AI_STYLES.length)];
  ui.statusLabel.textContent = "VS AI";
  resetMatch("ai");
}

function startLocalMatch() {
  syncLocalStyle();
  closeNetwork();
  playMode = "local";
  localIndex = 0;
  remoteStyle = "brawler";
  ui.statusLabel.textContent = "Local 2P";
  resetMatch("local");
  pushFeed("Local 2P: P1 uses WASD + J/K/U/Shift/Space. P2 uses arrows + 1/2/3/Enter/0.");
}

function startOpenWorld() {
  closeNetwork();
  setActiveSaveSlot(ui.saveSlotSelect?.value || activeSaveSlot);
  playMode = "open-world";
  activeMode = "world";
  localIndex = 0;
  localStyle = "balanced";
  remoteStyle = "brawler";
  pendingWorldFight = null;
  queuedWorldFightId = "";
  activeMinigame = null;
  worldResult = null;
  worldResultUnlockAt = 0;
  paused = false;
  worldState = loadWorldState();
  clampWorldPosition();
  if (!worldState.storyChoices.seenPrologue) setWorldDialogue(WORLD_DIALOGUE.prologue);
  setTutorialVisible(false);
  ui.statusLabel.textContent = "Open World";
  pushFeed("Ringside: Last Bell loaded. Rustbell is waiting.");
  saveWorldState(false);
  updateUi();
}

function exitOpenWorld() {
  saveWorldState(false);
  pendingWorldFight = null;
  queuedWorldFightId = "";
  activeMinigame = null;
  worldResult = null;
  activeMode = "menu";
  playMode = "ai";
  localIndex = 0;
  ui.statusLabel.textContent = "Pick a mode";
  pushFeed("Left open world. Progress saved.");
  updateUi();
}

function startWorldFight(fight) {
  activeMinigame = null;
  pendingWorldFight = { ...fight, returnArea: worldState.area, returnX: worldState.x, returnY: worldState.y };
  playMode = "open-world";
  localIndex = 0;
  localStyle = "balanced";
  remoteStyle = fight.style || "brawler";
  aiDifficulty = fight.difficulty || "easy";
  resetMatch("world");
  applyWorldStatsToFighter(fighters[0]);
  tuneWorldEnemy(fighters[1], fight);
}

function startHostMatch() {
  if (playMode !== "pvp-host") {
    startAiMatch();
    return;
  }
  if (!network.connected) {
    pushFeed("Create a lobby and wait for your friend to join first.");
    return;
  }
  resetMatch("pvp");
}

function restartMatch() {
  if (playMode === "pvp-guest") {
    sendNet({ type: "restart-request" });
    guestRematchRequested = true;
    pushFeed("Rematch request sent.");
    return;
  }
  if (playMode === "pvp-host") {
    hostRematchRequested = true;
    startHostMatch();
    return;
  }
  if (playMode === "local") {
    startLocalMatch();
    return;
  }
  if (playMode === "open-world") {
    startOpenWorld();
    return;
  }
  startAiMatch();
}

function togglePause() {
  if (playMode === "pvp-host" || playMode === "pvp-guest") {
    pushFeed("Online matches cannot be paused.");
    return;
  }
  if (activeMode === "world-minigame") {
    activeMinigame = null;
    activeMode = "world";
    pushFeed("Activity cancelled.");
    updateUi();
    return;
  }
  if (activeMode === "world") {
    if (worldState.menuOpen || worldState.upgradeOpen) {
      worldState.menuOpen = false;
      worldState.upgradeOpen = false;
    } else {
      worldState.menuOpen = true;
    }
    updateUi();
    return;
  }
  if (activeMode !== "fight") return;
  paused = !paused;
  ui.pauseBtn.textContent = paused ? "Resume" : "Pause";
  pushFeed(paused ? "Paused." : "Resumed.");
}

function queueAttack(type) {
  if (activeMode === "world-minigame") {
    initAudio();
    handleMinigameInput(type);
    return;
  }
  if (activeMode === "world-result") {
    continueWorldResult();
    return;
  }
  if (activeMode === "world") {
    initAudio();
    interactWorld();
    return;
  }
  if (activeMode !== "fight") return;
  initAudio();
  const queuedType = queueAttackFor(localIndex, type, input);
  if (playMode === "pvp-guest" && queuedType) localAttackQueue.push(queuedType);
  if (playMode === "pvp-guest") sendInputNow();
}

function queueAttackFor(index, type, controls = input) {
  const resolvedType = resolveAttackForFighter(index, type);
  if (!isAttackType(resolvedType)) return "";
  pendingAttacks[index] = {
    type: resolvedType,
    ttl: INPUT_BUFFER,
    controls: sanitizeInput(controls),
  };
  return resolvedType;
}

function updatePendingAttacks(dt) {
  pendingAttacks.forEach((pending, index) => {
    if (!pending) return;
    pending.ttl -= dt;
    if (pending.ttl <= 0) {
      pendingAttacks[index] = null;
      return;
    }
    const controls = index === 0 ? input : playMode === "local" ? secondInput : remoteInput;
    const executed = startAttack(fighters[index], pending.type, pending.controls || controls);
    const outOfGas = pending.type !== "slip" && fighters[index].attackCooldown <= 0 && fighters[index].stamina < attackConfig(pending.type, fighters[index]).stamina;
    if (executed || outOfGas) {
      pendingAttacks[index] = null;
    }
  });
}

function attackConfig(type, actor = {}) {
  const move = punchMove(type);
  const power = finiteNumber(actor.power, 6);
  const damage = typeof move.damage === "function" ? move.damage(power) : finiteNumber(move.damage, 8);
  const staminaDamage = typeof move.staminaDamage === "function" ? move.staminaDamage(power) : finiteNumber(move.staminaDamage, 2);
  const blockDamage = typeof move.blockDamage === "function" ? move.blockDamage(power) : finiteNumber(move.blockDamage, 8);
  return {
    type: move.id,
    name: move.name,
    short: move.short,
    slot: move.slot,
    attackClass: move.attackClass,
    target: move.target,
    stamina: move.stamina,
    fatigue: move.fatigue,
    damage,
    range: move.range,
    duration: move.duration,
    hitAt: move.hitAt,
    cooldown: move.cooldown,
    knockback: move.knockback,
    staminaDamage,
    blockDamage,
    capDamage: move.capDamage || (move.target === "body" ? 1.7 : 0),
    extraHit: move.extraHit || 0,
    counterDamage: move.counterDamage || 1,
    stunBonus: move.stunBonus || 0,
    missVulnerable: move.missVulnerable || (move.attackClass === "hook" ? 0.46 : 0.2),
  };
}

function startAttack(actor, type, controls = input) {
  if (type === "slip") return startSlip(actor, controls);
  const config = attackConfig(type, actor);
  config.range *= actor.reach;
  const chain = comboChain(actor, type);
  config.damage *= chain.damage;
  config.duration *= chain.duration;
  config.cooldown *= chain.cooldown / Math.max(0.7, actor.recovery);
  config.chainName = chain.name;
  applySpamTax(actor, config, type);
  callBossHook(actor, "beforeAttack", null, config);
  if (actor.attack || actor.attackCooldown > 0 || actor.stamina < config.stamina || actor.stunned > 0) return false;
  actor.attack = {
    ...config,
    elapsed: 0,
    didHit: false,
    landed: false,
  };
  if (config.bossSpecial === "brickOverhand" && actor.bossState) actor.bossState.brickSpecial = false;
  actor.stamina -= config.stamina;
  actor.staminaCap = Math.max(actor.maxStamina * 0.42, actor.staminaCap - config.fatigue);
  actor.attackCooldown = config.cooldown;
  playSound(config.attackClass === "hook" ? "hook" : config.target === "body" ? "body" : "jab");
  return true;
}

function startSlip(actor, controls = input) {
  if (actor.slipCooldown > 0 || actor.stamina < 14 || actor.attack || actor.stunned > 0) return false;
  let dx = 0;
  let dy = 0;
  if (controls.left) dx -= 1;
  if (controls.right) dx += 1;
  if (controls.up) dy -= 0.75;
  if (controls.down) dy += 0.75;
  if (!dx && !dy) dx = -actor.facing;
  const length = Math.hypot(dx, dy) || 1;
  actor.slipDx = dx / length;
  actor.slipDy = dy / length;
  actor.slipTimer = 0.22;
  actor.evadeTimer = 0.16;
  actor.slipCooldown = 0.72 / Math.max(0.75, actor.recovery);
  actor.stamina = Math.max(0, actor.stamina - 14);
  actor.staminaCap = Math.max(actor.maxStamina * 0.42, actor.staminaCap - 1.2);
  addFloater(actor.x, actor.y - 132, "SLIP", "#9eb7ff");
  playSound("slip");
  return true;
}

function comboChain(actor, nextType) {
  if (actor.chainTimer <= 0) return { name: "", damage: 1, duration: 1, cooldown: 1 };
  const lastSlot = actor.lastAttackSlot || PUNCH_MOVES[actor.lastAttackType]?.slot || "";
  const nextSlot = PUNCH_MOVES[nextType]?.slot || "";
  if (lastSlot === "light" && nextSlot === "power") {
    return { name: "SETUP SHOT", damage: 1.12, duration: 0.88, cooldown: 0.78 };
  }
  if (lastSlot === "body" && nextSlot === "power") {
    return { name: "BODY-POWER", damage: 1.2, duration: 0.96, cooldown: 0.88 };
  }
  if (lastSlot === "light" && nextSlot === "body") {
    return { name: "LEVEL CHANGE", damage: 1.08, duration: 0.9, cooldown: 0.82 };
  }
  if (lastSlot === "power" && nextSlot === "light") {
    return { name: "RESET JAB", damage: 1.04, duration: 0.84, cooldown: 0.76 };
  }
  return { name: "", damage: 1, duration: 1, cooldown: 1 };
}

function applySpamTax(actor, config, type) {
  const comboPressure = actor.comboTimer > 0 ? clamp(actor.combo, 0, 6) : 0;
  const repeated = actor.lastAttackType === type && actor.chainTimer > 0;
  const repeatedSlot = actor.lastAttackSlot === config.slot && actor.chainTimer > 0 && !repeated;
  const tax = 1 + comboPressure * 0.18 + (repeated ? 0.28 : repeatedSlot ? 0.12 : 0);
  config.stamina = Math.round(config.stamina * tax);
  config.fatigue *= 1 + comboPressure * 0.22 + (repeated ? 0.36 : repeatedSlot ? 0.15 : 0);
  config.cooldown *= 1 + comboPressure * 0.045;
}

function updateFight(dt) {
  if (playMode === "pvp-guest") {
    updateParticles(dt);
    inputSendTimer -= dt;
    if (inputSendTimer <= 0) sendInputNow();
    return;
  }

  roundTime = Math.max(0, roundTime - dt);

  while (remoteAttackQueue.length) {
    queueAttackFor(1, remoteAttackQueue.shift(), remoteInput);
  }
  updatePendingAttacks(dt);

  updateControlledFighter(fighters[0], fighters[1], localIndex === 0 ? input : remoteInput, dt);
  if (playMode === "pvp-host") {
    updateControlledFighter(fighters[1], fighters[0], localIndex === 1 ? input : remoteInput, dt);
  } else if (playMode === "local") {
    updateControlledFighter(fighters[1], fighters[0], secondInput, dt);
  } else {
    updateAiFighter(fighters[1], fighters[0], dt);
  }

  separateFighters();
  updateFighter(fighters[0], fighters[1], dt);
  updateFighter(fighters[1], fighters[0], dt);
  separateFighters();
  updateParticles(dt);

  if (isFighterOut(fighters[0])) {
    finishMatch(fighters[1], "Knockout");
  } else if (isFighterOut(fighters[1])) {
    finishMatch(fighters[0], "Knockout");
  } else if (roundTime <= 0) {
    finishDecision();
  }

  netSendTimer -= dt;
  if (netSendTimer <= 0) sendStateNow();
}

function updateControlledFighter(actor, target, controls, dt) {
  const guardActive = controls.guard && actor.stamina > 1 && actor.block > 0 && !actor.attack;
  actor.guard = guardActive;
  if (actor.guard) actor.stamina = Math.max(0, actor.stamina - PLAYER_GUARD_DRAIN * dt);

  let dx = 0;
  let dy = 0;
  if (controls.left) dx -= 1;
  if (controls.right) dx += 1;
  if (controls.up) dy -= 1;
  if (controls.down) dy += 1;
  if (actor.slipTimer > 0) {
    dx = actor.slipDx;
    dy = actor.slipDy;
    actor.guard = false;
  }
  moveFighter(actor, dx, dy, dt, actor.guard ? 0.48 : 1);
  actor.facing = target.x >= actor.x ? 1 : -1;
}

function updateAiFighter(actor, target, dt) {
  const diff = AI_DIFFICULTY[aiDifficulty] || AI_DIFFICULTY.normal;
  const dist = distance(actor, target);
  const tactic = aiTactic(actor, target);
  if (actor.bossPattern && actor.aiPhase !== tactic.phase) {
    const oldPhase = actor.aiPhase;
    actor.aiPhase = tactic.phase;
    callBossHook(actor, "onPhaseChange", oldPhase, tactic.phase);
    if (!bossMechanicFor(actor)?.onPhaseChange) addFloater(actor.x, actor.y - 158, tactic.phase > 1 ? `PHASE ${tactic.phase}` : "RESET", "#fff0a8");
  }
  if (!updateBossMechanic(actor, target, dt)) return;
  actor.aiTimer -= dt;

  if (actor.aiTimer <= 0) {
    const roll = Math.random();
    actor.aiMove = chooseAiMove(actor, target, roll, tactic);
    actor.aiTimer = (0.22 + Math.random() * 0.38) * diff.reaction * tactic.reaction;
  }

  const staminaRatio = actor.stamina / Math.max(1, actor.staminaCap);
  const reactiveGuard = target.attack && dist < 122 && Math.random() < 0.024 * diff.guard * tactic.guard;
  const plannedGuard = actor.aiMove === "guard" && (target.attack || dist < 108) && staminaRatio > 0.34;
  const shouldGuard = reactiveGuard || plannedGuard;
  actor.guard = shouldGuard && actor.stamina > AI_GUARD_STAMINA_FLOOR && actor.block > 0 && !actor.attack;
  if (actor.guard) actor.stamina = Math.max(0, actor.stamina - AI_GUARD_DRAIN * dt);

  if (target.attack?.attackClass === "hook" && dist < 116 && actor.slipCooldown <= 0 && Math.random() < 0.026 * diff.slip * tactic.slip) {
    startSlip(actor, { left: actor.facing > 0, right: actor.facing < 0, up: Math.random() < 0.5, down: false });
  }

  let dx = 0;
  let dy = 0;
  if (actor.stunned <= 0 && !actor.attack) {
    const towardX = Math.sign(target.x - actor.x);
    const towardY = Math.sign(target.y - actor.y);
    const desiredSpace = target.vulnerable > 0 ? tactic.punishSpace : tactic.desiredSpace * diff.spacing;
    if (dist > desiredSpace || (actor.aiMove === "close" && dist > 88)) {
      dx += towardX;
      dy += towardY * 0.45;
    }
    if (dist < 72) {
      dx -= towardX * 1.35;
      dy -= towardY * 0.9;
    }
    if (actor.aiMove === "circle") {
      dx += -towardY * 0.65;
      dy += towardX * 0.65;
    }
    if (actor.aiMove === "back" && dist < 134) {
      dx -= towardX;
      dy -= towardY * 0.6;
    }
    if (actor.slipTimer > 0) {
      dx = actor.slipDx;
      dy = actor.slipDy;
    }
  }

  moveFighter(actor, dx, dy, dt, (actor.guard ? 0.42 : 0.9) * tactic.moveSpeed);
  actor.facing = target.x >= actor.x ? 1 : -1;

  const punishChance = target.vulnerable > 0 ? diff.punish : 1;
  const rangePressure = dist < tactic.attackRange * 0.82 ? 1.24 : 1;
  const tiredTarget = target.stamina < 30 || target.rocked > 0 ? 1.28 : 1;
  if (dist < tactic.attackRange && actor.attackCooldown <= 0 && actor.stunned <= 0 && Math.random() < 1.45 * diff.attack * tactic.attack * punishChance * rangePressure * tiredTarget * dt) {
    startAttack(actor, chooseAiAttack(actor, target, tactic, Math.random()));
  }
}

function aiTactic(actor, target) {
  const pattern = actor.bossPattern || "";
  const hp = healthPercent(actor);
  const phase = pattern === "champion" ? (hp < 0.3 ? 3 : hp < 0.64 ? 2 : 1) : pattern && hp < (pattern === "needle" || pattern === "runner" ? 0.55 : 0.46) ? 2 : 1;
  const base = {
    pattern,
    phase,
    desiredSpace: actor.aiAttackRange || 104,
    punishSpace: 96,
    attackRange: actor.aiAttackRange || 104,
    attack: 1,
    guard: 1,
    slip: 1,
    reaction: 1,
    moveSpeed: 1,
  };
  if (pattern === "brick") return { ...base, desiredSpace: phase === 2 ? 72 : 82, attackRange: 108, attack: phase === 2 ? 1.58 : 1.32, guard: 0.55, slip: 0.35, reaction: 1.02, moveSpeed: 0.92 };
  if (pattern === "needle") {
    const trapped = ringPressure(actor).ropes;
    return { ...base, desiredSpace: trapped ? 102 : phase === 2 ? 112 : 130, attackRange: 136, attack: 1.18, guard: 1.45, slip: trapped ? 1.05 : 1.75, reaction: 0.72, moveSpeed: trapped ? 0.98 : 1.16 };
  }
  if (pattern === "runner") return { ...base, desiredSpace: phase === 2 ? 124 : 138, attackRange: 132, attack: 1.05, guard: 0.72, slip: 1.45, reaction: 0.78, moveSpeed: 1.18 };
  if (pattern === "bodyHunter") return { ...base, desiredSpace: 88, attackRange: 112, attack: 1.34, guard: 1.05, slip: 0.85, reaction: 0.9, moveSpeed: 1.02 };
  if (pattern === "tank") return { ...base, desiredSpace: 76, attackRange: 106, attack: 1.28, guard: 1.6, slip: 0.28, reaction: 1.05, moveSpeed: 0.88 };
  if (pattern === "slugger") return { ...base, desiredSpace: 84, attackRange: 110, attack: 1.4, guard: 0.85, slip: 0.65, reaction: 0.94, moveSpeed: 0.98 };
  if (pattern === "counter") return { ...base, desiredSpace: 106, attackRange: 116, attack: 1.12, guard: 1.22, slip: 1.3, reaction: 0.82, moveSpeed: 1.06 };
  if (pattern === "pressure") {
    const burst = actor.bossState?.pressureBurst > 0;
    return { ...base, desiredSpace: burst ? 62 : 72, punishSpace: 82, attackRange: 116, attack: burst ? 1.95 : phase === 2 ? 1.72 : 1.48, guard: 1.1, slip: 0.7, reaction: burst ? 0.66 : 0.78, moveSpeed: burst ? 1.18 : 1.08 };
  }
  if (pattern === "darius") return { ...base, desiredSpace: phase === 2 ? 86 : 112, punishSpace: 86, attackRange: 124, attack: phase === 2 ? 1.5 : 1.2, guard: 1.18, slip: 1.42, reaction: 0.7, moveSpeed: 1.08 };
  if (pattern === "champion") {
    if (phase === 3) return { ...base, desiredSpace: 96, punishSpace: 78, attackRange: 128, attack: 1.56, guard: 1.36, slip: 1.65, reaction: 0.58, moveSpeed: 1.03 };
    if (phase === 2) return { ...base, desiredSpace: 78, punishSpace: 82, attackRange: 124, attack: 1.76, guard: 1, slip: 0.92, reaction: 0.66, moveSpeed: 1.12 };
    return { ...base, desiredSpace: 122, punishSpace: 92, attackRange: 132, attack: 1.28, guard: 1.55, slip: 1.22, reaction: 0.6, moveSpeed: 1.06 };
  }
  return base;
}

function chooseAiMove(actor, target, roll, tactic) {
  if (actor.stamina < 30 || actor.staminaCap < 48) return roll < 0.7 ? "back" : "circle";
  if (target.stamina < 28 || target.rocked > 0) return roll < 0.72 ? "close" : "circle";
  if (PUNCH_MOVES[target.lastAttackType]?.attackClass === "hook" && target.chainTimer > 0) return roll < 0.56 ? "guard" : "circle";

  if (tactic.pattern === "brick") return roll < (tactic.phase === 2 ? 0.76 : 0.62) ? "close" : roll < 0.84 ? "guard" : "circle";
  if (tactic.pattern === "needle") return roll < 0.42 ? "circle" : roll < 0.72 ? "back" : roll < 0.9 ? "guard" : "close";
  if (tactic.pattern === "runner") return roll < 0.52 ? "back" : roll < 0.86 ? "circle" : "guard";
  if (tactic.pattern === "bodyHunter") return roll < 0.55 ? "close" : roll < 0.78 ? "circle" : "guard";
  if (tactic.pattern === "tank") return roll < 0.7 ? "close" : roll < 0.92 ? "guard" : "circle";
  if (tactic.pattern === "slugger") return roll < 0.6 ? "close" : roll < 0.82 ? "circle" : "guard";
  if (tactic.pattern === "counter") return roll < 0.38 ? "guard" : roll < 0.72 ? "circle" : roll < 0.9 ? "back" : "close";
  if (tactic.pattern === "pressure") return roll < 0.74 ? "close" : roll < 0.9 ? "circle" : "guard";
  if (tactic.pattern === "darius") return tactic.phase === 2 ? (roll < 0.58 ? "close" : roll < 0.82 ? "circle" : "guard") : (roll < 0.46 ? "circle" : roll < 0.72 ? "guard" : roll < 0.9 ? "back" : "close");
  if (tactic.pattern === "champion") {
    if (tactic.phase === 3) return roll < 0.44 ? "guard" : roll < 0.74 ? "circle" : roll < 0.9 ? "back" : "close";
    if (tactic.phase === 2) return roll < 0.66 ? "close" : roll < 0.86 ? "circle" : "guard";
    return roll < 0.42 ? "circle" : roll < 0.72 ? "guard" : roll < 0.88 ? "back" : "close";
  }
  return roll < 0.44 ? "close" : roll < 0.68 ? "circle" : roll < 0.88 ? "guard" : "back";
}

function chooseAiAttack(actor, target, tactic, roll) {
  if (target.guard || target.stamina < 34) {
    if (tactic.pattern === "bodyHunter") return roll < 0.58 ? "liverShot" : roll < 0.84 ? "shovelHook" : "body";
    if (tactic.pattern === "tank") return roll < 0.45 ? "uppercut" : "body";
    if (tactic.pattern === "needle" && roll < 0.45) return "cross";
    return roll < 0.55 ? "body" : "shovelHook";
  }
  if (target.vulnerable > 0) {
    if (tactic.pattern === "counter") return roll < 0.5 ? "checkHook" : roll < 0.8 ? "cross" : "uppercut";
    if (tactic.pattern === "needle") return roll < 0.64 ? "cross" : "checkHook";
    if (tactic.pattern === "brick" || tactic.pattern === "slugger") return roll < 0.62 ? "overhand" : "hook";
    return roll < 0.55 ? "hook" : "cross";
  }
  if (tactic.pattern === "brick") return roll < (tactic.phase === 2 ? 0.48 : 0.32) ? "overhand" : roll < 0.72 ? "hook" : roll < 0.88 ? "uppercut" : "body";
  if (tactic.pattern === "needle") return roll < 0.45 ? "doubleJab" : roll < 0.72 ? "cross" : roll < 0.88 ? "checkHook" : "body";
  if (tactic.pattern === "runner") return roll < 0.52 ? "doubleJab" : roll < 0.78 ? "cross" : roll < 0.9 ? "body" : "checkHook";
  if (tactic.pattern === "bodyHunter") return roll < 0.48 ? "liverShot" : roll < 0.72 ? "shovelHook" : roll < 0.88 ? "body" : "cross";
  if (tactic.pattern === "tank") return roll < 0.36 ? "uppercut" : roll < 0.62 ? "shovelHook" : roll < 0.84 ? "hook" : "body";
  if (tactic.pattern === "slugger") return roll < 0.42 ? "overhand" : roll < 0.72 ? "hook" : roll < 0.9 ? "shovelHook" : "jab";
  if (tactic.pattern === "counter") return roll < 0.38 ? "checkHook" : roll < 0.68 ? "cross" : roll < 0.86 ? "uppercut" : "body";
  if (tactic.pattern === "pressure") return roll < 0.34 ? "shovelHook" : roll < 0.58 ? "uppercut" : roll < 0.78 ? "hook" : roll < 0.92 ? "liverShot" : "jab";
  if (tactic.pattern === "darius") return tactic.phase === 2 ? (roll < 0.32 ? "uppercut" : roll < 0.6 ? "checkHook" : roll < 0.82 ? "cross" : "body") : (roll < 0.4 ? "cross" : roll < 0.68 ? "checkHook" : roll < 0.86 ? "doubleJab" : "body");
  if (tactic.pattern === "champion") {
    if (tactic.phase === 3) return roll < 0.34 ? "checkHook" : roll < 0.62 ? "cross" : roll < 0.82 ? "uppercut" : "liverShot";
    if (tactic.phase === 2) return roll < 0.34 ? "overhand" : roll < 0.62 ? "hook" : roll < 0.84 ? "shovelHook" : "uppercut";
    return roll < 0.34 ? "doubleJab" : roll < 0.62 ? "cross" : roll < 0.82 ? "checkHook" : "body";
  }
  const basePick = roll < 0.2 ? "body" : roll < 0.48 ? "hook" : roll < 0.7 ? "cross" : "jab";
  return actor.preferredAttack && Math.random() < 0.54 ? actor.preferredAttack : basePick;
}

function moveFighter(fighter, dx, dy, dt, multiplier) {
  if (fighter.stunned > 0) {
    dx = 0;
    dy = 0;
  }
  const length = Math.hypot(dx, dy) || 1;
  const staminaRatio = clamp(fighter.stamina / Math.max(1, fighter.staminaCap), 0, 1);
  const fatigue = 0.46 + 0.54 * staminaRatio;
  const rockedDrag = fighter.rocked > 0 ? 0.62 : 1;
  const slipBoost = fighter.slipTimer > 0 ? 2.15 : 1;
  const edgeDrag = ringEdgeDrag(fighter, dx / length, dy / length);
  const speed = (128 + fighter.speed * 8) * multiplier * fatigue * rockedDrag * slipBoost * edgeDrag;
  const attackDrag = fighter.attack ? 0.44 : 1;
  fighter.x += (dx / length) * speed * attackDrag * dt;
  fighter.y += (dy / length) * speed * attackDrag * dt;
  fighter.x = clamp(fighter.x, RING.left + 36, RING.right - 36);
  fighter.y = clamp(fighter.y, RING.top + 38, RING.bottom - 12);
}

function ringEdgeDrag(fighter, dx, dy) {
  const nearLeft = fighter.x < RING.left + 58 && dx < 0;
  const nearRight = fighter.x > RING.right - 58 && dx > 0;
  const nearTop = fighter.y < RING.top + 58 && dy < 0;
  const nearBottom = fighter.y > RING.bottom - 32 && dy > 0;
  if (!(nearLeft || nearRight || nearTop || nearBottom)) return 1;
  if (["mason-brick-doyle", "nero-black"].includes(pendingWorldFight?.id)) return 0.42;
  return 0.52;
}

function separateFighters() {
  const dx = fighters[1].x - fighters[0].x;
  const dy = (fighters[1].y - fighters[0].y) * 1.15;
  const dist = Math.hypot(dx, dy);
  if (dist >= MIN_FIGHTER_SPACE) return;

  const nx = dist > 0.01 ? dx / dist : fighters[0].facing;
  const ny = dist > 0.01 ? dy / dist : 0;
  const overlap = MIN_FIGHTER_SPACE - dist;
  const firstShare = fighters[1].attack ? 0.64 : 0.5;
  const secondShare = fighters[0].attack ? 0.64 : 0.5;
  const totalShare = firstShare + secondShare;

  fighters[0].x -= nx * overlap * (firstShare / totalShare);
  fighters[1].x += nx * overlap * (secondShare / totalShare);
  fighters[0].y -= (ny / 1.15) * overlap * (firstShare / totalShare);
  fighters[1].y += (ny / 1.15) * overlap * (secondShare / totalShare);

  fighters.forEach((fighter) => {
    fighter.x = clamp(fighter.x, RING.left + 36, RING.right - 36);
    fighter.y = clamp(fighter.y, RING.top + 38, RING.bottom - 12);
  });
}

function updateFighter(actor, target, dt) {
  actor.attackCooldown = Math.max(0, actor.attackCooldown - dt);
  actor.slipCooldown = Math.max(0, actor.slipCooldown - dt);
  actor.slipTimer = Math.max(0, actor.slipTimer - dt);
  actor.evadeTimer = Math.max(0, actor.evadeTimer - dt);
  actor.slipCounterTimer = Math.max(0, actor.slipCounterTimer - dt);
  actor.vulnerable = Math.max(0, actor.vulnerable - dt);
  actor.chainTimer = Math.max(0, actor.chainTimer - dt);
  actor.hitFlash = Math.max(0, actor.hitFlash - dt);
  actor.stunned = Math.max(0, actor.stunned - dt);
  actor.rocked = Math.max(0, actor.rocked - dt);
  actor.momentum *= Math.pow(0.22, dt);
  actor.comboTimer = Math.max(0, actor.comboTimer - dt);
  if (actor.comboTimer <= 0) actor.combo = 0;

  if (!actor.guard && actor.block < actor.maxBlock) {
    actor.block = Math.min(actor.maxBlock, actor.block + (18 + actor.speed * 1.6) * actor.recovery * dt);
  }
  if (!actor.attack && actor.staminaCap < actor.maxStamina) {
    actor.staminaCap = Math.min(actor.maxStamina, actor.staminaCap + 1.2 * actor.recovery * dt);
  }
  if (!actor.guard && !actor.attack && actor.stunned <= 0) {
    const bodyBonus = 0.72 + bodyPercent(actor) * 0.28;
    actor.stamina = Math.min(actor.staminaCap, actor.stamina + (10 + actor.speed * 0.45) * bodyBonus * actor.recovery * dt);
  }

  if (!actor.attack) return;
  actor.attack.elapsed += dt;
  const attack = actor.attack;

  if (!attack.didHit && attack.elapsed >= attack.hitAt) {
    attack.didHit = true;
    resolveHit(actor, target, attack);
  }

  if (attack.elapsed >= attack.duration) {
    if (!attack.landed && attack.missVulnerable) actor.vulnerable = Math.max(actor.vulnerable, attack.missVulnerable);
    callBossHook(actor, "afterAttack", target, attack, { hit: attack.landed, source: "actor" });
    callBossHook(target, "afterAttack", actor, attack, { hit: attack.landed, source: "target" });
    actor.attack = null;
  }
}

function resolveHit(actor, target, attack) {
  const dx = target.x - actor.x;
  const dy = (target.y - actor.y) * 1.25;
  const inFront = Math.sign(dx || actor.facing) === actor.facing || Math.abs(dx) < 24;
  const closeEnough = Math.hypot(dx, dy) <= attack.range;

  if (!inFront || !closeEnough) {
    addFloater(actor.x + actor.facing * 58, actor.y - 94, "MISS", "#fff7e8");
    if (attack.missVulnerable) actor.vulnerable = Math.max(actor.vulnerable, attack.missVulnerable);
    return;
  }

  if (target.evadeTimer > 0) {
    target.slipCounterTimer = 0.5;
    actor.vulnerable = Math.max(actor.vulnerable, Math.max(0.24, attack.missVulnerable * 0.85));
    addFloater(target.x, target.y - 134, "SLIPPED", "#9eb7ff");
    addHitStop(0.035);
    return;
  }

  const counterHit = (target.attack && !target.guard) || target.vulnerable > 0;
  const slipCounter = actor.slipCounterTimer > 0;
  const pressure = ringPressure(target);
  let damage = attack.damage * attackPowerFactor(actor);
  if (counterHit) damage *= actor.counterBonus * (attack.counterDamage || 1);
  if (slipCounter) damage *= 1.22;
  if (pressure.cornered) damage *= 1.16;
  else if (pressure.ropes) damage *= 1.08;
  damage /= target.toughness;
  let blocked = false;
  let blockBroken = false;
  const guardFacing = Math.sign(actor.x - target.x || target.facing) === target.facing || Math.abs(dx) < 28;
  if (target.guard && target.block > 0 && target.stamina > 0 && guardFacing) {
    blocked = true;
    const blockBefore = target.block;
    const guardCost = attack.attackClass === "hook" ? 9 : attack.target === "body" ? 7 : 4;
    const exhaustionBreak = target.stamina < 24 ? 1.45 : 1;
    target.block = Math.max(0, target.block - attack.blockDamage * exhaustionBreak);
    target.stamina = Math.max(0, target.stamina - guardCost);
    blockBroken = blockBefore > 0 && target.block <= 0;
    damage *= blockBroken ? 0.68 : attack.attackClass === "hook" ? 0.4 : attack.target === "body" ? 0.46 : 0.24;
    if (blockBroken) {
      target.guard = false;
      target.stunned = Math.max(target.stunned, 0.18);
      playSound("break");
    }
  }

  const crit = Math.random() < (counterHit ? 0.11 : 0.06);
  if (crit) damage *= 1.42;
  const damageInfo = { damage, blocked, blockBroken, counterHit, pressure, crit, extraCapDamage: 0 };
  callBossHook(actor, "beforeDamage", target, attack, damageInfo);
  callBossHook(target, "beforeDamage", actor, attack, damageInfo);
  damage = damageInfo.damage;
  damage = Math.max(2, Math.round(damage));
  damageInfo.damage = damage;

  if (attack.target === "body") {
    target.bodyHealth = Math.max(0, target.bodyHealth - damage);
    target.stamina = Math.max(0, target.stamina - Math.round(attack.staminaDamage * (blocked ? 0.45 : 1)));
    target.staminaCap = Math.max(target.maxStamina * 0.35, target.staminaCap - (blocked ? attack.capDamage * 0.32 : attack.capDamage) - (damageInfo.extraCapDamage || 0));
  } else {
    target.headHealth = Math.max(0, target.headHealth - damage);
    target.stamina = Math.max(0, target.stamina - Math.round(attack.staminaDamage * (blocked ? 0.35 : 1)));
  }
  if (!blocked && attack.extraHit > 0) {
    const extraDamage = Math.max(1, Math.round(damage * attack.extraHit * (counterHit ? 0.9 : 1)));
    if (attack.target === "body") {
      target.bodyHealth = Math.max(0, target.bodyHealth - extraDamage);
      target.stamina = Math.max(0, target.stamina - Math.round(attack.staminaDamage * 0.34));
    } else {
      target.headHealth = Math.max(0, target.headHealth - extraDamage);
      target.stamina = Math.max(0, target.stamina - Math.round(attack.staminaDamage * 0.22));
    }
    damage += extraDamage;
    addFloater(target.x + actor.facing * 18, target.y - 104, "2nd", "#fff0a8");
  }
  attack.landed = true;
  updateHealthTotal(target);
  target.hitFlash = 0.16;

  if (!blocked || blockBroken) {
    const headDanger = attack.target === "head" && (crit || damage >= 18 || headPercent(target) < 0.3);
    const bodyDanger = attack.target === "body" && (damage >= 17 || bodyPercent(target) < 0.28);
    if (headDanger) {
      target.rocked = Math.max(target.rocked, attack.attackClass === "hook" ? 1.8 : 1.1);
      target.stunned = Math.max(target.stunned, attack.attackClass === "hook" ? 0.28 : 0.14);
    } else if (bodyDanger) {
      target.rocked = Math.max(target.rocked, 0.9);
      target.stunned = Math.max(target.stunned, 0.16);
    } else {
      target.stunned = Math.max(target.stunned, attack.attackClass === "hook" ? 0.12 : 0.05);
    }
    if (attack.stunBonus) target.stunned = Math.max(target.stunned, attack.stunBonus);
    if (counterHit) {
      target.stunned = Math.max(target.stunned, 0.22);
      target.rocked = Math.max(target.rocked, 0.55);
    }
    if (pressure.cornered) target.stunned = Math.max(target.stunned, 0.14);
  }

  const pressureKnockback = pressure.ropes ? 0.45 : 1;
  target.x += actor.facing * attack.knockback * pressureKnockback * (blocked ? 0.35 : 1);
  target.y += Math.sign(target.y - actor.y || Math.random() - 0.5) * attack.knockback * 0.18 * pressureKnockback * (blocked ? 0.2 : 1);
  target.x = clamp(target.x, RING.left + 36, RING.right - 36);
  target.y = clamp(target.y, RING.top + 38, RING.bottom - 12);

  const color = blocked ? "#79d1a2" : counterHit ? "#fff0a8" : crit ? "#fff0a8" : "#f26b55";
  const moveCallout = ["jab", "hook", "body"].includes(attack.type) ? "" : String(attack.short || attack.name || "").toUpperCase();
  const prefix = blockBroken ? "BLOCK BREAK" : blocked ? "BLOCK" : counterHit ? "COUNTER" : moveCallout || (pressure.cornered ? "CORNER" : pressure.ropes ? "ROPES" : attack.target === "body" ? "BODY" : "");
  const label = prefix ? `${prefix} ${blocked || blockBroken ? "" : damage}`.trim() : String(damage);
  addFloater(target.x, target.y - 122, label, color);
  if (attack.chainName && !blocked) addFloater(actor.x, actor.y - 146, attack.chainName, "#fff0a8");
  const impactX = target.x - actor.facing * 16;
  const impactY = target.y - (attack.target === "body" ? 62 : 82);
  burst(impactX, impactY, color, crit ? 16 : 9);
  hitSpark(impactX, impactY, color, blocked ? 0.65 : counterHit || crit ? 1.35 : 1);
  if (blocked && !blockBroken) playSound("block");
  if (!blocked) playSound("hit");
  addShake(attack.attackClass === "hook" ? 11 : counterHit ? 8 : 4);
  addHitStop(counterHit ? 0.085 : attack.attackClass === "hook" ? 0.055 : 0.035);
  addFlash(counterHit || crit ? 0.18 : 0.08);

  actor.combo += 1;
  actor.comboTimer = 2.1;
  actor.lastAttackType = attack.type;
  actor.lastAttackSlot = attack.slot;
  actor.chainTimer = 0.85;
  actor.momentum = clamp(actor.momentum + (counterHit ? 18 : 9), -100, 100);
  target.momentum = clamp(target.momentum - (counterHit ? 18 : 9), -100, 100);
  callBossHook(actor, "afterHit", target, attack, damageInfo);
  callBossHook(target, "afterTargetHit", actor, attack, damageInfo);
}

function attackPowerFactor(actor) {
  const stamina = clamp(actor.stamina / Math.max(1, actor.staminaCap), 0, 1);
  return 0.18 + 0.82 * Math.pow(stamina, 1.45);
}

function ringPressure(fighter) {
  const nearLeft = fighter.x < RING.left + 64;
  const nearRight = fighter.x > RING.right - 64;
  const nearTop = fighter.y < RING.top + 56;
  const nearBottom = fighter.y > RING.bottom - 34;
  const ropeCount = [nearLeft, nearRight, nearTop, nearBottom].filter(Boolean).length;
  return {
    ropes: ropeCount > 0,
    cornered: ropeCount >= 2,
  };
}

function finishMatch(winner, method) {
  if (activeMode !== "fight") return;
  if (pendingWorldFight) {
    const localWon = winner === fighters[0] && method !== "draw";
    const subtitle = method === "draw" ? "The street fight ended even." : `${winner.name} wins by ${method}.`;
    pushFeed(subtitle);
    playSound("result");
    completeWorldFight(localWon, method);
    return;
  }
  activeMode = "result";
  const localWon = winner === fighters[localIndex];
  resultTitle = method === "draw" ? "Draw" : localWon ? "You Win" : "You Lose";
  resultSubtitle = method === "draw" ? "The judges could not split it." : `${winner.name} wins by ${method}.`;
  pushFeed(resultSubtitle);
  playSound("result");
  sendStateNow();
}

function finishDecision() {
  const parts = fighters.map((fighter) => {
    const opponent = fighter === fighters[0] ? fighters[1] : fighters[0];
    const ringControl = ringPressure(opponent).cornered ? 0.06 : ringPressure(opponent).ropes ? 0.03 : 0;
    const momentumScore = clamp(fighter.momentum / 100, -0.08, 0.08);
    return {
      health: healthPercent(fighter) * 0.64,
      stamina: staminaPercent(fighter) * 0.16,
      block: blockPercent(fighter) * 0.1,
      ring: ringControl,
      momentum: momentumScore,
    };
  });
  const scores = parts.map((part) => part.health + part.stamina + part.block + part.ring + part.momentum);
  resultBreakdown = `Red ${scores[0].toFixed(2)} vs Blue ${scores[1].toFixed(2)} | Health ${parts[0].health.toFixed(2)}-${parts[1].health.toFixed(2)}, Stamina ${parts[0].stamina.toFixed(2)}-${parts[1].stamina.toFixed(2)}, Block ${parts[0].block.toFixed(2)}-${parts[1].block.toFixed(2)}, Ring ${parts[0].ring.toFixed(2)}-${parts[1].ring.toFixed(2)}, Momentum ${parts[0].momentum.toFixed(2)}-${parts[1].momentum.toFixed(2)}`;
  if (Math.abs(scores[0] - scores[1]) < 0.025) {
    finishMatch(fighters[localIndex], "draw");
  } else {
    finishMatch(scores[0] > scores[1] ? fighters[0] : fighters[1], "decision");
  }
}

function updateHealthTotal(fighter) {
  fighter.maxHealth = Math.round(fighter.maxHeadHealth * 0.68 + fighter.maxBodyHealth * 0.32);
  fighter.health = Math.round(fighter.headHealth * 0.68 + fighter.bodyHealth * 0.32);
}

function healthPercent(fighter) {
  return fighter.maxHealth ? fighter.health / fighter.maxHealth : 0;
}

function headPercent(fighter) {
  return fighter.maxHeadHealth ? fighter.headHealth / fighter.maxHeadHealth : 0;
}

function bodyPercent(fighter) {
  return fighter.maxBodyHealth ? fighter.bodyHealth / fighter.maxBodyHealth : 0;
}

function staminaPercent(fighter) {
  return fighter.maxStamina ? fighter.stamina / fighter.maxStamina : 0;
}

function blockPercent(fighter) {
  return fighter.maxBlock ? fighter.block / fighter.maxBlock : 0;
}

function isFighterOut(fighter) {
  return fighter.headHealth <= 0 || fighter.bodyHealth <= 0 || fighter.health <= 0;
}

function worldXpNeeded(level = worldState.level) {
  return 60 + (level - 1) * 45;
}

function worldSaveKey(slot = activeSaveSlot) {
  return `${WORLD_SAVE_KEY}:${WORLD_SAVE_SLOTS.includes(slot) ? slot : "slot1"}`;
}

function loadActiveSaveSlot() {
  try {
    const stored = localStorage.getItem(WORLD_SAVE_SLOT_KEY);
    activeSaveSlot = WORLD_SAVE_SLOTS.includes(stored) ? stored : "slot1";
  } catch {
    activeSaveSlot = "slot1";
  }
  if (ui.saveSlotSelect) ui.saveSlotSelect.value = activeSaveSlot;
}

function setActiveSaveSlot(slot) {
  activeSaveSlot = WORLD_SAVE_SLOTS.includes(slot) ? slot : "slot1";
  try {
    localStorage.setItem(WORLD_SAVE_SLOT_KEY, activeSaveSlot);
  } catch {
    // Slot choice is nice to have; saves still work with the in-memory slot.
  }
}

function loadWorldState() {
  const fallback = createDefaultWorldState();
  try {
    const raw = localStorage.getItem(worldSaveKey()) || (activeSaveSlot === "slot1" ? localStorage.getItem(WORLD_SAVE_KEY) : "");
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return sanitizeWorldState({ ...fallback, ...parsed, stats: { ...fallback.stats, ...(parsed.stats || {}) } });
  } catch {
    return fallback;
  }
}

function sanitizeWorldState(state) {
  const safe = createDefaultWorldState();
  safe.area = WORLD_AREAS[state.area] ? state.area : "gym";
  safe.x = finiteNumber(state.x, WORLD_AREAS[safe.area].start.x);
  safe.y = finiteNumber(state.y, WORLD_AREAS[safe.area].start.y);
  safe.chapter = clamp(Math.round(finiteNumber(state.chapter, 1)), 1, 7);
  safe.objectiveStep = clamp(Math.round(finiteNumber(state.objectiveStep, 0)), 0, 99);
  safe.xp = clamp(Math.round(finiteNumber(state.xp, 0)), 0, 99999);
  safe.level = clamp(Math.round(finiteNumber(state.level, 1)), 1, 50);
  safe.money = clamp(Math.round(finiteNumber(state.money, 20)), 0, 99999);
  safe.skillPoints = clamp(Math.round(finiteNumber(state.skillPoints, 0)), 0, 99);
  WORLD_STATS.forEach(([key]) => {
    safe.stats[key] = clamp(Math.round(finiteNumber(state.stats?.[key], 0)), 0, 10);
  });
  safe.unlockedAreas = Array.isArray(state.unlockedAreas) ? state.unlockedAreas.filter((area) => WORLD_AREAS[area]) : ["gym", "oldtown"];
  if (safe.objectiveStep >= 15 && !safe.unlockedAreas.includes("dockyard")) safe.unlockedAreas.push("dockyard");
  if (safe.objectiveStep >= 21 && !safe.unlockedAreas.includes("market")) safe.unlockedAreas.push("market");
  if (safe.objectiveStep >= 29 && !safe.unlockedAreas.includes("underground")) safe.unlockedAreas.push("underground");
  if (safe.objectiveStep >= 42 && !safe.unlockedAreas.includes("crown")) safe.unlockedAreas.push("crown");
  if (safe.objectiveStep >= 48 && !safe.unlockedAreas.includes("stadium")) safe.unlockedAreas.push("stadium");
  safe.unlockedSkills = Array.isArray(state.unlockedSkills) ? state.unlockedSkills.filter((id) => WORLD_SKILLS.some((skill) => skill.id === id)) : [];
  safe.unlockedPunches = sanitizeUnlockedPunches(state.unlockedPunches);
  safe.unlockedSkills.forEach((skillId) => {
    const skill = WORLD_SKILLS.find((item) => item.id === skillId);
    if (skill?.move && PUNCH_MOVES[skill.move] && !safe.unlockedPunches.includes(skill.move)) safe.unlockedPunches.push(skill.move);
  });
  safe.punchLoadout = sanitizePunchLoadout(state.punchLoadout, safe.unlockedPunches);
  safe.completedQuests = Array.isArray(state.completedQuests) ? state.completedQuests.map(String).slice(0, 40) : [];
  safe.defeatedEnemies = Array.isArray(state.defeatedEnemies) ? state.defeatedEnemies.map(String).slice(0, 40) : [];
  safe.storyChoices = typeof state.storyChoices === "object" && state.storyChoices ? state.storyChoices : {};
  safe.gymUpgrades = Array.isArray(state.gymUpgrades) ? state.gymUpgrades.map(String).slice(0, 40) : [];
  safe.heardAmbientLines = Array.isArray(state.heardAmbientLines) ? state.heardAmbientLines.map(String).slice(0, 220) : [];
  safe.sideQuests = typeof state.sideQuests === "object" && state.sideQuests ? state.sideQuests : {};
  safe.minigameBest = typeof state.minigameBest === "object" && state.minigameBest ? state.minigameBest : {};
  safe.memoryItems = Array.isArray(state.memoryItems) ? state.memoryItems.map(String).slice(0, 20) : [];
  safe.dialogue = null;
  safe.upgradeOpen = Boolean(state.upgradeOpen);
  safe.menuOpen = Boolean(state.menuOpen);
  safe.savedAt = finiteNumber(state.savedAt, 0);
  return safe;
}

function saveWorldState(showMessage = true) {
  try {
    worldState.savedAt = Date.now();
    const payload = JSON.stringify({
      area: worldState.area,
      x: worldState.x,
      y: worldState.y,
      chapter: worldState.chapter,
      objectiveStep: worldState.objectiveStep,
      xp: worldState.xp,
      level: worldState.level,
      money: worldState.money,
      skillPoints: worldState.skillPoints,
      stats: worldState.stats,
      unlockedSkills: worldState.unlockedSkills,
      unlockedPunches: worldState.unlockedPunches,
      punchLoadout: worldState.punchLoadout,
      unlockedAreas: worldState.unlockedAreas,
      completedQuests: worldState.completedQuests,
      defeatedEnemies: worldState.defeatedEnemies,
      storyChoices: worldState.storyChoices,
      gymUpgrades: worldState.gymUpgrades,
      heardAmbientLines: worldState.heardAmbientLines,
      sideQuests: worldState.sideQuests,
      minigameBest: worldState.minigameBest,
      memoryItems: worldState.memoryItems,
      savedAt: Date.now(),
    });
    localStorage.setItem(worldSaveKey(), payload);
    if (activeSaveSlot === "slot1") localStorage.setItem(WORLD_SAVE_KEY, payload);
    if (showMessage) pushFeed(`Open world saved to ${activeSaveSlot.replace("slot", "Save ")}.`);
  } catch {
    pushFeed("Save failed. Browser storage may be blocked.");
  }
}

function newWorldGame() {
  activeMinigame = null;
  worldResult = null;
  queuedWorldFightId = "";
  worldState = createDefaultWorldState();
  playMode = "open-world";
  activeMode = "world";
  localIndex = 0;
  localStyle = "balanced";
  remoteStyle = "brawler";
  paused = false;
  setTutorialVisible(false);
  ui.statusLabel.textContent = "Open World";
  setWorldDialogue(WORLD_DIALOGUE.prologue);
  saveWorldState(false);
  pushFeed(`${activeSaveSlot.replace("slot", "Save ")} started fresh.`);
  updateUi();
}

function resetCurrentSave() {
  if (!window.confirm("Reset this save slot and start over?")) return;
  try {
    localStorage.removeItem(worldSaveKey());
    if (activeSaveSlot === "slot1") localStorage.removeItem(WORLD_SAVE_KEY);
  } catch {
    // Continue with a fresh in-memory state even if storage removal fails.
  }
  newWorldGame();
}

function clampWorldPosition() {
  const area = WORLD_AREAS[worldState.area] || WORLD_AREAS.gym;
  worldState.x = clamp(finiteNumber(worldState.x, area.start.x), area.bounds.left, area.bounds.right);
  worldState.y = clamp(finiteNumber(worldState.y, area.start.y), area.bounds.top, area.bounds.bottom);
  if (!isWorldWalkable(worldState.x, worldState.y)) {
    worldState.x = area.start.x;
    worldState.y = area.start.y;
  }
}

function setWorldArea(areaId, x, y) {
  const area = WORLD_AREAS[areaId];
  if (!area) return;
  worldState.area = areaId;
  worldState.x = finiteNumber(x, area.start.x);
  worldState.y = finiteNumber(y, area.start.y);
  clampWorldPosition();
  worldState.dialogue = null;
  queuedWorldFightId = "";
  saveWorldState(false);
}

function setWorldDialogue(dialogue) {
  worldState.dialogue = dialogue;
  worldMessageTimer = dialogue?.temporary ? 3.2 : 0;
}

function clearWorldDialogue() {
  const current = worldState.dialogue;
  if (current?.next && WORLD_DIALOGUE[current.next]) {
    setWorldDialogue(WORLD_DIALOGUE[current.next]);
    return;
  }
  if (current?.prologueDone) {
    worldState.storyChoices.seenPrologue = true;
    saveWorldState(false);
  }
  worldState.dialogue = null;
  worldMessageTimer = 0;
}

function setWorldStep(step) {
  if (worldState.objectiveStep >= step) return;
  worldState.objectiveStep = step;
  if (step >= 14) worldState.chapter = Math.max(worldState.chapter, 2);
  if (step >= 21) worldState.chapter = Math.max(worldState.chapter, 3);
  if (step >= 28) worldState.chapter = Math.max(worldState.chapter, 4);
  if (step >= 35) worldState.chapter = Math.max(worldState.chapter, 5);
  if (step >= 41) worldState.chapter = Math.max(worldState.chapter, 6);
  if (step >= 48) worldState.chapter = Math.max(worldState.chapter, 7);
  if (step >= 15 && !worldState.unlockedAreas.includes("dockyard")) {
    worldState.unlockedAreas.push("dockyard");
    pushFeed("Dockyard unlocked.");
  }
  if (step >= 21 && !worldState.unlockedAreas.includes("market")) {
    worldState.unlockedAreas.push("market");
    pushFeed("Neon Market unlocked.");
  }
  if (step >= 29 && !worldState.unlockedAreas.includes("underground")) {
    worldState.unlockedAreas.push("underground");
    pushFeed("Underground Arena unlocked.");
  }
  if (step >= 42 && !worldState.unlockedAreas.includes("crown")) {
    worldState.unlockedAreas.push("crown");
    pushFeed("Crown District unlocked.");
  }
  if (step >= 48 && !worldState.unlockedAreas.includes("stadium")) {
    worldState.unlockedAreas.push("stadium");
    pushFeed("Champion Stadium unlocked.");
  }
  saveWorldState(false);
}

function worldObjectiveText() {
  if (worldState.objectiveStep <= 0) return "Talk to Coach Marcus at Rustbell Gym.";
  if (worldState.objectiveStep === 1) return "Move to the tape marker on the gym floor.";
  if (worldState.objectiveStep === 2) return "Inspect the heavy bag.";
  if (worldState.objectiveStep === 3) return "Leave the gym and enter Oldtown Streets.";
  if (worldState.objectiveStep === 4) return "Find the Oldtown Scrapper and start your first street fight.";
  if (worldState.objectiveStep === 5) return "Return to Marcus at Rustbell Gym.";
  if (worldState.objectiveStep === 6) return "Talk to Jax about Mason's crew.";
  if (worldState.objectiveStep === 7) return "Beat Rico Lane in Oldtown.";
  if (worldState.objectiveStep === 8) return "Beat Tess Marrow and learn to protect your body.";
  if (worldState.objectiveStep === 9) return "Beat Big Al, Mason's wall.";
  if (worldState.objectiveStep === 10) return "Return to Marcus before challenging Mason.";
  if (worldState.objectiveStep === 11) return "Beat Mason \"Brick\" Doyle.";
  if (worldState.objectiveStep === 12) return "Return to Marcus. The gym lights are still on.";
  if (worldState.objectiveStep === 13) return "Talk to Jax about the Dockyard's Friday money.";
  if (worldState.objectiveStep === 14) return "Talk to Mina before chasing Dockyard fighters.";
  if (worldState.objectiveStep === 15) return "Enter the Dockyard and beat Cal Rook.";
  if (worldState.objectiveStep === 16) return "Beat Vera Hooks. Protect your body.";
  if (worldState.objectiveStep === 17) return "Return to Mina. Something is wrong with these fights.";
  if (worldState.objectiveStep === 18) return "Beat Sofia \"Needle\" Reyes and find out who is paying fighters.";
  if (worldState.objectiveStep === 19) return "Return to Marcus with Sofia's Crown Circuit warning.";
  if (worldState.objectiveStep === 20) return "Talk to Marcus about Sofia's tape lead.";
  if (worldState.objectiveStep === 21) return "Enter Neon Market and talk to Mara Vale.";
  if (worldState.objectiveStep === 22) return "Beat the Tape Runner and recover Kai's old recording.";
  if (worldState.objectiveStep === 23) return "Return to Rustbell Gym and inspect the old TV.";
  if (worldState.objectiveStep === 24) return "Talk to Kai. He finally came back.";
  if (worldState.objectiveStep === 25) return "Talk to Marcus after watching Kai's tape.";
  if (worldState.objectiveStep === 26) return "Find the Crown Scout in Neon Market.";
  if (worldState.objectiveStep === 27) return "Talk to Jax at Rustbell Gym. He is hiding something.";
  if (worldState.objectiveStep === 28) return "Talk to Mina before following Jax to the underground fights.";
  if (worldState.objectiveStep === 29) return "Go to the Dockyard and enter the Underground Arena.";
  if (worldState.objectiveStep === 30) return "Beat the Basement Gatekeeper to get inside.";
  if (worldState.objectiveStep === 31) return "Beat Razor Finn and reach Jax before it is too late.";
  if (worldState.objectiveStep === 32) return "Find Jax in the back of the Underground Arena.";
  if (worldState.objectiveStep === 33) return "Return to Rustbell Gym and talk to Mina.";
  if (worldState.objectiveStep === 34) return "Sit by Jax's chair at Rustbell Gym.";
  if (worldState.objectiveStep === 35) return "Talk to Mina. Jax's mother needs to hear the truth.";
  if (worldState.objectiveStep === 36) return "Visit Mrs. Bell in Oldtown with Mina.";
  if (worldState.objectiveStep === 37) return "Return to Rustbell Gym and talk to Kai.";
  if (worldState.objectiveStep === 38) return "Beat Nero Black in the Underground Arena.";
  if (worldState.objectiveStep === 39) return "Return to Rustbell Gym and build the memorial wall.";
  if (worldState.objectiveStep === 40) return "Talk to Marcus. Crown has sent an invitation.";
  if (worldState.objectiveStep === 41) return "Go to Neon Market and find the Crown Scout.";
  if (worldState.objectiveStep === 42) return "Enter Crown District and meet Elias Crowe.";
  if (worldState.objectiveStep === 43) return "Return to Marcus with Crowe's offer.";
  if (worldState.objectiveStep === 44) return "Defend Rustbell Gym from the Crown Enforcer.";
  if (worldState.objectiveStep === 45) return "Talk to Marcus in the smoke.";
  if (worldState.objectiveStep === 46) return "Talk to Kai. Marcus left the keys behind.";
  if (worldState.objectiveStep === 47) return "Ring the old gym bell before the final climb.";
  if (worldState.objectiveStep === 48) return "Go through Crown District and enter Champion Stadium.";
  if (worldState.objectiveStep === 49) return "Beat Darius Vale, Marcus's former student.";
  if (worldState.objectiveStep === 50) return "Beat Victor Kane, the Crown champion.";
  if (worldState.objectiveStep === 51) return "Choose your ending: mercy, revenge, or Crown.";
  if (worldState.objectiveStep === 52) return "The Last Bell Ending complete. Rustbell reopens.";
  if (worldState.objectiveStep === 53) return "Revenge Ending complete. The gym survives, but it feels emptier.";
  if (worldState.objectiveStep === 54) return "Crown Ending complete. Fame wins, and Rustbell loses itself.";
  return "Train, upgrade, and wait for the next lead.";
}

function updateWorld(dt) {
  worldMessageTimer = Math.max(0, worldMessageTimer - dt);
  if (worldMessageTimer <= 0 && worldState.dialogue?.temporary) worldState.dialogue = null;
  if (worldState.menuOpen || worldState.upgradeOpen) {
    worldInteractTarget = null;
    return;
  }

  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  const length = Math.hypot(dx, dy) || 1;
  const speed = 165 + worldState.stats.speed * 7;
  moveWorldPlayer((dx / length) * speed * dt, (dy / length) * speed * dt);

  if (worldState.objectiveStep === 1 && worldState.area === "gym" && distancePoint(worldState.x, worldState.y, 520, 360) < 42) {
    setWorldStep(2);
    setWorldDialogue({ ...WORLD_DIALOGUE.bag, temporary: true });
  }

  if (queuedWorldFightId) {
    const queuedEntity = WORLD_ENTITIES[queuedWorldFightId];
    if (!queuedEntity || !nearWorldEntity(queuedEntity)) queuedWorldFightId = "";
  }

  worldInteractTarget = getWorldInteractTarget();
}

function moveWorldPlayer(dx, dy) {
  if (!dx && !dy) return;
  const oldX = worldState.x;
  const oldY = worldState.y;
  const area = WORLD_AREAS[worldState.area] || WORLD_AREAS.gym;
  const nextX = clamp(oldX + dx, area.bounds.left, area.bounds.right);
  if (isWorldWalkable(nextX, oldY)) worldState.x = nextX;
  const nextY = clamp(oldY + dy, area.bounds.top, area.bounds.bottom);
  if (isWorldWalkable(worldState.x, nextY)) worldState.y = nextY;
}

function isWorldWalkable(x, y) {
  const area = WORLD_AREAS[worldState.area] || WORLD_AREAS.gym;
  const inWalkZone = area.walk.some((rect) => pointInRect(x, y, rect));
  const inBlockedZone = area.blocked.some((rect) => pointInRect(x, y, rect));
  return inWalkZone && !inBlockedZone;
}

function pointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function getWorldInteractTarget() {
  const entity = worldEntitiesForArea(worldState.area).find(nearWorldEntity);
  if (entity) return entity;
  const exit = worldExitsForArea(worldState.area).find(nearWorldExit);
  return exit ? { ...exit, locked: !worldExitIsOpen(exit) } : null;
}

function worldExitsForArea(areaId) {
  const area = WORLD_AREAS[areaId] || WORLD_AREAS.gym;
  if (Array.isArray(area.exits)) return area.exits;
  return area.exit ? [area.exit] : [];
}

function nearWorldExit(exit) {
  return distancePoint(worldState.x, worldState.y, exit.x, exit.y) < exit.radius;
}

function worldExitIsOpen(exit) {
  if (exit.availableStep && worldState.objectiveStep < exit.availableStep) return false;
  return !exit.to || worldState.unlockedAreas.includes(exit.to);
}

function worldEntitiesForArea(areaId) {
  return Object.values(WORLD_ENTITIES).filter((entity) => {
    if (entity.area !== areaId) return false;
    if (worldState.objectiveStep < (entity.availableStep || 0)) return false;
    if (entity.maxStep && worldState.objectiveStep > entity.maxStep) return false;
    if (entity.id === "jax" && worldState.storyChoices.jaxGone) return false;
    if (entity.id === "marcus" && worldState.storyChoices.marcusGone) return false;
    if (["jaxWraps", "jaxJacket", "gymRecords"].includes(entity.id) && worldState.memoryItems.includes(entity.id)) return false;
    if (entity.fight) {
      if (worldState.defeatedEnemies.includes(entity.fight.id)) return false;
      const previousFight = previousFightFor(entity.id);
      if (previousFight && !worldState.defeatedEnemies.includes(previousFight)) return false;
    }
    return true;
  });
}

function previousFightFor(entityId) {
  return {
    tess: "rico-lane",
    bigAl: "tess-marrow",
    mason: "big-al",
    bodySnatcher: "cal-rook",
    sofia: "vera-hooks",
    dirtyFighter: "basement-gatekeeper",
    nero: "razor-finn",
    victorKane: "darius-vale",
  }[entityId] || "";
}

function nearWorldEntity(entity) {
  return entity.area === worldState.area && distancePoint(worldState.x, worldState.y, entity.x, entity.y) < entity.radius;
}

function distancePoint(ax, ay, bx, by) {
  return Math.hypot(ax - bx, (ay - by) * 1.15);
}

function worldPromptText() {
  if (activeMode === "world-minigame") return worldMinigamePrompt();
  if (activeMode === "world-result") return worldResultContinueText();
  const target = worldInteractTarget || getWorldInteractTarget();
  if (worldState.dialogue) return "Press E or JAB to continue.";
  if (worldState.menuOpen) return "Paused: Stats, Save, or Exit.";
  if (worldState.upgradeOpen) return "Choose a stat upgrade.";
  if (!target) return worldSideQuestHint() || "Press E or JAB near people, doors, bags, or enemies.";
  if (target.id === "marcus") return "Press E or JAB to talk to Marcus.";
  if (target.id === "jax") return "Press E or JAB to talk to Jax.";
  if (target.id === "mina") return "Press E or JAB to talk to Mina.";
  if (target.id === "mara") return "Press E or JAB to talk to Mara.";
  if (target.id === "kai") return "Press E or JAB to talk to Kai.";
  if (target.id === "crownScout") return "Press E or JAB to talk to the scout.";
  if (target.id === "jaxArena") return "Press E or JAB to reach Jax.";
  if (target.id === "emptyChair") return "Press E or JAB to sit with the empty chair.";
  if (target.id === "jaxMother") return "Press E or JAB to talk to Mrs. Bell.";
  if (target.id === "memorialWall") return "Press E or JAB to build the memorial wall.";
  if (target.id === "eliasCrowe") return "Press E or JAB to face Elias Crowe.";
  if (target.id === "gymBell") return "Press E or JAB to ring the old bell.";
  if (target.id === "endingLastBell") return "Press E or JAB to choose mercy.";
  if (target.id === "endingRevenge") return "Press E or JAB to choose revenge.";
  if (target.id === "endingCrown") return "Press E or JAB to sign with Crown.";
  if (target.id === "oldBoxer") return "Press E or JAB for Eli's breathing drill.";
  if (target.id === "minaWorkbench") return "Press E or JAB to repair gym gear.";
  if (target.id === "roadworkRoute") return "Press E or JAB to run roadwork cones.";
  if (["jaxWraps", "jaxJacket", "gymRecords"].includes(target.id)) return "Press E or JAB to collect this memory.";
  if (target.id === "bag") return worldState.objectiveStep <= 2 ? "Press E or JAB to inspect the heavy bag." : "Press E or JAB for a heavy bag drill.";
  if (target.id === "tapePlayer") return "Press E or JAB to play Kai's tape.";
  if (target.id === "upgrade") return "Press E or JAB to upgrade stats.";
  if (target.to && target.locked) return `${target.label} is locked. Follow the current objective.`;
  if (target.to) return `Press E or JAB to enter ${target.label}.`;
  if (target.fight && queuedWorldFightId === target.id) return `Press E or JAB to start ${target.name}.`;
  if (target.fight) return `Press E or JAB to fight ${target.name}.`;
  return "Press E or JAB to interact.";
}

function worldSideQuestHint() {
  if (worldState.objectiveStep >= 34 && worldState.memoryItems.length < 3) return `Side quest: find memories for the wall (${worldState.memoryItems.length}/3).`;
  if (worldState.objectiveStep >= 15 && !worldState.sideQuests.gearRepair) return "Side quest: help Mina repair gear at her workbench.";
  if (worldState.objectiveStep >= 14 && !worldState.sideQuests.oldBoxer) return "Side quest: Old Boxer Eli has a breathing drill in Oldtown.";
  if (worldState.objectiveStep >= 7 && !worldState.sideQuests.roadwork) return "Side activity: run the rain cones in Oldtown.";
  if (worldState.objectiveStep > 2 && !worldState.sideQuests.heavyBag) return "Side activity: use the heavy bag for timing practice.";
  return "";
}

function nowMs() {
  return performance?.now ? performance.now() : Date.now();
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function bossMechanicFor(fighter) {
  return fighter?.bossPattern ? BOSS_MECHANICS[fighter.bossPattern] : null;
}

function callBossHook(fighter, hook, ...args) {
  const mechanic = bossMechanicFor(fighter);
  if (!mechanic || typeof mechanic[hook] !== "function") return undefined;
  return mechanic[hook](fighter, ...args);
}

function initBossMechanic(actor, target, fight) {
  const mechanic = bossMechanicFor(actor);
  if (!mechanic) return;
  actor.bossState = { ...(actor.bossState || {}), fightId: fight?.id || "" };
  if (typeof mechanic.init === "function") mechanic.init(actor, target, fight);
}

function updateBossMechanic(actor, target, dt) {
  const mechanic = bossMechanicFor(actor);
  if (!mechanic || typeof mechanic.update !== "function") return true;
  return mechanic.update(actor, target, dt) !== false;
}

function bossHudText() {
  const boss = fighters.find((fighter) => fighter.bossPattern && fighter.bossState?.fightId);
  const text = boss ? callBossHook(boss, "getHudText", boss === fighters[0] ? fighters[1] : fighters[0]) : "";
  return typeof text === "string" ? text : "";
}

function startWorldMinigame(type) {
  const configs = {
    heavyBag: {
      id: "heavyBag",
      type: "timing",
      title: "Heavy Bag: Hold the Room Still",
      hint: "Tap JAB or E when the gold marker sits inside the bright window.",
      need: 5,
      misses: 3,
      xp: 36,
      money: 18,
      firstSkill: false,
      complete: "The bag thumps like a heartbeat. For a minute, anger has rhythm.",
      fail: "The bag swings wild. Marcus would call that honest feedback.",
    },
    oldBoxer: {
      id: "oldBoxer",
      type: "sequence",
      title: "Eli's Breathing Drill",
      hint: "Repeat the shown punch pattern. Mix calm hands before fast hands.",
      sequence: ["jab", "body", "hook", "jab", "slip"],
      xp: 48,
      money: 0,
      firstSkill: true,
      complete: "Eli nods. You remember to breathe before the room gets loud.",
      fail: "Eli waits until you stop rushing. The lesson is still there.",
    },
    gearRepair: {
      id: "gearRepair",
      type: "sequence",
      title: "Mina's Repair Bench",
      hint: "Hold pads and pass tape in order. J, K, U, Slip match the prompts.",
      sequence: ["body", "jab", "hook", "body", "jab"],
      xp: 34,
      money: 26,
      firstSkill: true,
      complete: "Mina tightens the last strap. The gym feels a little less broken.",
      fail: "Mina sighs, fixes your mistake, and makes you try slower next time.",
    },
    roadwork: {
      id: "roadwork",
      type: "route",
      title: "Roadwork: Rain Laps",
      hint: "Run through the gold cones before the timer dies. Movement matters here, not punches.",
      route: [
        { x: 316, y: 348 },
        { x: 510, y: 292 },
        { x: 734, y: 392 },
        { x: 482, y: 334 },
      ],
      timeLimit: 20,
      xp: 46,
      money: 12,
      firstSkill: false,
      complete: "Your lungs burn clean. Oldtown feels a little smaller under your feet.",
      fail: "The rain wins that lap. You can hear Marcus saying roadwork is supposed to be boring.",
    },
  };
  const config = configs[type];
  if (!config) return;
  activeMode = "world-minigame";
  activeMinigame = {
    ...config,
    cursor: Math.random(),
    dir: Math.random() < 0.5 ? -1 : 1,
    target: randomBetween(0.25, 0.75),
    targetSize: 0.18,
    misses: config.misses || 3,
    success: 0,
    miss: 0,
    index: 0,
    routeIndex: 0,
    timeLeft: config.timeLimit || 0,
    timer: 0,
    flash: "",
  };
  worldState.dialogue = null;
  pushFeed(`${config.title}: ${config.hint}`);
  updateUi();
}

function worldMinigamePrompt() {
  if (!activeMinigame) return "Minigame ended.";
  if (activeMinigame.type === "route") return `${activeMinigame.title}: cone ${Math.min(activeMinigame.routeIndex + 1, activeMinigame.route.length)}/${activeMinigame.route.length}, ${Math.ceil(activeMinigame.timeLeft)}s.`;
  if (activeMinigame.type === "timing") return `${activeMinigame.title}: time the marker (${activeMinigame.success}/${activeMinigame.need}).`;
  return `${activeMinigame.title}: next ${minigameActionLabel(activeMinigame.sequence[activeMinigame.index])}.`;
}

function updateWorldMinigame(dt) {
  if (!activeMinigame) {
    activeMode = "world";
    return;
  }
  activeMinigame.timer += dt;
  if (activeMinigame.type === "route") {
    activeMinigame.timeLeft = Math.max(0, activeMinigame.timeLeft - dt);
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    const length = Math.hypot(dx, dy) || 1;
    const speed = 175 + worldState.stats.speed * 8;
    moveWorldPlayer((dx / length) * speed * dt, (dy / length) * speed * dt);
    const point = activeMinigame.route[activeMinigame.routeIndex];
    if (point && distancePoint(worldState.x, worldState.y, point.x, point.y) < 34) {
      activeMinigame.routeIndex += 1;
      activeMinigame.success += 1;
      activeMinigame.flash = "CONE";
      addFloater(point.x, point.y - 54, "CONE HIT", "#fff0a8");
      playSound("slip");
    }
    if (activeMinigame.routeIndex >= activeMinigame.route.length) finishWorldMinigame(true);
    else if (activeMinigame.timeLeft <= 0) finishWorldMinigame(false);
  } else if (activeMinigame.type === "timing") {
    activeMinigame.cursor += activeMinigame.dir * dt * 0.82;
    if (activeMinigame.cursor <= 0 || activeMinigame.cursor >= 1) {
      activeMinigame.cursor = clamp(activeMinigame.cursor, 0, 1);
      activeMinigame.dir *= -1;
    }
  }
  worldInteractTarget = getWorldInteractTarget();
}

function handleMinigameInput(action = "jab") {
  if (activeMode !== "world-minigame" || !activeMinigame) return false;
  const game = activeMinigame;
  if (game.type === "route") {
    game.flash = "RUN";
    updateUi();
    return true;
  } else if (game.type === "timing") {
    const hit = Math.abs(game.cursor - game.target) <= game.targetSize * 0.5;
    if (hit) {
      game.success += 1;
      game.flash = "GOOD";
      game.target = randomBetween(0.22, 0.78);
      game.targetSize = Math.max(0.1, game.targetSize - 0.012);
      addFloater(worldState.x, worldState.y - 92, "GOOD TIMING", "#79d1a2");
    } else {
      game.miss += 1;
      game.flash = "MISS";
      addFloater(worldState.x, worldState.y - 92, "OFF RHYTHM", "#f26b55");
    }
  } else {
    const expected = game.sequence[game.index];
    if (action === expected) {
      game.index += 1;
      game.success += 1;
      game.flash = "GOOD";
      addFloater(worldState.x, worldState.y - 92, minigameActionLabel(action), "#79d1a2");
    } else {
      game.miss += 1;
      game.flash = "WRONG";
      addFloater(worldState.x, worldState.y - 92, "WRONG BEAT", "#f26b55");
    }
  }
  if (game.success >= (game.need || game.sequence?.length || 1)) finishWorldMinigame(true);
  else if (game.miss >= game.misses) finishWorldMinigame(false);
  updateUi();
  return true;
}

function finishWorldMinigame(won) {
  const game = activeMinigame;
  if (!game) return;
  activeMinigame = null;
  activeMode = "world";
  if (won) {
    const first = !worldState.sideQuests[game.id];
    const xpReward = first ? game.xp : Math.max(8, Math.floor(game.xp * 0.32));
    const moneyReward = first ? game.money : Math.max(0, Math.floor(game.money * 0.25));
    grantWorldRewards(xpReward, moneyReward);
    worldState.sideQuests[game.id] = "done";
    worldState.minigameBest[game.id] = Math.max(worldState.minigameBest[game.id] || 0, game.success);
    if (first && game.firstSkill) {
      worldState.skillPoints += 1;
      pushFeed(`${game.title} complete. +1 skill point.`);
    }
    pushFeed(game.complete);
  } else {
    grantWorldRewards(Math.floor(game.xp * 0.25), 0);
    pushFeed(game.fail);
  }
  saveWorldState(false);
}

function minigameActionLabel(action) {
  return { jab: "JAB", hook: "HOOK", body: "BODY", slip: "SLIP", interact: "INTERACT" }[action] || String(action || "").toUpperCase();
}

function collectWorldMemory(target) {
  if (worldState.memoryItems.includes(target.id)) return;
  const dialogue = {
    jaxWraps: WORLD_DIALOGUE.jaxWrapsLine,
    jaxJacket: WORLD_DIALOGUE.jaxJacketLine,
    gymRecords: WORLD_DIALOGUE.gymRecordsLine,
  }[target.id];
  if (dialogue) setWorldDialogue(dialogue);
  worldState.memoryItems.push(target.id);
  grantWorldRewards(25, 0);
  pushFeed(`${target.name} collected. ${worldState.memoryItems.length}/3 memories for the wall.`);
  if (worldState.memoryItems.length >= 3 && !worldState.completedQuests.includes("names-on-the-wall")) {
    worldState.completedQuests.push("names-on-the-wall");
    worldState.skillPoints += 1;
    grantWorldRewards(80, 30);
    pushFeed("Side quest complete: Names on the Wall. +1 skill point.");
  }
  saveWorldState(false);
}

function worldResultLocked() {
  return activeMode === "world-result" && nowMs() < worldResultUnlockAt;
}

function worldResultContinueText() {
  const remaining = Math.ceil(Math.max(0, worldResultUnlockAt - nowMs()) / 1000);
  return remaining > 0 ? `Continue available in ${remaining}s.` : "Press E, JAB, or Start to continue.";
}

function ambientLineKey(entityId, line) {
  return `${entityId}:${line.id}`;
}

function ambientLineFor(entityId) {
  const step = worldState.objectiveStep;
  const heard = new Set(worldState.heardAmbientLines || []);
  return (WORLD_AMBIENT_LINES[entityId] || []).find((line) => {
    const min = Number.isFinite(line.min) ? line.min : -Infinity;
    const max = Number.isFinite(line.max) ? line.max : Infinity;
    return step >= min && step <= max && !heard.has(ambientLineKey(entityId, line));
  });
}

function speakAmbientLine(target) {
  const line = ambientLineFor(target.id);
  if (!line) {
    pushFeed(`${target.name} has nothing new right now.`);
    return false;
  }
  worldState.heardAmbientLines.push(ambientLineKey(target.id, line));
  setWorldDialogue({
    speaker: line.speaker || target.name,
    portrait: Number.isInteger(line.portrait) ? line.portrait : target.portrait,
    portraitSheet: line.portraitSheet || target.portraitSheet,
    text: line.text,
    temporary: true,
  });
  saveWorldState(false);
  return true;
}

function interactWorld() {
  if (activeMode !== "world") return;
  if (worldState.menuOpen) {
    worldState.menuOpen = false;
    updateUi();
    return;
  }
  if (worldState.upgradeOpen) {
    pushFeed("Training corner: press 1-7 for stats, or use the side panel buttons. Esc/Pause closes.");
    updateUi();
    return;
  }
  if (worldState.dialogue) {
    clearWorldDialogue();
    updateUi();
    return;
  }
  const target = getWorldInteractTarget();
  if (!target) {
    pushFeed("Move closer to interact.");
    return;
  }
  if (target.id === "marcus") {
    if (worldState.objectiveStep === 0) {
      setWorldDialogue(WORLD_DIALOGUE.marcusIntro);
      setWorldStep(1);
    } else if (worldState.objectiveStep === 5) {
      setWorldDialogue(WORLD_DIALOGUE.firstWin);
      setWorldStep(6);
      if (!worldState.completedQuests.includes("the-gym-with-no-lights")) worldState.completedQuests.push("the-gym-with-no-lights");
      saveWorldState(false);
    } else if (worldState.objectiveStep === 10) {
      setWorldDialogue(WORLD_DIALOGUE.marcusMason);
      setWorldStep(11);
    } else if (worldState.objectiveStep === 12) {
      setWorldDialogue(WORLD_DIALOGUE.chapterOneDone);
      setWorldStep(13);
      if (!worldState.completedQuests.includes("chapter-one-the-gym-with-no-lights")) worldState.completedQuests.push("chapter-one-the-gym-with-no-lights");
      grantWorldRewards(55, 40);
      saveWorldState(false);
    } else if (worldState.objectiveStep === 19) {
      setWorldDialogue(WORLD_DIALOGUE.chapterTwoDone);
      setWorldStep(20);
      if (!worldState.completedQuests.includes("chapter-two-the-price-of-winning")) worldState.completedQuests.push("chapter-two-the-price-of-winning");
      grantWorldRewards(75, 60);
      saveWorldState(false);
    } else if (worldState.objectiveStep === 20) {
      setWorldDialogue(WORLD_DIALOGUE.chapterThreeLead);
      setWorldStep(21);
    } else if (worldState.objectiveStep === 25) {
      setWorldDialogue(WORLD_DIALOGUE.marcusTapeAfter);
      setWorldStep(26);
      saveWorldState(false);
    } else if (worldState.objectiveStep === 40) {
      setWorldDialogue(WORLD_DIALOGUE.chapterSixStart);
      setWorldStep(41);
      saveWorldState(false);
    } else if (worldState.objectiveStep === 43) {
      setWorldDialogue(WORLD_DIALOGUE.marcusCroweWarning);
      setWorldStep(44);
      saveWorldState(false);
    } else if (worldState.objectiveStep === 45) {
      setWorldDialogue(WORLD_DIALOGUE.marcusFinal);
      worldState.storyChoices.marcusGone = true;
      setWorldStep(46);
      saveWorldState(false);
    } else {
      speakAmbientLine(target);
    }
    return;
  }
  if (target.id === "jax") {
    if (worldState.objectiveStep === 6) {
      setWorldDialogue(WORLD_DIALOGUE.jaxMason);
      setWorldStep(7);
    } else if (worldState.objectiveStep === 13) {
      setWorldDialogue(WORLD_DIALOGUE.chapterTwoStart);
      setWorldStep(14);
    } else if (worldState.objectiveStep === 27) {
      setWorldDialogue(WORLD_DIALOGUE.chapterFourStart);
      setWorldStep(28);
    } else {
      speakAmbientLine(target);
    }
    return;
  }
  if (target.id === "mina") {
    if (worldState.objectiveStep === 14) {
      setWorldDialogue(WORLD_DIALOGUE.minaDockLead);
      setWorldStep(15);
    } else if (worldState.objectiveStep === 17) {
      setWorldDialogue(WORLD_DIALOGUE.minaBodyWarning);
      setWorldStep(18);
    } else if (worldState.objectiveStep === 28) {
      setWorldDialogue(WORLD_DIALOGUE.minaJaxWarning);
      setWorldStep(29);
    } else if (worldState.objectiveStep === 33) {
      setWorldDialogue(WORLD_DIALOGUE.emptyChair);
      setWorldStep(34);
      if (!worldState.completedQuests.includes("chapter-four-friday-money")) worldState.completedQuests.push("chapter-four-friday-money");
      worldState.skillPoints += 1;
      pushFeed("Chapter 4 complete. +1 skill point.");
      saveWorldState(false);
    } else if (worldState.objectiveStep === 35) {
      setWorldDialogue(WORLD_DIALOGUE.chapterFiveMinaLead);
      setWorldStep(36);
      saveWorldState(false);
    } else {
      speakAmbientLine(target);
    }
    return;
  }
  if (target.id === "jaxArena") {
    setWorldDialogue(WORLD_DIALOGUE.jaxFinal);
    worldState.storyChoices.jaxGone = true;
    setWorldStep(33);
    saveWorldState(false);
    return;
  }
  if (target.id === "emptyChair") {
    if (worldState.objectiveStep === 34) {
      setWorldDialogue(WORLD_DIALOGUE.chapterFiveChair);
      setWorldStep(35);
      saveWorldState(false);
      return;
    }
    speakAmbientLine(target);
    return;
  }
  if (target.id === "jaxMother") {
    if (worldState.objectiveStep === 36) {
      setWorldDialogue(WORLD_DIALOGUE.tellHisMum);
      setWorldStep(37);
      saveWorldState(false);
    } else {
      speakAmbientLine(target);
    }
    return;
  }
  if (target.id === "mara") {
    if (worldState.objectiveStep === 21) {
      setWorldDialogue(WORLD_DIALOGUE.maraTapeLead);
      setWorldStep(22);
    } else {
      speakAmbientLine(target);
    }
    return;
  }
  if (target.id === "tapePlayer") {
    if (worldState.objectiveStep === 23) {
      setWorldDialogue(WORLD_DIALOGUE.tapeReveal);
      setWorldStep(24);
    } else {
      speakAmbientLine(target);
    }
    return;
  }
  if (target.id === "kai") {
    if (worldState.objectiveStep === 24) {
      setWorldDialogue(WORLD_DIALOGUE.kaiReturn);
      setWorldStep(25);
    } else if (worldState.objectiveStep === 37) {
      setWorldDialogue(WORLD_DIALOGUE.kaiAfterJax);
      setWorldStep(38);
      saveWorldState(false);
    } else if (worldState.objectiveStep === 46) {
      setWorldDialogue(WORLD_DIALOGUE.kaiKeys);
      setWorldStep(47);
      worldState.storyChoices.kaiTrainer = true;
      if (!worldState.completedQuests.includes("chapter-six-smoke-over-rustbell")) worldState.completedQuests.push("chapter-six-smoke-over-rustbell");
      worldState.skillPoints += 1;
      grantWorldRewards(140, 0);
      pushFeed("Chapter 6 complete. Kai is your trainer now. +1 skill point.");
      saveWorldState(false);
    } else {
      speakAmbientLine(target);
    }
    return;
  }
  if (target.id === "memorialWall") {
    if (worldState.objectiveStep === 39) {
      setWorldDialogue(WORLD_DIALOGUE.memorialWallBuild);
      setWorldStep(40);
      worldState.storyChoices.memorialWallBuilt = true;
      if (!worldState.completedQuests.includes("chapter-five-the-empty-chair")) worldState.completedQuests.push("chapter-five-the-empty-chair");
      worldState.skillPoints += 1;
      grantWorldRewards(120, 0);
      pushFeed("Chapter 5 complete. +1 skill point.");
      saveWorldState(false);
    } else {
      speakAmbientLine(target);
    }
    return;
  }
  if (target.id === "crownScout") {
    if (worldState.objectiveStep === 26) {
      setWorldDialogue(WORLD_DIALOGUE.crownScoutTease);
      setWorldStep(27);
      if (!worldState.completedQuests.includes("chapter-three-the-tape")) worldState.completedQuests.push("chapter-three-the-tape");
      grantWorldRewards(90, 70);
      saveWorldState(false);
    } else if (worldState.objectiveStep === 41) {
      setWorldDialogue(WORLD_DIALOGUE.crownScoutSummons);
      setWorldStep(42);
      saveWorldState(false);
    } else {
      speakAmbientLine(target);
    }
    return;
  }
  if (target.id === "eliasCrowe") {
    if (worldState.objectiveStep === 42) {
      setWorldDialogue(WORLD_DIALOGUE.eliasOffer);
      setWorldStep(43);
      worldState.storyChoices.refusedCrowe = true;
      saveWorldState(false);
    } else {
      speakAmbientLine(target);
    }
    return;
  }
  if (target.id === "gymBell") {
    if (worldState.objectiveStep === 47) {
      setWorldDialogue(WORLD_DIALOGUE.chapterSevenStart);
      setWorldStep(48);
      saveWorldState(false);
      return;
    }
    speakAmbientLine(target);
    return;
  }
  if (target.id === "oldBoxer") {
    if (!worldState.sideQuests.oldBoxerMet) {
      worldState.sideQuests.oldBoxerMet = true;
      setWorldDialogue(WORLD_DIALOGUE.oldBoxerIntro);
      pushFeed("Eli offers a breathing drill. Talk again to start it.");
      saveWorldState(false);
    } else {
      startWorldMinigame("oldBoxer");
    }
    return;
  }
  if (target.id === "minaWorkbench") {
    if (!worldState.sideQuests.gearRepairIntro) {
      worldState.sideQuests.gearRepairIntro = true;
      setWorldDialogue(WORLD_DIALOGUE.minaWorkbenchIntro);
      pushFeed("Mina's repair drill unlocked. Use the workbench again to help.");
      saveWorldState(false);
    } else {
      startWorldMinigame("gearRepair");
    }
    return;
  }
  if (target.id === "roadworkRoute") {
    if (!worldState.sideQuests.roadworkIntro) {
      worldState.sideQuests.roadworkIntro = true;
      setWorldDialogue(WORLD_DIALOGUE.roadworkIntro);
      pushFeed("Roadwork unlocked. Use the route again to start the rain lap.");
      saveWorldState(false);
    } else {
      startWorldMinigame("roadwork");
    }
    return;
  }
  if (["jaxWraps", "jaxJacket", "gymRecords"].includes(target.id)) {
    collectWorldMemory(target);
    return;
  }
  if (target.id === "endingLastBell" || target.id === "endingRevenge" || target.id === "endingCrown") {
    if (worldState.objectiveStep !== 51) {
      speakAmbientLine(target);
      return;
    }
    const ending = target.id === "endingLastBell" ? "lastBell" : target.id === "endingRevenge" ? "revenge" : "crown";
    worldState.storyChoices.ending = ending;
    if (!worldState.completedQuests.includes("chapter-seven-last-bell")) worldState.completedQuests.push("chapter-seven-last-bell");
    if (ending === "lastBell") {
      setWorldDialogue(WORLD_DIALOGUE.endingBest);
      setWorldStep(52);
      grantWorldRewards(250, 200);
      showWorldStoryResult("The Last Bell", "Best ending unlocked.", "Victor lives and helps expose Crown. Kai stays. Mina rebuilds Rustbell Gym with memorials for Jax and Marcus on the wall.");
    } else if (ending === "revenge") {
      setWorldDialogue(WORLD_DIALOGUE.endingRevenge);
      setWorldStep(53);
      grantWorldRewards(120, 80);
      showWorldStoryResult("Revenge", "Mixed ending unlocked.", "Crown is exposed, but the win hollows out the room. Kai leaves because the ring started sounding too much like Crowe.");
    } else {
      setWorldDialogue(WORLD_DIALOGUE.endingCrown);
      setWorldStep(54);
      worldState.money += 650;
      showWorldStoryResult("The Crown", "Bad ending unlocked.", "The gym gets sponsor lights and loses its soul. You become famous enough that nobody hears you when you are alone.");
    }
    pushFeed(`Ending chosen: ${target.name}.`);
    saveWorldState(false);
    return;
  }
  if (target.id === "bag") {
    if (worldState.objectiveStep > 2) {
      startWorldMinigame("heavyBag");
      return;
    }
    setWorldDialogue(WORLD_DIALOGUE.bag);
    setWorldStep(3);
    return;
  }
  if (target.id === "upgrade") {
    worldState.upgradeOpen = true;
    renderUpgradeList();
    updateUi();
    return;
  }
  if (target.to) {
    if (target.locked) {
      pushFeed(`${target.label} is locked for now.`);
      return;
    }
    const destination = WORLD_AREAS[target.to] || WORLD_AREAS.gym;
    const spawn = target.spawn || destination.start;
    setWorldArea(target.to, spawn.x, spawn.y);
    if (target.nextStep) setWorldStep(target.nextStep);
    if (target.id === "dockGate" && !worldState.storyChoices.reachedDockyard) {
      worldState.storyChoices.reachedDockyard = true;
      setWorldDialogue({ ...WORLD_DIALOGUE.dockArrival, temporary: true });
      saveWorldState(false);
    }
    if (target.id === "marketAlley" && !worldState.storyChoices.reachedMarket) {
      worldState.storyChoices.reachedMarket = true;
      setWorldDialogue({ ...WORLD_DIALOGUE.marketArrival, temporary: true });
      saveWorldState(false);
    }
    if (target.id === "undergroundGate" && !worldState.storyChoices.reachedUnderground) {
      worldState.storyChoices.reachedUnderground = true;
      setWorldDialogue({ ...WORLD_DIALOGUE.undergroundArrival, temporary: true });
      saveWorldState(false);
    }
    if (target.id === "crownArch" && !worldState.storyChoices.reachedCrownDistrict) {
      worldState.storyChoices.reachedCrownDistrict = true;
      setWorldDialogue({ ...WORLD_DIALOGUE.crownDistrictArrival, temporary: true });
      saveWorldState(false);
    }
    if (target.id === "stadiumGate" && !worldState.storyChoices.reachedStadium) {
      worldState.storyChoices.reachedStadium = true;
      setWorldDialogue({ ...WORLD_DIALOGUE.stadiumArrival, temporary: true });
      saveWorldState(false);
    }
    return;
  }
  if (target.fight) {
    if (queuedWorldFightId === target.id) {
      queuedWorldFightId = "";
      startWorldFight(target.fight);
      return;
    }
    const sheet = target.portraitSheet || "portraits";
    const fightLine = target.fight.intro || (target.fight.boss ? "You want the gym safe? Come take the street from me." : "Gym kid? Let's see what those old lights taught you.");
    setWorldDialogue({
      speaker: target.name,
      portrait: target.portrait,
      portraitSheet: sheet,
      text: fightLine,
      temporary: true,
    });
    queuedWorldFightId = target.id;
    pushFeed(`${target.name}: ${fightLine} Press interact again to fight.`);
  }
}

function completeWorldFight(localWon, method) {
  const fight = pendingWorldFight;
  if (!fight) return;
  pendingWorldFight = null;
  queuedWorldFightId = "";
  playMode = "open-world";
  screenShake = 0;
  screenFlash = 0;
  hitStop = 0;
  particles.length = 0;
  floaters.length = 0;
  let resultMessage = "";
  if (localWon) {
    grantWorldRewards(fight.rewardXp, fight.rewardMoney);
    if (fight.storyFlag) worldState.storyChoices[fight.storyFlag] = true;
    if (fight.objectiveFlag && !worldState.defeatedEnemies.includes(fight.id)) worldState.defeatedEnemies.push(fight.id);
    if (!worldState.defeatedEnemies.includes(fight.id)) worldState.defeatedEnemies.push(fight.id);
    if (fight.nextStep) setWorldStep(fight.nextStep);
    setWorldArea(fight.returnArea || "oldtown", fight.returnX || worldState.x, fight.returnY || worldState.y);
    pushFeed(`Won ${fight.name}. +${fight.rewardXp} XP, +$${fight.rewardMoney}.`);
    resultMessage = fight.victoryFeed || (fight.boss ? `${fight.name} is down.` : "You keep moving.");
    if (fight.victoryFeed) pushFeed(fight.victoryFeed);
    else if (fight.boss) pushFeed(`${fight.name} is down.`);
  } else {
    setWorldArea("gym", WORLD_AREAS.gym.start.x, WORLD_AREAS.gym.start.y);
    resultMessage = fight.id === "crown-enforcer" && method === "Bell destroyed" ? "The Old Gym Bell was destroyed. Rustbell goes quiet." : method === "draw" ? "No reward for a draw. Marcus sends you back to work." : "You lost. Marcus patches you up at Rustbell Gym.";
    pushFeed(resultMessage);
  }
  worldResult = {
    title: localWon ? "Street Victory" : method === "draw" ? "No Decision" : "Back to Rustbell",
    subtitle: localWon ? `${fight.name} beaten by ${method}.` : `${fight.name} survives the night.`,
    reward: localWon ? `Rewards: +${fight.rewardXp} XP, +$${fight.rewardMoney}` : "Rewards: none",
    message: resultMessage,
    objective: worldObjectiveText(),
  };
  activeMode = "world-result";
  worldResultUnlockAt = nowMs() + WORLD_RESULT_LOCK_MS;
  saveWorldState(false);
  updateUi();
}

function showWorldStoryResult(title, subtitle, message) {
  playMode = "open-world";
  worldResult = {
    title,
    subtitle,
    reward: "Story complete",
    message,
    objective: worldObjectiveText(),
  };
  activeMode = "world-result";
  worldResultUnlockAt = nowMs() + WORLD_RESULT_LOCK_MS;
  saveWorldState(false);
  updateUi();
}

function continueWorldResult() {
  if (activeMode !== "world-result") return;
  if (worldResultLocked()) return;
  worldResult = null;
  worldResultUnlockAt = 0;
  activeMode = "world";
  screenShake = 0;
  screenFlash = 0;
  hitStop = 0;
  updateUi();
}

function grantWorldRewards(xp, money) {
  worldState.xp += Math.max(0, Math.round(xp));
  worldState.money += Math.max(0, Math.round(money));
  while (worldState.xp >= worldXpNeeded()) {
    worldState.xp -= worldXpNeeded();
    worldState.level += 1;
    worldState.skillPoints += 1;
    pushFeed(`Level ${worldState.level}. +1 skill point.`);
  }
}

function applyWorldStatsToFighter(fighter) {
  const stats = worldState.stats;
  fighter.worldSkills = [...worldState.unlockedSkills];
  fighter.punchLoadout = sanitizePunchLoadout(worldState.punchLoadout, worldState.unlockedPunches);
  fighter.power += stats.power * 0.55;
  fighter.speed += stats.speed * 0.38;
  fighter.maxBlock += stats.defence * 6;
  fighter.block = fighter.maxBlock;
  fighter.maxStamina += stats.endurance * 7;
  fighter.staminaCap = fighter.maxStamina;
  fighter.stamina = fighter.maxStamina;
  fighter.maxHeadHealth += stats.chin * 5;
  fighter.headHealth = fighter.maxHeadHealth;
  fighter.maxBodyHealth += stats.body * 6;
  fighter.bodyHealth = fighter.maxBodyHealth;
  fighter.counterBonus += stats.technique * 0.08;
  fighter.recovery += stats.technique * 0.035 + stats.speed * 0.02;
  fighter.toughness += stats.chin * 0.025 + stats.body * 0.03;
  updateHealthTotal(fighter);
}

function tuneWorldEnemy(fighter, fight) {
  fighter.name = fight.name;
  const mods = fight.mods || {};
  fighter.preferredAttack = fight.preferredAttack || "";
  fighter.bossPattern = fight.bossPattern || "";
  fighter.aiAttackRange = fight.aiAttackRange || 104;
  fighter.aiPhase = 1;
  fighter.power += 0.6 + (mods.power || 0);
  fighter.speed += mods.speed || 0;
  fighter.maxHeadHealth += 4 + (mods.head || 0);
  fighter.maxBodyHealth += 6 + (mods.body || 0);
  fighter.maxStamina += mods.stamina || 0;
  fighter.maxBlock += mods.block || 0;
  fighter.recovery += mods.recovery || 0;
  fighter.headHealth = fighter.maxHeadHealth;
  fighter.bodyHealth = fighter.maxBodyHealth;
  fighter.staminaCap = fighter.maxStamina;
  fighter.stamina = fighter.maxStamina;
  fighter.block = fighter.maxBlock;
  updateHealthTotal(fighter);
  initBossMechanic(fighter, fighters[0], fight);
}

function upgradeCost(statKey) {
  const rank = worldState.stats[statKey] || 0;
  return { money: 35 + rank * 25, skill: rank >= 3 ? 1 : 0 };
}

function upgradeWorldStat(statKey) {
  if (!Object.hasOwn(worldState.stats, statKey)) return;
  if (worldState.stats[statKey] >= 10) {
    pushFeed("That stat is already maxed.");
    return;
  }
  const cost = upgradeCost(statKey);
  if (worldState.money < cost.money || worldState.skillPoints < cost.skill) {
    pushFeed(`Need $${cost.money}${cost.skill ? ` and ${cost.skill} SP` : ""}.`);
    return;
  }
  worldState.money -= cost.money;
  worldState.skillPoints -= cost.skill;
  worldState.stats[statKey] += 1;
  pushFeed(`${WORLD_STATS.find(([key]) => key === statKey)?.[1] || statKey} upgraded.`);
  saveWorldState(false);
  renderUpgradeList();
  updateUi();
}

function unlockWorldSkill(skillId) {
  const skill = WORLD_SKILLS.find((item) => item.id === skillId);
  if (!skill) return;
  const move = punchMove(skill.move);
  if (worldState.unlockedSkills.includes(skillId) || isWorldPunchUnlocked(move.id)) {
    equipWorldPunch(move.id);
    return;
  }
  if (worldState.skillPoints < skill.cost) {
    pushFeed("Need more skill points.");
    return;
  }
  worldState.skillPoints -= skill.cost;
  worldState.unlockedSkills.push(skillId);
  if (!worldState.unlockedPunches.includes(move.id)) worldState.unlockedPunches.push(move.id);
  worldState.punchLoadout[move.slot] = move.id;
  pushFeed(`${skill.name} unlocked and equipped on ${PUNCH_SLOTS[move.slot].key}.`);
  saveWorldState(false);
  renderUpgradeList();
  updateUi();
}

function equipWorldPunch(moveId) {
  const move = PUNCH_MOVES[moveId];
  if (!move) return;
  if (!isWorldPunchUnlocked(move.id)) {
    pushFeed("Unlock that punch first.");
    return;
  }
  worldState.punchLoadout[move.slot] = move.id;
  pushFeed(`${move.name} equipped on ${PUNCH_SLOTS[move.slot].key}.`);
  saveWorldState(false);
  renderUpgradeList();
  updateUi();
}

function handleWorldUpgradeKey(key) {
  if (!worldState.upgradeOpen) return false;
  const statKeys = ["1", "2", "3", "4", "5", "6", "7"];
  const statIndex = statKeys.indexOf(key);
  if (statIndex >= 0 && WORLD_STATS[statIndex]) {
    upgradeWorldStat(WORLD_STATS[statIndex][0]);
    return true;
  }
  const skillIndex = UPGRADE_SKILL_KEYS.indexOf(String(key).toLowerCase());
  if (skillIndex >= 0 && WORLD_SKILLS[skillIndex]) {
    unlockWorldSkill(WORLD_SKILLS[skillIndex].id);
    return true;
  }
  return false;
}

function renderUpgradeList() {
  if (!ui.upgradeList) return;
  const statRows = WORLD_STATS.map(([key, label]) => {
    const cost = upgradeCost(key);
    const rank = worldState.stats[key] || 0;
    const canBuy = rank < 10 && worldState.money >= cost.money && worldState.skillPoints >= cost.skill;
    const skillCost = cost.skill ? ` + ${cost.skill} SP` : "";
    return `<div class="upgrade-row"><span>${label} ${rank}/10<br>$${cost.money}${skillCost}</span><button type="button" data-upgrade="${key}" ${canBuy ? "" : "disabled"}>${rank >= 10 ? "Max" : "Upgrade"}</button></div>`;
  }).join("");
  const loadoutRows = Object.entries(PUNCH_SLOTS).map(([slot, info]) => {
    const move = punchMove(worldState.punchLoadout?.[slot] || DEFAULT_PUNCH_LOADOUT[slot]);
    return `<div class="upgrade-row loadout-row"><span>${info.key} ${info.label}<br><b>${move.name}</b> - ${move.target === "body" ? "body" : "head"} ${move.attackClass}</span><button type="button" data-equip="${DEFAULT_PUNCH_LOADOUT[slot]}" ${move.id === DEFAULT_PUNCH_LOADOUT[slot] ? "disabled" : ""}>Basic</button></div>`;
  }).join("");
  const moveRows = Object.values(PUNCH_MOVES).map((move) => {
    const skill = punchUnlockForMove(move.id);
    const owned = isWorldPunchUnlocked(move.id);
    const equipped = worldState.punchLoadout?.[move.slot] === move.id;
    const canBuy = skill && !owned && worldState.skillPoints >= skill.cost;
    const button = owned
      ? `<button type="button" data-equip="${move.id}" ${equipped ? "disabled" : ""}>${equipped ? "Equipped" : `Equip ${PUNCH_SLOTS[move.slot].key}`}</button>`
      : `<button type="button" data-skill="${skill.id}" ${canBuy ? "" : "disabled"}>${skill.cost} SP</button>`;
    const unlockText = skill ? skill.effect : "Basic punch. Always available.";
    return `<div class="upgrade-row"><span>${PUNCH_SLOTS[move.slot].key} ${move.name}<br>${unlockText}</span>${button}</div>`;
  }).join("");
  ui.upgradeList.innerHTML = `<p class="upgrade-title">Stats</p>${statRows}<p class="upgrade-title">Punch Loadout</p>${loadoutRows}<p class="upgrade-title">Unlock Punches</p>${moveRows}`;
  ui.upgradeList.querySelectorAll("[data-upgrade]").forEach((button) => {
    button.addEventListener("click", () => upgradeWorldStat(button.dataset.upgrade));
  });
  ui.upgradeList.querySelectorAll("[data-skill]").forEach((button) => {
    button.addEventListener("click", () => unlockWorldSkill(button.dataset.skill));
  });
  ui.upgradeList.querySelectorAll("[data-equip]").forEach((button) => {
    button.addEventListener("click", () => equipWorldPunch(button.dataset.equip));
  });
}

function createLobby(retries = 0) {
  syncLocalStyle();
  closeNetwork();
  if (!window.Peer) {
    pushFeed("Multiplayer library did not load. Check your internet connection and refresh.");
    return;
  }

  const code = randomCode();
  network.code = code;
  network.connecting = true;
  playMode = "pvp-host";
  localIndex = 0;
  activeMode = "waiting";
  ui.lobbyCode.textContent = code;
  ui.statusLabel.textContent = "Creating lobby";
  pushFeed(`Lobby ${code} created. Share the code with your friend.`);

  network.peer = new Peer(`${PEER_PREFIX}${code}`);
  network.peer.on("open", () => {
    network.connecting = false;
    ui.statusLabel.textContent = "Waiting for friend";
    pushFeed("Waiting for a player to join.");
    updateUi();
  });
  network.peer.on("connection", (conn) => {
    if (network.conn && network.conn.open) {
      conn.close();
      return;
    }
    setupHostConnection(conn);
  });
  network.peer.on("error", (error) => {
    if (isPeerCodeCollision(error) && retries < 3) {
      pushFeed("Lobby code was already taken. Trying a new code.");
      createLobby(retries + 1);
      return;
    }
    network.connecting = false;
    ui.statusLabel.textContent = "Lobby error";
    pushFeed(`Lobby error: ${cleanError(error)}`);
    updateUi();
  });
  updateUi();
}

function isPeerCodeCollision(error) {
  const text = String(error?.type || error?.message || error).toLowerCase();
  return text.includes("unavailable") || text.includes("taken") || text.includes("id");
}

function joinLobby() {
  syncLocalStyle();
  const code = cleanCode(ui.joinCode.value);
  if (!code) {
    pushFeed("Enter a lobby code first.");
    return;
  }
  closeNetwork();
  if (!window.Peer) {
    pushFeed("Multiplayer library did not load. Check your internet connection and refresh.");
    return;
  }

  network.code = code;
  network.connecting = true;
  playMode = "pvp-guest";
  localIndex = 1;
  activeMode = "waiting";
  ui.lobbyCode.textContent = code;
  ui.statusLabel.textContent = "Joining lobby";
  pushFeed(`Joining lobby ${code}.`);

  network.peer = new Peer();
  network.peer.on("open", () => {
    setupGuestConnection(network.peer.connect(`${PEER_PREFIX}${code}`, { reliable: true }));
  });
  network.peer.on("error", (error) => {
    network.connecting = false;
    ui.statusLabel.textContent = "Join failed";
    pushFeed(`Join error: ${cleanError(error)}`);
    updateUi();
  });
  updateUi();
}

function setupHostConnection(conn) {
  network.conn = conn;
  conn.on("open", () => {
    network.connected = true;
    network.connecting = false;
    ui.statusLabel.textContent = "Friend connected";
    pushFeed("Friend joined. Click Start Match or Start PVP Match to play.");
    sendNet({ type: "hello", state: serializeState() });
    updateUi();
  });
  conn.on("data", (message) => {
    if (!message || typeof message !== "object") return;
    if (message.type === "input") {
      if (ARCHETYPES[message.style]) remoteStyle = message.style;
      Object.assign(remoteInput, sanitizeInput(message.input));
      if (Array.isArray(message.attacks)) remoteAttackQueue.push(...message.attacks.filter(isAttackType).slice(0, MAX_REMOTE_ATTACKS));
    }
    if (message.type === "restart-request") {
      guestRematchRequested = true;
      pushFeed("Friend wants a rematch. Press Restart or Start to accept.");
      ui.statusLabel.textContent = "Rematch requested";
      if (activeMode === "result" && hostRematchRequested) resetMatch("pvp");
    }
  });
  conn.on("close", () => {
    network.connected = false;
    ui.statusLabel.textContent = "Friend left";
    pushFeed(activeMode === "fight" ? "Friend disconnected during the fight." : "Friend disconnected.");
    updateUi();
  });
}

function setupGuestConnection(conn) {
  network.conn = conn;
  conn.on("open", () => {
    network.connected = true;
    network.connecting = false;
    ui.statusLabel.textContent = "Connected";
    pushFeed("Connected. Waiting for host to start.");
    sendInputNow();
    updateUi();
  });
  conn.on("data", (message) => {
    if (!message || typeof message !== "object") return;
    if (message.type === "hello" && message.state) applyState(message.state);
    if (message.type === "state") applyState(message.state);
    if (message.type === "rematch-start" && message.state) {
      applyState(message.state);
      pushFeed("Host started the rematch.");
    }
  });
  conn.on("close", () => {
    network.connected = false;
    ui.statusLabel.textContent = "Disconnected";
    pushFeed(activeMode === "fight" ? "Disconnected during the fight." : "Lobby disconnected.");
    updateUi();
  });
}

function closeNetwork() {
  if (network.conn) network.conn.close();
  if (network.peer) network.peer.destroy();
  network.peer = null;
  network.conn = null;
  network.code = "";
  network.connected = false;
  network.connecting = false;
  ui.lobbyCode.textContent = "-----";
}

function leaveLobby() {
  if (playMode === "open-world") {
    exitOpenWorld();
    return;
  }
  closeNetwork();
  playMode = "ai";
  localIndex = 0;
  activeMode = "menu";
  resultTitle = "";
  resultSubtitle = "";
  ui.statusLabel.textContent = "Pick a mode";
  pushFeed("Left multiplayer.");
  updateUi();
}

function sendInputNow() {
  if (playMode !== "pvp-guest" || !network.connected) return;
  const attacks = localAttackQueue.splice(0, Math.min(localAttackQueue.length, MAX_REMOTE_ATTACKS));
  if (localAttackQueue.length > MAX_REMOTE_ATTACKS * 2) localAttackQueue.length = MAX_REMOTE_ATTACKS;
  sendNet({ type: "input", input: sanitizeInput(input), attacks, style: localStyle });
  inputSendTimer = 0.05;
}

function sendStateNow() {
  if (playMode !== "pvp-host" || !network.connected) return;
  sendNet({ type: "state", state: serializeState() });
  netSendTimer = 0.05;
}

function sendNet(message) {
  if (!network.conn || !network.conn.open) return;
  network.conn.send(message);
}

function serializeState() {
  return {
    activeMode,
    roundTime,
    resultTitle,
    resultSubtitle,
    resultBreakdown,
    localStyle,
    remoteStyle,
    aiStyle,
    aiDifficulty,
    fighters: fighters.map(serializeFighter),
  };
}

function serializeFighter(fighter) {
  return {
    name: fighter.name,
    x: fighter.x,
    y: fighter.y,
    side: fighter.side,
    color: fighter.color,
    shorts: fighter.shorts,
    glove: fighter.glove,
    maxHealth: fighter.maxHealth,
    health: fighter.health,
    maxHeadHealth: fighter.maxHeadHealth,
    headHealth: fighter.headHealth,
    maxBodyHealth: fighter.maxBodyHealth,
    bodyHealth: fighter.bodyHealth,
    maxStamina: fighter.maxStamina,
    staminaCap: fighter.staminaCap,
    stamina: fighter.stamina,
    maxBlock: fighter.maxBlock,
    block: fighter.block,
    style: fighter.style,
    styleLabel: fighter.styleLabel,
    power: fighter.power,
    speed: fighter.speed,
    reach: fighter.reach,
    recovery: fighter.recovery,
    counterBonus: fighter.counterBonus,
    toughness: fighter.toughness,
    facing: fighter.facing,
    guard: fighter.guard,
    attack: fighter.attack,
    attackCooldown: fighter.attackCooldown,
    slipTimer: fighter.slipTimer,
    evadeTimer: fighter.evadeTimer,
    slipCooldown: fighter.slipCooldown,
    slipDx: fighter.slipDx,
    slipDy: fighter.slipDy,
    slipCounterTimer: fighter.slipCounterTimer,
    vulnerable: fighter.vulnerable,
    hitFlash: fighter.hitFlash,
    stunned: fighter.stunned,
    rocked: fighter.rocked,
    combo: fighter.combo,
    comboTimer: fighter.comboTimer,
    lastAttackType: fighter.lastAttackType,
    lastAttackSlot: fighter.lastAttackSlot,
    chainTimer: fighter.chainTimer,
    momentum: fighter.momentum,
  };
}

function applyState(state) {
  if (!state || !Array.isArray(state.fighters)) return;
  activeMode = state.activeMode || activeMode;
  if (!["menu", "waiting", "fight", "result"].includes(activeMode)) activeMode = "waiting";
  roundTime = clamp(finiteNumber(state.roundTime, roundTime), 0, ROUND_LENGTH);
  resultTitle = String(state.resultTitle || "").slice(0, 40);
  resultSubtitle = String(state.resultSubtitle || "").slice(0, 90);
  resultBreakdown = String(state.resultBreakdown || "").slice(0, 220);
  if (ARCHETYPES[state.localStyle]) remoteStyle = state.localStyle;
  if (ARCHETYPES[state.remoteStyle]) localStyle = state.remoteStyle;
  if (ARCHETYPES[state.aiStyle]) aiStyle = state.aiStyle;
  if (AI_DIFFICULTY[state.aiDifficulty]) aiDifficulty = state.aiDifficulty;
  state.fighters.slice(0, 2).forEach((source, index) => {
    Object.assign(fighters[index], sanitizeFighterState(source, index));
    clampFighterState(fighters[index]);
  });
  updateUi();
}

function sanitizeFighterState(source, index) {
  const base = serializeFighter(fighters[index]);
  if (!source || typeof source !== "object") return base;
  const safe = { ...base };
  Object.keys(base).forEach((key) => {
    const value = source[key];
    if (typeof base[key] === "number") safe[key] = finiteNumber(value, base[key]);
    else if (typeof base[key] === "boolean") safe[key] = Boolean(value);
    else if (typeof base[key] === "string") safe[key] = String(value || base[key]).slice(0, 32);
    else if (key === "attack") safe[key] = sanitizeAttack(value);
  });
  return safe;
}

function sanitizeAttack(value) {
  if (!value || typeof value !== "object" || !isAttackType(value.type) || value.type === "slip") return null;
  const safe = attackConfig(value.type, { power: 6 });
  return {
    ...safe,
    damage: clamp(finiteNumber(value.damage, safe.damage), 1, 45),
    range: clamp(finiteNumber(value.range, safe.range), 40, 140),
    duration: clamp(finiteNumber(value.duration, safe.duration), 0.08, 0.9),
    hitAt: clamp(finiteNumber(value.hitAt, safe.hitAt), 0.03, 0.6),
    cooldown: clamp(finiteNumber(value.cooldown, safe.cooldown), 0.05, 1.2),
    knockback: clamp(finiteNumber(value.knockback, safe.knockback), 0, 40),
    staminaDamage: clamp(finiteNumber(value.staminaDamage, safe.staminaDamage), 0, 25),
    blockDamage: clamp(finiteNumber(value.blockDamage, safe.blockDamage), 0, 35),
    capDamage: clamp(finiteNumber(value.capDamage, safe.capDamage), 0, 6),
    extraHit: clamp(finiteNumber(value.extraHit, safe.extraHit), 0, 0.6),
    counterDamage: clamp(finiteNumber(value.counterDamage, safe.counterDamage), 1, 1.6),
    stunBonus: clamp(finiteNumber(value.stunBonus, safe.stunBonus), 0, 0.35),
    missVulnerable: clamp(finiteNumber(value.missVulnerable, safe.missVulnerable), 0, 0.9),
    chainName: String(value.chainName || "").slice(0, 16),
    elapsed: clamp(finiteNumber(value.elapsed, 0), 0, 1),
    didHit: Boolean(value.didHit),
    landed: Boolean(value.landed),
  };
}

function clampFighterState(fighter) {
  fighter.x = clamp(finiteNumber(fighter.x, 480), RING.left + 36, RING.right - 36);
  fighter.y = clamp(finiteNumber(fighter.y, 330), RING.top + 38, RING.bottom - 12);
  fighter.maxHeadHealth = clamp(finiteNumber(fighter.maxHeadHealth, 100), 60, 150);
  fighter.maxBodyHealth = clamp(finiteNumber(fighter.maxBodyHealth, 118), 70, 170);
  fighter.maxStamina = clamp(finiteNumber(fighter.maxStamina, 100), 60, 140);
  fighter.maxBlock = clamp(finiteNumber(fighter.maxBlock, 80), 40, 130);
  fighter.headHealth = clamp(finiteNumber(fighter.headHealth, fighter.maxHeadHealth), 0, fighter.maxHeadHealth);
  fighter.bodyHealth = clamp(finiteNumber(fighter.bodyHealth, fighter.maxBodyHealth), 0, fighter.maxBodyHealth);
  fighter.staminaCap = clamp(finiteNumber(fighter.staminaCap, fighter.maxStamina), fighter.maxStamina * 0.3, fighter.maxStamina);
  fighter.stamina = clamp(finiteNumber(fighter.stamina, fighter.staminaCap), 0, fighter.staminaCap);
  fighter.block = clamp(finiteNumber(fighter.block, fighter.maxBlock), 0, fighter.maxBlock);
  fighter.attackCooldown = clamp(finiteNumber(fighter.attackCooldown, 0), 0, 2);
  fighter.slipCooldown = clamp(finiteNumber(fighter.slipCooldown, 0), 0, 2);
  fighter.stunned = clamp(finiteNumber(fighter.stunned, 0), 0, 2);
  fighter.rocked = clamp(finiteNumber(fighter.rocked, 0), 0, 4);
  updateHealthTotal(fighter);
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sanitizeInput(source) {
  return {
    up: Boolean(source?.up),
    down: Boolean(source?.down),
    left: Boolean(source?.left),
    right: Boolean(source?.right),
    guard: Boolean(source?.guard),
  };
}

function isAttackType(type) {
  return type === "slip" || Boolean(PUNCH_MOVES[type]);
}

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function cleanCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}

function initAudio() {
  if (audioMuted || audioContext) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  audioContext = new AudioCtor();
}

function playSound(type) {
  if (audioMuted) return;
  initAudio();
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  const osc = audioContext.createOscillator();
  const settings = {
    jab: [220, 0.035, 0.035, "square"],
    hook: [110, 0.07, 0.06, "sawtooth"],
    body: [145, 0.06, 0.05, "triangle"],
    hit: [72, 0.09, 0.09, "triangle"],
    block: [320, 0.045, 0.045, "square"],
    break: [95, 0.14, 0.1, "sawtooth"],
    slip: [520, 0.035, 0.03, "sine"],
    result: [180, 0.2, 0.08, "triangle"],
  }[type] || [200, 0.05, 0.04, "sine"];
  osc.type = settings[3];
  osc.frequency.setValueAtTime(settings[0], now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, settings[0] * 0.55), now + settings[1]);
  gain.gain.setValueAtTime(settings[2], now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + settings[1]);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + settings[1] + 0.02);
}

function setReducedMotion(value) {
  reducedMotion = Boolean(value);
  ui.motionToggle.checked = reducedMotion;
  saveSettings();
}

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    audioMuted = Boolean(parsed.audioMuted);
    reducedMotion = typeof parsed.reducedMotion === "boolean" ? parsed.reducedMotion : reducedMotion;
    ui.muteToggle.checked = audioMuted;
    ui.motionToggle.checked = reducedMotion;
  } catch {
    ui.muteToggle.checked = audioMuted;
    ui.motionToggle.checked = reducedMotion;
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ audioMuted, reducedMotion }));
  } catch {
    // Settings are a convenience; the game should still run if storage is blocked.
  }
}

function stopAmbience() {
  if (!ambience) return;
  try {
    const now = audioContext?.currentTime || 0;
    ambience.gain.gain.cancelScheduledValues(now);
    ambience.gain.gain.setTargetAtTime(0.0001, now, 0.18);
  } catch {
    // Audio shutdown should never interrupt gameplay.
  }
}

function ensureAmbience() {
  if (audioMuted || !audioContext) return null;
  if (ambience) return ambience;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "sine";
  osc.frequency.value = 58;
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  ambience = { osc, gain };
  return ambience;
}

function ambienceProfile() {
  if (activeMode === "fight") {
    const bossFight = Boolean(pendingWorldFight?.boss);
    return { freq: bossFight ? 48 : 62, gain: bossFight ? 0.028 : 0.014 };
  }
  if (activeMode === "world" || activeMode === "world-minigame") {
    const grief = worldState.storyChoices?.jaxGone || worldState.storyChoices?.marcusGone;
    const areaGain = worldState.area === "underground" ? 0.026 : worldState.area === "crown" || worldState.area === "stadium" ? 0.022 : 0.014;
    return { freq: grief ? 42 : 54, gain: reducedMotion ? areaGain * 0.55 : areaGain };
  }
  return { freq: 60, gain: 0.0001 };
}

function updateAmbience() {
  if (audioMuted || !audioContext) {
    stopAmbience();
    return;
  }
  const node = ensureAmbience();
  if (!node) return;
  const profile = ambienceProfile();
  const now = audioContext.currentTime;
  node.osc.frequency.setTargetAtTime(profile.freq, now, 0.85);
  node.gain.gain.setTargetAtTime(profile.gain, now, 0.65);
}

function addShake(amount) {
  screenShake = Math.max(screenShake, reducedMotion ? amount * 0.18 : amount);
}

function addHitStop(amount) {
  hitStop = Math.max(hitStop, reducedMotion ? amount * 0.18 : amount);
}

function addFlash(amount) {
  screenFlash = Math.max(screenFlash, reducedMotion ? amount * 0.12 : amount);
}

function syncLocalStyle() {
  localStyle = ARCHETYPES[ui.styleSelect.value] ? ui.styleSelect.value : "balanced";
  if (activeMode !== "fight" && playMode !== "pvp-guest") {
    resetFighter(fighters[localIndex], localIndex);
    if (playMode === "ai") resetFighter(fighters[localIndex === 0 ? 1 : 0], localIndex === 0 ? 1 : 0);
  }
  if (playMode === "pvp-guest") sendInputNow();
  updateStylePreview();
  updateUi();
}

function setTutorialVisible(value) {
  tutorialVisible = Boolean(value);
  ui.tutorialBody.style.display = tutorialVisible ? "block" : "none";
  ui.toggleHelpBtn.textContent = tutorialVisible ? "Hide" : "Show";
  ui.showHelpBtn.textContent = tutorialVisible ? "Hide Help" : "How to Play";
}

function updateStylePreview() {
  const style = ARCHETYPES[ui.styleSelect.value] ? ui.styleSelect.value : "balanced";
  const profile = ARCHETYPES[style];
  const stats = [
    ["Power", profile.power, 10],
    ["Speed", profile.speed, 10],
    ["Reach", profile.reach, 1.2],
    ["Tough", profile.toughness, 1.25],
    ["Stamina", profile.stamina, 120],
  ];
  ui.stylePreview.innerHTML = `<p>${STYLE_DESCRIPTIONS[style]}</p>` + stats.map(([name, value, max]) => {
    const pct = clamp((value / max) * 100, 8, 100);
    return `<div class="stat-line"><span>${name}</span><i style="--fill:${pct}%"></i></div>`;
  }).join("");
}

function cleanError(error) {
  return String(error?.message || error || "unknown error").replace(`${PEER_PREFIX}${network.code}`, "this code");
}

async function copyLobbyLink() {
  if (!network.code) {
    pushFeed("Create a lobby first.");
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("join", network.code);
  const text = url.href;
  try {
    await navigator.clipboard.writeText(text);
    pushFeed("Lobby link copied.");
  } catch {
    pushFeed(`Share code ${network.code}.`);
  }
}

function toggleFullscreen() {
  const target = document.querySelector(".game-shell") || document.documentElement;
  if (document.fullscreenElement) {
    document.exitFullscreen?.();
    return;
  }
  if (!target.requestFullscreen) {
    pushFeed("Fullscreen is not available in this browser.");
    return;
  }
  target.requestFullscreen().catch(() => pushFeed("Fullscreen was blocked by the browser."));
}

function updateFullscreenButton() {
  if (ui.fullscreenBtn) ui.fullscreenBtn.textContent = document.fullscreenElement ? "Windowed" : "Fullscreen";
}

function pushFeed(text) {
  const item = document.createElement("div");
  item.className = "feed-item";
  item.textContent = text;
  ui.feed.prepend(item);
  while (ui.feed.children.length > 7) {
    ui.feed.lastElementChild.remove();
  }
}

function updateUi() {
  const local = fighters[localIndex];
  const opponent = fighters[localIndex === 0 ? 1 : 0];
  updateActionLabels();

  ui.localName.textContent = local.name;
  ui.modeText.textContent = activeMode === "world" ? "World" : activeMode === "world-minigame" ? "Activity" : activeMode === "fight" ? "Fight" : activeMode === "waiting" ? "Lobby" : activeMode === "result" || activeMode === "world-result" ? "Result" : "Menu";
  ui.healthText.textContent = `${Math.ceil(local.headHealth)} / ${local.maxHeadHealth}`;
  ui.bodyText.textContent = `${Math.ceil(local.bodyHealth)} / ${local.maxBodyHealth}`;
  ui.blockText.textContent = `${Math.ceil(local.block)} / ${local.maxBlock}`;
  ui.staminaText.textContent = `${Math.ceil(local.stamina)} / ${Math.ceil(local.staminaCap)}`;
  ui.healthBar.style.width = `${clamp(headPercent(local) * 100, 0, 100)}%`;
  ui.bodyBar.style.width = `${clamp(bodyPercent(local) * 100, 0, 100)}%`;
  ui.blockBar.style.width = `${clamp(blockPercent(local) * 100, 0, 100)}%`;
  ui.staminaBar.style.width = `${clamp(staminaPercent(local) * 100, 0, 100)}%`;
  ui.roleText.textContent = playMode === "pvp-host" ? "Host" : playMode === "pvp-guest" ? "Guest" : playMode === "local" ? "Local P1" : playMode === "open-world" ? "Rustbell" : "Solo";
  ui.comboText.textContent = `${local.combo}x`;
  ui.enemyText.textContent = playMode === "ai" ? "AI" : opponent.name;
  ui.styleText.textContent = local.styleLabel || ARCHETYPES[localStyle].label;
  ui.momentumText.textContent = momentumLabel(local.momentum - opponent.momentum);
  ui.clockText.textContent = formatClock(roundTime);

  if (playMode === "pvp-host") {
    ui.startBtn.textContent = network.connected ? "Start PVP Match" : "Waiting";
    ui.hostBtn.textContent = network.connected ? "Start Match" : "Creating Lobby";
  } else if (playMode === "pvp-guest") {
    ui.startBtn.textContent = "Host Starts";
    ui.hostBtn.textContent = "Host Starts";
  } else if (playMode === "local") {
    ui.startBtn.textContent = activeMode === "fight" ? "Local Fight" : "Start Local 2P";
    ui.hostBtn.textContent = "Create Lobby";
  } else if (playMode === "open-world") {
    ui.startBtn.textContent = activeMode === "world-result" ? (worldResultLocked() ? "Wait..." : "Continue") : activeMode === "world" || activeMode === "world-minigame" ? "World Active" : "Open World";
    ui.hostBtn.textContent = "Create Lobby";
  } else {
    ui.startBtn.textContent = activeMode === "fight" ? "Fighting" : "Start AI Match";
    ui.hostBtn.textContent = "Create Lobby";
  }
  ui.startBtn.disabled = playMode === "pvp-guest" || (playMode === "pvp-host" && !network.connected);
  ui.restartBtn.disabled = activeMode === "fight" && playMode === "pvp-guest";
  ui.pauseBtn.textContent = activeMode === "world-minigame" ? "Cancel" : activeMode === "world" ? (worldState.menuOpen || worldState.upgradeOpen ? "Close" : "Pause") : paused ? "Resume" : "Pause";
  updateWorldUi();
}

function updateActionLabels() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    const action = button.dataset.action;
    if (activeMode === "world-minigame") {
      const labels = { jab: "J", hook: "K", body: "U", slip: "SLIP", guard: "GUARD" };
      button.textContent = labels[action] || "ACT";
      button.setAttribute("aria-label", action === "jab" ? "Jab or confirm minigame input" : minigameActionLabel(action));
      return;
    }
    if (activeMode === "world") {
      button.textContent = "INTERACT";
      button.setAttribute("aria-label", "Interact");
      return;
    }
    if (action === "slip") {
      button.textContent = "SLIP";
      button.setAttribute("aria-label", "Slip");
      return;
    }
    const slot = slotForAction(action);
    const baseMove = PUNCH_MOVES[action];
    const move = playMode === "open-world" && slot ? punchMove(worldState.punchLoadout?.[slot]) : baseMove;
    if (!move) return;
    const key = PUNCH_SLOTS[move.slot]?.key || "";
    button.textContent = key ? `${key} ${move.short}` : move.short;
    button.setAttribute("aria-label", move.name);
  });
}

function updateWorldUi() {
  if (!ui.worldCard) return;
  const showWorld = playMode === "open-world" || activeMode === "world" || activeMode === "world-minigame";
  ui.worldCard.hidden = !showWorld;
  if (!showWorld) return;
  const area = WORLD_AREAS[worldState.area] || WORLD_AREAS.gym;
  const xpNeed = worldXpNeeded();
  ui.worldAreaText.textContent = area.label;
  ui.worldLevelText.textContent = `Lv ${worldState.level}`;
  ui.worldXpText.textContent = `${worldState.xp} / ${xpNeed}`;
  ui.worldXpBar.style.width = `${clamp((worldState.xp / xpNeed) * 100, 0, 100)}%`;
  ui.worldMoneyText.textContent = `$${worldState.money}`;
  ui.worldSkillText.textContent = `${worldState.skillPoints} SP`;
  ui.worldObjectiveText.textContent = worldObjectiveText();
  ui.worldPromptText.textContent = `${worldPromptText()} | ${worldLoadoutText()}`;
  ui.upgradePanel.hidden = !worldState.upgradeOpen;
  if (worldState.upgradeOpen && !ui.upgradeList.children.length) renderUpgradeList();
}

function worldLoadoutText() {
  const loadout = worldState.punchLoadout || DEFAULT_PUNCH_LOADOUT;
  return `J:${punchMove(loadout.light).short} K:${punchMove(loadout.power).short} U:${punchMove(loadout.body).short}`;
}

function momentumLabel(value) {
  if (value > 34) return "Surging";
  if (value > 12) return "Edge";
  if (value < -34) return "Trouble";
  if (value < -12) return "Behind";
  return "Even";
}

function draw() {
  resizeCanvas();
  const worldLike = activeMode === "world" || activeMode === "world-minigame";
  const shakeX = worldLike ? 0 : (Math.random() - 0.5) * screenShake;
  const shakeY = worldLike ? 0 : (Math.random() - 0.5) * screenShake;

  ctx.save();
  ctx.setTransform(
    (canvas.width / dpr / WORLD.width) * dpr,
    0,
    0,
    (canvas.height / dpr / WORLD.height) * dpr,
    shakeX * dpr,
    shakeY * dpr
  );

  if (activeMode === "world" || activeMode === "world-minigame") {
    drawWorld();
  } else {
    drawBackdrop();
    drawRing();
    [...fighters].sort((a, b) => a.y - b.y).forEach(drawFighter);
    drawBossMechanics();
    drawDebugOverlay();
    drawParticles();
    drawFloaters();
    drawFightHud();
    drawCanvasStatus();
    drawScreenEffects();
  }
  ctx.restore();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(320, Math.round(rect.width * dpr));
  const height = Math.max(180, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function drawWorld() {
  const area = WORLD_AREAS[worldState.area] || WORLD_AREAS.gym;
  const image = worldImages[area.image];
  if (image?.complete && image.naturalWidth) {
    ctx.drawImage(image, 0, 0, WORLD.width, WORLD.height);
  } else {
    drawBackdrop();
  }

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  if (worldState.area === "crown") {
    ctx.fillStyle = "rgba(255, 240, 168, 0.1)";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = "rgba(245, 247, 255, 0.18)";
    [220, 500, 760].forEach((x, index) => {
      ctx.fillRect(x, 76 + index * 18, 34, 260);
      ctx.fillRect(x + 48, 92 + index * 16, 18, 210);
    });
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.fillRect(388, 214, 250, 36);
    ctx.fillStyle = "#fff0a8";
    ctx.font = "900 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("THE CROWN CIRCUIT", 513, 238);
  }
  if (worldState.area === "stadium") {
    const glow = ctx.createRadialGradient(480, 270, 40, 480, 270, 420);
    glow.addColorStop(0, "rgba(255, 240, 168, 0.2)");
    glow.addColorStop(0.55, "rgba(214, 59, 52, 0.16)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0.38)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.strokeStyle = "rgba(255, 240, 168, 0.3)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(480, 332, 258, 96, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
    roundedRect(314, 198, 332, 38, 8);
    ctx.fill();
    ctx.fillStyle = "#fff0a8";
    ctx.font = "900 15px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LAST BELL TOURNAMENT", 480, 222);
  }
  drawWorldMoodOverlay(area);
  drawWorldExits();
  drawWorldCollisionDebug();
  drawWorldMarker();
  drawWorldEntities();
  drawParticles();
  drawFloaters();
  drawWorldHud();
  drawWorldDialogue();
  if (activeMode === "world-minigame") drawWorldMinigameOverlay();
  if (worldState.menuOpen) drawWorldPause();
  if (worldState.upgradeOpen) drawWorldUpgradeOverlay();
  ctx.restore();
}

function worldMoodStrength() {
  let mood = 0.1;
  if (worldState.chapter >= 2) mood += 0.03;
  if (worldState.chapter >= 4) mood += 0.05;
  if (worldState.storyChoices?.jaxGone) mood += 0.08;
  if (worldState.storyChoices?.marcusGone) mood += 0.07;
  if (worldState.storyChoices?.ending === "crown") mood += 0.12;
  if (worldState.area === "underground") mood += 0.12;
  if (worldState.area === "crown" || worldState.area === "stadium") mood += 0.05;
  return clamp(mood, 0.1, 0.44);
}

function drawWorldMoodOverlay(area) {
  const strength = worldMoodStrength();
  const grief = worldState.storyChoices?.jaxGone || worldState.storyChoices?.marcusGone;
  ctx.save();
  const shade = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height);
  shade.addColorStop(0, `rgba(8, 10, 14, ${strength + 0.04})`);
  shade.addColorStop(0.52, `rgba(27, 20, 19, ${strength * 0.38})`);
  shade.addColorStop(1, `rgba(0, 0, 0, ${strength + 0.1})`);
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  if (worldState.area === "underground") {
    ctx.fillStyle = "rgba(214, 59, 52, 0.15)";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    drawAreaStamp("UNDERGROUND", "no refs, no mercy", "#f26b55");
  } else if (worldState.area === "crown") {
    drawAreaStamp("CROWN DISTRICT", "clean glass, dirty contracts", "#fff0a8");
  } else if (worldState.area === "stadium") {
    drawAreaStamp("CHAMPION STADIUM", "the crowd hides the truth", "#fff0a8");
  } else if (worldState.area === "dockyard") {
    drawAreaStamp("DOCKYARD", "friday money", "#9eb7ff");
  }

  if (grief && ["oldtown", "dockyard", "market", "underground"].includes(worldState.area)) {
    const t = reducedMotion ? 0 : performance.now() / 36;
    ctx.strokeStyle = "rgba(158, 183, 255, 0.22)";
    ctx.lineWidth = 1.25;
    for (let i = 0; i < 36; i += 1) {
      const x = (i * 73 + t) % (WORLD.width + 80) - 60;
      const y = (i * 41 + t * 1.5) % (WORLD.height + 80) - 40;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 20, y + 42);
      ctx.stroke();
    }
  }

  if (worldState.storyChoices?.marcusGone && worldState.area === "gym") {
    const glow = ctx.createRadialGradient(WORLD_ENTITIES.gymBell.x, WORLD_ENTITIES.gymBell.y, 16, WORLD_ENTITIES.gymBell.x, WORLD_ENTITIES.gymBell.y, 190);
    glow.addColorStop(0, "rgba(255, 240, 168, 0.22)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  }
  ctx.restore();
}

function drawAreaStamp(title, subtitle, color) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  roundedRect(704, 32, 218, 52, 8);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = "900 14px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 813, 54);
  ctx.fillStyle = "rgba(255, 247, 232, 0.66)";
  ctx.font = "800 10px Inter, system-ui, sans-serif";
  ctx.fillText(subtitle, 813, 72);
  ctx.restore();
}

function drawWorldMarker() {
  if (activeMode === "world-minigame" && activeMinigame?.type === "route") {
    const point = activeMinigame.route[activeMinigame.routeIndex];
    if (point) drawTargetRing(point.x, point.y, "#fff0a8", "RUN");
    return;
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 1) {
    drawTargetRing(520, 360, "#fff0a8", "FOOTWORK");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 2) {
    drawTargetRing(WORLD_ENTITIES.bag.x, WORLD_ENTITIES.bag.y, "#fff0a8", "BAG");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 4 && !worldState.defeatedEnemies.includes("oldtown-scrapper")) {
    drawTargetRing(WORLD_ENTITIES.scrapper.x, WORLD_ENTITIES.scrapper.y, "#f26b55", "FIGHT");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 5) {
    drawTargetRing(WORLD_ENTITIES.marcus.x, WORLD_ENTITIES.marcus.y, "#fff0a8", "MARCUS");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 6) {
    drawTargetRing(WORLD_ENTITIES.jax.x, WORLD_ENTITIES.jax.y, "#fff0a8", "JAX");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 7) {
    drawTargetRing(WORLD_ENTITIES.rico.x, WORLD_ENTITIES.rico.y, "#9eb7ff", "RICO");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 8) {
    drawTargetRing(WORLD_ENTITIES.tess.x, WORLD_ENTITIES.tess.y, "#f17f43", "TESS");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 9) {
    drawTargetRing(WORLD_ENTITIES.bigAl.x, WORLD_ENTITIES.bigAl.y, "#79d1a2", "BIG AL");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 10) {
    drawTargetRing(WORLD_ENTITIES.marcus.x, WORLD_ENTITIES.marcus.y, "#fff0a8", "MARCUS");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 11) {
    drawTargetRing(WORLD_ENTITIES.mason.x, WORLD_ENTITIES.mason.y, "#f26b55", "MASON");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 12) {
    drawTargetRing(WORLD_ENTITIES.marcus.x, WORLD_ENTITIES.marcus.y, "#fff0a8", "MARCUS");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 13) {
    drawTargetRing(WORLD_ENTITIES.jax.x, WORLD_ENTITIES.jax.y, "#fff0a8", "JAX");
  }
  if (worldState.area === "gym" && (worldState.objectiveStep === 14 || worldState.objectiveStep === 17)) {
    drawTargetRing(WORLD_ENTITIES.mina.x, WORLD_ENTITIES.mina.y, "#9eb7ff", "MINA");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 15) {
    const gymExit = worldExitsForArea("gym").find((exit) => exit.id === "gymExit");
    if (gymExit) drawTargetRing(gymExit.x, gymExit.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 15) {
    const dockGate = worldExitsForArea("oldtown").find((exit) => exit.id === "dockGate");
    if (dockGate) drawTargetRing(dockGate.x, dockGate.y, "#fff0a8", "DOCKS");
  }
  if (worldState.area === "dockyard" && worldState.objectiveStep === 15) {
    drawTargetRing(WORLD_ENTITIES.dockBruiser.x, WORLD_ENTITIES.dockBruiser.y, "#f26b55", "CAL");
  }
  if (worldState.area === "dockyard" && worldState.objectiveStep === 16) {
    drawTargetRing(WORLD_ENTITIES.bodySnatcher.x, WORLD_ENTITIES.bodySnatcher.y, "#f17f43", "VERA");
  }
  if (worldState.area === "dockyard" && worldState.objectiveStep === 18) {
    drawTargetRing(WORLD_ENTITIES.sofia.x, WORLD_ENTITIES.sofia.y, "#9eb7ff", "SOFIA");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 19) {
    drawTargetRing(WORLD_ENTITIES.marcus.x, WORLD_ENTITIES.marcus.y, "#fff0a8", "MARCUS");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 20) {
    drawTargetRing(WORLD_ENTITIES.marcus.x, WORLD_ENTITIES.marcus.y, "#fff0a8", "MARCUS");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 21) {
    const gymExit = worldExitsForArea("gym").find((exit) => exit.id === "gymExit");
    if (gymExit) drawTargetRing(gymExit.x, gymExit.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 21) {
    const marketAlley = worldExitsForArea("oldtown").find((exit) => exit.id === "marketAlley");
    if (marketAlley) drawTargetRing(marketAlley.x, marketAlley.y, "#fff0a8", "MARKET");
  }
  if (worldState.area === "market" && worldState.objectiveStep === 21) {
    drawTargetRing(WORLD_ENTITIES.mara.x, WORLD_ENTITIES.mara.y, "#fff0a8", "MARA");
  }
  if (worldState.area === "market" && worldState.objectiveStep === 22) {
    drawTargetRing(WORLD_ENTITIES.tapeRunner.x, WORLD_ENTITIES.tapeRunner.y, "#f26b55", "RUNNER");
  }
  if (worldState.area === "market" && worldState.objectiveStep === 23) {
    const oldtownGate = worldExitsForArea("market").find((exit) => exit.id === "oldtownMarketGate");
    if (oldtownGate) drawTargetRing(oldtownGate.x, oldtownGate.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 23) {
    const gymDoor = worldExitsForArea("oldtown").find((exit) => exit.id === "gymDoor");
    if (gymDoor) drawTargetRing(gymDoor.x, gymDoor.y, "#fff0a8", "GYM");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 23) {
    drawTargetRing(WORLD_ENTITIES.tapePlayer.x, WORLD_ENTITIES.tapePlayer.y, "#9eb7ff", "TAPE");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 24) {
    drawTargetRing(WORLD_ENTITIES.kai.x, WORLD_ENTITIES.kai.y, "#fff0a8", "KAI");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 25) {
    drawTargetRing(WORLD_ENTITIES.marcus.x, WORLD_ENTITIES.marcus.y, "#fff0a8", "MARCUS");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 26) {
    const gymExit = worldExitsForArea("gym").find((exit) => exit.id === "gymExit");
    if (gymExit) drawTargetRing(gymExit.x, gymExit.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 26) {
    const marketAlley = worldExitsForArea("oldtown").find((exit) => exit.id === "marketAlley");
    if (marketAlley) drawTargetRing(marketAlley.x, marketAlley.y, "#fff0a8", "MARKET");
  }
  if (worldState.area === "market" && worldState.objectiveStep === 26) {
    drawTargetRing(WORLD_ENTITIES.crownScout.x, WORLD_ENTITIES.crownScout.y, "#fff0a8", "SCOUT");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 27) {
    drawTargetRing(WORLD_ENTITIES.jax.x, WORLD_ENTITIES.jax.y, "#fff0a8", "JAX");
  }
  if (worldState.area === "market" && worldState.objectiveStep === 27) {
    const oldtownGate = worldExitsForArea("market").find((exit) => exit.id === "oldtownMarketGate");
    if (oldtownGate) drawTargetRing(oldtownGate.x, oldtownGate.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 27) {
    const gymDoor = worldExitsForArea("oldtown").find((exit) => exit.id === "gymDoor");
    if (gymDoor) drawTargetRing(gymDoor.x, gymDoor.y, "#fff0a8", "GYM");
  }
  if (worldState.area === "gym" && (worldState.objectiveStep === 28 || worldState.objectiveStep === 33)) {
    drawTargetRing(WORLD_ENTITIES.mina.x, WORLD_ENTITIES.mina.y, "#9eb7ff", "MINA");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 29) {
    const gymExit = worldExitsForArea("gym").find((exit) => exit.id === "gymExit");
    if (gymExit) drawTargetRing(gymExit.x, gymExit.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 29) {
    const dockGate = worldExitsForArea("oldtown").find((exit) => exit.id === "dockGate");
    if (dockGate) drawTargetRing(dockGate.x, dockGate.y, "#fff0a8", "DOCKS");
  }
  if (worldState.area === "dockyard" && worldState.objectiveStep === 29) {
    const undergroundGate = worldExitsForArea("dockyard").find((exit) => exit.id === "undergroundGate");
    if (undergroundGate) drawTargetRing(undergroundGate.x, undergroundGate.y, "#fff0a8", "ARENA");
  }
  if (worldState.area === "underground" && worldState.objectiveStep === 30) {
    drawTargetRing(WORLD_ENTITIES.gateFighter.x, WORLD_ENTITIES.gateFighter.y, "#79d1a2", "GATE");
  }
  if (worldState.area === "underground" && worldState.objectiveStep === 31) {
    drawTargetRing(WORLD_ENTITIES.dirtyFighter.x, WORLD_ENTITIES.dirtyFighter.y, "#f26b55", "RAZOR");
  }
  if (worldState.area === "underground" && worldState.objectiveStep === 32) {
    drawTargetRing(WORLD_ENTITIES.jaxArena.x, WORLD_ENTITIES.jaxArena.y, "#fff0a8", "JAX");
  }
  if (worldState.area === "underground" && worldState.objectiveStep === 33) {
    const exit = worldExitsForArea("underground").find((door) => door.id === "undergroundExit");
    if (exit) drawTargetRing(exit.x, exit.y, "#fff0a8", "DOCKS");
  }
  if (worldState.area === "dockyard" && worldState.objectiveStep === 33) {
    const oldtownGate = worldExitsForArea("dockyard").find((exit) => exit.id === "oldtownGate");
    if (oldtownGate) drawTargetRing(oldtownGate.x, oldtownGate.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 33) {
    const gymDoor = worldExitsForArea("oldtown").find((exit) => exit.id === "gymDoor");
    if (gymDoor) drawTargetRing(gymDoor.x, gymDoor.y, "#fff0a8", "GYM");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 34) {
    drawTargetRing(WORLD_ENTITIES.emptyChair.x, WORLD_ENTITIES.emptyChair.y, "#fff0a8", "CHAIR");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 35) {
    drawTargetRing(WORLD_ENTITIES.mina.x, WORLD_ENTITIES.mina.y, "#9eb7ff", "MINA");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 36) {
    const gymExit = worldExitsForArea("gym").find((exit) => exit.id === "gymExit");
    if (gymExit) drawTargetRing(gymExit.x, gymExit.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 36) {
    drawTargetRing(WORLD_ENTITIES.jaxMother.x, WORLD_ENTITIES.jaxMother.y, "#fff0a8", "MRS. BELL");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 37) {
    const gymDoor = worldExitsForArea("oldtown").find((exit) => exit.id === "gymDoor");
    if (gymDoor) drawTargetRing(gymDoor.x, gymDoor.y, "#fff0a8", "GYM");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 37) {
    drawTargetRing(WORLD_ENTITIES.kai.x, WORLD_ENTITIES.kai.y, "#fff0a8", "KAI");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 38) {
    const gymExit = worldExitsForArea("gym").find((exit) => exit.id === "gymExit");
    if (gymExit) drawTargetRing(gymExit.x, gymExit.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 38) {
    const dockGate = worldExitsForArea("oldtown").find((exit) => exit.id === "dockGate");
    if (dockGate) drawTargetRing(dockGate.x, dockGate.y, "#fff0a8", "DOCKS");
  }
  if (worldState.area === "dockyard" && worldState.objectiveStep === 38) {
    const undergroundGate = worldExitsForArea("dockyard").find((exit) => exit.id === "undergroundGate");
    if (undergroundGate) drawTargetRing(undergroundGate.x, undergroundGate.y, "#fff0a8", "ARENA");
  }
  if (worldState.area === "underground" && worldState.objectiveStep === 38) {
    drawTargetRing(WORLD_ENTITIES.nero.x, WORLD_ENTITIES.nero.y, "#f26b55", "NERO");
  }
  if (worldState.area === "underground" && worldState.objectiveStep === 39) {
    const exit = worldExitsForArea("underground").find((door) => door.id === "undergroundExit");
    if (exit) drawTargetRing(exit.x, exit.y, "#fff0a8", "DOCKS");
  }
  if (worldState.area === "dockyard" && worldState.objectiveStep === 39) {
    const oldtownGate = worldExitsForArea("dockyard").find((exit) => exit.id === "oldtownGate");
    if (oldtownGate) drawTargetRing(oldtownGate.x, oldtownGate.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 39) {
    const gymDoor = worldExitsForArea("oldtown").find((exit) => exit.id === "gymDoor");
    if (gymDoor) drawTargetRing(gymDoor.x, gymDoor.y, "#fff0a8", "GYM");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 39) {
    drawTargetRing(WORLD_ENTITIES.memorialWall.x, WORLD_ENTITIES.memorialWall.y, "#fff0a8", "WALL");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 40) {
    drawTargetRing(WORLD_ENTITIES.marcus.x, WORLD_ENTITIES.marcus.y, "#fff0a8", "MARCUS");
  }
  if (worldState.area === "gym" && (worldState.objectiveStep === 41 || worldState.objectiveStep === 42)) {
    const gymExit = worldExitsForArea("gym").find((exit) => exit.id === "gymExit");
    if (gymExit) drawTargetRing(gymExit.x, gymExit.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && (worldState.objectiveStep === 41 || worldState.objectiveStep === 42)) {
    const marketAlley = worldExitsForArea("oldtown").find((exit) => exit.id === "marketAlley");
    if (marketAlley) drawTargetRing(marketAlley.x, marketAlley.y, "#fff0a8", "MARKET");
  }
  if (worldState.area === "market" && worldState.objectiveStep === 41) {
    drawTargetRing(WORLD_ENTITIES.crownScout.x, WORLD_ENTITIES.crownScout.y, "#fff0a8", "SCOUT");
  }
  if (worldState.area === "market" && worldState.objectiveStep === 42) {
    const crownArch = worldExitsForArea("market").find((exit) => exit.id === "crownArch");
    if (crownArch) drawTargetRing(crownArch.x, crownArch.y, "#fff0a8", "CROWN");
  }
  if (worldState.area === "crown" && worldState.objectiveStep === 42) {
    drawTargetRing(WORLD_ENTITIES.eliasCrowe.x, WORLD_ENTITIES.eliasCrowe.y, "#fff0a8", "CROWE");
  }
  if (worldState.area === "crown" && worldState.objectiveStep === 43) {
    const exit = worldExitsForArea("crown").find((door) => door.id === "crownMarketGate");
    if (exit) drawTargetRing(exit.x, exit.y, "#fff0a8", "MARKET");
  }
  if (worldState.area === "market" && worldState.objectiveStep === 43) {
    const oldtownGate = worldExitsForArea("market").find((exit) => exit.id === "oldtownMarketGate");
    if (oldtownGate) drawTargetRing(oldtownGate.x, oldtownGate.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 43) {
    const gymDoor = worldExitsForArea("oldtown").find((exit) => exit.id === "gymDoor");
    if (gymDoor) drawTargetRing(gymDoor.x, gymDoor.y, "#fff0a8", "GYM");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 43) {
    drawTargetRing(WORLD_ENTITIES.marcus.x, WORLD_ENTITIES.marcus.y, "#fff0a8", "MARCUS");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 44) {
    drawTargetRing(WORLD_ENTITIES.crownEnforcer.x, WORLD_ENTITIES.crownEnforcer.y, "#f26b55", "DEFEND");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 45) {
    drawTargetRing(WORLD_ENTITIES.marcus.x, WORLD_ENTITIES.marcus.y, "#fff0a8", "MARCUS");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 46) {
    drawTargetRing(WORLD_ENTITIES.kai.x, WORLD_ENTITIES.kai.y, "#fff0a8", "KAI");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 47) {
    drawTargetRing(WORLD_ENTITIES.gymBell.x, WORLD_ENTITIES.gymBell.y, "#fff0a8", "BELL");
  }
  if (worldState.area === "gym" && worldState.objectiveStep === 48) {
    const gymExit = worldExitsForArea("gym").find((exit) => exit.id === "gymExit");
    if (gymExit) drawTargetRing(gymExit.x, gymExit.y, "#fff0a8", "OLDTOWN");
  }
  if (worldState.area === "oldtown" && worldState.objectiveStep === 48) {
    const marketAlley = worldExitsForArea("oldtown").find((exit) => exit.id === "marketAlley");
    if (marketAlley) drawTargetRing(marketAlley.x, marketAlley.y, "#fff0a8", "MARKET");
  }
  if (worldState.area === "market" && worldState.objectiveStep === 48) {
    const crownArch = worldExitsForArea("market").find((exit) => exit.id === "crownArch");
    if (crownArch) drawTargetRing(crownArch.x, crownArch.y, "#fff0a8", "CROWN");
  }
  if (worldState.area === "crown" && worldState.objectiveStep === 48) {
    const stadiumGate = worldExitsForArea("crown").find((exit) => exit.id === "stadiumGate");
    if (stadiumGate) drawTargetRing(stadiumGate.x, stadiumGate.y, "#fff0a8", "STADIUM");
  }
  if (worldState.area === "stadium" && worldState.objectiveStep === 49) {
    drawTargetRing(WORLD_ENTITIES.dariusVale.x, WORLD_ENTITIES.dariusVale.y, "#9eb7ff", "DARIUS");
  }
  if (worldState.area === "stadium" && worldState.objectiveStep === 50) {
    drawTargetRing(WORLD_ENTITIES.victorKane.x, WORLD_ENTITIES.victorKane.y, "#f26b55", "VICTOR");
  }
  if (worldState.area === "stadium" && worldState.objectiveStep === 51) {
    drawTargetRing(WORLD_ENTITIES.endingLastBell.x, WORLD_ENTITIES.endingLastBell.y, "#79d1a2", "MERCY");
    drawTargetRing(WORLD_ENTITIES.endingRevenge.x, WORLD_ENTITIES.endingRevenge.y, "#f26b55", "REVENGE");
    drawTargetRing(WORLD_ENTITIES.endingCrown.x, WORLD_ENTITIES.endingCrown.y, "#fff0a8", "CROWN");
  }
}

function drawWorldExits() {
  const area = WORLD_AREAS[worldState.area] || WORLD_AREAS.gym;
  ctx.save();
  worldExitsForArea(worldState.area).forEach((exit) => {
    const open = worldExitIsOpen(exit);
    const label = open ? `DOOR: ${exit.label}` : `LOCKED: ${exit.label}`;
    ctx.fillStyle = open ? "rgba(255, 240, 168, 0.16)" : "rgba(255, 255, 255, 0.07)";
    ctx.strokeStyle = open ? "#fff0a8" : "rgba(255, 247, 232, 0.34)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(exit.x, exit.y + 4, exit.radius * 0.72, exit.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    roundedRect(exit.x - 78, exit.y - 70, 156, 34, 8);
    ctx.fill();
    ctx.fillStyle = open ? "#fff0a8" : "rgba(255, 247, 232, 0.7)";
    ctx.font = "900 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, exit.x, exit.y - 49);
  });
  ctx.restore();
}

function drawWorldCollisionDebug() {
  if (!debugMode) return;
  const area = WORLD_AREAS[worldState.area] || WORLD_AREAS.gym;
  ctx.save();
  area.walk.forEach((rect) => {
    ctx.fillStyle = "rgba(121, 209, 162, 0.12)";
    ctx.fillRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
  });
  area.blocked.forEach((rect) => {
    ctx.fillStyle = "rgba(242, 107, 85, 0.18)";
    ctx.fillRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
  });
  ctx.restore();
}

function drawTargetRing(x, y, color, label) {
  const pulse = 0.75 + Math.sin(performance.now() / 180) * 0.18;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.ellipse(x, y + 5, 32 * pulse, 14 * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  roundedRect(x - 44, y - 48, 88, 24, 7);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = "900 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y - 32);
  ctx.restore();
}

function drawWorldEntities() {
  const entities = worldEntitiesForArea(worldState.area);
  [...entities, { id: "player", x: worldState.x, y: worldState.y }].sort((a, b) => a.y - b.y).forEach((entity) => {
    if (entity.id === "player") drawWorldPlayer();
    else drawWorldEntity(entity);
  });
}

function drawWorldEntity(entity) {
  const isTarget = worldInteractTarget?.id === entity.id;
  ctx.save();
  ctx.translate(entity.x, entity.y);
  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (entity.id === "bag") {
    ctx.fillStyle = "#7d2c22";
    roundedRect(-14, -54, 28, 70, 11);
    ctx.fill();
    ctx.strokeStyle = "#2b201b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -54);
    ctx.lineTo(0, -78);
    ctx.stroke();
  } else if (entity.id === "emptyChair") {
    ctx.fillStyle = "#2b201b";
    roundedRect(-24, -34, 48, 34, 6);
    ctx.fill();
    ctx.fillStyle = "#5b3a2d";
    ctx.fillRect(-20, -54, 40, 22);
    ctx.fillRect(-18, 0, 8, 28);
    ctx.fillRect(10, 0, 8, 28);
    ctx.strokeStyle = "#fff0a8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -48);
    ctx.lineTo(18, -48);
    ctx.stroke();
  } else if (entity.id === "memorialWall") {
    ctx.fillStyle = "#241d1c";
    roundedRect(-34, -62, 68, 56, 5);
    ctx.fill();
    ctx.fillStyle = "#fff0a8";
    ctx.fillRect(-26, -54, 18, 14);
    ctx.fillRect(4, -54, 22, 14);
    ctx.fillStyle = "#9eb7ff";
    ctx.fillRect(-25, -30, 50, 5);
    ctx.fillStyle = "#d63b34";
    ctx.beginPath();
    ctx.arc(0, -14, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (entity.id === "gymBell") {
    ctx.fillStyle = "#2b201b";
    ctx.fillRect(-4, -74, 8, 38);
    ctx.fillStyle = "#e8b923";
    ctx.beginPath();
    ctx.arc(0, -32, 24, Math.PI, 0);
    ctx.lineTo(22, -6);
    ctx.lineTo(-22, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff0a8";
    ctx.fillRect(-28, -8, 56, 7);
    ctx.fillStyle = "#d63b34";
    ctx.beginPath();
    ctx.arc(0, 6, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (entity.id === "minaWorkbench") {
    ctx.fillStyle = "#2b201b";
    roundedRect(-36, -34, 72, 36, 6);
    ctx.fill();
    ctx.fillStyle = "#149b93";
    ctx.fillRect(-30, -28, 24, 8);
    ctx.fillStyle = "#e8b923";
    ctx.fillRect(2, -30, 28, 6);
    ctx.strokeStyle = "#fff0a8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-24, 2);
    ctx.lineTo(-24, 24);
    ctx.moveTo(24, 2);
    ctx.lineTo(24, 24);
    ctx.stroke();
  } else if (["jaxWraps", "jaxJacket", "gymRecords"].includes(entity.id)) {
    ctx.fillStyle = "rgba(255, 240, 168, 0.16)";
    ctx.beginPath();
    ctx.ellipse(0, -22, 32, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    if (entity.id === "jaxJacket") {
      ctx.fillStyle = "#149b93";
      roundedRect(-22, -52, 44, 44, 8);
      ctx.fill();
      ctx.fillStyle = "#e8b923";
      ctx.fillRect(-18, -36, 36, 5);
    } else if (entity.id === "gymRecords") {
      ctx.fillStyle = "#f0c36b";
      roundedRect(-26, -48, 52, 34, 4);
      ctx.fill();
      ctx.fillStyle = "#2b201b";
      ctx.fillRect(-18, -38, 36, 4);
      ctx.fillRect(-18, -28, 26, 4);
    } else {
      ctx.strokeStyle = "#fff0a8";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-24, -34);
      ctx.quadraticCurveTo(-4, -56, 20, -34);
      ctx.moveTo(-20, -22);
      ctx.quadraticCurveTo(4, -2, 24, -24);
      ctx.stroke();
    }
  } else if (entity.id === "roadworkRoute") {
    ctx.fillStyle = "#f17f43";
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(18, -8);
    ctx.lineTo(10, -46);
    ctx.lineTo(-10, -46);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff0a8";
    ctx.fillRect(-13, -28, 26, 5);
    ctx.fillRect(-16, -15, 32, 5);
  } else if (entity.id === "endingLastBell" || entity.id === "endingRevenge" || entity.id === "endingCrown") {
    const choiceColor = entity.id === "endingLastBell" ? "#79d1a2" : entity.id === "endingRevenge" ? "#d63b34" : "#fff0a8";
    ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    roundedRect(-34, -52, 68, 54, 8);
    ctx.fill();
    ctx.strokeStyle = choiceColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = choiceColor;
    ctx.beginPath();
    ctx.arc(0, -25, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = entity.id === "endingCrown" ? "#16181f" : "#fff7e8";
    ctx.font = "900 18px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(entity.id === "endingLastBell" ? "I" : entity.id === "endingRevenge" ? "II" : "III", 0, -18);
  } else if (entity.id === "upgrade") {
    ctx.fillStyle = "#29201b";
    roundedRect(-30, -14, 60, 30, 6);
    ctx.fill();
    ctx.fillStyle = "#e8b923";
    ctx.fillRect(-20, -34, 40, 12);
    ctx.fillStyle = "#149b93";
    ctx.fillRect(-24, -2, 48, 6);
  } else if (entity.id === "tapePlayer") {
    ctx.fillStyle = "#1b1a1d";
    roundedRect(-30, -40, 60, 42, 5);
    ctx.fill();
    ctx.fillStyle = "#87b6b5";
    roundedRect(-23, -34, 46, 26, 3);
    ctx.fill();
    ctx.fillStyle = "#29201b";
    ctx.fillRect(-24, 2, 48, 10);
    ctx.strokeStyle = "#fff0a8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -40);
    ctx.lineTo(-18, -58);
    ctx.moveTo(8, -40);
    ctx.lineTo(18, -58);
    ctx.stroke();
  } else {
    const colors = entity.id === "marcus" ? ["#5f625d", "#8d5747"] : entity.id === "oldBoxer" ? ["#302d2b", "#9eb7ff"] : entity.id === "jax" || entity.id === "jaxArena" ? ["#149b93", "#e8b923"] : entity.id === "jaxMother" ? ["#4f3b49", "#fff0a8"] : entity.id === "mina" ? ["#1d5360", "#f0c36b"] : entity.id === "kai" ? ["#20242b", "#9eb7ff"] : entity.id === "mara" || entity.id === "dariusVale" ? ["#3f2a36", "#e8b923"] : entity.id === "crownScout" || entity.id === "eliasCrowe" || entity.id === "victorKane" ? ["#16181f", "#fff0a8"] : entity.fight?.boss ? ["#3a2522", "#d63b34"] : entity.fight?.style === "boxer" ? ["#23415f", "#9eb7ff"] : entity.fight?.style === "counter" ? ["#33284f", "#f17f43"] : entity.fight?.style === "tank" ? ["#252525", "#79d1a2"] : ["#252525", "#d63b34"];
    ctx.fillStyle = colors[0];
    roundedRect(-16, -48, 32, 44, 8);
    ctx.fill();
    ctx.fillStyle = "#b87952";
    ctx.beginPath();
    ctx.arc(0, -62, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.arc(-18, -28, 8, 0, Math.PI * 2);
    ctx.arc(18, -28, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  if (isTarget) {
    ctx.strokeStyle = "#fff0a8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 11, 32, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.font = "800 11px Inter, system-ui, sans-serif";
  const labelWidth = clamp(ctx.measureText(entity.name).width + 22, 108, 184);
  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  roundedRect(-labelWidth / 2, -98, labelWidth, 24, 7);
  ctx.fill();
  ctx.fillStyle = "#fff7e8";
  ctx.textAlign = "center";
  ctx.fillText(entity.name, 0, -82);
  ctx.restore();
}

function drawWorldPlayer() {
  ctx.save();
  ctx.translate(worldState.x, worldState.y);
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#149b93";
  roundedRect(-15, -46, 30, 42, 8);
  ctx.fill();
  ctx.fillStyle = "#f0c36b";
  ctx.beginPath();
  ctx.arc(0, -60, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d63b34";
  ctx.beginPath();
  ctx.arc(-19, -28, 8, 0, Math.PI * 2);
  ctx.arc(19, -28, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWorldHud() {
  const xpNeed = worldXpNeeded();
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  roundedRect(24, 20, 390, 92, 8);
  ctx.fill();
  ctx.fillStyle = "#fff7e8";
  ctx.font = "900 20px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(WORLD_AREAS[worldState.area].label, 42, 44);
  ctx.font = "800 12px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255, 247, 232, 0.82)";
  wrapCanvasText(worldObjectiveText(), 42, 66, 350, 15, "left");
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  roundedRect(42, 92, 210, 9, 5);
  ctx.fill();
  ctx.fillStyle = "#9eb7ff";
  roundedRect(42, 92, 210 * clamp(worldState.xp / xpNeed, 0, 1), 9, 5);
  ctx.fill();
  ctx.fillStyle = "#fff0a8";
  ctx.textAlign = "right";
  ctx.fillText(`Lv ${worldState.level}  $${worldState.money}  ${worldState.skillPoints} SP`, 396, 98);

  const prompt = worldPromptText();
  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  roundedRect(300, 478, 360, 34, 8);
  ctx.fill();
  ctx.fillStyle = "#fff0a8";
  ctx.font = "900 14px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(prompt, 480, 499);
  ctx.restore();
}

function drawWorldDialogue() {
  const dialogue = worldState.dialogue;
  if (!dialogue) return;
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
  roundedRect(88, 352, 784, 132, 8);
  ctx.fill();
  if (Number.isInteger(dialogue.portrait)) {
    drawPortrait(dialogue.portrait, 114, 372, 86, 86, dialogue.portraitSheet || "portraits");
  }
  ctx.fillStyle = "#fff0a8";
  ctx.font = "900 17px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(dialogue.speaker, 222, 384);
  ctx.fillStyle = "#fff7e8";
  ctx.font = "700 18px Inter, system-ui, sans-serif";
  wrapCanvasText(dialogue.text, 222, 414, 600, 23, "left");
  ctx.fillStyle = "rgba(255, 240, 168, 0.86)";
  ctx.font = "900 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("E / JAB to continue", 830, 460);
  ctx.restore();
}

function drawWorldMinigameOverlay() {
  const game = activeMinigame;
  if (!game) return;
  ctx.save();
  if (game.type === "route") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    roundedRect(322, 118, 316, 84, 8);
    ctx.fill();
    ctx.strokeStyle = "#fff0a8";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff0a8";
    ctx.font = "900 20px Inter, system-ui, sans-serif";
    ctx.fillText(game.title, 480, 148);
    ctx.fillStyle = "#fff7e8";
    ctx.font = "900 14px Inter, system-ui, sans-serif";
    ctx.fillText(`Cone ${Math.min(game.routeIndex + 1, game.route.length)}/${game.route.length}   ${Math.ceil(game.timeLeft)}s`, 480, 174);
    ctx.fillStyle = "rgba(255, 247, 232, 0.72)";
    ctx.font = "800 11px Inter, system-ui, sans-serif";
    ctx.fillText("Use WASD, arrows, or the touch pad.", 480, 192);
    ctx.restore();
    return;
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.76)";
  roundedRect(188, 128, 584, 238, 8);
  ctx.fill();
  ctx.strokeStyle = "#fff0a8";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff0a8";
  ctx.font = "900 25px Inter, system-ui, sans-serif";
  ctx.fillText(game.title, 480, 170);
  ctx.fillStyle = "rgba(255, 247, 232, 0.84)";
  ctx.font = "800 14px Inter, system-ui, sans-serif";
  wrapCanvasText(game.hint, 480, 202, 480, 18);
  if (game.type === "timing") {
    const left = 292;
    const top = 260;
    const width = 376;
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    roundedRect(left, top, width, 20, 10);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 240, 168, 0.34)";
    const targetX = left + (game.target - game.targetSize * 0.5) * width;
    roundedRect(targetX, top - 4, game.targetSize * width, 28, 10);
    ctx.fill();
    ctx.fillStyle = "#fff0a8";
    ctx.beginPath();
    ctx.arc(left + game.cursor * width, top + 10, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff7e8";
    ctx.font = "900 14px Inter, system-ui, sans-serif";
    ctx.fillText(`Hits ${game.success}/${game.need}   Misses ${game.miss}/${game.misses}`, 480, 314);
  } else {
    const labels = game.sequence.map((action, index) => {
      const done = index < game.index;
      const current = index === game.index;
      return { text: minigameActionLabel(action), done, current };
    });
    labels.forEach((item, index) => {
      const x = 310 + index * 86;
      ctx.fillStyle = item.done ? "#79d1a2" : item.current ? "#fff0a8" : "rgba(255, 247, 232, 0.18)";
      roundedRect(x, 248, 72, 42, 8);
      ctx.fill();
      ctx.fillStyle = item.current ? "#1b1712" : "#fff7e8";
      ctx.font = "900 12px Inter, system-ui, sans-serif";
      ctx.fillText(item.text, x + 36, 272);
    });
    ctx.fillStyle = "#fff7e8";
    ctx.font = "900 14px Inter, system-ui, sans-serif";
    ctx.fillText(`Mistakes ${game.miss}/${game.misses}`, 480, 322);
  }
  if (game.flash) {
    ctx.fillStyle = game.flash === "GOOD" ? "#79d1a2" : "#f26b55";
    ctx.font = "900 20px Inter, system-ui, sans-serif";
    ctx.fillText(game.flash, 480, 344);
  }
  ctx.restore();
}

function drawPortrait(index, x, y, width, height, sheet = "portraits") {
  const image = worldImages[sheet] || worldImages.portraits;
  const columns = { portraits: 3, chapter1Portraits: 4, chapter2Portraits: 4, chapter3Portraits: 4 }[sheet] || 3;
  ctx.save();
  roundedRect(x, y, width, height, 8);
  ctx.clip();
  if (image?.complete && image.naturalWidth) {
    const cropW = image.naturalWidth / columns;
    ctx.drawImage(image, cropW * index, 0, cropW, image.naturalHeight, x, y, width, height);
  } else {
    ctx.fillStyle = "#29201b";
    ctx.fillRect(x, y, width, height);
  }
  ctx.restore();
}

function drawWorldPause() {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
  roundedRect(276, 126, 408, 288, 8);
  ctx.fill();
  ctx.fillStyle = "#fff0a8";
  ctx.font = "900 26px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Rustbell Pause", 480, 164);
  ctx.fillStyle = "#fff7e8";
  ctx.font = "800 15px Inter, system-ui, sans-serif";
  const rows = WORLD_STATS.map(([key, label]) => `${label}: ${worldState.stats[key]}/10`);
  rows.unshift(`Level ${worldState.level} | XP ${worldState.xp}/${worldXpNeeded()} | $${worldState.money} | ${worldState.skillPoints} SP`);
  const sideHint = worldSideQuestHint();
  if (sideHint) rows.push(sideHint);
  rows.forEach((row, index) => ctx.fillText(row, 480, 202 + index * 24));
  ctx.fillStyle = "rgba(255, 247, 232, 0.72)";
  ctx.fillText("Esc closes. Use the side panel for Save, Upgrade, or Exit.", 480, 386);
  ctx.restore();
}

function drawWorldUpgradeOverlay() {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.84)";
  roundedRect(126, 62, 708, 420, 8);
  ctx.fill();
  ctx.fillStyle = "#fff0a8";
  ctx.font = "900 25px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Training Corner", 480, 96);
  ctx.fillStyle = "#fff7e8";
  ctx.font = "800 13px Inter, system-ui, sans-serif";
  ctx.fillText(`Money $${worldState.money}  |  Skill Points ${worldState.skillPoints}`, 480, 120);
  ctx.fillStyle = "rgba(255, 247, 232, 0.75)";
  ctx.font = "800 12px Inter, system-ui, sans-serif";
  const loadoutSummary = Object.entries(PUNCH_SLOTS).map(([slot, info]) => `${info.key}: ${punchMove(worldState.punchLoadout?.[slot]).short}`).join("   ");
  ctx.fillText(loadoutSummary, 480, 140);

  ctx.textAlign = "left";
  ctx.font = "900 15px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#fff0a8";
  ctx.fillText("Stats: press 1-7", 166, 164);
  ctx.fillText("Punches: press 8, 9, 0, -, =, Q, R", 522, 164);

  ctx.font = "800 13px Inter, system-ui, sans-serif";
  WORLD_STATS.forEach(([key, label], index) => {
    const y = 190 + index * 34;
    const rank = worldState.stats[key] || 0;
    const cost = upgradeCost(key);
    const canBuy = rank < 10 && worldState.money >= cost.money && worldState.skillPoints >= cost.skill;
    ctx.fillStyle = canBuy ? "rgba(255, 247, 232, 0.94)" : "rgba(255, 247, 232, 0.46)";
    ctx.fillText(`${index + 1}. ${label} ${rank}/10`, 166, y);
    ctx.fillStyle = canBuy ? "#79d1a2" : "rgba(255, 247, 232, 0.42)";
    ctx.fillText(rank >= 10 ? "MAX" : `$${cost.money}${cost.skill ? ` + ${cost.skill} SP` : ""}`, 342, y);
  });

  WORLD_SKILLS.forEach((skill, index) => {
    const y = 190 + index * 36;
    const keyLabel = UPGRADE_SKILL_KEYS[index]?.toUpperCase() || "";
    const move = punchMove(skill.move);
    const owned = isWorldPunchUnlocked(move.id);
    const equipped = worldState.punchLoadout?.[move.slot] === move.id;
    const canBuy = !owned && worldState.skillPoints >= skill.cost;
    ctx.fillStyle = owned ? "#79d1a2" : canBuy ? "rgba(255, 247, 232, 0.94)" : "rgba(255, 247, 232, 0.46)";
    ctx.fillText(`${keyLabel}. ${skill.name} ${equipped ? "(equipped)" : owned ? "(owned)" : `${skill.cost} SP`}`, 522, y);
    ctx.fillStyle = "rgba(255, 247, 232, 0.68)";
    ctx.fillText(`${PUNCH_SLOTS[move.slot].key} slot | ${move.short} | ${move.target} ${move.attackClass}`, 522, y + 17);
  });

  ctx.fillStyle = "rgba(255, 240, 168, 0.9)";
  ctx.font = "900 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Use number keys here or click the upgrade buttons in the side panel. Esc/Pause closes.", 480, 468);
  ctx.restore();
}

function drawBackdrop() {
  const finaleFight = pendingWorldFight?.id === "victor-kane" || pendingWorldFight?.id === "darius-vale";
  const wall = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  wall.addColorStop(0, finaleFight ? "#19120a" : "#111111");
  wall.addColorStop(0.45, finaleFight ? "#322019" : "#2a1716");
  wall.addColorStop(1, finaleFight ? "#11151c" : "#101715");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = finaleFight ? "rgba(255, 240, 168, 0.1)" : "rgba(255, 247, 232, 0.06)";
  for (let i = 0; i < (finaleFight ? 40 : 30); i += 1) {
    const x = 18 + i * 34;
    const h = 24 + ((i * 19) % 28);
    ctx.fillRect(x, 86 - h * 0.35, 18, h);
  }
  if (finaleFight) {
    ctx.fillStyle = "rgba(255, 240, 168, 0.18)";
    [180, 360, 600, 780].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 48, 154);
      ctx.lineTo(x - 24, 154);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
    roundedRect(332, 58, 296, 34, 8);
    ctx.fill();
    ctx.fillStyle = "#fff0a8";
    ctx.font = "900 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LAST BELL TOURNAMENT", 480, 80);
  }

  ctx.fillStyle = "rgba(232, 185, 35, 0.2)";
  ctx.fillRect(0, 96, WORLD.width, 8);
  ctx.fillStyle = "rgba(20, 155, 147, 0.18)";
  ctx.fillRect(0, 119, WORLD.width, 5);
}

function drawRing() {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(116, 154);
  ctx.lineTo(844, 154);
  ctx.lineTo(898, 454);
  ctx.lineTo(64, 454);
  ctx.closePath();
  const mat = ctx.createLinearGradient(0, 154, 0, 454);
  mat.addColorStop(0, "#f0cf7a");
  mat.addColorStop(0.58, "#d9a64a");
  mat.addColorStop(1, "#a96c34");
  ctx.fillStyle = mat;
  ctx.fill();

  ctx.strokeStyle = "rgba(83, 45, 28, 0.55)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 7; i += 1) {
    const y = 186 + i * 38;
    ctx.beginPath();
    ctx.moveTo(126 - i * 7, y);
    ctx.lineTo(834 + i * 7, y);
    ctx.stroke();
  }
  drawRopes();
  ctx.restore();
}

function drawRopes() {
  const posts = [
    [104, 150],
    [856, 150],
    [73, 454],
    [887, 454],
  ];
  ctx.lineCap = "round";
  [156, 182, 208].forEach((offset, index) => {
    ctx.strokeStyle = index === 1 ? "#fff7e8" : "#d63b34";
    ctx.lineWidth = index === 1 ? 4 : 6;
    ctx.beginPath();
    ctx.moveTo(104, offset);
    ctx.lineTo(856, offset);
    ctx.stroke();
  });

  [270, 330, 390].forEach((y, index) => {
    ctx.strokeStyle = index === 1 ? "#fff7e8" : "#149b93";
    ctx.lineWidth = index === 1 ? 4 : 6;
    ctx.beginPath();
    ctx.moveTo(86, y);
    ctx.lineTo(874, y);
    ctx.stroke();
  });

  posts.forEach(([x, y]) => {
    ctx.fillStyle = "#29201b";
    ctx.fillRect(x - 8, y - 24, 16, 62);
    ctx.fillStyle = "#e8b923";
    ctx.fillRect(x - 11, y - 30, 22, 12);
  });
}

function drawFighter(fighter) {
  const scale = 0.86 + (fighter.y - RING.top) / 520;
  const x = fighter.x;
  const y = fighter.y;
  const facing = fighter.facing;
  const flash = fighter.hitFlash > 0;
  const skin = flash ? "#fff2ce" : fighter.color;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 7, 45, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#171717";
  roundedRect(-24, -38, 15, 48, 7);
  ctx.fill();
  roundedRect(9, -38, 15, 48, 7);
  ctx.fill();
  ctx.fillStyle = "#f1f1e8";
  roundedRect(-28, 2, 22, 9, 4);
  ctx.fill();
  roundedRect(6, 2, 22, 9, 4);
  ctx.fill();

  ctx.fillStyle = fighter.shorts;
  roundedRect(-27, -66, 54, 34, 7);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fillRect(-22, -62, 44, 5);

  const torso = ctx.createLinearGradient(0, -112, 0, -58);
  torso.addColorStop(0, lightenColor(skin, 18));
  torso.addColorStop(1, skin);
  ctx.fillStyle = torso;
  roundedRect(-23, -112, 46, 58, 13);
  ctx.fill();
  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  roundedRect(-4, -105, 8, 43, 4);
  ctx.fill();

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, -132, 21, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#201714";
  ctx.beginPath();
  ctx.ellipse(-3, -151, 21, 11, -0.1, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.arc(8, -135, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.32)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(5, -127);
  ctx.lineTo(13, -126);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  ctx.beginPath();
  ctx.arc(-9, -141, 4, 0, Math.PI * 2);
  ctx.fill();

  drawArms(fighter, skin);

  ctx.restore();
  drawNameplate(fighter);
}

function drawArms(fighter, skin) {
  const attack = fighter.attack;
  const progress = attack ? Math.min(1, attack.elapsed / attack.duration) : 0;
  const punch = attack ? Math.sin(progress * Math.PI) : 0;
  const guard = fighter.guard;
  const bodyPunch = attack?.target === "body";
  const hookPunch = attack?.attackClass === "hook";
  const uppercut = attack?.type === "uppercut";
  const overhand = attack?.type === "overhand";

  let leadX = guard ? 20 : 20 + punch * (hookPunch ? 44 : bodyPunch ? 42 : 60);
  let leadY = guard ? -113 : bodyPunch ? -70 + punch * 9 : -90 - punch * (hookPunch ? 12 : 5);
  if (uppercut) {
    leadX = guard ? 20 : 17 + punch * 24;
    leadY = guard ? -113 : -72 - punch * 34;
  } else if (overhand) {
    leadX = guard ? 20 : 15 + punch * 50;
    leadY = guard ? -113 : -126 + punch * 22;
  }
  const rearX = guard ? 6 : -24 + punch * (hookPunch ? 28 : 10);
  const rearY = guard ? -124 : -88;
  const leadElbowX = guard ? 14 : 20 + punch * (hookPunch ? 24 : 30);
  const leadElbowY = guard ? -92 : uppercut ? -82 - punch * 18 : overhand ? -108 : bodyPunch ? -82 : -95;
  const rearElbowX = guard ? -10 : -20 + punch * 8;
  const rearElbowY = guard ? -94 : -94;

  ctx.strokeStyle = skin;
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(14, -92);
  ctx.lineTo(leadElbowX, leadElbowY);
  ctx.lineTo(leadX, leadY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-14, -92);
  ctx.lineTo(rearElbowX, rearElbowY);
  ctx.lineTo(rearX, rearY);
  ctx.stroke();

  ctx.fillStyle = fighter.glove;
  ctx.beginPath();
  ctx.ellipse(leadX, leadY, hookPunch ? 16 : 14, 13, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(rearX, rearY, 13, 12, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
  ctx.beginPath();
  ctx.arc(leadX - 4, leadY - 4, 3, 0, Math.PI * 2);
  ctx.arc(rearX - 4, rearY - 4, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawNameplate(fighter) {
  const width = 90;
  const pct = healthPercent(fighter);
  ctx.save();
  ctx.translate(fighter.x - width / 2, fighter.y - 152);
  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  roundedRect(0, 0, width, 20, 6);
  ctx.fill();
  ctx.fillStyle = fighter === fighters[0] ? "#149b93" : "#d63b34";
  roundedRect(4, 4, Math.max(0, (width - 8) * pct), 12, 5);
  ctx.fill();
  ctx.restore();

  if (fighter.rocked > 0) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "900 22px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
    ctx.fillText("ROCKED", fighter.x + 2, fighter.y - 174);
    ctx.fillStyle = "#fff0a8";
    ctx.fillText("ROCKED", fighter.x, fighter.y - 176);
    ctx.restore();
  }
}

function drawDebugOverlay() {
  if (!debugMode) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 240, 168, 0.65)";
  ctx.lineWidth = 2;
  fighters.forEach((fighter) => {
    ctx.beginPath();
    ctx.arc(fighter.x, fighter.y - 74, (fighter.attack?.range || 90) * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    roundedRect(fighter.x - 78, fighter.y + 18, 156, 54, 6);
    ctx.fill();
    ctx.fillStyle = "#fff7e8";
    ctx.font = "700 11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`CD ${fighter.attackCooldown.toFixed(2)} | STA ${fighter.stamina.toFixed(0)}/${fighter.staminaCap.toFixed(0)}`, fighter.x, fighter.y + 36);
    ctx.fillText(`AI ${fighter.aiMove || "-"} | Regen ${(10 + fighter.speed * 0.45).toFixed(1)}`, fighter.x, fighter.y + 52);
  });
  ctx.restore();
}

function drawParticles() {
  particles.forEach((p) => {
    const pct = 1 - p.age / p.life;
    ctx.globalAlpha = Math.max(0, pct);
    if (p.spark) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, p.size * pct);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.035 * pct, p.y - p.vy * 0.035 * pct);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * pct, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function drawFloaters() {
  ctx.save();
  ctx.font = "800 20px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  floaters.forEach((f) => {
    const pct = 1 - f.age / f.life;
    ctx.globalAlpha = Math.max(0, pct);
    ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    ctx.fillText(f.text, f.x + 2, f.y + 2);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  });
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawFightHud() {
  drawFighterHud(fighters[0], 44, 20, 316, false);
  drawFighterHud(fighters[1], 600, 20, 316, true);

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  roundedRect(420, 20, 120, 46, 8);
  ctx.fill();
  ctx.fillStyle = "#fff7e8";
  ctx.font = "900 25px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(formatClock(roundTime), 480, 43);
  ctx.restore();
  const bossText = bossHudText();
  if (bossText) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
    roundedRect(330, 74, 300, 30, 8);
    ctx.fill();
    ctx.fillStyle = "#fff0a8";
    ctx.font = "900 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bossText.toUpperCase(), 480, 90);
    ctx.restore();
  }
}

function drawBossMechanics() {
  fighters.forEach((fighter, index) => {
    const target = fighters[index === 0 ? 1 : 0];
    callBossHook(fighter, "draw", target);
  });
}

function drawFighterHud(fighter, x, y, width, mirror) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  roundedRect(x - 12, y - 8, width + 24, 94, 8);
  ctx.fill();

  ctx.textAlign = mirror ? "right" : "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff7e8";
  ctx.font = "900 15px Inter, system-ui, sans-serif";
  ctx.fillText(fighter.name, mirror ? x + width : x, y + 2);

  drawHudMeter("HEAD", headPercent(fighter), x, y + 18, width, "#e2463d", mirror);
  drawHudMeter("BODY", bodyPercent(fighter), x, y + 34, width, "#e96c35", mirror);
  drawHudCapMeter("STA", fighter.stamina, fighter.staminaCap, fighter.maxStamina, x, y + 50, width, "#149b93", mirror);
  drawHudMeter("BLK", blockPercent(fighter), x, y + 66, width, "#9eb7ff", mirror);

  if (fighter.rocked > 0) {
    ctx.fillStyle = "#fff0a8";
    ctx.font = "900 13px Inter, system-ui, sans-serif";
    ctx.fillText("ROCKED", mirror ? x + width : x, y + 88);
  }
  if (staminaPercent(fighter) < 0.25 || blockPercent(fighter) < 0.25) {
    ctx.fillStyle = staminaPercent(fighter) < 0.25 ? "#f26b55" : "#9eb7ff";
    ctx.font = "900 11px Inter, system-ui, sans-serif";
    ctx.fillText(staminaPercent(fighter) < 0.25 ? "LOW STAMINA" : "LOW BLOCK", mirror ? x + width : x, y + 88);
  }
  ctx.restore();
}

function drawHudMeter(label, pct, x, y, width, color, mirror) {
  const fill = clamp(pct, 0, 1) * width;
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  roundedRect(x, y, width, 10, 5);
  ctx.fill();
  ctx.fillStyle = color;
  roundedRect(mirror ? x + width - fill : x, y, fill, 10, 5);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 247, 232, 0.76)";
  ctx.font = "800 9px Inter, system-ui, sans-serif";
  ctx.textAlign = mirror ? "left" : "right";
  ctx.fillText(label, mirror ? x - 7 : x + width + 7, y + 5);
}

function drawHudCapMeter(label, value, cap, max, x, y, width, color, mirror) {
  const capFill = clamp(cap / Math.max(1, max), 0, 1) * width;
  const fill = clamp(value / Math.max(1, max), 0, 1) * width;
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  roundedRect(x, y, width, 10, 5);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 247, 232, 0.18)";
  roundedRect(mirror ? x + width - capFill : x, y, capFill, 10, 5);
  ctx.fill();
  ctx.fillStyle = color;
  roundedRect(mirror ? x + width - fill : x, y, fill, 10, 5);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 247, 232, 0.76)";
  ctx.font = "800 9px Inter, system-ui, sans-serif";
  ctx.textAlign = mirror ? "left" : "right";
  ctx.fillText(label, mirror ? x - 7 : x + width + 7, y + 5);
}

function drawCanvasStatus() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (activeMode === "menu") {
    drawOverlayText("Ringside: Last Bell", "Open World, fight AI, or create a lobby");
  } else if (paused) {
    drawOverlayText("Paused", "Press Esc or Pause to resume");
  } else if (activeMode === "waiting") {
    drawOverlayText("Lobby Ready", network.code ? `Code ${network.code}` : "Waiting for a code");
  } else if (activeMode === "result") {
    drawOverlayText(resultTitle, resultSubtitle);
    if (resultBreakdown) drawBreakdown(resultBreakdown);
  } else if (activeMode === "world-result") {
    drawWorldResultOverlay();
  }
  ctx.restore();
}

function drawWorldResultOverlay() {
  const result = worldResult || {
    title: "Fight Finished",
    subtitle: "The street goes quiet.",
    reward: "",
    message: "",
    objective: worldObjectiveText(),
  };
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
  roundedRect(230, 118, 500, 258, 8);
  ctx.fill();
  ctx.strokeStyle = "#fff0a8";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff0a8";
  ctx.font = "900 34px Inter, system-ui, sans-serif";
  ctx.fillText(result.title, WORLD.width / 2, 166);
  ctx.fillStyle = "#fff7e8";
  ctx.font = "800 17px Inter, system-ui, sans-serif";
  wrapCanvasText(result.subtitle, WORLD.width / 2, 202, 430, 22);
  ctx.fillStyle = "#79d1a2";
  ctx.font = "900 16px Inter, system-ui, sans-serif";
  ctx.fillText(result.reward, WORLD.width / 2, 250);
  ctx.fillStyle = "rgba(255, 247, 232, 0.82)";
  ctx.font = "800 14px Inter, system-ui, sans-serif";
  wrapCanvasText(result.message, WORLD.width / 2, 282, 430, 19);
  ctx.fillStyle = "rgba(255, 240, 168, 0.88)";
  ctx.font = "900 13px Inter, system-ui, sans-serif";
  wrapCanvasText(`Next: ${result.objective}`, WORLD.width / 2, 326, 420, 17);
  ctx.fillStyle = "#fff7e8";
  ctx.font = "900 13px Inter, system-ui, sans-serif";
  ctx.fillText(worldResultContinueText(), WORLD.width / 2, 358);
  ctx.restore();
}

function drawBreakdown(text) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  roundedRect(210, 204, 540, 54, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 247, 232, 0.82)";
  ctx.font = "700 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  wrapCanvasText(text, WORLD.width / 2, 224, 500, 16);
  ctx.restore();
}

function wrapCanvasText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let lineY = y;
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, x, lineY);
}

function drawOverlayText(title, subtitle) {
  const boxX = 276;
  const boxY = 106;
  const boxW = 408;
  const boxH = 86;
  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  roundedRect(boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.fillStyle = "#fff7e8";
  ctx.font = "900 34px Inter, system-ui, sans-serif";
  ctx.fillText(title, WORLD.width / 2, boxY + 32);
  ctx.fillStyle = "rgba(255, 247, 232, 0.78)";
  ctx.font = "700 15px Inter, system-ui, sans-serif";
  ctx.fillText(subtitle, WORLD.width / 2, boxY + 66);
}

function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 170,
      vy: -80 - Math.random() * 90,
      life: 0.34 + Math.random() * 0.18,
      age: 0,
      color,
      size: 3 + Math.random() * 4,
    });
  }
  trimParticles();
}

function hitSpark(x, y, color, strength) {
  const rays = Math.round(7 + strength * 5);
  for (let i = 0; i < rays; i += 1) {
    const angle = (Math.PI * 2 * i) / rays + (Math.random() - 0.5) * 0.42;
    const speed = (170 + Math.random() * 130) * strength;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.72,
      life: 0.12 + Math.random() * 0.08,
      age: 0,
      color,
      size: 2.2 + strength,
      spark: true,
    });
  }
  trimParticles();
}

function trimParticles() {
  if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
}

function addFloater(x, y, text, color) {
  floaters.push({ x, y, text, color, age: 0, life: 0.78 });
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.spark) {
      const drag = Math.pow(0.025, dt);
      p.vx *= drag;
      p.vy *= drag;
    } else {
      p.vy += 280 * dt;
    }
    if (p.age >= p.life) particles.splice(i, 1);
  }

  for (let i = floaters.length - 1; i >= 0; i -= 1) {
    const f = floaters[i];
    f.age += dt;
    f.y -= 44 * dt;
    if (f.age >= f.life) floaters.splice(i, 1);
  }

  screenShake = Math.max(0, screenShake - 38 * dt);
  screenFlash = Math.max(0, screenFlash - 2.8 * dt);
}

function drawScreenEffects() {
  if (screenFlash <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(0.22, screenFlash);
  ctx.fillStyle = "#fff0a8";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.restore();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lightenColor(hex, amount) {
  const clean = String(hex || "#b87952").replace("#", "");
  if (clean.length !== 6) return hex;
  const parts = [0, 2, 4].map((start) => clamp(parseInt(clean.slice(start, start + 2), 16) + amount, 0, 255));
  return `#${parts.map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

function formatClock(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(safe / 60);
  const secs = String(safe % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, (a.y - b.y) * 1.25);
}

function loop(timestamp) {
  const dt = Math.min(0.033, (timestamp - lastTime) / 1000 || 0);
  lastTime = timestamp;
  if (hitStop > 0) {
    hitStop = Math.max(0, hitStop - dt);
    updateParticles(dt * 0.2);
  } else if (activeMode === "fight" && !paused) {
    updateFight(dt);
  } else if (activeMode === "world-minigame") {
    updateWorldMinigame(dt);
    updateParticles(dt);
  } else if (activeMode === "world") {
    updateWorld(dt);
    updateParticles(dt);
  }
  updateAmbience();
  draw();
  updateUi();
  requestAnimationFrame(loop);
}

function bindControls() {
  const keyMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
    " ": "guard",
    l: "guard",
    L: "guard",
  };
  const p2MoveMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };
  const p2ActionMap = {
    Digit1: "jab",
    Numpad1: "jab",
    Digit2: "hook",
    Numpad2: "hook",
    Digit3: "body",
    Numpad3: "body",
    Enter: "slip",
    NumpadEnter: "slip",
  };

  document.addEventListener("keydown", (event) => {
    if (isTypingTarget(event.target)) {
      if (event.target === ui.joinCode && event.key === "Enter") {
        event.preventDefault();
        joinLobby();
      }
      return;
    }
    initAudio();
    if (event.key === "Escape") {
      event.preventDefault();
      togglePause();
      return;
    }
    if (event.key === "`") {
      debugMode = !debugMode;
      pushFeed(debugMode ? "Debug overlay on." : "Debug overlay off.");
      return;
    }
    if (event.key === "f" || event.key === "F") {
      event.preventDefault();
      toggleFullscreen();
      return;
    }
    if (activeMode === "world-minigame" && (event.key === "e" || event.key === "E" || event.key === "Enter")) {
      event.preventDefault();
      handleMinigameInput("jab");
      return;
    }
    if (activeMode === "world-result" && (event.key === "e" || event.key === "E" || event.key === "Enter")) {
      event.preventDefault();
      continueWorldResult();
      return;
    }
    if (activeMode === "world" && handleWorldUpgradeKey(event.key)) {
      event.preventDefault();
      return;
    }
    if (activeMode === "world" && (event.key === "e" || event.key === "E")) {
      if (event.repeat) return;
      event.preventDefault();
      interactWorld();
      return;
    }
    if (playMode === "local" && p2MoveMap[event.key]) {
      event.preventDefault();
      secondInput[p2MoveMap[event.key]] = true;
      return;
    }
    if (playMode === "local" && (event.key === "0" || event.code === "Numpad0")) {
      event.preventDefault();
      secondInput.guard = true;
      return;
    }
    if (playMode === "local" && p2ActionMap[event.code]) {
      if (event.repeat) return;
      event.preventDefault();
      queueAttackFor(1, p2ActionMap[event.code], secondInput);
      return;
    }
    if (event.repeat && ["j", "J", "k", "K", "u", "U", "Shift"].includes(event.key)) return;
    if (event.key === "j" || event.key === "J") {
      event.preventDefault();
      queueAttack("jab");
      return;
    }
    if (event.key === "k" || event.key === "K") {
      event.preventDefault();
      queueAttack("hook");
      return;
    }
    if (event.key === "u" || event.key === "U") {
      event.preventDefault();
      queueAttack("body");
      return;
    }
    if (event.key === "Shift") {
      event.preventDefault();
      queueAttack("slip");
      return;
    }
    const action = keyMap[event.key];
    if (action) {
      event.preventDefault();
      input[action] = true;
      setButtonState(action, true);
      if (playMode === "pvp-guest") sendInputNow();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (isTypingTarget(event.target)) return;
    if (playMode === "local" && p2MoveMap[event.key]) {
      event.preventDefault();
      secondInput[p2MoveMap[event.key]] = false;
      return;
    }
    if (playMode === "local" && (event.key === "0" || event.code === "Numpad0")) {
      event.preventDefault();
      secondInput.guard = false;
      return;
    }
    const action = keyMap[event.key];
    if (action) {
      event.preventDefault();
      input[action] = false;
      setButtonState(action, false);
      if (playMode === "pvp-guest") sendInputNow();
    }
  });

  document.querySelectorAll("[data-control]").forEach((button) => {
    const control = button.dataset.control;
    const set = (active) => {
      input[control] = active;
      button.classList.toggle("is-down", active);
      if (playMode === "pvp-guest") sendInputNow();
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      initAudio();
      button.setPointerCapture(event.pointerId);
      set(true);
    });
    button.addEventListener("pointerup", () => set(false));
    button.addEventListener("pointercancel", () => set(false));
    button.addEventListener("lostpointercapture", () => set(false));
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      initAudio();
      queueAttack(button.dataset.action);
      button.classList.add("is-down");
      window.setTimeout(() => button.classList.remove("is-down"), 120);
    });
  });

  ui.openBtn.addEventListener("click", startOpenWorld);
  ui.aiBtn.addEventListener("click", startAiMatch);
  ui.localBtn.addEventListener("click", startLocalMatch);
  ui.hostBtn.addEventListener("click", () => {
    if (playMode === "pvp-host" && network.connected) startHostMatch();
    else createLobby();
  });
  ui.joinBtn.addEventListener("click", joinLobby);
  ui.leaveBtn.addEventListener("click", leaveLobby);
  ui.copyBtn.addEventListener("click", copyLobbyLink);
  ui.startBtn.addEventListener("click", () => {
    if (playMode === "pvp-host") startHostMatch();
    else if (playMode === "local") startLocalMatch();
    else if (playMode === "open-world" && activeMode === "world-result") continueWorldResult();
    else if (playMode === "open-world") startOpenWorld();
    else startAiMatch();
  });
  ui.restartBtn.addEventListener("click", restartMatch);
  ui.pauseBtn.addEventListener("click", togglePause);
  ui.joinCode.addEventListener("input", () => {
    ui.joinCode.value = cleanCode(ui.joinCode.value);
  });
  ui.styleSelect.addEventListener("change", syncLocalStyle);
  ui.difficultySelect.addEventListener("change", () => {
    aiDifficulty = ui.difficultySelect.value;
    updateUi();
  });
  ui.muteToggle.addEventListener("change", () => {
    audioMuted = ui.muteToggle.checked;
    if (audioMuted) stopAmbience();
    saveSettings();
  });
  ui.motionToggle.addEventListener("change", () => setReducedMotion(ui.motionToggle.checked));
  ui.fullscreenBtn?.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  canvas.addEventListener("click", () => {
    if (activeMode === "world-result") continueWorldResult();
  });
  ui.toggleHelpBtn.addEventListener("click", () => setTutorialVisible(false));
  ui.showHelpBtn.addEventListener("click", () => setTutorialVisible(!tutorialVisible));
  ui.worldUpgradeBtn.addEventListener("click", () => {
    if (activeMode === "world-minigame") {
      pushFeed("Finish or cancel the activity before upgrading.");
      return;
    }
    if (playMode !== "open-world") startOpenWorld();
    worldState.upgradeOpen = !worldState.upgradeOpen;
    worldState.menuOpen = false;
    renderUpgradeList();
    updateUi();
  });
  ui.worldSaveBtn.addEventListener("click", () => saveWorldState(true));
  ui.worldExitBtn.addEventListener("click", exitOpenWorld);
  ui.saveSlotSelect?.addEventListener("change", () => {
    setActiveSaveSlot(ui.saveSlotSelect.value);
    if (playMode === "open-world") {
      activeMinigame = null;
      pendingWorldFight = null;
      worldResult = null;
      activeMode = "world";
      worldState = loadWorldState();
      clampWorldPosition();
      if (!worldState.storyChoices.seenPrologue) setWorldDialogue(WORLD_DIALOGUE.prologue);
      pushFeed(`${activeSaveSlot.replace("slot", "Save ")} loaded.`);
      updateUi();
    }
  });
  ui.newGameBtn?.addEventListener("click", newWorldGame);
  ui.resetSaveBtn?.addEventListener("click", resetCurrentSave);
  window.addEventListener("blur", clearAllInputs);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearAllInputs();
  });
}

function setButtonState(control, active) {
  document.querySelectorAll(`[data-control="${control}"]`).forEach((button) => {
    button.classList.toggle("is-down", active);
  });
}

function clearInputState(state) {
  Object.keys(state).forEach((key) => {
    state[key] = false;
  });
}

function clearAllInputs() {
  clearInputState(input);
  clearInputState(remoteInput);
  clearInputState(secondInput);
  document.querySelectorAll(".is-down").forEach((button) => button.classList.remove("is-down"));
  if (playMode === "pvp-guest") sendInputNow();
}

function isTypingTarget(target) {
  if (!target || target === document.body) return false;
  const tag = target.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

function autoJoinFromUrl() {
  const code = cleanCode(new URLSearchParams(window.location.search).get("join"));
  if (!code) return;
  ui.joinCode.value = code;
  window.setTimeout(joinLobby, 300);
}

fighters.forEach(resetFighter);
bindControls();
loadSettings();
loadActiveSaveSlot();
setReducedMotion(reducedMotion);
updateFullscreenButton();
updateStylePreview();
setTutorialVisible(true);
pushFeed("Open World starts the Ringside: Last Bell slice. AI and lobby modes still work.");
updateUi();
requestAnimationFrame(loop);
autoJoinFromUrl();
