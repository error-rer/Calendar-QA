export interface HolidayInfo {
  name: string;
  subtitle?: string;
  isSubstitute?: boolean;
  shifts?: string[];
  isTraditional: boolean;
  isMonthEndLock?: boolean;
  isDecBlockout?: boolean;
  isJanBlockout?: boolean;
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
 * Automatically checks if a given Date is the last day of its month.
 */
export function isLastDayOfMonth(date: Date): boolean {
  if (!date || isNaN(date.getTime())) return false;
  const testDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return date.getDate() === testDate.getDate();
}

/**
 * Automatically checks if a given Date is the last WORKING WEEKDAY (Monday–Friday) of its month.
 * If the actual last day of the month falls on a Saturday or Sunday, rolls back to the preceding Friday.
 */
export function isLastWorkingWeekdayOfMonth(date: Date): boolean {
  if (!date || isNaN(date.getTime())) return false;
  const dayOfWeek = date.getDay();
  // Must be a weekday (Monday = 1 through Friday = 5)
  if (dayOfWeek < 1 || dayOfWeek > 5) return false;

  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const lastCalendarDate = new Date(year, month + 1, 0); // Last calendar day of month
  const lastDayOfWeek = lastCalendarDate.getDay(); // 0 = Sun, 6 = Sat

  let targetDay: number;
  if (lastDayOfWeek === 6) {
    // Saturday -> Preceding Friday
    targetDay = lastCalendarDate.getDate() - 1;
  } else if (lastDayOfWeek === 0) {
    // Sunday -> Preceding Friday
    targetDay = lastCalendarDate.getDate() - 2;
  } else {
    // Mon–Fri -> Exact last day
    targetDay = lastCalendarDate.getDate();
  }

  return date.getDate() === targetDay;
}

/**
 * Checks if a given Date is a holiday (Traditional Annual, Lunar Buddhist, Shift E/E1 Substitute, Month-End Lock, Dec/Jan Calendar Week Row Blockout).
 */
export function getHolidayForDate(date: Date): HolidayInfo | null {
  if (!date || isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12 (1 = Jan, 12 = Dec)
  const day = date.getDate();
  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

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
  if (dayOfWeek === 1) {
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

  // All subsequent blockout and month-end rules apply STRICTLY to Monday-Friday weekdays
  if (!isWeekday) return null;

  // Compute 0-indexed calendar week row index for the date within its month grid (Monday-starting weeks)
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const firstWdMon = (firstDayOfMonth.getDay() + 6) % 7; // Mon = 0, Tue = 1, ..., Sun = 6
  const rowIndex = Math.floor((day - 1 + firstWdMon) / 7);

  // 3. December Year-End Rules (Target the last 2 calendar week rows displayed in December, Monday–Friday only)
  if (month === 12) {
    const lastDayOfMonth = new Date(year, 12, 0).getDate(); // 31
    const totalRows = Math.floor((lastDayOfMonth - 1 + firstWdMon) / 7) + 1;
    const isLastTwoWeekRows = rowIndex >= totalRows - 2;

    if (isLastTwoWeekRows) {
      if (day === 30) {
        return {
          name: 'No customer audit',
          subtitle: 'Support production ship out',
          isTraditional: true,
          isDecBlockout: true,
        };
      }
      return {
        name: 'No customer audit',
        isTraditional: true,
        isDecBlockout: true,
      };
    }
  }

  // 4. January New-Year Rules (Target the first 2 calendar week rows starting from beginning of January, Monday–Friday only)
  if (month === 1) {
    const isFirstTwoWeekRows = rowIndex < 2;

    if (isFirstTwoWeekRows) {
      // Days Jan 1–5 that fall on Mon–Fri display label: "FAC shut down all sites"
      if (day >= 1 && day <= 5) {
        return {
          name: 'FAC shut down all sites',
          isTraditional: true,
          isJanBlockout: true,
        };
      }
      // Remaining weekdays within the first 2 week rows remain blocked without weekend spillover
      return {
        name: '',
        isTraditional: true,
        isJanBlockout: true,
      };
    }
  }

  // 5. Automatic Month-End Lock (Last WORKING WEEKDAY of every month, Monday–Friday only: "No customer audit", "Support production ship out")
  if (isLastWorkingWeekdayOfMonth(date)) {
    return {
      name: 'No customer audit',
      subtitle: 'Support production ship out',
      isTraditional: true,
      isMonthEndLock: true,
    };
  }

  return null;
}

/**
 * Returns distinct styling properties for Traditional, Month-End Lock, Dec/Jan Blockout, and Shift E & E1 Compensatory Holidays.
 */
export function getHolidayStyle(holiday: HolidayInfo): HolidayStyle {
  if (holiday.isMonthEndLock || holiday.isDecBlockout || holiday.isJanBlockout) {
    // Soft Blue-Gray Tinted Background for Blockout / Month-End / Dec / Jan rules
    return {
      bg: '#F0F4FA',
      hoverBg: '#E4ECF7',
      textColor: '#2563EB',
      borderColor: '#D4DEF0',
      badgeBg: 'transparent',
      badgeBorder: 'transparent',
      badgeText: '#2563EB',
    };
  } else if (holiday.isTraditional) {
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

/**
 * Helper to determine if a HolidayInfo represents an official public/company holiday or substitute holiday
 * (as opposed to a custom blockout rule or month-end lock notice).
 */
export function isOfficialHoliday(holiday: HolidayInfo | null | undefined): boolean {
  if (!holiday) return false;
  if (holiday.isSubstitute) return true;
  if (holiday.isMonthEndLock || holiday.isDecBlockout || holiday.isJanBlockout) return false;
  return holiday.isTraditional;
}
