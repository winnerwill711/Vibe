import { parseCurrency } from './format';

const p = parseCurrency;

// ─── Section 1: Home Sale ───────────────────────────────────────────────────

export const calcHomeSale = (s) => {
  const salePrice = p(s.salePrice);
  const mortgageBalance = p(s.mortgageBalance);
  const originalPurchasePrice = p(s.originalPurchasePrice);
  const realtorCommissionPct = p(s.realtorCommission);
  const sellerClosingCostsPct = p(s.sellerClosingCosts);
  const repairs = p(s.repairsStaging);
  const hoaTransfer = p(s.hoaTransferFees);
  const movingCosts = p(s.movingCosts);

  const realtorCommission = salePrice * realtorCommissionPct / 100;
  const sellerClosingCosts = salePrice * sellerClosingCostsPct / 100;

  // Capital gains tax
  const exclusion = s.filingStatus === 'married' ? 500000 : 250000;
  let grossGain = 0;
  let taxableGain = 0;
  let capitalGainsTax = 0;
  if (originalPurchasePrice > 0 && salePrice > 0) {
    grossGain = salePrice - originalPurchasePrice;
    taxableGain = Math.max(0, grossGain - exclusion);
    capitalGainsTax = taxableGain * 0.15; // 15% long-term federal rate
  }

  const netProceeds =
    salePrice
    - realtorCommission
    - sellerClosingCosts
    - repairs
    - hoaTransfer
    - mortgageBalance
    - capitalGainsTax;

  const availableForDownPayment = Math.max(0, netProceeds - movingCosts);

  return {
    salePrice,
    realtorCommission,
    realtorCommissionPct,
    sellerClosingCosts,
    sellerClosingCostsPct,
    repairs,
    hoaTransfer,
    mortgageBalance,
    exclusion,
    grossGain,
    taxableGain,
    capitalGainsTax,
    netProceeds,
    movingCosts,
    availableForDownPayment,
  };
};

// ─── Section 2: Mortgage ────────────────────────────────────────────────────

export const calcMonthlyPI = (loanAmount, annualRate, termYears) => {
  if (!loanAmount || !annualRate || !termYears) return 0;
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return loanAmount / n;
  return loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};

/**
 * Find the month number when the loan balance drops below 80% of home value.
 * Returns 0 if no PMI needed, or total months if it never drops.
 */
export const calcPMIDropMonth = (loanAmount, homeValue, annualRate, termYears) => {
  const targetBalance = homeValue * 0.80;
  if (loanAmount <= targetBalance) return 0;
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  const monthlyPI = calcMonthlyPI(loanAmount, annualRate, termYears);
  let balance = loanAmount;
  for (let k = 0; k < n; k++) {
    const interest = balance * r;
    const principalPaid = monthlyPI - interest;
    balance -= principalPaid;
    if (balance <= targetBalance) return k + 1;
  }
  return n;
};

export const calcMortgageScenario = (purchasePrice, downPayment, loanTerm, annualRate, propertyTaxRate, homeInsurance, hoaFees) => {
  if (!purchasePrice || !annualRate) return null;

  const loanAmount = Math.max(0, purchasePrice - downPayment);
  const downPaymentPct = purchasePrice > 0 ? (downPayment / purchasePrice) * 100 : 0;
  const monthlyPI = calcMonthlyPI(loanAmount, annualRate, loanTerm);
  const monthlyTax = (purchasePrice * (propertyTaxRate / 100)) / 12;
  const monthlyInsurance = homeInsurance;
  const needsPMI = downPaymentPct < 20;
  const monthlyPMI = needsPMI ? (loanAmount * 0.0075) / 12 : 0;
  const monthlyHOA = hoaFees;

  const monthlyPITI = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;
  const n = loanTerm * 12;
  const totalInterest = Math.max(0, monthlyPI * n - loanAmount);
  const totalCost = loanAmount + totalInterest;

  const pmiDropMonth = needsPMI
    ? calcPMIDropMonth(loanAmount, purchasePrice, annualRate, loanTerm)
    : null;
  const pmiDropYear = pmiDropMonth ? Math.ceil(pmiDropMonth / 12) : null;

  return {
    loanAmount,
    downPaymentPct,
    monthlyPI,
    monthlyTax,
    monthlyInsurance,
    monthlyPMI,
    monthlyHOA,
    monthlyPITI,
    totalInterest,
    totalCost,
    pmiDropMonth,
    pmiDropYear,
    needsPMI,
  };
};

// ─── Section 3: Expenses ────────────────────────────────────────────────────

