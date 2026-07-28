import './globals.css';
import { ClientShell } from '../components/ClientShell';

export const metadata = {
  title: 'Vega',
  description: 'Gestion de pedidos para puesto de feria',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
