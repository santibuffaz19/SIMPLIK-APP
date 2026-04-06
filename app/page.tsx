import Link from 'next/link';
import { QrCode, Package, ArrowRight, Settings, LayoutGrid } from 'lucide-react';

export default function DashboardHome() {
  return (
    <div className="max-w-6xl mx-auto p-8 font-sans text-slate-800 h-full flex flex-col justify-center min-h-[80vh]">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-100 p-2 rounded-xl">
            <LayoutGrid size={24} className="text-indigo-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Bienvenido a Simplik</h1>
        </div>
        <p className="text-slate-500 font-medium text-lg ml-12">Seleccioná la herramienta con la que vas a trabajar hoy.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* TOOL 1: CATÁLOGO QR */}
        <Link href="/dashboard/tools/tool-1-QR" className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-emerald-300 transition-all group flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
            <QrCode size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Catálogo QR</h2>
          <p className="text-slate-500 mb-8 font-medium flex-1">
            Gestioná tus productos, generá etiquetas PDF y actualizá tu vidriera digital.
          </p>
          <div className="mt-auto flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-widest">
            Abrir Herramienta <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* TOOL 2: COMANDAS (NUEVA) */}
        <Link href="/dashboard/tools/tool-2-pedidos" className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-orange-300 transition-all group flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
            <Package size={32} className="text-orange-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Comandas Internas</h2>
          <p className="text-slate-500 mb-8 font-medium flex-1">
            Solicitá stock desde el salón y gestioná la preparación en el depósito en tiempo real.
          </p>
          <div className="mt-auto flex items-center gap-2 text-orange-600 font-black text-sm uppercase tracking-widest">
            Abrir Herramienta <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* ACCESO A CONFIGURACIÓN */}
        <Link href="/dashboard/configuracion" className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-indigo-300 transition-all group flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
            <Settings size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Ajustes</h2>
          <p className="text-slate-500 mb-8 font-medium flex-1">
            Configurá tu empresa, las medidas del QR y las preferencias del sistema.
          </p>
          <div className="mt-auto flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest">
            Configurar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

      </div>
    </div>
  );
}