// src/routes/clienteRoutes.js

const express = require('express');
const router = express.Router();
const {
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
    handleSubirIPFS,
    handleReactivarCliente,
    handleMintearNFT,
    handleVerNFT // Asegúrate de tener este handler si implementaste la reactivación
} = require('../controllers/clienteController');

// --- Rutas para el CRUD de Clientes en la Base de Datos (MySQL) ---
router.get('/', handleObtenerClientesDeDb);       // Obtener todos los clientes (para la lista principal)
router.post('/', handleCrearCliente);      // Crear un nuevo cliente (desde el formulario)
router.get('/:id', handleObtenerClienteDeDb);    // Obtener un solo cliente (para llenar el formulario de edición)
router.put('/:id', handleActualizarCliente);     // Actualizar un cliente (al guardar el formulario de edición)


// --- Rutas para Interacciones Específicas con la Blockchain ---
router.post('/registrar', handleRegistrarCliente);   // REGISTRAR BC
router.get('/validar/:id', handleObtenerCliente);      // VALIDAR BC (lee desde el contrato)
router.post('/eliminar', handleBorrarCliente);         // ELIMINAR (actualiza estado en BD y BC)
router.post('/reactivar', handleReactivarCliente);   // REACTIVAR (actualiza estado en BD y BC)


// --- Rutas para Pedidos y Pagos (Híbridas) ---
router.post('/pedidos/registrar', handleRegistrarPedidoPago);      // Registrar un nuevo pago (escribe en BD y BC)
router.get('/pedidos/historial/:idCliente', handleObtenerHistorial);  // Consultar historial desde la Blockchain
router.get('/pedidos/historial/db/:idCliente', handleObtenerHistorialDeDb); // Consultar historial desde la BD (para la validación)

// Nueva ruta para el puente IPFS
router.post('/ipfs/subir', handleSubirIPFS);  

// Lineas de NFT
router.post('/nft/mintear', handleMintearNFT);
router.get('/nft/:tokenId', handleVerNFT);

module.exports = router;