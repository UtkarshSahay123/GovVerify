const API_URL = '/api';

// Handle Signup
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const identifier = document.getElementById('employeeId').value.trim();
        
        const captchaInput = document.getElementById('captcha').value.trim();
        
        if (captchaInput !== currentCaptcha) {
            showToast('Invalid Captcha!', 'error');
            return;
        }

        if (confirmPassword && password !== confirmPassword) {
            showToast('Passwords do not match!', 'error');
            return;
        }

        const formData = {
            fullName: fullName,
            email: email,
            username: username,
            password: password,
            role: 'employee', // Role for this portal
            identifier: identifier
        };

        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.text();
            if (response.ok) {
                showToast(result, 'success');
                setTimeout(() => window.location.href = 'employee-login.html', 1500);
            } else {
                let errorMsg = result;
                try {
                    const json = JSON.parse(result);
                    errorMsg = json.error || result;
                } catch(e) {}
                showToast(errorMsg, 'error');
            }
        } catch (error) {
            console.error('Signup Error:', error);
            showToast('Server error. Make sure backend is running.', 'error');
        }
    });
}
// Captcha Logic
function generateCaptcha() {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars[Math.floor(Math.random() * chars.length)];
    }
    const display = document.getElementById('captchaDisplay');
    if (display) display.textContent = captcha;
    return captcha;
}

let currentCaptcha = generateCaptcha();

const refreshBtn = document.getElementById('refreshCaptcha');
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        currentCaptcha = generateCaptcha();
    });
}
