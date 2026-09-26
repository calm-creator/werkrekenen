import assert from 'node:assert';

// We import the compiled or TS file, or test logic directly. Let's write the test script in ESM format matching pure math.
import {
  calculateFromMonthlyWage,
  calculateFromHourlyWage,
  calculateReiskosten,
  calculateThuiswerkvergoeding,
  calculateVakantiegeld,
  calculateVakantieUren,
  calculateOveruren,
  calculateWerkdagen,
  calculateParttimeSalaris,
  calculateVakantiedagen,
  calculateSalarisverhoging,
  calculateUurloonNaarMaandloon,
  calculateMaandloonNaarUurloon,
  calculateWerkurenPerJaar,
  calculateWoonWerkKosten,
  calculateKilometervergoeding,
  calculateWeekloon,
  calculateFte,
  calculateFteToHours,
  calculateWerkgeverslasten,
  calculateQuickEmployerCost,
  calculateDertiendeMaand,
  calculateOpzegtermijn,
  calculateArbeidsverleden,
  calculateWajong,
  calculateNettoBesteedbaarInkomen,
  calculateTransitievergoeding,
  calculateNettoSalaris,
  calculateJaarinkomen
} from '../src/utils/calculations.ts';

console.log('--- Testing WerkRekenen calculation engines ---');

// 1. Uurloon
{
  const res = calculateFromMonthlyWage(3466.67, 40);
  // (40 * 52) / 12 = 173.333... monthly hours -> 3466.67 / 173.333 = 20.00
  assert.strictEqual(res.hourlyWage, 20.0);
  assert.strictEqual(res.annualSalary, 41600.04);
  assert.strictEqual(res.annualSalaryWithVacation, 44928.04);

  // Edge cases: 0 salary
  const zero = calculateFromMonthlyWage(0, 40);
  assert.strictEqual(zero.hourlyWage, 0);

  // From hourly wage
  const res2 = calculateFromHourlyWage(25, 36);
  // (36 * 52) / 12 = 156 monthly hours -> 25 * 156 = 3900
  assert.strictEqual(res2.monthlySalary, 3900);
  console.log('✓ Uurloon calculations passed');
}

// 2. Reiskostenvergoeding
{
  // 25 km one-way = 50 km per day, 4 days a week, €0.23/km
  const res = calculateReiskosten(25, 4, 0.23);
  // 50 km * 0.23 = € 11.50 per day
  assert.strictEqual(res.dailyAllowance, 11.5);
  // Weekly: 11.5 * 4 = 46.00
  assert.strictEqual(res.weeklyAllowance, 46.0);
  // Annual days: (4/5) * 214 = 171.2 days -> 171.2 * 11.5 = 1968.80
  assert.strictEqual(res.annualAllowance, 1968.8);
  // Monthly: 1968.80 / 12 = 164.07
  assert.strictEqual(res.monthlyAllowance, 164.07);

  // Employer pays € 0.29 (above tax-free € 0.23)
  const high = calculateReiskosten(20, 5, 0.29);
  assert.strictEqual(high.isAboveOfficialRate, true);
  assert(high.taxablePortionMonthly > 0);
  console.log('✓ Reiskostenvergoeding calculations passed');
}

// 3. Thuiswerkvergoeding
{
  // 2 days per week at € 2.40/day
  const res = calculateThuiswerkvergoeding(2, 2.40);
  // Weekly: 2 * 2.40 = 4.80
  assert.strictEqual(res.weeklyAllowance, 4.80);
  // Annual days: (2/5) * 214 = 85.6 days -> 85.6 * 2.40 = 205.44
  assert.strictEqual(res.annualAllowance, 205.44);
  // Monthly: 205.44 / 12 = 17.12
  assert.strictEqual(res.monthlyAllowance, 17.12);
  console.log('✓ Thuiswerkvergoeding calculations passed');
}

// 4. Vakantiegeld
{
  // Gross monthly 3500, 12 months, 8%
  const res = calculateVakantiegeld(3500, 12, 8);
  // Basis = 42,000 * 0.08 = 3,360
  assert.strictEqual(res.grossVacationPay, 3360);
  assert.strictEqual(res.monthlyAccrual, 280);

  // Partial year (6 months)
  const part = calculateVakantiegeld(3000, 6, 8);
  assert.strictEqual(part.grossVacationPay, 1440);
  console.log('✓ Vakantiegeld calculations passed');
}

// 5. Vakantie-uren
{
  // 40h/week -> statutory = 4 * 40 = 160h (20 days). Total 25 days fulltime -> 5 days bovenwettelijk (40h) -> 200h total
  const res40 = calculateVakantieUren(40, 25, 40);
  assert.strictEqual(res40.statutoryHours, 160);
  assert.strictEqual(res40.nonStatutoryHours, 40);
  assert.strictEqual(res40.totalHours, 200);
  assert.strictEqual(res40.totalDays, 25);

  // 32h/week (parttime factor 0.8) -> statutory = 4 * 32 = 128h (16 days). Total 20 days (160h)
  const res32 = calculateVakantieUren(32, 25, 40);
  assert.strictEqual(res32.statutoryHours, 128);
  assert.strictEqual(res32.nonStatutoryHours, 32);
  assert.strictEqual(res32.totalHours, 160);
  assert.strictEqual(res32.parttimePercentage, 80);
  console.log('✓ Vakantie-uren calculations passed');
}

// 6. Overuren
{
  // Test 1: € 20/hr, 10 hours overtime at 150%, without vacation pay
  const res1 = calculateOveruren(20, 10, 150, false);
  assert.strictEqual(res1.hourlyWage, 20);
  assert.strictEqual(res1.overtimeHours, 10);
  assert.strictEqual(res1.effectiveHourlyRate, 30);
  assert.strictEqual(res1.basePay, 200);
  assert.strictEqual(res1.surchargePay, 100);
  assert.strictEqual(res1.totalGrossPay, 300);
  assert.strictEqual(res1.includeVacationPay, false);
  assert.strictEqual(res1.vacationPayAmount, 0);
  assert.strictEqual(res1.totalGrossWithVacationPay, 300);
  assert.strictEqual(res1.timeForTimeHours, 15);
  assert.strictEqual(res1.estimatedNetIndicative, 151.5);

  // Test 2: € 20/hr, 10 hours overtime at 125%, with 8% vacation pay
  const res2 = calculateOveruren(20, 10, 125, true);
  assert.strictEqual(res2.effectiveHourlyRate, 25);
  assert.strictEqual(res2.basePay, 200);
  assert.strictEqual(res2.surchargePay, 50);
  assert.strictEqual(res2.totalGrossPay, 250);
  assert.strictEqual(res2.includeVacationPay, true);
  assert.strictEqual(res2.vacationPayAmount, 20);
  assert.strictEqual(res2.totalGrossWithVacationPay, 270);
  assert.strictEqual(res2.timeForTimeHours, 12.5);

  // Test 3: 100% (geen toeslag), € 18/hr, 5 hours, with vacation pay
  const res3 = calculateOveruren(18, 5, 100, true);
  assert.strictEqual(res3.effectiveHourlyRate, 18);
  assert.strictEqual(res3.basePay, 90);
  assert.strictEqual(res3.surchargePay, 0);
  assert.strictEqual(res3.totalGrossPay, 90);
  assert.strictEqual(res3.vacationPayAmount, 7.2);
  assert.strictEqual(res3.totalGrossWithVacationPay, 97.2);

  // Test 4: Decimal hours & custom 130%: € 22.80/hr, 7.5 hours, with vacation pay
  const res4 = calculateOveruren(22.80, 7.5, 130, true);
  assert.strictEqual(res4.effectiveHourlyRate, 29.64);
  assert.strictEqual(res4.basePay, 171);
  assert.strictEqual(res4.surchargePay, 51.3);
  assert.strictEqual(res4.totalGrossPay, 222.3);
  assert.strictEqual(res4.vacationPayAmount, 17.78);
  assert.strictEqual(res4.totalGrossWithVacationPay, 240.08);

  // Test 5: 200% (Sunday/holiday): € 30/hr, 6 hours, with vacation pay
  const res5 = calculateOveruren(30, 6, 200, true);
  assert.strictEqual(res5.effectiveHourlyRate, 60);
  assert.strictEqual(res5.basePay, 180);
  assert.strictEqual(res5.surchargePay, 180);
  assert.strictEqual(res5.totalGrossPay, 360);
  assert.strictEqual(res5.vacationPayAmount, 28.8);
  assert.strictEqual(res5.totalGrossWithVacationPay, 388.8);

  console.log('✓ Overuren calculations passed');
}

// 7. Werkdagen
{
  // From 2026-04-20 (Mon) to 2026-04-30 (Thu): 11 calendar days
  // Includes 1 weekend (25, 26 April = 2 days)
  // Koningsdag 2026 is Monday April 27 (official Dutch holiday)
  const res = calculateWerkdagen('2026-04-20', '2026-04-30', true, 8);
  assert.strictEqual(res.totalCalendarDays, 11);
  assert.strictEqual(res.weekendDays, 2);
  assert.strictEqual(res.publicHolidaysCount, 1);
  assert.strictEqual(res.workingDays, 8);
  assert.strictEqual(res.workingHours, 64);
  console.log('✓ Werkdagen calculations passed');
}

// 8. Parttime salaris
{
  // Fulltime € 4000 at 40h -> 32h parttime (80%)
  const res = calculateParttimeSalaris(4000, 40, 32);
  assert.strictEqual(res.parttimePercentage, 80);
  assert.strictEqual(res.parttimeSalary, 3200);
  assert.strictEqual(res.differenceMonthly, 800);
  console.log('✓ Parttime salaris calculations passed');
}

