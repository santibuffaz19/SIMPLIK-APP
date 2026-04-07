'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, MessageSquareText, Info, X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const convertirUrlDrive = (url: string) => {
    if (!url || !url.includes('drive.google.com')) return url;
    let fileId = '';
    const match = url.match(/\/file\/d\/(.+?)\//) || url.match(/\?id=(.+?)(&|$)/);
    if (match) fileId = match[1];
    return fileId ? `https://drive.google.com/uc?id=${fileId}` : url;
};

const extraerIdYoutube = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return (match && match[1]) ? match[1] : null;
};

const InstagramIcon = ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
);

function RevistaPublicaContent() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const collectionId = searchParams.get('fromCollection');

    const [catalogo, setCatalogo] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMediaItem, setSelectedMediaItem] = useState<any>(null);

    useEffect(() => {
        async function fetchCatalogo() {
            const { data, error } = await supabase.from('tool_catalogs').select('*').eq('id', id).single();
            if (!error && data) setCatalogo(data);
            const { data: config } = await supabase.from('company_settings').select('whatsapp_number, instagram_url').eq('id', 1).single();
            if (config) setSettings(config);
            setLoading(false);
        }
        fetchCatalogo();
    }, [id]);

    useEffect(() => {
        if (!catalogo || loading) return;

        const prevBtn = document.getElementById("prev-btn") as HTMLButtonElement;
        const nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
        const bookWrapper = document.getElementById("book-wrapper");
        const bookElement = document.getElementById("book");

        const papers = Array.from(document.querySelectorAll('.paper')) as HTMLElement[];
        if (papers.length === 0 || !bookWrapper || !bookElement || !prevBtn || !nextBtn) return;

        let currentPage = 0;
        let totalPages = papers.length;
        let isDragging = false;
        let startPos = 0;
        let currentPaper: HTMLElement | null = null;
        let isFlippingNext = true;

        function isMobile() { return window.innerWidth <= 768; }

        function getBaseShift(pageIndex: number) {
            if (pageIndex === 0) return -25;
            if (pageIndex === totalPages) return 25;
            return 0;
        }

        function updateBookPosition(progress?: number, isNext?: boolean) {
            let shift;
            if (progress === undefined) { shift = getBaseShift(currentPage); }
            else {
                const currentShift = getBaseShift(currentPage);
                const targetPage = isNext ? currentPage + 1 : currentPage - 1;
                const targetShift = getBaseShift(targetPage);
                shift = currentShift + (targetShift - currentShift) * progress;
            }
            const axis = isMobile() ? 'Y' : 'X';
            bookWrapper!.style.transform = `translate${axis}(${shift}%)`;
        }

        function updateZIndexes(activePaperIndex: number | null, overrideZ: boolean) {
            for (let i = 0; i < totalPages; i++) {
                if (i < currentPage) { papers[i].style.zIndex = (i + 1).toString(); }
                else { papers[i].style.zIndex = (totalPages - i).toString(); }
            }
            if (activePaperIndex !== null && overrideZ) { papers[activePaperIndex].style.zIndex = "9999"; }
        }

        function updateButtons() {
            prevBtn!.disabled = (currentPage === 0);
            nextBtn!.disabled = (currentPage === totalPages);
        }

        function getTransformString(deg: number) {
            const axis = isMobile() ? 'X' : 'Y';
            let finalDeg = isMobile() ? Math.abs(deg) : -Math.abs(deg);
            if (deg === 0) finalDeg = 0;
            return `rotate${axis}(${finalDeg}deg)`;
        }

        function goNextPage() {
            if (currentPage < totalPages) {
                const paper = papers[currentPage];
                paper.style.transition = "transform 0.8s cubic-bezier(0.3, 0.0, 0.2, 1)";
                bookWrapper!.style.transition = "transform 0.8s cubic-bezier(0.3, 0.0, 0.2, 1)";
                updateZIndexes(currentPage, true);
                setTimeout(() => {
                    paper.style.transform = getTransformString(180);
                    currentPage++;
                    updateBookPosition();
                    setTimeout(() => { updateZIndexes(null, false); }, 400);
                    updateButtons();
                }, 10);
            }
        }

        function goPrevPage() {
            if (currentPage > 0) {
                currentPage--;
                const paper = papers[currentPage];
                paper.style.transition = "transform 0.8s cubic-bezier(0.3, 0.0, 0.2, 1)";
                bookWrapper!.style.transition = "transform 0.8s cubic-bezier(0.3, 0.0, 0.2, 1)";
                updateZIndexes(currentPage, true);
                setTimeout(() => {
                    paper.style.transform = getTransformString(0);
                    updateBookPosition();
                    setTimeout(() => { updateZIndexes(null, false); }, 400);
                    updateButtons();
                }, 10);
            }
        }

        nextBtn.onclick = goNextPage;
        prevBtn.onclick = goPrevPage;

        function startDrag(e: any) {
            if (selectedMediaItem) return;

            let isClickable = false;
            let tempTarget = e.target;
            while (tempTarget && tempTarget !== document.body && tempTarget !== bookElement) {
                if (['button', 'a', 'input', 'textarea'].includes(tempTarget.tagName?.toLowerCase()) ||
                    (tempTarget.classList && (tempTarget.classList.contains('clickable-media') || tempTarget.classList.contains('tech-specs-overlay') || tempTarget.classList.contains('back-to-collection')))) {
                    isClickable = true;
                    break;
                }
                tempTarget = tempTarget.parentNode;
            }
            if (isClickable) return;

            let target = e.target;
            let paperIndex = -1;
            while (target && target !== document.body) {
                if (target.classList && target.classList.contains('paper')) {
                    paperIndex = papers.indexOf(target as HTMLElement);
                }
                target = target.parentNode;
            }

            if (paperIndex === -1) return;

            isDragging = true;
            const clientX = e.type.indexOf('touch') !== -1 ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.indexOf('touch') !== -1 ? e.touches[0].clientY : e.clientY;
            startPos = isMobile() ? clientY : clientX;

            if (paperIndex === currentPage && currentPage < totalPages) {
                currentPaper = papers[currentPage];
                isFlippingNext = true;
            } else if (paperIndex === currentPage - 1 && currentPage > 0) {
                currentPaper = papers[currentPage - 1];
                isFlippingNext = false;
            } else { isDragging = false; return; }

            currentPaper.style.transition = "none";
            bookWrapper!.style.transition = "none";
            updateZIndexes(isFlippingNext ? currentPage : currentPage - 1, true);
        }

        function drag(e: any) {
            if (!isDragging || !currentPaper || selectedMediaItem) return;
            const clientX = e.type.indexOf('touch') !== -1 ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.indexOf('touch') !== -1 ? e.touches[0].clientY : e.clientY;

            const currentPos = isMobile() ? clientY : clientX;
            const diff = currentPos - startPos;
            const percentage = (diff / (isMobile() ? window.innerHeight : window.innerWidth)) * 100;
            let deg = 0;

            if (isMobile()) {
                if (isFlippingNext) { deg = Math.max(0, Math.min(180, (-percentage * 2.5))); }
                else { deg = Math.max(0, Math.min(180, 180 - (percentage * 2.5))); }
                currentPaper.style.transform = `rotateX(${deg}deg)`;
            } else {
                if (isFlippingNext) { deg = Math.max(-180, Math.min(0, (percentage * 2.5))); }
                else { deg = Math.max(-180, Math.min(0, -180 + (percentage * 2.5))); }
                currentPaper.style.transform = `rotateY(${deg}deg)`;
            }

            const currentDegProgress = Math.abs(deg) / 180;
            const progress = isFlippingNext ? currentDegProgress : (1 - currentDegProgress);
            updateBookPosition(progress, isFlippingNext);
        }

        function endDrag() {
            if (!isDragging || !currentPaper || selectedMediaItem) return;
            isDragging = false;
            currentPaper.style.transition = "transform 0.8s cubic-bezier(0.3, 0.0, 0.2, 1)";
            bookWrapper!.style.transition = "transform 0.8s cubic-bezier(0.3, 0.0, 0.2, 1)";

            const transformStr = currentPaper.style.transform;
            const match = transformStr.match(/rotate[XY]\(([-\d.]+)deg\)/);
            const currentDeg = match ? Math.abs(parseFloat(match[1])) : 0;

            if (isFlippingNext) {
                if (currentDeg > 45) goNextPage();
                else {
                    currentPaper.style.transform = getTransformString(0);
                    updateBookPosition();
                    setTimeout(() => { updateZIndexes(null, false); }, 400);
                }
            } else {
                if (currentDeg < 135) goPrevPage();
                else {
                    currentPaper.style.transform = getTransformString(180);
                    updateBookPosition();
                    setTimeout(() => { updateZIndexes(null, false); }, 400);
                }
            }
            currentPaper = null;
        }

        bookElement.addEventListener("mousedown", startDrag);
        bookElement.addEventListener("touchstart", startDrag, { passive: true });
        document.addEventListener("mousemove", drag);
        document.addEventListener("touchmove", drag, { passive: true });
        document.addEventListener("mouseup", endDrag);
        document.addEventListener("touchend", endDrag);

        const handleResize = () => {
            updateBookPosition();
            for (let i = 0; i < totalPages; i++) {
                papers[i].style.transition = "none";
                if (i < currentPage) { papers[i].style.transform = getTransformString(180); }
                else { papers[i].style.transform = getTransformString(0); }
            }
        };
        window.addEventListener('resize', handleResize);

        updateZIndexes(null, false);
        updateBookPosition();
        bookWrapper!.style.transition = "transform 0.8s cubic-bezier(0.3, 0.0, 0.2, 1)";

        return () => {
            bookElement.removeEventListener("mousedown", startDrag);
            bookElement.removeEventListener("touchstart", startDrag);
            document.removeEventListener("mousemove", drag);
            document.removeEventListener("touchmove", drag);
            document.removeEventListener("mouseup", endDrag);
            document.removeEventListener("touchend", endDrag);
            window.removeEventListener('resize', handleResize);
        };
    }, [catalogo, loading, selectedMediaItem]);

    if (loading) return <div className="flex h-[100dvh] w-full items-center justify-center bg-slate-200"><Loader2 className="animate-spin text-slate-800" size={40} /></div>;
    if (!catalogo) return <div className="flex h-[100dvh] w-full items-center justify-center bg-slate-200 text-xl font-black">Revista no encontrada</div>;

    const items = catalogo.items || [];
    const font = catalogo.font_family || 'Inter';
    const coverBg = catalogo.cover_color || '#0a0a0a';

    const renderPages = () => {
        const pages = [];

        // Portada
        pages.push(
            <div className="paper" key="p0">
                <div className="front" style={{ backgroundColor: coverBg, color: '#fff', fontFamily: font }}>
                    {collectionId && (
                        <Link href={`/c/${collectionId}`} className="absolute top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-sm rounded-full text-xs font-bold text-white back-to-collection hover:bg-black/50 transition-colors">
                            <ArrowLeft size={14} /> Volver a Colección
                        </Link>
                    )}
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <h1 className="text-3xl md:text-5xl font-black tracking-[0.2em] md:tracking-[0.3em] uppercase">{catalogo.cover_title}</h1>
                        {catalogo.description && <p className="mt-4 opacity-70 text-sm md:text-base max-w-[80%]">{catalogo.description}</p>}
                        <p className="mt-8 text-xs opacity-50 uppercase tracking-widest animate-pulse">Arrastrá para abrir</p>
                    </div>
                </div>
                <div className="back" style={{ fontFamily: font }}>
                    <div className="absolute top-0 right-0 h-full w-4 bg-gradient-to-l from-black/5 to-transparent z-10 pointer-events-none hidden md:block"></div>
                    <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-black/5 to-transparent z-10 pointer-events-none md:hidden"></div>
                    <div className="p-4 md:p-8 h-full flex flex-col">
                        {items[0] && <ItemContent item={items[0]} settings={settings} onOpenMedia={setSelectedMediaItem} />}
                    </div>
                </div>
            </div>
        );

        // Hojas internas (prolijas, sin scrollbar encimada)
        for (let i = 1; i < Math.ceil(items.length / 2); i++) {
            const frontItem = items[i * 2 - 1];
            const backItem = items[i * 2];
            pages.push(
                <div className="paper" key={`p${i}`}>
                    <div className="front" style={{ fontFamily: font }}>
                        <div className="absolute top-0 left-0 h-full w-4 bg-gradient-to-r from-black/5 to-transparent z-10 pointer-events-none hidden md:block"></div>
                        <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-black/5 to-transparent z-10 pointer-events-none md:hidden"></div>
                        <div className="p-4 md:p-8 h-full flex flex-col">
                            {frontItem && <ItemContent item={frontItem} settings={settings} onOpenMedia={setSelectedMediaItem} />}
                        </div>
                    </div>
                    <div className="back" style={{ fontFamily: font }}>
                        <div className="absolute top-0 right-0 h-full w-4 bg-gradient-to-l from-black/5 to-transparent z-10 pointer-events-none hidden md:block"></div>
                        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-black/5 to-transparent z-10 pointer-events-none md:hidden"></div>
                        <div className="p-4 md:p-8 h-full flex flex-col">
                            {backItem ? <ItemContent item={backItem} settings={settings} onOpenMedia={setSelectedMediaItem} /> : <EndCover />}
                        </div>
                    </div>
                </div>
            );
        }

        // Contraportada si es necesario
        if (items.length % 2 !== 0) {
            pages.push(
                <div className="paper" key={`p_end`}>
                    <div className="front bg-white" style={{ fontFamily: font }}>
                        <div className="absolute top-0 left-0 h-full w-4 bg-gradient-to-r from-black/5 to-transparent z-10 pointer-events-none hidden md:block"></div>
                        <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-black/5 to-transparent z-10 pointer-events-none md:hidden"></div>
                        <div className="p-4 md:p-8 h-full flex flex-col">
                            <EndCover />
                        </div>
                    </div>
                    <div className="back" style={{ backgroundColor: coverBg, color: '#fff', fontFamily: font }}>
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-widest">FIN</h2>
                            <p className="mt-4 text-xs opacity-50 uppercase tracking-widest">Deslizá para volver</p>
                        </div>
                    </div>
                </div>
            );
        }
        return pages;
    };

    return (
        <div className="h-[100dvh] w-full bg-slate-200 flex items-center justify-center overflow-hidden select-none relative" style={{ fontFamily: font }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;500;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@400;700;900&display=swap');
                
                .nav-btn { position: absolute; background-color: #fff; color: #000; border: 2px solid #000; width: 60px; height: 60px; font-size: 24px; border-radius: 50%; cursor: pointer; transition: all 0.3s ease; display: flex; justify-content: center; align-items: center; z-index: 90; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
                .nav-btn.prev-btn { left: 20px; top: 50%; transform: translateY(-50%); }
                .nav-btn.next-btn { right: 20px; top: 50%; transform: translateY(-50%); }
                @media (max-width: 768px) {
                    .nav-btn { width: 45px; height: 45px; font-size: 18px; }
                    .nav-btn.prev-btn { left: 50%; top: 15px; transform: translateX(-50%); }
                    .nav-btn.next-btn { left: 50%; top: auto; bottom: 15px; right: auto; transform: translateX(-50%); }
                }

                .paper { position: absolute; width: 50%; height: 100%; top: 0; right: 0; transform-style: preserve-3d; transform-origin: left center; transition: transform 0.8s cubic-bezier(0.3, 0.0, 0.2, 1); cursor: grab; transform: rotateY(0deg); will-change: transform; }
                .paper:active { cursor: grabbing; }
                .front, .back { position: absolute; width: 100%; height: 100%; top: 0; left: 0; backface-visibility: hidden; background-color: #fff; overflow: hidden; display: flex; flex-direction: column; }
                
                .front { transform: rotateY(0deg) translateZ(1px); border-radius: 0 20px 20px 0; box-shadow: inset 4px 0 15px rgba(0,0,0,0.05), 10px 15px 40px rgba(0,0,0,0.2); }
                .back { transform: rotateY(180deg) translateZ(1px); border-radius: 20px 0 0 20px; box-shadow: inset -4px 0 15px rgba(0,0,0,0.05), -10px 15px 40px rgba(0,0,0,0.2); }
                
                @media (max-width: 768px) {
                    .paper { width: 100% !important; height: 50% !important; top: 50% !important; left: 0 !important; transform-origin: top center; transform: rotateX(0deg); }
                    .front { transform: rotateX(0deg) translateZ(1px); border-radius: 0 0 16px 16px; box-shadow: inset 0 4px 15px rgba(0,0,0,0.05), 0 15px 30px rgba(0,0,0,0.15); }
                    .back { transform: rotateX(180deg) translateZ(1px); border-radius: 16px 16px 0 0; box-shadow: inset 0 -4px 15px rgba(0,0,0,0.05), 0 -15px 30px rgba(0,0,0,0.15); }
                }

                .tech-specs-overlay::-webkit-scrollbar { display: none; }
                .tech-specs-overlay { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />

            <button className="nav-btn prev-btn" id="prev-btn" disabled>◀</button>
            <button className="nav-btn next-btn" id="next-btn">▶</button>

            <div id="book-wrapper" className="relative w-[88vw] max-w-[1200px] h-[85vh] max-h-[800px] md:h-[85vh] max-md:h-[70dvh] z-20" style={{ perspective: '3500px' }}>
                <div id="book" className="absolute w-full h-full top-0 left-0" style={{ transformStyle: 'preserve-3d' }}>
                    {renderPages()}
                </div>
            </div>

            {selectedMediaItem && <MediaCarouselModal item={selectedMediaItem} onClose={() => setSelectedMediaItem(null)} />}
        </div>
    );
}

// Envoltorio para Suspense (necesario por useSearchParams)
export default function RevistaPublica() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-200"><Loader2 className="animate-spin text-slate-800" size={40} /></div>}>
            <RevistaPublicaContent />
        </Suspense>
    );
}

function ItemContent({ item, settings, onOpenMedia }: { item: any, settings: any, onOpenMedia: (item: any) => void }) {
    const [showSpecs, setShowSpecs] = useState(false);

    let imgUrls: string[] = [];
    if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
        imgUrls = item.image_urls;
    } else if (item.image_url) {
        imgUrls = [item.image_url];
    }

    const principalImage = imgUrls.length > 0 ? convertirUrlDrive(imgUrls[0]) : 'https://placehold.co/600x800?text=No+Image';
    const hasMultipleMedia = imgUrls.length > 1 || !!item.video_url;

    const waLink = settings?.whatsapp_number
        ? `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(`Hola! Quería consultar por: ${item.name}${item.sku ? ` (${item.sku})` : ''} que vi en el catálogo.`)}`
        : '#';
    const igLink = settings?.instagram_url || '#';

    return (
        <div className="flex flex-col md:flex-col max-md:flex-row h-full gap-4 md:gap-0 relative flex-1">
            {item.technical_specs?.length > 0 && (
                <button className="absolute top-2 right-2 md:top-4 md:right-4 z-30 p-2 bg-slate-900/10 hover:bg-slate-900/20 rounded-full transition-colors text-slate-700" onClick={(e) => { e.stopPropagation(); setShowSpecs(!showSpecs); }}>
                    <Info size={20} />
                </button>
            )}

            {showSpecs && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-40 p-5 rounded-2xl border border-slate-100 flex flex-col tech-specs-overlay overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 flex-shrink-0">
                        <h4 className="font-black text-base uppercase text-slate-500 tracking-wider">Ficha Técnica</h4>
                        <button onClick={() => setShowSpecs(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500"><X size={18} /></button>
                    </div>
                    <div className="space-y-3 text-sm">
                        {item.technical_specs.map((spec: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center gap-4 bg-slate-50 p-3 rounded-lg">
                                <span className="font-bold text-slate-500 uppercase">{spec.clave}</span>
                                <span className="font-bold text-slate-800 text-right">{spec.valor}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CONTENEDOR IMAGEN (Clickable para Carrusel) */}
            <div className="w-[45%] md:w-full h-[45%] md:h-[50%] min-h-[180px] rounded-2xl overflow-hidden shrink-0 mb-0 md:mb-5 bg-slate-50 flex items-center justify-center cursor-pointer relative group clickable-media border border-slate-100" onClick={(e) => { e.stopPropagation(); onOpenMedia(item); }}>
                <img src={principalImage} className="w-full h-full object-contain pointer-events-none transition-transform group-hover:scale-105" onError={(e) => { (e.target as any).src = 'https://placehold.co/600x800?text=Error'; }} />
                {hasMultipleMedia && (
                    <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-3 py-1.5 rounded-full font-bold backdrop-blur-sm flex items-center gap-1 shadow-lg pointer-events-none">
                        Ver galería/video
                    </div>
                )}
            </div>

            {/* TEXTOS (PROHIBIDO SCROLL - Flex proporcional) */}
            <div className="w-[55%] md:w-full flex-1 flex flex-col justify-center md:justify-start py-0 overflow-hidden px-1">
                <div className="mb-2 md:mb-4 flex-shrink-1 overflow-hidden">
                    {item.sku && <span className="text-xs md:text-sm font-black text-slate-400 mb-0.5 md:mb-1 block uppercase tracking-widest font-mono truncate">{item.sku}</span>}
                    <h3 className="text-xl md:text-3xl lg:text-4xl font-black text-slate-950 leading-tight mb-1 md:mb-2 line-clamp-2">{item.name}</h3>
                    {item.price && <div className="text-2xl md:text-4xl lg:text-5xl font-black text-emerald-600">${Number(item.price).toLocaleString('es-AR')}</div>}
                </div>

                {item.variants && (
                    <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4 overflow-hidden flex-shrink-1">
                        {item.variants.split('|').map((v: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 md:px-3 md:py-1.5 border-2 border-slate-200 rounded-lg md:rounded-xl text-[10px] md:text-sm font-black text-slate-700 bg-white whitespace-nowrap">{v.trim()}</span>
                        ))}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 mt-auto pt-3 md:pt-4 border-t border-slate-100 flex-shrink-0">
                    <a href={waLink} target="_blank" className="flex-1 flex items-center justify-center gap-2 px-3 py-3 md:px-4 md:py-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs md:text-sm font-black hover:bg-emerald-100 transition-colors uppercase tracking-wider whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <MessageSquareText size={18} /> Consultar
                    </a>
                    {igLink !== '#' && (
                        <a href={igLink} target="_blank" className="flex-1 flex items-center justify-center gap-2 px-3 py-3 md:px-4 md:py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-xs md:text-sm font-black hover:border-slate-900 hover:text-slate-900 transition-colors uppercase tracking-wider whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <InstagramIcon size={18} /> Instagram
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

function MediaCarouselModal({ item, onClose }: { item: any, onClose: () => void }) {
    let imgUrls: string[] = [];
    if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
        imgUrls = item.image_urls;
    } else if (item.image_url) {
        imgUrls = [item.image_url];
    }

    // Lógica unificada para fuentes de medios (Imagen, Video Drive, Video YouTube)
    const mediaSources = [
        ...imgUrls.map((url: string) => ({ type: 'image', url: convertirUrlDrive(url) })),
    ];

    if (item.video_url) {
        const youtubeId = extraerIdYoutube(item.video_url);
        if (youtubeId) {
            mediaSources.push({ type: 'youtube', url: youtubeId });
        } else if (item.video_url.includes('drive.google.com') || item.video_url.endsWith('.mp4') || item.video_url.endsWith('.mov')) {
            mediaSources.push({ type: 'video', url: convertirUrlDrive(item.video_url) });
        }
    }

    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    const next = (e: any) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % mediaSources.length); };
    const prev = (e: any) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + mediaSources.length) % mediaSources.length); };

    useEffect(() => {
        if (mediaSources[currentIndex]?.type === 'video' && videoRef.current) {
            videoRef.current.play().catch(e => console.log("Autoplay blocked"));
        }
    }, [currentIndex]);

    if (mediaSources.length === 0) return null;
    const currentMedia = mediaSources[currentIndex];

    return (
        // Fix descentrado: fixed inset-0, z alto, y aseguramos que el click en onClose no propague
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center select-none" onClick={(e) => { e.stopPropagation(); onClose(); }}>

            <button className="absolute top-6 right-6 z-50 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors" onClick={(e) => { e.stopPropagation(); onClose(); }}><X size={24} /></button>

            <div className="relative w-full h-full flex items-center justify-center group" onClick={(e) => e.stopPropagation()}>
                {currentMedia.type === 'image' && (
                    <img src={currentMedia.url} className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl" />
                )}

                {currentMedia.type === 'video' && (
                    <div className="relative w-[90vw] max-w-[500px] aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl">
                        <video ref={videoRef} src={currentMedia.url} className="w-full h-full object-cover" controls playsInline loop muted />
                    </div>
                )}

                {currentMedia.type === 'youtube' && (
                    <div className="relative w-[90vw] max-w-[1000px] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                        <iframe
                            src={`https://www.youtube.com/embed/${currentMedia.url}?autoplay=1&mute=1&loop=1&playlist=${currentMedia.url}`}
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}

                {mediaSources.length > 1 && (
                    <>
                        <button className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full backdrop-blur-sm transition-all" onClick={prev}><ChevronLeft size={32} /></button>
                        <button className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full backdrop-blur-sm transition-all" onClick={next}><ChevronRight size={32} /></button>

                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full flex gap-2">
                            {mediaSources.map((_, idx) => (
                                <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/30'}`}></div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function EndCover() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-center p-8 bg-white rounded-r-2xl">
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-widest mb-4">FIN</h2>
            <div className="w-16 h-1 bg-slate-200 rounded-full mb-8 mx-auto"></div>
            <p className="text-sm md:text-base font-bold text-slate-400">Gracias por ver nuestro catálogo.</p>
        </div>
    );
}