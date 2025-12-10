// src/controllers/clienteController.js
const axios = require('axios');
const FormData = require('form-data');
const ClienteNFTService = require('../services/clienteNFTService');
const ClientePdfService = require('../services/clientePdfService');
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

        if (!id) return res.status(400).json({ success: false, message: "Falta ID" });

        // 1. VERIFICAR SI YA EXISTE
        const clienteDb = await ClienteDbService.obtenerClientePorId(id);
        if (clienteDb && clienteDb.cid_pdf) {
            console.log(`Cliente ${id} ya tiene PDF. CID: ${clienteDb.cid_pdf}`);
            return res.status(200).json({ success: true, cid: clienteDb.cid_pdf });
        }

        // 2. GENERAR PDF (Usando el nuevo servicio)
        console.log("Generando PDF nuevo...");
        const pdfBuffer = await ClientePdfService.generarPDF({ id, nombre, telefono, correo });

        // 3. SUBIR A IPFS
        const form = new FormData();
        form.append('file', pdfBuffer, { filename: `reporte_${id}.pdf`, contentType: 'application/pdf' });

        const response = await axios.post('http://127.0.0.1:5001/api/v0/add', form, {
            headers: { ...form.getHeaders() }
        });

        const cid = response.data.Hash;

        // 4. GUARDAR EN BD
        await ClienteDbService.actualizarCidPdf(id, cid);
        console.log(`PDF subido a IPFS y guardado. CID: ${cid}`);

        res.status(200).json({ success: true, cid: cid });

    } catch (error) {
        console.error("Error en proceso PDF/IPFS:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- NUEVOS HANDLERS NFT ---
const handleMintearNFT = async (req, res) => {
    try {
        const { id, nombre, cuenta, cid_pdf } = req.body;
        
        if (!cid_pdf) return res.status(400).json({ success: false, message: "Falta PDF" });

        let tokenId;
        let txHash = "Ya existía en Blockchain"; // Mensaje por defecto si recuperamos

        try {
            // Intento 1: Mintear normal
            const result = await ClienteNFTService.mintNFT(cuenta, id, nombre, cid_pdf);
            tokenId = result.tokenId;
            txHash = result.receipt.hash;

        } catch (error) {
            // Si falla, verificamos si es porque "Ya existe"
            console.warn("Minteo falló, intentando recuperar...", error.message);
            
            // Consultamos a la blockchain si este cliente ya tiene token
            tokenId = await ClienteNFTService.obtenerTokenIdPorCliente(id);

            if (!tokenId) {
                // Si no tiene token y falló, entonces es un error real
                throw error; 
            }
            console.log(`Recuperado Token ID ${tokenId} de la blockchain.`);
        }

        // 2. Guardar en BD (Sea nuevo o recuperado)
        await ClienteDbService.actualizarTokenId(id, tokenId);

        res.status(200).json({ success: true, tokenId: tokenId, txHash: txHash });

    } catch (error) {
        console.error(error);
        // Mejoramos el mensaje de error para el frontend
        const msg = error.info?.error?.message || error.message;
        res.status(500).json({ success: false, message: "Error Blockchain: " + msg });
    }
};

const handleVerNFT = async (req, res) => {
    try {
        const data = await ClienteNFTService.getMetadata(req.params.tokenId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al leer NFT" });
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
    handleSubirIPFS,
    handleMintearNFT,
    handleVerNFT
};