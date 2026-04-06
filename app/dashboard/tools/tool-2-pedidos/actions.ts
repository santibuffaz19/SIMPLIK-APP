'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// 1. Crear un nuevo pedido
export async function crearPedidoAction(pedido: { producto_pedido: string; cantidad: string; urgencia: string; notas?: string }) {
    try {
        const { data, error } = await supabase
            .from('tool_pedidos')
            .insert([pedido])
            .select();

        if (error) throw new Error(error.message);

        revalidatePath('/dashboard/tools/tool-2-pedidos');
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// 2. Leer los pedidos activos
export async function obtenerPedidosActivosAction() {
    try {
        const { data, error } = await supabase
            .from('tool_pedidos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// 3. Cambiar el estado de un pedido
export async function actualizarEstadoPedidoAction(id: string, nuevoEstado: string) {
    try {
        const { error } = await supabase
            .from('tool_pedidos')
            .update({ estado: nuevoEstado })
            .eq('id', id);

        if (error) throw new Error(error.message);

        revalidatePath('/dashboard/tools/tool-2-pedidos');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// 4. Eliminar un pedido (Para limpiar el historial del Salón)
export async function eliminarPedidoAction(id: string) {
    try {
        const { error } = await supabase
            .from('tool_pedidos')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);

        revalidatePath('/dashboard/tools/tool-2-pedidos');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ------------------------------------------------------------------
// NUEVAS FUNCIONES PARA EL SISTEMA DE CONSULTAS (SALÓN <-> DEPÓSITO)
// ------------------------------------------------------------------

// 5. El Depósito pausa el pedido y pide ayuda/aclaración
export async function reportarProblemaAction(id: string, mensaje: string) {
    try {
        const { error } = await supabase
            .from('tool_pedidos')
            .update({ estado: 'pausado', mensaje_deposito: mensaje })
            .eq('id', id);

        if (error) throw new Error(error.message);

        revalidatePath('/dashboard/tools/tool-2-pedidos');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// 6. El Salón responde a la duda y reactiva el pedido para que lo sigan preparando
export async function responderProblemaAction(id: string, respuesta: string) {
    try {
        const { error } = await supabase
            .from('tool_pedidos')
            .update({ estado: 'preparando', respuesta_salon: respuesta })
            .eq('id', id);

        if (error) throw new Error(error.message);

        revalidatePath('/dashboard/tools/tool-2-pedidos');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}