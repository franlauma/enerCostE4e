'use server';

import { z } from 'zod';
import { MOCK_SIMULATION_RESULT, type SimulationResult } from '@/lib/data';
import { getContextualHelp } from '@/ai/flows/contextual-assistance';

const formSchema = z.object({
  file: z.any().refine(file => file instanceof File && file.size > 0, 'El archivo no puede estar vacío.'),
});

type ActionResponse = {
  success: boolean;
  data?: SimulationResult;
  error?: string;
  helpMessage?: string | null;
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
        };
    } catch (aiError) {
        console.error("AI help generation failed:", aiError);
        return {
            success: false,
            error: errorMessages?.[0] || 'Error de validación.',
            helpMessage: "Asegúrate de seleccionar un archivo Excel (.xlsx, .xls) que no esté vacío. El archivo debe contener las pestañas 'Consumo' y 'Tarifas' con los datos correctos para que podamos procesarlo.",
        };
    }
  }

  // In a real app, you would use a library like 'xlsx' to read the file:
  // const file = validatedFields.data.file;
  // const bytes = await file.arrayBuffer();
  // const workbook = xlsx.read(bytes, { type: 'buffer' });
  // ... process workbook data to generate a real result ...
  
  // For this demo, we successfully return mock data
  return {
    success: true,
    data: MOCK_SIMULATION_RESULT,
  };
}
