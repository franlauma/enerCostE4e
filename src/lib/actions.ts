
'use server';

import { z } from 'zod';
import * as xlsx from 'xlsx';
import { MOCK_SIMULATION_RESULT, type SimulationResult, type CompanyCost, type Tariff } from '@/lib/data';
import { getContextualHelp } from '@/ai/flows/contextual-assistance';
import { summarizeSimulationResults } from '@/ai/flows/summarize-results-flow';


const formSchema = z.object({
  file: z.any().refine(file => file?.size > 0, 'El archivo no puede estar vacío.'),
});

type ActionResponse = {
  success: boolean;
  data?: SimulationResult;
  error?: string;
  helpMessage?: string | null;
  aiSummary?: string | null;
};

const MOCK_TARIFFS: Omit<Tariff, 'id'>[] = [
    { companyName: 'Tu Compañía Actual', priceKwhP1: 0.22, priceKwhP2: 0.20, priceKwhP3: 0.18, priceKwhP4: 0.17, priceKwhP5: 0.16, priceKwhP6: 0.15, fixedTerm: 5.83, promo: 'Tarifa Base', pricePowerP1: 0.1, pricePowerP2: 0.08, pricePowerP3: 0.07, pricePowerP4: 0.06, pricePowerP5: 0.05, pricePowerP6: 0.04, surplusCompensationPrice: 0.05 },
    { companyName: 'EcoLuz', priceKwhP1: 0.15, priceKwhP2: 0.14, priceKwhP3: 0.13, priceKwhP4: 0.12, priceKwhP5: 0.11, priceKwhP6: 0.10, fixedTerm: 5.00, promo: '20% dto. 6 meses', pricePowerP1: 0.09, pricePowerP2: 0.08, pricePowerP3: 0.07, pricePowerP4: 0.06, pricePowerP5: 0.05, pricePowerP6: 0.04, surplusCompensationPrice: 0.06 },
    { companyName: 'Energía Clara', priceKwhP1: 0.16, priceKwhP2: 0.15, priceKwhP3: 0.14, priceKwhP4: 0.13, priceKwhP5: 0.12, priceKwhP6: 0.11, fixedTerm: 4.58, promo: 'Precio fijo', pricePowerP1: 0.095, pricePowerP2: 0.085, pricePowerP3: 0.075, pricePowerP4: 0.065, pricePowerP5: 0.055, pricePowerP6: 0.045, surplusCompensationPrice: 0.055 },
    { companyName: 'Solaria Power', priceKwhP1: 0.155, priceKwhP2: 0.145, priceKwhP3: 0.135, priceKwhP4: 0.125, priceKwhP5: 0.115, priceKwhP6: 0.105, fixedTerm: 5.42, promo: 'Sin permanencia', pricePowerP1: 0.11, pricePowerP2: 0.09, pricePowerP3: 0.08, pricePowerP4: 0.07, pricePowerP5: 0.06, pricePowerP6: 0.05, surplusCompensationPrice: 0.065 },
    { companyName: 'Iberdrola', priceKwhP1: 0.20, priceKwhP2: 0.19, priceKwhP3: 0.18, priceKwhP4: 0.17, priceKwhP5: 0.16, priceKwhP6: 0.15, fixedTerm: 6.67, promo: 'Plan Noche', pricePowerP1: 0.12, pricePowerP2: 0.10, pricePowerP3: 0.09, pricePowerP4: 0.08, pricePowerP5: 0.07, pricePowerP6: 0.06, surplusCompensationPrice: 0.04 },
];


