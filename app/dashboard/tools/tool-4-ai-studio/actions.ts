'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────────────────────
// TIPOS Y PIPELINES
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
// HELPER: lee la API key del nombre CORRECTO de la variable
// En .env.local: FAL_KEY  (NO FAL_API_KEY)
// ─────────────────────────────────────────────────────────────
function getFalKey(): string | null {
    return process.env.FAL_KEY || process.env.FAL_API_KEY || null;
}

// ─────────────────────────────────────────────────────────────
// BUILDER DE PROMPT FOTO
// Construye un prompt detallado priorizando fidelidad al producto
// ─────────────────────────────────────────────────────────────
function buildPhotoPrompt(params: any, pipeline: Pipeline): string {
    const parts: string[] = [];

    if (pipeline === 'product_photo') {
        parts.push('Professional commercial product photography');
        if (params.productName) {
            parts.push(`The exact product is: ${params.productName}. Preserve all product details, colors, textures, labels, and branding exactly as they appear in the reference image`);
        }
    } else if (pipeline === 'fashion_photo') {
        parts.push('Professional fashion editorial photography');
        if (params.productName) {
            parts.push(`The garment/product featured is: ${params.productName}. Preserve fabric texture, color, pattern, logo placement, and all design details exactly`);
        }
        if (params.modelDescription) parts.push(`worn by: ${params.modelDescription}`);
    } else if (pipeline === 'food_photo') {
        parts.push('Professional food photography, appetizing, vibrant colors');
        if (params.productName) {
            parts.push(`The dish/product is: ${params.productName}. Preserve the exact appearance, colors, textures and presentation`);
        }
    }

    // Fondo
    const bgMap: Record<string, string> = {
        beach: 'sunny tropical beach setting, natural light, sand and sea visible',
        space: 'dramatic outer space background, stars, nebula',
        white_studio: 'pure clean white studio backdrop, professional soft lighting',
        black_studio: 'sleek matte black studio backdrop, dramatic lighting',
        wooden_table: 'rustic warm wooden surface, natural textures',
        modern_kitchen: 'modern minimalist kitchen interior, soft natural light',
        elegant_office: 'elegant executive office environment, bokeh background',
        ecommerce_premium: 'pure white seamless background perfect for e-commerce, even soft shadows',
        lifestyle: 'bright airy lifestyle setting, natural daylight, lived-in feel',
        minimalist: 'ultra-clean minimal background, subtle gradient, pure aesthetic',
        advertising: 'bold commercial advertising composition, dynamic staging',
        storefront: 'premium retail window display, glass reflections',
        urban_street: 'urban street photography, city environment, concrete textures',
        editorial_studio: 'high-fashion editorial studio, dramatic shadows',
        rooftop: 'rooftop terrace with panoramic city skyline at golden hour',
        modern_cafe: 'stylish contemporary café interior, warm ambient lighting',
        pasarela: 'fashion runway, professional catwalk lighting',
        gastronomic: 'fine dining restaurant setting, atmospheric lighting',
    };

    if (params.backgroundType === 'preset' && params.backgroundPreset) {
        parts.push(bgMap[params.backgroundPreset] || `background: ${params.backgroundPreset}`);
    } else if (params.backgroundType === 'color' && params.backgroundColor) {
        parts.push(`solid ${params.backgroundColor} colored background`);
    } else if (params.backgroundType === 'prompt' && params.backgroundPrompt) {
        parts.push(`background setting: ${params.backgroundPrompt}`);
    }

    // Pose / composición
    const poseMap: Record<string, string> = {
        centered_front: 'perfectly centered front-facing composition, symmetric',
        three_quarters: 'three-quarter angle, slight depth perspective',
        tilted: 'dynamic slightly tilted angle, editorial feel',
        on_table: 'product resting naturally on a surface, tabletop photography',
        floating: 'product floating suspended in air, levitation effect, dynamic',
        in_use: 'product shown actively in use, lifestyle context',
        close_up: 'extreme close-up macro detail shot, texture emphasis',
        advertising: 'wide hero advertising shot, dramatic composition',
        macro: 'extreme macro photography, microscopic texture detail',
        still_life: 'classic elegant still life arrangement with props',
        standing_front: 'model standing tall, facing camera directly, full body',
        walking: 'model mid-stride, natural movement, candid energy',
        sitting: 'model seated casually, relaxed natural pose',
        turned_three_quarters: 'model turned 3/4 profile, classic editorial angle',
        back_pose: 'model facing away from camera, showing back of garment',
        editorial_pose: 'high fashion editorial pose, avant-garde, strong',
        urban_pose: 'casual street style pose, relaxed urban energy',
        sports_pose: 'dynamic athletic movement pose, high energy',
    };

    if (params.pose) {
        parts.push(poseMap[params.pose] || params.pose);
    }

    if (params.interactionPrompt) {
        parts.push(`scene context: ${params.interactionPrompt}`);
    }

    // Estilo visual
    const styleMap: Record<string, string> = {
        ecommerce: 'clean e-commerce product shot, isolated subject, commercial clarity',
        editorial: 'high fashion editorial style, artistic direction, magazine quality',
        lifestyle: 'authentic lifestyle photography, natural light, relatable',
        streetwear: 'streetwear urban aesthetic, raw edgy energy, authentic',
        premium: 'ultra-premium luxury brand aesthetic, refined sophistication',
        sports: 'high-energy sports photography, motion blur, athletic power',
        casual: 'casual everyday real-life photography, approachable warm',
        luxury: 'ultra-luxury opulent brand photography, gold tones, exclusive',
        brand_campaign: 'aspirational brand campaign imagery, emotional storytelling',
        advertising_product: 'polished commercial advertising photography, bold',
        cinematic: 'cinematic film photography, dramatic moody lighting, depth',
        minimalist: 'ultra-minimalist composition, negative space, refined',
        hyperrealistic: 'hyperrealistic photography, extreme detail, indistinguishable from real',
        food_premium: 'Michelin-star food photography, artistic plating, gourmet',
        food_delivery: 'bright fresh food photography, appetizing appeal, vibrant',
    };

    if (params.style) {
        parts.push(styleMap[params.style] || params.style);
    }

    if (params.extraPrompt) {
        parts.push(params.extraPrompt);
    }

    // Calidad y técnica — siempre al final
    parts.push('professional DSLR photography, 8K ultra resolution, perfect focus, commercial grade lighting, award-winning photography');

    return parts.join('. ');
}

