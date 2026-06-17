// Funciones de Reportes - SIN Python
class Reportes {
    constructor() {
        this.admin = new Admin();
        this.todasLasCitas = [];
    }

    // Cargar todas las citas
    async cargarCitas() {
        try {
            this.todasLasCitas = await this.admin.getCitas();
            return this.todasLasCitas;
        } catch (error) {
            throw new Error(`Error cargando citas: ${error.message}`);
        }
    }

    // Generar reporte HTML
    async generarHTML() {
        const container = document.getElementById('reporteContainer');
        const content = document.getElementById('reporteContent');
        
        if (!container || !content) {
            console.error('❌ Contenedores de reporte no encontrados');
            return;
        }
        
        container.classList.add('visible');
        content.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="loading-spinner"></div>
                <p>Cargando datos...</p>
            </div>
        `;
        
        try {
            if (this.todasLasCitas.length === 0) {
                await this.cargarCitas();
            }
            
            const citas = this.todasLasCitas;
            
            if (citas.length === 0) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                        <p>📭 No hay citas para generar el reporte</p>
                    </div>
                `;
                return;
            }
            
            // Calcular estadísticas
            const total = citas.length;
            const estados = {};
            const servicios = {};
            let ingresos = 0;
            
            citas.forEach(cita => {
                estados[cita.estado] = (estados[cita.estado] || 0) + 1;
                servicios[cita.servicio] = (servicios[cita.servicio] || 0) + 1;
                if (cita.estado === 'completada') {
                    ingresos += 50;
                }
            });
            
            const serviciosOrdenados = Object.entries(servicios)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            const fechaGeneracion = new Date().toLocaleString('es-ES');
            const fechas = citas.map(c => new Date(c.fecha));
            const fechaInicio = fechas.length > 0 ? new Date(Math.min(...fechas)).toLocaleDateString('es-ES') : 'N/A';
            const fechaFin = fechas.length > 0 ? new Date(Math.max(...fechas)).toLocaleDateString('es-ES') : 'N/A';
            
            const estadoLabels = {
                'pendiente': '⏳ Pendiente',
                'confirmada': '✅ Confirmada',
                'completada': '✔️ Completada',
                'cancelada': '❌ Cancelada'
            };
            
            let html = `
                <div class="reporte-header">
                    <h2>📊 Reporte de Citas - Salón de Belleza</h2>
                    <p>Generado: ${fechaGeneracion}</p>
                </div>
                
                <div class="reporte-stats">
                    <div class="stat-item">
                        <h4>Total Citas</h4>
                        <div class="number">${total}</div>
                    </div>
                    <div class="stat-item">
                        <h4>📅 Desde</h4>
                        <div class="number" style="font-size: 16px;">${fechaInicio}</div>
                    </div>
                    <div class="stat-item">
                        <h4>📅 Hasta</h4>
                        <div class="number" style="font-size: 16px;">${fechaFin}</div>
                    </div>
                    <div class="stat-item" style="background: #d5f5e3;">
                        <h4>💰 Ingresos</h4>
                        <div class="number">$${ingresos.toFixed(2)}</div>
                    </div>
                </div>
                
                <h3>📋 Estado de Citas</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Estado</th>
                            <th>Cantidad</th>
                            <th>Porcentaje</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            Object.entries(estados).forEach(([estado, cantidad]) => {
                const porcentaje = ((cantidad / total) * 100).toFixed(1);
                html += `
                    <tr>
                        <td><span class="badge badge-${estado}">${estadoLabels[estado] || estado}</span></td>
                        <td>${cantidad}</td>
                        <td>${porcentaje}%</td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
                