// Function to parse CSV data, assuming semicolon delimiter
function parseCsv(text: string): any[][] {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
  return lines.map(line => {
    return line.split(';').map(field => field.replace(/"/g, '').trim());
  });
}


export async function simulateCost(formData: FormData): Promise<ActionResponse> {
  const validatedFields = formSchema.safeParse({
    file: formData.get('file'),
  });

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors.file;
    const issueDescription = `El usuario intentó subir un archivo, pero hubo un error de validación. El error fue: ${errorMessages?.join(', ') || 'Archivo no válido'}. El archivo podría estar vacío o no ser un archivo.`;

    try {
        const help = await getContextualHelp({ issueDescription });
        return {
            success: false,
            error: errorMessages?.[0] || 'Error de validación.',
            helpMessage: help.helpMessage,
            aiSummary: null,
        };
    } catch (aiError) {
        console.error("AI help generation failed:", aiError);
        return {
            success: false,
            error: errorMessages?.[0] || 'Error de validación.',
            helpMessage: "Asegúrate de seleccionar un archivo Excel (.xlsx, .xls) o CSV que no esté vacío. El archivo debe contener los datos correctos para que podamos procesarlo.",
            aiSummary: null,
        };
    }
  }

  try {
    const availableTariffs: Tariff[] = MOCK_TARIFFS.map((t, i) => ({...t, id: (i+1).toString()}));

    const file = validatedFields.data.file as File;
    const buffer = await file.arrayBuffer();

    let rawData: any[][];

    // Check if it's a CSV or Excel file
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
         try {
            // Attempt to decode with different common encodings
            const decoders = [
                new TextDecoder('utf-8'),
                new TextDecoder('latin1'),
                new TextDecoder('utf-16le'),
                new TextDecoder('utf-16be')
            ];
            let decodedText = '';
            for (const decoder of decoders) {
                try {
                    decodedText = decoder.decode(buffer);
                    // A simple heuristic to check if decoding was successful
                    if (decodedText.includes(';')) {
                        break;
                    }
                } catch (e) {
                    // try next decoder
                }
            }
             if (!decodedText) {
                throw new Error("No se pudo decodificar el archivo CSV. Pruebe a guardarlo con codificación UTF-8.");
            }
            rawData = parseCsv(decodedText);
        } catch (e: any) {
            throw new Error(`Error al procesar el archivo CSV: ${e.message}`);
        }

    } else if (file.type.includes('spreadsheetml') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            throw new Error("No se encontraron hojas en el archivo Excel.");
        }
        rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    }
    else {
        throw new Error("Formato de archivo no soportado. Por favor, sube un archivo Excel o CSV.");
    }

    const lecturasHeaderIndex = rawData.findIndex(row => row.some(cell => typeof cell === 'string' && cell.includes('Datos lecturas')));

    if (lecturasHeaderIndex === -1) {
        throw new Error("No se encontró la sección 'Datos lecturas' en el archivo.");
    }

    const headersRowIndex = lecturasHeaderIndex + 2;
    const dataRows = rawData.slice(headersRowIndex + 1);

    const headers: string[] = rawData[headersRowIndex].map((h: any) => String(h).trim());
    const consumoP1Index = headers.indexOf('Consumo Activa P1');
    const consumoP2Index = headers.indexOf('Consumo Activa P2');
    const consumoP3Index = headers.indexOf('Consumo Activa P3');
    const consumoP4Index = headers.indexOf('Consumo Activa P4');
    const consumoP5Index = headers.indexOf('Consumo Activa P5');
    const consumoP6Index = headers.indexOf('Consumo Activa P6');

    if ([consumoP1Index, consumoP2Index, consumoP3Index, consumoP4Index, consumoP5Index, consumoP6Index].some(i => i === -1)) { // Check for P1-P6
        throw new Error("No se encontraron las columnas de consumo ('Consumo Activa P1' a 'P6') en la sección 'Datos lecturas'.");
    }

    let totalKwhP1 = 0, totalKwhP2 = 0, totalKwhP3 = 0, totalKwhP4 = 0, totalKwhP5 = 0, totalKwhP6 = 0;

    for (const row of dataRows) {
        if (!row || row.length === 0 || !row[0]) continue; // Skip empty/invalid rows

        totalKwhP1 += parseFloat(String(row[consumoP1Index]).replace(',', '.')) || 0;
        totalKwhP2 += parseFloat(String(row[consumoP2Index]).replace(',', '.')) || 0;
        totalKwhP3 += parseFloat(String(row[consumoP3Index]).replace(',', '.')) || 0;
        totalKwhP4 += parseFloat(String(row[consumoP4Index]).replace(',', '.')) || 0;
        totalKwhP5 += parseFloat(String(row[consumoP5Index]).replace(',', '.')) || 0;
        totalKwhP6 += parseFloat(String(row[consumoP6Index]).replace(',', '.')) || 0;
    }

    const totalKwh = totalKwhP1 + totalKwhP2 + totalKwhP3 + totalKwhP4 + totalKwhP5 + totalKwhP6;

    if (totalKwh === 0) {
        throw new Error("No se pudo calcular un consumo total a partir del archivo. Verifique que los datos de consumo son correctos.");
    }

    const userCurrentTariffName = 'Tu Compañía Actual';

    let details: CompanyCost[] = availableTariffs.map((tariff, index) => {
      const fixedFee = tariff.fixedTerm * 12;
      const consumptionCost =
        (tariff.priceKwhP1 * totalKwhP1) +
        (tariff.priceKwhP2 * totalKwhP2) +
        (tariff.priceKwhP3 * totalKwhP3) +
        (tariff.priceKwhP4 * totalKwhP4) +
        (tariff.priceKwhP5 * totalKwhP5) +
        (tariff.priceKwhP6 * totalKwhP6);

      const otherCosts = 25.00 + (index * 2); // Mocked other costs
      const totalCost = fixedFee + consumptionCost + otherCosts;

      return {
        id: tariff.id,
        rank: 0,
        name: tariff.companyName,
        fixedFee,
        consumptionCost,
        otherCosts,
        totalCost,
      };
    });

    details.sort((a, b) => a.totalCost - b.totalCost);
    details = details.map((detail, index) => ({ ...detail, rank: index + 1 }));

    const userCurrentCost = details.find(d => d.name === userCurrentTariffName);
    const bestOption = details[0];
    let savings = 0;
    if (userCurrentCost && bestOption) {
      savings = userCurrentCost.totalCost - bestOption.totalCost;
    }

    const resultData: SimulationResult = {
      summary: {
        totalKwh,
        totalKwhP1,
        totalKwhP2,
        totalKwhP3,
        totalKwhP4,
        totalKwhP5,
        totalKwhP6,
        period: 'Año Completo',
        bestOption: {
          companyName: bestOption.name,
          savings: savings > 0 ? savings : 0,
        },
      },
      details,
    };

    let aiSummary = null;
    try {
      if (userCurrentCost && resultData.summary.bestOption.savings > 0) {
        const summary = await summarizeSimulationResults({
          currentCompanyName: userCurrentCost.name,
          bestOptionCompanyName: resultData.summary.bestOption.companyName,
          estimatedSavings: resultData.summary.bestOption.savings,
          totalConsumptionKwh: resultData.summary.totalKwh
        });
        aiSummary = summary.summary;
      }
    } catch (aiError) {
        console.error("AI summary generation failed:", aiError);
        aiSummary = null;
    }

    return {
      success: true,
      data: resultData,
      aiSummary: aiSummary,
    };

  } catch(error: any) {
    console.error("Simulation failed:", error);
    const issueDescription = `El usuario subió un archivo, pero falló el procesamiento con el error: ${error.message}. El formato del archivo podría ser incorrecto o estar corrupto.`;

    try {
        const help = await getContextualHelp({ issueDescription });
        return {
            success: false,
            error: error.message || 'Error al procesar el archivo.',
            helpMessage: help.helpMessage,
            aiSummary: null,
        };
    } catch (aiError) {
         return {
            success: false,
            error: error.message || 'Error al procesar el archivo.',
            helpMessage: "Asegúrate de que el archivo Excel o CSV no esté corrupto y que contenga una sección 'Datos lecturas' con las columnas de consumo requeridas.",
            aiSummary: null
        }
    }
  }
}

    