// La URL base de tu API del backend
const API_URL = 'http://localhost:3000/api/clientes';

// --- VARIABLES GLOBALES PARA PAGINACIÓN ---
let todosLosClientes = [];
let paginaActual = 1;
const filasPorPagina = 10;

// --- INICIO DE LA APLICACIÓN ---
window.onload = function () {
    cargarClientesDesdeDB();
};

function nuevo() {
    window.location.href = 'clientes-form.html';
}

function editar(id) {
    window.location.href = `clientes-form.html?id=${id}`;
}

async function cargarClientesDesdeDB() {
    const tableBody = document.getElementById('client-table-body');
    tableBody.innerHTML = '<tr><td colspan="4">Cargando clientes...</td></tr>';
    try {
        const response = await axios.get(API_URL);
        todosLosClientes = response.data.data;
        mostrarPagina(1);
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        tableBody.innerHTML = '<tr><td colspan="4">Error al cargar los clientes.</td></tr>';
    }
}

function mostrarPagina(pagina) {
    const tableBody = document.getElementById('client-table-body');
    tableBody.innerHTML = '';
    paginaActual = pagina;
    const inicio = (pagina - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    const clientesPaginados = todosLosClientes.slice(inicio, fin);

    clientesPaginados.forEach(cliente => {
        const row = document.createElement('tr');
        
        if (cliente.activo === 0) row.classList.add('table-secondary', 'text-muted');
        
        Object.keys(cliente).forEach(key => {
            row.setAttribute(`data-${key}`, cliente[key]);
        });

        // Preparamos el ID del token (si es null, pasamos 'null' texto para controlarlo)
        const tokenIdSafe = cliente.nft_token_id ? cliente.nft_token_id : 'null';

        let botones = '';
        if (cliente.activo === 1) {
            botones = `
                <button class="btn btn-sm btn-outline-info" title="Editar" onclick="editar(${cliente.id})">✏️</button>
                <button class="btn btn-sm btn-success" onclick="registrarCliente(this)">REGISTRAR BC</button>
                <button class="btn btn-sm btn-warning" onclick="validarCliente(${cliente.id})">VALIDAR BC</button>
                <button class="btn btn-sm btn-secondary" onclick="generarYSubirPDF('${cliente.id}', '${cliente.nombre}', '${cliente.telefono}', '${cliente.correo}')">📄 PDF</button>
                
                <button class="btn btn-sm btn-primary" onclick="mintearNFT('${cliente.id}', '${cliente.nombre}', '${cliente.cid_pdf}')">MINTEAR NFT</button>
                <button class="btn btn-sm btn-info" onclick="verNFT(${tokenIdSafe})">VER NFT</button>

                <button class="btn btn-sm btn-danger" title="Eliminar" onclick="eliminarCliente(${cliente.id})">🗑️</button>
            `;
        } else {
            botones = `
                <button class="btn btn-sm btn-primary" onclick="reactivarCliente(${cliente.id})">REACTIVAR</button>
                <button class="btn btn-sm btn-warning" onclick="validarCliente(${cliente.id})">VALIDAR BC</button>
            `;
        }
        
        row.innerHTML = `<td>${cliente.id}</td><td>${cliente.nombre}</td><td>${cliente.telefono}</td><td>${botones}</td>`;
        tableBody.appendChild(row);
    });
    
    configurarControlesPaginacion();
}

function configurarControlesPaginacion() {
    const paginationControls = document.getElementById('pagination-controls');
    paginationControls.innerHTML = '';
    const totalPaginas = Math.ceil(todosLosClientes.length / filasPorPagina);
    if (totalPaginas <= 1) return;

    const liPrev = document.createElement('li');
    liPrev.className = `page-item ${paginaActual === 1 ? 'disabled' : ''}`;
    liPrev.innerHTML = `<a class="page-link" href="#" onclick="mostrarPagina(${paginaActual - 1})">Anterior</a>`;
    paginationControls.appendChild(liPrev);

    for (let i = 1; i <= totalPaginas; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === paginaActual ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="mostrarPagina(${i})">${i}</a>`;
        paginationControls.appendChild(li);
    }

    const liNext = document.createElement('li');
    liNext.className = `page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`;
    liNext.innerHTML = `<a class="page-link" href="#" onclick="mostrarPagina(${paginaActual + 1})">Siguiente</a>`;
    paginationControls.appendChild(liNext);
}

async function obtenerCuenta() {
    // 1. Revisa si MetaMask está instalado
    if (typeof window.ethereum === 'undefined') {
        Swal.fire('Error', 'MetaMask no está instalado. Por favor, instala la extensión para continuar.', 'error');
        return null;
    }

    try {
        // 2. Solicita al usuario que conecte su billetera
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // 3. Devuelve la primera cuenta conectada
        if (accounts.length > 0) {
            const cuenta = accounts[0];

            // --- AQUÍ ES EL LUGAR CORRECTO PARA ACTUALIZAR EL HTML ---
            // Solo intentamos actualizar si el elemento existe en el HTML
            const visualizadorCuenta = document.getElementById('wallet-address');
            if (visualizadorCuenta) {
                visualizadorCuenta.innerText = cuenta.substring(0, 6) + '...' + cuenta.substring(38);
                visualizadorCuenta.style.color = '#e67e22'; // Naranja
                visualizadorCuenta.style.fontWeight = 'bold';
            }
            // ---------------------------------------------------------

            return cuenta; 
        } else {
            Swal.fire('Advertencia', 'No se autorizó ninguna cuenta.', 'warning');
            return null;
        }
    } catch (error) {
        console.error("Error al conectar con MetaMask:", error);
        Swal.fire('Error', 'El usuario rechazó la conexión.', 'error');
        return null;
    }
}

async function registrarCliente(button) {
    const fila = button.closest('tr');
    const cliente = {
        id: fila.getAttribute('data-id'),
        nombre: fila.getAttribute('data-nombre'),
        telefono: fila.getAttribute('data-telefono'),
        correo: fila.getAttribute('data-correo'),
        direccion: fila.getAttribute('data-direccion'),
        tarjeta: fila.getAttribute('data-tarjeta')
    };
    
    const cuenta = await obtenerCuenta();
    if (!cuenta) return;
    
    Swal.fire({ title: 'Registrando en Blockchain...', text: 'Firmando transacción...', didOpen: () => Swal.showLoading() });
    
    try {
        const response = await axios.post(`${API_URL}/registrar`, { ...cliente, cuenta });
        
        // --- CAMBIO: Mostrar Hash en la alerta ---
        const txHash = response.data.txHash;
        
        Swal.fire({
            title: '¡Registro Exitoso!',
            html: `
                <p>El cliente se ha guardado en la Blockchain.</p>
                <p><strong>Hash de Transacción:</strong></p>
                <small style="font-family: monospace; color: #28a745;">${txHash}</small>
            `,
            icon: 'success'
        });
        
        // Recargar tabla para actualizar estado
        cargarClientesDesdeDB();
        
    } catch (error) {
        Swal.fire('Error', error.response?.data?.message || error.message, 'error');
    }
}

async function validarCliente(clienteId) {
    const cuentaValidacion = await obtenerCuenta(); // La cuenta que el usuario ingresa AHORA
    if (!cuentaValidacion) return;

    Swal.fire({ title: 'Validando contra la Blockchain...', didOpen: () => Swal.showLoading() });

    try {
        // --- PASO 1: OBTENER DATOS DE LA BD (INCLUYENDO DIRECCIÓN ORIGINAL) ---
        // Usamos el endpoint que obtiene un solo cliente de la BD
        const responseDB = await axios.get(`${API_URL}/${clienteId}`);
        const clienteDB = responseDB.data.data;

        // Extraemos la dirección original guardada al registrar
        const direccionOriginal = clienteDB.blockchain_address;

        // --- PASO 2: PRIMERA VALIDACIÓN: ¿Coincide la cuenta ingresada con la original? ---
        if (!direccionOriginal || cuentaValidacion.toLowerCase() !== direccionOriginal.toLowerCase()) {
            Swal.fire({
                title: '¡Cuenta Inválida!',
                text: 'La cuenta ingresada no coincide con la que registró originalmente a este cliente en la blockchain.',
                icon: 'warning'
            });
            return; // Detenemos la validación aquí
        }

        // --- PASO 3: SI LA CUENTA COINCIDE, VALIDAMOS LOS DATOS CONTRA LA BLOCKCHAIN ---
        const responseBC = await axios.get(`${API_URL}/validar/${clienteId}?cuenta=${cuentaValidacion}`);
        const clienteBC = responseBC.data.data;

        const sonDatosIguales = (clienteDB.nombre || '').trim() === (clienteBC.nombre || '').trim() &&
                                (clienteDB.telefono || '').trim() === (clienteBC.telefono || '').trim() &&
                                (clienteDB.correo || '').trim() === (clienteBC.correo || '').trim();

        if (sonDatosIguales) {
            const estadoCliente = clienteBC.activo ? 'Activo ✅' : 'Inactivo ❌';
const mensajeDetallado = `
    <div style="text-align: left; font-family: monospace;">
        La cuenta ingresada es correcta.<br>
        Los datos coinciden con la blockchain.<br><br>
        <b>Estado Actual del cliente:</b> ${estadoCliente}
    </div>
`;
Swal.fire({
    title: '¡Validación Correcta!',
    html: mensajeDetallado, // Usamos el mensaje detallado
    icon: 'success'
});
            
            //Swal.fire({ title: '¡Válido!', text: 'La cuenta es correcta y los datos coinciden con la blockchain.', icon: 'success' });
        } else {
            Swal.fire({ title: '¡Alerta!', text: 'La cuenta es correcta, pero los datos en la base de datos NO coinciden con la blockchain.', icon: 'error' });
        }

    } catch (error) {
        // Manejo de errores (cliente no encontrado en BD o BC)
        if (error.response && error.response.status === 404) {
             Swal.fire('Error', 'No se encontró el cliente en la base de datos.', 'error');
        } else {
            Swal.fire('Error de Validación', 'Este cliente no ha sido registrado en la blockchain o hubo un problema al consultarlo.', 'error');
        }
        console.error("Error en validación:", error);
    }
}

async function eliminarCliente(clienteId) {
    const cuenta = await obtenerCuenta();
    if (!cuenta) return;
    Swal.fire({ title: 'Desactivando Cliente...', didOpen: () => Swal.showLoading() });
    try {
        await axios.post(`${API_URL}/eliminar`, { id: clienteId, cuenta: cuenta });
        await Swal.fire('¡Éxito!', 'El cliente ha sido marcado como inactivo.', 'success');
        cargarClientesDesdeDB();
    } catch (error) {
        Swal.fire('Error', error.response.data.message || error.message, 'error');
    }
}

async function reactivarCliente(clienteId) {
    const cuenta = await obtenerCuenta();
    if (!cuenta) return;
    Swal.fire({ title: 'Reactivando Cliente...', didOpen: () => Swal.showLoading() });
    try {
        await axios.post(`${API_URL}/reactivar`, { id: clienteId, cuenta: cuenta });
        await Swal.fire('¡Éxito!', 'El cliente ha sido reactivado.', 'success');
        cargarClientesDesdeDB();
    } catch (error) {
        Swal.fire('Error', error.response.data.message || error.message, 'error');
    }
}

async function registrarPago() {
    const cuenta = await obtenerCuenta();
    if (!cuenta) return;
    const { value: formValues } = await Swal.fire({
        title: 'Registrar Nuevo Pago',
        html: '<input id="swal-idCliente" class="swal2-input" placeholder="ID del Cliente">' +
            '<input id="swal-importe" class="swal2-input" placeholder="Importe (en centavos, ej: 5000)">',
        focusConfirm: false,
        preConfirm: () => [document.getElementById('swal-idCliente').value, document.getElementById('swal-importe').value]
    });

    if (formValues) {
        const [idCliente, importe] = formValues;
        if (!idCliente || !importe) {
            Swal.fire('Error', 'Debe ingresar el ID del cliente y el importe.', 'error');
            return;
        }
        Swal.fire({ title: 'Registrando Pago...', didOpen: () => Swal.showLoading() });
        try {
            await axios.post(`${API_URL}/pedidos/registrar`, { idCliente, importe, cuenta });
            Swal.fire('¡Éxito!', 'El pago ha sido registrado en la BD y en la Blockchain.', 'success');
        } catch (error) {
            Swal.fire('Error', error.response.data.message || 'No se pudo registrar el pago.', 'error');
        }
    }
}

async function consultarHistorial() {
    const cuenta = await obtenerCuenta();
    if (!cuenta) return;

    const { value: idCliente } = await Swal.fire({
        title: 'Consultar y Validar Historial',
        input: 'text',
        inputLabel: 'Ingrese el ID del cliente',
        showCancelButton: true,
    });
    if (!idCliente) return;

    Swal.fire({ title: 'Consultando y validando historiales...', didOpen: () => Swal.showLoading() });

    try {
        // Hacemos dos peticiones al mismo tiempo para obtener ambos historiales
        const [respuestaBC, respuestaDB] = await Promise.all([
            axios.get(`${API_URL}/pedidos/historial/${idCliente}?cuenta=${cuenta}`),
            axios.get(`${API_URL}/pedidos/historial/db/${idCliente}`)
        ]);

        const historialBC = respuestaBC.data.data;
        const historialDB = respuestaDB.data.data;

        // Lógica de comparación
        let sonIguales = true;
        if (historialBC.length !== historialDB.length) {
            sonIguales = false;
        } else {
            for (let i = 0; i < historialBC.length; i++) {
                if (parseFloat(historialBC[i].importe) !== parseFloat(historialDB[i].total)) {
                    sonIguales = false;
                    break;
                }
            }
        }

        if (sonIguales) {
            let historialHtml = '<div style="text-align: left;">';
            if (historialBC.length === 0) {
                historialHtml = '<p>Este cliente no tiene pagos registrados.</p>';
            } else {
                historialBC.forEach(pago => {
                    historialHtml += `
                        <p style="margin-bottom: 0.5rem;">
                            <b>ID Pago en BC:</b> ${pago.id}<br>
                            <b>Importe:</b> ${pago.importe}<br>
                            <b>Fecha:</b> ${new Date(pago.timestamp * 1000).toLocaleString()}
                        </p>
                        <p style="margin-bottom: 1rem;">
                            <b>Hash:</b><br><small style="word-break: break-all;">${pago.hashPedido}</small>
                        </p>
                        <hr>`;
                });
            }
            historialHtml += '</div>';
            Swal.fire({
                title: `✅ Historial Válido para Cliente ${idCliente}`,
                html: historialHtml,
                icon: 'success'
            });
        } else {
            // ESTA ES LA PARTE IMPORTANTE: AHORA VERÁS EL DETALLE DEL ERROR
            let historialHtml = `
                <div style="text-align: left; font-family: monospace; line-height: 1.6;">
                    <p><strong>Historial en Base de Datos (${historialDB.length} registros):</strong><br>`;
            historialDB.forEach(p => { historialHtml += `- ID ${p.id}, Total: ${p.total}<br>`; });

            historialHtml += `</p><hr><p><strong>Historial en Blockchain (${historialBC.length} registros):</strong><br>`;
            historialBC.forEach(p => { historialHtml += `- ID ${p.id}, Importe: ${p.importe}<br>`; });

            historialHtml += `</p></div>`;
            Swal.fire({
                title: '❌ ¡Alerta! El historial NO coincide.',
                html: historialHtml,
                icon: 'error'
            });
        }

    } catch (error) {
        Swal.fire('Error', 'No se pudo validar el historial.', 'error');
    }
}

// --- FUNCIONES NUEVAS PARA PDF Y IPFS ---

async function generarYSubirPDF(id, nombre, telefono, correo) {
    try {
        Swal.fire({
            title: 'Generando PDF en Servidor...',
            text: 'Creando documento y subiendo a IPFS...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading() }
        });

        // Enviamos solo los DATOS al backend
        const response = await axios.post(`${API_URL}/ipfs/subir`, {
            id: id,
            nombre: nombre,
            telefono: telefono,
            correo: correo
        });

        if (response.data.success) {
            const cid = response.data.cid;
            const url = `https://ipfs.io/ipfs/${cid}`; // Gateway público
            // Opcional: Usar tu gateway local si el público es lento:
            // const url = `http://127.0.0.1:8080/ipfs/${cid}`; 
            
            Swal.fire({
                title: '¡PDF Generado y Subido!',
                html: `
                    <p>Documento seguro en IPFS.</p>
                    <p><strong>CID:</strong> ${cid}</p>
                    <a href="${url}" target="_blank" class="btn btn-success">👁️ Ver PDF</a>
                `,
                icon: 'success'
            });
            cargarClientesDesdeDB();
        } else {
            throw new Error(response.data.message);
        }

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo generar el PDF. Revisa que el Backend esté corriendo.', 'error');
    }
}

