import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const MM_TO_PT = 2.83465;

export default function LabelPDF({
    productName, price, sku, qrCodeData, widthMm, heightMm, layout,
    showPrice, showSku, showName, logoBase64, promoText, extraNote
}: any) {
    const widthPt = widthMm * MM_TO_PT;
    const heightPt = heightMm * MM_TO_PT;

    // Escala general
    const innerScale = Math.min(widthMm / 50, heightMm / 25);

    const hasContent = showName || showPrice || showSku || logoBase64 || promoText || extraNote;

    const styles = StyleSheet.create({
        page: {
            width: widthPt, height: heightPt,
            flexDirection: 'row',
            backgroundColor: '#ffffff',
            alignItems: 'center',
            justifyContent: !hasContent
                ? (layout === 'qr-left' ? 'flex-start' : (layout === 'qr-right' ? 'flex-end' : 'center'))
                : 'center',
            padding: 6 * innerScale,
        },
        leftSection: {
            flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start',
            paddingRight: 2 * innerScale, // Aire para que el texto largo no toque el QR
        },
        rightSection: {
            flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end',
            paddingLeft: 2 * innerScale, // Aire para que el texto largo no toque el QR
        },
        infoSection: {
            flex: 1, flexDirection: 'column', justifyContent: 'center',
            alignItems: layout === 'qr-right' ? 'flex-start' : 'flex-end',
            paddingRight: layout === 'qr-right' ? 3 * innerScale : 0,
            paddingLeft: layout === 'qr-left' ? 3 * innerScale : 0,
        },
        logo: { width: 28 * innerScale, height: 12 * innerScale, objectFit: 'contain', marginBottom: 2 * innerScale },
        title: { fontSize: 7 * innerScale, fontWeight: 'bold', marginBottom: 1 * innerScale },
        sku: { fontSize: 5 * innerScale, color: '#444444' },
        price: { fontSize: 11 * innerScale, fontWeight: 'bold' },
        promoBadge: {
            backgroundColor: '#000000', color: '#ffffff', fontSize: 5 * innerScale,
            paddingHorizontal: 3 * innerScale, paddingVertical: 1 * innerScale,
            borderRadius: 1, marginTop: 2 * innerScale, fontWeight: 'bold'
        },
        extraNote: { fontSize: 4 * innerScale, color: '#777777', marginTop: 1 * innerScale },
        qrSection: {
            // PAREDES INVISIBLES: El QR ocupa exactamente este porcentaje y ni un pixel más
            width: !hasContent ? '100%' : (layout === 'qr-center' ? '30%' : '40%'),
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
        },
        qrImage: {
            // Se adapta al 100% de su propia caja sin desbordarse nunca
            width: '100%',
            height: '100%',
            objectFit: 'contain'
        }
    });

    const InfoContent = () => (
        <>
            {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
            {showName && <Text style={styles.title}>{productName}</Text>}
            {showSku && sku && <Text style={styles.sku}>CÓD: {sku}</Text>}
            {showPrice && <Text style={styles.price}>${price}</Text>}
            {promoText && <Text style={styles.promoBadge}>{promoText}</Text>}
            {extraNote && <Text style={styles.extraNote}>{extraNote}</Text>}
        </>
    );

    const QRContent = () => (
        <View style={styles.qrSection}>
            {qrCodeData && <Image src={qrCodeData} style={styles.qrImage} />}
        </View>
    );

    return (
        <Document>
            <Page size={[widthPt, heightPt]} style={styles.page}>
                {layout === 'qr-left' && (
                    <>
                        <QRContent />
                        {hasContent && <View style={styles.infoSection}><InfoContent /></View>}
                    </>
                )}

                {layout === 'qr-right' && (
                    <>
                        {hasContent && <View style={styles.infoSection}><InfoContent /></View>}
                        <QRContent />
                    </>
                )}

                {layout === 'qr-center' && (
                    <>
                        {hasContent && (
                            <View style={styles.leftSection}>
                                {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
                                {showName && <Text style={styles.title}>{productName}</Text>}
                                {showPrice && <Text style={styles.price}>${price}</Text>}
                            </View>
                        )}
                        <QRContent />
                        {hasContent && (
                            <View style={styles.rightSection}>
                                {showSku && sku && <Text style={styles.sku}>CÓD: {sku}</Text>}
                                {promoText && <Text style={styles.promoBadge}>{promoText}</Text>}
                                {extraNote && <Text style={styles.extraNote}>{extraNote}</Text>}
                            </View>
                        )}
                    </>
                )}
            </Page>
        </Document>
    );
}