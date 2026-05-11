export interface TollTimeWindow {
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  days: string[];    // e.g. ["Monday", "Tuesday"]
}

export interface TollGateDefinition {
  id: string;
  name: string;
  location: string;
}

export interface TollExceptionRule {
  description: string;
  gates: string[];
}

export interface EmirateTollSystem {
  id: string;
  name: string;
  emirate: string;
  basePriceAed: number;
  hasPeakHours: boolean;
  peakHours?: TollTimeWindow[];
  freeTimes?: string;
  gates: TollGateDefinition[];
  exceptionRules: TollExceptionRule[];
  dailyCapLimitAed: number | null;
  officialWebsite: string;
}
