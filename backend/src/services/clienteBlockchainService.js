// src/services/clienteBlockchainService.js

const { ethers } = require('ethers'); // Importamos ethers en lugar de web3
const { contractAddress, contractABI } = require('../config/blockchainConfig');

// 1. Creamos un "Proveedor" para conectarnos a Ganache
// Lee la URL de tu archivo .env
const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);

// 2. Creamos una instancia del contrato (esta es de solo lectura)
const contract = new ethers.Contract(contractAddress, contractABI, provider);

class ClienteBlockchainService {

    // Esta es una función auxiliar para obtener un contrato "con firma"
    // Ethers separa "leer" de "escribir". Para escribir, necesitas un "Signer".
    static async _getContractWithSigner(cuenta) {
        // Obtenemos el "firmante" (signer) desde Ganache para la cuenta que nos dio el frontend
        const signer = await provider.getSigner(cuenta);
        // Conectamos ese firmante al contrato
        return contract.connect(signer);
    }

    // --- FUNCIONES DE ESCRITURA (send) ---

    static async registrarCliente(datosCliente) {
        const { cuenta, id, nombre, telefono, correo, direccion, tarjeta } = datosCliente;
        console.log(`Intentando registrar cliente ${id} en BC desde ${cuenta}`);
        try {
            // Obtenemos el contrato listo para firmar y escribir
            const contractWithSigner = await this._getContractWithSigner(cuenta);

            // La sintaxis de Ethers es más directa
            const tx = await contractWithSigner.registrarCliente(
                id, nombre, telefono, correo, direccion, tarjeta
            );
            // Esperamos a que la transacción se mine
            const receipt = await tx.wait();
            return receipt;
        } catch (error) {
            console.error("Error en registrarCliente Service (ethers):", error);
            throw error;
        }
    }

    static async registrarPedidoPago(datosPedido) {
        const { cuenta, idCliente, hashPedido, importe } = datosPedido;
        console.log(`Registrando pedido para cliente ${idCliente} desde ${cuenta}`);
        try {
            const contractWithSigner = await this._getContractWithSigner(cuenta);
            const tx = await contractWithSigner.registrarPedidoPago(
                idCliente, hashPedido, importe
            );
            const receipt = await tx.wait();
            return receipt;
        } catch (error) {
            console.error("Error en registrarPedidoPago Service (ethers):", error);
            throw error;
        }
    }

    static async borrarCliente(datosBorrado) {
        const { cuenta, id } = datosBorrado;
        console.log(`Intentando desactivar cliente ${id} desde ${cuenta}`);
        try {
            const contractWithSigner = await this._getContractWithSigner(cuenta);
            const tx = await contractWithSigner.borrarCliente(id);
            const receipt = await tx.wait();
            return receipt;
        } catch (error) {
            console.error("Error en borrarCliente Service (ethers):", error);
            throw error;
        }
    }

    static async reactivarCliente(datosReactivar) {
        const { cuenta, id } = datosReactivar;
        console.log(`Intentando reactivar al cliente ${id} desde ${cuenta}`);
        try {
            const contractWithSigner = await this._getContractWithSigner(cuenta);
            const tx = await contractWithSigner.actualizarEstado(id, true);
            const receipt = await tx.wait();
            return receipt;
        } catch (error) {
            console.error("Error en reactivarCliente Service (ethers):", error);
            throw error;
        }
    }

    // --- FUNCIONES DE LECTURA (call) ---
    // Para leer datos, usamos la instancia de contrato normal (sin firmante)

    static async obtenerCliente(idCliente, cuenta) {
        console.log(`Obteniendo cliente con ID ${idCliente} (leído por ${cuenta})`);
        try {
            // La sintaxis de Ethers para leer es más simple
            const clienteData = await contract.obtenerCliente(idCliente);
            return {
                id: clienteData[0],
                nombre: clienteData[1],
                telefono: clienteData[2],
                correo: clienteData[3],
                direccion: clienteData[4],
                tarjeta: clienteData[5],
                activo: clienteData[6]
            };
        } catch (error) {
            console.error("Error en obtenerCliente Service (ethers):", error);
            throw error;
        }
    }

    static async obtenerHistorial(idCliente, cuenta) {
        console.log(`Obteniendo historial para cliente ${idCliente} (leído por ${cuenta})`);
        try {
            // 1. Obtenemos el "array de arrays" crudo de la blockchain
            const rawHistorial = await contract.obtenerHistorial(idCliente);

            // 2. Lo mapeamos a un array de objetos JSON que el frontend entienda
            const historialFormateado = rawHistorial.map(pago => {
                return {
                    id: pago[0], // Accedemos por índice
                    hashPedido: pago[1],
                    importe: pago[2],
                    timestamp: pago[3]
                };
            });

            return historialFormateado; // Devolvemos el array de objetos formateado
        } catch (error) {
            console.error("Error en obtenerHistorial Service (ethers):", error);
            throw error;
        }
    }
}

module.exports = ClienteBlockchainService;