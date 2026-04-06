'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, MessageSquareText, Instagram, Info, X } from 'lucide-react';

const convertirUrlDrive = (url: string) => {
    if (!url || !url.includes('drive.google.com')) return url;
    let fileId = '';
    const match = url.match(/\/file\/d\/(.+?)\//) || url.match(/\?id=(.+?)(&|$)/);
    if (match) fileId = match[1];
    return fileId ? `https://drive.google.com/uc?id=${fileId}` : url;
};

export default function RevistaPublica() {
    const { id } = useParams();
    const [catalogo, setCatalogo] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCatalogo() {
            // Traemos el catálogo
            const { data, error } = await supabase.from('tool_catalogs').select('*').eq('id', id).single();
            if (!error && data) setCatalogo(data);

            // Traemos la configuración general para el Whatsapp e Instagram
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
            let target = e.target;
            let paperElement: HTMLElement | null = null;
            let paperIndex = -1;

            while (target && target !== document.body) {
                if (target.classList && target.classList.contains('paper')) {
                    paperElement = target;
                    paperIndex = papers.indexOf(paperElement as HTMLElement);
                }
                if (target.tagName.toLowerCase() === 'button' || target.tagName.toLowerCase() === 'span' || target.tagName.toLowerCase() === 'a' || target.classList.contains('tech-specs-overlay')) return;
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
            } else {
                isDragging = false; return;
            }

            currentPaper.style.transition = "none";
            bookWrapper!.style.transition = "none";
            updateZIndexes(isFlippingNext ? currentPage : currentPage - 1, true);
        }

        function drag(e: any) {
            if (!isDragging || !currentPaper) return;
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
            if (!isDragging || !currentPaper) return;
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
    }, [catalogo, loading]);

    if (loading) return <div className="flex h-[100dvh] w-full items-center justify-center bg-slate-200"><Loader2 className="animate-spin text-slate-800" size={40} /></div>;
    if (!catalogo) return <div className="flex h-[100dvh] w-full items-center justify-center bg-slate-200 text-xl font-black">Revista no encontrada</div>;

    const items = catalogo.items || [];
    const font = catalogo.font_family || 'Inter';
    const coverBg = catalogo.cover_color || '#0a0a0a';

    const renderPages = () => {
        const pages = [];

        pages.push(
            <div className="paper absolute w-1/2 h-full top-0 right-0 md:origin-left origin-top md:rotate-y-0 rotate-x-0 transition-transform duration-800 ease-[cubic-bezier(0.3,0.0,0.2,1)] cursor-grab active:cursor-grabbing will-change-transform" key="p0" style={{ transformStyle: 'preserve-3d' }}>
                <div className="front absolute w-full h-full top-0 left-0 bg-white overflow-hidden flex flex-col items-center justify-center text-center p-4 md:rounded-r-3xl md:rounded-l-none rounded-b-3xl rounded-t-none shadow-[inset_4px_0_15px_rgba(0,0,0,0.05),_10px_15px_40px_rgba(0,0,0,0.2)]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg) translateZ(1px)', backgroundColor: coverBg, color: '#fff', fontFamily: font }}>
                    <h1 className="text-3xl md:text-5xl font-black tracking-[0.2em] md:tracking-[0.3em] uppercase">{catalogo.cover_title}</h1>
                    {catalogo.description && <p className="mt-4 opacity-70 text-sm md:text-base max-w-[80%]">{catalogo.description}</p>}
                    <p className="mt-8 text-xs opacity-50 uppercase tracking-widest animate-pulse">Arrastrá para abrir</p>
                </div>
                <div className="back absolute w-full h-full top-0 left-0 bg-white overflow-hidden flex flex-col md:rounded-l-3xl md:rounded-r-none rounded-t-3xl rounded-b-none shadow-[inset_-4px_0_15px_rgba(0,0,0,0.05),_-10px_15px_40px_rgba(0,0,0,0.2)] p-4 md:p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)', fontFamily: font }}>
                    <div className="absolute top-0 right-0 h-full w-4 bg-gradient-to-l from-black/5 to-transparent z-10 pointer-events-none"></div>
                    {items[0] && <ItemContent item={items[0]} settings={settings} />}
                </div>
            </div>
        );

        for (let i = 1; i < Math.ceil(items.length / 2); i++) {
            const frontItem = items[i * 2 - 1];
            const backItem = items[i * 2];

            pages.push(
                <div className="paper absolute w-1/2 h-full top-0 right-0 md:origin-left origin-top md:rotate-y-0 rotate-x-0 transition-transform duration-800 ease-[cubic-bezier(0.3,0.0,0.2,1)] cursor-grab active:cursor-grabbing will-change-transform" key={`p${i}`} style={{ transformStyle: 'preserve-3d' }}>
                    <div className="front absolute w-full h-full top-0 left-0 bg-white overflow-hidden flex flex-col md:rounded-r-3xl md:rounded-l-none rounded-b-3xl rounded-t-none shadow-[inset_4px_0_15px_rgba(0,0,0,0.05),_10px_15px_40px_rgba(0,0,0,0.2)] p-4 md:p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg) translateZ(1px)', fontFamily: font }}>
                        <div className="absolute top-0 left-0 h-full w-4 bg-gradient-to-r from-black/5 to-transparent z-10 pointer-events-none"></div>
                        {frontItem && <ItemContent item={frontItem} settings={settings} />}
                    </div>
                    <div className="back absolute w-full h-full top-0 left-0 bg-white overflow-hidden flex flex-col md:rounded-l-3xl md:rounded-r-none rounded-t-3xl rounded-b-none shadow-[inset_-4px_0_15px_rgba(0,0,0,0.05),_-10px_15px_40px_rgba(0,0,0,0.2)] p-4 md:p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)', fontFamily: font }}>
                        <div className="absolute top-0 right-0 h-full w-4 bg-gradient-to-l from-black/5 to-transparent z-10 pointer-events-none"></div>
                        {backItem ? <ItemContent item={backItem} settings={settings} /> : <EndCover bg={coverBg} />}
                    </div>
                </div>
            );
        }

        if (items.length % 2 !== 0) {
            pages.push(
                <div className="paper absolute w-1/2 h-full top-0 right-0 md:origin-left origin-top md:rotate-y-0 rotate-x-0 transition-transform duration-800 ease-[cubic-bezier(0.3,0.0,0.2,1)] cursor-grab active:cursor-grabbing will-change-transform" key={`p_end`} style={{ transformStyle: 'preserve-3d' }}>
                    <div className="front absolute w-full h-full top-0 left-0 bg-white overflow-hidden flex flex-col md:rounded-r-3xl md:rounded-l-none rounded-b-3xl rounded-t-none shadow-[inset_4px_0_15px_rgba(0,0,0,0.05),_10px_15px_40px_rgba(0,0,0,0.2)] p-4 md:p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg) translateZ(1px)', fontFamily: font }}>
                        <div className="absolute top-0 left-0 h-full w-4 bg-gradient-to-r from-black/5 to-transparent z-10 pointer-events-none"></div>
                        <EndCover bg={coverBg} />
                    </div>
                    <div className="back absolute w-full h-full top-0 left-0 overflow-hidden flex flex-col items-center justify-center md:rounded-l-3xl md:rounded-r-none rounded-t-3xl rounded-b-none shadow-[inset_-4px_0_15px_rgba(0,0,0,0.05),_-10px_15px_40px_rgba(0,0,0,0.2)] p-4" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)', backgroundColor: coverBg, color: '#fff', fontFamily: font }}>
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest">FIN</h2>
                        <p className="mt-4 text-xs opacity-50 uppercase tracking-widest">Deslizá para volver</p>
                    </div>
                </div>
            );
        }

        return pages;
    };

    return (
        <div className="h-[100dvh] w-full bg-slate-200 flex items-center justify-center overflow-hidden select-none" style={{ fontFamily: font }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;500;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@400;700&display=swap');
                
                .nav-btn { position: absolute; background-color: #fff; color: #000; border: 2px solid #000; width: 70px; height: 70px; font-size: 28px; border-radius: 50%; cursor: pointer; transition: all 0.3s ease; display: flex; justify-content: center; align-items: center; z-index: 9999; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
                .nav-btn.prev-btn { left: 30px; top: 50%; transform: translateY(-50%); }
                .nav-btn.next-btn { right: 30px; top: 50%; transform: translateY(-50%); }
                @media (hover: hover) { .nav-btn:hover { background-color: #000; color: #fff; transform: translateY(-50%) scale(1.1); } }
                .nav-btn:disabled { opacity: 0.2; cursor: not-allowed; border-color: #999; color: #999; }
                
                .m-icon { display: none; } .d-icon { display: inline; }
                
                @media (max-width: 768px) {
                    .d-icon { display: none; } .m-icon { display: inline; }
                    .nav-btn { width: 50px; height: 50px; font-size: 20px; background-color: #fff !important; color: #000 !important; }
                    .nav-btn:active { background-color: #e5e5e5 !important; transform: translateX(-50%) scale(0.95) !important; }
                    .nav-btn.prev-btn { left: 50% !important; top: 30px !important; transform: translateX(-50%) !important; }
                    .nav-btn.next-btn { left: 50% !important; top: auto !important; bottom: 30px !important; right: auto !important; transform: translateX(-50%) !important; }
                    
                    .paper { width: 100% !important; height: 50% !important; top: 50% !important; right: auto !important; left: 0 !important; }
                }

                .tech-specs-overlay::-webkit-scrollbar { display: none; }
                .tech-specs-overlay { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />

            <button className="nav-btn prev-btn" id="prev-btn" disabled><span className="d-icon">◀</span><span className="m-icon">▲</span></button>
            <button className="nav-btn next-btn" id="next-btn"><span className="d-icon">▶</span><span className="m-icon">▼</span></button>

            <div id="book-wrapper" className="relative w-[88vw] max-w-[1200px] h-[85vh] max-h-[800px] md:w-[88vw] md:h-[85vh] max-md:w-[95vw] max-md:h-[65dvh] max-md:max-h-[calc(100dvh-180px)] z-20" style={{ perspective: '3500px', WebkitPerspective: '3500px' }}>
                <div id="book" className="absolute w-full h-full top-0 left-0" style={{ transformStyle: 'preserve-3d' }}>
                    {renderPages()}
                </div>
            </div>
        </div>
    );
}

function ItemContent({ item, settings }: { item: any, settings: any }) {
    const [showSpecs, setShowSpecs] = useState(false);
    const imageUrl = convertirUrlDrive(item.image_url);

    const waLink = settings?.whatsapp_number
        ? `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(`Hola! Quería consultar por el artículo: ${item.name}${item.sku ? ` (SKU: ${item.sku})` : ''} que vi en el catálogo.`)}`
        : '#';

    const igLink = settings?.instagram_url || '#';

    return (
        <div className="flex flex-col md:flex-col max-md:flex-row h-full gap-4 md:gap-0 relative">
            {item.technical_specs?.length > 0 && (
                <button className="absolute top-2 right-2 md:top-4 md:right-4 z-30 p-2 bg-slate-900/10 hover:bg-slate-900/20 rounded-full transition-colors text-slate-700" onClick={(e) => { e.stopPropagation(); setShowSpecs(!showSpecs); }}>
                    <Info size={18} />
                </button>
            )}

            {showSpecs && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-40 p-5 rounded-2xl border border-slate-100 flex flex-col tech-specs-overlay overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <h4 className="font-black text-sm uppercase text-slate-500 tracking-wider">Ficha Técnica</h4>
                        <button onClick={() => setShowSpecs(false)} className="p-1.5 bg-slate-100 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500"><X size={16} /></button>
                    </div>
                    <div className="space-y-3 flex-1">
                        {item.technical_specs.map((spec: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs gap-4 bg-slate-50 p-2 rounded-md">
                                <span className="font-bold text-slate-500 uppercase">{spec.clave}</span>
                                <span className="font-bold text-slate-800 text-right">{spec.valor}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="w-[45%] md:w-full h-full md:h-[50dvh] rounded-xl overflow-hidden shrink-0 mb-0 md:mb-5 bg-slate-50 flex items-center justify-center">
                <img src={imageUrl || 'https://placehold.co/600x800?text=No+Image'} className="max-w-full max-h-full object-contain pointer-events-none" onError={(e) => { (e.target as any).src = 'https://placehold.co/600x800?text=Error'; }} />
            </div>

            <div className="w-[55%] md:w-full flex-1 flex flex-col justify-center md:justify-start py-1 md:py-0">
                <div className="mb-3">
                    {item.sku && <span className="text-[10px] md:text-xs font-bold text-slate-400 mb-0.5 block uppercase tracking-wider font-mono">{item.sku}</span>}
                    <h3 className="text-base md:text-2xl font-black text-slate-900 leading-tight mb-1 md:mb-2">{item.name}</h3>
                    {item.price && <div className="text-xl md:text-3xl font-black text-emerald-600 mb-3">${Number(item.price).toLocaleString('es-AR')}</div>}

                    {item.variants && (
                        <div className="flex flex-wrap gap-1 md:gap-1.5 mb-3">
                            {item.variants.split('|').map((v: string, i: number) => (
                                <span key={i} className="px-2 md:px-3 py-1 border border-slate-200 rounded-lg text-[9px] md:text-xs font-bold text-slate-600 bg-white">{v.trim()}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* BOTONES DE REDES SOCIALES NO INVASIVOS */}
                <div className="flex flex-col xl:flex-row gap-2 mt-auto pt-3 border-t border-slate-100">
                    <a href={waLink} target="_blank" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#25D366]/10 text-[#128C7E] rounded-lg text-[10px] font-bold hover:bg-[#25D366]/20 transition-colors uppercase tracking-wider" onClick={(e) => e.stopPropagation()}>
                        <MessageSquareText size={14} /> WhatsApp
                    </a>
                    {igLink !== '#' && (
                        <a href={igLink} target="_blank" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#E1306C]/10 text-[#C13584] rounded-lg text-[10px] font-bold hover:bg-[#E1306C]/20 transition-colors uppercase tracking-wider" onClick={(e) => e.stopPropagation()}>
                            <Instagram size={14} /> Instagram
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

function EndCover({ bg }: { bg: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-white text-center p-8 relative">
            <h2 className="text-3xl md:text-5xl font-black text-slate-200 uppercase tracking-widest mb-4">FIN</h2>
            <div className="w-16 h-1 bg-slate-200 rounded-full mb-8"></div>
            <p className="text-sm md:text-base font-bold text-slate-400">Gracias por ver nuestro catálogo.</p>
        </div>
    );
}