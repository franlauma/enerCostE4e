import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { CompanyCost } from '@/lib/data';
import { Star } from 'lucide-react';

type CostComparisonTableProps = {
  data: CompanyCost[];
};

export default function CostComparisonTable({ data }: CostComparisonTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] text-center">Rank</TableHead>
            <TableHead>Compañía</TableHead>
            <TableHead className="text-right">Cuota Fija</TableHead>
            <TableHead className="text-right">Coste Consumo</TableHead>
            <TableHead className="text-right">Otros Costes</TableHead>
            <TableHead className="text-right font-bold">Coste Total Anual</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((company) => (
            <TableRow key={company.id} className={company.rank === 1 ? 'bg-accent/10' : ''}>
              <TableCell className="text-center font-medium">
                {company.rank === 1 ? (
                  <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    {company.rank}
                  </Badge>
                ) : (
                  company.rank
                )}
              </TableCell>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell className="text-right">{formatCurrency(company.fixedFee)}</TableCell>
              <TableCell className="text-right">{formatCurrency(company.consumptionCost)}</TableCell>
              <TableCell className="text-right">{formatCurrency(company.otherCosts)}</TableCell>
              <TableCell className="text-right font-bold text-base">{formatCurrency(company.totalCost)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
