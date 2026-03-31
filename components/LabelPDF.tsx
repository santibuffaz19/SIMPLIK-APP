import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const MM_TO_PT = 2.83465;

export default function LabelPDF({
    productName, price, sku, qrCodeData, widthMm, heightMm, layout,
    showPrice, showSku, showName, logoBase64, promoText, extraNote
}: any) {
    const widthPt = widthMm * MM_TO_PT;
    const heightPt = heightMm * MM_TO_PT;

    const hasContent = showName || showPrice || showSku || logoBase64 || promoText || extraNote;

    const styles = StyleSheet.create({
        page: {
            width: widthPt, height: heightPt,
            flexDirection: 'row',
            backgroundColor: '#ffffff',
            alignItems: 'center',
            // CORRECCIÓN: Si no hay contenido, el contenedor padre también respeta el layout
            justifyContent: !hasContent
                ? (layout === 'qr-left' ? 'flex-start' : (layout === 'qr-right' ? 'flex-end' : 'center'))
                : 'center',
            padding: 6,
        },
        leftSection: {
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            display: layout === 'qr-center' && hasContent ? 'flex' : 'none',
        },
        rightSection: {
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-end',
            display: layout === 'qr-center' && hasContent ? 'flex' : 'none',
        },
        infoSection: {
            flex: 1,
            display: layout !== 'qr-center' && hasContent ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: layout === 'qr-right' ? 'flex-start' : 'flex-end',
            width: '100%',
        },
        logo: { width: 28, height: 12, objectFit: 'contain', marginBottom: 2 },
        title: { fontSize: 7, fontWeight: 'bold', marginBottom: 1 },
        sku: { fontSize: 5, color: '#444444' },
        price: { fontSize: 11, fontWeight: 'bold' },
        promoBadge: {
            backgroundColor: '#000000', color: '#ffffff', fontSize: 5,
            padding: '1 3', borderRadius: 1, marginTop: 2, fontWeight: 'bold'
        },
        extraNote: { fontSize: 4, color: '#777777', marginTop: 1 },
        qrSection: {
            // CORRECCIÓN: Ajuste de ancho cuando está solo para que no flote en el medio
            width: !hasContent ? 'auto' : (layout === 'qr-center' ? '30%' : '42%'),
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: !hasContent ? 10 : 0
        },
        qrImage: {
            width: !hasContent ? heightPt * 0.8 : (layout === 'qr-center' ? heightPt * 0.6 : heightPt * 0.7),
            height: !hasContent ? heightPt * 0.8 : (layout === 'qr-center' ? heightPt * 0.6 : heightPt * 0.7),
        }
    });

    return (
        <Document>
            <Page size={[widthPt, heightPt]} style={styles.page}>
                {layout === 'qr-center' && hasContent && (
                    <View style={styles.leftSection}>
                        {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
                        {showName && <Text style={styles.title}>{productName}</Text>}
                        {showSku && sku && <Text style={styles.sku}>CÓD: {sku}</Text>}
                        {showPrice && <Text style={styles.price}>${price}</Text>}
                    </View>
                )}

                {layout !== 'qr-center' && hasContent && (
                    <View style={layout === 'qr-right' ? { order: 1, ...styles.infoSection } : { order: 2, ...styles.infoSection }}>
                        {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
                        {showName && <Text style={styles.title}>{productName}</Text>}
                        {showSku && sku && <Text style={styles.sku}>CÓD: {sku}</Text>}
                        {showPrice && <Text style={styles.price}>${price}</Text>}
                        {promoText && <Text style={styles.promoBadge}>{promoText}</Text>}
                        {extraNote && <Text style={styles.extraNote}>{extraNote}</Text>}
                    </View>
                )}

                <View style={{ order: layout === 'qr-left' ? 1 : (layout === 'qr-right' ? 2 : 1.5), ...styles.qrSection }}>
                    {qrCodeData && <Image src={qrCodeData} style={styles.qrImage} />}
                </View>

                {layout === 'qr-center' && hasContent && (
                    <View style={styles.rightSection}>
                        {promoText && <Text style={styles.promoBadge}>{promoText}</Text>}
                        {extraNote && <Text style={styles.extraNote}>{extraNote}</Text>}
                    </View>
                )}
            </Page>
        </Document>
    );
}