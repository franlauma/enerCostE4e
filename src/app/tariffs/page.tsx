
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Edit, Save, X, PlusCircle, Trash2, Loader2 } from 'lucide-react';
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
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const EMPTY_TARIFF: Omit<Tariff, 'id'> = { companyName: '', priceKwh: 0, fixedTerm: 0, promo: '' };

export default function TariffsPage() {
  const firestore = useFirestore();
  const tariffsQuery = useMemo(() => {
    if (!firestore) return null;
    const q = query(collection(firestore, 'tariffs'));
    // This is a temporary workaround to satisfy the memoization check in useCollection
    (q as any).__memo = true;
    return q;
  }, [firestore]);

  const { data: tariffs, isLoading: areTariffsLoading, error } = useCollection<Tariff>(tariffsQuery);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTariff, setEditedTariff] = useState<Partial<Tariff>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    // Validate inputs
    if (!editedTariff.companyName || editedTariff.priceKwh! <= 0 || editedTariff.fixedTerm! < 0) {
      toast({
        variant: "destructive",
        title: 'Error de validación',
        description: 'Por favor, completa todos los campos correctamente.',
      });
      setIsSaving(false);
      return;
    }

    try {
      if(isAdding) {
        const newTariffData = {
          companyName: editedTariff.companyName!,
          priceKwh: editedTariff.priceKwh!,
          fixedTerm: editedTariff.fixedTerm!,
          promo: editedTariff.promo || '',
        };
        const docRef = await addDoc(collection(firestore, 'tariffs'), newTariffData);
        toast({
          title: 'Tarifa añadida',
          description: `La tarifa de ${newTariffData.companyName} se ha añadido correctamente.`,
        });
      } else if (editingId) {
        const docRef = doc(firestore, 'tariffs', editingId);
        await updateDoc(docRef, editedTariff);
        toast({
          title: 'Tarifa guardada',
          description: 'Los cambios en la tarifa se han guardado correctamente.',
        });
      }
    } catch(e) {
        console.error("Error saving tariff:", e);
        toast({
            variant: "destructive",
            title: "Error al guardar",
            description: "No se pudo guardar la tarifa en la base de datos."
        });
    }
    
    setIsSaving(false);
    handleCancel();
  };
  
  const handleDelete = async (id: string, companyName: string) => {
    if (!firestore) return;
    try {
        const docRef = doc(firestore, 'tariffs', id);
        await deleteDoc(docRef);
        toast({
            variant: "destructive",
            title: 'Tarifa eliminada',
            description: `La tarifa de ${companyName} ha sido eliminada.`,
        });
    } catch(e) {
        console.error("Error deleting tariff: ", e);
        toast({
            variant: "destructive",
            title: "Error al eliminar",
            description: "No se pudo eliminar la tarifa de la base de datos."
        });
    }
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
            disabled={isSaving}
            />
        </TableCell>
        <TableCell className="text-right">
            <Input
            type="number"
            value={tariff.priceKwh || ''}
            onChange={(e) => handleInputChange('priceKwh', e.target.value)}
            className="h-8 w-24 text-right ml-auto bg-background"
            placeholder="0.15"
            disabled={isSaving}
            />
        </TableCell>
        <TableCell className="text-right">
            <Input
            type="number"
            value={tariff.fixedTerm || ''}
            onChange={(e) => handleInputChange('fixedTerm', e.target.value)}
            className="h-8 w-24 text-right ml-auto bg-background"
            placeholder="5.00"
            disabled={isSaving}
            />
        </TableCell>
        <TableCell>
            <Input
            value={tariff.promo || ''}
            onChange={(e) => handleInputChange('promo', e.target.value)}
            className="h-8 bg-background"
            placeholder="Ej: 20% dto."
            disabled={isSaving}
            />
        </TableCell>
        <TableCell className="text-center">
            <div className="flex justify-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleSave} className="h-8 w-8 text-green-600 hover:text-green-700" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8 text-red-600 hover:text-red-700" disabled={isSaving}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </TableCell>
    </TableRow>
  )

  const renderTariffRows = () => {
    if (areTariffsLoading) {
      return Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
        </TableRow>
      ));
    }
    if (!tariffs || tariffs.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                    No hay tarifas configuradas. Se crearán automáticamente al realizar una simulación.
                </TableCell>
            </TableRow>
        )
    }
    return tariffs.map(tariff => (
        editingId === tariff.id ? renderEditRow(editedTariff) :
        <TableRow key={tariff.id}>
            <>
                <TableCell className="font-medium">{tariff.companyName}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.priceKwh)}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.fixedTerm)}</TableCell>
                <TableCell>{tariff.promo}</TableCell>
                <TableCell className="text-center">
                <div className='flex items-center justify-center gap-1'>
                    <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => handleEdit(tariff)} disabled={isAdding || !!editingId || isSaving}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className='h-8 w-8 text-destructive hover:text-destructive' disabled={isAdding || !!editingId || isSaving}>
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
                            <AlertDialogAction onClick={() => handleDelete(tariff.id, tariff.companyName)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                </TableCell>
            </>
        </TableRow>
    ))
  }

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h1 className="text-3xl font-headline font-bold tracking-tight">Gestión de Tarifas</h1>
          <Button onClick={handleAddNew} disabled={isAdding || !!editingId || isSaving}>
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
                  {renderTariffRows()}
                  {isAdding && !isSaving && renderEditRow(editedTariff)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
