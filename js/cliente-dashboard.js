// Lógica del Dashboard de Cliente
document.addEventListener('DOMContentLoaded', function() {
    const auth = new Auth();
    const cliente = new Cliente();
    const user = auth.checkAuth('cliente');

    // Mostrar nombre del cliente
    document.getElementById('clienteName').textContent = `👋 ${user.nombre}`;

    // Cargar datos iniciales
    cargarMisCitas();
    cargarServicios();

    // ============ TABS ============
    document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const tab = this.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(tab + '-tab').classList.add('active');
            
            if (tab === 'citas') cargarMisCitas();
            if (tab === 'servicios') cargarServicios();
            if (tab === 'nueva') {
                cargarServiciosSelect();
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                document.getElementById('citaFecha').min = tomorrow.toISOString().split('T')[0];
                document.getElementById('citaFecha').value = tomorrow.toISOString().split('T')[0];
                cargarHorasDisponibles(tomorrow.toISOString().split('T')[0]);
            }
        });
    });

    // ============ FUNCIONES ============

    async function cargarServiciosSelect() {
        try {
            const servicios = await cliente.getServicios();
            const select = document.getElementById('servicioSelect');
            select.innerHTML = '<option value="">Seleccionar servicio...</option>';
            
            servicios.forEach(servicio => {
                select.innerHTML += `
                    <option value="${servicio.nombre}" data-precio="${servicio.precio}" data-duracion="${servicio.duracion}">
                        ${servicio.nombre} - $${servicio.precio} (${servicio.duracion} min)
                    </option>
                `;
            });
        } catch (error) {
            console.error('Error cargando servicios:', error);
        }
    }

    async function cargarServicios() {
        try {
            const servicios = await cliente.getServicios();
            const container = document.getElementById('serviciosList');
            
            container.innerHTML = servicios.map(servicio => `
                <div class="card servicio-card">
                    <h3>${servicio.nombre}</h3>
                    <p>${servicio.descripcion || 'Sin descripción'}</p>
                    <p><strong>💰 $${servicio.precio}</strong></p>
                    <p>⏱️ ${servicio.duracion} minutos</p>
                </div>
            `).join('');
        } catch (error) {
            document.getElementById('serviciosList').innerHTML = 
                `<p class="error">Error: ${error.message}</p>`;
        }
    }

    async function cargarMisCitas() {
        try {
            const citas = await cliente.getCitasCliente(user.id);
            const container = document.getElementById('misCitas');
            
            if (citas.length === 0) {
                container.innerHTML = '<p class="empty">No tienes citas agendadas</p>';
                return;
            }

            citas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            container.innerHTML = citas.map(cita => `
                <div class="card cita-card">
                    <div class="cita-info">
                        <h3>${cita.servicio}</h3>
                        <p>📅 ${formatFecha(cita.fecha)} ⏰ ${cita.hora}</p>
                        <p>Estado: <span class="estado-${cita.estado}">${traducirEstado(cita.estado)}</span></p>
                        ${cita.notas ? `<p>📝 ${cita.notas}</p>` : ''}
                        <small>📅 Agendada: ${new Date(cita.created_at).toLocaleDateString()}</small>
                    </div>
                    ${cita.estado === 'pendiente' || cita.estado === 'confirmada' ? `
                        <button onclick="cancelarCita('${cita.id}')" class="btn-danger">Cancelar</button>
                    ` : ''}
                </div>
            `).join('');
        } catch (error) {
            document.getElementById('misCitas').innerHTML = 
                `<p class="error">Error: ${error.message}</p>`;
        }
    }

    window.cancelarCita = async function(citaId) {
        if (!confirm('¿Estás seguro de cancelar esta cita?')) return;
        
        try {
            await cliente.cancelarCita(citaId);
            alert('✅ Cita cancelada correctamente');
            cargarMisCitas();
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        }
    };

    async function cargarHorasDisponibles(fecha) {
        try {
            if (!fecha) {
                fecha = document.getElementById('citaFecha').value;
            }
            
            if (!fecha) {
                document.getElementById('citaHora').innerHTML = '<option value="">Selecciona una fecha primero</option>';
                return;
            }

            const citas = await cliente.getCitasPorFecha(fecha);
            
            const horasDisponibles = [];
            for (let i = 9; i <= 19; i++) {
                horasDisponibles.push({
                    hora: `${i.toString().padStart(2, '0')}:00`,
                    disponible: true
                });
            }

            citas.forEach(cita => {
                if (cita.estado !== 'cancelada') {
                    horasDisponibles.forEach(h => {
                        if (h.hora === cita.hora) {
                            h.disponible = false;
                        }
                    });
                }
            });

            const select = document.getElementById('citaHora');
            select.innerHTML = '<option value="">Seleccionar hora disponible...</option>';
            
            let horasDisponiblesCount = 0;
            horasDisponibles.forEach(h => {
                if (h.disponible) {
                    horasDisponiblesCount++;
                    select.innerHTML += `
                        <option value="${h.hora}">${h.hora} - ✅ Disponible</option>
                    `;
                } else {
                    select.innerHTML += `
                        <option value="${h.hora}" disabled>${h.hora} - ❌ Ocupado</option>
                    `;
                }
            });

            const infoEl = document.getElementById('horaInfo');
            if (horasDisponiblesCount === 0) {
                infoEl.textContent = '⚠️ No hay horas disponibles para esta fecha. Elige otra fecha.';
                infoEl.style.color = '#e74c3c';
            } else {
                infoEl.textContent = `✅ ${horasDisponiblesCount} horas disponibles para esta fecha`;
                infoEl.style.color = '#27ae60';
            }

            mostrarGridHoras(horasDisponibles);

        } catch (error) {
            console.error('Error cargando horas:', error);
            document.getElementById('citaHora').innerHTML = '<option value="">Error al cargar horas</option>';
        }
    }

    function mostrarGridHoras(horas) {
        const container = document.getElementById('disponibilidadContainer');
        const grid = document.getElementById('horasDisponibles');
        
        container.style.display = 'block';
        
        grid.innerHTML = horas.map(h => `
            <div class="hora-item ${h.disponible ? 'disponible' : 'ocupada'}">
                ${h.hora}
                ${h.disponible ? '✅' : '❌'}
            </div>
        `).join('');
    }

    // Evento: Cambio de fecha
    document.getElementById('citaFecha').addEventListener('change', function() {
        cargarHorasDisponibles(this.value);
    });

    // ============ NUEVA CITA ============
    document.getElementById('nuevaCitaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const servicio = document.getElementById('servicioSelect').value;
        const fecha = document.getElementById('citaFecha').value;
        const hora = document.getElementById('citaHora').value;
        const notas = document.getElementById('citaNotas').value;
        const messageEl = document.getElementById('citaMessage');

        if (!servicio || !fecha || !hora) {
            messageEl.textContent = '⚠️ Por favor, completa todos los campos';
            messageEl.className = 'message error';
            return;
        }

        try {
            const disponibilidad = await cliente.verificarDisponibilidad(fecha, hora);
            if (!disponibilidad) {
                messageEl.textContent = '⚠️ Esta hora ya no está disponible. Por favor, elige otra.';
                messageEl.className = 'message error';
                cargarHorasDisponibles(fecha);
                return;
            }

            await cliente.crearCita(user.id, servicio, fecha, hora, notas);
            messageEl.textContent = '✅ ¡Cita agendada correctamente!';
            messageEl.className = 'message success';
            
            document.getElementById('nuevaCitaForm').reset();
            document.getElementById('citaNotas').value = '';
            
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('citaFecha').value = tomorrow.toISOString().split('T')[0];
            cargarHorasDisponibles(tomorrow.toISOString().split('T')[0]);
            cargarMisCitas();
            
            setTimeout(() => {
                messageEl.className = 'message';
                messageEl.textContent = '';
            }, 5000);
            
        } catch (error) {
            messageEl.textContent = `❌ ${error.message}`;
            messageEl.className = 'message error';
            cargarHorasDisponibles(fecha);
        }
    });

    // ============ FUNCIONES AUXILIARES ============
    function formatFecha(fecha) {
        const d = new Date(fecha);
        return d.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function traducirEstado(estado) {
        const estados = {
            'pendiente': '⏳ Pendiente',
            'confirmada': '✅ Confirmada',
            'completada': '✔️ Completada',
            'cancelada': '❌ Cancelada'
        };
        return estados[estado] || estado;
    }

    // ============ LOGOUT ============
    document.getElementById('logoutBtn').addEventListener('click', () => auth.logout());

    // ============ INICIALIZAR ============
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('citaFecha').min = tomorrow.toISOString().split('T')[0];
    document.getElementById('citaFecha').value = tomorrow.toISOString().split('T')[0];
    cargarHorasDisponibles(tomorrow.toISOString().split('T')[0]);
});