// 9. Vakantiedagen
{
  // Fulltime standard: 5 days/week, 25 days FT, 12 months, 8 hrs/day
  const ft = calculateVakantiedagen(5, 25, 12, 8);
  assert.strictEqual(ft.statutoryDays, 20);
  assert.strictEqual(ft.nonStatutoryDays, 5);
  assert.strictEqual(ft.totalDays, 25);
  assert.strictEqual(ft.statutoryHours, 160);
  assert.strictEqual(ft.nonStatutoryHours, 40);
  assert.strictEqual(ft.totalHours, 200);
  assert.strictEqual(ft.totalWeeks, 5);
  assert.strictEqual(ft.parttimePercentage, 100);
  assert.strictEqual(ft.monthlyAccrualDays, 2.08);

  // Parttime: 4 days/week (80%)
  const pt4 = calculateVakantiedagen(4, 25, 12, 8);
  assert.strictEqual(pt4.statutoryDays, 16);
  assert.strictEqual(pt4.nonStatutoryDays, 4);
  assert.strictEqual(pt4.totalDays, 20);
  assert.strictEqual(pt4.statutoryHours, 128);
  assert.strictEqual(pt4.nonStatutoryHours, 32);
  assert.strictEqual(pt4.totalHours, 160);
  assert.strictEqual(pt4.totalWeeks, 5);
  assert.strictEqual(pt4.parttimePercentage, 80);
  assert.strictEqual(pt4.monthlyAccrualDays, 1.67);

  // Parttime: 3 days/week (60%)
  const pt3 = calculateVakantiedagen(3, 25, 12, 8);
  assert.strictEqual(pt3.statutoryDays, 12);
  assert.strictEqual(pt3.nonStatutoryDays, 3);
  assert.strictEqual(pt3.totalDays, 15);
  assert.strictEqual(pt3.totalWeeks, 5);
  assert.strictEqual(pt3.parttimePercentage, 60);

  // Partial year: started July 1st (6 months)
  const halfYear = calculateVakantiedagen(5, 25, 6, 8);
  assert.strictEqual(halfYear.statutoryDays, 10);
  assert.strictEqual(halfYear.nonStatutoryDays, 2.5);
  assert.strictEqual(halfYear.totalDays, 12.5);
  assert.strictEqual(halfYear.totalHours, 100);
  assert.strictEqual(halfYear.monthlyAccrualDays, 2.08);

  // CAO with 30 days fulltime, 4 days/week
  const cao30 = calculateVakantiedagen(4, 30, 12, 8);
  assert.strictEqual(cao30.statutoryDays, 16);
  assert.strictEqual(cao30.nonStatutoryDays, 8);
  assert.strictEqual(cao30.totalDays, 24);
  assert.strictEqual(cao30.totalWeeks, 6);

  // Edge case: 1 day/week, 20 days minimum
  const pt1 = calculateVakantiedagen(1, 20, 12, 8);
  assert.strictEqual(pt1.statutoryDays, 4);
  assert.strictEqual(pt1.nonStatutoryDays, 0);
  assert.strictEqual(pt1.totalDays, 4);
  assert.strictEqual(pt1.totalWeeks, 4);
  assert.strictEqual(pt1.parttimePercentage, 20);

  // Decimal days: 4.5 days/week
  const dec = calculateVakantiedagen(4.5, 25, 12, 8);
  assert.strictEqual(dec.statutoryDays, 18);
  assert.strictEqual(dec.nonStatutoryDays, 4.5);
  assert.strictEqual(dec.totalDays, 22.5);
  assert.strictEqual(dec.totalWeeks, 5);
  assert.strictEqual(dec.parttimePercentage, 90);

  console.log('✓ Vakantiedagen calculations passed');
}

// 10. Salarisverhoging
{
  // Example 1: Monthly salary € 3.500 with 4% raise
  const res1 = calculateSalarisverhoging(3500, 'monthly', 4.0);
  assert.strictEqual(res1.currentSalary, 3500);
  assert.strictEqual(res1.increaseAmountMonthly, 140);
  assert.strictEqual(res1.newSalaryMonthly, 3640);
  assert.strictEqual(res1.increaseAmountAnnual, 1680);
  assert.strictEqual(res1.increaseAmountAnnualWithVacation, 1814.4);
  assert.strictEqual(res1.newSalaryAnnual, 43680);
  assert.strictEqual(res1.newSalaryAnnualWithVacation, 47174.4);
  assert.strictEqual(res1.hourlyIncreaseEstimate, 0.81);

  // Example 2: Annual salary € 48.000 with 5% raise
  const res2 = calculateSalarisverhoging(48000, 'annual', 5.0);
  assert.strictEqual(res2.currentSalary, 48000);
  assert.strictEqual(res2.increaseAmountAnnual, 2400);
  assert.strictEqual(res2.newSalaryAnnual, 50400);
  assert.strictEqual(res2.increaseAmountMonthly, 200);
  assert.strictEqual(res2.newSalaryMonthly, 4200);
  assert.strictEqual(res2.increaseAmountAnnualWithVacation, 2592);
  assert.strictEqual(res2.newSalaryAnnualWithVacation, 54432);
  assert.strictEqual(res2.hourlyIncreaseEstimate, 1.15);

  // Example 3: Decimal percentage (3.25%) on € 2.800
  const res3 = calculateSalarisverhoging(2800, 'monthly', 3.25);
  assert.strictEqual(res3.increaseAmountMonthly, 91);
  assert.strictEqual(res3.newSalaryMonthly, 2891);
  assert.strictEqual(res3.increaseAmountAnnual, 1092);
  assert.strictEqual(res3.increaseAmountAnnualWithVacation, 1179.36);

  // Example 4: Edge case: 0% raise
  const res4 = calculateSalarisverhoging(3000, 'monthly', 0);
  assert.strictEqual(res4.increaseAmountMonthly, 0);
  assert.strictEqual(res4.newSalaryMonthly, 3000);

  console.log('✓ Salarisverhoging calculations passed');
}

// 12. Uurloon naar Maandloon
{
  // Fulltime 40 uur @ € 20,00/uur
  const res1 = calculateUurloonNaarMaandloon(20, 40);
  assert.strictEqual(res1.hourlyWage, 20);
  assert.strictEqual(res1.weeklyHours, 40);
  assert.strictEqual(res1.weeklySalary, 800);
  assert.strictEqual(res1.fourWeeklySalary, 3200);
  assert.strictEqual(res1.monthlyHours, 173.33);
  assert.strictEqual(res1.monthlySalary, 3466.67);
  assert.strictEqual(res1.monthlyVacationPay, 277.33);
  assert.strictEqual(res1.monthlyTotalWithVacation, 3744);
  assert.strictEqual(res1.annualSalary, 41600);
  assert.strictEqual(res1.annualVacationPay, 3328);
  assert.strictEqual(res1.annualSalaryWithVacation, 44928);
  assert.strictEqual(res1.dailyWage, 160);

  // Fulltime 36 uur @ € 22,50/uur
  const res2 = calculateUurloonNaarMaandloon(22.50, 36);
  assert.strictEqual(res2.weeklySalary, 810);
  assert.strictEqual(res2.monthlyHours, 156);
  assert.strictEqual(res2.monthlySalary, 3510);
  assert.strictEqual(res2.annualSalary, 42120);
  assert.strictEqual(res2.annualVacationPay, 3369.60);
  assert.strictEqual(res2.annualSalaryWithVacation, 45489.60);

  // Parttime 32 uur @ € 18,75/uur
  const res3 = calculateUurloonNaarMaandloon(18.75, 32);
  assert.strictEqual(res3.weeklySalary, 600);
  assert.strictEqual(res3.fourWeeklySalary, 2400);
  assert.strictEqual(res3.monthlyHours, 138.67);
  assert.strictEqual(res3.monthlySalary, 2600);
  assert.strictEqual(res3.annualSalary, 31200);
  assert.strictEqual(res3.annualSalaryWithVacation, 33696);

  // Parttime 24 uur @ € 16,50/uur
  const res4 = calculateUurloonNaarMaandloon(16.50, 24);
  assert.strictEqual(res4.weeklySalary, 396);
  assert.strictEqual(res4.monthlyHours, 104);
  assert.strictEqual(res4.monthlySalary, 1716);
  assert.strictEqual(res4.annualSalary, 20592);
  assert.strictEqual(res4.annualSalaryWithVacation, 22239.36);

  // Edge cases: 0 salary / 0 hours
  const zero = calculateUurloonNaarMaandloon(0, 40);
  assert.strictEqual(zero.monthlySalary, 0);
  assert.strictEqual(zero.annualSalary, 0);

  console.log('✓ Uurloon naar Maandloon calculations passed');
}

// 13. Maandloon naar Uurloon
{
  // Fulltime 40 uur @ € 3.500 maandsalaris
  const res1 = calculateMaandloonNaarUurloon(3500, 40);
  assert.strictEqual(res1.monthlySalary, 3500);
  assert.strictEqual(res1.weeklyHours, 40);
  assert.strictEqual(res1.monthlyHours, 173.33);
  assert.strictEqual(res1.hourlyWage, 20.19);
  assert.strictEqual(res1.weeklySalary, 807.69);
  assert.strictEqual(res1.fourWeeklySalary, 3230.77);
  assert.strictEqual(res1.annualSalary, 42000);
  assert.strictEqual(res1.annualSalaryWithVacation, 45360);
  assert.strictEqual(res1.dailyWage, 161.54);

  // Fulltime 36 uur @ € 3.500 maandsalaris
  const res2 = calculateMaandloonNaarUurloon(3500, 36);
  assert.strictEqual(res2.monthlyHours, 156);
  assert.strictEqual(res2.hourlyWage, 22.44);
  assert.strictEqual(res2.weeklySalary, 807.69);
  assert.strictEqual(res2.annualSalary, 42000);

  // Parttime 32 uur @ € 2.800 maandsalaris
  const res3 = calculateMaandloonNaarUurloon(2800, 32);
  assert.strictEqual(res3.monthlyHours, 138.67);
  assert.strictEqual(res3.hourlyWage, 20.19);
  assert.strictEqual(res3.weeklySalary, 646.15);
  assert.strictEqual(res3.annualSalary, 33600);

  // Parttime 24 uur @ € 2.000 maandsalaris
  const res4 = calculateMaandloonNaarUurloon(2000, 24);
  assert.strictEqual(res4.monthlyHours, 104);
  assert.strictEqual(res4.hourlyWage, 19.23);
  assert.strictEqual(res4.weeklySalary, 461.54);
  assert.strictEqual(res4.annualSalary, 24000);

  // Edge case: 0 salary
  const zero = calculateMaandloonNaarUurloon(0, 40);
  assert.strictEqual(zero.hourlyWage, 0);
  assert.strictEqual(zero.annualSalary, 0);

  console.log('✓ Maandloon naar Uurloon calculations passed');
}

