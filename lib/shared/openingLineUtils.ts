import { getTimeContext } from './timeContext';

/**
 * Generate a static opening line for returning users
 * @param isPediatric - Whether this is a pediatric case
 * @param userCountry - User's country for time context
 * @returns Static opening line with time context
 */
export function generateStaticOpeningLine(isPediatric: boolean, userCountry?: string): string {
  const timeContext = getTimeContext(userCountry);
  const timeOfDay = timeContext.timeOfDay;
  
  // Convert time of day to greeting
  let greeting: string;
  switch (timeOfDay) {
    case 'morning':
      greeting = 'Good morning';
      break;
    case 'afternoon':
      greeting = 'Good afternoon';
      break;
    case 'evening':
      greeting = 'Good evening';
      break;
    case 'night':
      greeting = 'Good evening'; // Use evening for night as well
      break;
    default:
      greeting = 'Good day';
  }
  
  // Use "us" for pediatric cases, "me" for adult cases
  const pronoun = isPediatric ? 'us' : 'me';
  
  return `${greeting}, doctor, thank you for seeing ${pronoun} today.`;
}


