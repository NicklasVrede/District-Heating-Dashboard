export function initializeShapes(map) {
    // Add shape images
    const size = 24; // Increased base size from 20 to 24
    
    // Create canvas for shape generation
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Helper function to create and add shapes
    const addShape = (id, drawFunction) => {
        ctx.clearRect(0, 0, size, size);
        drawFunction(ctx, size);
        map.addImage(id, ctx.getImageData(0, 0, size, size));
    };

    // Add circle (for non-network plants)
    addShape('circle', (ctx, size) => {
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 3;
        ctx.stroke();
    });

    // Add square (for network plants) - only border, no fill
    addShape('square', (ctx, size) => {
        const offset = size/14; 
        ctx.strokeStyle = '#404040'; 
        ctx.lineWidth = 3;
        ctx.strokeRect(offset, offset, size - 2*offset, size - 2*offset);
    });
} 