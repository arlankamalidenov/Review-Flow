const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

const upload = multer({ dest: os.tmpdir() });

const writeFileAsync = promisify(fs.writeFile);
const mkdtempAsync = promisify(fs.mkdtemp);

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

app.listen(port, () => {
    console.log(`⚡️ [Backend] Server running at http://localhost:${port}`);
});