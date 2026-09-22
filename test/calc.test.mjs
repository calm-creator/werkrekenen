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
  calculateParttimeSalaris
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
  // € 20/hr, 10 hours overtime at 150%
  const res = calculateOveruren(20, 10, 150);
  assert.strictEqual(res.basePay, 200);
  assert.strictEqual(res.surchargePay, 100);
  assert.strictEqual(res.totalGrossPay, 300);
  assert.strictEqual(res.timeForTimeHours, 15);
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

console.log('All 8 calculation engines passed tests successfully!');