// 14. Werkuren per Jaar
{
  // Fulltime 40 uur, 25 vakantiedagen, 7 feestdagen, 0 ADV
  const res1 = calculateWerkurenPerJaar(40, 25, 7, 0);
  assert.strictEqual(res1.weeklyHours, 40);
  assert.strictEqual(res1.dailyHours, 8);
  assert.strictEqual(res1.contractualAnnualHours, 2080);
  assert.strictEqual(res1.contractualMonthlyHours, 173.33);
  assert.strictEqual(res1.contractualAnnualDays, 260);
  assert.strictEqual(res1.vacationHours, 200);
  assert.strictEqual(res1.holidayHours, 56);
  assert.strictEqual(res1.totalLeaveHours, 256);
  assert.strictEqual(res1.actualAnnualHours, 1824);
  assert.strictEqual(res1.actualMonthlyHours, 152);
  assert.strictEqual(res1.actualAnnualWeeks, 45.6);
  assert.strictEqual(res1.actualAnnualDays, 228);

  // Fulltime 36 uur, 25 vakantiedagen, 7 feestdagen, 0 ADV
  const res2 = calculateWerkurenPerJaar(36, 25, 7, 0);
  assert.strictEqual(res2.dailyHours, 7.2);
  assert.strictEqual(res2.contractualAnnualHours, 1872);
  assert.strictEqual(res2.contractualMonthlyHours, 156);
  assert.strictEqual(res2.vacationHours, 180);
  assert.strictEqual(res2.holidayHours, 50.4);
  assert.strictEqual(res2.actualAnnualHours, 1641.6);
  assert.strictEqual(res2.actualAnnualWeeks, 45.6);

  // Parttime 32 uur, 20 vakantiedagen, 6 feestdagen, 0 ADV
  const res3 = calculateWerkurenPerJaar(32, 20, 6, 0);
  assert.strictEqual(res3.dailyHours, 6.4);
  assert.strictEqual(res3.contractualAnnualHours, 1664);
  assert.strictEqual(res3.contractualMonthlyHours, 138.67);
  assert.strictEqual(res3.vacationHours, 128);
  assert.strictEqual(res3.holidayHours, 38.4);
  assert.strictEqual(res3.actualAnnualHours, 1497.6);

  // 40 uur met 13 ADV-dagen (metaal/techniek)
  const res4 = calculateWerkurenPerJaar(40, 25, 7, 13);
  assert.strictEqual(res4.advHours, 104);
  assert.strictEqual(res4.totalLeaveHours, 360);
  assert.strictEqual(res4.actualAnnualHours, 1720);

  // Edge case: 0 uren
  const zero = calculateWerkurenPerJaar(0, 25, 7, 0);
  assert.strictEqual(zero.contractualAnnualHours, 0);
  assert.strictEqual(zero.actualAnnualHours, 0);

  console.log('✓ Werkuren per Jaar calculations passed');
}

// 15. Woon-werk kosten
{
  // 25 km enkele reis, 4 reisdagen/week, 6.5 l/100km, € 2.05/liter, € 0 extra
  const res1 = calculateWoonWerkKosten(25, 4, 6.5, 2.05, 0);
  assert.strictEqual(res1.oneWayKm, 25);
  assert.strictEqual(res1.returnKmDaily, 50);
  assert.strictEqual(res1.travelDaysPerWeek, 4);
  assert.strictEqual(res1.annualTravelDays, 171.2);
  assert.strictEqual(res1.annualCommuteKm, 8560);
  assert.strictEqual(res1.fuelCostPerKm, 0.13);
  assert.strictEqual(res1.costPerOneWay, 3.33);
  assert.strictEqual(res1.fuelCostDaily, 6.66);
  assert.strictEqual(res1.totalCostDaily, 6.66);
  assert.strictEqual(res1.weeklyTotalCost, 26.65);
  assert.strictEqual(res1.annualTotalCost, 1140.62);
  assert.strictEqual(res1.monthlyTotalCost, 95.05);
  assert.strictEqual(res1.taxFreeAllowanceAnnual, 1968.8);
  assert.strictEqual(res1.taxFreeAllowanceMonthly, 164.07);
  assert.strictEqual(res1.totalCarCostEstimateAnnual, 3852);

  // 40 km enkele reis, 5 reisdagen/week, 5.0 l/100km, € 1.95/liter, € 3.00 parkeren
  const res2 = calculateWoonWerkKosten(40, 5, 5.0, 1.95, 3.0);
  assert.strictEqual(res2.returnKmDaily, 80);
  assert.strictEqual(res2.annualTravelDays, 214);
  assert.strictEqual(res2.annualCommuteKm, 17120);
  assert.strictEqual(res2.fuelCostDaily, 7.8);
  assert.strictEqual(res2.totalCostDaily, 10.8);
  assert.strictEqual(res2.weeklyTotalCost, 54.0);
  assert.strictEqual(res2.annualTotalCost, 2311.2);
  assert.strictEqual(res2.monthlyTotalCost, 192.6);

  // Edge case: 0 km
  const zero = calculateWoonWerkKosten(0, 5, 6.5, 2.05, 0);
  assert.strictEqual(zero.annualTotalCost, 0);
  assert.strictEqual(zero.monthlyTotalCost, 0);

  console.log('✓ Woon-werk kosten calculations passed');
}

// 16. Kilometervergoeding
{
  // Example 1: Full-time 25 km single-trip (50 km return), 5 days/week, € 0.23
  const res1 = calculateKilometervergoeding({
    distanceKm: 25,
    isReturnTrip: false,
    travelDaysPerWeek: 5,
    ratePerKm: 0.23
  });
  assert.strictEqual(res1.singleKm, 25);
  assert.strictEqual(res1.dailyKm, 50);
  assert.strictEqual(res1.weeklyKm, 250);
  assert.strictEqual(res1.annualTravelDays, 214);
  assert.strictEqual(res1.annualKm, 10700);
  assert.strictEqual(res1.singleAllowance, 5.75);
  assert.strictEqual(res1.dailyAllowance, 11.50);
  assert.strictEqual(res1.weeklyAllowance, 57.50);
  assert.strictEqual(res1.annualAllowance, 2461.00);
  assert.strictEqual(res1.monthlyAllowance, 205.08);
  assert.strictEqual(res1.isAboveOfficialRate, false);
  assert.strictEqual(res1.untaxedPortionMonthly, 205.08);
  assert.strictEqual(res1.taxablePortionMonthly, 0);

  // Example 2: Part-time 32.5 km single-trip, 3 days/week, € 0.23
  const res2 = calculateKilometervergoeding({
    distanceKm: 32.5,
    isReturnTrip: false,
    travelDaysPerWeek: 3,
    ratePerKm: 0.23
  });
  assert.strictEqual(res2.singleKm, 32.5);
  assert.strictEqual(res2.dailyKm, 65);
  assert.strictEqual(res2.weeklyKm, 195);
  assert.strictEqual(res2.annualTravelDays, 128.4);
  assert.strictEqual(res2.annualKm, 8346);
  assert.strictEqual(res2.singleAllowance, 7.48);
  assert.strictEqual(res2.dailyAllowance, 14.95);
  assert.strictEqual(res2.weeklyAllowance, 44.85);
  assert.strictEqual(res2.annualAllowance, 1919.58);
  assert.strictEqual(res2.monthlyAllowance, 159.97);

  // Example 3: Return trip toggle (60 km return entered directly, 4 days/week)
  const res3 = calculateKilometervergoeding({
    distanceKm: 60,
    isReturnTrip: true,
    travelDaysPerWeek: 4,
    ratePerKm: 0.23
  });
  assert.strictEqual(res3.singleKm, 30);
  assert.strictEqual(res3.dailyKm, 60);
  assert.strictEqual(res3.weeklyKm, 240);
  assert.strictEqual(res3.annualTravelDays, 171.2);
  assert.strictEqual(res3.annualKm, 10272);
  assert.strictEqual(res3.singleAllowance, 6.90);
  assert.strictEqual(res3.dailyAllowance, 13.80);
  assert.strictEqual(res3.weeklyAllowance, 55.20);
  assert.strictEqual(res3.annualAllowance, 2362.56);
  assert.strictEqual(res3.monthlyAllowance, 196.88);

  // Example 4: CAO rate above official rate: € 0.29 per km (40 km return, 4 days/week)
  const res4 = calculateKilometervergoeding({
    distanceKm: 20,
    isReturnTrip: false,
    travelDaysPerWeek: 4,
    ratePerKm: 0.29
  });
  assert.strictEqual(res4.isAboveOfficialRate, true);
  assert.strictEqual(res4.taxableRateDiff, 0.06);
  assert.strictEqual(res4.dailyAllowance, 11.60);
  assert.strictEqual(res4.annualAllowance, 1985.92);
  assert.strictEqual(res4.monthlyAllowance, 165.49);
  assert.strictEqual(res4.untaxedPortionMonthly, 131.25);
  assert.strictEqual(res4.taxablePortionMonthly, 34.24);

  // Example 5: Zero km edge case
  const resZero = calculateKilometervergoeding({
    distanceKm: 0,
    isReturnTrip: false,
    travelDaysPerWeek: 5,
    ratePerKm: 0.23
  });
  assert.strictEqual(resZero.singleAllowance, 0);
  assert.strictEqual(resZero.dailyAllowance, 0);
  assert.strictEqual(resZero.monthlyAllowance, 0);
  assert.strictEqual(resZero.annualAllowance, 0);

  console.log('✓ Kilometervergoeding calculations passed');
}

// 17. Weekloon
{
  // Example 1: from_hourly, 40 hours @ € 20.00
  const res1 = calculateWeekloon({
    calculationMode: 'from_hourly',
    hourlyWage: 20.00,
    weeklyHours: 40
  });
  assert.strictEqual(res1.weeklySalary, 800.00);
  assert.strictEqual(res1.hourlyWage, 20.00);
  assert.strictEqual(res1.fourWeeklySalary, 3200.00);
  assert.strictEqual(res1.monthlySalary, 3466.67);
  assert.strictEqual(res1.annualSalary, 41600.00);
  assert.strictEqual(res1.annualSalaryWithVacation, 44928.00);

  // Example 2: from_hourly, 32 hours part-time @ € 18.50
  const res2 = calculateWeekloon({
    calculationMode: 'from_hourly',
    hourlyWage: 18.50,
    weeklyHours: 32
  });
  assert.strictEqual(res2.weeklySalary, 592.00);
  assert.strictEqual(res2.hourlyWage, 18.50);
  assert.strictEqual(res2.fourWeeklySalary, 2368.00);
  assert.strictEqual(res2.monthlySalary, 2565.33);
  assert.strictEqual(res2.annualSalary, 30784.00);
  assert.strictEqual(res2.annualSalaryWithVacation, 33246.72);

  // Example 3: from_monthly, € 3.500 @ 36 hours
  const res3 = calculateWeekloon({
    calculationMode: 'from_monthly',
    monthlySalary: 3500.00,
    weeklyHours: 36
  });
  assert.strictEqual(res3.weeklySalary, 807.69);
  assert.strictEqual(res3.hourlyWage, 22.44);
  assert.strictEqual(res3.fourWeeklySalary, 3230.77);
  assert.strictEqual(res3.monthlySalary, 3500.00);
  assert.strictEqual(res3.annualSalary, 42000.00);
  assert.strictEqual(res3.annualSalaryWithVacation, 45360.00);

  // Example 4: from_monthly, € 2.000 @ 24 hours part-time
  const res4 = calculateWeekloon({
    calculationMode: 'from_monthly',
    monthlySalary: 2000.00,
    weeklyHours: 24
  });
  assert.strictEqual(res4.weeklySalary, 461.54);
  assert.strictEqual(res4.hourlyWage, 19.23);
  assert.strictEqual(res4.fourWeeklySalary, 1846.15);
  assert.strictEqual(res4.monthlySalary, 2000.00);
  assert.strictEqual(res4.annualSalary, 24000.00);
  assert.strictEqual(res4.annualSalaryWithVacation, 25920.00);

  // Example 5: Zero wage edge case
  const resZero = calculateWeekloon({
    calculationMode: 'from_hourly',
    hourlyWage: 0,
    weeklyHours: 40
  });
  assert.strictEqual(resZero.weeklySalary, 0);
  assert.strictEqual(resZero.monthlySalary, 0);
  assert.strictEqual(resZero.annualSalary, 0);

  console.log('✓ Weekloon calculations passed');
}

