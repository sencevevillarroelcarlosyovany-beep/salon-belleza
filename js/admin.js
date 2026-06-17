// Funciones del administrador
class Admin {
    constructor() {
        this.supabase = supabaseClient;
    }

    // Obtener todas las citas
    async getCitas(filtro = null) {
        try {
            let query = this.supabase
                .from('citas')
                .select(`
                    *,
                    usuarios:cliente_id (nombre, email, telefono)
                `)
                .order('fecha', { ascending: true });

            if (filtro) {
                query = query.eq('estado', filtro);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error al obtener citas: ${error.message}`);
        }
    }

    // Obtener citas por fecha
    async getCitasPorFecha(fecha) {
        try {
            const { data, error } = await this.supabase
                .from('citas')
                .select(`
                    *,
                    usuarios:cliente_id (nombre, email, telefono)
                `)
                .eq('fecha', fecha)
                .order('hora', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error al obtener citas por fecha: ${error.message}`);
        }
    }

    // Actualizar estado de cita
    async updateCitaEstado(citaId, estado) {
        try {
            const { data, error } = await this.supabase
                .from('citas')
                .update({ estado: estado })
                .eq('id', citaId)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error al actualizar cita: ${error.message}`);
        }
    }

    // Generar factura (simulada)
    generarFactura(cita) {
        const numeroFactura = `FAC-${Date.now()}`;
        const fecha = new Date();
        return {
            numero: numeroFactura,
            fecha: fecha.toISOString().split('T')[0],
            cliente: cita.usuarios.nombre,
            servicio: cita.servicio,
            precio: cita.precio || 50,
            total: cita.precio || 50
        };
    }

    // Obtener estadísticas
    async getEstadisticas() {
        try {
            const citas = await this.getCitas();
            const total = citas.length;
            const pendientes = citas.filter(c => c.estado === 'pendiente').length;
            const confirmadas = citas.filter(c => c.estado === 'confirmada').length;
            const completadas = citas.filter(c => c.estado === 'completada').length;
            const canceladas = citas.filter(c => c.estado === 'cancelada').length;
            const ingresos = completadas * 50;

            return { total, pendientes, confirmadas, completadas, canceladas, ingresos };
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }
}