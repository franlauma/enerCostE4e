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
            helpMessage: "Asegúrate de seleccionar un archivo Excel (.xlsx, .xls) que no esté vacío. El archivo debe contener los datos correctos para que podamos procesarlo.",
            aiSummary: null,
        };
    }
  }

  try {
    const file = validatedFields.data.file;
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    // For this complex file, we assume data is on the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        throw new Error("No se encontraron hojas en el archivo Excel.");
    }
    
    // Convert sheet to a 2D array to find the "Datos lecturas" section
    const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const lecturasHeaderIndex = rawData.findIndex(row => row[0] === 'Datos lecturas');
    
    if (lecturasHeaderIndex === -1) {
        throw new Error("No se encontró la sección 'Datos lecturas' en el archivo.");
    }
    
    // The actual data starts a few rows after the "Datos lecturas" header
    const headersRowIndex = lecturasHeaderIndex + 2;
    const dataRows = rawData.slice(headersRowIndex + 1);
    
    // Map headers to their column index
    const headers: string[] = rawData[headersRowIndex].map((h: any) => String(h));
    const consumoP1Index = headers.indexOf('Consumo Activa P1');
    const consumoP2Index = headers.indexOf('Consumo Activa P2');
    const consumoP3Index = headers.indexOf('Consumo Activa P3');

    if (consumoP1Index === -1 || consumoP2Index === -1 || consumoP3Index === -1) {
        throw new Error("No se encontraron las columnas de consumo ('Consumo Activa P1', 'P2', 'P3') en la sección 'Datos lecturas'.");
    }

    let totalKwh = 0;
    for (const row of dataRows) {
        if (!row || row.length === 0 || !row[0]) continue; // Skip empty/invalid rows

        const p1 = parseFloat(String(row[consumoP1Index]).replace(',', '.')) || 0;
        const p2 = parseFloat(String(row[consumoP2Index]).replace(',', '.')) || 0;
        const p3 = parseFloat(String(row[consumoP3Index]).replace(',', '.')) || 0;
        totalKwh += p1 + p2 + p3;
    }

    if (totalKwh === 0) {
        throw new Error("No se pudo calcular un consumo total a partir del archivo. Verifique que los datos de consumo son correctos.");
    }

    // 2. Read tariffs from Firestore
    const availableTariffs = await getTariffsFromFirestore();
    if (availableTariffs.length === 0) {
        throw new Error("No hay tarifas configuradas en la base de datos. Por favor, añada tarifas en la página de 'Tarifas'.");
    }

    // This is a placeholder as the user's current company is not in this file format
    const userCurrentTariffName = 'Tu Compañía Actual';

    // 3. Calculate cost for each tariff
    let details: CompanyCost[] = availableTariffs.map((tariff, index) => {
      const fixedFee = tariff.fixedTerm * 12;
      const consumptionCost = tariff.priceKwh * totalKwh;
      const otherCosts = 25.00 + (index * 2); // Placeholder logic for other costs
      const totalCost = fixedFee + consumptionCost + otherCosts;
      
      return {
        id: tariff.id,
        rank: 0, // Rank will be calculated later
        name: tariff.companyName,
        fixedFee,
        consumptionCost,
        otherCosts,
        totalCost,
      };
    });

    // 4. Rank results
    details.sort((a, b) => a.totalCost - b.totalCost);
    details = details.map((detail, index) => ({ ...detail, rank: index + 1 }));

    // 5. Find user's current cost and calculate savings
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
    
    // 6. After getting the result, call the AI to generate a summary.
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
        // Don't block the user if the summary fails. We can proceed without it.
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
            error: error.message || 'Error al procesar el archivo Excel.',
            helpMessage: help.helpMessage,
            aiSummary: null,
        };
    } catch (aiError) {
         return {
            success: false,
            error: error.message || 'Error al procesar el archivo Excel.',
            helpMessage: "Asegúrate de que el archivo Excel no esté corrupto y que contenga una sección 'Datos lecturas' con las columnas 'Consumo Activa P1', 'Consumo Activa P2' y 'Consumo Activa P3'.",
            aiSummary: null
        }
    }
  }
}
