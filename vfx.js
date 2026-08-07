const VFXEngine = {
    preApplyVFX: function(ctx, activeVfxBlocks, canvasW, canvasH, time) {
        if (!activeVfxBlocks || activeVfxBlocks.length === 0) return;

        let shakeX = 0;
        let shakeY = 0;
        let filters = [];

        for (const block of activeVfxBlocks) {
            const effect = block.vfxParams || {};
            
            if (effect.type === 'shake') {
                const intensity = effect.intensity !== undefined ? effect.intensity : 15;
                shakeX += (Math.random() - 0.5) * intensity;
                shakeY += (Math.random() - 0.5) * intensity;
            } else if (effect.type === 'blur') {
                const amount = effect.amount !== undefined ? effect.amount : 10;
                filters.push(`blur(${amount}px)`);
            } else if (effect.type === 'brightness') {
                const amount = effect.amount !== undefined ? effect.amount : 1.5;
                filters.push(`brightness(${amount})`);
            } else if (effect.type === 'contrast') {
                const amount = effect.amount !== undefined ? effect.amount : 1.5;
                filters.push(`contrast(${amount})`);
            } else if (effect.type === 'grayscale') {
                const amount = effect.amount !== undefined ? effect.amount : 1;
                filters.push(`grayscale(${amount})`);
            }
        }

        if (shakeX !== 0 || shakeY !== 0) {
            ctx.translate(shakeX, shakeY);
        }
        
        if (filters.length > 0) {
            ctx.filter = filters.join(' ');
        }
    },

    postApplyVFX: function(ctx, activeVfxBlocks, canvasW, canvasH, time) {
        if (!activeVfxBlocks || activeVfxBlocks.length === 0) return;
        
        // Reset filter and transform for overlays so they cover the whole canvas properly
        ctx.filter = 'none';
        ctx.resetTransform();
        
        let tintColor = null;
        let showCRT = false;
        
        for (const block of activeVfxBlocks) {
            const effect = block.vfxParams || {};
            if (effect.type === 'tint') {
                tintColor = effect.color || 'rgba(255, 0, 0, 0.3)';
            } else if (effect.type === 'crt') {
                showCRT = true;
            }
        }
        
        if (tintColor) {
            ctx.save();
            ctx.fillStyle = tintColor;
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillRect(0, 0, canvasW, canvasH);
            ctx.restore();
        }
        
        if (showCRT) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            for (let y = 0; y < canvasH; y += 4) {
                ctx.fillRect(0, y, canvasW, 1);
            }
            
            // Add slight vignette
            const grad = ctx.createRadialGradient(canvasW/2, canvasH/2, canvasW/4, canvasW/2, canvasH/2, canvasW);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.6)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvasW, canvasH);
            ctx.restore();
        }
    },
    
    availableEffects: [
        { id: 'blur', name: 'Blur', defaultParams: { type: 'blur', amount: 10 } },
        { id: 'brightness', name: 'Brightness', defaultParams: { type: 'brightness', amount: 1.5 } },
        { id: 'contrast', name: 'Contrast', defaultParams: { type: 'contrast', amount: 1.5 } },
        { id: 'grayscale', name: 'Grayscale', defaultParams: { type: 'grayscale', amount: 1 } },
        { id: 'tint', name: 'Color Tint', defaultParams: { type: 'tint', color: 'rgba(255,0,0,0.3)' } },
        { id: 'crt', name: 'CRT Scanlines', defaultParams: { type: 'crt' } },
        { id: 'shake', name: 'Camera Shake', defaultParams: { type: 'shake', intensity: 15 } }
    ]
};
window.VFXEngine = VFXEngine;
