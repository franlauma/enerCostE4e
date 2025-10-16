'use client';

import type { SimulationResult } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileDown, TrendingUp, Zap, PieChart } from 'lucide-react';
import CostComparisonTable from './cost-comparison-table';
import CostComparisonChart from './cost-comparison-chart';
import CostBreakdownChart from './cost-breakdown-chart';

type ResultsDashboardProps = {
  result: SimulationResult;
  onReset: () => void;
};

export default function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  }

  const handleExportCSV = () => {
    const headers = ["Ranking", "Compañía", "Cuota Fija (€)", "Coste Consumo (€)", "Otros Costes (€)", "Coste Total (€)"];
    const csvRows = [headers.join(',')];

    for (const row of result.details) {
      const values = [row.rank, `"${row.name}"`, row.fixedFee, row.consumptionCost, row.otherCosts, row.totalCost];
      csvRows.push(values.join(','));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'analisis_costes_electricos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const bestOptionData = result.details.find(d => d.rank === 1);

  return (
    <div className="w-full space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <h1 className="text-3xl font-headline font-bold tracking-tight">Resultados de la Simulación</h1>
        <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" onClick={onReset}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Nueva Simulación
            </Button>
            <Button onClick={handleExportCSV}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mejor Opción</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.summary.bestOption.companyName}</div>
            <p className="text-xs text-muted-foreground">La opción más económica para ti</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ahorro Anual Estimado</CardTitle>
             <span className="font-bold text-accent">€</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatCurrency(result.summary.bestOption.savings)}</div>
            <p className="text-xs text-muted-foreground">Comparado con tu tarifa actual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.summary.totalKwh.toLocaleString('es-ES')} kWh</div>
            <p className="text-xs text-muted-foreground">Periodo: {result.summary.period}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desglose Mejor Opción</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {bestOptionData && <CostBreakdownChart data={bestOptionData} />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Comparativa de Costes</CardTitle>
            <CardDescription>Análisis detallado de los costes por cada compañía eléctrica.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="table" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
                    <TabsTrigger value="table">Vista de Tabla</TabsTrigger>
                    <TabsTrigger value="chart">Vista de Gráfico</TabsTrigger>
                </TabsList>
                <TabsContent value="table" className="mt-6">
                    <CostComparisonTable data={result.details} />
                </TabsContent>
                <TabsContent value="chart" className="mt-6">
                    <CostComparisonChart data={result.details} />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
