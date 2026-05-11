import { EmirateTollSystem } from './types';
import { allTollSystems } from './rules';

/**
 * Single Responsibility Principle (SRP): 
 * This service is solely responsible for generating formatted context of toll rules.
 */
export class TollRulesFormatter {
  static getSystemRulesFormatted(system: EmirateTollSystem): string {
    let text = `${system.name} (${system.emirate}):\n`;
    text += `- Cost: ${system.basePriceAed} AED per gate.\n`;
    
    if (system.hasPeakHours && system.peakHours) {
      const peakDetails = system.peakHours.map(
        ph => `${ph.startTime} to ${ph.endTime} on ${ph.days[0]} to ${ph.days[ph.days.length-1]}`
      ).join(' and ');
      text += `- Peak Hours (charged): ${peakDetails}.\n`;
    } else {
      text += `- Tolls are charged 24/7 (flat rate, no peak times).\n`;
    }

    if (system.freeTimes) {
      text += `- Free Times: ${system.freeTimes}\n`;
    }

    const gateNames = system.gates.map(g => g.name).join(', ');
    text += `- Gates: ${gateNames}.\n`;

    if (system.exceptionRules.length > 0) {
      system.exceptionRules.forEach(rule => {
        text += `- Exception: ${rule.gates.join(' & ')} - ${rule.description}\n`;
      });
    }

    if (system.dailyCapLimitAed) {
      text += `- Maximum daily cap: ${system.dailyCapLimitAed} AED.\n`;
    }

    return text;
  }

  static getAllRulesText(): string {
    return allTollSystems.map(system => this.getSystemRulesFormatted(system)).join('\n');
  }
}
