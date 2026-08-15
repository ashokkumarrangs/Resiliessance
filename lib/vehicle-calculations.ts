import { differenceInDays, addDays, parseISO } from 'date-fns';

export interface ComponentHealth {
  componentId: string;
  odometerWear: number; // 0 to 1+
  timeWear: number; // 0 to 1+
  unifiedHealth: number; // 0 to 100
  estimatedExpiryDate: Date | null;
  status: 'critical' | 'warning' | 'healthy';
}

/**
 * Calculates unified wear percentage and predicts expiration date.
 */
export function calculateComponentHealth(params: {
  currentOdometer: number;
  currentDate: Date;
  installedDate: Date | string;
  installedOdometer: number;
  limitOdometer?: number | null;
  limitMonths?: number | null;
  averageDailyMileage?: number; // e.g. km or miles per day
}): ComponentHealth {
  const installedDateObj = typeof params.installedDate === 'string' 
    ? parseISO(params.installedDate) 
    : params.installedDate;
  
  // 1. Distance wear
  let odometerWear = 0;
  if (params.limitOdometer && params.limitOdometer > 0) {
    const drivenSinceInstall = Math.max(0, params.currentOdometer - params.installedOdometer);
    odometerWear = drivenSinceInstall / params.limitOdometer;
  }

  // 2. Time wear
  let timeWear = 0;
  if (params.limitMonths && params.limitMonths > 0) {
    const daysSinceInstall = Math.max(0, differenceInDays(params.currentDate, installedDateObj));
    const limitDays = params.limitMonths * 30.44;
    timeWear = daysSinceInstall / limitDays;
  }

  // 3. Unified health
  const maxWear = Math.max(odometerWear, timeWear);
  const unifiedHealth = Math.max(0, Math.min(100, Math.round(100 * (1 - maxWear))));

  // 4. Estimate Expiry Date
  let estimatedExpiryDate: Date | null = null;
  const timeExpiryDate = params.limitMonths 
    ? addDays(installedDateObj, Math.round(params.limitMonths * 30.44)) 
    : null;

  let odometerExpiryDate: Date | null = null;
  if (params.limitOdometer && params.limitOdometer > 0) {
    const drivenSinceInstall = Math.max(0, params.currentOdometer - params.installedOdometer);
    const odometerRemaining = params.limitOdometer - drivenSinceInstall;
    
    // Default to 30 units per day if no average mileage is provided, or if average is 0
    const dailyMileage = (params.averageDailyMileage && params.averageDailyMileage > 0) 
      ? params.averageDailyMileage 
      : 30; 
      
    if (odometerRemaining > 0) {
      const daysRemaining = odometerRemaining / dailyMileage;
      odometerExpiryDate = addDays(params.currentDate, Math.round(daysRemaining));
    } else {
      // Overdue
      odometerExpiryDate = params.currentDate;
    }
  }

  // Choose the earlier date
  if (timeExpiryDate && odometerExpiryDate) {
    estimatedExpiryDate = timeExpiryDate < odometerExpiryDate ? timeExpiryDate : odometerExpiryDate;
  } else {
    estimatedExpiryDate = timeExpiryDate || odometerExpiryDate;
  }

  // 5. Determine Status
  let status: 'critical' | 'warning' | 'healthy' = 'healthy';
  if (maxWear >= 1.0) {
    status = 'critical';
  } else if (maxWear >= 0.8) {
    status = 'warning';
  }

  return {
    componentId: '', // set by caller
    odometerWear,
    timeWear,
    unifiedHealth,
    estimatedExpiryDate,
    status
  };
}

/**
 * Calculates the average daily mileage for a vehicle over a given period.
 * Takes historical logs (sorted descending by date) and computes driving rate.
 */
export function calculateAverageDailyMileage(
  logs: { date: string; odometer: number }[],
  initialOdometer: number,
  vehicleCreatedDate: string | Date
): number {
  if (logs.length === 0) return 30; // fallback default
  
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const oldestLog = sortedLogs[0];
  const latestLog = sortedLogs[sortedLogs.length - 1];

  const totalDist = latestLog.odometer - oldestLog.odometer;
  const daysDiff = differenceInDays(new Date(latestLog.date), new Date(oldestLog.date));

  if (totalDist > 0 && daysDiff > 0) {
    return totalDist / daysDiff;
  }

  // Fallback to diff from vehicle registration/creation to latest log
  const vehicleStart = typeof vehicleCreatedDate === 'string' ? parseISO(vehicleCreatedDate) : vehicleCreatedDate;
  const totalDaysFromStart = differenceInDays(new Date(latestLog.date), vehicleStart);
  const totalDistFromStart = latestLog.odometer - initialOdometer;

  if (totalDistFromStart > 0 && totalDaysFromStart > 0) {
    return totalDistFromStart / totalDaysFromStart;
  }

  return 30; // fallback default
}
