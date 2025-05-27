document.addEventListener('DOMContentLoaded', function() {
  // Datos dinámicos para los gráficos
  const procesosData = JSON.parse(document.getElementById('procesosChart').dataset.procesos || '[]');
  const estadoData = JSON.parse(document.getElementById('estadoProcesosChart').dataset.estado || '[]');
  const tipoProcesoData = JSON.parse(document.getElementById('tipoProcesoChart').dataset.tipoproceso || '[]');

  // Gráfico de procesos por mes
  const procesosCtx = document.getElementById('procesosChart').getContext('2d');
  new Chart(procesosCtx, {
    type: 'line',
    data: {
      labels: procesosData.map(d => d.mes),
      datasets: [{
        label: 'Lotes',
        data: procesosData.map(d => d.cantidad),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Cantidad de Lotes'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Mes'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        title: {
          display: true,
          text: 'Lotes Registrados por Mes'
        }
      }
    }
  });

  // Gráfico de estado de procesos
  const estadoCtx = document.getElementById('estadoProcesosChart').getContext('2d');
  new Chart(estadoCtx, {
    type: 'doughnut',
    data: {
      labels: estadoData.map(d => d.estado),
      datasets: [{
        data: estadoData.map(d => d.cantidad),
        backgroundColor: [
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(255, 205, 86)',
          'rgb(255, 99, 132)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Distribución de Lotes por Estado'
        }
      }
    }
  });

  // Gráfico de tipo de proceso
  if (document.getElementById('tipoProcesoChart')) {
    const tipoProcesoCtx = document.getElementById('tipoProcesoChart').getContext('2d');
    new Chart(tipoProcesoCtx, {
      type: 'bar',
      data: {
        labels: tipoProcesoData.map(d => d.proceso),
        datasets: [{
          label: 'Lotes en Proceso',
          data: tipoProcesoData.map(d => d.cantidad),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad de Lotes'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Tipo de Proceso'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Lotes por Tipo de Proceso'
          }
        }
      }
    });
  }

  // Formatear números con separador de miles
  document.querySelectorAll('.format-number').forEach(function(el) {
    const value = parseFloat(el.textContent);
    if (!isNaN(value)) {
      el.textContent = value.toLocaleString('es-CO');
    }
  });

  // Formatear valores monetarios
  document.querySelectorAll('.format-currency').forEach(function(el) {
    const value = parseFloat(el.textContent);
    if (!isNaN(value)) {
      el.textContent = value.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    }
  });
});