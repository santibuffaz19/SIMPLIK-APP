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

// --- SERVICIO CORE DE GENERACIÓN IA (FAL.AI) ---

export async function generateMediaWithAIAction(payload: any) {
    try {
        // 1. OBTENER API KEY DE LAS VARIABLES DE ENTORNO
        const falApiKey = process.env.FAL_KEY;
        if (!falApiKey) {
            throw new Error("Falta configurar FAL_KEY en las variables de entorno.");
        }

        // 2. REGISTRAR INTENTO EN BD (ESTADO "PROCESSING")
        const generationRecord = {
            generation_type: payload.type, // 'photo' o 'video'
            mode: payload.mode, // 'product', 'fashion', 'food'
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
            .select()
            .single();

        if (dbError) throw new Error("No se pudo iniciar el registro: " + dbError.message);

        // 3. PREPARAR DATOS DE REFERENCIA
        let imageUrlToProcess = '';

        // Determinar de dónde sacar la imagen de referencia
        if (payload.uploadedImages && payload.uploadedImages.length > 0) {
            imageUrlToProcess = payload.uploadedImages[0];
        } else if (payload.productIds && payload.productIds.length > 0) {
            const { data: productData } = await supabase
                .from('products')
                .select('internal_reference_images, image_urls')
                .eq('id', payload.productIds[0])
                .single();

            if (productData) {
                if (productData.internal_reference_images && productData.internal_reference_images.length > 0) {
                    imageUrlToProcess = productData.internal_reference_images[0];
                } else if (productData.image_urls && productData.image_urls.length > 0) {
                    imageUrlToProcess = productData.image_urls[0];
                }
            }
        }

        if (!imageUrlToProcess) {
            throw new Error("No se proporcionó una imagen válida para procesar.");
        }

        // 4. CONSTRUCCIÓN DE PROMPT Y CONFIGURACIÓN DE MODELO
        const { background, pose, interaction, extraPrompt, style, duration, aspectRatio } = payload.parameters;

        let falEndpoint = '';
        let falRequestBody: any = {};
        let finalPrompt = '';
        let resultUrl = '';

        if (payload.type === 'photo') {

            if (payload.mode === 'fashion') {
                // --- MODO MODA -> Usamos IDM-VTON ---
                falEndpoint = 'https://queue.fal.run/fal-ai/idm-vton';

                let humanModelUrl = '';
                if (payload.savedModelId) {
                    const { data: savedModel } = await supabase.from('ai_saved_models').select('reference_images').eq('id', payload.savedModelId).single();
                    if (savedModel && savedModel.reference_images.length > 0) {
                        humanModelUrl = savedModel.reference_images[0];
                    }
                }

                if (!humanModelUrl) throw new Error("Falta seleccionar un modelo humano para el modo Moda.");

                finalPrompt = `Fashion photography, ${style} style, ${background}. ${pose}. ${extraPrompt}`;

                falRequestBody = {
                    human_image_url: humanModelUrl,
                    garment_image_url: imageUrlToProcess,
                    description: finalPrompt,
                    category: "upper_body"
                };

            } else {
                // --- MODO PRODUCTO/COMIDA -> Usamos FLUX ---
                falEndpoint = 'https://queue.fal.run/fal-ai/flux-pro/v1.1/image-to-image';

                finalPrompt = `Professional photography of a product. `;
                if (payload.mode === 'food') finalPrompt = `Professional food photography, appetizing, fresh. `;

                finalPrompt += `Set in a ${background} background. `;
                if (interaction) finalPrompt += `${interaction}. `;
                if (pose) finalPrompt += `Positioned ${pose}. `;
                finalPrompt += `Style: ${style}. Extra details: ${extraPrompt}. highly detailed, 8k, photorealistic.`;

                falRequestBody = {
                    image_url: imageUrlToProcess,
                    prompt: finalPrompt,
                    strength: 0.85
                };
            }

        } else if (payload.type === 'video') {
            // --- MODO VIDEO -> Usamos Kling ---
            falEndpoint = 'https://queue.fal.run/fal-ai/kling-video/v1.6/pro/image-to-video';

            finalPrompt = `Cinematic video shot. `;
            if (payload.mode === 'food') finalPrompt = `Cinematic food commercial. `;
            if (payload.mode === 'fashion') finalPrompt = `Fashion promotional video. `;

            finalPrompt += `Environment: ${background}. `;
            if (interaction) finalPrompt += `Action: ${interaction}. `;
            finalPrompt += `Style: ${style}. ${extraPrompt}. Smooth camera movement.`;

            falRequestBody = {
                image_url: imageUrlToProcess,
                prompt: finalPrompt,
                duration: duration === '5s' ? '5' : '10',
                aspect_ratio: aspectRatio || "16:9"
            };
        }

        // 5. LLAMADA A FAL.AI (USANDO COLA DE TAREAS)

        // Paso A: Enviar la tarea a la cola
        const submitResponse = await fetch(falEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${falApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(falRequestBody)
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.text();
            throw new Error(`Error de la API de IA (Submit): ${submitResponse.status} ${errorData}`);
        }

        const submitData = await submitResponse.json();

        // FIX: Usar directamente las URLs dinámicas de Fal.ai para consultar progreso
        const statusUrl = submitData.status_url;
        const responseUrl = submitData.response_url;

        if (!statusUrl || !responseUrl) {
            throw new Error("No se recibieron las URLs de progreso de Fal.ai");
        }

        // Paso B: Polling (Preguntar cada 2 segundos si ya terminó)
        let status = 'IN_QUEUE';
        let attempts = 0;
        const maxAttempts = 60; // 2 minutos máximo

        while (status !== 'COMPLETED' && status !== 'FAILED' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos

            const statusResponse = await fetch(statusUrl, {
                headers: { 'Authorization': `Key ${falApiKey}` }
            });

            if (statusResponse.ok) {
                const statusJson = await statusResponse.json();
                status = statusJson.status;
            } else {
                console.log("Error haciendo polling de estado...");
            }
            attempts++;
        }

        if (status !== 'COMPLETED') {
            throw new Error("La generación falló o superó el tiempo máximo de espera.");
        }

        // Paso C: Traer el archivo final generado
        const resultResponse = await fetch(responseUrl, {
            headers: { 'Authorization': `Key ${falApiKey}` }
        });

        if (!resultResponse.ok) {
            throw new Error("No se pudo obtener el archivo final de la IA.");
        }

        const resultJson = await resultResponse.json();

        // Extraer la URL según el formato de la IA
        if (payload.type === 'photo' && payload.mode === 'fashion') {
            resultUrl = resultJson.image?.url || resultJson.images?.[0]?.url;
        } else if (payload.type === 'photo') {
            resultUrl = resultJson.images?.[0]?.url;
        } else if (payload.type === 'video') {
            resultUrl = resultJson.video?.url;
        }

        if (!resultUrl) {
            throw new Error("La IA no devolvió una URL válida del archivo generado.");
        }

        // 6. ACTUALIZAMOS LA BASE DE DATOS CON EL RESULTADO FINAL
        const { error: updateError } = await supabase
            .from('ai_media_generations')
            .update({
                status: 'completed',
                final_ai_prompt: finalPrompt,
                result_url: resultUrl
            })
            .eq('id', dbRecord.id);

        if (updateError) throw new Error("Error al guardar el resultado en BD: " + updateError.message);

        revalidatePath('/dashboard/tools/tool-4-ai-studio');

        return {
            success: true,
            result: { id: dbRecord.id, url: resultUrl, prompt: finalPrompt }
        };

    } catch (error: any) {
        console.error("AI Gen Error:", error);
        return { success: false, error: error.message };
    }
}