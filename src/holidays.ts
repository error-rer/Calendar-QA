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
 * Traditional / Company Assigned Holidays (Standard Annual Holidays)
 */
export const TRADITIONAL_HOLIDAYS_2026: Record<string, string> = {
  '1/1': "New Year's Day",
  '3/3': 'Makha Bucha Day',
  '4/13': 'Songkran Festival',
  '4/14': 'Songkran Festival',
  '4/15': 'Songkran Festival',
  '5/1': 'National Labour Day',
  '5/31': 'Visakha Bucha Day',
  '6/3': "H.M. Queen Suthida's Birthday",
  '7/28': "H.M. King Maha Vajiralongkorn's Birthday",
  '8/12': "National Mother's Day",
  '10/13': 'King Bhumibol Adulyadej Memorial Day (Navamindra Maharaj Day)',
  '12/5': "National Father's Day / King Bhumibol's Birthday",
  '12/31': "New Year's Eve",
};

/**
 * Checks if a given Date is a holiday.
 * Supports:
 * 1. Traditional / Company Assigned Holidays (fixed dates and annual lunar dates).
 * 2. Shift-Specific Compensatory Holidays (Shift E & E1 Only) assigned on the following Monday when holidays fall on weekends (Sat/Sun).
 */
export function getHolidayForDate(date: Date): HolidayInfo | null {
  if (!date || isNaN(date.getTime())) return null;

  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const key = `${month}/${day}`;

  // 1. Check Traditional / Company Assigned Annual Holidays
  if (TRADITIONAL_HOLIDAYS_2026[key]) {
    return {
      name: TRADITIONAL_HOLIDAYS_2026[key],
      isTraditional: true,
    };
  }

  // 2. Check Shift-Specific Compensatory Holidays (Shift E & E1 Only)
  // If today is Monday (getDay() === 1), check if preceding Sunday or Saturday was a traditional holiday.
  if (date.getDay() === 1) {
    // Check Sunday (yesterday)
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - 1);
    const sunKey = `${sunday.getMonth() + 1}/${sunday.getDate()}`;
    if (TRADITIONAL_HOLIDAYS_2026[sunKey]) {
      return {
        name: `Substitute ${TRADITIONAL_HOLIDAYS_2026[sunKey]} (Shift E & E1)`,
        isSubstitute: true,
        shifts: ['Shift E', 'Shift E1'],
        isTraditional: false,
      };
    }

    // Check Saturday (2 days ago)
    const saturday = new Date(date);
    saturday.setDate(date.getDate() - 2);
    const satKey = `${saturday.getMonth() + 1}/${saturday.getDate()}`;
    if (TRADITIONAL_HOLIDAYS_2026[satKey]) {
      return {
        name: `Substitute ${TRADITIONAL_HOLIDAYS_2026[satKey]} (Shift E & E1)`,
        isSubstitute: true,
        shifts: ['Shift E', 'Shift E1'],
        isTraditional: false,
      };
    }
  }

  return null;
}

/**
 * Returns distinct styling properties for Traditional vs Shift E & E1 Compensatory Holidays.
 */
export function getHolidayStyle(holiday: HolidayInfo): HolidayStyle {
  if (holiday.isTraditional) {
    // Company Assigned Holidays (Traditional / Square) - Standard Light Purple
    return {
      bg: '#EDE9FE',
      hoverBg: '#DDD6FE',
      textColor: '#7C3AED',
      borderColor: '#C4B5FD',
      badgeBg: '#EDE9FE',
      badgeBorder: '#C4B5FD',
      badgeText: '#7C3AED',
    };
  } else {
    // Shift E/E1 Holidays (Compensatory / Hexagon) - Softer Pastel Purple
    return {
      bg: '#FAF5FF',
      hoverBg: '#F3E8FF',
      textColor: '#9333EA',
      borderColor: '#E9D5FF',
      badgeBg: '#FAF5FF',
      badgeBorder: '#E9D5FF',
      badgeText: '#9333EA',
    };
  }
}
