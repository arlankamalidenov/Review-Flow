require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const { google } = require('googleapis');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Configure multer to preserve file extensions for easier ffmpeg handling
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, os.tmpdir())
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });

const writeFileAsync = promisify(fs.writeFile);
const mkdtempAsync = promisify(fs.mkdtemp);
const unlinkAsync = promisify(fs.unlink);

// Google Drive Setup
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const DRIVE_FOLDER_ID = '1_IheR8cKluA-3IZZE8E3tAvvnRMhiNDK';

// Verify credentials on startup
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
    console.log('✅ [Backend] Found OAuth2 credentials in .env');
} else {
    console.error('❌ [Backend] CRITICAL: Missing OAuth2 credentials in .env');
}

async function uploadToGoogleDrive(filePath, fileName) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File to upload does not exist at path: ${filePath}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : '';
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN ? process.env.GOOGLE_REFRESH_TOKEN.trim() : '';

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    console.log(`[Drive] Attempting upload with Client ID: ${clientId.substring(0, 10)}...`);
    console.log(`[Drive] Client Secret length: ${clientSecret.length}`);
    console.log(`[Drive] Refresh Token length: ${refreshToken.length}`);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const fileMetadata = {
        name: fileName,
        parents: [DRIVE_FOLDER_ID],
    };
    const media = {
        mimeType: 'video/mp4',
        body: fs.createReadStream(filePath),
    };

    try {
        console.log(`📤 [Drive] Starting upload for ${fileName}...`);
        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });
        console.log('✅ [Drive] File Uploaded Successfully. ID:', file.data.id);
        return file.data.id;
    } catch (err) {
        console.error('❌ [Drive] Upload Error:', err.message);
        if (err.response) {
            console.error('❌ [Drive] API Error Details:', JSON.stringify(err.response.data, null, 2));
        }
        throw err;
    }
}

// Helper to format ASS timestamp (H:MM:SS.cs)
function formatASSTime(seconds) {
    const pad = (num, size) => ('000' + num).slice(size * -1);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const centis = Math.floor((seconds % 1) * 100);
    return `${hours}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(centis, 2)}`;
}

// Helper to generate ASS content - Simplified
function generateASS(subtitles) {
    const playResX = 1080;
    const playResY = 1920;

    // Style: White text on black background, Eurostile 50px, 900px width
    // Margins: (1080 - 900) / 2 = 90
    const horizontalMargin = 90;
    const fontSize = 50;
    const padding = 24;

    // Colors
    const textColor = '&H00FFFFFF&';  // White (BGR format)
    const backColor = '&HB2000000&';  // 70% Black background
    const outlineColor = '&H00000000&'; // Transparent

    // Style definition
    // Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
    const styleDef = `Style: Default,Eurostile,${fontSize},${textColor},${textColor},${outlineColor},${backColor},-1,0,0,0,100,100,0,0,3,${padding},0,2,${horizontalMargin},${horizontalMargin},150,1`;

    const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleDef}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    // Simple dialogue events - just text, no karaoke
    const events = subtitles.map(sub => {
        const start = formatASSTime(sub.start);
        const end = formatASSTime(sub.end);
        return `Dialogue: 0,${start},${end},Default,,0,0,0,,${sub.text}`;
    }).join('\n');

    return header + events;
}

// Endpoint to upload a video file for processing
app.post('/api/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No video file uploaded' });
    }
    console.log('✅ [Backend] Video uploaded:', req.file.path);
    res.json({
        filePath: req.file.path,
        filename: req.file.filename
    });
});

// Endpoint to extract compressed audio for Whisper
app.post('/api/extract-audio', async (req, res) => {
    const { videoPath } = req.body;

    if (!videoPath || !fs.existsSync(videoPath)) {
        return res.status(400).json({ error: 'Video file not found' });
    }

    const audioPath = videoPath.replace(path.extname(videoPath), '.mp3');

    // Extract audio using native FFmpeg
    // Optimize for Whisper: 16k sample rate, mono
    const args = [
        '-i', videoPath,
        '-vn', // No video
        '-acodec', 'libmp3lame',
        '-ac', '1', // Mono
        '-ar', '16000', // 16k Hz
        '-b:a', '64k', // 64k bitrate
        '-y',
        audioPath
    ];

    console.log('🎤 [Backend] Extracting audio...', args.join(' '));
    const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', args);

    ffmpeg.on('close', (code) => {
        if (code === 0) {
            console.log('✅ [Backend] Audio extraction complete');
            res.download(audioPath, 'audio.mp3', () => {
                // Optional: cleanup audio file, keeping video for later export
                fs.unlink(audioPath, () => { });
            });
        } else {
            console.error('❌ [Backend] FFmpeg audio extraction failed');
            res.status(500).json({ error: 'Audio extraction failed' });
        }
    });

    ffmpeg.stderr.on('data', (data) => console.log(`[FFmpeg] ${data}`));
});


