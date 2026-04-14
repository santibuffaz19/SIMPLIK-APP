'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────────────────────
// TIPOS
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
// LEE LA API KEY — soporta FAL_KEY y FAL_API_KEY
// ─────────────────────────────────────────────────────────────
function getFalKey(): string | null {
    return process.env.FAL_KEY || process.env.FAL_API_KEY || null;
}

// ─────────────────────────────────────────────────────────────
// BUILDER DE PROMPTS — FOTO
// Estrategia: el producto va PRIMERO para que la IA lo priorice.
// Luego la escena, pose, estilo y extras.
// ─────────────────────────────────────────────────────────────
function buildPhotoPrompt(params: any, pipeline: Pipeline): string {
    const segments: string[] = [];

    // ── CLAVE DE FIDELIDAD ──────────────────────────────────────────────────
    // Con image_prompt_strength=0.85, la IA toma el PRODUCTO de la imagen de
    // referencia casi textualmente. El prompt solo debe describir el FONDO,
    // la ESCENA y la LUZ — NO el producto. Si describimos el producto en el
    // prompt, compite con la imagen y la IA lo reinventa.
    // ────────────────────────────────────────────────────────────────────────

    // 1. Instrucción de preservación del producto (refuerza que no lo toque)
    if (pipeline === 'product_photo') {
        segments.push(`Commercial product photography. Keep the exact product from the reference image unchanged — same shape, color, material, labels and details. Only change the background and lighting`);
    } else if (pipeline === 'fashion_photo') {
        segments.push(`Fashion editorial photography. Keep the exact garment from the reference image — same color, fabric, cut, print and design. Only change the background, model pose and lighting`);
        if (params.modelDescription) segments.push(`model: ${params.modelDescription}`);
    } else if (pipeline === 'food_photo') {
        segments.push(`Professional food photography. Keep the exact dish from the reference image — same colors, textures and presentation. Only change the background surface and lighting`);
    }

    // 2. Fondo / escena — esto es lo que SÍ cambia
    const bgPresetMap: Record<string, string> = {
        beach: `Background: sunny tropical beach, golden sand, turquoise sea, golden hour sunlight`,
        space: `Background: dramatic outer space, deep black, stars and nebula colors, cosmic`,
        white_studio: `Background: pure seamless white studio backdrop, soft even studio lighting, subtle drop shadow`,
        black_studio: `Background: matte black seamless studio backdrop, dramatic side lighting, dark premium atmosphere`,
        wooden_table: `Background: warm rustic wooden table surface, natural window light from left side`,
        modern_kitchen: `Background: modern minimalist kitchen, white marble countertop, soft natural daylight`,
        elegant_office: `Background: elegant office interior, blurred bookshelves, warm professional desk lamp light`,
        ecommerce_premium: `Background: clean pure white e-commerce background, perfectly even soft box lighting, subtle soft shadow beneath product`,
        lifestyle: `Background: bright airy lifestyle home setting, warm natural daylight, blurred interior`,
        minimalist: `Background: clean light gray seamless gradient, minimal, generous empty space`,
        advertising: `Background: dramatic advertising composition, dynamic staged environment, bold commercial lighting`,
        storefront: `Background: luxury retail window display, premium glass and chrome, aspirational retail context`,
        urban_street: `Background: urban city street, concrete sidewalk, city buildings out of focus, natural daylight`,
        editorial_studio: `Background: editorial fashion studio, strong directional key light, dramatic shadows on backdrop`,
        rooftop: `Background: rooftop terrace with city skyline, warm golden hour sunset light, urban panorama`,
        modern_cafe: `Background: stylish café interior, warm amber ambient light, blurred wooden tables and chairs`,
        pasarela: `Background: fashion runway, bright catwalk spotlights, audience blurred in background`,
        gastronomic: `Background: fine dining restaurant table, soft candlelight, dark moody atmosphere, premium cutlery`,
    };

    if (params.backgroundType === 'preset' && params.backgroundPreset) {
        segments.push(bgPresetMap[params.backgroundPreset] || `Background: ${params.backgroundPreset}`);
    } else if (params.backgroundType === 'color' && params.backgroundColor) {
        segments.push(`Background: solid ${params.backgroundColor} color, uniform and clean`);
    } else if (params.backgroundType === 'prompt' && params.backgroundPrompt) {
        segments.push(`Background and scene: ${params.backgroundPrompt}`);
    }

    // 3. Pose / composición
    const poseMap: Record<string, string> = {
        centered_front: `Product centered in frame, front-facing, symmetrical composition`,
        three_quarters: `Product at three-quarter angle, slight depth perspective`,
        tilted: `Product slightly tilted, dynamic editorial angle`,
        on_table: `Product resting naturally on a flat surface, tabletop shot`,
        floating: `Product floating in mid-air, levitation effect, dynamic`,
        in_use: `Product being used in its natural context`,
        close_up: `Extreme close-up, product fills 80% of frame, shallow depth of field`,
        advertising: `Wide hero shot, product as focal point, expansive background visible`,
        macro: `Ultra-macro detail shot, surface texture emphasis`,
        still_life: `Still life arrangement, product surrounded by complementary props`,
        standing_front: `Model standing facing camera, full body shot`,
        walking: `Model mid-stride, natural movement, candid energy`,
        sitting: `Model seated, relaxed casual pose`,
        turned_three_quarters: `Model at 3/4 angle profile`,
        back_pose: `Model showing back, back-of-garment detail shot`,
        editorial_pose: `Strong fashion editorial pose, magazine quality`,
        urban_pose: `Casual street style pose, relaxed`,
        sports_pose: `Dynamic athletic movement pose`,
    };

    if (params.pose) {
        segments.push(poseMap[params.pose] || `Composition: ${params.pose}`);
    }

    // 4. Interacción contextual
    if (params.interactionPrompt?.trim()) {
        segments.push(`Scene detail: ${params.interactionPrompt}`);
    }

    // 5. Estilo visual
    const styleMap: Record<string, string> = {
        ecommerce: `Clean e-commerce style, isolated subject, commercially optimized lighting`,
        editorial: `High fashion editorial, artistic lighting direction, magazine quality`,
        lifestyle: `Authentic lifestyle photography, warm natural light, genuine context`,
        streetwear: `Urban streetwear aesthetic, raw edgy energy, city context`,
        premium: `Ultra-premium luxury brand aesthetic, refined sophisticated lighting`,
        sports: `High-performance sports photography, dynamic energy, bold colors`,
        casual: `Casual everyday photography, warm natural tones, approachable`,
        luxury: `Ultra-luxury opulent photography, gold tones, exclusive feel`,
        brand_campaign: `Brand campaign imagery, aspirational storytelling`,
        advertising_product: `Polished commercial advertising photography, bold hero shot`,
        cinematic: `Cinematic film aesthetics, dramatic moody lighting, rich color grade`,
        minimalist: `Ultra-minimalist, extreme negative space, single focal point`,
        hyperrealistic: `Hyperrealistic photography, perfect detail, indistinguishable from real`,
        food_premium: `Michelin-star food photography, steam visible, ingredients glistening`,
        food_delivery: `Bright fresh appetizing food photo, vibrant colors, steam rising`,
    };

    if (params.style) {
        segments.push(styleMap[params.style] || `Style: ${params.style}`);
    }

    // 6. Extras visuales del usuario
    if (params.extraPrompt?.trim()) {
        segments.push(params.extraPrompt);
    }

    // 7. Calidad técnica — siempre al final
    segments.push(`Professional DSLR photography, sharp focus, perfect exposure, commercial quality`);

    return segments.join('. ');
}

