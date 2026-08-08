document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('export-btn');
    if (!exportBtn) return;

    function getFFmpegClass() {
        if (window.FFmpegWASM && window.FFmpegWASM.FFmpeg) {
            return window.FFmpegWASM.FFmpeg;
        }
        if (window.FFmpeg && window.FFmpeg.FFmpeg) {
            return window.FFmpeg.FFmpeg;
        }
        if (typeof window.FFmpeg === 'function') {
            return window.FFmpeg;
        }
        return null;
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                if (existing.dataset.loaded === 'true' || window.FFmpegWASM || window.FFmpegUtil) {
                    return resolve();
                }
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', (err) => reject(err));
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                script.dataset.loaded = 'true';
                resolve();
            };
            script.onerror = (err) => reject(err);
            document.head.appendChild(script);
        });
    }

    async function ensureFFmpegLoaded() {
        let FFmpegClass = getFFmpegClass();
        if (FFmpegClass && window.FFmpegUtil) {
            return { FFmpegClass, FFmpegUtil: window.FFmpegUtil };
        }

        try {
            await Promise.all([
                loadScript('/vendor/ffmpeg/ffmpeg.js'),
                loadScript('/vendor/ffmpeg/ffmpeg-util.js')
            ]);
        } catch (e) {
            console.error('Error loading FFmpeg scripts:', e);
        }

        FFmpegClass = getFFmpegClass();
        return { FFmpegClass, FFmpegUtil: window.FFmpegUtil };
    }

    exportBtn.addEventListener('click', async () => {
        let toast = document.getElementById('export-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'export-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.right = '20px';
            toast.style.backgroundColor = '#2e2e2e';
            toast.style.color = '#f5f5f5';
            toast.style.padding = '12px 18px';
            toast.style.borderRadius = '8px';
            toast.style.border = '1px solid #444';
            toast.style.fontSize = '13px';
            toast.style.fontWeight = '500';
            toast.style.zIndex = '99999';
            toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
            toast.style.transition = 'all 0.2s ease';
            document.body.appendChild(toast);
        }
        toast.style.display = 'block';
        toast.innerText = 'Preparing FFmpeg engine...';

        const state = window.appState;
        if (!state || !state.blocks || state.blocks.length === 0) {
            toast.innerText = 'Timeline is empty. Please add media first.';
            setTimeout(() => { if (toast) toast.remove(); }, 3500);
            return;
        }

        // Restore missing fileObj references from Dexie DB if needed
        if (typeof getAllFilesFromDB === 'function') {
            let savedFiles = null;
            for (const block of state.blocks) {
                if (!block.fileObj && block.type !== 'vfx' && block.name) {
                    if (!savedFiles) savedFiles = await getAllFilesFromDB();
                    const found = savedFiles.find(sf => sf.name === block.name);
                    if (found && found.file) {
                        block.fileObj = found.file;
                    }
                }
            }
        }

        const uniqueFiles = new Map();
        for (const block of state.blocks) {
            if (block.fileObj && !uniqueFiles.has(block.fileObj.name)) {
                uniqueFiles.set(block.fileObj.name, block.fileObj);
            }
        }

        if (uniqueFiles.size === 0) {
            toast.innerText = 'No media files found on timeline.';
            setTimeout(() => { if (toast) toast.remove(); }, 3500);
            return;
        }

        let maxEndTime = 0;
        for (const block of state.blocks) {
            const end = block.x + block.w;
            if (end > maxEndTime) maxEndTime = end;
        }
        const totalDurationSec = (maxEndTime / 100).toFixed(2);

        if (parseFloat(totalDurationSec) <= 0) {
            toast.innerText = 'Timeline duration is 0 seconds.';
            setTimeout(() => { if (toast) toast.remove(); }, 3500);
            return;
        }

        try {
            toast.innerText = 'Loading FFmpeg WASM module...';
            const { FFmpegClass, FFmpegUtil } = await ensureFFmpegLoaded();

            if (!FFmpegClass) {
                toast.innerText = 'FFmpeg engine failed to load. Please check your internet connection.';
                setTimeout(() => { if (toast) toast.remove(); }, 4000);
                return;
            }

            const ffmpeg = new FFmpegClass();

            ffmpeg.on('log', ({ message }) => {
                console.log('[ffmpeg]', message);
            });

            ffmpeg.on('progress', ({ progress }) => {
                const pct = Math.round(progress * 100);
                if (toast) toast.innerText = `Exporting: ${Math.min(100, Math.max(0, pct))}%`;
            });

            const { toBlobURL, fetchFile } = FFmpegUtil || {};
            const baseURL = '/vendor/ffmpeg';

            let coreURL, wasmURL;
            if (toBlobURL) {
                try {
                    toast.innerText = 'Initializing WASM core binaries...';
                    coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
                    wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
                } catch (err) {
                    console.warn('toBlobURL error, falling back to direct URLs', err);
                    coreURL = `${baseURL}/ffmpeg-core.js`;
                    wasmURL = `${baseURL}/ffmpeg-core.wasm`;
                }
            } else {
                coreURL = `${baseURL}/ffmpeg-core.js`;
                wasmURL = `${baseURL}/ffmpeg-core.wasm`;
            }

            await ffmpeg.load({ coreURL, wasmURL });

            toast.innerText = 'Processing media files...';
            for (const [name, file] of uniqueFiles.entries()) {
                let fileData;
                if (fetchFile) {
                    fileData = await fetchFile(file);
                } else {
                    const arrayBuffer = await file.arrayBuffer();
                    fileData = new Uint8Array(arrayBuffer);
                }
                await ffmpeg.writeFile(name, fileData);
            }

            let filterComplex = '';
            let inputs = [];
            let inputIdx = 0;
            const blockInputs = [];

            for (const block of state.blocks) {
                if (!block.fileObj) continue;
                inputs.push('-i');
                inputs.push(block.fileObj.name);
                blockInputs.push({ ...block, inputIdx });
                inputIdx++;
            }

            const projW = state.projectWidth || 1920;
            const projH = state.projectHeight || 1080;
            const fps = state.fps || 30;

            filterComplex += `color=c=black:s=${projW}x${projH}:r=${fps}:d=${totalDurationSec} [bg];`;

            let lastOverlay = '[bg]';
            let overlayIdx = 1;
            let audioStreams = [];

            const makeEven = (n) => {
                const r = Math.round(n);
                return r % 2 === 0 ? r : r + 1;
            };

            for (const b of blockInputs) {
                if (b.type === 'video' || b.type === 'image') {
                    const startSec = (b.x / 100).toFixed(2);
                    const durSec = (b.w / 100).toFixed(2);
                    const sourceOffsetSec = ((b.sourceOffset || 0) / 100).toFixed(2);

                    const outW = makeEven(b.mediaW || projW);
                    const outH = makeEven(b.mediaH || projH);
                    const outX = Math.round(b.mediaX || 0);
                    const outY = Math.round(b.mediaY || 0);

                    if (b.type === 'video') {
                        filterComplex += `[${b.inputIdx}:v] trim=start=${sourceOffsetSec}:duration=${durSec},setpts=PTS-STARTPTS,scale=${outW}:${outH},setsar=1 [v${b.inputIdx}]; `;
                    } else {
                        // Image
                        filterComplex += `[${b.inputIdx}:v] loop=loop=-1:size=1,setpts=N/FRAME_RATE/TB,trim=duration=${durSec},scale=${outW}:${outH},setsar=1 [v${b.inputIdx}]; `;
                    }

                    const endSec = (parseFloat(startSec) + parseFloat(durSec)).toFixed(2);
                    filterComplex += `${lastOverlay}[v${b.inputIdx}] overlay=x=${outX}:y=${outY}:enable='between(t,${startSec},${endSec})' [ov${overlayIdx}]; `;
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

            toast.innerText = 'Encoding video with FFmpeg...';

            const ffmpegArgs = [
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
                '-pix_fmt', 'yuv420p',
                '-preset', 'ultrafast',
                'output.mp4'
            );

            await ffmpeg.exec(ffmpegArgs);

            toast.innerText = 'Preparing download...';
            const data = await ffmpeg.readFile('output.mp4');
            const blob = new Blob([data.buffer || data], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'export.mp4';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            toast.innerText = 'Export Complete!';
            setTimeout(() => { if (toast) toast.remove(); }, 4000);
        } catch (e) {
            console.error("Export Error:", e);
            if (toast) {
                toast.innerText = 'Export Failed. Check console for details.';
                setTimeout(() => { if (toast) toast.remove(); }, 4000);
            }
        }
    });
});

