document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('export-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', async () => {
        if (typeof window.FFmpeg === 'undefined') {
            alert('FFmpeg not loaded yet.');
            return;
        }

        const state = window.appState;
        if (!state) return;

        const blocks = state.blocks;
        if (!blocks || blocks.length === 0) {
            alert('Timeline is empty.');
            return;
        }

        const uniqueFiles = new Map();
        for (const block of blocks) {
            if (block.fileObj && !uniqueFiles.has(block.fileObj.name)) {
                uniqueFiles.set(block.fileObj.name, block.fileObj);
            }
        }

        if (uniqueFiles.size === 0) {
            alert('No media files found on timeline with actual data.');
            return;
        }

        let maxEndTime = 0;
        for (const block of blocks) {
            const end = block.x + block.w;
            if (end > maxEndTime) maxEndTime = end;
        }
        const totalDurationSec = (maxEndTime / 100).toFixed(2);

        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.backgroundColor = '#2e2e2e';
        toast.style.color = '#f5f5f5';
        toast.style.padding = '15px';
        toast.style.borderRadius = '8px';
        toast.style.zIndex = '9999';
        toast.innerText = 'Initializing Export...';
        document.body.appendChild(toast);

        try {
            const { FFmpeg } = window.FFmpeg;
            const ffmpeg = new FFmpeg();

            ffmpeg.on('log', ({ message }) => {
                console.log('[ffmpeg]', message);
            });
            ffmpeg.on('progress', ({ progress, time }) => {
                toast.innerText = `Exporting: ${Math.round(progress * 100)}%`;
            });

            await ffmpeg.load({
                coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
                wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm'
            });

            for (const [name, file] of uniqueFiles.entries()) {
                const arrayBuffer = await file.arrayBuffer();
                await ffmpeg.writeFile(name, new Uint8Array(arrayBuffer));
            }

            let filterComplex = '';
            let inputs = [];
            let inputIdx = 0;
            const blockInputs = [];
            
            for (const block of blocks) {
                if (!block.fileObj) continue;
                inputs.push(`-i`);
                inputs.push(block.fileObj.name);
                blockInputs.push({ ...block, inputIdx });
                inputIdx++;
            }

            filterComplex += `color=c=black:s=${state.projectWidth || 1920}x${state.projectHeight || 1080}:r=${state.fps || 30}:d=${totalDurationSec} [bg];`;
            
            let lastOverlay = '[bg]';
            let overlayIdx = 1;
            
            let audioStreams = [];
            
            for (const b of blockInputs) {
                if (b.type === 'video' || b.type === 'image') {
                    const startSec = (b.x / 100).toFixed(2);
                    const durSec = (b.w / 100).toFixed(2);
                    const sourceOffsetSec = ((b.sourceOffset || 0) / 100).toFixed(2);
                    
                    const outW = Math.round(b.mediaW || state.projectWidth || 1920);
                    const outH = Math.round(b.mediaH || state.projectHeight || 1080);
                    const outX = Math.round(b.mediaX || 0);
                    const outY = Math.round(b.mediaY || 0);
                    
                    if (b.type === 'video') {
                        filterComplex += `[${b.inputIdx}:v] trim=start=${sourceOffsetSec}:duration=${durSec},setpts=PTS-STARTPTS,scale=${outW}:${outH} [v${b.inputIdx}]; `;
                    } else {
                        // Image
                        filterComplex += `[${b.inputIdx}:v] loop=loop=-1:size=1,setpts=N/FRAME_RATE/TB,trim=duration=${durSec},scale=${outW}:${outH} [v${b.inputIdx}]; `;
                    }
                    
                    filterComplex += `${lastOverlay}[v${b.inputIdx}] overlay=x=${outX}:y=${outY}:enable='between(t,${startSec},${parseFloat(startSec)+parseFloat(durSec)})' [ov${overlayIdx}]; `;
                    lastOverlay = `[ov${overlayIdx}]`;
                    overlayIdx++;
                }
                
                if (b.type === 'audio') {
                    const startMs = Math.round((b.x / 100) * 1000);
                    const durSec = (b.w / 100).toFixed(2);
                    const sourceOffsetSec = ((b.sourceOffset || 0) / 100).toFixed(2);
                    
                    filterComplex += `[${b.inputIdx}:a] atrim=start=${sourceOffsetSec}:duration=${durSec},asetpts=PTS-STARTPTS,adelay=${startMs}|${startMs} [a${b.inputIdx}]; `;
                    audioStreams.push(`[a${b.inputIdx}]`);
                }
            }
            
            let audioMap = '';
            if (audioStreams.length > 0) {
                filterComplex += `${audioStreams.join('')} amix=inputs=${audioStreams.length}:duration=longest [aout]; `;
                audioMap = '[aout]';
            }
            
            if (filterComplex.endsWith('; ')) {
                filterComplex = filterComplex.slice(0, -2);
            }

            toast.innerText = 'Encoding video...';
            
            let ffmpegArgs = [
                ...inputs,
                '-filter_complex', filterComplex,
                '-map', lastOverlay
            ];
            
            if (audioMap) {
                ffmpegArgs.push('-map', audioMap);
            }
            
            ffmpegArgs.push(
                '-t', totalDurationSec.toString(),
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                'output.mp4'
            );
            
            await ffmpeg.exec(ffmpegArgs);

            const data = await ffmpeg.readFile('output.mp4');
            const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'export.mp4';
            a.click();
            
            toast.innerText = 'Export Complete!';
            setTimeout(() => toast.remove(), 3000);
        } catch (e) {
            console.error("Export Error:", e);
            toast.innerText = 'Export Failed. See console.';
            setTimeout(() => toast.remove(), 3000);
        }
    });
});
