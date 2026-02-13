/**
 * Level System Configuration
 * Generates a 100-level progression with escalating point requirements
 * Badges are earned every 5 levels
 */

// Define the level thresholds (cumulative points needed to reach each level)
export function generateLevelThresholds() {
  const thresholds = [0]; // Level 1 starts at 0

  // Manually specified first 5 levels based on user requirements
  const firstFiveLevels = [
    500000, // Level 1 ends at 500k
    1000000, // Level 2 ends at 1M
    2000000, // Level 3 ends at 2M
    3500000, // Level 4 ends at 3.5M
    5000000, // Level 5 ends at 5M
  ];

  // Add the first 5 levels
  thresholds.push(...firstFiveLevels);

  // Generate levels 6-100 with exponential scaling
  // Each level's requirement increases based on current level
  for (let level = 6; level <= 100; level++) {
    const previousThreshold = thresholds[level - 1];
    // Scale increment: starts at 1.5M and grows by ~2% per level
    const increment = 1500000 * Math.pow(1.015, level - 5);
    const newThreshold = previousThreshold + Math.floor(increment);
    thresholds.push(newThreshold);
  }

  return thresholds;
}

// Generate the actual level thresholds once
const LEVEL_THRESHOLDS = generateLevelThresholds();

/**
 * Calculate user level based on total lifetime points
 * @param {number} totalPoints - Total lifetime points
 * @returns {object} - { level, points, nextLevelPoints, progress, percentage }
 */
export function calculateLevel(totalPoints) {
  let currentLevel = 1;

  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      currentLevel = i + 1;
    } else {
      break;
    }
  }

  // Cap at level 100
  if (currentLevel > 100) currentLevel = 100;

  const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextLevelThreshold =
    currentLevel < 100 ? LEVEL_THRESHOLDS[currentLevel] : LEVEL_THRESHOLDS[99];

  const pointsInLevel = totalPoints - currentLevelThreshold;
  const pointsNeededForLevel = nextLevelThreshold - currentLevelThreshold;
  const progress = Math.min(pointsInLevel, pointsNeededForLevel);
  const percentage =
    nextLevelThreshold === currentLevelThreshold
      ? 100
      : Math.floor((progress / pointsNeededForLevel) * 100);

  return {
    level: currentLevel,
    currentLevelStart: currentLevelThreshold,
    currentLevelEnd: nextLevelThreshold,
    pointsInCurrentLevel: pointsInLevel,
    pointsNeededForNext: Math.max(0, nextLevelThreshold - totalPoints),
    totalPoints,
    progress,
    progressPercentage: Math.min(percentage, 100),
  };
}

/**
 * Check if user has earned a badge at this level
 * Badges are earned every 5 levels (5, 10, 15, ...)
 * @param {number} level - Current user level
 * @returns {boolean} - True if level is a badge milestone
 */
export function hasBadgeAtLevel(level) {
  return level > 0 && level % 5 === 0;
}

/**
 * Get badge information for a specific level
 * @param {number} level - Level to get badge for
 * @returns {object|null} - Badge info or null if no badge at this level
 */
export function getBadgeAtLevel(level) {
  if (!hasBadgeAtLevel(level)) return null;

  const badgeNumber = level / 5;
  const badgeNames = [
    'Poker Face', // Level 5
    'Stone Face', // Level 10
    'Deadpan Master', // Level 15
    'Why So Serious', // Level 20
    'Iron Will', // Level 25
    'Unmoved', // Level 30
    'Basilisk Gaze', // Level 35
    'Cold Steel Heart', // Level 40
    'Immovable Object', // Level 45
    'Stoic Sage', // Level 50
    'Carved in Stone', // Level 55
    'Frostbite Stare', // Level 60
    'Glacial Guardian', // Level 65
    'Unyielding Fortress', // Level 70
    'Antarctic Heart', // Level 75
    'Granite Golem', // Level 80
    'Void Walker', // Level 85
    'Eternal Blank Slate', // Level 90
    'Master of Deadpan', // Level 95
    'The Poker God', // Level 100
  ];

  const badgeEmojis = [
    '🥉',
    '🥈',
    '🥇',
    '💎',
    '💎', // Bronze-Diamond
    '♦️',
    '🔷',
    '🟢',
    '💚',
    '🌙', // Ruby-Jade-Twilight
    '⭐',
    '☀️',
    '🌙',
    '✨',
    '🌌', // Radiant-Lunar-Celestial-Cosmic
    '⚡',
    '☄️',
    '♾️',
    '👑',
    '🏆', // Stellar-Nebula-Infinity-Eternal-Legend
  ];

  return {
    level,
    badgeNumber,
    name: badgeNames[badgeNumber - 1] || `Badge ${badgeNumber}`,
    emoji: badgeEmojis[badgeNumber - 1] || '🏅',
  };
}

/**
 * Get all badges earned by user based on current level
 * @param {number} userLevel - Current user level
 * @returns {array} - Array of earned badges
 */
export function getEarnedBadges(userLevel) {
  const badges = [];

  for (let level = 5; level <= userLevel; level += 5) {
    const badge = getBadgeAtLevel(level);
    if (badge) {
      badges.push(badge);
    }
  }

  return badges;
}

/**
 * Get the next badge level
 * @param {number} userLevel - Current user level
 * @returns {object|null} - Next badge info or null if at max
 */
export function getNextBadge(userLevel) {
  const nextBadgeLevel = Math.ceil((userLevel + 1) / 5) * 5;

  if (nextBadgeLevel > 100) return null;

  return {
    level: nextBadgeLevel,
    ...getBadgeAtLevel(nextBadgeLevel),
    pointsNeeded: LEVEL_THRESHOLDS[nextBadgeLevel - 1],
  };
}

// Export the thresholds for reference
export { LEVEL_THRESHOLDS };
