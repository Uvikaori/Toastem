document.addEventListener('DOMContentLoaded', function() {
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirm_password');
  const form = document.querySelector('form');
  
  form.addEventListener('submit', function(event) {
    if (password.value !== confirmPassword.value) {
      event.preventDefault();
      alert('Las contraseñas no coinciden');
    }
  });
}); 