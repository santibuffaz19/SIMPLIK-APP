'use client' // Esto le dice a Next.js que esta página interactúa con el usuario en el navegador

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { PDFDownloadLink } from '@react-pdf/renderer';
import LabelPDF from '../components/LabelPDF'; // Importamos el diseño del PDF que creamos recién

export default function GeneradorEtiquetas() {
    // Estados para guardar lo que escribe el usuario
    const [width, setWidth] = useState<number>(50); // Por defecto 50mm
    const [height, setHeight] = useState<number>(25); // Por defecto 25mm
    const [productName, setProductName] = useState<string>('Producto de Prueba');
    const [price, setPrice] = useState<string>('1500');

    // Estado para guardar la imagen del QR generada
    const [qrBase64, setQrBase64] = useState<string>('');

    // La URL "falsa" de tu producto (luego vendrá de Supabase)
    const productUrl = 'https://simplik.com/p/a1b2c3d4';

    // Este hook genera el QR cada vez que se carga la página
    useEffect(() => {
        QRCode.toDataURL(productUrl, { margin: 1 })
            .then(url => setQrBase64(url))
            .catch(err => console.error(err));
    }, []);

    // Para evitar errores en la carga inicial (hidratación) en Next.js
    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);

    return (
        <div className="min-h-screen bg-gray-100 p-8 text-black">
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6 border-b pb-2">Configurador de Etiquetas (Simplik)</h1>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Controles de Medida */}
                    <div className="flex flex-col">
                        <label className="font-semibold mb-1">Ancho (mm)</label>
                        <input
                            type="number"
                            value={width}
                            onChange={(e) => setWidth(Number(e.target.value))}
                            className="border p-2 rounded"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="font-semibold mb-1">Alto (mm)</label>
                        <input
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(Number(e.target.value))}
                            className="border p-2 rounded"
                        />
                    </div>

                    {/* Controles de Producto de Prueba */}
                    <div className="flex flex-col">
                        <label className="font-semibold mb-1">Nombre del Producto</label>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="border p-2 rounded"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="font-semibold mb-1">Precio</label>
                        <input
                            type="text"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="border p-2 rounded"
                        />
                    </div>
                </div>

                {/* Zona de Descarga del PDF */}
                <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
                    <h2 className="text-lg font-bold mb-4">Etiqueta Lista</h2>

                    {isClient && qrBase64 ? (
                        <PDFDownloadLink
                            document={<LabelPDF
                                productName={productName}
                                price={Number(price) || 0} // CORRECCIÓN: Convertimos el precio a número
                                qrCodeData={qrBase64}
                                widthMm={width}
                                heightMm={height}
                                // CORRECCIÓN: Se envían todas las props obligatorias por defecto
                                sku="12345"
                                layout="qr-right"
                                showPrice={true}
                                showSku={true}
                                showName={true}
                                logoBase64={null}
                                promoText=""
                                extraNote=""
                            />}
                            fileName={`etiqueta-${productName.replace(' ', '-')}.pdf`}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded shadow transition-colors inline-block"
                        >
                            {({ loading }) => (loading ? 'Generando documento...' : 'Descargar PDF (Listo para Zebra)')}
                        </PDFDownloadLink>
                    ) : (
                        <p>Cargando motor de impresión...</p>
                    )}
                </div>
            </div>
        </div>
    );
}