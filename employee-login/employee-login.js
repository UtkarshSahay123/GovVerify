const API_URL = '/api';

// Handle Signup
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        if (confirmPassword && password !== confirmPassword) {
            showToast('Passwords do not match!', "error");
            return;
        }

        const formData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            username: document.getElementById('username').value,
            password: password,
            role: 'employee', // Set based on the portal
            identifier: document.getElementById('employeeId').value
        };

        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (response.ok) {
                showToast(result.message || "Signup successful", "success");
                setTimeout(() => {
                    window.location.href = 'employee-login.html';
                }, 1500);
            } else {
                showToast(result.error || result.message || "Signup failed", "error");
            }
        } catch (error) {
            console.error('Signup Error:', error);
            showToast('Server error. Make sure backend is running.', "error");
        }
    });
}

// Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const captchaInput = document.getElementById('captcha').value.trim();

        if (captchaInput !== currentCaptcha) {
            showToast('Invalid Captcha!', "error");
            return;
        }

        const formData = {
            username: username,
            password: password,
            role: 'employee'
        };

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (response.ok) {
                showToast(result.message || "Login successful!", "success");
                // Save user info for the dashboard
                localStorage.setItem("employeeUsername", username);
                
                // Use a root-relative path
                setTimeout(() => {
                    window.location.href = '/employee-dashboard/employee-dashboard.html';
                }, 1000);
            } else {
                showToast(result.error || result.message || "Invalid username or password!", "error");
            }
        } catch (error) {
            console.error('Login Error:', error);
            showToast('Server error. Make sure backend is running.', "error");
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

// Forgot Password Logic
const forgotPasswordLink = document.getElementById('forgotPassword');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const fpCancelBtn = document.getElementById('fpCancelBtn');
const fpCancelBtn2 = document.getElementById('fpCancelBtn2');
const fpSendOtpBtn = document.getElementById('fpSendOtpBtn');
const fpResetBtn = document.getElementById('fpResetBtn');
const fpStep1 = document.getElementById('fpStep1');
const fpStep2 = document.getElementById('fpStep2');

let resettingEmail = '';

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordModal.style.display = 'flex';
        fpStep1.style.display = 'block';
        fpStep2.style.display = 'none';
        document.getElementById('fpEmail').value = '';
    });
}

function closeFPModal() {
    forgotPasswordModal.style.display = 'none';
}

if (fpCancelBtn) fpCancelBtn.addEventListener('click', closeFPModal);
if (fpCancelBtn2) fpCancelBtn2.addEventListener('click', closeFPModal);

if (fpSendOtpBtn) {
    fpSendOtpBtn.addEventListener('click', async () => {
        const email = document.getElementById('fpEmail').value.trim();
        if (!email) return showToast('Please enter your email ID', "error");
        
        fpSendOtpBtn.disabled = true;
        fpSendOtpBtn.textContent = 'Sending...';

        try {
            const res = await fetch(`${API_URL}/forgot-password/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role: 'employee' })
            });
            const data = await res.json();
            
            if (res.ok) {
                showToast('OTP sent to ' + data.email, "success");
                resettingEmail = data.email;
                fpStep1.style.display = 'none';
                fpStep2.style.display = 'block';
                document.getElementById('fpOtp').value = '';
                document.getElementById('fpNewPassword').value = '';
            } else {
                showToast(data.error || 'Failed to send OTP', "error");
            }
        } catch (err) {
            console.error(err);
            showToast('Error connecting to server', "error");
        } finally {
            fpSendOtpBtn.disabled = false;
            fpSendOtpBtn.textContent = 'Send OTP';
        }
    });
}

if (fpResetBtn) {
    fpResetBtn.addEventListener('click', async () => {
        const otp = document.getElementById('fpOtp').value.trim();
        const newPassword = document.getElementById('fpNewPassword').value;
        const email = document.getElementById('fpEmail').value.trim();
        
        if (!otp || !newPassword) return showToast('Please fill in all fields', "error");
        
        fpResetBtn.disabled = true;
        fpResetBtn.textContent = 'Resetting...';

        try {
            const res = await fetch(`${API_URL}/forgot-password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword, role: 'employee' })
            });
            const data = await res.json();
            
            if (res.ok) {
                showToast('Password reset successfully! You can now login.', "success");
                closeFPModal();
            } else {
                showToast(data.error || 'Failed to reset password', "error");
            }
        } catch (err) {
            console.error(err);
            showToast('Error connecting to server', "error");
        } finally {
            fpResetBtn.disabled = false;
            fpResetBtn.textContent = 'Reset Password';
        }
    });
}