                <h3>🏆 Servicios Más Solicitados</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Servicio</th>
                            <th>Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            serviciosOrdenados.forEach(([servicio, cantidad]) => {
                html += `
                    <tr>
                        <td>${servicio}</td>
                        <td>${cantidad}</td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
                
                <h3>📋 Detalle de Citas (últimas 20)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Servicio</th>
                            <th>Cliente</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            citas.slice(-20).reverse().forEach(cita => {
                const cliente = cita.usuarios ? cita.usuarios.nombre : 'N/A';
                html += `
                    <tr>
                        <td>${cita.fecha}</td>
                        <td>${cita.hora}</td>
                        <td>${cita.servicio}</td>
                        <td>${cliente}</td>
                        <td><span class="badge badge-${cita.estado}">${estadoLabels[cita.estado] || cita.estado}</span></td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
                
                <div class="reporte-footer">
                    <p>Reporte generado automáticamente - Sistema de Gestión de Salón de Belleza</p>
                    <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
                </div>
            `;
            
            content.innerHTML = html;
            container.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            content.innerHTML = `
                <div style="background: #fadbd8; padding: 20px; border-radius: 8px; border: 1px solid #e74c3c;">
                    <h3 style="color: #e74c3c;">❌ Error al generar el reporte</h3>
                    <p>${error.message}</p>
                    <p style="font-size: 12px; color: #7f8c8d;">Revisa la consola para más detalles</p>
                </div>
            `;
            console.error('Error generando reporte:', error);
        }
    }

    // Generar PDF (usando impresión)
    generarPDF() {
        this.generarHTML();
        setTimeout(() => {
            const container = document.getElementById('reporteContainer');
            if (container && container.classList.contains('visible')) {
                window.print();
            } else {
                alert('⚠️ Espera a que se cargue el reporte');
            }
        }, 1000);
    }

    // Exportar a CSV
    exportarCSV() {
        try {
            if (this.todasLasCitas.length === 0) {
                alert('⚠️ No hay datos para exportar');
                return;
            }
            
            let csv = 'Fecha,Hora,Servicio,Cliente,Estado,Notas\n';
            
            this.todasLasCitas.forEach(cita => {
                const cliente = cita.usuarios ? cita.usuarios.nombre : 'N/A';
                const notas = cita.notas ? cita.notas.replace(/,/g, ';') : '';
                csv += `${cita.fecha},${cita.hora},${cita.servicio},${cliente},${cita.estado},${notas}\n`;
            });
            
            // Estadísticas
            const total = this.todasLasCitas.length;
            const completadas = this.todasLasCitas.filter(c => c.estado === 'completada').length;
            const pendientes = this.todasLasCitas.filter(c => c.estado === 'pendiente').length;
            const confirmadas = this.todasLasCitas.filter(c => c.estado === 'confirmada').length;
            const canceladas = this.todasLasCitas.filter(c => c.estado === 'cancelada').length;
            
            csv += '\n\nESTADÍSTICAS\n';
            csv += `Total Citas,${total}\n`;
            csv += `Completadas,${completadas}\n`;
            csv += `Pendientes,${pendientes}\n`;
            csv += `Confirmadas,${confirmadas}\n`;
            csv += `Canceladas,${canceladas}\n`;
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `reporte_citas_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            alert('✅ CSV exportado correctamente');
            
        } catch (error) {
            alert(`❌ Error al exportar: ${error.message}`);
            console.error('Error exportando:', error);
        }
    }

    // Imprimir reporte
    imprimir() {
        const container = document.getElementById('reporteContainer');
        const content = document.getElementById('reporteContent');
        
        if (!container || !container.classList.contains('visible') || !content.innerHTML || content.innerHTML.includes('Cargando datos')) {
            alert('⚠️ Primero genera un reporte HTML (botón "Ver Reporte HTML")');
            return;
        }
        
        const ventana = window.open('', '_blank', 'width=1000,height=800');
        if (!ventana) {
            alert('❌ Por favor, permite las ventanas emergentes para imprimir');
            return;
        }
        
        ventana.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte - Salón de Belleza</title>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; padding: 30px; background: white; }
                    @media print { .no-print { display: none !important; } body { padding: 10px; } }
                    .badge {
                        padding: 3px 10px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: bold;
                    }
                    .badge-pendiente { background: #f39c12; color: white; }
                    .badge-confirmada { background: #3498db; color: white; }
                    .badge-completada { background: #2ecc71; color: white; }
                    .badge-cancelada { background: #e74c3c; color: white; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                    }
                    th {
                        background: #34495e;
                        color: white;
                        padding: 10px;
                        text-align: left;
                    }
                    td {
                        padding: 8px;
                        border-bottom: 1px solid #ddd;
                    }
                    tr:nth-child(even) { background: #f8f9fa; }
                    .reporte-stats {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .stat-item {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 8px;
                        text-align: center;
                    }
                    .stat-item h4 {
                        margin: 0;
                        color: #7f8c8d;
                        font-size: 14px;
                    }
                    .stat-item .number {
                        font-size: 24px;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    .reporte-header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 15px;
                    }
                    .reporte-header h2 {
                        color: #2c3e50;
                        margin: 0;
                    }
                    .reporte-footer {
                        text-align: center;
                        margin-top: 20px;
                        color: #7f8c8d;
                        font-size: 12px;
                        border-top: 1px solid #ddd;
                        padding-top: 15px;
                    }
                    .no-print {
                        position: fixed;
                        bottom: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: white;
                        padding: 15px 30px;
                        border-radius: 10px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                        z-index: 1000;
                        display: flex;
                        gap: 10px;
                        border: 1px solid #ddd;
                    }
                    .no-print button {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    }
                    .btn-print { background: #3498db; color: white; }
                    .btn-print:hover { background: #2980b9; }
                    .btn-close { background: #e74c3c; color: white; }
                    .btn-close:hover { background: #c0392b; }
                </style>
            </head>
            <body>
                ${content.innerHTML}
                <div class="no-print">
                    <button onclick="window.print()" class="btn-print">🖨️ Imprimir</button>
                    <button onclick="window.close()" class="btn-close">❌ Cerrar</button>
                </div>
            </body>
            </html>
        `);
        ventana.document.close();
    }
}