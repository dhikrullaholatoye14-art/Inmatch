// admin-login.js
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');

  errorMessage.textContent = ''; // Clear previous errors

  try {
    const response = await fetch('https://inmatch-backend.onrender.com/api/admins/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Log error details for debugging
      console.error('Login failed:', data.message);
      throw new Error(data.message || 'Login failed');
    }

    // Debugging: Ensure token is received
    console.log('Login successful, token:', data.token);

    // Store the token in localStorage
    localStorage.setItem('authToken', data.token);

    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  } catch (error) {
    console.error('Error during login:', error.message);
    errorMessage.textContent = error.message; // Show the error message in the UI
  }
});
