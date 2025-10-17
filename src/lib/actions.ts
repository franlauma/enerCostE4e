
'use server';

import { z } from 'zod';
import * as xlsx from 'xlsx';
import { MOCK_SIMULATION_RESULT, type SimulationResult, type CompanyCost, type Tariff } from '@/lib/data';
import { getContextualHelp } from '@/ai/flows/contextual-assistance';
import { summarizeSimulationResults } from '@/ai/flows/summarize-results-flow';
import { collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';

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

// Helper function to read tariffs from Firestore.
// We use a server-side initialized Firebase app for this.
async function getTariffsFromFirestore(): Promise<Tariff[]> {
    const { firestore } = await initializeFirebase();
    const tariffsCol = collection(firestore, 'tariffs');
    const snapshot = await getDocs(tariffsCol);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tariff));
}

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
    const file = validatedFields.data.file as File;
    const buffer = await file.arrayBuffer();
    
    let rawData: any[][];

    // Check if it's a CSV or Excel file
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const text = new TextDecoder('utf-16le').decode(buffer);
        rawData = parseCsv(text);
    } else {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            throw new Error("No se encontraron hojas en el archivo Excel.");
        }
        rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
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

    if ([consumoP1Index, consumoP2Index, consumoP3Index, consumoP4Index, consumoP5Index, consumoP6Index].some(i => i === -1)) {
        throw new Error("No se encontraron todas las columnas de consumo ('Consumo Activa P1' a 'P6') en la sección 'Datos lecturas'.");
    }

    let totalKwh = 0;
    for (const row of dataRows) {
        if (!row || row.length === 0 || !row[0]) continue; // Skip empty/invalid rows

        const p1 = parseFloat(String(row[consumoP1Index]).replace(',', '.')) || 0;
        const p2 = parseFloat(String(row[consumoP2Index]).replace(',', '.')) || 0;
        const p3 = parseFloat(String(row[consumoP3Index]).replace(',', '.')) || 0;
        const p4 = parseFloat(String(row[consumoP4Index]).replace(',', '.')) || 0;
        const p5 = parseFloat(String(row[consumoP5Index]).replace(',', '.')) || 0;
        const p6 = parseFloat(String(row[consumoP6Index]).replace(',', '.')) || 0;
        totalKwh += p1 + p2 + p3 + p4 + p5 + p6;
    }

    if (totalKwh === 0) {
        throw new Error("No se pudo calcular un consumo total a partir del archivo. Verifique que los datos de consumo son correctos.");
    }

    const availableTariffs = await getTariffsFromFirestore();
    if (availableTariffs.length === 0) {
        throw new Error("No hay tarifas configuradas en la base de datos. Por favor, añada tarifas en la página de 'Tarifas'.");
    }

    const userCurrentTariffName = 'Tu Compañía Actual';

    let details: CompanyCost[] = availableTariffs.map((tariff, index) => {
      const fixedFee = tariff.fixedTerm * 12;
      const consumptionCost = tariff.priceKwh * totalKwh;
      const otherCosts = 25.00 + (index * 2);
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
