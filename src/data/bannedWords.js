/**
 * Banned Keywords for AI Content Moderation
 * These keywords are used to scan video metadata during upload
 */

// Categories of banned content
export const BANNED_CATEGORIES = {
  VIOLENCE: 'violence',
  HATE: 'hate',
  ADULT: 'adult',
  SPAM: 'spam',
  COPYRIGHT: 'copyright',
  HARASSMENT: 'harassment',
};

// Banned keywords organized by category
export const BANNED_KEYWORDS = {
  [BANNED_CATEGORIES.VIOLENCE]: [
    'violence',
    'violent',
    'fight',
    'attack',
    'assault',
    'murder',
    'kill',
    'weapon',
    'guns',
    'shooting',
    'blood',
    'gore',
    'torture',
  ],
  [BANNED_CATEGORIES.HATE]: [
    'hate',
    'racist',
    'discrimination',
    'slur',
    'nazi',
    'supremacy',
    'bigotry',
    'prejudice',
    'xenophobia',
    'antisemitism',
  ],
  [BANNED_CATEGORIES.ADULT]: [
    'nsfw',
    'porn',
    'explicit',
    'adult',
    'nude',
    'naked',
    'sexual',
    'erotic',
    'xxx',
    'adult content',
  ],
  [BANNED_CATEGORIES.SPAM]: ['clickbait', 'spam', 'bot', 'fake', 'scam', 'phishing', 'malware'],
  [BANNED_CATEGORIES.COPYRIGHT]: ['copyright', 'pirated', 'stolen', 'illegal download', 'torrent'],
  [BANNED_CATEGORIES.HARASSMENT]: ['bullying', 'harass', 'stalk', 'threat', 'intimidate', 'doxx'],
};

/**
 * Get all banned keywords as a flat array
 * @returns {Array} All banned keywords
 */
export const getAllBannedKeywords = () => {
  return Object.values(BANNED_KEYWORDS).flat();
};

/**
 * Check if a keyword is banned
 * @param {string} keyword - Keyword to check
 * @returns {boolean} True if keyword is banned
 */
export const isKeywordBanned = (keyword) => {
  const normalizedKeyword = keyword.toLowerCase();
  return getAllBannedKeywords().some((banned) => normalizedKeyword.includes(banned.toLowerCase()));
};

/**
 * Find banned keywords in a text
 * @param {string} text - Text to scan
 * @returns {Array} Array of found banned keywords
 */
export const findBannedKeywords = (text) => {
  const normalizedText = text.toLowerCase();
  const foundKeywords = [];

  for (const [category, keywords] of Object.entries(BANNED_KEYWORDS)) {
    keywords.forEach((keyword) => {
      if (normalizedText.includes(keyword.toLowerCase())) {
        foundKeywords.push({
          keyword,
          category,
        });
      }
    });
  }

  return foundKeywords;
};

/**
 * Check if content passes moderation
 * @param {string} content - Content to check (title, description, tags, etc.)
 * @returns {Object} Result with passed status and any flagged keywords
 */
export const checkContentModeration = (content) => {
  const flagged = findBannedKeywords(content);
  return {
    passed: flagged.length === 0,
    flaggedKeywords: flagged,
    timestamp: new Date().toISOString(),
  };
};

export default {
  BANNED_CATEGORIES,
  BANNED_KEYWORDS,
  getAllBannedKeywords,
  isKeywordBanned,
  findBannedKeywords,
  checkContentModeration,
};
