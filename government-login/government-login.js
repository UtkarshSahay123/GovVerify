const API_URL = 'http://localhost:8080/api/auth';

// Handle Signup
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const formData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            username: document.getElementById('username').value,
            password: password,
            role: 'GOVERNMENT',
            identifier: document.getElementById('identifier').value
        };

        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.text();
            if (response.ok) {
                alert(result);
                window.location.href = 'government-login.html';
            } else {
                alert(result);
            }
        } catch (error) {
            console.error('Signup Error:', error);
            alert('Server error. Make sure backend is running on port 8080.');
        }
    });
}

// Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            role: 'GOVERNMENT'
        };

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.text();
            if (response.ok) {
                alert('✅ ' + result);
                window.location.href = '../government-dashboard/government-dashboard.html';
            } else {
                alert('❌ ' + result);
            }
        } catch (error) {
            console.error('Login Error:', error);
            alert('Server error. Make sure backend is running on port 8080.');
        }
    });
}
