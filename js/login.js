// Lógica de Login y Registro
document.addEventListener('DOMContentLoaded', function() {
    const auth = new Auth();

    // ============ TABS ============
    document.querySelectorAll('.auth-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.auth-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const tab = this.dataset.tab;
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById(tab + '-form').classList.add('active');
        });
    });

    // ============ LOGIN ============
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const messageEl = document.getElementById('loginMessage');

        try {
            const user = await auth.login(email, password);
            
            if (user.rol === 'admin') {
                window.location.href = 'dashboard-admin.html';
            } else {
                window.location.href = 'dashboard-cliente.html';
            }
        } catch (error) {
            messageEl.textContent = error.message;
            messageEl.className = 'message error';
        }
    });

    // ============ REGISTRO ============
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const telefono = document.getElementById('registerPhone').value;
        const password = document.getElementById('registerPassword').value;
        const messageEl = document.getElementById('registerMessage');

        try {
            await auth.register(nombre, email, telefono, password);
            messageEl.textContent = '✅ Registro exitoso. Espera la aprobación del administrador.';
            messageEl.className = 'message success';
            document.getElementById('registerForm').reset();
        } catch (error) {
            messageEl.textContent = error.message;
            messageEl.className = 'message error';
        }
    });
});