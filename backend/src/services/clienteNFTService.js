// backend/src/services/clienteNFTService.js

const { ethers } = require('ethers');
// 1. CORRECCIÓN: Importamos con los nombres estándar (asegúrate que en el otro archivo se llamen así)
const { contractABI, contractAddress } = require('./clienteNFTContract');
require('dotenv').config();

// Debug rápido al iniciar
console.log("🔍 CARGANDO SERVICIO NFT:");
console.log("-> Address:", contractAddress);
console.log("-> ¿ABI es Array?:", Array.isArray(contractABI));

class ClienteNFTService {

    // --- CONEXIÓN MAESTRA (La Única que usaremos) ---
    static async _getContractWithSigner() {
        
        // 1. Validación de seguridad
        if (!contractABI || !contractAddress) {
            throw new Error("❌ Error Fatal: Falta ABI o Address en clienteNFTContract.js");
        }

        // 2. AUTO-CORRECCIÓN DE ABI (El salvavidas)
        // Si por error importamos un objeto { contractABI: [...] }, lo arreglamos aquí.
        let finalABI = contractABI;

        if (!Array.isArray(contractABI)) {
            console.warn("⚠️ ALERTA: El ABI no es un array. Buscando corrección...");
            if (contractABI.contractABI && Array.isArray(contractABI.contractABI)) {
                finalABI = contractABI.contractABI;
            } else if (contractABI.abi && Array.isArray(contractABI.abi)) {
                finalABI = contractABI.abi;
            } else {
                throw new Error("❌ FORMATO DE ABI INVÁLIDO: Se requiere un Array [...]");
            }
            console.log("✅ ABI Corregido automáticamente.");
        }

        // 3. Conexión a Ganache
        const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
        
        // 4. Wallet del Admin (Para evitar error "Only Owner")
        const wallet = new ethers.Wallet(process.env.GANACHE_PRIVATE_KEY, provider);
        
        return new ethers.Contract(contractAddress, finalABI, wallet);
    }

    // --- MINTEAR NFT ---
static async mintNFT(destinatario, idCliente, nombre, cidPdf) {
        try {
            console.log(`\n--- Minteando NFT para Cliente ID: ${idCliente} ---`);
            
            const contract = await this._getContractWithSigner();

            // CORRECCIÓN Ethers v6: Usamos .runner en lugar de .signer
            const adminAddress = await contract.runner.getAddress(); 

            // Llamada al contrato
            const tx = await contract.mintearNFT(
                adminAddress,    // El admin recibe el NFT inicialmente
                Number(idCliente), 
                nombre,          
                cidPdf || "Sin PDF" 
            );

            console.log("Transacción enviada...", tx.hash);
            const receipt = await tx.wait();
            console.log("✅ NFT Confirmado en Bloque:", receipt.blockNumber);

            const tokenId = await contract.clienteToTokenId(idCliente);
            
            return { receipt, tokenId: tokenId.toString() };

        } catch (error) {
            console.error("Error al mintear NFT:", error);
            throw error;
        }
    }
    // --- VER METADATA ---
    static async getMetadata(tokenId) {
        try {
            console.log(`\n--- Leyendo NFT ID: ${tokenId} ---`);
            
            // Validación básica
            if (!tokenId || tokenId === 'null') throw new Error("Token ID inválido");

            // CORRECCIÓN: Usamos la función buena
            const contract = await this._getContractWithSigner();
            
            const data = await contract.verNFT(tokenId);
            const owner = await contract.ownerOf(tokenId);

            // Mapeo de datos (Struct -> JSON)
            return {
                tokenId: tokenId.toString(),
                idCliente: data[0].toString(), // idClienteRef
                nombre: data[1],               // nombre
                hashPdf: data[2],              // hashPdf
                timestamp: data[3].toString(), // timestamp
                owner: owner
            };
        } catch (error) {
            console.error("Error al leer NFT:", error);
            throw new Error("No se pudo leer el NFT. Puede que no exista.");
        }
    }

    // --- AUTO-RECUPERACIÓN ---
    static async obtenerTokenIdPorCliente(idCliente) {
        try {
            const contract = await this._getContractWithSigner();
            const tokenId = await contract.clienteToTokenId(idCliente);
            
            if (tokenId.toString() === "0") return null;
            return tokenId.toString();
        } catch (error) {
            return null; // Si falla, asumimos que no tiene NFT
        }
    }
}

module.exports = ClienteNFTService;