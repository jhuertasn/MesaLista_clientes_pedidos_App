// backend/src/services/clienteNFTService.js

const { ethers } = require('ethers');
const { nftABI, nftAddress } = require('./clienteNFTContract');
require('dotenv').config();

class ClienteNFTService {

static getContract() {
        // --- AGREGA ESTAS 3 LÍNEAS PARA VER EL ERROR EN LA CARA ---
        console.log("DEBUG: Dirección del contrato:", nftAddress);
        console.log("DEBUG: Tipo de dato del ABI:", typeof nftABI);
        if (!nftABI) console.error("¡ALERTA! El ABI es undefined. Revisa el archivo de configuración.");
        // ----------------------------------------------------------

        const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
        const wallet = new ethers.Wallet(process.env.GANACHE_PRIVATE_KEY, provider);
        return new ethers.Contract(nftAddress, nftABI, wallet); // <--- Aquí explota porque nftABI es undefined
    }

    // --- MINTEAR (Igual que antes) ---
    static async mintNFT(destinatario, idCliente, nombre, cidPdf) {
        try {
            console.log(`\n--- Minteando NFT para Cliente ID: ${idCliente} ---`);
            const contract = this.getContract();

            const tx = await contract.mintearNFT(
                destinatario,
                Number(idCliente),
                nombre,
                cidPdf || "Sin PDF"
            );

            const receipt = await tx.wait();
            console.log("NFT minteado. Hash:", receipt.hash);

            // Recuperamos el ID recién creado
            const tokenId = await contract.clienteToTokenId(idCliente);
            
            return { receipt, tokenId: tokenId.toString() };
        } catch (error) {
            console.error("Error al mintear NFT:", error);
            throw error;
        }
    }

    // --- VER DATOS (Aquí aplicamos la corrección del Profesor) ---
    static async getMetadata(tokenId) {
        try {
            console.log(`\n--- Leyendo Metadata del Token ID: ${tokenId} ---`);
            const contract = this.getContract();
            
            // 1. Validar que el tokenId sea un número válido
            if (!tokenId || tokenId === 'undefined' || tokenId === 'null') {
                throw new Error("Token ID inválido proporcionado al servicio");
            }

            // 2. Llamada al contrato (Lectura por índices para evitar errores de Struct)
            const data = await contract.verNFT(tokenId);
            const owner = await contract.ownerOf(tokenId);

            console.log("Datos crudos recuperados:", data);

            // 3. Mapeo seguro (El profesor usa toString() para evitar BigInt errors)
            return {
                tokenId: tokenId.toString(),
                idCliente: data[0].toString(), // idClienteRef (Índice 0)
                nombre: data[1],               // nombre (Índice 1)
                hashPdf: data[2],              // hashPdf (Índice 2)
                timestamp: data[3].toString(), // timestamp (Índice 3)
                owner: owner
            };
        } catch (error) {
            console.error("Error crítico en getMetadata:", error);
            // Lanzamos un error limpio para que el controlador lo entienda
            throw new Error("No se pudo leer el NFT. Verifique que el Token ID exista.");
        }
    }

    // Función auxiliar para tu "Auto-Recuperación"
    static async obtenerTokenIdPorCliente(idCliente) {
        try {
            const contract = this.getContract();
            const tokenId = await contract.clienteToTokenId(idCliente);
            if (tokenId.toString() === "0") return null;
            return tokenId.toString();
        } catch (error) {
            return null;
        }
    }
}

module.exports = ClienteNFTService;