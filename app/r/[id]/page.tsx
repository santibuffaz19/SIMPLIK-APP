'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function RevistaPublica() {
    const { id } = useParams();
    const [catalogo, setCatalogo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCatalogo() {
            const { data, error } = await supabase.from('tool_catalogs').select('*').eq('id', id).single();
            if (!error && data) setCatalogo(data);
            setLoading(false);
        }
        fetchCatalogo();
    }, [id]);

    // INYECCIÓN DEL MOTOR 3D ORIGINAL
    useEffect(() => {
        if (!catalogo || loading) return;

        const prevBtn = document.getElementById("prev-btn") as HTMLButtonElement;
        const nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
        const bookWrapper = document.getElementById("book-wrapper");
        const bookElement = document.getElementById("book");

        // Recolectamos todas las hojas dinámicas
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
            if (progress === undefined) {
                shift = getBaseShift(currentPage);
            } else {
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
                if (target.tagName.toLowerCase() === 'button' || target.tagName.toLowerCase() === 'span') return;
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
                isDragging = false;
                return;
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

    // Empaquetamos los items de a 2 para formar las "Hojas" (Front y Back)
    const renderPages = () => {
        const pages = [];

        // PÁGINA 1: Portada (Front) y Primer Producto (Back)
        pages.push(
            <div className="paper absolute w-1/2 h-full top-0 right-0 md:origin-left origin-top md:rotate-y-0 rotate-x-0 transition-transform duration-800 ease-[cubic-bezier(0.3,0.0,0.2,1)] cursor-grab active:cursor-grabbing will-change-transform" key="p0" style={{ transformStyle: 'preserve-3d' }}>
                <div className="front absolute w-full h-full top-0 left-0 bg-white overflow-hidden flex flex-col items-center justify-center text-center p-4 md:rounded-r-2xl rounded-b-2xl shadow-[inset_4px_0_15px_rgba(0,0,0,0.05),_10px_15px_40px_rgba(0,0,0,0.2)] md:shadow-[inset_0_4px_15px_rgba(0,0,0,0.05),_0_15px_30px_rgba(0,0,0,0.15)]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg) translateZ(1px)', backgroundColor: coverBg, color: '#fff', fontFamily: font }}>
                    <h1 className="text-3xl md:text-5xl font-black tracking-[0.2em] md:tracking-[0.3em] uppercase">{catalogo.cover_title}</h1>
                    {catalogo.description && <p className="mt-4 opacity-70 text-sm md:text-base max-w-[80%]">{catalogo.description}</p>}
                    <p className="mt-8 text-xs opacity-50 uppercase tracking-widest animate-pulse">Arrastrá para abrir</p>
                </div>
                <div className="back absolute w-full h-full top-0 left-0 bg-white overflow-hidden flex flex-col md:rounded-l-2xl rounded-t-2xl shadow-[inset_-4px_0_15px_rgba(0,0,0,0.05),_-10px_15px_40px_rgba(0,0,0,0.2)] md:shadow-[inset_0_-4px_15px_rgba(0,0,0,0.05),_0_-15px_30px_rgba(0,0,0,0.15)] p-4 md:p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)', fontFamily: font }}>
                    {items[0] && <ItemContent item={items[0]} />}
                </div>
            </div>
        );

        // PÁGINAS INTERMEDIAS (Front: impar, Back: par)
        for (let i = 1; i < Math.ceil(items.length / 2); i++) {
            const frontItem = items[i * 2 - 1];
            const backItem = items[i * 2];

            pages.push(
                <div className="paper absolute w-1/2 h-full top-0 right-0 md:origin-left origin-top md:rotate-y-0 rotate-x-0 transition-transform duration-800 ease-[cubic-bezier(0.3,0.0,0.2,1)] cursor-grab active:cursor-grabbing will-change-transform" key={`p${i}`} style={{ transformStyle: 'preserve-3d' }}>
                    <div className="front absolute w-full h-full top-0 left-0 bg-white overflow-hidden flex flex-col md:rounded-r-2xl rounded-b-2xl shadow-[inset_4px_0_15px_rgba(0,0,0,0.05),_10px_15px_40px_rgba(0,0,0,0.2)] md:shadow-[inset_0_4px_15px_rgba(0,0,0,0.05),_0_15px_30px_rgba(0,0,0,0.15)] p-4 md:p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg) translateZ(1px)', fontFamily: font }}>
                        {frontItem && <ItemContent item={frontItem} />}
                    </div>
                    <div className="back absolute w-full h-full top-0 left-0 bg-white overflow-hidden flex flex-col md:rounded-l-2xl rounded-t-2xl shadow-[inset_-4px_0_15px_rgba(0,0,0,0.05),_-10px_15px_40px_rgba(0,0,0,0.2)] md:shadow-[inset_0_-4px_15px_rgba(0,0,0,0.05),_0_-15px_30px_rgba(0,0,0,0.15)] p-4 md:p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)', fontFamily: font }}>
                        {backItem ? <ItemContent item={backItem} /> : <EndCover bg={coverBg} />}
                    </div>
                </div>
            );
        }

        // SI LA CANTIDAD DE ITEMS ES IMPAR, HAY QUE AGREGAR UNA HOJA EXTRA PARA LA CONTRATAPA
        if (items.length % 2 !== 0) {
            pages.push(
                <div className="paper absolute w-1/2 h-full top-0 right-0 md:origin-left origin-top md:rotate-y-0 rotate-x-0 transition-transform duration-800 ease-[cubic-bezier(0.3,0.0,0.2,1)] cursor-grab active:cursor-grabbing will-change-transform" key={`p_end`} style={{ transformStyle: 'preserve-3d' }}>
                    <div className="front absolute w-full h-full top-0 left-0 bg-white overflow-hidden flex flex-col md:rounded-r-2xl rounded-b-2xl shadow-[inset_4px_0_15px_rgba(0,0,0,0.05),_10px_15px_40px_rgba(0,0,0,0.2)] md:shadow-[inset_0_4px_15px_rgba(0,0,0,0.05),_0_15px_30px_rgba(0,0,0,0.15)] p-4 md:p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg) translateZ(1px)', fontFamily: font }}>
                        <EndCover bg={coverBg} />
                    </div>
                    <div className="back absolute w-full h-full top-0 left-0 overflow-hidden flex flex-col items-center justify-center md:rounded-l-2xl rounded-t-2xl shadow-[inset_-4px_0_15px_rgba(0,0,0,0.05),_-10px_15px_40px_rgba(0,0,0,0.2)] md:shadow-[inset_0_-4px_15px_rgba(0,0,0,0.05),_0_-15px_30px_rgba(0,0,0,0.15)] p-4" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)', backgroundColor: coverBg, color: '#fff', fontFamily: font }}>
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest">FIN</h2>
                        <p className="mt-4 text-xs opacity-50 uppercase tracking-widest">Deslizá para volver</p>
                    </div>
                </div>
            );
        }

        return pages;
    };

    return (
        <div className="h-[100dvh] w-full bg-slate-300 flex items-center justify-center overflow-hidden select-none" style={{ fontFamily: font }}>
            {/* ESTILOS INYECTADOS GLOBALES PARA LA REVISTA */}
            <style dangerouslySetContent={{
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
                    
                    /* RECALIBRADO PARA CELULAR */
                    .paper { width: 100% !important; height: 50% !important; top: 50% !important; right: auto !important; left: 0 !important; }
                }
            `}} />

            <button className="nav-btn prev-btn" id="prev-btn" disabled><span className="d-icon">◀</span><span className="m-icon">▲</span></button>
            <button className="nav-btn next-btn" id="next-btn"><span className="d-icon">▶</span><span className="m-icon">▼</span></button>

            {/* CONTENEDOR 3D */}
            <div id="book-wrapper" className="relative w-[88vw] max-w-[1200px] h-[85vh] max-h-[800px] md:w-[88vw] md:h-[85vh] max-md:w-[95vw] max-md:h-[65dvh] max-md:max-h-[calc(100dvh-180px)]" style={{ perspective: '3500px', WebkitPerspective: '3500px' }}>
                <div id="book" className="absolute w-full h-full top-0 left-0" style={{ transformStyle: 'preserve-3d' }}>
                    {renderPages()}
                </div>
            </div>
        </div>
    );
}

// SUBCOMPONENTES PARA LA UI DE CADA HOJA
function ItemContent({ item }: { item: any }) {
    return (
        <div className="flex flex-col md:flex-col max-md:flex-row h-full gap-4 md:gap-0">
            <button className="absolute top-4 right-4 md:top-6 md:right-6 text-xl bg-white/80 backdrop-blur border border-slate-200 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-lg z-10 hover:scale-110 transition-transform" onClick={(e) => e.stopPropagation()}>♡</button>

            <div className="w-[45%] md:w-full h-full md:h-[55%] rounded-xl overflow-hidden shrink-0 mb-0 md:mb-6 bg-slate-100">
                <img src={item.image_url || 'https://placehold.co/600x800?text=No+Image'} className="w-full h-full object-cover pointer-events-none" />
            </div>

            <div className="w-[55%] md:w-full flex-1 flex flex-col justify-center md:justify-between py-2 md:py-0">
                <div>
                    {item.sku && <span className="text-[10px] md:text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wider">{item.sku}</span>}
                    <h3 className="text-base md:text-3xl font-black text-slate-900 leading-tight mb-2 md:mb-4">{item.name}</h3>
                    {item.price && <div className="text-lg md:text-3xl font-black text-emerald-600 mb-4">${item.price.toLocaleString('es-AR')}</div>}

                    {item.variants && (
                        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4">
                            {item.variants.split('|').map((v: string, i: number) => (
                                <span key={i} className="px-2 md:px-4 py-1 md:py-2 border border-slate-200 rounded-lg text-[10px] md:text-sm font-bold text-slate-600">{v.trim()}</span>
                            ))}
                        </div>
                    )}
                </div>
                <button className="w-full bg-slate-900 text-white font-black py-2.5 md:py-4 rounded-xl text-xs md:text-base uppercase tracking-widest mt-auto hover:bg-black transition-colors" onClick={(e) => { e.stopPropagation(); (e.target as any).innerText = '¡AGREGADO!'; }}>
                    Lo quiero
                </button>
            </div>
        </div>
    );
}

function EndCover({ bg }: { bg: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-white text-center p-8">
            <h2 className="text-3xl md:text-5xl font-black text-slate-200 uppercase tracking-widest mb-4">FIN</h2>
            <div className="w-16 h-1 bg-slate-200 rounded-full mb-8"></div>
            <p className="text-sm md:text-base font-bold text-slate-400">Gracias por ver nuestro catálogo.</p>
        </div>
    );
}