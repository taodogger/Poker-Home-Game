class ToastManager {
    static container;
    static queue = [];
    static isProcessing = false;

    static initialize() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    static show(message, type = 'success', duration = 3000) {
        this.initialize();
        this.queue.push({ message, type, duration });
        
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    static async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const { message, type, duration } = this.queue.shift();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        // Add to container
        this.container.appendChild(toast);

        // Trigger entrance animation
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Remove after duration
        await new Promise(resolve => setTimeout(resolve, duration));

        // Exit animation
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';

        // Remove element after animation
        await new Promise(resolve => setTimeout(resolve, 300));
        if (toast.parentNode) {
            toast.remove();
        }

        // Process next toast
        this.processQueue();
    }

    static success(message, duration) {
        this.show(message, 'success', duration);
    }

    static error(message, duration) {
        this.show(message, 'error', duration);
    }

    static warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    static info(message, duration) {
        this.show(message, 'info', duration);
    }
}

// Add toast styles to document
const style = document.createElement('style');
style.textContent = `
    .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
    }

    .toast {
        padding: 12px 24px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        min-width: 200px;
        max-width: 400px;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        pointer-events: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .toast.success {
        background: linear-gradient(135deg, #4CAF50, #45a049);
    }

    .toast.error {
        background: linear-gradient(135deg, #f44336, #d32f2f);
    }

    .toast.warning {
        background: linear-gradient(135deg, #ff9800, #f57c00);
    }

    .toast.info {
        background: linear-gradient(135deg, #2196f3, #1976d2);
    }

    @media (max-width: 480px) {
        .toast-container {
            top: auto;
            bottom: 20px;
            left: 20px;
            right: 20px;
        }

        .toast {
            width: 100%;
            max-width: none;
            text-align: center;
        }
    }
`;

document.head.appendChild(style);

export default ToastManager; 