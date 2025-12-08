// src/config/blockchainConfig.js

// dirección de tu contrato desplegado en Ganache
const contractAddress = '0xF1950f4C81882e211798270f160Ae5f38646AE7F';

//Pega aquí el ABI de tu contrato
const contractABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "nombre",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "telefono",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "correo",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "direccion",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "tarjeta",
				"type": "string"
			}
		],
		"name": "actualizarCliente",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "activo",
				"type": "bool"
			}
		],
		"name": "actualizarEstado",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "borrarCliente",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "nombre",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "telefono",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "correo",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "direccion",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "tarjeta",
				"type": "string"
			}
		],
		"name": "registrarCliente",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "idCliente",
				"type": "uint256"
			},
			{
				"internalType": "bytes32",
				"name": "hashPedido",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "importe",
				"type": "uint256"
			}
		],
		"name": "registrarPedidoPago",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "clientes",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "nombre",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "telefono",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "correo",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "direccion",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "tarjeta",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "activo",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "historial",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "bytes32",
				"name": "hashPedido",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "importe",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "obtenerCliente",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "idCliente",
				"type": "uint256"
			}
		],
		"name": "obtenerHistorial",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "bytes32",
						"name": "hashPedido",
						"type": "bytes32"
					},
					{
						"internalType": "uint256",
						"name": "importe",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct DatosClientes.PedidoPago[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

module.exports = { contractAddress, contractABI };