'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────────────────────
// PIPELINES DISPONIBLES
// Cada pipeline sabe cómo construir su prompt y qué modelo usar.
// Agregar nuevos pipelines aquí sin tocar la UI.
// ─────────────────────────────────────────────────────────────
export type Pipeline =
    | 'product_photo'
    | 'fashion_photo'
    | 'food_photo'
    | 'product_video'
    | 'fashion_video'
    | 'food_video';

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ─────────────────────────────────────────────────────────────
// BUILDERS DE PROMPT POR PIPELINE
// Construyen el prompt textual final a partir de los parámetros.
// ─────────────────────────────────────────────────────────────
function buildPhotoPrompt(params: any, pipeline: Pipeline): string {
    const parts: string[] = [];

    // Base por tipo de pipeline
    if (pipeline === 'product_photo') {
        parts.push('Professional product photography, studio quality');
        if (params.productName) parts.push(`of "${params.productName}"`);
    } else if (pipeline === 'fashion_photo') {
        parts.push('Professional fashion photography, editorial quality');
        if (params.productName) parts.push(`featuring "${params.productName}"`);
        if (params.modelDescription) parts.push(`on a model: ${params.modelDescription}`);
    } else if (pipeline === 'food_photo') {
        parts.push('Professional food photography, appetizing and vibrant');
        if (params.productName) parts.push(`of "${params.productName}"`);
    }

    // Fondo
    if (params.backgroundType === 'preset' && params.backgroundPreset) {
        const bgMap: Record<string, string> = {
            beach: 'on a sunny beach background',
            space: 'with a dramatic outer space background',
            white_studio: 'on a clean white studio background',
            black_studio: 'on a sleek black studio background',
            wooden_table: 'on a rustic wooden table surface',
            modern_kitchen: 'in a modern kitchen setting',
            elegant_office: 'in an elegant office environment',
            ecommerce_premium: 'on a premium e-commerce white background, perfect for online store',
            lifestyle: 'in a lifestyle setting',
            minimalist: 'on a clean minimalist background',
            advertising: 'in a professional advertising composition',
            storefront: 'in a modern retail storefront display',
            urban_street: 'on an urban city street',
            editorial_studio: 'in an editorial fashion studio',
            rooftop: 'on a rooftop terrace with city views',
            modern_cafe: 'in a stylish modern café',
            pasarela: 'on a fashion runway',
            gastronomic: 'in a fine dining gastronomic setting',
        };
        const bgText = bgMap[params.backgroundPreset] || `with background: ${params.backgroundPreset}`;
        parts.push(bgText);
    } else if (params.backgroundType === 'color' && params.backgroundColor) {
        parts.push(`on a ${params.backgroundColor} background`);
    } else if (params.backgroundType === 'prompt' && params.backgroundPrompt) {
        parts.push(`in a setting described as: ${params.backgroundPrompt}`);
    }

    // Pose / composición
    if (params.pose) {
        const poseMap: Record<string, string> = {
            centered_front: 'centered front view composition',
            three_quarters: 'three-quarter angle composition',
            tilted: 'slightly tilted dynamic angle',
            on_table: 'resting on a surface',
            floating: 'floating/suspended in air',
            in_use: 'shown in use',
            close_up: 'close-up detail shot',
            advertising: 'advertising hero shot composition',
            macro: 'extreme macro detail shot',
            still_life: 'elegant still life arrangement',
            standing_front: 'model standing facing camera',
            walking: 'model walking naturally',
            sitting: 'model sitting casually',
            turned_three_quarters: 'model turned three-quarters',
            back_pose: 'model showing back view',
            editorial_pose: 'editorial fashion pose',
            urban_pose: 'casual urban pose',
            sports_pose: 'dynamic sports pose',
        };
        const poseText = poseMap[params.pose] || params.pose;
        parts.push(poseText);
    }

    // Interacción
    if (params.interactionPrompt) {
        parts.push(params.interactionPrompt);
    }

    // Estilo visual
    if (params.style) {
        const styleMap: Record<string, string> = {
            ecommerce: 'clean e-commerce style, white background, product centered',
            editorial: 'editorial magazine style, high contrast, artistic',
            lifestyle: 'lifestyle photography, natural light, authentic feel',
            streetwear: 'streetwear aesthetic, urban, edgy',
            premium: 'premium luxury brand aesthetic, sophisticated',
            sports: 'dynamic sports photography, energetic',
            casual: 'casual everyday lifestyle photography',
            luxury: 'ultra-luxury brand photography, opulent details',
            brand_campaign: 'clean brand campaign photography, aspirational',
            advertising_product: 'commercial advertising photography, polished',
            cinematic: 'cinematic photography style, dramatic lighting',
            minimalist: 'minimalist photography, clean lines, negative space',
            hyperrealistic: 'hyperrealistic photography, extreme detail',
            food_premium: 'fine dining food photography, appetizing, gourmet',
            food_delivery: 'fresh food delivery photography, bright and appetizing',
        };
        parts.push(styleMap[params.style] || params.style);
    }

    // Extras visuales
    if (params.extraPrompt) {
        parts.push(params.extraPrompt);
    }

    // Calidad base siempre al final
    parts.push('8K resolution, ultra high quality, photorealistic, sharp focus, professional lighting, commercial photography');

    return parts.join(', ');
}

