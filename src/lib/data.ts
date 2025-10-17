export type CompanyCost = {
  id: string;
  rank: number;
  name: string;
  fixedFee: number;
  consumptionCost: number;
  otherCosts: number;
  totalCost: number;
};

export type SimulationResult = {
  summary: {
    totalKwhP1: number;
    totalKwhP2: number;
    totalKwhP3: number;
    totalKwhP4: number;
    totalKwhP5: number;
    totalKwhP6: number;
    totalKwh: number;
    period: string;
    bestOption: {
      companyName: string;
      savings: number;
    };
  };
  details: CompanyCost[];
};

export const MOCK_SIMULATION_RESULT: SimulationResult = {
  summary: {
    totalKwh: 3450,
    totalKwhP1: 1000,
    totalKwhP2: 1200,
    totalKwhP3: 1250,
    totalKwhP4: 0,
    totalKwhP5: 0,
    totalKwhP6: 0,
    period: '01/01/2023 - 31/12/2023',
    bestOption: {
      companyName: 'EcoLuz',
      savings: 250.75,
    },
  },
  details: [
    {
      id: '1',
      rank: 1,
      name: 'EcoLuz',
      fixedFee: 60.00,
      consumptionCost: 450.50,
      otherCosts: 25.00,
      totalCost: 535.50,
    },
    {
      id: '2',
      rank: 2,
      name: 'Energía Clara',
      fixedFee: 55.00,
      consumptionCost: 510.20,
      otherCosts: 20.00,
      totalCost: 585.20,
    },
    {
      id: '3',
      rank: 3,
      name: 'Solaria Power',
      fixedFee: 65.00,
      consumptionCost: 490.00,
      otherCosts: 30.00,
      totalCost: 585.00,
    },
    {
      id: '4',
      rank: 4,
      name: 'Tu Compañía Actual',
      fixedFee: 70.00,
      consumptionCost: 690.00,
      otherCosts: 26.25,
      totalCost: 786.25,
    },
     {
      id: '5',
      rank: 5,
      name: 'Iberdrola',
      fixedFee: 80.00,
      consumptionCost: 750.00,
      otherCosts: 35.00,
      totalCost: 865.00,
    },
  ],
};

export type Tariff = {
  id: string;
  companyName: string;
  priceKwhP1: number;
  priceKwhP2: number;
  priceKwhP3: number;
  priceKwhP4: number;
  priceKwhP5: number;
  priceKwhP6: number;
  fixedTerm: number;
  promo: string;
};

export const MOCK_TARIFFS: Omit<Tariff, 'id'>[] = [
    { companyName: 'Tu Compañía Actual', priceKwhP1: 0.22, priceKwhP2: 0.20, priceKwhP3: 0.18, priceKwhP4: 0.17, priceKwhP5: 0.16, priceKwhP6: 0.15, fixedTerm: 5.83, promo: 'Tarifa Base' },
    { companyName: 'EcoLuz', priceKwhP1: 0.15, priceKwhP2: 0.14, priceKwhP3: 0.13, priceKwhP4: 0.12, priceKwhP5: 0.11, priceKwhP6: 0.10, fixedTerm: 5.00, promo: '20% dto. 6 meses' },
    { companyName: 'Energía Clara', priceKwhP1: 0.16, priceKwhP2: 0.15, priceKwhP3: 0.14, priceKwhP4: 0.13, priceKwhP5: 0.12, priceKwhP6: 0.11, fixedTerm: 4.58, promo: 'Precio fijo' },
    { companyName: 'Solaria Power', priceKwhP1: 0.155, priceKwhP2: 0.145, priceKwhP3: 0.135, priceKwhP4: 0.125, priceKwhP5: 0.115, priceKwhP6: 0.105, fixedTerm: 5.42, promo: 'Sin permanencia' },
    { companyName: 'Iberdrola', priceKwhP1: 0.20, priceKwhP2: 0.19, priceKwhP3: 0.18, priceKwhP4: 0.17, priceKwhP5: 0.16, priceKwhP6: 0.15, fixedTerm: 6.67, promo: 'Plan Noche' },
];
