'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Save, X, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

interface Tariff {
  id: string;
  companyName: string;
  priceKwhP1: number;
  priceKwhP2: number;
  priceKwhP3: number;
  priceKwhP4: number;
  priceKwhP5: number;
  priceKwhP6: number;
  pricePowerP1: number;
  pricePowerP2: number;
  pricePowerP3: number;
  pricePowerP4: number;
  pricePowerP5: number;
  pricePowerP6: number;
  surplusCompensationPrice: number;
  fixedTerm: number;
  promo: string;
}

const PERIODS = [
  { key: 'P1', label: 'P1 (Punta)', color: 'bg-red-100 text-red-800' },
  { key: 'P2', label: 'P2 (Llano)', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'P3', label: 'P3 (Valle)', color: 'bg-green-100 text-green-800' },
  { key: 'P4', label: 'P4', color: 'bg-blue-100 text-blue-800' },
  { key: 'P5', label: 'P5', color: 'bg-purple-100 text-purple-800' },
  { key: 'P6', label: 'P6', color: 'bg-indigo-100 text-indigo-800' },
];

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar tarifas desde el archivo JSON
  useEffect(() => {
    const loadTariffs = async () => {
      try {
        const response = await fetch('/api/tariffs');
        if (response.ok) {
          const data = await response.json();
          setTariffs(data);
        } else {
          // Fallback a datos locales
          const localTariffs = await import('@/lib/tariffs.json');
          setTariffs(localTariffs.default);
        }
      } catch (error) {
        console.error('Error loading tariffs:', error);
        // Fallback a datos locales
        const localTariffs = await import('@/lib/tariffs.json');
        setTariffs(localTariffs.default);
      }
      setIsLoading(false);
    };

    loadTariffs();
  }, []);

  const handleCreateTariff = () => {
    const newTariff: Tariff = {
      id: Date.now().toString(),
      companyName: '',
      priceKwhP1: 0,
      priceKwhP2: 0,
      priceKwhP3: 0,
      priceKwhP4: 0,
      priceKwhP5: 0,
      priceKwhP6: 0,
      pricePowerP1: 0,
      pricePowerP2: 0,
      pricePowerP3: 0,
      pricePowerP4: 0,
      pricePowerP5: 0,
      pricePowerP6: 0,
      surplusCompensationPrice: 0,
      fixedTerm: 0,
      promo: '',
    };
    setEditingTariff(newTariff);
    setIsDialogOpen(true);
  };

  const handleEditTariff = (tariff: Tariff) => {
    setEditingTariff({ ...tariff });
    setIsDialogOpen(true);
  };

  const handleDuplicateTariff = (tariff: Tariff) => {
    const duplicatedTariff: Tariff = {
      ...tariff,
      id: Date.now().toString(),
      companyName: `${tariff.companyName} (Copia)`,
      promo: `${tariff.promo} - Copia`,
    };
    setEditingTariff(duplicatedTariff);
    setIsDialogOpen(true);
  };

  const handleSaveTariff = () => {
    if (!editingTariff) return;

    if (!editingTariff.companyName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es obligatorio",
        variant: "destructive",
      });
      return;
    }

    const updatedTariffs = editingTariff.id && tariffs.find(t => t.id === editingTariff.id)
      ? tariffs.map(t => t.id === editingTariff.id ? editingTariff : t)
      : [...tariffs, { ...editingTariff, id: Date.now().toString() }];

    setTariffs(updatedTariffs);
    setIsDialogOpen(false);
    setEditingTariff(null);

    toast({
      title: "Éxito",
      description: "Tarifa guardada correctamente",
    });
  };

  const handleDeleteTariff = (tariffId: string) => {
    setTariffs(tariffs.filter(t => t.id !== tariffId));
    toast({
      title: "Éxito",
      description: "Tarifa eliminada correctamente",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 6,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando tarifas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Tarifas</h1>
          <p className="text-gray-600 mt-2">
            Administra las tarifas de energía para las simulaciones
          </p>
        </div>
        <Button onClick={handleCreateTariff} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Tarifa
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tariffs.map((tariff) => (
          <Card key={tariff.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{tariff.companyName}</CardTitle>
                  <CardDescription>{tariff.promo}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTariff(tariff)}
                    title="Editar tarifa"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicateTariff(tariff)}
                    title="Duplicar tarifa"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" title="Eliminar tarifa">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar tarifa?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará la tarifa de "{tariff.companyName}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTariff(tariff.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Precios Energía (€/kWh)</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {PERIODS.map((period) => (
                    <div key={period.key} className="flex justify-between">
                      <span className={period.color}>{period.label}:</span>
                      <span className="font-mono">
                        {formatPrice(tariff[`priceKwh${period.key}` as keyof Tariff] as number)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Precios Potencia (€/kW/día)</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {PERIODS.map((period) => (
                    <div key={period.key} className="flex justify-between">
                      <span className={period.color}>{period.label}:</span>
                      <span className="font-mono">
                        {formatPrice(tariff[`pricePower${period.key}` as keyof Tariff] as number)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Compensación excedente:</span>
                  <span className="font-mono">{formatPrice(tariff.surplusCompensationPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Término fijo:</span>
                  <span className="font-mono">{formatPrice(tariff.fixedTerm)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para crear/editar tarifa */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTariff?.id && tariffs.find(t => t.id === editingTariff.id) ? 'Editar Tarifa' : 'Nueva Tarifa'}
            </DialogTitle>
            <DialogDescription>
              Completa los datos de la tarifa energética
            </DialogDescription>
          </DialogHeader>

          {editingTariff && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                  <Input
                    id="companyName"
                    value={editingTariff.companyName}
                    onChange={(e) => setEditingTariff({ ...editingTariff, companyName: e.target.value })}
                    placeholder="Ej: Iberdrola, Endesa..."
                  />
                </div>
                <div>
                  <Label htmlFor="promo">Promoción/Descripción</Label>
                  <Input
                    id="promo"
                    value={editingTariff.promo}
                    onChange={(e) => setEditingTariff({ ...editingTariff, promo: e.target.value })}
                    placeholder="Ej: Sin permanencia, 20% descuento..."
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Precios de Energía (€/kWh)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {PERIODS.map((period) => (
                    <div key={period.key}>
                      <Label htmlFor={`priceKwh${period.key}`}>{period.label}</Label>
                      <Input
                        id={`priceKwh${period.key}`}
                        type="number"
                        step="0.000001"
                        value={editingTariff[`priceKwh${period.key}` as keyof Tariff]}
                        onChange={(e) => setEditingTariff({
                          ...editingTariff,
                          [`priceKwh${period.key}`]: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Precios de Potencia (€/kW/día)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {PERIODS.map((period) => (
                    <div key={period.key}>
                      <Label htmlFor={`pricePower${period.key}`}>{period.label}</Label>
                      <Input
                        id={`pricePower${period.key}`}
                        type="number"
                        step="0.000001"
                        value={editingTariff[`pricePower${period.key}` as keyof Tariff]}
                        onChange={(e) => setEditingTariff({
                          ...editingTariff,
                          [`pricePower${period.key}`]: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="surplusCompensationPrice">Compensación Excedente (€/kWh)</Label>
                  <Input
                    id="surplusCompensationPrice"
                    type="number"
                    step="0.000001"
                    value={editingTariff.surplusCompensationPrice}
                    onChange={(e) => setEditingTariff({ ...editingTariff, surplusCompensationPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="fixedTerm">Término Fijo (€)</Label>
                  <Input
                    id="fixedTerm"
                    type="number"
                    step="0.01"
                    value={editingTariff.fixedTerm}
                    onChange={(e) => setEditingTariff({ ...editingTariff, fixedTerm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSaveTariff} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}