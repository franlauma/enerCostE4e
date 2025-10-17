'use client';

import { useCollection, useDoc } from '@/firebase';
import React from 'react';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
import { ArrowLeft, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const { clientId } = params;
  const firestore = useFirestore();

  const userDocRef = React.useMemo(() => {
    if (!firestore || !clientId) return null;
    const d = doc(firestore, 'users', clientId);
    (d as any).__memo = true;
    return d;
  }, [firestore, clientId]);
  const { data: user, isLoading: isUserLoading } = useDoc<any>(userDocRef);

  const simulationsQuery = React.useMemo(() => {
    if (!firestore || !clientId) return null;
    const q = query(collection(firestore, `users/${clientId}/simulations`), orderBy('simulationDate', 'desc'));
    (q as any).__memo = true;
    return q;
  }, [firestore, clientId]);
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

  const handleDeleteSimulation = async (simulationId: string) => {
    if (!firestore || !clientId) return;
    
    try {
      const simulationRef = doc(firestore, `users/${clientId}/simulations`, simulationId);
      await deleteDoc(simulationRef);
      // The UI will update automatically due to the real-time listener
    } catch (error) {
      console.error('Error deleting simulation:', error);
    }
  };

  const handleViewResults = (simulation: any) => {
    try {
      const results = JSON.parse(simulation.results);
      const summary = results.summary;
      
      // Create a more detailed results display
      const resultsData = {
        bestOption: summary.bestOption,
        currentOption: summary.currentOption,
        savings: summary.bestOption.savings,
        inputFile: simulation.inputFileName,
        simulationDate: formatDate(simulation.simulationDate)
      };
      
      // Show detailed results in a more user-friendly format
      const message = `📊 RESULTADOS DE SIMULACIÓN
      
📅 Fecha: ${resultsData.simulationDate}
📁 Archivo: ${resultsData.inputFile}

🏆 MEJOR OPCIÓN:
• Empresa: ${resultsData.bestOption.companyName}
• Ahorro: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resultsData.savings)}
• Coste anual: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resultsData.bestOption.totalCost)}

📈 SITUACIÓN ACTUAL:
• Empresa: ${resultsData.currentOption.companyName}
• Coste anual: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resultsData.currentOption.totalCost)}

💰 AHORRO POTENCIAL: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resultsData.savings)}`;
      
      alert(message);
    } catch (error) {
      console.error('Error parsing results:', error);
      console.log('Simulation data:', simulation);
      alert('Error al mostrar los resultados. Los datos pueden estar en un formato no esperado.');
    }
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
                            <TableHead className="w-[160px] text-center">Acciones</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {(areSimulationsLoading) &&
                            Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-8 w-32 rounded-md mx-auto" /></TableCell>
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
                                    <div className="flex items-center justify-center gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => handleViewResults(sim)}
                                            title="Ver resultados"
                                        >
                                            <FileText className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    title="Eliminar simulación"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="flex items-center gap-2">
                                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                                        Confirmar eliminación
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        ¿Estás seguro de que quieres eliminar esta simulación? Esta acción no se puede deshacer.
                                                        <br /><br />
                                                        <strong>Fecha:</strong> {formatDate(sim.simulationDate)}<br />
                                                        <strong>Archivo:</strong> {sim.inputFileName}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        onClick={() => handleDeleteSimulation(sim.id)}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        Eliminar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
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
