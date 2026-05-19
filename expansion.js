"use strict";

(function installRingsideExpansion() {
  window.ringsideExpansionStatus = { loaded: true, installed: false, version: "1.0.0" };
  if (typeof WORLD_ENTITIES === "undefined" || typeof startWorldMinigame === "undefined") {
    window.ringsideExpansionStatus.skipped = "Base game globals were not ready.";
    return;
  }

  const BUFF_KEYS = ["power", "speed", "stamina", "defence", "focus"];
  const EMPTY_BUFFS = { power: 0, speed: 0, stamina: 0, defence: 0, focus: 0 };

  function safeBuffs(source = {}) {
    const safe = { ...EMPTY_BUFFS };
    BUFF_KEYS.forEach((key) => {
      const value = Number(source?.[key] || 0);
      safe[key] = Number.isFinite(value) ? clamp(Math.round(value), 0, 3) : 0;
    });
    return safe;
  }

  function ensureTrainingBuffs() {
    worldState.trainingBuffs = safeBuffs(worldState.trainingBuffs);
    return worldState.trainingBuffs;
  }

  function hasTrainingBuffs() {
    const buffs = ensureTrainingBuffs();
    return BUFF_KEYS.some((key) => buffs[key] > 0);
  }

  function trainingBuffText() {
    const buffs = ensureTrainingBuffs();
    const labels = [];
    if (buffs.power) labels.push(`Power+${buffs.power}`);
    if (buffs.speed) labels.push(`Speed+${buffs.speed}`);
    if (buffs.stamina) labels.push(`Stamina+${buffs.stamina}`);
    if (buffs.defence) labels.push(`Guard+${buffs.defence}`);
    if (buffs.focus) labels.push(`Focus+${buffs.focus}`);
    return labels.join(" ");
  }

  function addTrainingBuffs(source = {}) {
    const buffs = ensureTrainingBuffs();
    const incoming = safeBuffs(source);
    BUFF_KEYS.forEach((key) => {
      buffs[key] = clamp(buffs[key] + incoming[key], 0, 3);
    });
    const label = trainingBuffText();
    if (label) {
      pushFeed(`Training edge ready for next fight: ${label}.`);
      addFloater(worldState.x, worldState.y - 94, "TRAINING EDGE", "#9eb7ff");
    }
    saveWorldState(false);
  }

  const originalCreateDefaultWorldState = createDefaultWorldState;
  createDefaultWorldState = function createDefaultWorldStateWithExpansion() {
    const state = originalCreateDefaultWorldState();
    state.trainingBuffs = safeBuffs(state.trainingBuffs);
    return state;
  };

  const originalSanitizeWorldState = sanitizeWorldState;
  sanitizeWorldState = function sanitizeWorldStateWithExpansion(state) {
    const safe = originalSanitizeWorldState(state);
    safe.trainingBuffs = safeBuffs(state?.trainingBuffs);
    return safe;
  };

  const originalSaveWorldState = saveWorldState;
  saveWorldState = function saveWorldStateWithExpansion(showMessage = true) {
    originalSaveWorldState(showMessage);
    try {
      const payload = JSON.parse(localStorage.getItem(worldSaveKey()) || "{}");
      payload.trainingBuffs = safeBuffs(worldState.trainingBuffs);
      localStorage.setItem(worldSaveKey(), JSON.stringify(payload));
      if (activeSaveSlot === "slot1") localStorage.setItem(WORLD_SAVE_KEY, JSON.stringify(payload));
    } catch {
      // The base save already reported storage failures.
    }
  };

  Object.assign(WORLD_ENTITIES, {
    padCoach: {
      id: "padCoach",
      area: "gym",
      name: "Pad Coach",
      x: 430,
      y: 430,
      radius: 52,
      portrait: 0,
      availableStep: 6,
    },
    marketCourier: {
      id: "marketCourier",
      area: "market",
      name: "Rumour Courier",
      x: 520,
      y: 358,
      radius: 54,
      portrait: 1,
      portraitSheet: "chapter3Portraits",
      availableStep: 21,
    },
    clinicMina: {
      id: "clinicMina",
      area: "gym",
      name: "Cutman's Kit",
      x: 642,
      y: 392,
      radius: 50,
      portrait: 0,
      portraitSheet: "chapter2Portraits",
      availableStep: 34,
    },
  });

  Object.assign(WORLD_DIALOGUE, {
    focusPadsIntro: {
      speaker: "Coach Marcus",
      portrait: 0,
      text: "Pads are honest. They ask one question at a time. Answer fast, then breathe.",
    },
    marketCourierIntro: {
      speaker: "Rumour Courier",
      portrait: 1,
      portraitSheet: "chapter3Portraits",
      text: "You want names? Run the route before Crown boys notice who asked.",
    },
    cutmanClinicIntro: {
      speaker: "Mina",
      portrait: 0,
      portraitSheet: "chapter2Portraits",
      text: "Hold pressure here. Wrap there. Nobody gets tougher by bleeding on my floor.",
    },
  });

  const EXTRA_MINIGAMES = {
    focusPads: {
      id: "focusPads",
      type: "sequence",
      title: "Focus Pads: Answer Back",
      hint: "Match the pad calls. This gives Focus and Power for your next fight.",
      sequence: ["jab", "slip", "hook", "body", "jab", "hook"],
      xp: 58,
      money: 0,
      firstSkill: false,
      buff: { focus: 1, power: 1 },
      complete: "The pads snap clean. For once, your anger waits its turn.",
      fail: "The pads slap past you. Marcus lowers them until you stop rushing.",
    },
    marketRun: {
      id: "marketRun",
      type: "route",
      title: "Neon Errand: Names in the Rain",
      hint: "Run the courier route. Finish it to earn cash and Speed/Stamina for the next fight.",
      route: [
        { x: 254, y: 342 },
        { x: 456, y: 286 },
        { x: 664, y: 342 },
        { x: 700, y: 410 },
      ],
      timeLimit: 22,
      xp: 62,
      money: 26,
      firstSkill: false,
      buff: { speed: 1, stamina: 1 },
      complete: "The courier palms you a damp note. Crown's shadow has street names now.",
      fail: "You lose the route in the neon crowd. The rumour moves without you.",
    },
    cutmanClinic: {
      id: "cutmanClinic",
      type: "timing",
      title: "Cutman's Kit: Keep Them Standing",
      hint: "Time the wraps. This gives Guard and Stamina for your next fight.",
      need: 4,
      misses: 3,
      xp: 42,
      money: 18,
      firstSkill: false,
      buff: { defence: 1, stamina: 1 },
      complete: "Mina ties the last knot hard. Grief does not get to waste anyone else tonight.",
      fail: "The wrap bunches under your hand. Mina makes you slow down and do it properly.",
    },
  };

  const originalStartWorldMinigame = startWorldMinigame;
  startWorldMinigame = function startWorldMinigameWithExpansion(type) {
    const config = EXTRA_MINIGAMES[type];
    if (!config) {
      originalStartWorldMinigame(type);
      return;
    }
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
  };

  const originalFinishWorldMinigame = finishWorldMinigame;
  finishWorldMinigame = function finishWorldMinigameWithExpansion(won) {
    const game = activeMinigame ? { ...activeMinigame, buff: activeMinigame.buff ? { ...activeMinigame.buff } : null } : null;
    originalFinishWorldMinigame(won);
    if (won && game?.buff) addTrainingBuffs(game.buff);
  };

  const originalApplyWorldStatsToFighter = applyWorldStatsToFighter;
  applyWorldStatsToFighter = function applyWorldStatsToFighterWithExpansion(fighter) {
    originalApplyWorldStatsToFighter(fighter);
    const buffs = ensureTrainingBuffs();
    if (!BUFF_KEYS.some((key) => buffs[key])) return;
    fighter.power += buffs.power * 0.45 + buffs.focus * 0.18;
    fighter.speed += buffs.speed * 0.35 + buffs.focus * 0.12;
    fighter.maxStamina += buffs.stamina * 8;
    fighter.staminaCap = fighter.maxStamina;
    fighter.stamina = fighter.maxStamina;
    fighter.maxBlock += buffs.defence * 7;
    fighter.block = fighter.maxBlock;
    fighter.recovery += buffs.focus * 0.04;
    fighter.counterBonus += buffs.focus * 0.04;
    updateHealthTotal(fighter);
  };

  const originalCompleteWorldFight = completeWorldFight;
  completeWorldFight = function completeWorldFightWithExpansion(localWon, method) {
    const spentBuffs = hasTrainingBuffs();
    originalCompleteWorldFight(localWon, method);
    if (spentBuffs) {
      worldState.trainingBuffs = safeBuffs();
      pushFeed("Training edge spent. Hit the gym or side jobs to prepare again.");
      saveWorldState(false);
    }
  };

  const originalWorldLoadoutText = worldLoadoutText;
  worldLoadoutText = function worldLoadoutTextWithExpansion() {
    const base = originalWorldLoadoutText();
    const buffs = trainingBuffText();
    return buffs ? `${base} | Buff: ${buffs}` : base;
  };

  const originalWorldSideQuestHint = worldSideQuestHint;
  worldSideQuestHint = function worldSideQuestHintWithExpansion() {
    if (worldState.objectiveStep >= 34 && !worldState.sideQuests.cutmanClinic) return "Side activity: help Mina at the cutman's kit for a fight prep buff.";
    if (worldState.objectiveStep >= 21 && !worldState.sideQuests.marketRun) return "Side activity: run Neon Market rumours for cash and fight prep.";
    if (worldState.objectiveStep >= 6 && !worldState.sideQuests.focusPads) return "Side activity: work focus pads at Rustbell Gym for a fight prep buff.";
    return originalWorldSideQuestHint();
  };

  const originalWorldPromptText = worldPromptText;
  worldPromptText = function worldPromptTextWithExpansion() {
    if (activeMode === "world" && !worldState.dialogue && !worldState.menuOpen && !worldState.upgradeOpen) {
      const target = worldInteractTarget || getWorldInteractTarget();
      if (target?.id === "padCoach") return "Press E or JAB for focus pads.";
      if (target?.id === "marketCourier") return "Press E or JAB to run the rumour route.";
      if (target?.id === "clinicMina") return "Press E or JAB to help at the cutman's kit.";
    }
    return originalWorldPromptText();
  };

  function startExtraActivity(target, introFlag, dialogueKey, minigameId, feedText) {
    if (!worldState.sideQuests[introFlag]) {
      worldState.sideQuests[introFlag] = true;
      setWorldDialogue(WORLD_DIALOGUE[dialogueKey]);
      pushFeed(feedText);
      saveWorldState(false);
      return;
    }
    startWorldMinigame(minigameId);
  }

  const originalInteractWorld = interactWorld;
  interactWorld = function interactWorldWithExpansion() {
    if (activeMode === "world" && !worldState.dialogue && !worldState.menuOpen && !worldState.upgradeOpen) {
      const target = getWorldInteractTarget();
      if (target?.id === "padCoach") {
        startExtraActivity(target, "focusPadsIntro", "focusPadsIntro", "focusPads", "Focus pads unlocked. Talk again to start the drill.");
        return;
      }
      if (target?.id === "marketCourier") {
        startExtraActivity(target, "marketCourierIntro", "marketCourierIntro", "marketRun", "Neon rumour route unlocked. Talk again to run it.");
        return;
      }
      if (target?.id === "clinicMina") {
        startExtraActivity(target, "cutmanClinicIntro", "cutmanClinicIntro", "cutmanClinic", "Cutman's kit unlocked. Use it again to prep for the next fight.");
        return;
      }
    }
    originalInteractWorld();
  };

  try {
    const raw = localStorage.getItem(worldSaveKey()) || (activeSaveSlot === "slot1" ? localStorage.getItem(WORLD_SAVE_KEY) : "");
    const saved = raw ? JSON.parse(raw) : null;
    worldState.trainingBuffs = safeBuffs(saved?.trainingBuffs || worldState.trainingBuffs);
  } catch {
    ensureTrainingBuffs();
  }

  window.ringsideExpansionStatus.installed = true;
})();