// 17. FTE Berekenen
{
  // 40 / 40 = 1,00 FTE (100%)
  const res1 = calculateFte(40, 40);
  assert.strictEqual(res1.fte, 1.0);
  assert.strictEqual(res1.ftePercentage, 100);
  assert.strictEqual(res1.isFulltime, true);

  // 36 / 36 = 1,00 FTE (100%)
  const res2 = calculateFte(36, 36);
  assert.strictEqual(res2.fte, 1.0);
  assert.strictEqual(res2.ftePercentage, 100);
  assert.strictEqual(res2.isFulltime, true);

  // 32 / 40 = 0,80 FTE (80%)
  const res3 = calculateFte(32, 40);
  assert.strictEqual(res3.fte, 0.8);
  assert.strictEqual(res3.ftePercentage, 80);
  assert.strictEqual(res3.isFulltime, false);

  // 24 / 40 = 0,60 FTE (60%)
  const res4 = calculateFte(24, 40);
  assert.strictEqual(res4.fte, 0.6);
  assert.strictEqual(res4.ftePercentage, 60);

  // 28 / 36 = 0,7778 FTE (77.78%)
  const res5 = calculateFte(28, 36);
  assert.strictEqual(res5.fte, 0.78);
  assert.strictEqual(res5.fte4Decimals, 0.7778);
  assert.strictEqual(res5.ftePercentage, 77.78);

  // 20 / 38 = 0,5263 FTE (52.63%)
  const res6 = calculateFte(20, 38);
  assert.strictEqual(res6.fte, 0.53);
  assert.strictEqual(res6.fte4Decimals, 0.5263);
  assert.strictEqual(res6.ftePercentage, 52.63);

  // Decimals: 37.5 / 40 = 0.9375 FTE (93.75%)
  const res7 = calculateFte(37.5, 40);
  assert.strictEqual(res7.fte, 0.94);
  assert.strictEqual(res7.fte4Decimals, 0.9375);
  assert.strictEqual(res7.ftePercentage, 93.75);

  // Reverse: 0.80 FTE * 40 = 32 hours
  const rev1 = calculateFteToHours(0.8, 40);
  assert.strictEqual(rev1.calculatedHours, 32);
  assert.strictEqual(rev1.ftePercentage, 80);

  // Reverse: 0.50 FTE * 36 = 18 hours
  const rev2 = calculateFteToHours(0.5, 36);
  assert.strictEqual(rev2.calculatedHours, 18);
  assert.strictEqual(rev2.ftePercentage, 50);

  console.log('✓ FTE calculations passed');
}

// 18. Werkgeverslasten Berekenen (2026)
{
  // Test 1: Monthly salary € 3.500 (Annual € 42.000), AWf low, Aof low, Whk 1.22%
  const res1 = calculateWerkgeverslasten({
    period: 'month',
    salary: 3500,
    awfType: 'low',
    aofType: 'low',
    whkPercentage: 1.22,
    includeVacationPay: false
  });
  assert.strictEqual(res1.annualGrossSalary, 42000);
  assert.strictEqual(res1.isCapped, false);
  assert.strictEqual(res1.awfAmountAnnual, 1150.80);
  assert.strictEqual(res1.aofAmountAnnual, 2633.40);
  assert.strictEqual(res1.wkoAmountAnnual, 210.00);
  assert.strictEqual(res1.whkAmountAnnual, 512.40);
  assert.strictEqual(res1.zvwAmountAnnual, 2759.40);
  assert.strictEqual(res1.totalStatutoryContributionsAnnual, 7266.00);
  assert.strictEqual(res1.totalEmployerCostAnnual, 49266.00);
  assert.strictEqual(res1.effectiveMarkupPercentage, 17.30);

  // Test 2: Salary above 2026 wage ceiling (€ 100.000), AWf high, Aof high, Whk 1.50%
  const res2 = calculateWerkgeverslasten({
    period: 'year',
    salary: 100000,
    awfType: 'high',
    aofType: 'high',
    whkPercentage: 1.50,
    includeVacationPay: false
  });
  assert.strictEqual(res2.isCapped, true);
  assert.strictEqual(res2.cappedWageBaseAnnual, 79409);
  assert.strictEqual(res2.awfAmountAnnual, 6146.26);
  assert.strictEqual(res2.aofAmountAnnual, 6058.91);
  assert.strictEqual(res2.wkoAmountAnnual, 397.05);
  assert.strictEqual(res2.whkAmountAnnual, 1191.14);
  assert.strictEqual(res2.zvwAmountAnnual, 5217.17);
  assert.strictEqual(res2.totalStatutoryContributionsAnnual, 19010.53);
  assert.strictEqual(res2.totalEmployerCostAnnual, 119010.53);
  assert.strictEqual(res2.effectiveMarkupPercentage, 19.01);

  // Test 3: Monthly salary € 3.000 with 8% vacation pay toggle
  const res3 = calculateWerkgeverslasten({
    period: 'month',
    salary: 3000,
    awfType: 'low',
    aofType: 'low',
    whkPercentage: 1.22,
    includeVacationPay: true
  });
  assert.strictEqual(res3.vacationPayAmount, 2880);
  assert.strictEqual(res3.annualGrossSalary, 38880);
  assert.strictEqual(res3.isCapped, false);

  // Test 4: Quick employer cost estimation
  const quick = calculateQuickEmployerCost(3500, 23);
  assert.strictEqual(quick.estimatedContributionsMonthly, 805);
  assert.strictEqual(quick.estimatedTotalCostMonthly, 4305);
  assert.strictEqual(quick.estimatedTotalCostAnnual, 51660);

  console.log('✓ Werkgeverslasten calculations passed');
}

// 19. 13e Maand Berekenen
{
  // Test 1: € 2.500 monthly salary, 100%, full year
  const res1 = calculateDertiendeMaand({
    monthlySalary: 2500,
    percentage: 100,
    periodMode: 'full_year'
  });
  assert.strictEqual(res1.monthlySalary, 2500);
  assert.strictEqual(res1.percentage, 100);
  assert.strictEqual(res1.workedMonths, 12);
  assert.strictEqual(res1.fullYearAmount, 2500);
  assert.strictEqual(res1.estimatedGross13thMonth, 2500);
  assert.strictEqual(res1.monthlyAccrual, 208.33);
  assert.strictEqual(res1.annualSalaryWithout13th, 30000);
  assert.strictEqual(res1.annualSalaryWith13th, 32500);
  assert.strictEqual(res1.isPartialYear, false);

  // Test 2: € 3.500 monthly salary, 100%, full year
  const res2 = calculateDertiendeMaand({
    monthlySalary: 3500,
    percentage: 100,
    periodMode: 'full_year'
  });
  assert.strictEqual(res2.estimatedGross13thMonth, 3500);
  assert.strictEqual(res2.monthlyAccrual, 291.67);

  // Test 3: € 3.000 monthly salary, 75%, full year
  const res3 = calculateDertiendeMaand({
    monthlySalary: 3000,
    percentage: 75,
    periodMode: 'full_year'
  });
  assert.strictEqual(res3.fullYearAmount, 2250);
  assert.strictEqual(res3.estimatedGross13thMonth, 2250);
  assert.strictEqual(res3.monthlyAccrual, 187.50);

  // Test 4: € 3.000 monthly salary, 100%, 6 months partial year
  const res4 = calculateDertiendeMaand({
    monthlySalary: 3000,
    percentage: 100,
    periodMode: 'partial_year',
    workedMonths: 6
  });
  assert.strictEqual(res4.workedMonths, 6);
  assert.strictEqual(res4.fullYearAmount, 3000);
  assert.strictEqual(res4.estimatedGross13thMonth, 1500);
  assert.strictEqual(res4.monthlyAccrual, 250);
  assert.strictEqual(res4.annualSalaryWith13th, 37500);
  assert.strictEqual(res4.isPartialYear, true);

  // Test 5: € 3.000 monthly salary, 50%
  const res5 = calculateDertiendeMaand({
    monthlySalary: 3000,
    percentage: 50,
    periodMode: 'full_year'
  });
  assert.strictEqual(res5.estimatedGross13thMonth, 1500);

  // Test 6: € 3.000 monthly salary, 125%
  const res6 = calculateDertiendeMaand({
    monthlySalary: 3000,
    percentage: 125,
    periodMode: 'full_year'
  });
  assert.strictEqual(res6.estimatedGross13thMonth, 375000 / 100);

  // Test 7: Decimal values: € 3.456,78, 100%, 8 months
  const res7 = calculateDertiendeMaand({
    monthlySalary: 3456.78,
    percentage: 100,
    periodMode: 'partial_year',
    workedMonths: 8
  });
  // 3456.78 * (8/12) = 2304.52
  assert.strictEqual(res7.estimatedGross13thMonth, 2304.52);

  // Test 8: 1 month partial year
  const res8 = calculateDertiendeMaand({
    monthlySalary: 3000,
    percentage: 100,
    periodMode: 'partial_year',
    workedMonths: 1
  });
  assert.strictEqual(res8.estimatedGross13thMonth, 250);

  // Test 9: 12 months in partial_year mode
  const res9 = calculateDertiendeMaand({
    monthlySalary: 3000,
    percentage: 100,
    periodMode: 'partial_year',
    workedMonths: 12
  });
  assert.strictEqual(res9.estimatedGross13thMonth, 3000);
  assert.strictEqual(res9.isPartialYear, false);

  // Test 10: 0 salary
  const resZero = calculateDertiendeMaand({ monthlySalary: 0 });
  assert.strictEqual(resZero.estimatedGross13thMonth, 0);

  console.log('✓ 13e Maand calculations passed');
}

