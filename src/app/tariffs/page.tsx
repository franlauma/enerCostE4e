
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

const EMPTY_TARIFF: Omit<Tariff, 'id'> = { 
    companyName: '', 
    priceKwhP1: 0, 
    priceKwhP2: 0, 
    priceKwhP3: 0, 
    priceKwhP4: 0, 
    priceKwhP5: 0, 
    priceKwhP6: 0, 
    fixedTerm: 0,
    pricePowerP1: 0,
    pricePowerP2: 0,
    pricePowerP3: 0,
    pricePowerP4: 0,
    pricePowerP5: 0,
    pricePowerP6: 0,
    surplusCompensationPrice: 0,
    promo: '' 
};

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
    // Basic validation
    if (!editedTariff.companyName || editedTariff.fixedTerm! < 0) {
      toast({
        variant: "destructive",
        title: 'Error de validación',
        description: 'El nombre de la compañía y el término fijo son obligatorios.',
      });
      setIsSaving(false);
      return;
    }

    try {
      const tariffData = {
        companyName: editedTariff.companyName!,
        priceKwhP1: editedTariff.priceKwhP1 || 0,
        priceKwhP2: editedTariff.priceKwhP2 || 0,
        priceKwhP3: editedTariff.priceKwhP3 || 0,
        priceKwhP4: editedTariff.priceKwhP4 || 0,
        priceKwhP5: editedTariff.priceKwhP5 || 0,
        priceKwhP6: editedTariff.priceKwhP6 || 0,
        fixedTerm: editedTariff.fixedTerm!,
        pricePowerP1: editedTariff.pricePowerP1 || 0,
        pricePowerP2: editedTariff.pricePowerP2 || 0,
        pricePowerP3: editedTariff.pricePowerP3 || 0,
        pricePowerP4: editedTariff.pricePowerP4 || 0,
        pricePowerP5: editedTariff.pricePowerP5 || 0,
        pricePowerP6: editedTariff.pricePowerP6 || 0,
        surplusCompensationPrice: editedTariff.surplusCompensationPrice || 0,
        promo: editedTariff.promo || '',
      };

      if(isAdding) {
        await addDoc(collection(firestore, 'tariffs'), tariffData);
        toast({
          title: 'Tarifa añadida',
          description: `La tarifa de ${tariffData.companyName} se ha añadido correctamente.`,
        });
      } else if (editingId) {
        const docRef = doc(firestore, 'tariffs', editingId);
        await updateDoc(docRef, tariffData);
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
    const isNumeric = !['companyName', 'promo', 'id'].includes(field);
    setEditedTariff({
      ...editedTariff,
      [field]: isNumeric ? Number(value) : value,
    });
  };

  const formatCurrency = (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', ...options }).format(value);
  };
  
  const renderInput = (field: keyof Tariff, placeholder: string) => (
     <Input
        type="number"
        step="0.0001"
        value={editedTariff[field] as number || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className="h-8 w-28 text-right ml-auto bg-background"
        placeholder={placeholder}
        disabled={isSaving}
    />
  );


  const renderEditRow = (tariff: Partial<Tariff>) => (
    <TableRow className="bg-muted/50">
        <TableCell>
            <Input
            value={tariff.companyName || ''}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="h-8 bg-background"
            placeholder="Nombre compañía"
            disabled={isSaving}
            />
        </TableCell>
        <TableCell colSpan={6} className="p-1">
            <div className='grid grid-cols-6 gap-1'>
                {renderInput('priceKwhP1', '0.15')}
                {renderInput('priceKwhP2', '0.14')}
                {renderInput('priceKwhP3', '0.12')}
                {renderInput('priceKwhP4', '0.11')}
                {renderInput('priceKwhP5', '0.10')}
                {renderInput('priceKwhP6', '0.09')}
            </div>
        </TableCell>
        <TableCell colSpan={6} className="p-1">
            <div className='grid grid-cols-6 gap-1'>
                {renderInput('pricePowerP1', '0.09')}
                {renderInput('pricePowerP2', '0.08')}
                {renderInput('pricePowerP3', '0.07')}
                {renderInput('pricePowerP4', '0.06')}
                {renderInput('pricePowerP5', '0.05')}
                {renderInput('pricePowerP6', '0.04')}
            </div>
        </TableCell>
        <TableCell>{renderInput('fixedTerm', '5.00')}</TableCell>
        <TableCell>{renderInput('surplusCompensationPrice', '0.05')}</TableCell>
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
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            {Array.from({ length: 16 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-16" /></TableCell>)}
        </TableRow>
      ));
    }
    if (!tariffs || tariffs.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={17} className="text-center h-24">
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
                <TableCell className="text-right">{formatCurrency(tariff.priceKwhP1, {minimumFractionDigits: 4})}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.priceKwhP2, {minimumFractionDigits: 4})}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.priceKwhP3, {minimumFractionDigits: 4})}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.priceKwhP4, {minimumFractionDigits: 4})}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.priceKwhP5, {minimumFractionDigits: 4})}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.priceKwhP6, {minimumFractionDigits: 4})}</TableCell>
                
                <TableCell className="text-right">{formatCurrency(tariff.pricePowerP1, {minimumFractionDigits: 4})}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.pricePowerP2, {minimumFractionDigits: 4})}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.pricePowerP3, {minimumFractionDigits: 4})}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.pricePowerP4, {minimumFractionDigits: 4})}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.pricePowerP5, {minimumFractionDigits: 4})}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.pricePowerP6, {minimumFractionDigits: 4})}</TableCell>
                
                <TableCell className="text-right">{formatCurrency(tariff.fixedTerm)}</TableCell>
                <TableCell className="text-right">{formatCurrency(tariff.surplusCompensationPrice, {minimumFractionDigits: 4})}</TableCell>
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
    <main className="flex-1 w-full max-w-full mx-auto px-4 py-8 md:px-6 md:py-12 overflow-x-auto">
      <div className="w-full space-y-8 min-w-[1600px]">
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
              Aquí puedes ver y gestionar las tarifas eléctricas con discriminación horaria (P1 a P6).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2} className="sticky left-0 bg-card">Compañía</TableHead>
                    <TableHead colSpan={6} className="text-center">Precios Energía (€/kWh)</TableHead>
                    <TableHead colSpan={6} className="text-center">Precios Potencia (€/kW/día)</TableHead>
                    <TableHead rowSpan={2} className="text-right">Fijo (€/mes)</TableHead>
                    <TableHead rowSpan={2} className='text-right'>Comp. Exced. (€/kWh)</TableHead>
                    <TableHead rowSpan={2}>Promoción</TableHead>
                    <TableHead rowSpan={2} className="w-[120px] text-center sticky right-0 bg-card">Acciones</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-right">P1</TableHead>
                    <TableHead className="text-right">P2</TableHead>
                    <TableHead className="text-right">P3</TableHead>
                    <TableHead className="text-right">P4</TableHead>
                    <TableHead className="text-right">P5</TableHead>
                    <TableHead className="text-right">P6</TableHead>
                    <TableHead className="text-right">P1</TableHead>
                    <TableHead className="text-right">P2</TableHead>
                    <TableHead className="text-right">P3</TableHead>
                    <TableHead className="text-right">P4</TableHead>
                    <TableHead className="text-right">P5</TableHead>
                    <TableHead className="text-right">P6</TableHead>
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
