'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// 1. Crear un nuevo pedido (Lo usa el Salón)
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

// 2. Leer los pedidos activos (Lo usa el Depósito y el Salón)
export async function obtenerPedidosActivosAction() {
    try {
        // Traemos todo menos lo que ya se entregó o rechazó hace mucho (para no saturar la pantalla)
        const { data, error } = await supabase
            .from('tool_pedidos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50); // Solo los últimos 50 pedidos para mantener la pantalla rápida

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// 3. Cambiar el estado de un pedido (Lo usa el Depósito)
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