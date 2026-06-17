// Funciones del cliente
class Cliente {
    constructor() {
        this.supabase = supabaseClient;
    }

    // Obtener servicios disponibles
    async getServicios() {
        try {
            const { data, error } = await this.supabase
                .from('servicios')
                .select('*')
                .eq('activo', true)
                .order('nombre');

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error al obtener servicios: ${error.message}`);
        }
    }

    // Crear una cita
    async crearCita(clienteId, servicio, fecha, hora, notas = '') {
        try {
            // Verificar disponibilidad
            const disponibilidad = await this.verificarDisponibilidad(fecha, hora);
            if (!disponibilidad) {
                throw new Error('Horario no disponible');
            }

            const { data, error } = await this.supabase
                .from('citas')
                .insert([
                    {
                        cliente_id: clienteId,
                        servicio: servicio,
                        fecha: fecha,
                        hora: hora,
                        notas: notas,
                        estado: 'pendiente'
                    }
                ])
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error al crear cita: ${error.message}`);
        }
    }

    // Verificar disponibilidad de horario
    async verificarDisponibilidad(fecha, hora) {
        try {
            const horaMin = parseInt(hora.split(':')[0]);
            const horaMax = horaMin + 1; // Asumimos 1 hora de duración

            const { data, error } = await this.supabase
                .from('citas')
                .select('*')
                .eq('fecha', fecha)
                .neq('estado', 'cancelada');

            if (error) throw error;

            // Verificar si hay solapamiento
            for (const cita of data) {
                const citaHora = parseInt(cita.hora.split(':')[0]);
                const citaHoraMax = citaHora + 1;
                
                if (horaMin >= citaHora && horaMin < citaHoraMax) {
                    return false;
                }
                if (horaMax > citaHora && horaMax <= citaHoraMax) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            throw new Error(`Error al verificar disponibilidad: ${error.message}`);
        }
    }

    // Obtener citas del cliente
    async getCitasCliente(clienteId) {
        try {
            const { data, error } = await this.supabase
                .from('citas')
                .select('*')
                .eq('cliente_id', clienteId)
                .order('fecha', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error al obtener citas: ${error.message}`);
        }
    }

    // Cancelar cita
    async cancelarCita(citaId) {
        try {
            const { data, error } = await this.supabase
                .from('citas')
                .update({ estado: 'cancelada' })
                .eq('id', citaId)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error al cancelar cita: ${error.message}`);
        }
    }
}