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

        // Determinar de dónde sacar la imagen de referencia (Producto BD o Subida Manual)
        if (payload.uploadedImages && payload.uploadedImages.length > 0) {
            imageUrlToProcess = payload.uploadedImages[0];
        } else if (payload.productIds && payload.productIds.length > 0) {
            // Buscar la imagen en la BD del producto
            const { data: productData } = await supabase
                .from('products')
                .select('internal_reference_images, image_urls')
                .eq('id', payload.productIds[0])
                .single();

            if (productData) {
                // Priorizar referencias internas, si no, usar las públicas
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

        // 4. CONSTRUCCIÓN DE PROMPT Y CONFIGURACIÓN DE MODELO SEGÚN CATEGORÍA
        const { background, pose, interaction, extraPrompt, style } = payload.parameters;

        let falEndpoint = '';
        let falRequestBody: any = {};
        let finalPrompt = '';
        let resultUrl = '';

        if (payload.type === 'photo') {

            if (payload.mode === 'fashion') {
                // --- MODO FASHION (Ropa en Modelos) -> Usamos IDM-VTON ---
                // Requiere modelo humano + prenda
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
                    description: finalPrompt, // Opcional en IDM-VTON, ayuda al contexto
                    category: "upper_body" // Idealmente esto debería venir del formulario, asumo upper_body por defecto
                };

            } else {
                // --- MODO PRODUCTO/COMIDA -> Usamos FLUX (Inpainting/Recorte) ---
                // Usaremos un modelo que quite el fondo y genere uno nuevo (ej. Bria Background Removal + Flux)
                // Como simplificación para este código, usaremos la API general de Flux pasando la imagen.
                // *Nota de Arquitectura*: Fal no tiene un inpainting "one-click" perfecto de productos todavía, 
                // usualmente se encadena un modelo de RemoveBG -> Flux Image-to-Image.
                // Aquí usaremos Flux genérico como base conceptual.

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
                    strength: 0.85 // Qué tanto permite a la IA modificar (0.0 = original, 1.0 = completamente nuevo)
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
                duration: payload.parameters.duration === '5s' ? '5' : '10', // Kling acepta strings "5" o "10"
                aspect_ratio: "16:9" // Podría ser configurable
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
        const requestId = submitData.request_id;

        if (!requestId) {
            throw new Error("No se recibió request_id de Fal.ai");
        }

        // Paso B: Polling (Preguntar cada 2 segundos si ya terminó)
        // Nota: En producción real (Serverless larga duración) conviene usar Webhooks, 
        // pero para Vercel standard, un polling de 15-30s es aceptable.
        let status = 'IN_QUEUE';
        let resultData: any = null;
        let attempts = 0;
        const maxAttempts = 60; // 2 minutos máximo

        while (status !== 'COMPLETED' && status !== 'FAILED' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos

            const statusResponse = await fetch(`https://queue.fal.run/fal-ai/requests/${requestId}`, {
                headers: { 'Authorization': `Key ${falApiKey}` }
            });

            if (statusResponse.ok) {
                const statusJson = await statusResponse.json();
                status = statusJson.status;

                if (status === 'COMPLETED') {
                    // Fal devuelve URLs temporales que vencen, hay que procesarlas o guardarlas rápido.
                    if (payload.type === 'photo' && payload.mode === 'fashion') {
                        resultUrl = statusJson.response?.image?.url;
                    } else if (payload.type === 'photo') {
                        resultUrl = statusJson.response?.images?.[0]?.url;
                    } else if (payload.type === 'video') {
                        resultUrl = statusJson.response?.video?.url;
                    }
                }
            } else {
                console.log("Error haciendo polling...");
            }
            attempts++;
        }

        if (status !== 'COMPLETED' || !resultUrl) {
            throw new Error("La generación falló o superó el tiempo máximo de espera.");
        }

        // 6. ACTUALIZAMOS LA BASE DE DATOS CON EL RESULTADO
        const { error: updateError } = await supabase
            .from('ai_media_generations')
            .update({
                status: 'completed',
                final_ai_prompt: finalPrompt,
                result_url: resultUrl
            })
            .eq('id', dbRecord.id);

        if (updateError) throw new Error("Error al guardar resultado en DB: " + updateError.message);

        revalidatePath('/dashboard/tools/tool-4-ai-studio');

        return {
            success: true,
            result: { id: dbRecord.id, url: resultUrl, prompt: finalPrompt }
        };

    } catch (error: any) {
        console.error("AI Gen Error:", error);

        // Marcar como fallido si teníamos ID
        if (payload.id_temporal_db) { // Si lograste insertarlo arriba
            await supabase.from('ai_media_generations').update({ status: 'failed', error_message: error.message }).eq('id', payload.id_temporal_db);
        }

        return { success: false, error: error.message };
    }
}