async function subirIPFSViaBackend(base64String) {
    try {
        Swal.fire({
            title: 'Subiendo a IPFS...',
            text: 'Procesando vía Servidor...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading() }
        });

        // Hacemos POST a TU backend, no a IPFS directo
        const response = await axios.post(`${API_URL}/ipfs/subir`, {
            pdfBase64: base64String
        });

        if (response.data.success) {
            const cid = response.data.cid;
            const url = `https://ipfs.io/ipfs/${cid}`;

            Swal.fire({
                title: '¡Éxito!',
                html: `
                    <p>Archivo subido a IPFS correctamente.</p>
                    <p><strong>CID:</strong> ${cid}</p>
                    <a href="${url}" target="_blank" class="btn btn-success">Ver PDF</a>
                `,
                icon: 'success'
            });
        } else {
            throw new Error(response.data.message);
        }

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo subir a IPFS. Revisa que el Backend y IPFS Desktop estén corriendo.', 'error');
    }
}

async function mintearNFT(id, nombre, cidPdf) {
    const cuenta = await obtenerCuenta();
    if(!cuenta) return;

    if (!cidPdf || cidPdf === "null") {
        Swal.fire('Atención', 'Primero debes generar el PDF.', 'warning');
        return;
    }

    Swal.fire({ title: 'Minteando NFT...', text: 'Firmando transacción...', didOpen: () => Swal.showLoading() });

    try {
        const response = await axios.post(`${API_URL}/nft/mintear`, {
            id, nombre, cuenta, cid_pdf: cidPdf
        });
        
        // --- AQUÍ ESTÁ EL CAMBIO PARA MOSTRAR EL HASH ---
        const txHash = response.data.txHash;
        const txCorto = txHash.substring(0, 15) + "..."; // Lo acortamos para que se vea bien

        Swal.fire({
            title: '¡NFT Creado Exitosamente!',
            html: `
                <p><strong>Token ID:</strong> ${response.data.tokenId}</p>
                <p><strong>Transacción (Hash):</strong> <br>
                <span style="font-family: monospace; color: #e67e22;">${txHash}</span></p>
            `,
            icon: 'success'
        });

        cargarClientesDesdeDB(); 
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo mintear. Revisa la consola.', 'error');
    }
}

