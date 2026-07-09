// toast.js

let toastContainer;

function ensureToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

/**
 * Display a modern toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', or 'info'
 * @param {string} title - Optional custom title
 */
function showToast(message, type = 'info', title = null) {
    ensureToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-info-circle';
    let defaultTitle = 'Information';

    if (type === 'success') {
        iconClass = 'fa-check-circle';
        defaultTitle = 'Success';
    } else if (type === 'error') {
        iconClass = 'fa-exclamation-circle';
        defaultTitle = 'Error';
    }

    const finalTitle = title || defaultTitle;

    toast.innerHTML = `
        <i class="fas ${iconClass} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${finalTitle}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

    toastContainer.appendChild(toast);

    // Trigger reflow to ensure animation runs
    toast.offsetHeight;
    toast.classList.add('toast-show');

    // Close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        closeToast(toast);
    });

    // Auto dismiss after 3 seconds
    setTimeout(() => {
        closeToast(toast);
    }, 3000);
}

function closeToast(toast) {
    if (toast.classList.contains('toast-hiding')) return;
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hiding');
    
    // Wait for transition to finish before removing from DOM
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 400); // 400ms matches the CSS transition duration
}

// Make it globally available
window.showToast = showToast;