// ─────────────────────────────────────────────────────────────
// BUILDER DE PROMPT VIDEO
// ─────────────────────────────────────────────────────────────
function buildVideoPrompt(params: any, pipeline: Pipeline): string {
    const parts: string[] = [];

    if (pipeline === 'product_video') {
        parts.push('Professional product commercial video clip');
        if (params.productName) parts.push(`showcasing ${params.productName} product, preserving exact product appearance and branding`);
    } else if (pipeline === 'fashion_video') {
        parts.push('Professional fashion lookbook video');
        if (params.productName) parts.push(`featuring ${params.productName} garment, showing fabric movement and design details`);
        if (params.modelDescription) parts.push(`worn by ${params.modelDescription}`);
    } else if (pipeline === 'food_video') {
        parts.push('Professional food advertising video clip');
        if (params.productName) parts.push(`of ${params.productName}, appetizing presentation`);
    }

    if (params.backgroundPreset) parts.push(`background: ${params.backgroundPreset}`);
    if (params.backgroundPrompt) parts.push(params.backgroundPrompt);
    if (params.interactionPrompt) parts.push(params.interactionPrompt);

    const motionMap: Record<string, string> = {
        zoom_in: 'slow cinematic zoom in toward subject',
        zoom_out: 'smooth pull-back zoom out reveal',
        pan_left: 'smooth lateral pan left across scene',
        pan_right: 'smooth lateral pan right across scene',
        orbit_360: 'elegant 360 degree orbit around subject',
        cinematic_approach: 'cinematic dolly push forward approach',
        macro_detail: 'macro close-up detail movement, texture exploration',
        static_ambient: 'static locked camera with ambient particle movement',
    };

    if (params.cameraMotion) {
        parts.push(motionMap[params.cameraMotion] || params.cameraMotion);
    }

    if (params.style) parts.push(`${params.style} visual style`);
    if (params.extraPrompt) parts.push(params.extraPrompt);

    parts.push('cinematic quality, smooth motion, professional color grading, commercial production value');

    return parts.join(', ');
}

