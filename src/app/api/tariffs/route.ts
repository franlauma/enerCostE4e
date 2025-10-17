import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const TARIFFS_FILE = path.join(process.cwd(), 'src/lib/tariffs.json');

export async function GET() {
  try {
    const fileContents = await fs.readFile(TARIFFS_FILE, 'utf8');
    const tariffs = JSON.parse(fileContents);
    return NextResponse.json(tariffs);
  } catch (error) {
    console.error('Error reading tariffs file:', error);
    return NextResponse.json({ error: 'Failed to read tariffs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newTariff = await request.json();
    
    // Leer tarifas existentes
    const fileContents = await fs.readFile(TARIFFS_FILE, 'utf8');
    const tariffs = JSON.parse(fileContents);
    
    // Agregar nueva tarifa
    const tariffWithId = {
      ...newTariff,
      id: Date.now().toString(),
    };
    tariffs.push(tariffWithId);
    
    // Guardar archivo
    await fs.writeFile(TARIFFS_FILE, JSON.stringify(tariffs, null, 2));
    
    return NextResponse.json(tariffWithId, { status: 201 });
  } catch (error) {
    console.error('Error creating tariff:', error);
    return NextResponse.json({ error: 'Failed to create tariff' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedTariff = await request.json();
    
    // Leer tarifas existentes
    const fileContents = await fs.readFile(TARIFFS_FILE, 'utf8');
    const tariffs = JSON.parse(fileContents);
    
    // Actualizar tarifa
    const index = tariffs.findIndex((t: any) => t.id === updatedTariff.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Tariff not found' }, { status: 404 });
    }
    
    tariffs[index] = updatedTariff;
    
    // Guardar archivo
    await fs.writeFile(TARIFFS_FILE, JSON.stringify(tariffs, null, 2));
    
    return NextResponse.json(updatedTariff);
  } catch (error) {
    console.error('Error updating tariff:', error);
    return NextResponse.json({ error: 'Failed to update tariff' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Tariff ID is required' }, { status: 400 });
    }
    
    // Leer tarifas existentes
    const fileContents = await fs.readFile(TARIFFS_FILE, 'utf8');
    const tariffs = JSON.parse(fileContents);
    
    // Eliminar tarifa
    const filteredTariffs = tariffs.filter((t: any) => t.id !== id);
    
    if (filteredTariffs.length === tariffs.length) {
      return NextResponse.json({ error: 'Tariff not found' }, { status: 404 });
    }
    
    // Guardar archivo
    await fs.writeFile(TARIFFS_FILE, JSON.stringify(filteredTariffs, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tariff:', error);
    return NextResponse.json({ error: 'Failed to delete tariff' }, { status: 500 });
  }
}
