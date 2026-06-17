// ========================================
// CLASE CLIENTE - FUNCIONALIDADES DEL CLIENTE
// ========================================

class Cliente {
    constructor() {
        this.supabase = supabaseClient;
    }

    // ========================================
    // OBTENER SERVICIOS DISPONIBLES
    // ========================================
    async getServicios() {
        try {
            const { data, error } = await this.supabase
                .from('servicios')
                .select('*')
                .eq('activo', true)
                .order('nombre');

            if (error) throw error;
            return data || [];
            
        } catch (error) {
            console.error('Error al obtener servicios:', error);
            throw new Error(`Error al obtener servicios: ${error.message}`);
        }
    }

    // ========================================
    // CREAR CITA (con verificación de disponibilidad)
    // ========================================
    async crearCita(clienteId, servicio, fecha, hora, notas = '') {
        try {
            // Validaciones
            if (!clienteId || !servicio || !fecha || !hora) {
                throw new Error('Todos los campos son obligatorios');
            }

            // Verificar que la fecha no sea en el pasado
            const fechaCita = new Date(`${fecha}T${hora}`);
            const ahora = new Date();
            if (fechaCita < ahora) {
                throw new Error('No puedes agendar citas en el pasado');
            }

            // Verificar disponibilidad (doble verificación)
            const disponibilidad = await this.verificarDisponibilidad(fecha, hora);
            if (!disponibilidad) {
                throw new Error('⚠️ Esta hora ya no está disponible. Por favor, elige otra.');
            }

            // Crear la cita
            const { data, error } = await this.supabase
                .from('citas')
                .insert([{
                    cliente_id: clienteId,
                    servicio: servicio,
                    fecha: fecha,
                    hora: hora,
                    notas: notas || '',
                    estado: 'pendiente',
                    duracion: 60 // Duración por defecto en minutos
                }])
                .select();

            if (error) {
                if (error.code === '23505') {
                    throw new Error('Esta hora ya está reservada');
                }
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('Error al crear la cita');
            }

            return data[0];
            
        } catch (error) {
            console.error('Error al crear cita:', error);
            throw error;
        }
    }

    // ========================================
    // VERIFICAR DISPONIBILIDAD DE HORARIO
    // ========================================
    async verificarDisponibilidad(fecha, hora) {
        try {
            if (!fecha || !hora) {
                throw new Error('Fecha y hora requeridas');
            }

            // Obtener citas de ese día
            const { data: citas, error } = await this.supabase
                .from('citas')
                .select('hora, estado')
                .eq('fecha', fecha)
                .neq('estado', 'cancelada');

            if (error) throw error;

            // Verificar si la hora está ocupada
            const ocupada = citas.some(cita => cita.hora === hora);
            
            return !ocupada;
            
        } catch (error) {
            console.error('Error al verificar disponibilidad:', error);
            throw new Error(`Error al verificar disponibilidad: ${error.message}`);
        }
    }

    // ========================================
    // OBTENER CITAS POR FECHA (para admin)
    // ========================================
    async getCitasPorFecha(fecha) {
        try {
            if (!fecha) {
                throw new Error('Fecha requerida');
            }

            const { data, error } = await this.supabase
                .from('citas')
                .select('*')
                .eq('fecha', fecha)
                .neq('estado', 'cancelada');

            if (error) throw error;
            return data || [];
            
        } catch (error) {
            console.error('Error al obtener citas por fecha:', error);
            throw new Error(`Error al obtener citas por fecha: ${error.message}`);
        }
    }

    // ========================================
    // OBTENER CITAS DEL CLIENTE
    // ========================================
    async getCitasCliente(clienteId) {
        try {
            if (!clienteId) {
                throw new Error('ID de cliente requerido');
            }

            const { data, error } = await this.supabase
                .from('citas')
                .select('*')
                .eq('cliente_id', clienteId)
                .order('fecha', { ascending: true })
                .order('hora', { ascending: true });

            if (error) throw error;
            return data || [];
            
        } catch (error) {
            console.error('Error al obtener citas del cliente:', error);
            throw new Error(`Error al obtener citas: ${error.message}`);
        }
    }

    // ========================================
    // CANCELAR CITA
    // ========================================
    async cancelarCita(citaId) {
        try {
            // Verificar que la cita existe y puede ser cancelada
            const { data: cita, error: getError } = await this.supabase
                .from('citas')
                .select('estado, fecha')
                .eq('id', citaId)
                .single();

            if (getError) throw getError;

            if (!cita) {
                throw new Error('Cita no encontrada');
            }

            if (cita.estado === 'completada') {
                throw new Error('No puedes cancelar una cita completada');
            }

            if (cita.estado === 'cancelada') {
                throw new Error('Esta cita ya está cancelada');
            }

            // Verificar si la cita es de hoy (no permitir cancelar con menos de 2 horas)
            const ahora = new Date();
            const fechaCita = new Date(cita.fecha);
            const diffHoras = (fechaCita - ahora) / (1000 * 60 * 60);
            
            if (diffHoras < 2 && diffHoras > 0) {
                throw new Error('⚠️ No puedes cancelar citas con menos de 2 horas de anticipación');
            }

            // Cancelar la cita
            const { data, error } = await this.supabase
                .from('citas')
                .update({ estado: 'cancelada' })
                .eq('id', citaId)
                .select();

            if (error) throw error;
            
            if (!data || data.length === 0) {
                throw new Error('Error al cancelar la cita');
            }
            
            return data[0];
            
        } catch (error) {
            console.error('Error al cancelar cita:', error);
            throw error;
        }
    }

    // ========================================
    // OBTENER HORAS DISPONIBLES PARA UNA FECHA
    // ========================================
    async getHorasDisponibles(fecha) {
        try {
            if (!fecha) {
                throw new Error('Fecha requerida');
            }

            const citas = await this.getCitasPorFecha(fecha);
            const horasOcupadas = citas.map(c => c.hora);
            
            // Generar todas las horas del día (9:00 AM a 7:00 PM)
            const todasLasHoras = [];
            for (let i = 9; i <= 19; i++) {
                const hora = `${i.toString().padStart(2, '0')}:00`;
                todasLasHoras.push({
                    hora: hora,
                    disponible: !horasOcupadas.includes(hora)
                });
            }

            return todasLasHoras;
            
        } catch (error) {
            console.error('Error al obtener horas disponibles:', error);
            throw new Error(`Error al obtener horas disponibles: ${error.message}`);
        }
    }
}