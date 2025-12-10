// src/services/clienteBlockchainService.js

const { ethers } = require('ethers');
const { contractABI, contractAddress } = require('./clienteBlockchainContract');
require('dotenv').config();

class ClienteBlockchainService {

    // --- CONEXIÓN MAESTRA ---
    // Esta función conecta al contrato usando SIEMPRE la cuenta del Administrador (.env)
    // Esto evita el error "invalid account" o problemas de firma.
    static _getContractWithSigner() {
        // 1. Validar que tengamos configuración
        if (!contractABI || !contractAddress) {
            throw new Error("Falta configuración (ABI o Address) del contrato Blockchain.");
        }

        // 2. Conectar a Ganache
        const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
        
        // 3. Crear la Billetera del Servidor (Admin) usando la CLAVE PRIVADA
        // Esto es clave: El backend firma, no el usuario del frontend.
        const wallet = new ethers.Wallet(process.env.GANACHE_PRIVATE_KEY, provider);
        
        // 4. Retornar contrato conectado
        return new ethers.Contract(contractAddress, contractABI, wallet);
    }

    // --- ESCRITURA (Transacciones) ---

    static async registrarCliente(datosCliente) {
        const { id, nombre, telefono, correo, direccion, tarjeta } = datosCliente;
        console.log(`\n--- BC: Registrando Cliente ID ${id} ---`);
        
        try {
            const contract = this._getContractWithSigner();

            // Llamamos a la función del Smart Contract
            const tx = await contract.registrarCliente(
                Number(id),
                nombre,
                telefono,
                correo,
                direccion,
                tarjeta
            );

            // Esperamos confirmación
            const receipt = await tx.wait();
            console.log("Cliente registrado en BC. Hash:", receipt.hash);
            return receipt;

        } catch (error) {
            console.error("Error al registrar cliente en BC:", error);
            throw error;
        }
    }

    static async registrarPedidoPago(datosPedido) {
        // Nota: 'cuenta' ya no se usa para firmar, firma el admin.
        const { idCliente, hashPedido, importe } = datosPedido; 
        console.log(`\n--- BC: Registrando Pedido para Cliente ${idCliente} ---`);
        
        try {
            const contract = this._getContractWithSigner();

            // Usamos el nombre exacto de tu contrato Solidity: 'registrarPedidoPago'
            const tx = await contract.registrarPedidoPago(
                Number(idCliente),
                hashPedido,
                Number(importe)
            );

            const receipt = await tx.wait();
            console.log("Pedido registrado en BC. Hash:", receipt.hash);
            return receipt;

        } catch (error) {
            console.error("Error al registrar pedido en BC:", error);
            throw error;
        }
    }

    static async borrarCliente(datosBorrado) {
        const { id } = datosBorrado;
        console.log(`\n--- BC: Desactivando cliente ${id} ---`);
        try {
            const contract = this._getContractWithSigner();
            const tx = await contract.borrarCliente(Number(id));
            await tx.wait();
            return tx;
        } catch (error) {
            console.error("Error al borrar cliente BC:", error);
            throw error;
        }
    }

    static async reactivarCliente(datosReactivar) {
        const { id } = datosReactivar;
        console.log(`\n--- BC: Reactivando cliente ${id} ---`);
        try {
            const contract = this._getContractWithSigner();
            const tx = await contract.actualizarEstado(Number(id), true);
            await tx.wait();
            return tx;
        } catch (error) {
            console.error("Error al reactivar cliente BC:", error);
            throw error;
        }
    }

    // --- LECTURA (Consultas) ---

    static async obtenerHistorial(idCliente) {
        console.log(`\n--- BC: Consultando Historial Cliente ${idCliente} ---`);
        try {
            const contract = this._getContractWithSigner();

            // Llamamos a la función obtenerHistorial
            const historialRaw = await contract.obtenerHistorial(Number(idCliente));

            // Si devuelve vacío o null
            if (!historialRaw || historialRaw.length === 0) return [];

            // Mapeamos los datos (Struct Solidity -> JSON JS)
            const historialMapeado = historialRaw.map(pedido => ({
                id: pedido[0].toString(),       
                hashPedido: pedido[1],          
                importe: pedido[2].toString(),  
                timestamp: pedido[3].toString() 
            }));

            return historialMapeado;

        } catch (error) {
            console.error("Error al leer historial BC:", error);
            // Retornamos array vacío para que el frontend no explote
            return [];
        }
    }

    static async obtenerCliente(idCliente) {
        try {
            const contract = this._getContractWithSigner();
            const data = await contract.obtenerCliente(Number(idCliente));
            
            return {
                id: data[0].toString(),
                nombre: data[1],
                telefono: data[2],
                correo: data[3],
                direccion: data[4],
                tarjeta: data[5],
                activo: data[6]
            };
        } catch (error) {
            console.error("Error al leer cliente BC:", error);
            return null;
        }
    }
}

module.exports = ClienteBlockchainService;