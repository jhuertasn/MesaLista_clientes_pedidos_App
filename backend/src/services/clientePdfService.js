// backend/src/services/clientePdfService.js

const PDFDocument = require('pdfkit');

class ClientePdfService {

    static generarPDF(datosCliente) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                let buffers = [];

                // Capturamos los datos en memoria
                doc.on('data', buffers.push.bind(buffers));
                
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer); // Devolvemos el archivo listo
                });

                doc.on('error', (err) => {
                    reject(err);
                });

                // --- TU DISEÑO DEL PDF ---
                // Encabezado
                doc.fontSize(20).fillColor('#E67E22').text('MesaLista - Reporte de Cliente', { align: 'center' });
                doc.moveDown();
                
                // Línea separadora
                doc.moveTo(50, 100).lineTo(550, 100).strokeColor('#aaaaaa').stroke();
                doc.moveDown();

                // Datos
                doc.fontSize(14).fillColor('black').text('Detalles del Cliente:', { underline: true });
                doc.moveDown(0.5);
                
                doc.fontSize(12).fillColor('black');
                doc.text(`ID del Cliente: ${datosCliente.id}`);
                doc.moveDown(0.5);
                doc.text(`Nombre Completo: ${datosCliente.nombre}`);
                doc.moveDown(0.5);
                doc.text(`Teléfono: ${datosCliente.telefono}`);
                doc.moveDown(0.5);
                doc.text(`Correo Electrónico: ${datosCliente.correo}`);
                
                // Pie de página
                doc.moveDown(4);
                doc.fontSize(10).fillColor('gray').text('Documento generado y respaldado en IPFS.', { align: 'center' });
                doc.text(`Fecha de emisión: ${new Date().toLocaleString()}`, { align: 'center' });
                
                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = ClientePdfService;