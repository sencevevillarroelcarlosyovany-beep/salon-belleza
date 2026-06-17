// Funciones de autenticación
class Auth {
    constructor() {
        this.supabase = supabaseClient;
        this.currentUser = null;
    }

    // Iniciar sesión
    async login(email, password) {
        try {
            const { data: user, error } = await this.supabase
                .from('usuarios')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .single();

            if (error) throw error;
            if (!user) throw new Error('Usuario no encontrado');

            if (user.rol === 'cliente' && !user.aprobado) {
                throw new Error('Cuenta pendiente de aprobación');
            }

            this.currentUser = user;
            localStorage.setItem('usuario', JSON.stringify(user));
            return user;
        } catch (error) {
            throw new Error(`Error al iniciar sesión: ${error.message}`);
        }
    }

    // Registro de cliente
    async register(nombre, email, telefono, password) {
        try {
            const { data: existingUser } = await this.supabase
                .from('usuarios')
                .select('email')
                .eq('email', email)
                .single();

            if (existingUser) throw new Error('El email ya está registrado');

            const { data: user, error } = await this.supabase
                .from('usuarios')
                .insert([{
                    nombre: nombre,
                    email: email,
                    telefono: telefono,
                    password: password,
                    rol: 'cliente',
                    aprobado: false
                }])
                .select()
                .single();

            if (error) throw error;
            return user;
        } catch (error) {
            throw new Error(`Error al registrarse: ${error.message}`);
        }
    }

    // Cerrar sesión
    logout() {
        this.currentUser = null;
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    }

    // Obtener usuario actual
    getCurrentUser() {
        if (!this.currentUser) {
            const stored = localStorage.getItem('usuario');
            if (stored) {
                this.currentUser = JSON.parse(stored);
            }
        }
        return this.currentUser;
    }

    // Verificar sesión
    checkAuth(requiredRole = null) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return null;
        }
        if (requiredRole && user.rol !== requiredRole) {
            window.location.href = 'index.html';
            return null;
        }
        return user;
    }

    // Aprobar cliente
    async aprobarCliente(userId) {
        try {
            const { data, error } = await this.supabase
                .from('usuarios')
                .update({ aprobado: true })
                .eq('id', userId)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error al aprobar cliente: ${error.message}`);
        }
    }

    // Obtener clientes pendientes
    async getClientesPendientes() {
        try {
            const { data, error } = await this.supabase
                .from('usuarios')
                .select('*')
                .eq('rol', 'cliente')
                .eq('aprobado', false)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error al obtener clientes pendientes: ${error.message}`);
        }
    }
}