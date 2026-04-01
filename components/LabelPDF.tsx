import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Registrar Fuentes para asegurar consistencia
Font.register({
    family: 'Sora',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/font-sora/1.2.1/fonts/latin/sora-400.ttf', fontWeight: 400 },
        { src: 'https://cdn.jsdelivr.net/font-sora/1.2.1/fonts/latin/sora-700.ttf', fontWeight: 700 },
        { src: 'https://cdn.jsdelivr.net/font-sora/1.2.1/fonts/latin/sora-800.ttf', fontWeight: 800 },
    ]
});

interface LabelPDFProps {
    productName: string;
    price: number | null;
    sku: string | null;
    qrCodeData: string;
    widthMm: number;
    heightMm: number;
    layout: string;
    showPrice: boolean;
    showSku: boolean;
    showName: boolean;
    logoBase64: string | null;
    promoText: string;
    extraNote: string;
}

const LabelPDF: React.FC<LabelPDFProps> = ({ productName, price, sku, qrCodeData, widthMm, heightMm, layout, showPrice, showSku, showName, logoBase64, promoText, extraNote }) => {

    // LÓGICA DE ESCALADO DINÁMICO
    const mmToPt = 2.83465;
    const pageWidth = widthMm * mmToPt;
    const pageHeight = heightMm * mmToPt;

    // Normalizamos con respecto a 50x25
    const normalizedW = widthMm / 50;
    const normalizedH = heightMm / 25;
    const innerScale = Math.min(normalizedW, normalizedH);

    const padding = Math.max(1.5, 3 * innerScale); // Padding dinámico

    // Tamaños de fuente calculados dinámicamente con un mínimo legible
    const fontSizeTitle = Math.max(4, 7 * innerScale);
    const fontSizePrice = Math.max(6, 14 * innerScale);
    const fontSizeNote = Math.max(2, 4 * innerScale);
    const fontSizePromo = Math.max(3, 5 * innerScale);

    const dynamicStyles = StyleSheet.create({
        page: {
            fontFamily: 'Sora',
            color: '#000000',
            width: pageWidth,
            height: pageHeight,
            padding: padding,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF'
        },

        // Estructura layout centro (33/33/33)
        flexContainerCenter: {
            width: '100%',
            height: '100%',
            flexDirection: 'row',
            alignItems: 'center',
        },
        sectionCenterText: {
            width: '33%',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: 1,
            overflow: 'hidden'
        },
        sectionCenterQR: {
            width: '33%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
        },
        sectionCenterRight: {
            width: '33%',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-end',
            textAlign: 'right',
            gap: 1,
            overflow: 'hidden'
        },

        // Estructura layout izq/der
        flexContainerFlex: {
            width: '100%',
            height: '100%',
            flexDirection: layout === 'qr-left' ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: padding,
        },
        sectionTextFlex: {
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            overflow: 'hidden',
            gap: 1,
        },
        sectionQRFlex: {
            width: logoBase64 || showName || showPrice || showPromo || showSku || extraNote ? '42%' : '80%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
        },

        // Tipografía Dinámica
        productName: {
            fontSize: fontSizeTitle,
            fontWeight: 700,
            textTransform: 'uppercase',
            lineHeight: 1.1,
            width: '100%',
        },
        priceCash: {
            fontSize: fontSizePrice,
            fontWeight: 800,
            letterSpacing: -1,
            lineHeight: 1,
        },
        extraNote: {
            fontSize: fontSizeNote,
            color: '#64748b',
            lineHeight: 1.1,
        },
        sku: {
            fontSize: fontSizeNote,
            fontWeight: 800,
            textTransform: 'uppercase',
            opacity: 0.6,
        },
        promoBadge: {
            backgroundColor: '#000000',
            color: '#FFFFFF',
            fontSize: fontSizePromo,
            fontWeight: 800,
            textTransform: 'uppercase',
            padding: `2 ${fontSizePromo / 2.5}`,
            borderRadius: 2,
            marginTop: 2,
        },
        qrImage: {
            height: '100%',
            objectFit: 'contain'
        },
        logoImage: {
            height: fontSizeTitle * 1.6,
            width: 'auto',
            objectFit: 'contain',
            marginBottom: fontSizeTitle / 3,
        }
    });

    const hasInternalContent = showName || showPrice || showSku || logoBase64 || showPromo || extraNote;

    return (
        <Document>
            <Page size={[pageWidth, pageHeight]} style={dynamicStyles.page}>

                {layout === 'qr-center' && hasInternalContent ? (
                    <View style={dynamicStyles.flexContainerCenter}>
                        <View style={dynamicStyles.sectionCenterText}>
                            {logoBase64 && <Image src={logoBase64} style={dynamicStyles.logoImage} />}
                            {showName && <Text style={dynamicStyles.productName}>{productName}</Text>}
                            {showPrice && <Text style={dynamicStyles.priceCash}>${price}</Text>}
                        </View>
                        <View style={dynamicStyles.sectionCenterQR}>
                            <Image src={qrCodeData} style={dynamicStyles.qrImage} />
                        </View>
                        <View style={dynamicStyles.sectionCenterRight}>
                            {showSku && <Text style={dynamicStyles.sku}>{sku}</Text>}
                            {showPromo && <Text style={dynamicStyles.promoBadge}>{promoText || 'PROMO'}</Text>}
                            {extraNote && <Text style={dynamicStyles.extraNote}>{extraNote}</Text>}
                        </View>
                    </View>
                ) : (
                    <View style={dynamicStyles.flexContainerFlex}>
                        {hasInternalContent && (
                            <View style={{ ...dynamicStyles.sectionTextFlex, textAlign: layout === 'qr-right' ? 'left' : 'right', alignItems: layout === 'qr-right' ? 'flex-start' : 'flex-end' }}>
                                {logoBase64 && <Image src={logoBase64} style={{ ...dynamicStyles.logoImage, height: fontSizeTitle * 2.1 }} />}
                                {showName && <Text style={{ ...dynamicStyles.productName, fontSize: fontSizeTitle * 1.1 }}>{productName}</Text>}
                                {showPrice && <Text style={{ ...dynamicStyles.priceCash, fontSize: fontSizePrice * 1.2 }}>${price}</Text>}
                                {showSku && <Text style={{ ...dynamicStyles.sku, marginTop: 2 }}>{sku}</Text>}
                                {extraNote && <Text style={{ ...dynamicStyles.extraNote, marginTop: 2 }}>{extraNote}</Text>}
                                {showPromo && <Text style={{ ...dynamicStyles.promoBadge, paddingHorizontal: 6, fontSize: fontSizePromo * 1.1 }}>{promoText || 'PROMO'}</Text>}
                            </View>
                        )}
                        <View style={dynamicStyles.sectionQRFlex}>
                            <Image src={qrCodeData} style={dynamicStyles.qrImage} />
                        </View>
                    </View>
                )}
            </Page>
        </Document>
    );
};

export default LabelPDF;