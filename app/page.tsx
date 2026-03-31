import { redirect } from 'next/navigation';

export default function Home() {
  // Esto hace que el usuario no vea una página en blanco ni la de Next.js
  // Lo manda directo a donde está tu lógica de productos.
  redirect('/dashboard/productos');
}