// 20. Opzegtermijn Berekenen
{
  // Test 1: Werknemer + Vast contract (20 september 2026 -> 1 maand -> 31 oktober 2026)
  const res1 = calculateOpzegtermijn({
    initiator: 'werknemer',
    contractType: 'vast',
    noticeDate: '2026-09-20'
  });
  assert.strictEqual(res1.noticePeriodMonths, 1);
  assert.strictEqual(res1.startOfNoticeDate, '2026-10-01');
  assert.strictEqual(res1.expectedEndDate, '2026-10-31');
  assert.strictEqual(res1.isTemporaryContract, false);

  // Test 2: Werknemer op laatste dag van de maand (30 september 2026 -> 1 maand -> 31 oktober 2026)
  const res2 = calculateOpzegtermijn({
    initiator: 'werknemer',
    contractType: 'vast',
    noticeDate: '2026-09-30'
  });
  assert.strictEqual(res2.noticePeriodMonths, 1);
  assert.strictEqual(res2.startOfNoticeDate, '2026-10-01');
  assert.strictEqual(res2.expectedEndDate, '2026-10-31');

  // Test 3: Werknemer op 1e dag van de maand (1 oktober 2026 -> 1 maand -> 30 november 2026)
  const res3 = calculateOpzegtermijn({
    initiator: 'werknemer',
    contractType: 'vast',
    noticeDate: '2026-10-01'
  });
  assert.strictEqual(res3.noticePeriodMonths, 1);
  assert.strictEqual(res3.startOfNoticeDate, '2026-11-01');
  assert.strictEqual(res3.expectedEndDate, '2026-11-30');

  // Test 4: Werknemer in januari (niet-schrikkeljaar 2026: 15 januari -> eindigt 28 februari 2026)
  const res4 = calculateOpzegtermijn({
    initiator: 'werknemer',
    contractType: 'vast',
    noticeDate: '2026-01-15'
  });
  assert.strictEqual(res4.expectedEndDate, '2026-02-28');

  // Test 5: Werknemer in januari schrikkeljaar (2028: 15 januari -> eindigt 29 februari 2028)
  const res5 = calculateOpzegtermijn({
    initiator: 'werknemer',
    contractType: 'vast',
    noticeDate: '2028-01-15'
  });
  assert.strictEqual(res5.expectedEndDate, '2028-02-29');

  // Test 6: Werknemer in december (jaarwisseling: 15 december 2026 -> 31 januari 2027)
  const res6 = calculateOpzegtermijn({
    initiator: 'werknemer',
    contractType: 'vast',
    noticeDate: '2026-12-15'
  });
  assert.strictEqual(res6.startOfNoticeDate, '2027-01-01');
  assert.strictEqual(res6.expectedEndDate, '2027-01-31');

  // Test 7: Werkgever < 5 dienstjaren (3 jaar -> 1 maand)
  const res7 = calculateOpzegtermijn({
    initiator: 'werkgever',
    contractType: 'vast',
    noticeDate: '2026-09-20',
    startDate: '2023-01-01'
  });
  assert.strictEqual(res7.yearsOfService, 3);
  assert.strictEqual(res7.noticePeriodMonths, 1);
  assert.strictEqual(res7.expectedEndDate, '2026-10-31');

  // Test 8: Werkgever 5 tot < 10 dienstjaren (7 jaar -> 2 maanden -> 30 november 2026)
  const res8 = calculateOpzegtermijn({
    initiator: 'werkgever',
    contractType: 'vast',
    noticeDate: '2026-09-20',
    startDate: '2019-01-01'
  });
  assert.strictEqual(res8.yearsOfService, 7);
  assert.strictEqual(res8.noticePeriodMonths, 2);
  assert.strictEqual(res8.startOfNoticeDate, '2026-10-01');
  assert.strictEqual(res8.expectedEndDate, '2026-11-30');

  // Test 9: Werkgever 10 tot < 15 dienstjaren (12 jaar -> 3 maanden -> 31 december 2026)
  const res9 = calculateOpzegtermijn({
    initiator: 'werkgever',
    contractType: 'vast',
    noticeDate: '2026-09-20',
    startDate: '2014-01-01'
  });
  assert.strictEqual(res9.yearsOfService, 12);
  assert.strictEqual(res9.noticePeriodMonths, 3);
  assert.strictEqual(res9.expectedEndDate, '2026-12-31');

  // Test 10: Werkgever >= 15 dienstjaren (18 jaar -> 4 maanden -> 31 januari 2027)
  const res10 = calculateOpzegtermijn({
    initiator: 'werkgever',
    contractType: 'vast',
    noticeDate: '2026-09-20',
    startDate: '2008-01-01'
  });
  assert.strictEqual(res10.yearsOfService, 18);
  assert.strictEqual(res10.noticePeriodMonths, 4);
  assert.strictEqual(res10.expectedEndDate, '2027-01-31');

  // Test 11: Tijdelijk contract
  const res11 = calculateOpzegtermijn({
    initiator: 'werknemer',
    contractType: 'tijdelijk',
    noticeDate: '2026-09-20'
  });
  assert.strictEqual(res11.isTemporaryContract, true);
  assert(res11.explanation.includes('tussentijds opzegbeding'));

  console.log('✓ Opzegtermijn calculations passed');
}

// 21. Arbeidsverleden Berekenen
{
  // Test 1: Identical start and end dates
  const res1 = calculateArbeidsverleden({
    startDate: '2024-01-01',
    endDate: '2024-01-01'
  });
  assert.strictEqual(res1.isValid, true);
  assert.strictEqual(res1.years, 0);
  assert.strictEqual(res1.months, 0);
  assert.strictEqual(res1.days, 0);
  assert.strictEqual(res1.totalDays, 0);
  assert.strictEqual(res1.humanReadableDuration, '0 dagen');

  // Test 2: 1-day period
  const res2 = calculateArbeidsverleden({
    startDate: '2024-01-01',
    endDate: '2024-01-02'
  });
  assert.strictEqual(res2.days, 1);
  assert.strictEqual(res2.totalDays, 1);
  assert.strictEqual(res2.humanReadableDuration, '1 dag');

  // Test 3: 1-month period
  const res3 = calculateArbeidsverleden({
    startDate: '2024-01-01',
    endDate: '2024-02-01'
  });
  assert.strictEqual(res3.months, 1);
  assert.strictEqual(res3.days, 0);
  assert.strictEqual(res3.totalDays, 31);
  assert.strictEqual(res3.humanReadableDuration, '1 maand');

  // Test 4: 1-year period
  const res4 = calculateArbeidsverleden({
    startDate: '2023-01-01',
    endDate: '2024-01-01'
  });
  assert.strictEqual(res4.years, 1);
  assert.strictEqual(res4.months, 0);
  assert.strictEqual(res4.days, 0);
  assert.strictEqual(res4.totalDays, 365);
  assert.strictEqual(res4.humanReadableDuration, '1 jaar');

  // Test 5: Voorbeeld 1 (5 jaar exact: 1 januari 2020 -> 1 januari 2025)
  const res5 = calculateArbeidsverleden({
    startDate: '2020-01-01',
    endDate: '2025-01-01'
  });
  assert.strictEqual(res5.years, 5);
  assert.strictEqual(res5.months, 0);
  assert.strictEqual(res5.days, 0);
  // 2020 en 2024 zijn schrikkeljaren: 366 + 365 + 365 + 365 + 366 = 1827 dagen
  assert.strictEqual(res5.totalDays, 1827);
  assert.strictEqual(res5.humanReadableDuration, '5 jaar');

  // Test 6: Voorbeeld 2 (1 januari 2022 -> 15 maart 2026: 4 jaar, 2 maanden en 14 dagen)
  const res6 = calculateArbeidsverleden({
    startDate: '2022-01-01',
    endDate: '2026-03-15'
  });
  assert.strictEqual(res6.years, 4);
  assert.strictEqual(res6.months, 2);
  assert.strictEqual(res6.days, 14);
  assert.strictEqual(res6.totalDays, 1534);
  assert.strictEqual(res6.humanReadableDuration, '4 jaar, 2 maanden en 14 dagen');

  // Test 7: Voorbeeld 3 (Leap year: 29 februari 2020 -> 28 februari 2024)
  const res7 = calculateArbeidsverleden({
    startDate: '2020-02-29',
    endDate: '2024-02-28'
  });
  assert.strictEqual(res7.years, 3);
  assert.strictEqual(res7.months, 11);
  assert.strictEqual(res7.days, 30);
  assert.strictEqual(res7.humanReadableDuration, '3 jaar, 11 maanden en 30 dagen');

  // Test 8: Leap year exact 4 years (29 februari 2020 -> 29 februari 2024)
  const res8 = calculateArbeidsverleden({
    startDate: '2020-02-29',
    endDate: '2024-02-29'
  });
  assert.strictEqual(res8.years, 4);
  assert.strictEqual(res8.months, 0);
  assert.strictEqual(res8.days, 0);
  assert.strictEqual(res8.totalDays, 1461);
  assert.strictEqual(res8.humanReadableDuration, '4 jaar');

  // Test 9: End date before start date
  const res9 = calculateArbeidsverleden({
    startDate: '2025-01-01',
    endDate: '2020-01-01'
  });
  assert.strictEqual(res9.isValid, false);
  assert.strictEqual(res9.errorMessage, 'De einddatum kan niet vóór de startdatum liggen.');

  // Test 10: Year change (15 november 2025 -> 15 januari 2026 = 2 maanden)
  const res10 = calculateArbeidsverleden({
    startDate: '2025-11-15',
    endDate: '2026-01-15'
  });
  assert.strictEqual(res10.years, 0);
  assert.strictEqual(res10.months, 2);
  assert.strictEqual(res10.days, 0);
  assert.strictEqual(res10.humanReadableDuration, '2 maanden');

  console.log('✓ Arbeidsverleden calculations passed');
}

