import Sidebar from '@/components/Sidebar'; // Asegurate de que la ruta coincida

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* El menú lateral fijo a la izquierda */}
            <Sidebar />

            {/* El contenido principal que cambia (lista de productos, edición, etc.) */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}