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
    const { firestore } = initializeFirebase();
    const tariffsCol = collection(firestore, 'tariffs');
    const snapshot = await getDocs(tariffsCol);
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
            helpMessage: "Asegúrate de seleccionar un archivo Excel (.xlsx, .xls) que no esté vacío. El archivo debe contener la pestaña 'Consumo' con los datos correctos para que podamos procesarlo.",
            aiSummary: null,
        };
    }
  }

  try {
    const file = validatedFields.data.file;
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    // 1. Read consumption data from 'Consumo' sheet
    const consumptionSheet = workbook.Sheets['Consumo'];
    if (!consumptionSheet) {
      throw new Error("No se encontró la pestaña 'Consumo' en el archivo Excel.");
    }
    const consumptionData: { Mes: string; Consumo_kWh: number }[] = xlsx.utils.sheet_to_json(consumptionSheet);
    const totalKwh = consumptionData.reduce((acc, row) => acc + row.Consumo_kWh, 0);
    const userCurrentTariffName = 'Tu Compañía Actual';

    // 2. Read tariffs from Firestore
    const availableTariffs = await getTariffsFromFirestore();
    if (availableTariffs.length === 0) {
        throw new Error("No hay tarifas configuradas en la base de datos. Por favor, añada tarifas en la página de 'Tarifas'.");
    }

    // 3. Calculate cost for each tariff
    let details: CompanyCost[] = availableTariffs.map((tariff, index) => {
      const fixedFee = tariff.fixedTerm * 12;
      const consumptionCost = tariff.priceKwh * totalKwh;
      // Note: 'otherCosts' are not in the file, so we'll use a placeholder or assume 0
      const otherCosts = 25.00 + (index * 2); // Placeholder logic
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
    return {
      success: false,
      error: error.message || 'Error al procesar el archivo Excel.',
      helpMessage: "Asegúrate de que el archivo Excel tiene el formato correcto, incluyendo una pestaña llamada 'Consumo' con las columnas 'Mes' y 'Consumo_kWh'.",
      aiSummary: null
    }
  }
}