// 22. Wajong Uitkering Berekenen
{
  // Test 1: Age 21+, duurzaam geen arbeidsvermogen, geen werk (Juli 2026: € 2.337 * 75% = € 1.752,75)
  const res1 = calculateWajong({
    age: 21,
    arbeidsvermogen: 'geen',
    hasWorkIncome: false
  });
  assert.strictEqual(res1.isValid, true);
  assert.strictEqual(res1.wajongPercentage, 75);
  assert.strictEqual(res1.applicableMinimumWage, 2337.00);
  assert.strictEqual(res1.maxWajongMonthly, 1752.75);
  assert.strictEqual(res1.estimatedWajongMonthly, 1752.75);
  assert.strictEqual(res1.finalWajongMonthly, 1752.75);
  assert.strictEqual(res1.totalGrossMonthlyIncome, 1752.75);
  assert.strictEqual(res1.vacationAllowanceMonthlyEstimate, 140.22);

  // Test 2: Age 21+, wel arbeidsvermogen, geen werk (Juli 2026: € 2.337 * 70% = € 1.635,90)
  const res2 = calculateWajong({
    age: 25,
    arbeidsvermogen: 'wel',
    hasWorkIncome: false
  });
  assert.strictEqual(res2.isValid, true);
  assert.strictEqual(res2.wajongPercentage, 70);
  assert.strictEqual(res2.maxWajongMonthly, 1635.90);
  assert.strictEqual(res2.finalWajongMonthly, 1635.90);

  // Test 3: Age 21+, wel arbeidsvermogen, inkomen uit werk € 500
  // Inhouding: 70% van € 500 = € 350. Wajong = 1635.90 - 350 = € 1285.90. Totaal = € 1785.90
  const res3 = calculateWajong({
    age: 30,
    arbeidsvermogen: 'wel',
    hasWorkIncome: true,
    workIncomeMonthly: 500
  });
  assert.strictEqual(res3.incomeDeduction, 350.00);
  assert.strictEqual(res3.estimatedWajongMonthly, 1285.90);
  assert.strictEqual(res3.finalWajongMonthly, 1285.90);
  assert.strictEqual(res3.totalGrossMonthlyIncome, 1785.90);
  assert.strictEqual(res3.retentionBenefit, 150.00); // houdt € 150 extra over t.o.v. niet werken

  // Test 4: Age 19 (minimumjeugdloon 60% = € 1.402,20), wel arbeidsvermogen (70% = € 981,54)
  const res4 = calculateWajong({
    age: 19,
    arbeidsvermogen: 'wel',
    hasWorkIncome: false
  });
  assert.strictEqual(res4.youthPercentage, 60);
  assert.strictEqual(res4.applicableMinimumWage, 1402.20);
  assert.strictEqual(res4.maxWajongMonthly, 981.54);

  // Test 5: Age 18 (minimumjeugdloon 50% = € 1.168,50), duurzaam geen arbeidsvermogen (75% = € 876,38)
  const res5 = calculateWajong({
    age: 18,
    arbeidsvermogen: 'geen',
    hasWorkIncome: false
  });
  assert.strictEqual(res5.youthPercentage, 50);
  assert.strictEqual(res5.applicableMinimumWage, 1168.50);
  assert.strictEqual(res5.maxWajongMonthly, 876.38);

  // Test 6: Age 20 (minimumjeugdloon 80% = € 1.869,60), duurzaam geen arbeidsvermogen (75% = € 1.402,20)
  const res6 = calculateWajong({
    age: 20,
    arbeidsvermogen: 'geen',
    hasWorkIncome: false
  });
  assert.strictEqual(res6.youthPercentage, 80);
  assert.strictEqual(res6.applicableMinimumWage, 1869.60);
  assert.strictEqual(res6.maxWajongMonthly, 1402.20);

  // Test 7: Hoog inkomen uit werk (bijv. € 2.500) waarbij Wajong tot € 0 daalt
  const res7 = calculateWajong({
    age: 21,
    arbeidsvermogen: 'wel',
    hasWorkIncome: true,
    workIncomeMonthly: 2500
  });
  assert.strictEqual(res7.estimatedWajongMonthly, 0);
  assert.strictEqual(res7.finalWajongMonthly, 0);
  assert.strictEqual(res7.totalGrossMonthlyIncome, 2500);

  // Test 8: Garantiebedrag hoger dan berekende Wajong
  const res8 = calculateWajong({
    age: 21,
    arbeidsvermogen: 'wel',
    hasWorkIncome: true,
    workIncomeMonthly: 500, // berekende Wajong is 1285.90
    guaranteeAmount: 1450.00
  });
  assert.strictEqual(res8.isGuaranteeApplied, true);
  assert.strictEqual(res8.finalWajongMonthly, 1450.00);
  assert.strictEqual(res8.totalGrossMonthlyIncome, 1950.00);

  // Test 9: Periode januari 2026 (€ 2.294,40)
  const res9 = calculateWajong({
    age: 21,
    arbeidsvermogen: 'wel',
    hasWorkIncome: false,
    period: '2026-01'
  });
  assert.strictEqual(res9.referenceMonthlyWageAdult, 2294.40);
  assert.strictEqual(res9.maxWajongMonthly, 1606.08); // 70% van 2294.40

  // Test 10: Leeftijd jonger dan 18 jaar (ongeldig)
  const res10 = calculateWajong({
    age: 17,
    arbeidsvermogen: 'geen',
    hasWorkIncome: false
  });
  assert.strictEqual(res10.isValid, false);
  assert.strictEqual(res10.errorMessage, 'Wajong kan worden aangevraagd vanaf 18 jaar. Voer een leeftijd van 18 jaar of ouder in.');

  console.log('✓ Wajong calculations passed');
}

// 23. Netto Besteedbaar Inkomen Berekenen
{
  // Test 1: Standaard voorbeeld (Netto € 2.500, overig € 200, toeslag € 150 = € 2.850. Lasten = € 1.400 -> Besteedbaar = € 1.450)
  const res1 = calculateNettoBesteedbaarInkomen({
    nettoIncome: 2500,
    otherIncome: 200,
    allowances: 150,
    housingCosts: 800,
    energyWaterCosts: 200,
    healthInsuranceCosts: 150,
    transportCosts: 150,
    otherFixedCosts: 100
  });
  assert.strictEqual(res1.isValid, true);
  assert.strictEqual(res1.totalIncomeMonthly, 2850.00);
  assert.strictEqual(res1.totalExpensesMonthly, 1400.00);
  assert.strictEqual(res1.disposableIncomeMonthly, 1450.00);
  assert.strictEqual(res1.disposableIncomeAnnual, 17400.00);
  assert.strictEqual(res1.isPositive, true);
  assert.strictEqual(res1.shortfallMonthly, 0);
  assert.strictEqual(res1.disposableIncomeWeekly, 333.72);
  assert.strictEqual(res1.disposableIncomeDaily, 47.67);

  // Test 2: Huishouden met partnerinkomen (€ 2.800 + € 2.200 = € 5.000. Lasten = € 2.500 -> Besteedbaar = € 2.500)
  const res2 = calculateNettoBesteedbaarInkomen({
    nettoIncome: 2800,
    partnerIncome: 2200,
    isHousehold: true,
    housingCosts: 1200,
    energyWaterCosts: 250,
    healthInsuranceCosts: 300,
    transportCosts: 350,
    otherFixedCosts: 400
  });
  assert.strictEqual(res2.totalIncomeMonthly, 5000.00);
  assert.strictEqual(res2.totalExpensesMonthly, 2500.00);
  assert.strictEqual(res2.disposableIncomeMonthly, 2500.00);
  assert.strictEqual(res2.fixedCostsPercentage, 50.0);
  assert.strictEqual(res2.disposablePercentage, 50.0);
  assert.strictEqual(res2.housingPercentage, 24.0);

  // Test 3: Negatief besteedbaar inkomen (tekort)
  // Inkomsten € 1.800, vaste lasten € 2.100 -> Besteedbaar = -€ 300
  const res3 = calculateNettoBesteedbaarInkomen({
    nettoIncome: 1800,
    housingCosts: 1100,
    energyWaterCosts: 250,
    healthInsuranceCosts: 160,
    transportCosts: 200,
    otherFixedCosts: 390
  });
  assert.strictEqual(res3.totalIncomeMonthly, 1800.00);
  assert.strictEqual(res3.totalExpensesMonthly, 2100.00);
  assert.strictEqual(res3.disposableIncomeMonthly, -300.00);
  assert.strictEqual(res3.isPositive, false);
  assert.strictEqual(res3.shortfallMonthly, 300.00);

  // Test 4: Alleenstaand zonder partner (partnerinkomen moet genegeerd worden als isHousehold = false)
  const res4 = calculateNettoBesteedbaarInkomen({
    nettoIncome: 2000,
    partnerIncome: 1500,
    isHousehold: false,
    housingCosts: 700,
    energyWaterCosts: 150,
    healthInsuranceCosts: 140,
    transportCosts: 100,
    otherFixedCosts: 110
  });
  assert.strictEqual(res4.totalIncomeMonthly, 2000.00);
  assert.strictEqual(res4.partnerIncome, 0);
  assert.strictEqual(res4.disposableIncomeMonthly, 800.00);

  // Test 5: Decimale bedragen
  const res5 = calculateNettoBesteedbaarInkomen({
    nettoIncome: 2345.67,
    housingCosts: 900.50,
    energyWaterCosts: 150.25,
    healthInsuranceCosts: 145.80,
    transportCosts: 120.12,
    otherFixedCosts: 88.00
  });
  assert.strictEqual(res5.totalIncomeMonthly, 2345.67);
  assert.strictEqual(res5.totalExpensesMonthly, 1404.67);
  assert.strictEqual(res5.disposableIncomeMonthly, 941.00);

  // Test 6: Inkomsten 0, vaste lasten 500
  const res6 = calculateNettoBesteedbaarInkomen({
    nettoIncome: 0,
    housingCosts: 500,
    energyWaterCosts: 0,
    healthInsuranceCosts: 0,
    transportCosts: 0,
    otherFixedCosts: 0
  });
  assert.strictEqual(res6.disposableIncomeMonthly, -500.00);
  assert.strictEqual(res6.isPositive, false);
  assert.strictEqual(res6.shortfallMonthly, 500.00);

  // Test 7: Vaste lasten 0
  const res7 = calculateNettoBesteedbaarInkomen({
    nettoIncome: 2000,
    housingCosts: 0,
    energyWaterCosts: 0,
    healthInsuranceCosts: 0,
    transportCosts: 0,
    otherFixedCosts: 0
  });
  assert.strictEqual(res7.disposableIncomeMonthly, 2000.00);
  assert.strictEqual(res7.fixedCostsPercentage, 0);
  assert.strictEqual(res7.disposablePercentage, 100.0);

  // Test 8: Negatieve invoer (ongeldig)
  const res8 = calculateNettoBesteedbaarInkomen({
    nettoIncome: -1000,
    housingCosts: 500,
    energyWaterCosts: 100,
    healthInsuranceCosts: 100,
    transportCosts: 50,
    otherFixedCosts: 50
  });
  assert.strictEqual(res8.isValid, false);
  assert.strictEqual(res8.errorMessage, 'Bedragen kunnen niet negatief zijn. Vul een positief getal of 0 in.');

  // Test 9: Toeslagen en overige inkomsten meegerekend
  const res9 = calculateNettoBesteedbaarInkomen({
    nettoIncome: 1900,
    otherIncome: 100,
    allowances: 350,
    housingCosts: 750,
    energyWaterCosts: 150,
    healthInsuranceCosts: 140,
    transportCosts: 80,
    otherFixedCosts: 180
  });
  assert.strictEqual(res9.totalIncomeMonthly, 2350.00);
  assert.strictEqual(res9.totalExpensesMonthly, 1300.00);
  assert.strictEqual(res9.disposableIncomeMonthly, 1050.00);

  // Test 10: Reset / lege waarden defaults
  const res10 = calculateNettoBesteedbaarInkomen({
    nettoIncome: 2200,
    housingCosts: 800,
    energyWaterCosts: 150,
    healthInsuranceCosts: 150,
    transportCosts: 100,
    otherFixedCosts: 100
  });
  assert.strictEqual(res10.partnerIncome, 0);
  assert.strictEqual(res10.otherIncome, 0);
  assert.strictEqual(res10.allowances, 0);
  assert.strictEqual(res10.totalExpensesMonthly, 1300.00);
  assert.strictEqual(res10.disposableIncomeMonthly, 900.00);

  console.log('✓ Netto Besteedbaar Inkomen calculations passed');
}

