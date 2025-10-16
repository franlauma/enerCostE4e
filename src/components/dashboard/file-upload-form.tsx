'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UploadCloud, File, X, Loader2, TestTube2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  file: z.instanceof(File).refine(file => file.size > 0, 'Por favor, selecciona un archivo.'),
});

type FileUploadFormProps = {
  onFileUpload: (formData: FormData) => void;
  onDemo: () => void;
  isLoading: boolean;
};

export default function FileUploadForm({ onFileUpload, onDemo, isLoading }: FileUploadFormProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined,
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      form.setValue('file', e.dataTransfer.files[0]);
      setFileName(e.dataTransfer.files[0].name);
      form.trigger('file');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      form.setValue('file', e.dataTransfer.files[0]);
      setFileName(e.target.files[0].name);
      form.trigger('file');
    }
  };

  const handleRemoveFile = () => {
    setFileName('');
    form.reset();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('file', values.file);
    onFileUpload(formData);
  };

  return (
    <Card className="max-w-2xl mx-auto w-full shadow-lg border-2 border-dashed border-border/50 bg-card/80">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl">Analiza tu Factura Eléctrica</CardTitle>
        <CardDescription className="!mt-3 text-base">
          Sube tu archivo Excel para comparar costes entre tarifas y encuentra la mejor opción para ti.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="file"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => inputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-background/50 hover:bg-secondary/50 transition-colors ${
                        dragActive ? 'border-primary' : 'border-border'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud
                          className={`w-10 h-10 mb-4 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                        </p>
                        <p className="text-xs text-muted-foreground">Archivo Excel (XLS, XLSX)</p>
                      </div>
                      <Input
                        ref={inputRef}
                        type="file"
                        id="file"
                        name="file"
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleChange}
                      />
                    </div>
                  </FormControl>
                  {fileName && (
                    <div className="mt-4 flex items-center justify-between p-3 rounded-md border bg-secondary/30">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <File className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">{fileName}</span>
                      </div>
                      <Button variant="ghost" size="icon" type="button" onClick={handleRemoveFile} className="h-7 w-7 flex-shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <FormMessage className="pt-2" />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading || !form.formState.isValid}>
              {isLoading && fileName ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analizando...
                </>
              ) : (
                'Analizar Costes'
              )}
            </Button>
            
            <div className="relative">
                <Separator className="absolute top-1/2 -translate-y-1/2" />
                <p className="relative text-center bg-card text-muted-foreground text-sm w-fit mx-auto px-2">¿No tienes una factura a mano?</p>
            </div>

            <Button type="button" variant="secondary" className="w-full text-base py-6" onClick={onDemo} disabled={isLoading}>
                {isLoading && !fileName ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Cargando demo...
                    </>
                ) : (
                    <>
                        <TestTube2 className="mr-2 h-5 w-5" />
                        Probar con factura demo
                    </>
                )}
            </Button>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