function buildVideoPrompt(params: any, pipeline: Pipeline): string {
    const parts: string[] = [];

    if (pipeline === 'product_video') {
        parts.push('Professional product commercial video');
        if (params.productName) parts.push(`showcasing "${params.productName}"`);
    } else if (pipeline === 'fashion_video') {
        parts.push('Professional fashion lookbook video');
        if (params.productName) parts.push(`featuring "${params.productName}"`);
        if (params.modelDescription) parts.push(`worn by ${params.modelDescription}`);
    } else if (pipeline === 'food_video') {
        parts.push('Professional food advertising video');
        if (params.productName) parts.push(`of "${params.productName}"`);
    }

    if (params.backgroundPreset) parts.push(`background: ${params.backgroundPreset}`);
    if (params.backgroundPrompt) parts.push(params.backgroundPrompt);
    if (params.interactionPrompt) parts.push(params.interactionPrompt);

    if (params.cameraMotion) {
        const motionMap: Record<string, string> = {
            zoom_in: 'slow cinematic zoom in',
            zoom_out: 'smooth zoom out',
            pan_left: 'lateral pan left',
            pan_right: 'lateral pan right',
            orbit_360: '360 degree orbit around product',
            cinematic_approach: 'cinematic dolly approach',
            macro_detail: 'macro detail close-up movement',
            static_ambient: 'static camera with ambient movement',
        };
        parts.push(motionMap[params.cameraMotion] || params.cameraMotion);
    }

    if (params.style) parts.push(`${params.style} aesthetic`);
    if (params.extraPrompt) parts.push(params.extraPrompt);

    parts.push('cinematic quality, smooth motion, professional commercial video');

    return parts.join(', ');
}

