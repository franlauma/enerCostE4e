'use client';

import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useMemo } from 'react';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const { clientId } = params;
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && clientId ? doc(firestore, 'users', clientId) : null),
    [firestore, clientId]
  );
  const { data: user, isLoading: isUserLoading } = useDoc<any>(userDocRef);

  const simulationsQuery = useMemoFirebase(
    () =>
      firestore && clientId
        ? query(collection(firestore, `users/${clientId}/simulations`), orderBy('simulationDate', 'desc'))
        : null,
    [firestore, clientId]
  );
  const { data: simulations, isLoading: areSimulationsLoading } = useCollection<any>(simulationsQuery);
  
  const getInitials = (firstName = '', lastName = '') => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    // The date might be a Firebase Timestamp object, so convert it to a JS Date.
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return format(jsDate, "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
  };


  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="w-full space-y-8">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/clients">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Volver a clientes</span>
                    </Link>
                </Button>
                {isUserLoading ? (
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                ) : user ? (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback className="text-lg">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold font-headline">{`${user.firstName} ${user.lastName}`}</h1>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                ) : null }
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Historial de Simulaciones</CardTitle>
                    <CardDescription>
                    Lista de todas las simulaciones de costes realizadas por este cliente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Fecha de Simulación</TableHead>
                            <TableHead>Archivo de Entrada</TableHead>
                            <TableHead className="text-right">Ahorro Estimado</TableHead>
                            <TableHead className="w-[120px] text-center">Resultados</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {(areSimulationsLoading) &&
                            Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-8 w-20 rounded-md mx-auto" /></TableCell>
                            </TableRow>
                            ))}
                        {!areSimulationsLoading && simulations && simulations.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    Este cliente aún no ha realizado ninguna simulación.
                                </TableCell>
                            </TableRow>
                        )}
                        {!areSimulationsLoading &&
                            simulations?.map(sim => (
                            <TableRow key={sim.id}>
                                <TableCell>{formatDate(sim.simulationDate)}</TableCell>
                                <TableCell className="font-mono text-sm">{sim.inputFileName}</TableCell>
                                <TableCell className="text-right font-medium text-accent">
                                    {/* The results are stored as a JSON string, so we need to parse it first */}
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(JSON.parse(sim.results).summary.bestOption.savings)}
                                </TableCell>
                                <TableCell className="text-center">
                                <Button asChild variant="ghost" size="icon">
                                    {/* In the future, this could link to a detailed view of the simulation result */}
                                    <Link href="#">
                                      <FileText className="h-4 w-4" />
                                    </Link>
                                </Button>
                                </TableCell>
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