export const calcExpenses = (s) => {
  // Household
  const electric = p(s.electric);
  const gasUtility = p(s.gasUtility);
  const waterSewer = p(s.waterSewer);
  const trash = p(s.trash);
  const internet = p(s.internet);
  const cellPhones = p(s.cellPhones);
  const streaming = p(s.streaming);
  const householdTotal = electric + gasUtility + waterSewer + trash + internet + cellPhones + streaming;

  // Food
  const weeklyGroceries = p(s.weeklyGroceries);
  const monthlyGroceries = weeklyGroceries * (52 / 12);
  const diningOut = p(s.diningOut);
  const foodTotal = monthlyGroceries + diningOut;

  // Kids – childcare
  const daycare1 = p(s.daycare1);
  const daycare2 = p(s.daycare2);
  const backupChildcare = p(s.backupChildcare);
  const diapers = p(s.diapers);
  const kidsClothing = p(s.kidsClothing);
  const kidsChildcareTotal = daycare1 + daycare2 + backupChildcare + diapers + kidsClothing;

  // Kids – healthcare
  const pediatricCopays = p(s.pediatricCopays);
  const kidsRx = p(s.kidsRx);
  const kidsHealthTotal = pediatricCopays + kidsRx;

  // Healthcare & insurance
  const healthInsurance = p(s.healthInsurance);
  const dentalInsurance = p(s.dentalInsurance);
  const visionInsurance = p(s.visionInsurance);
  const outOfPocketMedical = p(s.outOfPocketMedical);
  const healthcareTotal = healthInsurance + dentalInsurance + visionInsurance + outOfPocketMedical;

  // Transportation
  const carPayment1 = p(s.carPayment1);
  const carPayment2 = p(s.carPayment2);
  const gasVehicle1 = p(s.gasVehicle1);
  const gasVehicle2 = p(s.gasVehicle2);
  const autoInsurance = p(s.autoInsurance);
  const carMaintenance = p(s.carMaintenance);
  const transportTotal = carPayment1 + carPayment2 + gasVehicle1 + gasVehicle2 + autoInsurance + carMaintenance;

  // Lifestyle & Discretionary
  const shopping = p(s.shopping);
  const personalCare = p(s.personalCare);
  const entertainment = p(s.entertainment);
  const homeGarden = p(s.homeGarden);
  const softwareTech = p(s.softwareTech);
  const lifestyleTotal = shopping + personalCare + entertainment + homeGarden + softwareTech;

  const totalNonHousing =
    householdTotal + foodTotal + kidsChildcareTotal + kidsHealthTotal + healthcareTotal + transportTotal + lifestyleTotal;

  return {
    electric, gasUtility, waterSewer, trash, internet, cellPhones, streaming, householdTotal,
    weeklyGroceries, monthlyGroceries, diningOut, foodTotal,
    daycare1, daycare2, backupChildcare, diapers, kidsClothing, kidsChildcareTotal,
    pediatricCopays, kidsRx, kidsHealthTotal,
    healthInsurance, dentalInsurance, visionInsurance, outOfPocketMedical, healthcareTotal,
    carPayment1, carPayment2, gasVehicle1, gasVehicle2, autoInsurance, carMaintenance, transportTotal,
    shopping, personalCare, entertainment, homeGarden, softwareTech, lifestyleTotal,
    totalNonHousing,
  };
};

// ─── Section 4: Financial Health ────────────────────────────────────────────

export const calcFinancialHealth = (s, homeSale, mortgageExpected, expenses) => {
  const grossIncome = p(s.grossMonthlyIncome);
  const netIncome = p(s.netMonthlyIncome);

  // Back-end DTI: (PITI + car payments) / gross income
  const debtPayments = expenses.carPayment1 + expenses.carPayment2;
  const piti = mortgageExpected ? mortgageExpected.monthlyPITI : 0;
  const dti = grossIncome > 0 ? ((piti + debtPayments) / grossIncome) * 100 : 0;

  // Housing cost as % of take-home
  const housingPct = netIncome > 0 ? (piti / netIncome) * 100 : 0;

  // Emergency fund: months of total expenses covered by net proceeds
  const totalMonthly = piti + expenses.totalNonHousing;
  const monthsCovered =
    totalMonthly > 0 && homeSale.availableForDownPayment > 0
      ? (homeSale.netProceeds - p(s.downPayment)) / totalMonthly
      : 0;

  // Monthly cash remaining (using expected scenario)
  const cashRemaining = netIncome > 0 ? netIncome - totalMonthly : 0;

  // Suggested purchase price if DTI is too high (binary search)
  let suggestedPrice = null;
  if (dti > 43 && grossIncome > 0 && mortgageExpected) {
    const maxPITI = grossIncome * 0.43 - debtPayments;
    const downPmt = p(s.downPayment);
    const rate = p(s.rateExpected);
    const term = p(s.loanTerm) || 30;
    const taxRate = p(s.propertyTaxRate);
    const ins = p(s.homeInsurance);
    const hoa = p(s.hoaFees);
    // Binary search for purchase price where PITI ≈ maxPITI
    let lo = 100000, hi = 2000000, sp = 0;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      const sc = calcMortgageScenario(mid, downPmt, term, rate, taxRate, ins, hoa);
      if (!sc) break;
      if (sc.monthlyPITI > maxPITI) hi = mid;
      else { lo = mid; sp = mid; }
    }
    suggestedPrice = sp > 0 ? Math.round(sp / 1000) * 1000 : null;
  }

  return { dti, housingPct, monthsCovered, cashRemaining, piti, totalMonthly, suggestedPrice };
};
