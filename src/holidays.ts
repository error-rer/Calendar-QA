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