// ─────────────────────────────────────────────────────────────
// BUILDER DE PROMPTS — VIDEO
// ─────────────────────────────────────────────────────────────
function buildVideoPrompt(params: any, pipeline: Pipeline): string {
    const segments: string[] = [];

    // Misma estrategia que foto: el prompt describe la ESCENA, no el producto.
    // El producto viene de la imagen de referencia (kling image-to-video).

    if (pipeline === 'product_video') {
        segments.push(`Commercial product video. The product from the reference image is the hero — keep its exact appearance, color, shape and branding unchanged throughout all frames`);
    } else if (pipeline === 'fashion_video') {
        segments.push(`Fashion lookbook video. The garment from the reference image must appear exactly — same color, fabric, cut and design. Show fabric movement and drape`);
        if (params.modelDescription) segments.push(`worn by: ${params.modelDescription}`);
    } else if (pipeline === 'food_video') {
        segments.push(`Food advertising video. The dish from the reference image is the subject — keep its exact appearance, colors and textures`);
    }

    const bgMap: Record<string, string> = {
        beach: 'tropical beach setting, golden sand, turquoise sea',
        white_studio: 'clean white studio backdrop, soft even lighting',
        black_studio: 'dark black studio, dramatic side lighting',
        wooden_table: 'warm rustic wooden surface, natural window light',
        ecommerce_premium: 'clean pure white background, studio lighting',
        lifestyle: 'bright airy lifestyle home setting, natural light',
        minimalist: 'clean minimal light gray background',
        advertising: 'dramatic advertising staging, bold commercial lighting',
        modern_cafe: 'stylish café interior, warm ambient lighting',
        urban_street: 'urban city street, concrete textures',
    };

    if (params.backgroundPreset) {
        segments.push(`Background: ${bgMap[params.backgroundPreset] || params.backgroundPreset}`);
    }
    if (params.backgroundPrompt?.trim()) {
        segments.push(`Scene: ${params.backgroundPrompt}`);
    }
    if (params.interactionPrompt?.trim()) {
        segments.push(params.interactionPrompt);
    }

    const motionMap: Record<string, string> = {
        zoom_in: 'slow elegant cinematic zoom in toward the product',
        zoom_out: 'smooth pull-back zoom out reveal',
        pan_left: 'fluid lateral pan left',
        pan_right: 'fluid lateral pan right',
        orbit_360: 'smooth 360 degree orbit around the subject',
        cinematic_approach: 'cinematic dolly push-in toward subject',
        macro_detail: 'slow floating macro exploration of product surface',
        static_ambient: 'static frame with subtle ambient particle movement',
    };
    if (params.cameraMotion) {
        segments.push(`Camera: ${motionMap[params.cameraMotion] || params.cameraMotion}`);
    }

    if (params.style) segments.push(`${params.style} visual style`);
    if (params.extraPrompt?.trim()) segments.push(params.extraPrompt);

    segments.push(`Smooth motion, professional color grading, cinematic quality, no text or watermarks`);

    return segments.join('. ');
}

