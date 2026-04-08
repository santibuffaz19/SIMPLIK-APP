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
        // 1. OBTENER API KEY
        const falApiKey = process.env.FAL_KEY;
        if (!falApiKey) {
            throw new Error("Falta configurar FAL_KEY en las variables de entorno de Vercel.");
        }

        // 2. REGISTRAR INTENTO EN BD (ESTADO "PROCESSING")
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
            .select()
            .single();

        if (dbError) throw new Error("No se pudo iniciar el registro en la base de datos.");

        // 3. PREPARAR DATOS DE REFERENCIA
        let imageUrlToProcess = '';

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
            throw new Error("No se encontró ninguna imagen válida para enviar a la IA.");
        }

        // 4. CONSTRUCCIÓN DE PROMPT Y CONFIGURACIÓN
        const { background, pose, interaction, extraPrompt, style, duration, aspectRatio } = payload.parameters;

        let falEndpoint = '';
        let falRequestBody: any = {};
        let finalPrompt = '';

        if (payload.type === 'photo') {
            if (payload.mode === 'fashion') {
                falEndpoint = 'https://queue.fal.run/fal-ai/idm-vton';

                let humanModelUrl = '';
                if (payload.savedModelId) {
                    const { data: savedModel } = await supabase.from('ai_saved_models').select('reference_images').eq('id', payload.savedModelId).single();
                    if (savedModel && savedModel.reference_images.length > 0) {
                        humanModelUrl = savedModel.reference_images[0];
                    }
                }

                if (!humanModelUrl) throw new Error("Falta seleccionar un modelo humano.");

                finalPrompt = `Fashion photography, ${style} style, ${background}. ${pose}. ${extraPrompt}`;

                falRequestBody = {
                    human_image_url: humanModelUrl,
                    garment_image_url: imageUrlToProcess,
                    description: finalPrompt,
                    category: "upper_body"
                };
            } else {
                // MODO PRODUCTO/COMIDA -> Usamos FLUX DEV IMAGE-TO-IMAGE
                falEndpoint = 'https://queue.fal.run/fal-ai/flux/dev/image-to-image';

                // MEJORA DEL PROMPT PARA PRIORIZAR IDENTIDAD
                finalPrompt = `Professional photo taken with a DSLR camera. altamente detallado, nítido, photorealistic. `;
                if (payload.mode === 'food') finalPrompt = `Professional appetizing food photography, fresh. `;

                finalPrompt += `The product object (geometry, handle, cap, logos, texture, exact shape) must be strictly preserved from the original image and remain identical without any distortion. `;
                finalPrompt += `The background environment is: ${background}. `;
                if (interaction) finalPrompt += `${interaction}. `;
                if (pose) finalPrompt += `Positioned ${pose}. `;
                finalPrompt += `Style: ${style}. Extra details: ${extraPrompt}.`;

                falRequestBody = {
                    image_url: imageUrlToProcess,
                    prompt: finalPrompt,
                    // SOLUCIÓN: Strength muy bajo para preservar identidad del producto
                    // La IA tiene solo 30% libertad para cambiar, el resto es la original intacta.
                    strength: 0.3,
                    num_inference_steps: 40 // Más pasos para mejorar nitidez
                };
            }
        } else if (payload.type === 'video') {
            falEndpoint = 'https://queue.fal.run/fal-ai/kling-video/v1/standard/image-to-video';

            finalPrompt = `Cinematic video shot. `;
            if (payload.mode === 'food') finalPrompt = `Cinematic food commercial. `;
            if (payload.mode === 'fashion') finalPrompt = `Fashion promotional video. `;

            finalPrompt += `Environment: ${background}. `;
            if (interaction) finalPrompt += `Action: ${interaction}. `;
            finalPrompt += `Style: ${style}. ${extraPrompt}. Smooth camera movement. The product in the video must look exactly like the input product without any changes.`;

            falRequestBody = {
                image_url: imageUrlToProcess,
                prompt: finalPrompt,
                duration: duration === '5s' ? '5' : '10',
                aspect_ratio: aspectRatio || "16:9"
            };
        }

        // 5. LLAMADA A FAL.AI (USANDO CACHE: NO-STORE PARA EVITAR BUGS DE NEXTJS)
        const submitResponse = await fetch(falEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${falApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(falRequestBody),
            cache: 'no-store'
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.text();
            throw new Error(`FAL API RECHAZÓ LA SOLICITUD: ${errorData}`);
        }

        const submitData = await submitResponse.json();
        const statusUrl = submitData.status_url;
        const responseUrl = submitData.response_url;

        if (!statusUrl || !responseUrl) {
            throw new Error(`FAL API devolvió una respuesta incompleta: ${JSON.stringify(submitData)}`);
        }

        // Polling con no-store
        let status = 'IN_QUEUE';
        let attempts = 0;
        const maxAttempts = 60; // 2 minutos máximo

        while (status !== 'COMPLETED' && status !== 'FAILED' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const statusResponse = await fetch(statusUrl, {
                headers: { 'Authorization': `Key ${falApiKey}` },
                cache: 'no-store'
            });

            if (statusResponse.ok) {
                const statusJson = await statusResponse.json();
                status = statusJson.status;
            } else {
                const errText = await statusResponse.text();
                throw new Error(`Error consultando estado a FAL: ${errText}`);
            }
            attempts++;
        }

        if (status === 'FAILED') {
            const failResponse = await fetch(responseUrl, {
                headers: { 'Authorization': `Key ${falApiKey}` },
                cache: 'no-store'
            });
            const failData = await failResponse.text();
            throw new Error(`La IA falló internamente al procesar la imagen. Razón: ${failData}`);
        }

        if (status !== 'COMPLETED') {
            throw new Error("Tiempo de espera agotado (Timeout).");
        }

        // Traer el archivo final
        const resultResponse = await fetch(responseUrl, {
            headers: { 'Authorization': `Key ${falApiKey}`, 'Accept': 'application/json' },
            cache: 'no-store'
        });

        if (!resultResponse.ok) {
            const errorData = await resultResponse.text();
            throw new Error(`Error descargando resultado de FAL: ${errorData}`);
        }

        const resultJson = await resultResponse.json();

        // Extraer la URL
        let resultUrl = '';
        if (payload.type === 'photo' && payload.mode === 'fashion') {
            resultUrl = resultJson.image?.url || resultJson.images?.[0]?.url;
        } else if (payload.type === 'photo') {
            resultUrl = resultJson.images?.[0]?.url || resultJson.image?.url;
        } else if (payload.type === 'video') {
            resultUrl = resultJson.video?.url;
        }

        if (!resultUrl) {
            throw new Error(`La IA no devolvió un archivo multimedia válido. Respuesta: ${JSON.stringify(resultJson)}`);
        }

        // 6. ACTUALIZAMOS LA BASE DE DATOS
        await supabase
            .from('ai_media_generations')
            .update({
                status: 'completed',
                final_ai_prompt: finalPrompt,
                result_url: resultUrl
            })
            .eq('id', dbRecord.id);

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