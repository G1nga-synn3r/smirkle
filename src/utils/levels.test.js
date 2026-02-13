import { calculateLevel, hasBadgeAtLevel, getEarnedBadges } from '../utils/levels.js';

describe('Level System', () => {
  describe('calculateLevel', () => {
    it('should calculate level 1 for 0 points', () => {
      const result = calculateLevel(0);
      expect(result.level).toBe(1);
      expect(result.totalPoints).toBe(0);
    });

    it('should calculate level 2 for 500,000 points', () => {
      const result = calculateLevel(500000);
      expect(result.level).toBe(2);
    });

    it('should calculate level 6 for 5,000,000 points', () => {
      const result = calculateLevel(5000000);
      expect(result.level).toBe(6);
    });

    it('should cap at level 100', () => {
      const result = calculateLevel(999999999);
      expect(result.level).toBe(100);
    });

    it('should calculate progress percentage', () => {
      const result = calculateLevel(250000);
      expect(result.progressPercentage).toBeGreaterThanOrEqual(0);
      expect(result.progressPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('hasBadgeAtLevel', () => {
    it('should have badge at level 5', () => {
      expect(hasBadgeAtLevel(5)).toBe(true);
    });

    it('should have badge at level 10', () => {
      expect(hasBadgeAtLevel(10)).toBe(true);
    });

    it('should not have badge at level 3', () => {
      expect(hasBadgeAtLevel(3)).toBe(false);
    });

    it('should not have badge at level 1', () => {
      expect(hasBadgeAtLevel(1)).toBe(false);
    });
  });

  describe('getEarnedBadges', () => {
    it('should return empty array for level 1-4', () => {
      expect(getEarnedBadges(1)).toHaveLength(0);
      expect(getEarnedBadges(4)).toHaveLength(0);
    });

    it('should return 1 badge for level 5', () => {
      expect(getEarnedBadges(5)).toHaveLength(1);
    });

    it('should return 2 badges for level 10', () => {
      expect(getEarnedBadges(10)).toHaveLength(2);
    });

    it('should return 20 badges for level 100', () => {
      expect(getEarnedBadges(100)).toHaveLength(20);
    });
  });
});
