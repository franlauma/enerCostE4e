
'use server';

import { z } from 'zod';
import * as xlsx from 'xlsx';
import { MOCK_SIMULATION_RESULT, type SimulationResult, type CompanyCost, type Tariff } from '@/lib/data';
import { getContextualHelp } from '@/ai/flows/contextual-assistance';
import { summarizeSimulationResults } from '@/ai/flows/summarize-results-flow';
import tariffs from './tariffs.json';


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
    const availableTariffs: Tariff[] = tariffs.map((t, i) => ({...t, id: (i+1).toString()}));

    const file = validatedFields.data.file as File;
    const buffer = await file.arrayBuffer();

    let rawData: any[][];

    // Check if it's a CSV or Excel file
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
         try {
            const decoders = [ new TextDecoder('utf-8'), new TextDecoder('latin1'), new TextDecoder('windows-1252') ];
            let decodedText = '';
            let lastError: any = null;
            for (const decoder of decoders) {
                try {
                    decodedText = decoder.decode(buffer);
                    if (decodedText.includes(';')) { // Simple check
                        lastError = null;
                        break; 
                    }
                } catch (e) {
                    lastError = e;
                }
            }
             if (lastError) {
                throw new Error(`No se pudo decodificar el archivo CSV. Error: ${lastError.message}. Pruebe a guardarlo con codificación UTF-8 o ISO-8859-1 (Latin1).`);
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

    const cleanedData = rawData.map(row => row.map(cell => typeof cell === 'string' ? cell.trim() : cell)).filter(row => row.length > 0 && row.some(cell => cell));

    // Find sections
    const suministroHeaderIndex = cleanedData.findIndex(row => row.some(cell => typeof cell === 'string' && cell.includes('Datos suministro')));
    const lecturasHeaderIndex = cleanedData.findIndex(row => row.some(cell => typeof cell === 'string' && cell.includes('Datos lecturas')));

    if (lecturasHeaderIndex === -1) {
        throw new Error("No se encontró la sección 'Datos lecturas' en el archivo.");
    }
    if (suministroHeaderIndex === -1) {
        throw new Error("No se encontró la sección 'Datos suministro' en el archivo.");
    }

    // --- Process consumption data ('Datos lecturas') ---
    const lecturasHeadersRow = cleanedData[lecturasHeaderIndex + 1];
    const lecturasDataRows = cleanedData.slice(lecturasHeaderIndex + 2);
    
    const lecturasHeaders: string[] = lecturasHeadersRow.map((h: any) => String(h).trim());
    const consumoP1Index = lecturasHeaders.indexOf('Consumo Activa P1');
    const consumoP2Index = lecturasHeaders.indexOf('Consumo Activa P2');
    const consumoP3Index = lecturasHeaders.indexOf('Consumo Activa P3');
    const consumoP4Index = lecturasHeaders.indexOf('Consumo Activa P4');
    const consumoP5Index = lecturasHeaders.indexOf('Consumo Activa P5');
    const consumoP6Index = lecturasHeaders.indexOf('Consumo Activa P6');

    if ([consumoP1Index, consumoP2Index, consumoP3Index, consumoP4Index, consumoP5Index, consumoP6Index].some(i => i === -1)) {
        throw new Error("No se encontraron las columnas de consumo ('Consumo Activa P1' a 'P6') en la sección 'Datos lecturas'.");
    }

    let totalKwhP1 = 0, totalKwhP2 = 0, totalKwhP3 = 0, totalKwhP4 = 0, totalKwhP5 = 0, totalKwhP6 = 0;

    for (const row of lecturasDataRows) {
        if (!row || row.length === 0 || !row[0]) continue;

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
    
    // --- Process supply data ('Datos suministro') ---
    const suministroHeadersRow = cleanedData[suministroHeaderIndex + 1];
    const suministroDataRow = cleanedData[suministroHeaderIndex + 2];

    const suministroHeaders: string[] = suministroHeadersRow.map((h: any) => String(h).trim());
    const potenciaP1Index = suministroHeaders.indexOf('Potencia Contratada P1');
    const potenciaP2Index = suministroHeaders.indexOf('Potencia Contratada P2');
    const potenciaP3Index = suministroHeaders.indexOf('Potencia Contratada P3');
    const potenciaP4Index = suministroHeaders.indexOf('Potencia Contratada P4');
    const potenciaP5Index = suministroHeaders.indexOf('Potencia Contratada P5');
    const potenciaP6Index = suministroHeaders.indexOf('Potencia Contratada P6');

    if ([potenciaP1Index, potenciaP2Index].some(i => i === -1)) { // At least P1 and P2 for power are common
        throw new Error("No se encontraron las columnas de potencia contratada ('Potencia Contratada P1', 'P2', etc.) en la sección 'Datos suministro'.");
    }

    const getPotencia = (index: number) => parseFloat(String(suministroDataRow[index]).replace(',', '.')) || 0;

    const potenciaContratada = {
        p1: getPotencia(potenciaP1Index),
        p2: getPotencia(potenciaP2Index),
        p3: getPotencia(potenciaP3Index),
        p4: getPotencia(potenciaP4Index),
        p5: getPotencia(potenciaP5Index),
        p6: getPotencia(potenciaP6Index),
    };
    
    // Assume 365 days for annual calculation
    const daysInPeriod = 365;

    // --- Perform Simulation ---
    const userCurrentTariffName = 'Tu Compañía Actual';

    let details: CompanyCost[] = availableTariffs.map((tariff) => {
      const consumptionCost =
        (tariff.priceKwhP1 * totalKwhP1) +
        (tariff.priceKwhP2 * totalKwhP2) +
        (tariff.priceKwhP3 * totalKwhP3) +
        (tariff.priceKwhP4 * totalKwhP4) +
        (tariff.priceKwhP5 * totalKwhP5) +
        (tariff.priceKwhP6 * totalKwhP6);

      const powerCost =
        ((tariff.pricePowerP1 || 0) * potenciaContratada.p1 * daysInPeriod) +
        ((tariff.pricePowerP2 || 0) * potenciaContratada.p2 * daysInPeriod) +
        ((tariff.pricePowerP3 || 0) * potenciaContratada.p3 * daysInPeriod) +
        ((tariff.pricePowerP4 || 0) * potenciaContratada.p4 * daysInPeriod) +
        ((tariff.pricePowerP5 || 0) * potenciaContratada.p5 * daysInPeriod) +
        ((tariff.pricePowerP6 || 0) * potenciaContratada.p6 * daysInPeriod);

      const fixedFee = (tariff.fixedTerm || 0) * 12;
      
      const otherCosts = powerCost; 
      
      // Impuesto Eléctrico (IE) - 0.5% (0.005), as per Spanish regulation in 2024 (it can vary)
      const subtotal = consumptionCost + otherCosts + fixedFee;
      const impuestoElectrico = subtotal * 0.005;

      // IVA - 21%
      const iva = (subtotal + impuestoElectrico) * 0.21;
      
      const totalCost = subtotal + impuestoElectrico + iva;

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
