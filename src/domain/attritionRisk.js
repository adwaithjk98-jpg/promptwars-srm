const HIGH_RISK_THRESHOLD = 60;
const MEDIUM_RISK_THRESHOLD = 30;

/**
 * Explainable early-warning score (0–100) for workers likely to burn out or quit.
 * Every point comes with a plain-language reason, so admins see why, not just a number.
 */
export function calculateAttritionRisk({ weeklyHours, maximumWeeklyHours, fatigueAlertCount, overtimeHoursLastFortnight, daysWorkedLastFortnight }) {
  const reasons = [];
  let score = 0;

  if (weeklyHours > maximumWeeklyHours) {
    score += 35;
    reasons.push('Working above the weekly hour limit');
  }
  if (fatigueAlertCount > 0) {
    score += Math.min(30, fatigueAlertCount * 15);
    reasons.push(`${fatigueAlertCount} fatigue alert${fatigueAlertCount === 1 ? '' : 's'} this week`);
  }
  if (overtimeHoursLastFortnight > 10) {
    score += 20;
    reasons.push('Heavy overtime in the last two weeks');
  }
  if (daysWorkedLastFortnight >= 12) {
    score += 15;
    reasons.push('Few rest days in the last two weeks');
  }

  const cappedScore = Math.min(100, score);
  let level = 'low';
  if (cappedScore >= HIGH_RISK_THRESHOLD) {
    level = 'high';
  } else if (cappedScore >= MEDIUM_RISK_THRESHOLD) {
    level = 'medium';
  }
  return { score: cappedScore, level, reasons };
}