// ─────────────────────────────────────────────────────────────
// FAL.AI — IMAGEN (síncrona)
//
// ESTRATEGIA DE MÁXIMA FIDELIDAD AL PRODUCTO:
//
// CON referencia → fal-ai/flux-pro/v1.1 con image_prompt_strength ALTO
//   image_prompt_strength controla cuánto peso tiene la imagen vs el prompt:
//     0.0 = ignora imagen completamente (solo sigue el texto)
//     1.0 = copia imagen sin cambios (ignora el texto)
//     0.85 = 85% imagen + 15% texto → el producto se preserva casi exacto,
//            y el prompt apenas modifica el FONDO/ESCENA sin tocar el producto
//
//   El prompt en este modo NO debe describir el producto (ya está en la imagen).
//   Solo describe el fondo, la luz y el ambiente. Así la IA combina:
//   → producto real de la foto + fondo/escena del prompt
//
// SIN referencia → fal-ai/flux/dev (text-to-image puro, económico)
// ─────────────────────────────────────────────────────────────
async function callFalImageGeneration(params: {
    prompt: string;
    referenceImageUrls: string[];
    aspectRatio?: string;
}): Promise<{ success: boolean; outputUrl?: string; error?: string }> {
    const FAL_KEY = getFalKey();
    if (!FAL_KEY) {
        return { success: false, error: 'FAL_KEY no encontrada. Configurala en Vercel → Settings → Environment Variables como FAL_KEY.' };
    }

    const cleanRefs = params.referenceImageUrls.filter(u => u?.startsWith('http'));
    const hasRef = cleanRefs.length > 0;

    let image_size = 'square_hd';
    if (params.aspectRatio === '16:9') image_size = 'landscape_16_9';
    else if (params.aspectRatio === '9:16') image_size = 'portrait_16_9';

    let endpoint: string;
    let body: Record<string, any>;

    if (hasRef) {
        // Alta fidelidad al producto: 0.85 = la IA copia el producto casi exacto
        // y solo aplica el fondo/escena del prompt sin reinventar el producto
        endpoint = 'https://fal.run/fal-ai/flux-pro/v1.1';
        body = {
            prompt: params.prompt,
            image_url: cleanRefs[0],
            image_prompt_strength: 0.85,
            image_size,
            num_inference_steps: 28,
            guidance_scale: 3.5,
            num_images: 1,
            output_format: 'jpeg',
            safety_tolerance: '5',
        };
    } else {
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

    try {
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
            return { success: false, error: `fal.ai error ${response.status}: ${rawText.slice(0, 400)}` };
        }

        let data: any;
        try { data = JSON.parse(rawText); } catch {
            return { success: false, error: `Respuesta inválida de fal.ai: "${rawText.slice(0, 300)}"` };
        }

        const outputUrl = data?.images?.[0]?.url || data?.image?.url || null;
        if (!outputUrl) {
            return { success: false, error: `fal.ai no retornó imagen. Respuesta: ${JSON.stringify(data).slice(0, 400)}` };
        }

        return { success: true, outputUrl };

    } catch (err: any) {
        return { success: false, error: `Error de red con fal.ai: ${err.message}` };
    }
}