app.post('/export', upload.single('video'), async (req, res) => {
    let tempDir = null;
    try {
        console.log('📥 Received request at /export');
        tempDir = await mkdtempAsync(path.join(os.tmpdir(), 'ffmpeg-export-'));
        const assPath = path.join(tempDir, 'subtitles.ass');
        const outputPath = path.join(tempDir, 'output.mp4');

        const body = req.body;
        const startTime = parseFloat(body.startTime || 0);
        const duration = parseFloat(body.duration || 0);

        let subtitles = JSON.parse(body.subtitles || '[]');
        let style = JSON.parse(body.style || '{}');

        let inputPath = body.inputPath || (req.file ? req.file.path : null);

        if (!inputPath || !fs.existsSync(inputPath)) {
            return res.status(400).json({ error: 'Input video not found' });
        }

        const assContent = generateASS(subtitles, style);
        await writeFileAsync(assPath, assContent);

        const cleanAssPath = assPath.replace(/\\/g, '/');

        const args = [
            '-ss', startTime.toString(),
            '-i', inputPath,
            '-t', duration.toString(),
            '-vf', `crop=ih*9/16:ih,subtitles=filename='${cleanAssPath}'`,
            '-c:v', 'h264_videotoolbox',
            '-b:v', '6000k',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-y',
            outputPath
        ];

        console.log('🎥 [Backend] Running FFmpeg...');
        const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', args);

        ffmpeg.on('close', async (code) => {
            if (code === 0) {
                res.download(outputPath, 'export.mp4', () => {
                    fs.rm(tempDir, { recursive: true, force: true }, () => { });
                });
            } else {
                res.status(500).json({ error: 'FFmpeg failed' });
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// New endpoint to export to Google Drive
app.post('/api/export-to-drive', upload.single('video'), async (req, res) => {
    let tempDir = null;
    try {
        console.log('📥 Received request at /api/export-to-drive');
        tempDir = await mkdtempAsync(path.join(os.tmpdir(), 'ffmpeg-drive-'));
        const assPath = path.join(tempDir, 'subtitles.ass');
        const outputPath = path.join(tempDir, 'output_drive.mp4');

        const body = req.body;
        const startTime = parseFloat(body.startTime || 0);
        const duration = parseFloat(body.duration || 0);

        const rawTitle = body.title || 'video_export';
        const safeTitle = rawTitle.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${safeTitle}.mp4`;

        let subtitles = JSON.parse(body.subtitles || '[]');
        let inputPath = body.inputPath || (req.file ? req.file.path : null);

        if (!inputPath) {
            return res.status(400).json({ error: 'No input video provided (neither file nor inputPath)' });
        }

        if (!fs.existsSync(inputPath)) {
            return res.status(400).json({ error: `Input video file not found at: ${inputPath}` });
        }

        const assContent = generateASS(subtitles);
        await writeFileAsync(assPath, assContent);
        const cleanAssPath = assPath.replace(/\\/g, '/');

        const args = [
            '-ss', startTime.toString(),
            '-i', inputPath,
            '-t', duration.toString(),
            '-vf', `crop=ih*9/16:ih,subtitles=filename='${cleanAssPath}'`,
            '-c:v', 'h264_videotoolbox',
            '-b:v', '8000k',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-y',
            outputPath
        ];

        console.log('🎥 [Backend] Running FFmpeg for Drive Export...', args.join(' '));
        const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', args);

        let ffmpegError = '';
        ffmpeg.stderr.on('data', (data) => {
            ffmpegError += data.toString();
        });

        ffmpeg.on('close', async (code) => {
            if (code === 0) {
                console.log('✅ FFmpeg Success. Verifying output file...');

                if (!fs.existsSync(outputPath)) {
                    console.error('❌ [Critical] FFmpeg finished with 0 but output file is missing at:', outputPath);
                    await fs.rm(tempDir, { recursive: true, force: true }, () => { });
                    return res.status(500).json({ error: 'FFmpeg finished but output file was not created.' });
                }

                const stats = fs.statSync(outputPath);
                console.log(`📦 Output File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

                if (stats.size === 0) {
                    console.error('❌ [Critical] Output file is empty (0 bytes).');
                    await fs.rm(tempDir, { recursive: true, force: true }, () => { });
                    return res.status(500).json({ error: 'FFmpeg output file is empty (0 bytes).' });
                }

                try {
                    const fileId = await uploadToGoogleDrive(outputPath, fileName);

                    // Cleanup
                    await fs.rm(tempDir, { recursive: true, force: true }, () => { });

                    res.json({ success: true, fileId: fileId, message: 'Video exported and uploaded to Drive successfully' });
                } catch (uploadError) {
                    console.error('❌ Upload Phase Failed:', uploadError.message);

                    await fs.rm(tempDir, { recursive: true, force: true }, () => { });

                    // Send detailed error to frontend
                    res.status(500).json({
                        error: 'Failed to upload to Google Drive',
                        details: uploadError.message,
                        apiError: uploadError.response ? uploadError.response.data : null
                    });
                }
            } else {
                console.error('❌ FFmpeg Failed with code:', code);
                console.error('❌ FFmpeg stderr:', ffmpegError);
                await fs.rm(tempDir, { recursive: true, force: true }, () => { });
                res.status(500).json({ error: 'FFmpeg processing failed', details: ffmpegError });
            }
        });

    } catch (error) {
        console.error('❌ Endpoint Exception:', error);
        if (tempDir) {
            fs.rm(tempDir, { recursive: true, force: true }, () => { });
        }
        res.status(500).json({ error: error.message });
    }
});

// Uploads directory for YouTube downloads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir));

// YouTube download endpoint
app.post('/api/download-yt', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    console.log('📥 [yt-dlp] Starting download for:', url);

    try {
        // First, get the filename that will be generated
        const getFilename = spawn('/opt/homebrew/bin/yt-dlp', [
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '--output', path.join(uploadsDir, '%(title)s.%(ext)s'),
            '--get-filename',
            url
        ]);

        let filename = '';
        let errorOutput = '';

        getFilename.stdout.on('data', (data) => {
            filename += data.toString().trim();
        });

        getFilename.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        getFilename.on('close', (code) => {
            if (code !== 0) {
                console.error('❌ [yt-dlp] Failed to get filename:', errorOutput);
                return res.status(500).json({ error: 'Failed to get video info', details: errorOutput });
            }

            console.log('📁 [yt-dlp] Expected filename:', filename);

            // Now download the actual video
            const download = spawn('/opt/homebrew/bin/yt-dlp', [
                '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                '--output', path.join(uploadsDir, '%(title)s.%(ext)s'),
                '--merge-output-format', 'mp4',
                url
            ]);

            let downloadError = '';

            download.stderr.on('data', (data) => {
                const message = data.toString();
                downloadError += message;
                console.log('[yt-dlp]', message);
            });

            download.stdout.on('data', (data) => {
                console.log('[yt-dlp]', data.toString());
            });

            download.on('close', (downloadCode) => {
                if (downloadCode !== 0) {
                    console.error('❌ [yt-dlp] Download failed:', downloadError);
                    return res.status(500).json({ error: 'Download failed', details: downloadError });
                }

                // Ensure .mp4 extension (yt-dlp might output .webm if merge fails)
                let finalPath = filename;
                if (!finalPath.endsWith('.mp4')) {
                    finalPath = finalPath.replace(/\.[^/.]+$/, '.mp4');
                }

                const fileName = path.basename(finalPath);
                const relativePath = `/uploads/${fileName}`;

                console.log('✅ [yt-dlp] Download complete:', finalPath);

                res.json({
                    success: true,
                    filePath: finalPath,
                    fileName: fileName,
                    url: `http://localhost:${port}${relativePath}`
                });
            });
        });

    } catch (error) {
        console.error('❌ [yt-dlp] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`⚡️ [Backend] Server running at http://localhost:${port}`);
});