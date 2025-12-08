// src/controllers/clienteController.js
const axios = require('axios');
const FormData = require('form-data');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const ClienteBlockchainService = require('../services/clienteBlockchainService');
const ClienteDbService = require('../services/clienteDbService');
const PedidoDbService = require('../services/pedidoDbService');

// --- Handlers para la Base de Datos (CRUD) ---

const handleObtenerClientesDeDb = async (req, res) => {
    try {
        const clientes = await ClienteDbService.obtenerTodosLosClientes();
        res.status(200).json({ success: true, data: clientes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const handleObtenerClienteDeDb = async (req, res) => {
    try {
        const cliente = await ClienteDbService.obtenerClientePorId(req.params.id);
        if (cliente) {
            res.status(200).json({ success: true, data: cliente });
        } else {
            res.status(404).json({ success: false, message: 'Cliente no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const handleCrearCliente = async (req, res) => {
    try {
        const nuevoCliente = await ClienteDbService.crearCliente(req.body);
        res.status(201).json({ success: true, data: nuevoCliente });
    } catch (error) {
        console.error("ERROR DETALLADO AL CREAR CLIENTE:", error); // <--- AÑADE ESTA LÍNEA
        res.status(500).json({ success: false, message: error.message });
    }
};

const handleActualizarCliente = async (req, res) => {
    try {
        const clienteActualizado = await ClienteDbService.actualizarCliente(req.params.id, req.body);
        res.status(200).json({ success: true, data: clienteActualizado });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Handlers para la Blockchain ---

const handleRegistrarCliente = async (req, res) => {
    try {
        const { id, cuenta } = req.body; // Necesitamos el ID y la cuenta

        // 1. Registrar en la Blockchain
        const receipt = await ClienteBlockchainService.registrarCliente(req.body);

        // 2. (NUEVO) Guardar la cuenta usada en la Base de Datos
        await ClienteDbService.actualizarBlockchainAddress(id, cuenta);

        res.status(200).json({ success: true, txHash: receipt.hash });
    } catch (error) {
        console.error("ERROR DETALLADO AL REGISTRAR CLIENTE EN BC:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const handleObtenerCliente = async (req, res) => {
    try {
        const idCliente = req.params.id;
        const cuenta = req.query.cuenta; // <-- Leemos la cuenta desde la URL
        const cliente = await ClienteBlockchainService.obtenerCliente(idCliente, cuenta); // <-- Se la pasamos al servicio
        res.status(200).json({ success: true, data: cliente });
    } catch (error) {
        // ... el catch se queda igual
    }
};

const handleBorrarCliente = async (req, res) => {
    try {
        const { id, cuenta } = req.body;
        // Paso 1: Realizar soft delete en la base de datos MySQL
        await ClienteDbService.desactivarCliente(id);
        // Paso 2: Registrar el cambio en la Blockchain
        const receipt = await ClienteBlockchainService.borrarCliente({ id, cuenta });
        res.status(200).json({ success: true, txHash: receipt.hash });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const handleRegistrarPedidoPago = async (req, res) => {
    try {
        // 1. Registrar el pedido en la base de datos MySQL (sin el hash aún)
        const dbResult = await PedidoDbService.registrarPedidoEnDb(req.body);
        const nuevoPedidoId = dbResult.insertId;

        // 2. Generar el Hash a partir de los datos del pedido (Se cumplio requisiro AA4)
        const datosParaHash = `${nuevoPedidoId}-${req.body.idCliente}-${req.body.importe}`;
        const hashPedido = '0x' + crypto.createHash('sha256').update(datosParaHash).digest('hex');
        console.log(`Hash generado para el pedido ${nuevoPedidoId}: ${hashPedido}`);

        // 3. Registrar la transacción en la Blockchain con el hash
        const datosBlockchain = { ...req.body, hashPedido: hashPedido };
        const receipt = await ClienteBlockchainService.registrarPedidoPago(datosBlockchain);
        
        // 4. (NUEVO) Actualizar la fila en la BD con el hash que se usó en la Blockchain
        await PedidoDbService.actualizarHashPedido(nuevoPedidoId, hashPedido);

        // 5. Enviar respuesta exitosa
        res.status(200).json({ success: true, txHash: receipt.hash });
    } catch (error) {
        console.error("ERROR DETALLADO AL REGISTRAR PAGO:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const handleObtenerHistorial = async (req, res) => {
    try {
        const idCliente = req.params.idCliente;
        const cuenta = req.query.cuenta; // <-- Lee la cuenta desde la URL
        const historial = await ClienteBlockchainService.obtenerHistorial(idCliente, cuenta); // <-- Pásala al servicio
        res.status(200).json({ success: true, data: historial });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// NUEVO HANDLER para el historial de la BD
const handleObtenerHistorialDeDb = async (req, res) => {
    try {
        const historial = await PedidoDbService.obtenerHistorialPorClienteId(req.params.idCliente);
        res.status(200).json({ success: true, data: historial });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ASEGÚRATE DE TENER ESTE HANDLER
const handleReactivarCliente = async (req, res) => {
    try {
        const { id, cuenta } = req.body;
        // 1. Reactivar en la base de datos
        await ClienteDbService.reactivarCliente(id);
        // 2. Reactivar en la blockchain
        const receipt = await ClienteBlockchainService.reactivarCliente({ id, cuenta });
        res.status(200).json({ success: true, txHash: receipt.hash });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- NUEVO HANDLER PARA SUBIR A IPFS (PUENTE) ---
const handleSubirIPFS = async (req, res) => {
    try {
        const { id, nombre, telefono, correo } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: "Falta ID del cliente" });
        }

        // 1. VERIFICAR SI YA EXISTE EL PDF
        const clienteDb = await ClienteDbService.obtenerClientePorId(id);
        
        if (clienteDb && clienteDb.cid_pdf) {
            console.log(`Cliente ${id} ya tiene PDF. CID recuperado: ${clienteDb.cid_pdf}`);
            return res.status(200).json({ success: true, cid: clienteDb.cid_pdf });
        }

        // 2. SI NO EXISTE, LO GENERAMOS (Lógica que ya tenías)
        const doc = new PDFDocument();
        let buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(buffers);

            try {
                const form = new FormData();
                form.append('file', pdfBuffer, { filename: `reporte_${id}.pdf`, contentType: 'application/pdf' });

                const response = await axios.post('http://127.0.0.1:5001/api/v0/add', form, {
                    headers: { ...form.getHeaders() }
                });

                const cid = response.data.Hash;
                
                // 3. ¡GUARDAR EL CID EN LA BD! (El paso nuevo)
                await ClienteDbService.actualizarCidPdf(id, cid);
                console.log(`Nuevo PDF generado y guardado en BD. CID: ${cid}`);

                return res.status(200).json({ success: true, cid: cid });

            } catch (ipfsError) {
                console.error("Error IPFS:", ipfsError);
                return res.status(500).json({ success: false, message: "Error IPFS" });
            }
        });

// --- DISEÑO DEL PDF COMPLETO ---
        // Encabezado
        doc.fontSize(20).fillColor('#E67E22').text('MesaLista - Reporte de Cliente', { align: 'center' });
        doc.moveDown();
        
        // Línea separadora
        doc.moveTo(50, 100).lineTo(550, 100).strokeColor('#aaaaaa').stroke();
        doc.moveDown();

        // Datos del Cliente
        doc.fontSize(14).fillColor('black').text('Detalles del Cliente:', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(12).fillColor('black');
        doc.text(`ID del Cliente: ${id}`);
        doc.moveDown(0.5);
        doc.text(`Nombre Completo: ${nombre}`);
        doc.moveDown(0.5);
        doc.text(`Teléfono: ${telefono}`);
        doc.moveDown(0.5);
        doc.text(`Correo Electrónico: ${correo}`);
        
        // Pie de página
        doc.moveDown(4);
        doc.fontSize(10).fillColor('gray').text('Documento generado y respaldado en IPFS.', { align: 'center' });
        doc.text(`Fecha de emisión: ${new Date().toLocaleString()}`, { align: 'center' });
        
        // Finalizar el PDF
        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error servidor" });
    }
};

module.exports = {
    handleObtenerClientesDeDb,
    handleCrearCliente,
    handleObtenerClienteDeDb,
    handleActualizarCliente,
    handleRegistrarCliente,
    handleObtenerCliente,
    handleBorrarCliente,
    handleRegistrarPedidoPago,
    handleObtenerHistorial,
    handleObtenerHistorialDeDb,
    handleReactivarCliente,
    handleSubirIPFS
};