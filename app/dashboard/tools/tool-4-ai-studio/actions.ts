'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// --- SERVICIOS DE BASE DE DATOS PARA TOOL 4 ---

export async function obtenerProductosParaAIAction() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, sku, image_urls, internal_reference_images, category')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function obtenerModelosGuardadosAction() {
    try {
        const { data, error } = await supabase
            .from('ai_saved_models')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function guardarModeloAction(modelData: any) {
    try {
        const { error } = await supabase.from('ai_saved_models').upsert([modelData], { onConflict: 'id' });
        if (error) throw new Error(error.message);
        revalidatePath('/dashboard/tools/tool-4-ai-studio/configuracion');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function eliminarModeloAction(id: string) {
    try {
        const { error } = await supabase.from('ai_saved_models').update({ is_active: false }).eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/dashboard/tools/tool-4-ai-studio/configuracion');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function obtenerHistorialGeneracionesAction() {
    try {
        const { data, error } = await supabase
            .from('ai_media_generations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- SERVICIO CORE DE GENERACIÓN IA (FACADE) ---

export async function generateMediaWithAIAction(payload: any) {
    try {
        // 1. REGISTRAMOS EL INTENTO EN BASE DE DATOS ESTADO "PROCESSING"
        const generationRecord = {
            generation_type: payload.type, // 'photo' o 'video'
            mode: payload.mode, // 'product', 'fashion', 'food'
            product_ids: payload.productIds || [],
            uploaded_reference_images: payload.uploadedImages || [],
            saved_model_id: payload.savedModelId || null,
            prompt_parameters: payload.parameters,
            status: 'processing',
            provider: 'fal.ai' // Expandible
        };

        const { data: dbRecord, error: dbError } = await supabase
            .from('ai_media_generations')
            .insert([generationRecord])
            .select()
            .single();

        if (dbError) throw new Error("No se pudo iniciar el registro: " + dbError.message);

        // 2. CONSTRUCCIÓN DE PROMPT Y LÓGICA DE NEGOCIO SEGÚN CATEGORÍA
        // Aquí es donde ensamblarías la llamada real a Fal.ai o tu proveedor
        // Ejemplo de armado de prompt basado en parámetros:

        const { background, pose, interaction, extraPrompt, style } = payload.parameters;
        let finalPrompt = `High quality, professional ${payload.type} of a product. `;

        if (payload.mode === 'product') {
            finalPrompt += `Set in a ${background} background. `;
            if (interaction) finalPrompt += `${interaction}. `;
            if (pose) finalPrompt += `Positioned ${pose}. `;
        } else if (payload.mode === 'fashion') {
            finalPrompt += `Fashion editorial style, clothing worn by a model. Setting: ${background}. Pose: ${pose}. `;
        } else if (payload.mode === 'food') {
            finalPrompt += `Professional food photography, appetizing, fresh. Setting: ${background}. `;
        }

        finalPrompt += `Style: ${style}. Extra details: ${extraPrompt}.`;

        // 3. LLAMADA A LA API EXTERNA (MOCK PARA EL EJEMPLO DE ARQUITECTURA)
        // const falResponse = await fetch('https://fal.run/...', { headers: { 'Authorization': `Key ${process.env.FAL_API_KEY}` }... })

        // Simulación de tiempo de proceso de IA
        await new Promise(resolve => setTimeout(result => resolve(result), 3000));

        // Simulación de resultado exitoso
        const mockResultUrl = payload.type === 'photo'
            ? 'https://placehold.co/1080x1350?text=AI+Generated+Photo'
            : 'https://placehold.co/1080x1350?text=AI+Generated+Video';

        // 4. ACTUALIZAMOS LA BASE DE DATOS CON EL RESULTADO
        const { error: updateError } = await supabase
            .from('ai_media_generations')
            .update({
                status: 'completed',
                final_ai_prompt: finalPrompt,
                result_url: mockResultUrl
            })
            .eq('id', dbRecord.id);

        if (updateError) throw new Error("Error al guardar resultado: " + updateError.message);

        revalidatePath('/dashboard/tools/tool-4-ai-studio');

        return {
            success: true,
            result: { id: dbRecord.id, url: mockResultUrl, prompt: finalPrompt }
        };

    } catch (error: any) {
        console.error("AI Gen Error:", error);
        return { success: false, error: error.message };
    }
}