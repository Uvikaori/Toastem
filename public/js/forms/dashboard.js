document.addEventListener('DOMContentLoaded', function() {
  // Gráfico de procesos por mes
  const procesosCtx = document.getElementById('procesosChart').getContext('2d');
  new Chart(procesosCtx, {
    type: 'line',
    data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{
        label: 'Procesos',
        data: [0, 0, 0, 0, 0, 0],
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
      labels: ['Completados', 'En Curso', 'Pendientes'],
      datasets: [{
        data: [0, 0, 0],
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