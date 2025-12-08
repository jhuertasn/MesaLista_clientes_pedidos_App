// src/services/clienteDbService.js

const pool = require('../db/db');

class ClienteDbService {
    // Obtiene solo los clientes activos e inactivos para mostrar en la lista principal
static async obtenerTodosLosClientes() {
    // Quitamos el filtro para obtener TODOS los clientes (activos e inactivos)
    const [rows] = await pool.query('SELECT id, nombre, telefono, correo, direccion, tarjeta, activo FROM clientes');
    return rows;
}

    // Obtiene un solo cliente por su ID (para el formulario de edición)
    static async obtenerClientePorId(id) {
        const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
        return rows[0];
    }

    // Crea un nuevo cliente en la base de datos
static async crearCliente(cliente) {
    // Ahora obtenemos 'documento' directamente del objeto cliente que viene del formulario
    const { nombre, telefono, correo, direccion, tarjeta, documento } = cliente;

    const [result] = await pool.query(
        'INSERT INTO clientes (nombre, telefono, correo, direccion, tarjeta, activo, documento) VALUES (?, ?, ?, ?, ?, TRUE, ?)',
        [nombre, telefono, correo, direccion, tarjeta, documento] // Usamos la variable 'documento'
    );
    return { id: result.insertId, ...cliente };
}

    // Actualiza un cliente existente en la base de datos
    static async actualizarCliente(id, cliente) {
        const { nombre, telefono, correo, direccion, tarjeta } = cliente;
        await pool.query(
            'UPDATE clientes SET nombre = ?, telefono = ?, correo = ?, direccion = ?, tarjeta = ? WHERE id = ?',
            [nombre, telefono, correo, direccion, tarjeta, id]
        );
        return { id, ...cliente };
    }


    // Reactiva un cliente existente en la base de datos
    static async reactivarCliente(id) {
        await pool.query('UPDATE clientes SET activo = TRUE WHERE id = ?', [id]);
        console.log(`Cliente con ID ${id} reactivado en la base de datos.`);
    }

    // Realiza el borrado lógico (soft delete) en la base de datos
    static async desactivarCliente(id) {
        await pool.query('UPDATE clientes SET activo = FALSE WHERE id = ?', [id]);
        console.log(`Cliente con ID ${id} desactivado en la base de datos.`);
    }

    // NUEVA FUNCIÓN para guardar la dirección de registro
    static async actualizarBlockchainAddress(id, direccion) {
    await pool.query('UPDATE clientes SET blockchain_address = ? WHERE id = ?', [direccion, id]);
    console.log(`Dirección de blockchain actualizada para el cliente ID ${id}`);
}

static async actualizarCidPdf(id, cid) {
        const query = 'UPDATE clientes SET cid_pdf = ? WHERE id = ?';
        // Asegúrate de usar 'db' aquí, igual que en el require de arriba
        const [result] = await pool.execute(query, [cid, id]); 
        return result;
    }

}

module.exports = ClienteDbService;