// ─────────────────────────────────────────────────────────────
// FAL.AI SERVICE - IMAGE GENERATION
// Documentación: https://fal.ai/models/fal-ai/flux/dev
// ─────────────────────────────────────────────────────────────
async function callFalImageGeneration(params: {
    prompt: string;
    referenceImageUrls: string[];
    aspectRatio?: string;
}): Promise<{ success: boolean; outputUrl?: string; requestId?: string; error?: string }> {
    const FAL_KEY = process.env.FAL_API_KEY;
    if (!FAL_KEY) {
        return { success: false, error: 'FAL_API_KEY no configurada en variables de entorno.' };
    }

    try {
        const hasReferenceImages = params.referenceImageUrls.length > 0;

        // Si hay imágenes de referencia, usamos flux-pro con image conditioning
        // Si no, usamos flux/dev para texto a imagen puro
        const endpoint = hasReferenceImages
            ? 'https://fal.run/fal-ai/flux-pro/v1.1-ultra'
            : 'https://fal.run/fal-ai/flux/dev';

        const body: any = {
            prompt: params.prompt,
            num_images: 1,
            enable_safety_checker: false,
            output_format: 'jpeg',
        };

        // Aspect ratio
        if (params.aspectRatio === '9:16') body.image_size = 'portrait_16_9';
        else if (params.aspectRatio === '1:1') body.image_size = 'square_hd';
        else body.image_size = 'landscape_16_9';

        // Referencia visual: si tenemos imágenes, las mandamos como image_url para conditioning
        if (hasReferenceImages) {
            body.image_url = params.referenceImageUrls[0]; // Primera imagen como referencia principal
            body.strength = 0.75; // Cuánto respeta la referencia (0=libre, 1=copia exacta)
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${FAL_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errText = await response.text();
            return { success: false, error: `fal.ai error ${response.status}: ${errText}` };
        }

        const data = await response.json();
        const outputUrl = data?.images?.[0]?.url || data?.image?.url || null;

        if (!outputUrl) {
            return { success: false, error: 'fal.ai no devolvió imagen en la respuesta.' };
        }

        return { success: true, outputUrl, requestId: data?.request_id };
    } catch (err: any) {
        return { success: false, error: `Error de conexión con fal.ai: ${err.message}` };
    }
}

// ─────────────────────────────────────────────────────────────
// FAL.AI SERVICE - VIDEO GENERATION
// Nota arquitectural: Los videos tardan más. Este endpoint
// puede devolver un request_id para polling.
// Modelo recomendado: fal-ai/kling-video o fal-ai/minimax-video
// ─────────────────────────────────────────────────────────────
async function callFalVideoGeneration(params: {
    prompt: string;
    referenceImageUrls: string[];
    durationSeconds: number;
    aspectRatio: string;
}): Promise<{ success: boolean; outputUrl?: string; requestId?: string; error?: string }> {
    const FAL_KEY = process.env.FAL_API_KEY;
    if (!FAL_KEY) {
        return { success: false, error: 'FAL_API_KEY no configurada en variables de entorno.' };
    }

    try {
        // Usamos kling-video si hay imagen de referencia, minimax-video si es solo texto
        const hasRef = params.referenceImageUrls.length > 0;
        const endpoint = hasRef
            ? 'https://fal.run/fal-ai/kling-video/v1.6/pro/image-to-video'
            : 'https://fal.run/fal-ai/minimax-video/image-to-video';

        const body: any = {
            prompt: params.prompt,
            duration: params.durationSeconds <= 5 ? '5' : '10',
            aspect_ratio: params.aspectRatio === '9:16' ? '9:16' : params.aspectRatio === '1:1' ? '1:1' : '16:9',
        };

        if (hasRef) {
            body.image_url = params.referenceImageUrls[0];
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${FAL_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errText = await response.text();
            return { success: false, error: `fal.ai video error ${response.status}: ${errText}` };
        }

        const data = await response.json();

        // Kling puede devolver el video directo o un request_id para polling
        const outputUrl = data?.video?.url || data?.video_url || null;
        const requestId = data?.request_id || null;

        if (outputUrl) {
            return { success: true, outputUrl, requestId };
        } else if (requestId) {
            // El video está procesándose asincrónicamente
            return { success: true, requestId, outputUrl: undefined };
        } else {
            return { success: false, error: 'fal.ai no devolvió video ni request_id.' };
        }
    } catch (err: any) {
        return { success: false, error: `Error de conexión con fal.ai: ${err.message}` };
    }
}

// ─────────────────────────────────────────────────────────────
// POLLING: verificar resultado de generación asincrónica
// ─────────────────────────────────────────────────────────────
async function pollFalResult(requestId: string, endpoint: string): Promise<{
    status: 'processing' | 'completed' | 'failed';
    outputUrl?: string;
    error?: string;
}> {
    const FAL_KEY = process.env.FAL_API_KEY;
    if (!FAL_KEY) return { status: 'failed', error: 'No FAL_API_KEY' };

    try {
        const response = await fetch(`https://queue.fal.run/${endpoint}/requests/${requestId}/status`, {
            headers: { 'Authorization': `Key ${FAL_KEY}` },
        });
        const data = await response.json();

        if (data.status === 'COMPLETED') {
            const outputUrl = data?.response?.video?.url || data?.response?.images?.[0]?.url || null;
            return { status: 'completed', outputUrl };
        } else if (data.status === 'FAILED') {
            return { status: 'failed', error: data.error || 'Generation failed' };
        } else {
            return { status: 'processing' };
        }
    } catch {
        return { status: 'failed', error: 'Polling error' };
    }
}

// ─────────────────────────────────────────────────────────────
// ACTION PRINCIPAL: GENERAR IMAGEN
// ─────────────────────────────────────────────────────────────
export async function generateImageAction(params: {
    pipeline: Pipeline;
    productIds: string[];
    uploadedReferenceImages: string[];
    savedModelId?: string;
    uploadedModelImages?: string[];
    backgroundType: string;
    backgroundPreset?: string;
    backgroundColor?: string;
    backgroundPrompt?: string;
    pose?: string;
    interactionPrompt?: string;
    extraPrompt?: string;
    style?: string;
    productName?: string;
    modelDescription?: string;
}) {
    try {
        // 1. Obtener imágenes de referencia del producto si viene de Tool 1
        let referenceImages: string[] = [...(params.uploadedReferenceImages || [])];
        let productName = params.productName || '';

        if (params.productIds.length > 0) {
            const { data: products } = await supabase
                .from('products')
                .select('name, image_urls, internal_reference_images')
                .in('id', params.productIds);

            if (products && products.length > 0) {
                if (!productName) productName = products[0].name;
                // Priorizar imágenes internas, luego las públicas
                for (const prod of products) {
                    const internalImgs: string[] = prod.internal_reference_images || [];
                    const publicImgs: string[] = prod.image_urls || [];
                    const productImgs = internalImgs.length > 0 ? internalImgs : publicImgs;
                    referenceImages = [...referenceImages, ...productImgs];
                }
            }
        }

        // 2. Agregar imágenes del modelo si corresponde
        if (params.uploadedModelImages && params.uploadedModelImages.length > 0) {
            referenceImages = [...referenceImages, ...params.uploadedModelImages];
        } else if (params.savedModelId) {
            const { data: model } = await supabase
                .from('tool_ai_saved_models')
                .select('reference_images, name, description')
                .eq('id', params.savedModelId)
                .single();
            if (model) {
                const modelImgs: string[] = model.reference_images || [];
                referenceImages = [...referenceImages, ...modelImgs];
                if (!params.modelDescription) params.modelDescription = model.description || model.name;
            }
        }

        // Máximo 3 imágenes de referencia combinadas (limitación de la API)
        referenceImages = referenceImages.slice(0, 3);

        // 3. Construir prompt final
        const finalPrompt = buildPhotoPrompt({ ...params, productName }, params.pipeline);

        // 4. Crear registro en historial con estado "processing"
        const { data: generationRecord, error: insertError } = await supabase
            .from('tool_ai_generations')
            .insert({
                generation_type: 'photo',
                pipeline: params.pipeline,
                product_ids: params.productIds,
                uploaded_reference_images: referenceImages,
                saved_model_id: params.savedModelId || null,
                uploaded_model_images: params.uploadedModelImages || [],
                background_type: params.backgroundType,
                background_preset: params.backgroundPreset || null,
                background_color: params.backgroundColor || null,
                background_prompt: params.backgroundPrompt || null,
                pose: params.pose || null,
                interaction_prompt: params.interactionPrompt || null,
                extra_prompt: params.extraPrompt || null,
                style: params.style || null,
                final_prompt: finalPrompt,
                ai_provider: 'fal.ai',
                ai_model: referenceImages.length > 0 ? 'flux-pro/v1.1-ultra' : 'flux/dev',
                status: 'processing',
            })
            .select('id')
            .single();

        if (insertError) return { success: false, error: insertError.message };

        const generationId = generationRecord.id;

        // 5. Llamar a fal.ai
        const aiResult = await callFalImageGeneration({
            prompt: finalPrompt,
            referenceImageUrls: referenceImages,
        });

        // 6. Actualizar registro con resultado
        if (aiResult.success && aiResult.outputUrl) {
            await supabase
                .from('tool_ai_generations')
                .update({
                    status: 'completed',
                    output_url: aiResult.outputUrl,
                    ai_request_id: aiResult.requestId || null,
                })
                .eq('id', generationId);

            revalidatePath('/dashboard/tools/tool-4-ai/historial');
            return { success: true, generationId, outputUrl: aiResult.outputUrl };
        } else {
            await supabase
                .from('tool_ai_generations')
                .update({ status: 'failed', error_message: aiResult.error })
                .eq('id', generationId);

            return { success: false, generationId, error: aiResult.error };
        }
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ─────────────────────────────────────────────────────────────
// ACTION PRINCIPAL: GENERAR VIDEO
// ─────────────────────────────────────────────────────────────
export async function generateVideoAction(params: {
    pipeline: Pipeline;
    productIds: string[];
    uploadedReferenceImages: string[];
    savedModelId?: string;
    uploadedModelImages?: string[];
    backgroundType: string;
    backgroundPreset?: string;
    backgroundPrompt?: string;
    interactionPrompt?: string;
    extraPrompt?: string;
    style?: string;
    cameraMotion?: string;
    durationSeconds: number;
    aspectRatio: string;
    productName?: string;
    modelDescription?: string;
}) {
    try {
        let referenceImages: string[] = [...(params.uploadedReferenceImages || [])];
        let productName = params.productName || '';

        if (params.productIds.length > 0) {
            const { data: products } = await supabase
                .from('products')
                .select('name, image_urls, internal_reference_images')
                .in('id', params.productIds);

            if (products && products.length > 0) {
                if (!productName) productName = products[0].name;
                for (const prod of products) {
                    const internalImgs: string[] = prod.internal_reference_images || [];
                    const publicImgs: string[] = prod.image_urls || [];
                    referenceImages = [...referenceImages, ...(internalImgs.length > 0 ? internalImgs : publicImgs)];
                }
            }
        }

        if (params.savedModelId) {
            const { data: model } = await supabase
                .from('tool_ai_saved_models')
                .select('reference_images')
                .eq('id', params.savedModelId)
                .single();
            if (model) referenceImages = [...referenceImages, ...(model.reference_images || [])];
        }

        referenceImages = referenceImages.slice(0, 2); // Video acepta menos referencias

        const finalPrompt = buildVideoPrompt({ ...params, productName }, params.pipeline);

        const { data: generationRecord, error: insertError } = await supabase
            .from('tool_ai_generations')
            .insert({
                generation_type: 'video',
                pipeline: params.pipeline,
                product_ids: params.productIds,
                uploaded_reference_images: referenceImages,
                saved_model_id: params.savedModelId || null,
                background_type: params.backgroundType,
                background_preset: params.backgroundPreset || null,
                background_prompt: params.backgroundPrompt || null,
                interaction_prompt: params.interactionPrompt || null,
                extra_prompt: params.extraPrompt || null,
                style: params.style || null,
                camera_motion: params.cameraMotion || null,
                duration_seconds: params.durationSeconds,
                aspect_ratio: params.aspectRatio,
                final_prompt: finalPrompt,
                ai_provider: 'fal.ai',
                ai_model: referenceImages.length > 0 ? 'kling-video/v1.6' : 'minimax-video',
                status: 'processing',
            })
            .select('id')
            .single();

        if (insertError) return { success: false, error: insertError.message };

        const generationId = generationRecord.id;

        const aiResult = await callFalVideoGeneration({
            prompt: finalPrompt,
            referenceImageUrls: referenceImages,
            durationSeconds: params.durationSeconds,
            aspectRatio: params.aspectRatio,
        });

        if (aiResult.success && aiResult.outputUrl) {
            await supabase
                .from('tool_ai_generations')
                .update({ status: 'completed', output_url: aiResult.outputUrl, ai_request_id: aiResult.requestId })
                .eq('id', generationId);
            revalidatePath('/dashboard/tools/tool-4-ai/historial');
            return { success: true, generationId, outputUrl: aiResult.outputUrl };
        } else if (aiResult.success && aiResult.requestId) {
            // Asincrónico - el cliente deberá hacer polling
            await supabase
                .from('tool_ai_generations')
                .update({ status: 'processing', ai_request_id: aiResult.requestId })
                .eq('id', generationId);
            return { success: true, generationId, pending: true, requestId: aiResult.requestId };
        } else {
            await supabase
                .from('tool_ai_generations')
                .update({ status: 'failed', error_message: aiResult.error })
                .eq('id', generationId);
            return { success: false, generationId, error: aiResult.error };
        }
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ─────────────────────────────────────────────────────────────
// POLLING DE ESTADO DE GENERACIÓN (para video asincrónico)
// ─────────────────────────────────────────────────────────────
export async function checkGenerationStatusAction(generationId: string) {
    const { data, error } = await supabase
        .from('tool_ai_generations')
        .select('status, output_url, error_message, ai_request_id, ai_model, generation_type')
        .eq('id', generationId)
        .single();

    if (error) return { success: false, error: error.message };

    // Si sigue en processing y tenemos request_id, consultamos a fal.ai
    if (data.status === 'processing' && data.ai_request_id) {
        const endpoint = data.generation_type === 'video'
            ? (data.ai_model?.includes('kling') ? 'fal-ai/kling-video/v1.6/pro/image-to-video' : 'fal-ai/minimax-video')
            : 'fal-ai/flux-pro/v1.1-ultra';

        const polled = await pollFalResult(data.ai_request_id, endpoint);
        if (polled.status === 'completed' && polled.outputUrl) {
            await supabase.from('tool_ai_generations').update({ status: 'completed', output_url: polled.outputUrl }).eq('id', generationId);
            return { success: true, status: 'completed', outputUrl: polled.outputUrl };
        } else if (polled.status === 'failed') {
            await supabase.from('tool_ai_generations').update({ status: 'failed', error_message: polled.error }).eq('id', generationId);
            return { success: true, status: 'failed', error: polled.error };
        }
    }

    return { success: true, status: data.status, outputUrl: data.output_url, error: data.error_message };
}

// ─────────────────────────────────────────────────────────────
// HISTORIAL
// ─────────────────────────────────────────────────────────────
export async function getGenerationsHistoryAction(filters?: {
    type?: 'photo' | 'video';
    pipeline?: string;
    limit?: number;
}) {
    let query = supabase
        .from('tool_ai_generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);

    if (filters?.type) query = query.eq('generation_type', filters.type);
    if (filters?.pipeline) query = query.eq('pipeline', filters.pipeline);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function deleteGenerationAction(id: string) {
    const { error } = await supabase.from('tool_ai_generations').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/dashboard/tools/tool-4-ai/historial');
    return { success: true };
}

// ─────────────────────────────────────────────────────────────
// MODELOS HUMANOS GUARDADOS
// ─────────────────────────────────────────────────────────────
export async function getSavedModelsAction() {
    const { data, error } = await supabase
        .from('tool_ai_saved_models')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function saveSavedModelAction(model: {
    id?: string;
    name: string;
    description?: string;
    referenceImages: string[];
    tags: string[];
}) {
    if (model.id) {
        const { error } = await supabase
            .from('tool_ai_saved_models')
            .update({
                name: model.name,
                description: model.description || null,
                reference_images: model.referenceImages,
                tags: model.tags,
            })
            .eq('id', model.id);
        if (error) return { success: false, error: error.message };
    } else {
        // Máximo 5 modelos
        const { count } = await supabase.from('tool_ai_saved_models').select('id', { count: 'exact', head: true }).eq('is_active', true);
        if ((count || 0) >= 5) return { success: false, error: 'Límite de 5 modelos guardados alcanzado.' };

        const { error } = await supabase.from('tool_ai_saved_models').insert({
            name: model.name,
            description: model.description || null,
            reference_images: model.referenceImages,
            tags: model.tags,
        });
        if (error) return { success: false, error: error.message };
    }
    revalidatePath('/dashboard/tools/tool-4-ai/configuracion');
    return { success: true };
}

export async function deleteSavedModelAction(id: string) {
    const { error } = await supabase.from('tool_ai_saved_models').update({ is_active: false }).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/dashboard/tools/tool-4-ai/configuracion');
    return { success: true };
}

// ─────────────────────────────────────────────────────────────
// PRODUCTOS PARA SELECTOR (de Tool 1)
// ─────────────────────────────────────────────────────────────
export async function getProductsForAiAction() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, category, image_urls, internal_reference_images, price_installments')
        .order('created_at', { ascending: false })
        .limit(200);
    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

// ─────────────────────────────────────────────────────────────
// ACTUALIZAR IMÁGENES INTERNAS DE UN PRODUCTO
// ─────────────────────────────────────────────────────────────
export async function updateInternalImagesAction(productId: string, images: string[]) {
    const { error } = await supabase
        .from('products')
        .update({ internal_reference_images: images.slice(0, 4) })
        .eq('id', productId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/dashboard/tools/tool-1-QR');
    return { success: true };
}
