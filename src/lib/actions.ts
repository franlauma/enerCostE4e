'use server';

import { z } from 'zod';
import { MOCK_SIMULATION_RESULT, type SimulationResult } from '@/lib/data';
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

export async function simulateCost(formData: FormData): Promise<ActionResponse> {
  // Artificial delay to simulate processing
  await new Promise(resolve => setTimeout(resolve, 1500));

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
            helpMessage: "Asegúrate de seleccionar un archivo Excel (.xlsx, .xls) que no esté vacío. El archivo debe contener las pestañas 'Consumo' y 'Tarifas' con los datos correctos para que podamos procesarlo.",
            aiSummary: null,
        };
    }
  }

  // In a real app, process the file here. For now, we use mock data.
  const resultData = MOCK_SIMULATION_RESULT;
  
  // After getting the result, call the AI to generate a summary.
  let aiSummary = null;
  try {
    const currentCompany = resultData.details.find(d => d.name.includes('Tu Compañía Actual'));
    if (currentCompany && resultData.summary.bestOption.savings > 0) {
      const summary = await summarizeSimulationResults({
        currentCompanyName: currentCompany.name,
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
}