// ─────────────────────────────────────────────────────────────
// FAL.AI - GENERACIÓN DE IMAGEN
//
// Modelo elegido: fal-ai/flux/dev (text-to-image, barato y bueno)
// Con referencias: fal-ai/flux-lora (image conditioning vía LoRA)
// Para fidelidad máxima al producto: fal-ai/creative-upscaler
//
// Estrategia precio/calidad:
// - SIN referencias: flux/dev → ~$0.003/imagen, muy buena calidad
// - CON referencias: flux-pro/new → ~$0.05/imagen, alta fidelidad
// - Alternativa económica con ref: recraft-v3 → ~$0.01/imagen
// ─────────────────────────────────────────────────────────────
async function callFalImageGeneration(params: {
    prompt: string;
    referenceImageUrls: string[];
    aspectRatio?: string;
}): Promise<{ success: boolean; outputUrl?: string; requestId?: string; error?: string }> {
    const FAL_KEY = getFalKey();
    if (!FAL_KEY) {
        return { success: false, error: 'FAL_KEY no configurada. Agregala en Vercel como variable de entorno.' };
    }

    try {
        const hasReferenceImages = params.referenceImageUrls.filter(u => u && u.startsWith('http')).length > 0;
        const cleanRefs = params.referenceImageUrls.filter(u => u && u.startsWith('http'));

        // Determinamos image_size según aspect ratio
        let image_size = 'square_hd';
        if (params.aspectRatio === '16:9') image_size = 'landscape_16_9';
        else if (params.aspectRatio === '9:16') image_size = 'portrait_16_9';
        else image_size = 'square_hd';

        let endpoint: string;
        let body: any;

        if (hasReferenceImages) {
            // Con referencias: usamos flux-pro/v1/redux que acepta image_url
            // Es el mejor relación precio/fidelidad de producto con imagen de referencia
            // ~$0.05 por imagen pero mantiene los rasgos visuales del producto
            endpoint = 'https://fal.run/fal-ai/flux-pro/v1/redux';
            body = {
                prompt: params.prompt,
                image_url: cleanRefs[0], // imagen de referencia principal
                image_size,
                num_inference_steps: 28,
                guidance_scale: 3.5,
                num_images: 1,
                output_format: 'jpeg',
                safety_tolerance: '5',
            };
        } else {
            // Sin referencias: flux/dev es el mejor relación calidad/precio
            // ~$0.003 por imagen
            endpoint = 'https://fal.run/fal-ai/flux/dev';
            body = {
                prompt: params.prompt,
                image_size,
                num_inference_steps: 28,
                guidance_scale: 3.5,
                num_images: 1,
                enable_safety_checker: false,
                output_format: 'jpeg',
            };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${FAL_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const rawText = await response.text();

        if (!response.ok) {
            return { success: false, error: `fal.ai error ${response.status}: ${rawText.slice(0, 300)}` };
        }

        let data: any;
        try { data = JSON.parse(rawText); } catch {
            return { success: false, error: `Respuesta inválida de fal.ai: ${rawText.slice(0, 200)}` };
        }

        const outputUrl = data?.images?.[0]?.url || data?.image?.url || null;

        if (!outputUrl) {
            return { success: false, error: `fal.ai no devolvió imagen. Respuesta: ${JSON.stringify(data).slice(0, 300)}` };
        }

        return { success: true, outputUrl, requestId: data?.request_id };

    } catch (err: any) {
        return { success: false, error: `Error de red con fal.ai: ${err.message}` };
    }
}

// ─────────────────────────────────────────────────────────────
// FAL.AI - GENERACIÓN DE VIDEO
//
// Modelo elegido: fal-ai/kling-video/v2.1/standard/image-to-video
// - Acepta imagen de referencia del producto → máxima fidelidad
// - ~$0.07 por 5s clip, standard quality
// - Alternativa: minimax/video-01 si kling falla (~$0.05)
//
// Los videos SIEMPRE son asincrónicos en fal.ai.
// Retornamos el request_id para hacer polling desde el cliente.
// ─────────────────────────────────────────────────────────────
async function callFalVideoGeneration(params: {
    prompt: string;
    referenceImageUrls: string[];
    durationSeconds: number;
    aspectRatio: string;
}): Promise<{ success: boolean; outputUrl?: string; requestId?: string; endpoint?: string; error?: string }> {
    const FAL_KEY = getFalKey();
    if (!FAL_KEY) {
        return { success: false, error: 'FAL_KEY no configurada.' };
    }

    try {
        const cleanRefs = params.referenceImageUrls.filter(u => u && u.startsWith('http'));
        const hasRef = cleanRefs.length > 0;

        const duration = params.durationSeconds <= 5 ? '5' : '10';
        const aspect_ratio = params.aspectRatio === '9:16' ? '9:16'
            : params.aspectRatio === '1:1' ? '1:1' : '16:9';

        // Endpoint queue: los videos siempre van por la cola asincrónica de fal
        // El endpoint principal se usa para submit, luego polling por request_id
        let endpointId: string;
        let body: any;

        if (hasRef) {
            // kling-video image-to-video: toma la imagen del producto y genera video
            endpointId = 'fal-ai/kling-video/v2.1/standard/image-to-video';
            body = {
                prompt: params.prompt,
                image_url: cleanRefs[0],
                duration,
                aspect_ratio,
            };
        } else {
            // Sin referencia: minimax video-01 text-to-video
            endpointId = 'fal-ai/minimax/video-01';
            body = {
                prompt: params.prompt,
                prompt_optimizer: true,
            };
        }

        // Submit al queue de fal.ai (endpoint asincrónico)
        const submitRes = await fetch(`https://queue.fal.run/${endpointId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${FAL_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const rawText = await submitRes.text();

        if (!submitRes.ok) {
            return { success: false, error: `fal.ai queue error ${submitRes.status}: ${rawText.slice(0, 300)}` };
        }

        let data: any;
        try { data = JSON.parse(rawText); } catch {
            return { success: false, error: `Respuesta inválida del queue: ${rawText.slice(0, 200)}` };
        }

        const requestId = data?.request_id;
        if (!requestId) {
            return { success: false, error: `fal.ai no devolvió request_id. Respuesta: ${JSON.stringify(data).slice(0, 300)}` };
        }

        // Devolvemos el request_id para polling desde el action de check
        return { success: true, requestId, endpoint: endpointId };

    } catch (err: any) {
        return { success: false, error: `Error de red con fal.ai video: ${err.message}` };
    }
}

// ─────────────────────────────────────────────────────────────
// POLLING - verifica el resultado del queue de fal.ai
// ─────────────────────────────────────────────────────────────
async function pollFalQueue(requestId: string, endpointId: string): Promise<{
    status: 'processing' | 'completed' | 'failed';
    outputUrl?: string;
    error?: string;
}> {
    const FAL_KEY = getFalKey();
    if (!FAL_KEY) return { status: 'failed', error: 'No FAL_KEY' };

    try {
        // 1. Verificar status
        const statusRes = await fetch(
            `https://queue.fal.run/${endpointId}/requests/${requestId}/status`,
            { headers: { 'Authorization': `Key ${FAL_KEY}` } }
        );
        const statusData = await statusRes.json();

        if (statusData.status === 'FAILED') {
            return { status: 'failed', error: statusData.error || 'Generation failed in queue' };
        }

        if (statusData.status !== 'COMPLETED') {
            return { status: 'processing' };
        }

        // 2. Obtener resultado completo si está COMPLETED
        const resultRes = await fetch(
            `https://queue.fal.run/${endpointId}/requests/${requestId}`,
            { headers: { 'Authorization': `Key ${FAL_KEY}` } }
        );
        const resultData = await resultRes.json();

        const outputUrl =
            resultData?.video?.url ||
            resultData?.video_url ||
            resultData?.output?.video?.url ||
            resultData?.images?.[0]?.url ||
            null;

        if (!outputUrl) {
            return { status: 'failed', error: `No output URL in result: ${JSON.stringify(resultData).slice(0, 200)}` };
        }

        return { status: 'completed', outputUrl };

    } catch (err: any) {
        return { status: 'failed', error: `Polling error: ${err.message}` };
    }
}

// ─────────────────────────────────────────────────────────────
// ACTION: GENERAR IMAGEN
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
        let referenceImages: string[] = [...(params.uploadedReferenceImages || []).filter(u => u)];
        let productName = params.productName || '';

        // Obtener imágenes del catálogo si viene de Tool 1
        if (params.productIds && params.productIds.length > 0) {
            const { data: products } = await supabase
                .from('products')
                .select('name, image_urls, internal_reference_images')
                .in('id', params.productIds);

            if (products && products.length > 0) {
                if (!productName) productName = products[0].name;
                for (const prod of products) {
                    const internalImgs: string[] = (prod.internal_reference_images || []).filter((u: string) => u);
                    const publicImgs: string[] = (prod.image_urls || []).filter((u: string) => u);
                    // Priorizar fotos internas (más útiles para la IA)
                    const productImgs = internalImgs.length > 0 ? internalImgs : publicImgs;
                    referenceImages = [...referenceImages, ...productImgs.slice(0, 2)];
                }
            }
        }

        // Agregar fotos del modelo (moda)
        if (params.savedModelId) {
            const { data: model } = await supabase
                .from('tool_ai_saved_models')
                .select('reference_images, name, description')
                .eq('id', params.savedModelId)
                .single();
            if (model) {
                referenceImages = [...referenceImages, ...(model.reference_images || []).filter((u: string) => u)];
                if (!params.modelDescription) {
                    params = { ...params, modelDescription: model.description || model.name };
                }
            }
        }

        if (params.uploadedModelImages && params.uploadedModelImages.length > 0) {
            referenceImages = [...referenceImages, ...params.uploadedModelImages.filter((u: string) => u)];
        }

        // Máximo 2 refs para flux-pro/redux (la API soporta 1 imagen_url principal)
        referenceImages = [...new Set(referenceImages)].slice(0, 2);

        const finalPrompt = buildPhotoPrompt({ ...params, productName }, params.pipeline);

        // Guardar en historial como 'processing'
        const { data: generationRecord, error: insertError } = await supabase
            .from('tool_ai_generations')
            .insert({
                generation_type: 'photo',
                pipeline: params.pipeline,
                product_ids: params.productIds || [],
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
                ai_model: referenceImages.length > 0 ? 'flux-pro/v1/redux' : 'flux/dev',
                status: 'processing',
            })
            .select('id')
            .single();

        if (insertError) {
            // Si la tabla no existe, generamos igual (modo sin historial)
            const aiResult = await callFalImageGeneration({ prompt: finalPrompt, referenceImageUrls: referenceImages });
            if (aiResult.success && aiResult.outputUrl) {
                return { success: true, outputUrl: aiResult.outputUrl };
            }
            return { success: false, error: aiResult.error || insertError.message };
        }

        const generationId = generationRecord.id;

        // Llamar a fal.ai
        const aiResult = await callFalImageGeneration({
            prompt: finalPrompt,
            referenceImageUrls: referenceImages,
        });

        if (aiResult.success && aiResult.outputUrl) {
            await supabase
                .from('tool_ai_generations')
                .update({ status: 'completed', output_url: aiResult.outputUrl })
                .eq('id', generationId);

            revalidatePath('/dashboard/tools/tool-4-ai-studio/historial');
            return { success: true, generationId, outputUrl: aiResult.outputUrl };
        } else {
            await supabase
                .from('tool_ai_generations')
                .update({ status: 'failed', error_message: aiResult.error })
                .eq('id', generationId);
            return { success: false, generationId, error: aiResult.error };
        }

    } catch (err: any) {
        return { success: false, error: `Error interno: ${err.message}` };
    }
}

