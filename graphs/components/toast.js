export function showToast(message) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "left",
        destination: undefined,
        style: {
            background: "#ff4444",
            borderRadius: "5px",
            position: "absolute",
            zIndex: 999
        },
        offset: {
            x: 300,
            y: 120
        },
        stopOnFocus: false
    }).showToast();
} 