'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MOCK_TARIFFS, type Tariff } from '@/lib/data';
import { Edit, Save, X, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>(MOCK_TARIFFS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTariff, setEditedTariff] = useState<Partial<Tariff>>({});
  const { toast } = useToast();

  const handleEdit = (tariff: Tariff) => {
    setEditingId(tariff.id);
    setEditedTariff(tariff);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedTariff({});
  };

  const handleSave = () => {
    if (!editingId) return;

    setTariffs(tariffs.map(t => (t.id === editingId ? { ...t, ...editedTariff } as Tariff : t)));
    setEditingId(null);
    setEditedTariff({});
    toast({
      title: 'Tarifa guardada',
      description: 'Los cambios en la tarifa se han guardado correctamente.',
    });
  };

  const handleInputChange = (field: keyof Tariff, value: string) => {
    const isNumeric = ['priceKwh', 'fixedTerm'].includes(field);
    setEditedTariff({
      ...editedTariff,
      [field]: isNumeric ? Number(value) : value,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  }

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h1 className="text-3xl font-headline font-bold tracking-tight">Gestión de Tarifas</h1>
          <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Nueva Tarifa
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Tarifas Eléctricas</CardTitle>
            <CardDescription>
              Aquí puedes ver y editar las tarifas de las compañías eléctricas que se utilizan en la simulación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compañía</TableHead>
                    <TableHead className="text-right">Precio kWh</TableHead>
                    <TableHead className="text-right">Término Fijo (€/mes)</TableHead>
                    <TableHead>Promoción</TableHead>
                    <TableHead className="w-[120px] text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tariffs.map(tariff => (
                    <TableRow key={tariff.id}>
                      {editingId === tariff.id ? (
                        <>
                          <TableCell>
                            <Input
                              value={editedTariff.companyName || ''}
                              onChange={(e) => handleInputChange('companyName', e.target.value)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                             <Input
                              type="number"
                              value={editedTariff.priceKwh || ''}
                              onChange={(e) => handleInputChange('priceKwh', e.target.value)}
                              className="h-8 w-24 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                             <Input
                              type="number"
                              value={editedTariff.fixedTerm || ''}
                              onChange={(e) => handleInputChange('fixedTerm', e.target.value)}
                              className="h-8 w-24 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell>
                             <Input
                              value={editedTariff.promo || ''}
                              onChange={(e) => handleInputChange('promo', e.target.value)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                               <Button variant="ghost" size="icon" onClick={handleSave} className="h-8 w-8 text-green-600 hover:text-green-700">
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8 text-red-600 hover:text-red-700">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{tariff.companyName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(tariff.priceKwh)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(tariff.fixedTerm)}</TableCell>
                          <TableCell>{tariff.promo}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(tariff)}>
                              <Edit className="mr-1 h-3 w-3" />
                              Editar
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
