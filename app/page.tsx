import Link from 'next/link';
import { QrCode, Package, ArrowRight, Settings, LayoutGrid, Lock } from 'lucide-react';

export default function DashboardHome() {
  return (
    <div className="max-w-6xl mx-auto p-8 font-sans text-slate-800 min-h-[80vh] flex flex-col">

      {/* HEADER CON BOTÓN DE CONFIGURACIÓN ARRIBA A LA DERECHA */}
      <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-sm">
              <LayoutGrid size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bienvenido a Simplik</h1>
          </div>
          <p className="text-slate-500 font-medium text-lg md:ml-14">Seleccioná la herramienta con la que vas a trabajar hoy.</p>
        </div>

        <Link href="/dashboard/configuracion" className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm transition-all active:scale-95 w-fit">
          <Settings size={18} />
          Ajustes del Sistema
        </Link>
      </header>

      {/* GRID DE HERRAMIENTAS - DISEÑO CLEAN Y PROFESIONAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* TOOL 1: CATÁLOGO QR */}
        <Link href="/dashboard/tools/tool-1-QR" className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col h-full">
          <div className="bg-slate-50 border border-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors duration-300">
            <QrCode size={30} className="text-slate-700 group-hover:text-indigo-600 transition-colors" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">Catálogo QR</h2>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed flex-1">
            Gestioná tus productos, generá etiquetas PDF y actualizá tu vidriera digital en minutos.
          </p>
          <div className="mt-auto flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
            Abrir Herramienta <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
          </div>
        </Link>

        {/* TOOL 2: COMANDAS */}
        <Link href="/dashboard/tools/tool-2-pedidos" className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col h-full">
          <div className="bg-slate-50 border border-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors duration-300">
            <Package size={30} className="text-slate-700 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">Comandas Internas</h2>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed flex-1">
            Solicitá stock desde el salón y gestioná la preparación en el depósito en tiempo real.
          </p>
          <div className="mt-auto flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
            Abrir Herramienta <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
          </div>
        </Link>

        {/* PRÓXIMAMENTE */}
        <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-200 border-dashed flex flex-col h-full opacity-70">
          <div className="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
            <Lock size={28} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-700 mb-3">Próximamente...</h2>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed flex-1">
            Estamos construyendo nuevos módulos para potenciar aún más la eficiencia de tu negocio.
          </p>
          <div className="mt-auto flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest">
            En desarrollo
          </div>
        </div>

      </div>
    </div>
  );
}