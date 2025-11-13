// src/controllers/clienteController.js

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

        // 2. Generar el Hash a partir de los datos del pedido
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
    handleReactivarCliente
};