// ─────────────────────────────────────────────────────────────
// ACTION: GENERAR VIDEO
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
        let referenceImages: string[] = [...(params.uploadedReferenceImages || []).filter(u => u)];
        let productName = params.productName || '';

        if (params.productIds && params.productIds.length > 0) {
            const { data: products } = await supabase
                .from('products')
                .select('name, image_urls, internal_reference_images')
                .in('id', params.productIds);

            if (products && products.length > 0) {
                if (!productName) productName = products[0].name;
                for (const prod of products) {
                    const internalImgs: string[] = (prod.internal_reference_images || []).filter((u: string) => u);
                    const publicImgs: string[] = (prod.image_urls || []).filter((u: string) => u);
                    referenceImages = [...referenceImages, ...(internalImgs.length > 0 ? internalImgs : publicImgs).slice(0, 1)];
                }
            }
        }

        if (params.savedModelId) {
            const { data: model } = await supabase
                .from('tool_ai_saved_models')
                .select('reference_images')
                .eq('id', params.savedModelId)
                .single();
            if (model) referenceImages = [...referenceImages, ...(model.reference_images || []).filter((u: string) => u)];
        }

        referenceImages = [...new Set(referenceImages)].slice(0, 1); // video acepta 1 referencia

        const finalPrompt = buildVideoPrompt({ ...params, productName }, params.pipeline);

        const { data: generationRecord, error: insertError } = await supabase
            .from('tool_ai_generations')
            .insert({
                generation_type: 'video',
                pipeline: params.pipeline,
                product_ids: params.productIds || [],
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
                ai_model: referenceImages.length > 0 ? 'kling-video/v2.1' : 'minimax/video-01',
                status: 'processing',
            })
            .select('id')
            .single();

        if (insertError) {
            // Sin tabla disponible, llamamos igual
            const aiResult = await callFalVideoGeneration({
                prompt: finalPrompt,
                referenceImageUrls: referenceImages,
                durationSeconds: params.durationSeconds,
                aspectRatio: params.aspectRatio,
            });
            if (aiResult.success && aiResult.requestId) {
                return { success: true, pending: true, requestId: aiResult.requestId, endpoint: aiResult.endpoint };
            }
            return { success: false, error: aiResult.error || insertError.message };
        }

        const generationId = generationRecord.id;

        const aiResult = await callFalVideoGeneration({
            prompt: finalPrompt,
            referenceImageUrls: referenceImages,
            durationSeconds: params.durationSeconds,
            aspectRatio: params.aspectRatio,
        });

        if (aiResult.success && aiResult.requestId) {
            await supabase
                .from('tool_ai_generations')
                .update({
                    status: 'processing',
                    ai_request_id: aiResult.requestId,
                    // Guardamos el endpoint para poder hacer polling después
                    ai_model: aiResult.endpoint || (referenceImages.length > 0 ? 'fal-ai/kling-video/v2.1/standard/image-to-video' : 'fal-ai/minimax/video-01'),
                })
                .eq('id', generationId);

            return {
                success: true,
                generationId,
                pending: true,
                requestId: aiResult.requestId,
                endpoint: aiResult.endpoint,
            };
        } else {
            await supabase
                .from('tool_ai_generations')
                .update({ status: 'failed', error_message: aiResult.error })
                .eq('id', generationId);
            return { success: false, generationId, error: aiResult.error };
        }

    } catch (err: any) {
        return { success: false, error: `Error interno: ${err.message}` };
    }
}