// 24. Transitievergoeding Berekenen (art. 7:673 BW, 2026 cap € 102.000)
{
  // Test 1: Exact 3 full years at € 3.000 base + 8% vakantiegeld (= € 3.240 monthly base)
  // Severance: 3 * (3240 / 3) = 3240.00
  const res1 = calculateTransitievergoeding({
    startDate: '2020-01-01',
    endDate: '2022-12-31',
    baseMonthlySalary: 3000,
    includeHolidayAllowance: true,
    holidayAllowancePercentage: 8
  });
  assert.strictEqual(res1.isValid, true);
  assert.strictEqual(res1.yearsOfService, 3);
  assert.strictEqual(res1.monthsOfService, 0);
  assert.strictEqual(res1.daysOfService, 0);
  assert.strictEqual(res1.baseSalaryMonthly, 3000);
  assert.strictEqual(res1.holidayAllowanceMonthly, 240);
  assert.strictEqual(res1.totalMonthlySalary, 3240);
  assert.strictEqual(res1.severanceFullYears, 3240);
  assert.strictEqual(res1.finalTransitievergoeding, 3240);
  assert.strictEqual(res1.isCapped, false);
  assert.strictEqual(res1.isEligible, true);

  // Test 2: 5 years and 4 months at € 3.500 base + 8% vakantiegeld (= € 3.780)
  // Full years: 5 * (3780 / 3) = 6300.00
  // Months: (4 / 12) * (3780 / 3) = 420.00
  // Total: 6720.00
  const res2 = calculateTransitievergoeding({
    startDate: '2020-01-01',
    endDate: '2025-04-30',
    baseMonthlySalary: 3500,
    includeHolidayAllowance: true,
    holidayAllowancePercentage: 8
  });
  assert.strictEqual(res2.yearsOfService, 5);
  assert.strictEqual(res2.monthsOfService, 4);
  assert.strictEqual(res2.daysOfService, 0);
  assert.strictEqual(res2.totalMonthlySalary, 3780);
  assert.strictEqual(res2.severanceFullYears, 6300);
  assert.strictEqual(res2.severanceRemainingMonths, 420);
  assert.strictEqual(res2.finalTransitievergoeding, 6720);

  // Test 3: Short duration under 1 year (6 months)
  // (6 / 12) * (3240 / 3) = 540.00
  const res3 = calculateTransitievergoeding({
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    baseMonthlySalary: 3000,
    includeHolidayAllowance: true,
    holidayAllowancePercentage: 8
  });
  assert.strictEqual(res3.yearsOfService, 0);
  assert.strictEqual(res3.monthsOfService, 6);
  assert.strictEqual(res3.daysOfService, 0);
  assert.strictEqual(res3.finalTransitievergoeding, 540);

  // Test 4: Accrual by days (10 days worked) at € 3.650 without vacation pay
  // (10 / 365) * (3650 / 3) = 33.33
  const res4 = calculateTransitievergoeding({
    startDate: '2024-03-01',
    endDate: '2024-03-10',
    baseMonthlySalary: 3650,
    includeHolidayAllowance: false
  });
  assert.strictEqual(res4.yearsOfService, 0);
  assert.strictEqual(res4.monthsOfService, 0);
  assert.strictEqual(res4.daysOfService, 10);
  assert.strictEqual(res4.finalTransitievergoeding, 33.33);

  // Test 5: Oproepcontract: € 15/hr * 100 hrs/month = € 1.500 base + 8% = € 1.620 monthly base
  // 2 full years -> 2 * (1620 / 3) = 1080.00
  const res5 = calculateTransitievergoeding({
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    contractType: 'oproep',
    hourlyWage: 15,
    averageHoursPerMonth: 100,
    includeHolidayAllowance: true
  });
  assert.strictEqual(res5.baseSalaryMonthly, 1500);
  assert.strictEqual(res5.holidayAllowanceMonthly, 120);
  assert.strictEqual(res5.totalMonthlySalary, 1620);
  assert.strictEqual(res5.finalTransitievergoeding, 1080);
  assert.strictEqual(res5.contractTypeLabel, 'Oproep- / min-maxcontract');

  // Test 6: Extra components (13th month, structural allowance, variable bonus)
  // Base € 3.000 + 8% vakantiegeld (€ 240) + 13e maand € 3.000/12 (€ 250) + vaste ploegentoeslag € 200 + bonus € 150 = € 3.840
  // 3 years -> 3 * (3840 / 3) = 3840.00
  const res6 = calculateTransitievergoeding({
    startDate: '2021-01-01',
    endDate: '2023-12-31',
    baseMonthlySalary: 3000,
    includeHolidayAllowance: true,
    annualBonusOr13thMonth: 3000,
    structuralAllowancesMonthly: 200,
    variableBonusAverageMonthly: 150
  });
  assert.strictEqual(res6.totalMonthlySalary, 3840);
  assert.strictEqual(res6.finalTransitievergoeding, 3840);

  // Test 7: Statutory cap 2026 reached (€ 102.000)
  // 40 years at € 8.000/month (annual salary = € 96.000 < € 102.000). Raw = 40 * (8000 / 3) = 106.666,67
  // Cap is € 102.000.
  const res7 = calculateTransitievergoeding({
    startDate: '1984-01-01',
    endDate: '2023-12-31',
    baseMonthlySalary: 8000,
    includeHolidayAllowance: false
  });
  assert.strictEqual(res7.yearsOfService, 40);
  assert.strictEqual(res7.rawTransitievergoeding, 106666.67);
  assert.strictEqual(res7.isCapped, true);
  assert.strictEqual(res7.statutoryCap2026, 102000);
  assert.strictEqual(res7.effectiveCap, 102000);
  assert.strictEqual(res7.finalTransitievergoeding, 102000);

  // Test 8: High earner where annual salary > € 102.000 sets higher cap
  // € 15.000/month -> Annual salary = € 180.000. Effective cap = € 180.000.
  // 20 years -> Raw severance = 20 * (15000 / 3) = 100.000. Not capped!
  const res8 = calculateTransitievergoeding({
    startDate: '2004-01-01',
    endDate: '2023-12-31',
    baseMonthlySalary: 15000,
    includeHolidayAllowance: false
  });
  assert.strictEqual(res8.effectiveCap, 180000);
  assert.strictEqual(res8.isCapped, false);
  assert.strictEqual(res8.finalTransitievergoeding, 100000);

  // Test 9: Invalid date order (endDate before startDate)
  const res9 = calculateTransitievergoeding({
    startDate: '2025-01-01',
    endDate: '2020-01-01',
    baseMonthlySalary: 3000
  });
  assert.strictEqual(res9.isValid, false);
  assert.strictEqual(res9.errorMessage, 'De einddatum kan niet vóór de startdatum liggen.');

  // Test 10: Termination reasons eligibility
  const resEligible = calculateTransitievergoeding({
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    baseMonthlySalary: 3000,
    terminationReason: 'tijdelijk_niet_verlengd'
  });
  assert.strictEqual(resEligible.isEligible, true);

  const resIneligible = calculateTransitievergoeding({
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    baseMonthlySalary: 3000,
    terminationReason: 'zelf_ontslag'
  });
  assert.strictEqual(resIneligible.isEligible, false);

  const resFault = calculateTransitievergoeding({
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    baseMonthlySalary: 3000,
    terminationReason: 'ernstig_verwijtbaar_werknemer'
  });
  assert.strictEqual(resFault.isEligible, false);

  const resVso = calculateTransitievergoeding({
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    baseMonthlySalary: 3000,
    terminationReason: 'wederzijds_goedvinden'
  });
  assert.strictEqual(resVso.isEligible, true);

  console.log('✓ Transitievergoeding calculations passed');
}