// ─────────────────────────────────────────────────────────────
// FAL.AI — VIDEO (asíncrona via queue)
//
// CON imagen ref → fal-ai/kling-video/v2.1/standard/image-to-video
// SIN imagen ref → fal-ai/minimax/video-01-live
//
// Los videos SIEMPRE van por queue.fal.run (asíncrono).
// Retornamos request_id para polling periódico.
// ─────────────────────────────────────────────────────────────
async function callFalVideoQueue(params: {
    prompt: string;
    referenceImageUrls: string[];
    durationSeconds: number;
    aspectRatio: string;
}): Promise<{ success: boolean; requestId?: string; endpointId?: string; error?: string }> {
    const FAL_KEY = getFalKey();
    if (!FAL_KEY) {
        return { success: false, error: 'FAL_KEY no configurada.' };
    }

    const cleanRefs = params.referenceImageUrls.filter(u => u?.startsWith('http'));
    const hasRef = cleanRefs.length > 0;
    const duration = params.durationSeconds <= 5 ? '5' : '10';
    const aspect_ratio = params.aspectRatio === '9:16' ? '9:16' : params.aspectRatio === '1:1' ? '1:1' : '16:9';

    let endpointId: string;
    let body: Record<string, any>;

    if (hasRef) {
        endpointId = 'fal-ai/kling-video/v2.1/standard/image-to-video';
        body = { prompt: params.prompt, image_url: cleanRefs[0], duration, aspect_ratio };
    } else {
        endpointId = 'fal-ai/minimax/video-01-live';
        body = { prompt: params.prompt, prompt_optimizer: true };
    }

    try {
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
            return { success: false, error: `Queue submit error ${submitRes.status}: ${rawText.slice(0, 400)}` };
        }

        let data: any;
        try { data = JSON.parse(rawText); } catch {
            return { success: false, error: `Queue retornó respuesta inválida: "${rawText.slice(0, 300)}"` };
        }

        const requestId = data?.request_id;
        if (!requestId) {
            return { success: false, error: `Queue no retornó request_id. Respuesta: ${JSON.stringify(data).slice(0, 300)}` };
        }

        return { success: true, requestId, endpointId };

    } catch (err: any) {
        return { success: false, error: `Error de red al enviar al queue: ${err.message}` };
    }
}

