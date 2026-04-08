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

// --- HELPER: CONSTRUCTOR DE PROMPT PRO ---
// Esta función toma todos tus inputs y los convierte en lenguaje que la IA entiende perfecto.
function construirPromptPro(params: any, type: string, mode: string) {
    const { background, pose, interaction, extraPrompt, style } = params;

    // Base de calidad fotográfica
    let prompt = `Professional high-end commercial ${type} photography. `;

    if (mode === 'food') {
        prompt += "Delicious appetizing food styling. ";
    }

    // Integración del fondo (Background)
    if (background) {
        prompt += `The scene is set in a stunning ${background}. The environment is realistically rendered with perfect depth of field. `;
    }

    // Integración de la pose y posición
    if (pose) {
        prompt += `The main object is ${pose}. `;
    }

    // Integración de la interacción
    if (interaction) {
        prompt += `Atmospheric effect: ${interaction}. `;
    }

    // Estilo y Calidad Final
    const styleMap: any = {
        premium: "Luxury aesthetic, clean studio lighting, high-end commercial retouching.",
        editorial: "Magazine style, artistic composition, dramatic shadows and highlights.",
        lifestyle: "Natural lighting, authentic vibe, candid professional shot.",
        cinematic: "Movie-like color grading, epic anamorphic flares, highly atmospheric.",
        minimalist: "Solid clean colors, simple geometry, soft diffused lighting."
    };

    prompt += `${styleMap[style] || styleMap.premium} `;

    // Agregamos tus instrucciones extra
    if (extraPrompt) {
        prompt += `${extraPrompt}. `;
    }

    // Blindaje de calidad técnica
    prompt += "8k resolution, shot on 35mm lens, f/1.8, sharp focus on the product, global illumination, raytraced reflections, Masterpiece.";

    return prompt;
}

// --- SERVICIO CORE DE GENERACIÓN IA (FAL.AI) ---

export async function generateMediaWithAIAction(payload: any) {
    try {
        const falApiKey = process.env.FAL_KEY;
        if (!falApiKey) throw new Error("Falta FAL_KEY en variables de entorno.");

        const generationRecord = {
            generation_type: payload.type,
            mode: payload.mode,
            product_ids: payload.productIds || [],
            uploaded_reference_images: payload.uploadedImages || [],
            saved_model_id: payload.savedModelId || null,
            prompt_parameters: payload.parameters,
            status: 'processing',
            provider: 'fal.ai'
        };

        const { data: dbRecord, error: dbError } = await supabase
            .from('ai_media_generations')
            .insert([generationRecord])
            .select().single();

        if (dbError) throw new Error("Error registrando en DB.");

        let imageUrlToProcess = '';
        if (payload.uploadedImages?.length > 0) {
            imageUrlToProcess = payload.uploadedImages[0];
        } else if (payload.productIds?.length > 0) {
            const { data: prod } = await supabase.from('products').select('internal_reference_images, image_urls').eq('id', payload.productIds[0]).single();
            imageUrlToProcess = prod?.internal_reference_images?.[0] || prod?.image_urls?.[0] || '';
        }

        if (!imageUrlToProcess) throw new Error("No hay imagen de referencia.");

        // ARMADO DEL PROMPT PRO USANDO TODA LA INFO DEL CLIENTE
        const finalPrompt = construirPromptPro(payload.parameters, payload.type, payload.mode);

        let falEndpoint = '';
        let falRequestBody: any = {};

        if (payload.type === 'photo') {
            if (payload.mode === 'fashion') {
                falEndpoint = 'https://queue.fal.run/fal-ai/idm-vton';
                let humanModelUrl = '';
                if (payload.savedModelId) {
                    const { data: savedModel } = await supabase.from('ai_saved_models').select('reference_images').eq('id', payload.savedModelId).single();
                    humanModelUrl = savedModel?.reference_images?.[0] || '';
                }
                if (!humanModelUrl) throw new Error("Falta modelo humano.");

                falRequestBody = {
                    human_image_url: humanModelUrl,
                    garment_image_url: imageUrlToProcess,
                    description: finalPrompt,
                    category: "upper_body"
                };
            } else {
                // USAMOS FLUX REDUX O IMAGE-TO-IMAGE CON STRENGTH AJUSTADO
                falEndpoint = 'https://queue.fal.run/fal-ai/flux/dev/image-to-image';
                falRequestBody = {
                    image_url: imageUrlToProcess,
                    prompt: finalPrompt,
                    // BAJAMOS STRENGTH para que respete el termo pero cambie el fondo
                    strength: 0.45,
                    num_inference_steps: 40,
                    guidance_scale: 7.5
                };
            }
        } else {
            // VIDEO MODO
            falEndpoint = 'https://queue.fal.run/fal-ai/kling-video/v1/standard/image-to-video';
            falRequestBody = {
                image_url: imageUrlToProcess,
                prompt: finalPrompt,
                duration: payload.parameters.duration === '5s' ? '5' : '10',
                aspect_ratio: payload.parameters.aspectRatio || "16:9"
            };
        }

        // COMUNICACIÓN CON IA
        const submitResponse = await fetch(falEndpoint, {
            method: 'POST',
            headers: { 'Authorization': `Key ${falApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(falRequestBody),
            cache: 'no-store'
        });

        if (!submitResponse.ok) throw new Error(await submitResponse.text());
        const submitData = await submitResponse.json();

        let status = 'IN_QUEUE';
        let resultUrl = '';
        let attempts = 0;

        while (status !== 'COMPLETED' && attempts < 60) {
            await new Promise(r => setTimeout(r, 2500));
            const res = await fetch(submitData.status_url, { headers: { 'Authorization': `Key ${falApiKey}` }, cache: 'no-store' });
            const json = await res.json();
            status = json.status;
            if (status === 'COMPLETED') {
                const finalRes = await fetch(submitData.response_url, { headers: { 'Authorization': `Key ${falApiKey}` }, cache: 'no-store' });
                const finalJson = await finalRes.json();
                resultUrl = payload.type === 'video' ? finalJson.video?.url : (finalJson.images?.[0]?.url || finalJson.image?.url);
            }
            attempts++;
        }

        if (!resultUrl) throw new Error("No se obtuvo URL final.");

        await supabase.from('ai_media_generations').update({ status: 'completed', final_ai_prompt: finalPrompt, result_url: resultUrl }).eq('id', dbRecord.id);
        revalidatePath('/dashboard/tools/tool-4-ai-studio');

        return { success: true, result: { id: dbRecord.id, url: resultUrl, prompt: finalPrompt } };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}