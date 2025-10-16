'use client';

import { useState } from 'react';
import { simulateCost } from '@/lib/actions';
import type { SimulationResult } from '@/lib/data';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import FileUploadForm from '@/components/dashboard/file-upload-form';
import ResultsDashboard from '@/components/dashboard/results-dashboard';
import { useToast } from '@/hooks/use-toast';
import ContextualHelp from '@/components/dashboard/contextual-help';

type SimulationState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: SimulationResult | null;
  error: string | null;
  helpMessage: string | null;
};

export default function Home() {
  const [state, setState] = useState<SimulationState>({
    status: 'idle',
    data: null,
    error: null,
    helpMessage: null,
  });
  const { toast } = useToast();

  const handleSimulation = async (formData: FormData) => {
    setState({ status: 'loading', data: null, error: null, helpMessage: null });
    const result = await simulateCost(formData);

    if (result.success && result.data) {
      setState({ status: 'success', data: result.data, error: null, helpMessage: null });
    } else {
      const errorMessage = result.error || 'Ocurrió un error inesperado.';
      setState({ status: 'error', data: null, error: errorMessage, helpMessage: result.helpMessage || null });
      toast({
        variant: 'destructive',
        title: 'Error en la simulación',
        description: errorMessage,
      });
    }
  };

  const handleReset = () => {
    setState({ status: 'idle', data: null, error: null, helpMessage: null });
  };
  
  const handleHelpClose = () => {
    setState(prevState => ({...prevState, status: 'idle', helpMessage: null}));
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12">
        {state.status !== 'success' ? (
          <div className="flex items-center justify-center w-full min-h-[calc(100vh-20rem)]">
            <FileUploadForm
              onFileUpload={handleSimulation}
              isLoading={state.status === 'loading'}
            />
          </div>
        ) : (
          <ResultsDashboard result={state.data!} onReset={handleReset} />
        )}
      </main>
      <Footer />
      {state.helpMessage && (
         <ContextualHelp 
            defaultOpen={true} 
            helpMessage={state.helpMessage}
            onClose={handleHelpClose}
         />
      )}
    </div>
  );
}