// ─────────────────────────────────────────────────────────────
// POLLING DEL QUEUE DE FAL.AI
//
// BUG CORREGIDO: La URL para obtener el resultado completo es:
//   https://queue.fal.run/{endpointId}/requests/{requestId}/response
//   CON /response al final.
//   Sin /response → body vacío → "Unexpected end of JSON input"
// ─────────────────────────────────────────────────────────────
async function pollFalQueue(requestId: string, endpointId: string): Promise<{
    status: 'processing' | 'completed' | 'failed';
    outputUrl?: string;
    error?: string;
}> {
    const FAL_KEY = getFalKey();
    if (!FAL_KEY) return { status: 'failed', error: 'FAL_KEY no configurada' };

    try {
        // 1. Verificar estado
        const statusRes = await fetch(
            `https://queue.fal.run/${endpointId}/requests/${requestId}/status`,
            { headers: { 'Authorization': `Key ${FAL_KEY}` } }
        );

        if (!statusRes.ok) {
            const errText = await statusRes.text();
            return { status: 'failed', error: `Status check ${statusRes.status}: ${errText.slice(0, 200)}` };
        }

        const statusData = await statusRes.json();

        if (statusData.status === 'FAILED') {
            return { status: 'failed', error: statusData.error || statusData.detail || 'Falló en el queue de fal.ai' };
        }

        if (statusData.status === 'IN_QUEUE' || statusData.status === 'IN_PROGRESS') {
            return { status: 'processing' };
        }

        if (statusData.status !== 'COMPLETED') {
            return { status: 'processing' };
        }

        // 2. Obtener resultado completo — /response al final (CRÍTICO)
        const resultRes = await fetch(
            `https://queue.fal.run/${endpointId}/requests/${requestId}/response`,
            { headers: { 'Authorization': `Key ${FAL_KEY}` } }
        );

        if (!resultRes.ok) {
            const errText = await resultRes.text();
            return { status: 'failed', error: `Result fetch ${resultRes.status}: ${errText.slice(0, 200)}` };
        }

        const rawResult = await resultRes.text();
        if (!rawResult?.trim()) {
            return { status: 'failed', error: 'El resultado llegó vacío de fal.ai' };
        }

        let resultData: any;
        try { resultData = JSON.parse(rawResult); } catch {
            return { status: 'failed', error: `Resultado no-JSON: "${rawResult.slice(0, 200)}"` };
        }

        // Diferentes modelos usan diferentes campos para el video
        const outputUrl =
            resultData?.video?.url ||
            resultData?.video_url ||
            resultData?.output?.video?.url ||
            resultData?.outputs?.video?.url ||
            resultData?.result?.video?.url ||
            null;

        if (!outputUrl) {
            return { status: 'failed', error: `No se encontró URL del video en la respuesta: ${JSON.stringify(resultData).slice(0, 300)}` };
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
        let referenceImages: string[] = [...(params.uploadedReferenceImages || []).filter(Boolean)];
        let productName = params.productName || '';

        if (params.productIds && params.productIds.length > 0) {
            const { data: products } = await supabase
                .from('products')
                .select('name, image_urls, internal_reference_images')
                .in('id', params.productIds);

            if (products && products.length > 0) {
                if (!productName) productName = products[0].name;
                for (const prod of products) {
                    const internal: string[] = (prod.internal_reference_images || []).filter(Boolean);
                    const pub: string[] = (prod.image_urls || []).filter(Boolean);
                    referenceImages.push(...(internal.length > 0 ? internal : pub).slice(0, 2));
                }
            }
        }

        if (params.savedModelId) {
            const { data: model } = await supabase
                .from('tool_ai_saved_models')
                .select('reference_images, name, description')
                .eq('id', params.savedModelId)
                .single();
            if (model) {
                referenceImages.push(...(model.reference_images || []).filter(Boolean));
                if (!params.modelDescription) {
                    params = { ...params, modelDescription: model.description || model.name };
                }
            }
        }
        if (params.uploadedModelImages?.length) {
            referenceImages.push(...params.uploadedModelImages.filter(Boolean));
        }

        // flux-pro/v1.1 acepta 1 image_url, usamos la mejor referencia del producto
        referenceImages = [...new Set(referenceImages)].slice(0, 1);

        const finalPrompt = buildPhotoPrompt({ ...params, productName }, params.pipeline);

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
                ai_model: referenceImages.length > 0 ? 'flux-pro/v1.1' : 'flux/dev',
                status: 'processing',
            })
            .select('id')
            .single();

        // Fallback sin historial si la tabla no existe
        if (insertError) {
            const aiResult = await callFalImageGeneration({ prompt: finalPrompt, referenceImageUrls: referenceImages });
            if (aiResult.success && aiResult.outputUrl) return { success: true, outputUrl: aiResult.outputUrl };
            return { success: false, error: aiResult.error };
        }

        const generationId = generationRecord.id;
        const aiResult = await callFalImageGeneration({ prompt: finalPrompt, referenceImageUrls: referenceImages });

        if (aiResult.success && aiResult.outputUrl) {
            await supabase.from('tool_ai_generations').update({ status: 'completed', output_url: aiResult.outputUrl }).eq('id', generationId);
            revalidatePath('/dashboard/tools/tool-4-ai-studio/historial');
            return { success: true, generationId, outputUrl: aiResult.outputUrl };
        } else {
            await supabase.from('tool_ai_generations').update({ status: 'failed', error_message: aiResult.error }).eq('id', generationId);
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
        let referenceImages: string[] = [...(params.uploadedReferenceImages || []).filter(Boolean)];
        let productName = params.productName || '';

        if (params.productIds && params.productIds.length > 0) {
            const { data: products } = await supabase
                .from('products')
                .select('name, image_urls, internal_reference_images')
                .in('id', params.productIds);

            if (products && products.length > 0) {
                if (!productName) productName = products[0].name;
                for (const prod of products) {
                    const internal: string[] = (prod.internal_reference_images || []).filter(Boolean);
                    const pub: string[] = (prod.image_urls || []).filter(Boolean);
                    referenceImages.push(...(internal.length > 0 ? internal : pub).slice(0, 1));
                }
            }
        }

        if (params.savedModelId) {
            const { data: model } = await supabase
                .from('tool_ai_saved_models')
                .select('reference_images')
                .eq('id', params.savedModelId)
                .single();
            if (model) referenceImages.push(...(model.reference_images || []).filter(Boolean));
        }

        referenceImages = [...new Set(referenceImages)].slice(0, 1);

        const finalPrompt = buildVideoPrompt({ ...params, productName }, params.pipeline);
        const endpointModel = referenceImages.length > 0
            ? 'fal-ai/kling-video/v2.1/standard/image-to-video'
            : 'fal-ai/minimax/video-01-live';

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
                ai_model: endpointModel,
                status: 'processing',
            })
            .select('id')
            .single();

        const queueResult = await callFalVideoQueue({
            prompt: finalPrompt,
            referenceImageUrls: referenceImages,
            durationSeconds: params.durationSeconds,
            aspectRatio: params.aspectRatio,
        });

        if (!queueResult.success) {
            if (!insertError && generationRecord) {
                await supabase.from('tool_ai_generations').update({ status: 'failed', error_message: queueResult.error }).eq('id', generationRecord.id);
            }
            return { success: false, error: queueResult.error };
        }

        const generationId = insertError ? null : generationRecord?.id;

        if (!insertError && generationId) {
            await supabase.from('tool_ai_generations').update({
                status: 'processing',
                ai_request_id: queueResult.requestId,
                ai_model: queueResult.endpointId || endpointModel,
            }).eq('id', generationId);
        }

        return {
            success: true,
            generationId,
            pending: true,
            requestId: queueResult.requestId,
            endpoint: queueResult.endpointId,
        };

    } catch (err: any) {
        return { success: false, error: `Error interno: ${err.message}` };
    }
}

