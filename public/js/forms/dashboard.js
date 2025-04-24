document.addEventListener('DOMContentLoaded', function() {
  // Datos dinámicos para los gráficos
  const procesosData = JSON.parse(document.getElementById('procesosChart').dataset.procesos || '[]');
  const estadoData = JSON.parse(document.getElementById('estadoProcesosChart').dataset.estado || '[]');

  // Gráfico de procesos por mes
  const procesosCtx = document.getElementById('procesosChart').getContext('2d');
  new Chart(procesosCtx, {
    type: 'line',
    data: {
      labels: procesosData.map(d => d.mes),
      datasets: [{
        label: 'Procesos',
        data: procesosData.map(d => d.cantidad),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
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
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)'
        ]
      }]
    },
    options: {
      maintainAspectRatio: false
    }
  });
});