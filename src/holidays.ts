export interface HolidayInfo {
  name: string;
  isSubstitute?: boolean;
  shifts?: string[];
  isTraditional: boolean;
}

export interface HolidayStyle {
  bg: string;
  hoverBg: string;
  textColor: string;
  borderColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

/**
 * Fixed-Date Company Assigned Holidays (Traditional - Recurring every year)
 * Key format: 'M/D'
 */
export const FIXED_ANNUAL_HOLIDAYS: Record<string, string> = {
  '1/1': "New Year's Day",
  '4/13': 'Songkran Festival',
  '4/14': 'Songkran Festival',
  '4/15': 'Songkran Festival',
  '5/1': 'National Labour Day',
  '6/3': "H.M. Queen Suthida's Birthday",
  '7/28': "H.M. King Maha Vajiralongkorn's Birthday",
  '8/12': "National Mother's Day",
  '10/13': 'King Bhumibol Adulyadej Memorial Day (Navamindra Maharaj Day)',
  '12/5': "National Father's Day / National Day",
  '12/31': "New Year's Eve",
};

/**
 * Dynamic / Lunar Buddhist Holidays (Corrected by Thai Lunar Calendar Rules for 2026, 2027, 2028+)
 * Key format: 'YYYY/M/D'
 */
export const LUNAR_BUDDHIST_HOLIDAYS: Record<string, string> = {
  // 2026
  '2026/3/3': 'Makha Bucha Day',
  '2026/5/31': 'Visakha Bucha Day',
  // 2027
  '2027/2/21': 'Makha Bucha Day',
  '2027/5/20': 'Visakha Bucha Day',
  // 2028
  '2028/2/9': 'Makha Bucha Day',
  '2028/5/8': 'Visakha Bucha Day',
};

/**
 * Checks if a given Date is a holiday (Traditional Annual, Lunar Buddhist, or Shift E/E1 Substitute).
 */
export function getHolidayForDate(date: Date): HolidayInfo | null {
  if (!date || isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // Helper to check if a specific date was a traditional/company holiday
  const checkTraditional = (y: number, m: number, d: number): string | null => {
    const ymdKey = `${y}/${m}/${d}`;
    const mdKey = `${m}/${d}`;
    return LUNAR_BUDDHIST_HOLIDAYS[ymdKey] || FIXED_ANNUAL_HOLIDAYS[mdKey] || null;
  };

  // 1. Check direct Traditional / Company Assigned Annual Holidays or Lunar Buddhist Holidays
  const directName = checkTraditional(year, month, day);
  if (directName) {
    return {
      name: directName,
      isTraditional: true,
    };
  }

  // 2. Check Shift-Specific Compensatory Holidays (Shift E & E1 Only)
  // When a holiday falls on a weekend (Saturday or Sunday), assign substitute on following Monday (getDay() === 1).
  if (date.getDay() === 1) {
    // Check Sunday (yesterday)
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - 1);
    const sunName = checkTraditional(sunday.getFullYear(), sunday.getMonth() + 1, sunday.getDate());
    if (sunName) {
      return {
        name: `Substitute ${sunName} (Shift E & E1)`,
        isSubstitute: true,
        shifts: ['Shift E', 'Shift E1'],
        isTraditional: false,
      };
    }

    // Check Saturday (2 days ago)
    const saturday = new Date(date);
    saturday.setDate(date.getDate() - 2);
    const satName = checkTraditional(saturday.getFullYear(), saturday.getMonth() + 1, saturday.getDate());
    if (satName) {
      return {
        name: `Substitute ${satName} (Shift E & E1)`,
        isSubstitute: true,
        shifts: ['Shift E', 'Shift E1'],
        isTraditional: false,
      };
    }
  }

  return null;
}

/**
 * Returns distinct grayscale styling properties for Traditional vs Shift E & E1 Compensatory Holidays.
 */
export function getHolidayStyle(holiday: HolidayInfo): HolidayStyle {
  if (holiday.isTraditional) {
    // Company Assigned Holidays (Standard Traditional) - Light Gray
    return {
      bg: '#F3F4F6',
      hoverBg: '#E5E7EB',
      textColor: '#374151',
      borderColor: '#D1D5DB',
      badgeBg: 'transparent',
      badgeBorder: 'transparent',
      badgeText: '#374151',
    };
  } else {
    // Company Compensatory / Shift Substitute Holidays (Shift E & E1) - Noticeably Darker Gray
    return {
      bg: '#D1D5DB',
      hoverBg: '#9CA3AF',
      textColor: '#1F2937',
      borderColor: '#9CA3AF',
      badgeBg: 'transparent',
      badgeBorder: 'transparent',
      badgeText: '#1F2937',
    };
  }
}