// ─────────────────────────────────────────────────────────────
// ACTION: POLLING vía DB
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
            const endpointId = data.ai_model.startsWith('fal-ai/')
                ? data.ai_model
                : data.generation_type === 'video'
                    ? 'fal-ai/kling-video/v2.1/standard/image-to-video'
                    : 'fal-ai/flux-pro/v1.1';

            const polled = await pollFalQueue(data.ai_request_id, endpointId);

            if (polled.status === 'completed' && polled.outputUrl) {
                await supabase.from('tool_ai_generations').update({ status: 'completed', output_url: polled.outputUrl }).eq('id', generationId);
                revalidatePath('/dashboard/tools/tool-4-ai-studio/historial');
                return { success: true, status: 'completed', outputUrl: polled.outputUrl };
            } else if (polled.status === 'failed') {
                await supabase.from('tool_ai_generations').update({ status: 'failed', error_message: polled.error }).eq('id', generationId);
                return { success: true, status: 'failed', error: polled.error };
            }
        }

        return { success: true, status: data.status, outputUrl: data.output_url, error: data.error_message };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ─────────────────────────────────────────────────────────────
// ACTION: POLLING DIRECTO (sin DB — fallback)
// ─────────────────────────────────────────────────────────────
export async function pollVideoDirectAction(requestId: string, endpointId: string) {
    return await pollFalQueue(requestId, endpointId);
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
            const { error } = await supabase.from('tool_ai_saved_models').update({
                name: model.name, description: model.description || null,
                reference_images: model.referenceImages, tags: model.tags,
            }).eq('id', model.id);
            if (error) return { success: false, error: error.message };
        } else {
            const { count } = await supabase.from('tool_ai_saved_models')
                .select('id', { count: 'exact', head: true }).eq('is_active', true);
            if ((count || 0) >= 5) return { success: false, error: 'Límite de 5 modelos alcanzado.' };
            const { error } = await supabase.from('tool_ai_saved_models').insert({
                name: model.name, description: model.description || null,
                reference_images: model.referenceImages, tags: model.tags,
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
    const { error } = await supabase.from('tool_ai_saved_models').update({ is_active: false }).eq('id', id);
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