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
  calculateWeekloon
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

console.log('All 16 calculation engines passed tests successfully!');



