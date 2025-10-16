'use client';

import { useCollection } from '@/firebase';
import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
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
import { ArrowRight } from 'lucide-react';

export default function ClientsPage() {
  const firestore = useFirestore();

  const usersQuery = useMemo(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('lastName', 'asc')) : null),
    [firestore]
  );

  const { data: users, isLoading } = useCollection<any>(usersQuery);

  const getInitials = (firstName = '', lastName = '') => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h1 className="text-3xl font-headline font-bold tracking-tight">Gestión de Clientes</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Clientes Registrados</CardTitle>
            <CardDescription>
              Aquí puedes ver la lista de todos los clientes que se han registrado en la aplicación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Simulaciones</TableHead>
                    <TableHead className="w-[120px] text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-8 w-20 rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && users && users.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                            No hay clientes registrados.
                        </TableCell>
                    </TableRow>
                  )}
                  {!isLoading &&
                    users?.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatarUrl} />
                              <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{`${user.firstName} ${user.lastName}`}</p>
                                <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                           {/* This would require a count subcollection or similar */}
                           <Badge variant="secondary">0</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/clients/${user.id}`}>
                              Ver Historial
                              <ArrowRight className="ml-2 h-4 w-4" />
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