// 25. Netto Salaris Berekenen (Witte Tabel 2026)
{
  // Test 1: € 3.000 bruto per maand, LHK AAN, onder AOW
  const res1 = calculateNettoSalaris({
    grossSalary: 3000,
    salaryPeriod: 'month',
    applyLoonheffingskorting: true,
    age: 30
  });
  assert.strictEqual(res1.isValid, true);
  assert.strictEqual(res1.grossMonthlySalary, 3000);
  assert.strictEqual(res1.grossAnnualSalary, 36000);
  assert.strictEqual(res1.taxableMonthlyWage, 3000);
  // Belasting vóór heffingskorting: 35,82% van 36.000 = 12.895,20 / 12 = 1.074,60
  assert.strictEqual(res1.grossTaxMonthly, 1074.60);
  assert.strictEqual(res1.generalTaxCreditMonthly, 218.86);
  assert.strictEqual(res1.labourTaxCreditMonthly, 448.17);
  assert.strictEqual(res1.appliedTaxCreditMonthly, 667.03);
  assert.strictEqual(res1.payrollTaxMonthly, 407.57);
  assert.strictEqual(res1.netMonthlySalary, 2592.43);
  assert.strictEqual(res1.netAnnualSalary, 31109.16);

  // Test 2: € 4.000 bruto per maand (jaar € 48.000), LHK AAN
  const res2 = calculateNettoSalaris({
    grossSalary: 4000,
    salaryPeriod: 'month',
    applyLoonheffingskorting: true,
    age: 35
  });
  assert.strictEqual(res2.grossMonthlySalary, 4000);
  assert.strictEqual(res2.grossAnnualSalary, 48000);
  assert.strictEqual(res2.grossTaxMonthly, 1446.02);
  assert.strictEqual(res2.generalTaxCreditMonthly, 154.52);
  assert.strictEqual(res2.labourTaxCreditMonthly, 452.58);
  assert.strictEqual(res2.appliedTaxCreditMonthly, 607.10);
  assert.strictEqual(res2.payrollTaxMonthly, 838.92);
  assert.strictEqual(res2.netMonthlySalary, 3161.08);

  // Test 3: € 3.000 bruto per maand, LHK UIT
  const res3 = calculateNettoSalaris({
    grossSalary: 3000,
    salaryPeriod: 'month',
    applyLoonheffingskorting: false
  });
  assert.strictEqual(res3.appliedTaxCreditMonthly, 0);
  assert.strictEqual(res3.payrollTaxMonthly, 1074.60);
  assert.strictEqual(res3.netMonthlySalary, 1925.40);

  // Test 4: € 3.000 bruto per maand met werknemerspensioenpremie € 150/mnd
  const res4 = calculateNettoSalaris({
    grossSalary: 3000,
    salaryPeriod: 'month',
    applyLoonheffingskorting: true,
    employeePensionMonthly: 150
  });
  assert.strictEqual(res4.taxableMonthlyWage, 2850);
  assert.strictEqual(res4.taxableAnnualWage, 34200);
  // Belasting over 34.200: 35,82% = 12.250,44 / 12 = 1.020,87
  assert.strictEqual(res4.grossTaxMonthly, 1020.87);
  // Loonheffing daalt door pensioenpremie, netto salaris = 3000 - pensioen - loonheffing
  assert(res4.payrollTaxMonthly < res1.payrollTaxMonthly);
  assert.strictEqual(res4.netMonthlySalary, 2500.57);

  // Test 5: Salarisperiode per 4 weken (€ 2.400 / 4 weken -> 13 perioden = € 31.200 jaarsalaris)
  const res5 = calculateNettoSalaris({
    grossSalary: 2400,
    salaryPeriod: '4week',
    applyLoonheffingskorting: true
  });
  assert.strictEqual(res5.grossFourWeeklySalary, 2400);
  assert.strictEqual(res5.grossAnnualSalary, 31200);
  assert.strictEqual(res5.grossMonthlySalary, 2600);
  assert(res5.netFourWeeklySalary > 0);
  assert.strictEqual(res5.salaryPeriodLabel, 'Per 4 weken (13x per jaar)');

  // Test 6: Uurloon (€ 20/uur bij 40 uur/week)
  const res6 = calculateNettoSalaris({
    grossSalary: 20,
    salaryPeriod: 'hour',
    weeklyHours: 40,
    applyLoonheffingskorting: true
  });
  assert.strictEqual(res6.grossHourlyWage, 20);
  assert.strictEqual(res6.grossWeeklySalary, 800);
  assert.strictEqual(res6.grossAnnualSalary, 41600);
  assert.strictEqual(res6.grossMonthlySalary, 3466.67);
  assert(res6.netHourlyWage !== undefined && res6.netHourlyWage > 0);

  // Test 7: AOW-gerechtigde werknemer (leeftijd 68 -> lager tarief 1e schijf 17,92%)
  const res7 = calculateNettoSalaris({
    grossSalary: 3000,
    salaryPeriod: 'month',
    age: 68,
    applyLoonheffingskorting: true
  });
  assert.strictEqual(res7.isAowEligible, true);
  // Bruto belasting schijf 1 voor AOW: 17,92% van 36.000 = 6.451,20 / 12 = 537,60
  assert.strictEqual(res7.grossTaxMonthly, 537.60);
  assert(res7.netMonthlySalary > 0);

  // Test 8: Vakantiegeld optie
  const res8 = calculateNettoSalaris({
    grossSalary: 3000,
    salaryPeriod: 'month',
    includeHolidayAllowance: true
  });
  assert.strictEqual(res8.includeHolidayAllowance, true);
  // Vakantiegeld 8% over 36.000 = 2.880
  assert.strictEqual(res8.grossHolidayAllowanceAnnual, 2880);
  assert(res8.marginalTaxRateHolidayPercentage > 0);
  assert(res8.netHolidayAllowanceAnnual > 0);
  assert.strictEqual(res8.netAnnualSalaryWithHoliday, res8.netAnnualSalary + res8.netHolidayAllowanceAnnual);

  // Test 9: 13e maand / bonus optie (€ 3.000 bonus)
  const res9 = calculateNettoSalaris({
    grossSalary: 3000,
    salaryPeriod: 'month',
    hasBonusOr13thMonth: true,
    grossBonusOr13thMonth: 3000
  });
  assert.strictEqual(res9.hasBonusOr13thMonth, true);
  assert.strictEqual(res9.grossBonusOr13thMonth, 3000);
  // Bij € 36.000 jaarloon is het bijzonder tarief 38,75%
  assert.strictEqual(res9.marginalTaxRateBonusPercentage, 38.75);
  assert.strictEqual(res9.taxBonusOr13thMonth, 1162.50);
  assert.strictEqual(res9.netBonusOr13thMonth, 1837.50);

  // Test 10: Validatiefout bij ongeldige / negatieve invoer
  const res10 = calculateNettoSalaris({
    grossSalary: -500
  });
  assert.strictEqual(res10.isValid, false);
  assert.strictEqual(res10.errorMessage, 'Voer een geldig, positief bruto salarisbedrag in.');

  console.log('✓ Netto Salaris calculations passed');
}

// 26. Jaarinkomen
{
  // Test 1: Standaard maandsalaris (€ 3.500/mnd, 8% vakantiegeld)
  const res1 = calculateJaarinkomen({
    grossSalary: 3500,
    salaryPeriod: 'maand',
    includeHolidayAllowance: true,
    holidayAllowancePercentage: 8
  });
  assert.strictEqual(res1.grossInput, 3500);
  assert.strictEqual(res1.baseAnnualSalary, 42000);
  assert.strictEqual(res1.holidayAllowanceAmount, 3360);
  assert.strictEqual(res1.totalGrossAnnualIncome, 45360);
  assert.strictEqual(res1.averageGrossMonthly, 3780);
  assert.strictEqual(res1.averageGrossFourWeekly, 3489.23);
  assert.strictEqual(res1.averageGrossWeekly, 872.31);

  // Test 2: 4-weken verloning (€ 2.500 / 4 weken -> 13 periodes)
  const res2 = calculateJaarinkomen({
    grossSalary: 2500,
    salaryPeriod: 'vierwekelijks',
    includeHolidayAllowance: true,
    holidayAllowancePercentage: 8
  });
  assert.strictEqual(res2.baseAnnualSalary, 32500);
  assert.strictEqual(res2.holidayAllowanceAmount, 2600);
  assert.strictEqual(res2.totalGrossAnnualIncome, 35100);

  // Test 3: Weekloon (€ 800 / week -> 52 weken)
  const res3 = calculateJaarinkomen({
    grossSalary: 800,
    salaryPeriod: 'week',
    includeHolidayAllowance: true,
    holidayAllowancePercentage: 8
  });
  assert.strictEqual(res3.baseAnnualSalary, 41600);
  assert.strictEqual(res3.holidayAllowanceAmount, 3328);
  assert.strictEqual(res3.totalGrossAnnualIncome, 44928);

  // Test 4: Uurloon (€ 20,00 / uur bij 36 uur/week)
  const res4 = calculateJaarinkomen({
    grossSalary: 20,
    salaryPeriod: 'uur',
    weeklyHours: 36,
    includeHolidayAllowance: true,
    holidayAllowancePercentage: 8
  });
  assert.strictEqual(res4.baseAnnualSalary, 37440);
  assert.strictEqual(res4.holidayAllowanceAmount, 2995.20);
  assert.strictEqual(res4.totalGrossAnnualIncome, 40435.20);
  assert.strictEqual(res4.averageGrossHourly, 21.60);

  // Test 5: Dagloon (€ 160 / dag bij 5 dagen/week)
  const res5 = calculateJaarinkomen({
    grossSalary: 160,
    salaryPeriod: 'dag',
    daysPerWeek: 5,
    includeHolidayAllowance: true,
    holidayAllowancePercentage: 8
  });
  assert.strictEqual(res5.baseAnnualSalary, 41600);
  assert.strictEqual(res5.holidayAllowanceAmount, 3328);
  assert.strictEqual(res5.totalGrossAnnualIncome, 44928);

  // Test 6: Zonder vakantiegeld
  const res6 = calculateJaarinkomen({
    grossSalary: 40000 / 12,
    salaryPeriod: 'maand',
    includeHolidayAllowance: false
  });
  assert.strictEqual(res6.baseAnnualSalary, 40000);
  assert.strictEqual(res6.holidayAllowanceAmount, 0);
  assert.strictEqual(res6.totalGrossAnnualIncome, 40000);

  // Test 7: Met vaste 13e maand en bonus
  const res7 = calculateJaarinkomen({
    grossSalary: 40000 / 12,
    salaryPeriod: 'maand',
    includeHolidayAllowance: true,
    holidayAllowancePercentage: 8,
    thirteenthMonthType: 'fixed',
    thirteenthMonthValue: 3000,
    annualBonus: 2000
  });
  assert.strictEqual(res7.baseAnnualSalary, 40000);
  assert.strictEqual(res7.holidayAllowanceAmount, 3200);
  assert.strictEqual(res7.thirteenthMonthAmount, 3000);
  assert.strictEqual(res7.annualBonus, 2000);
  assert.strictEqual(res7.totalGrossAnnualIncome, 48200);

  // Test 8: Met 13e maand percentage (8.33%)
  const res8 = calculateJaarinkomen({
    grossSalary: 40000 / 12,
    salaryPeriod: 'maand',
    includeHolidayAllowance: false,
    thirteenthMonthType: 'percentage',
    thirteenthMonthValue: 8.33
  });
  assert.strictEqual(res8.thirteenthMonthAmount, 3332);
  assert.strictEqual(res8.totalGrossAnnualIncome, 43332);

  // Test 9: Gebroken werkjaar (7 maanden gewerkt)
  const res9 = calculateJaarinkomen({
    grossSalary: 3000,
    salaryPeriod: 'maand',
    workedFullYear: false,
    monthsWorked: 7,
    includeHolidayAllowance: true,
    holidayAllowancePercentage: 8
  });
  assert.strictEqual(res9.fullYearEquivalentSalary, 36000);
  assert.strictEqual(res9.baseAnnualSalary, 21000);
  assert.strictEqual(res9.holidayAllowanceAmount, 1680);
  assert.strictEqual(res9.totalGrossAnnualIncome, 22680);

  // Test 10: Optionele netto schatting (modaal inkomen)
  const res10 = calculateJaarinkomen({
    grossSalary: 40000 / 12,
    salaryPeriod: 'maand',
    includeHolidayAllowance: true,
    holidayAllowancePercentage: 8,
    estimateNet: true,
    applyLoonheffingskorting: true
  });
  assert.strictEqual(res10.totalGrossAnnualIncome, 43200);
  assert.strictEqual(res10.estimateNet, true);
  assert(res10.estimatedGrossTaxAnnual > 0);
  assert(res10.estimatedPayrollTaxAnnual > 0);
  assert(res10.estimatedNetAnnualIncome > 0);
  assert(res10.estimatedNetMonthlyIncome > 0);

  // Test 11: Optionele netto schatting met pensioenpremie en LHK uitgeschakeld
  const res11 = calculateJaarinkomen({
    grossSalary: 40000 / 12,
    salaryPeriod: 'maand',
    includeHolidayAllowance: true,
    estimateNet: true,
    applyLoonheffingskorting: false,
    employeePensionMonthly: 200
  });
  assert.strictEqual(res11.employeePensionAnnual, 2400);
  assert.strictEqual(res11.taxableAnnualIncome, 43200 - 2400);
  assert.strictEqual(res11.estimatedTaxCreditsAnnual, 0); // LHK = false

  // Test 12: Validatiefout bij negatief salaris
  const res12 = calculateJaarinkomen({
    grossSalary: -100,
    salaryPeriod: 'maand'
  });
  assert.strictEqual(res12.isValid, false);
  assert.strictEqual(res12.errorMessage, 'Voer een geldig, positief bruto salarisbedrag in.');

  console.log('✓ Jaarinkomen calculations passed');
}

console.log('All 26 calculation engines passed tests successfully!');






