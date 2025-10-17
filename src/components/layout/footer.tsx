export default function Footer() {
  return (
    <footer className="border-t border-border/40 py-6 mt-auto">
      <div className="container flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} E4e soluciones - Simulación factura. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
