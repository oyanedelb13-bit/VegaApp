import './globals.css';
import { ClientShell } from '../components/ClientShell';

export const metadata = {
  title: 'Vega',
  description: 'Gestion de pedidos para puesto de feria',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