async function verNFT(tokenId) {
    // Validación de seguridad para la demo
    if (tokenId === null || tokenId === 'null' || tokenId === 0) {
        Swal.fire('Aviso', 'Este cliente aún no tiene un NFT minteado.', 'info');
        return;
    }

    Swal.fire({ title: 'Consultando Blockchain...', text: 'Leyendo activo digital...', didOpen: () => Swal.showLoading() });
    
    try {
        const response = await axios.get(`${API_URL}/nft/${tokenId}`);
        const d = response.data.data;
        
        Swal.fire({
            title: '💎 Propiedad Digital (NFT)',
            html: `
                <div style="text-align:left; font-size: 1.1em;">
                    <p><strong>Token ID:</strong> <span style="color:blue">${d.tokenId}</span></p>
                    <p><strong>Cliente:</strong> ${d.nombre}</p>
                    <p><strong>Propietario:</strong> <br><small style="font-family:monospace">${d.owner}</small></p>
                    <p><strong>Fecha Minteo:</strong> ${new Date(d.timestamp * 1000).toLocaleString()}</p>
                    <hr>
                    <div style="text-align:center">
                        <a href="http://127.0.0.1:8080/ipfs/${d.hashPdf}" target="_blank" class="btn btn-success">📄 Ver Documento Original</a>
                    </div>
                </div>
            `,
            icon: 'info'
        });
    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'No se pudo leer el NFT.', 'error');
    }
}