// ─────────────────────────────────────────────────────────────
// ACTION: POLLING DE ESTADO (llamado desde el cliente cada 5s)
// ─────────────────────────────────────────────────────────────
export async function checkGenerationStatusAction(generationId: string) {
    try {
        const { data, error } = await supabase
            .from('tool_ai_generations')
            .select('status, output_url, error_message, ai_request_id, ai_model, generation_type')
            .eq('id', generationId)
            .single();

        if (error) return { success: false, error: error.message };

        if (data.status === 'processing' && data.ai_request_id && data.ai_model) {
            // El ai_model en video contiene el endpoint completo
            const endpointId = data.ai_model.includes('fal-ai/')
                ? data.ai_model
                : data.generation_type === 'video'
                    ? 'fal-ai/kling-video/v2.1/standard/image-to-video'
                    : 'fal-ai/flux-pro/v1/redux';

            const polled = await pollFalQueue(data.ai_request_id, endpointId);

            if (polled.status === 'completed' && polled.outputUrl) {
                await supabase
                    .from('tool_ai_generations')
                    .update({ status: 'completed', output_url: polled.outputUrl })
                    .eq('id', generationId);
                revalidatePath('/dashboard/tools/tool-4-ai-studio/historial');
                return { success: true, status: 'completed', outputUrl: polled.outputUrl };
            } else if (polled.status === 'failed') {
                await supabase
                    .from('tool_ai_generations')
                    .update({ status: 'failed', error_message: polled.error })
                    .eq('id', generationId);
                return { success: true, status: 'failed', error: polled.error };
            }
            // still processing
        }

        return {
            success: true,
            status: data.status,
            outputUrl: data.output_url,
            error: data.error_message,
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ─────────────────────────────────────────────────────────────
// ACTION: POLLING DIRECTO SIN ID EN DB (fallback cuando no hay tabla)
// ─────────────────────────────────────────────────────────────
export async function pollVideoDirectAction(requestId: string, endpointId: string) {
    const polled = await pollFalQueue(requestId, endpointId);
    return polled;
}

// ─────────────────────────────────────────────────────────────
// HISTORIAL
// ─────────────────────────────────────────────────────────────
export async function getGenerationsHistoryAction(filters?: {
    type?: 'photo' | 'video';
    pipeline?: string;
    limit?: number;
}) {
    try {
        let query = supabase
            .from('tool_ai_generations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(filters?.limit || 60);

        if (filters?.type) query = query.eq('generation_type', filters.type);
        if (filters?.pipeline) query = query.eq('pipeline', filters.pipeline);

        const { data, error } = await query;
        if (error) return { success: false, error: error.message, data: [] };
        return { success: true, data: data || [] };
    } catch (err: any) {
        return { success: false, error: err.message, data: [] };
    }
}

export async function deleteGenerationAction(id: string) {
    const { error } = await supabase.from('tool_ai_generations').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/dashboard/tools/tool-4-ai-studio/historial');
    return { success: true };
}

// ─────────────────────────────────────────────────────────────
// MODELOS GUARDADOS
// ─────────────────────────────────────────────────────────────
export async function getSavedModelsAction() {
    try {
        const { data, error } = await supabase
            .from('tool_ai_saved_models')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        if (error) return { success: false, error: error.message, data: [] };
        return { success: true, data: data || [] };
    } catch (err: any) {
        return { success: false, error: err.message, data: [] };
    }
}

export async function saveSavedModelAction(model: {
    id?: string;
    name: string;
    description?: string;
    referenceImages: string[];
    tags: string[];
}) {
    try {
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
            const { count } = await supabase
                .from('tool_ai_saved_models')
                .select('id', { count: 'exact', head: true })
                .eq('is_active', true);
            if ((count || 0) >= 5) return { success: false, error: 'Límite de 5 modelos alcanzado.' };

            const { error } = await supabase.from('tool_ai_saved_models').insert({
                name: model.name,
                description: model.description || null,
                reference_images: model.referenceImages,
                tags: model.tags,
            });
            if (error) return { success: false, error: error.message };
        }
        revalidatePath('/dashboard/tools/tool-4-ai-studio/configuracion');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function deleteSavedModelAction(id: string) {
    const { error } = await supabase
        .from('tool_ai_saved_models')
        .update({ is_active: false })
        .eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/dashboard/tools/tool-4-ai-studio/configuracion');
    return { success: true };
}

// ─────────────────────────────────────────────────────────────
// PRODUCTOS DE TOOL 1
// ─────────────────────────────────────────────────────────────
export async function getProductsForAiAction() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, sku, category, image_urls, internal_reference_images, price_installments')
            .order('created_at', { ascending: false })
            .limit(200);
        if (error) return { success: false, error: error.message, data: [] };
        return { success: true, data: data || [] };
    } catch (err: any) {
        return { success: false, error: err.message, data: [] };
    }
}

export async function updateInternalImagesAction(productId: string, images: string[]) {
    const { error } = await supabase
        .from('products')
        .update({ internal_reference_images: images.slice(0, 4) })
        .eq('id', productId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/dashboard/tools/tool-1-QR');
    return { success: true };
}