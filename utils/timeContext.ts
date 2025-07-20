// Time context utility for AI prompts
// Maps countries from onboarding to their primary timezones

interface TimeContext {
  currentDate: string;
  currentTime: string;
  timezone: string;
  dayOfWeek: string;
  isWeekend: boolean;
  timeOfDay: string;
  formattedContext: string;
}

// Map of country codes to their primary timezones
const COUNTRY_TIMEZONES: Record<string, string> = {
  'US': 'America/New_York',      // Eastern Time
  'GB': 'Europe/London',         // GMT/BST
  'CA': 'America/Toronto',       // Eastern Time
  'AU': 'Australia/Sydney',      // AEST/AEDT
  'NG': 'Africa/Lagos',          // WAT
  'IN': 'Asia/Kolkata',          // IST
  'ZA': 'Africa/Johannesburg',   // SAST
  'KE': 'Africa/Nairobi',        // EAT
  'GH': 'Africa/Accra',          // GMT
  'UG': 'Africa/Kampala',        // EAT
  'DE': 'Europe/Berlin',         // CET/CEST
  'FR': 'Europe/Paris',          // CET/CEST
  'IT': 'Europe/Rome',           // CET/CEST
  'ES': 'Europe/Madrid',         // CET/CEST
  'NL': 'Europe/Amsterdam',      // CET/CEST
  'SE': 'Europe/Stockholm',      // CET/CEST
  'BR': 'America/Sao_Paulo',     // BRT/BRST
  'MX': 'America/Mexico_City',   // CST/CDT
  'AR': 'America/Argentina/Buenos_Aires', // ART
  'JP': 'Asia/Tokyo',            // JST
  'CN': 'Asia/Shanghai',         // CST
  'SG': 'Asia/Singapore',        // SGT
  'MY': 'Asia/Kuala_Lumpur',     // MYT
  'TH': 'Asia/Bangkok',          // ICT
  'PH': 'Asia/Manila',           // PHT
  'EG': 'Africa/Cairo',          // EET/EEST
  'SA': 'Asia/Riyadh',           // AST
  'AE': 'Asia/Dubai',            // GST
  'JO': 'Asia/Amman',            // EET/EEST
  'OTHER': 'UTC',                // Default for other countries
};

const getTimeOfDay = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

export const getTimeContext = (userCountry?: string): TimeContext => {
  // Get timezone for the country, default to UTC if not found
  const timezone = userCountry ? COUNTRY_TIMEZONES[userCountry] || 'UTC' : 'UTC';
  
  // Create date object in the user's timezone
  const now = new Date();
  
  // Format date and time according to the timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  
  const formattedDateTime = formatter.formatToParts(now);
  
  // Extract individual parts
  const parts: Record<string, string> = {};
  formattedDateTime.forEach(part => {
    parts[part.type] = part.value;
  });
  
  const currentDate = `${parts.weekday}, ${parts.month} ${parts.day}, ${parts.year}`;
  const currentTime = `${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
  const dayOfWeek = parts.weekday;
  
  // Check if it's weekend (0 = Sunday, 6 = Saturday)
  const dayOfWeekNum = now.toLocaleDateString('en-US', { 
    timeZone: timezone,
    weekday: 'long' 
  });
  const isWeekend = ['Sunday', 'Saturday'].includes(dayOfWeekNum);
  
  // Get time of day
  const hour = parseInt(parts.hour);
  const timeOfDay = getTimeOfDay(hour);
  
  // Create formatted context for AI prompts
  const formattedContext = `
🌍 TEMPORAL CONTEXT:
📅 Current Date: ${currentDate}
🕐 Current Time: ${currentTime}
🌍 Timezone: ${timezone}
📊 Day: ${dayOfWeek} ${isWeekend ? '(Weekend)' : '(Weekday)'}
⏰ Time of Day: ${timeOfDay}

Use this temporal context for:
- Realistic date calculations (LMP, symptom onset, etc.)
- Time orientation questions
- Appropriate timing for medical history
- Contextual responses based on current time
- All temporal references should be relative to this current date/time
`;

  return {
    currentDate,
    currentTime,
    timezone,
    dayOfWeek,
    isWeekend,
    timeOfDay,
    formattedContext
  };
};

// Helper function to get timezone for a country
export const getTimezoneForCountry = (countryCode: string): string => {
  return COUNTRY_TIMEZONES[countryCode] || 'UTC';
}; 