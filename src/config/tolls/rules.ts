import { EmirateTollSystem } from './types';

export const dubaiSalikRules: EmirateTollSystem = {
  id: 'salik',
  name: 'Salik',
  emirate: 'Dubai',
  basePriceAed: 4,
  hasPeakHours: false,
  freeTimes: 'Al Maktoum Bridge is toll-free from 10:00 PM to 6:00 AM (Mon-Sat) and all day Sunday.',
  gates: [
    { id: 'al-barsha', name: 'Al Barsha', location: 'Sheikh Zayed Road' },
    { id: 'al-garhoud', name: 'Al Garhoud', location: 'Al Garhoud Bridge' },
    { id: 'al-maktoum', name: 'Al Maktoum', location: 'Al Maktoum Bridge' },
    { id: 'al-safa', name: 'Al Safa', location: 'Sheikh Zayed Road' },
    { id: 'airport-tunnel', name: 'Airport Tunnel', location: 'Beirut Street' },
    { id: 'al-mamzar-south', name: 'Al Mamzar South', location: 'Al Ittihad Road' },
    { id: 'al-mamzar-north', name: 'Al Mamzar North', location: 'Al Ittihad Road' },
    { id: 'jebel-ali', name: 'Jebel Ali', location: 'Sheikh Zayed Road' },
    { id: 'business-bay', name: 'Business Bay Crossing', location: 'Business Bay Crossing' },
    { id: 'al-safa-south', name: 'Al Safa South', location: 'Sheikh Zayed Road' }
  ],
  exceptionRules: [
    {
      description: 'Charged once if crossed in the same direction within 1 hour.',
      gates: ['Al Mamzar North', 'Al Mamzar South']
    },
    {
      description: 'Charged once if crossed in the same direction within 1 hour.',
      gates: ['Al Safa', 'Al Safa South']
    }
  ],
  dailyCapLimitAed: null, // No daily limit
  officialWebsite: 'https://www.salik.ae'
};

export const abuDhabiDarbRules: EmirateTollSystem = {
  id: 'darb',
  name: 'Darb',
  emirate: 'Abu Dhabi',
  basePriceAed: 4,
  hasPeakHours: true,
  peakHours: [
    {
      startTime: '07:00',
      endTime: '09:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    {
      startTime: '17:00',
      endTime: '19:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
  ],
  freeTimes: 'Sundays and Public Holidays are completely free of charge. Off-peak hours are also free.',
  gates: [
    { id: 'sheikh-zayed', name: 'Sheikh Zayed Bridge', location: 'Sheikh Zayed Bridge' },
    { id: 'sheikh-khalifa', name: 'Sheikh Khalifa Bridge', location: 'Sheikh Khalifa Bridge' },
    { id: 'al-maqtaa', name: 'Al Maqtaa Bridge', location: 'Al Maqtaa Bridge' },
    { id: 'mussafah', name: 'Mussafah Bridge', location: 'Mussafah Bridge' }
  ],
  exceptionRules: [],
  dailyCapLimitAed: 16, // Maximum 16 AED per vehicle per day
  officialWebsite: 'https://darb.itc.gov.ae'
};

export const allTollSystems = [dubaiSalikRules, abuDhabiDarbRules];
