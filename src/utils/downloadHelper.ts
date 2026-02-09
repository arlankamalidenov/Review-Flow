// ✅ Solid Download Handler - Fixes UUID naming and invisible downloads

export const downloadVideoFile = (blob: Blob, filename?: string): void => {
    const finalFilename = filename || `reel_${Date.now()}.mp4`;

    console.log('🎬 [Download] Initiating download:', finalFilename);
    console.log('📦 [Download] Blob size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('📦 [Download] Blob type:', blob.type);

    // ✅ Create object URL
    const url = URL.createObjectURL(blob);
    console.log('🔗 [Download] Object URL created:', url);

    // ✅ Create anchor element
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = finalFilename;

    // ✅ CRITICAL: Append to body BEFORE clicking
    document.body.appendChild(link);
    console.log('📌 [Download] Link appended to document.body');

    // ✅ Trigger download
    console.log('⬇️ [Download] Triggering click...');
    link.click();
    console.log('✅ [Download] Click triggered');

    // ✅ Cleanup with delay (500ms to ensure browser initiates download)
    setTimeout(() => {
        console.log('🧹 [Download] Cleaning up...');
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('✅ [Download] Cleanup complete');
    }, 500); // Increased from 100ms to 500ms
};

// ✅ Alternative method using FileSaver API (if needed)
export const downloadVideoFileWithFileSaver = async (blob: Blob, filename?: string): Promise<void> => {
    const finalFilename = filename || `reel_${Date.now()}.mp4`;

    try {
        // Check if FileSaver is available
        if ('showSaveFilePicker' in window) {
            // Modern File System Access API
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: finalFilename,
                types: [{
                    description: 'Video File',
                    accept: { 'video/mp4': ['.mp4'] },
                }],
            });

            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();

            console.log('✅ [Download] File saved using File System Access API');
        } else {
            // Fallback to standard download
            downloadVideoFile(blob, finalFilename);
        }
    } catch (error) {
        console.error('❌ [Download] Error:', error);
        // Fallback to standard download
        downloadVideoFile(blob, finalFilename);
    }
};
