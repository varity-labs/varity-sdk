// Simple test JavaScript file
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('testBtn');

    if (button) {
        button.addEventListener('click', () => {
            alert('Hello from IPFS! 🚀');
        });
    }

    console.log('Test site loaded successfully');
});
