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
import { Edit, Save, X, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const EMPTY_TARIFF: Tariff = { id: '', companyName: '', priceKwh: 0, fixedTerm: 0, promo: '' };

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>(MOCK_TARIFFS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTariff, setEditedTariff] = useState<Partial<Tariff>>({});
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleEdit = (tariff: Tariff) => {
    setEditingId(tariff.id);
    setEditedTariff(tariff);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedTariff({});
    setIsAdding(false);
  };
  
  const handleAddNew = () => {
    setIsAdding(true);
    setEditedTariff(EMPTY_TARIFF);
    setEditingId(null);
  }

  const handleSave = () => {
    // Validate inputs
    if (!editedTariff.companyName || editedTariff.priceKwh! <= 0 || editedTariff.fixedTerm! < 0) {
      toast({
        variant: "destructive",
        title: 'Error de validación',
        description: 'Por favor, completa todos los campos correctamente.',
      });
      return;
    }

    if(isAdding) {
      const newTariff: Tariff = {
        id: (tariffs.length + 1).toString(),
        companyName: editedTariff.companyName!,
        priceKwh: editedTariff.priceKwh!,
        fixedTerm: editedTariff.fixedTerm!,
        promo: editedTariff.promo || '',
      };
      setTariffs([...tariffs, newTariff]);
      toast({
        title: 'Tarifa añadida',
        description: `La tarifa de ${newTariff.companyName} se ha añadido correctamente.`,
      });
    } else if (editingId) {
      setTariffs(tariffs.map(t => (t.id === editingId ? { ...t, ...editedTariff } as Tariff : t)));
      toast({
        title: 'Tarifa guardada',
        description: 'Los cambios en la tarifa se han guardado correctamente.',
      });
    }
    
    handleCancel();
  };
  
  const handleDelete = (id: string) => {
    setTariffs(tariffs.filter(t => t.id !== id));
    toast({
        variant: "destructive",
        title: 'Tarifa eliminada',
        description: 'La tarifa ha sido eliminada.',
    });
  }

  const handleInputChange = (field: keyof Tariff, value: string) => {
    const isNumeric = ['priceKwh', 'fixedTerm'].includes(field);
    setEditedTariff({
      ...editedTariff,
      [field]: isNumeric ? Number(value) : value,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const renderEditRow = (tariff: Partial<Tariff>) => (
    <TableRow className="bg-muted/50">
        <TableCell>
            <Input
            value={tariff.companyName || ''}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="h-8 bg-background"
            placeholder="Nombre de la compañía"
            />
        </TableCell>
        <TableCell className="text-right">
            <Input
            type="number"
            value={tariff.priceKwh || ''}
            onChange={(e) => handleInputChange('priceKwh', e.target.value)}
            className="h-8 w-24 text-right ml-auto bg-background"
            placeholder="0.15"
            />
        </TableCell>
        <TableCell className="text-right">
            <Input
            type="number"
            value={tariff.fixedTerm || ''}
            onChange={(e) => handleInputChange('fixedTerm', e.target.value)}
            className="h-8 w-24 text-right ml-auto bg-background"
            placeholder="5.00"
            />
        </TableCell>
        <TableCell>
            <Input
            value={tariff.promo || ''}
            onChange={(e) => handleInputChange('promo', e.target.value)}
            className="h-8 bg-background"
            placeholder="Ej: 20% dto."
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
    </TableRow>
  )

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h1 className="text-3xl font-headline font-bold tracking-tight">Gestión de Tarifas</h1>
          <Button onClick={handleAddNew} disabled={isAdding || !!editingId}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Nueva Tarifa
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Tarifas Eléctricas</CardTitle>
            <CardDescription>
              Aquí puedes ver, editar, añadir o eliminar las tarifas de las compañías eléctricas que se utilizan en la simulación.
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
                    editingId === tariff.id ? renderEditRow(editedTariff) :
                    <TableRow key={tariff.id}>
                        <>
                          <TableCell className="font-medium">{tariff.companyName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(tariff.priceKwh)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(tariff.fixedTerm)}</TableCell>
                          <TableCell>{tariff.promo}</TableCell>
                          <TableCell className="text-center">
                            <div className='flex items-center justify-center gap-1'>
                                <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => handleEdit(tariff)} disabled={isAdding || !!editingId}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className='h-8 w-8 text-destructive hover:text-destructive' disabled={isAdding || !!editingId}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente la tarifa de <span className='font-medium'>{tariff.companyName}</span>.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(tariff.id)}>Eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </div>
                          </TableCell>
                        </>
                    </TableRow>
                  ))}
                  {isAdding && renderEditRow(editedTariff)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
