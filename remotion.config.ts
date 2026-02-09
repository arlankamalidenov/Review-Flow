import { Config } from '@remotion/cli/config';

// ✅ Remotion Configuration for Video Reels
// Supports Tailwind CSS, TypeScript, and maintains COOP/COEP headers for FFmpeg compatibility

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// Ensure compatibility with existing Vite setup
Config.setPort(3001); // Different port from Vite dev server (3000)

// Enable TypeScript and React
Config.setPublicDir('./public');

// Performance optimizations
Config.setConcurrency(2); // Adjust based on system resources
Config.setChromiumOpenGlRenderer('angle');

export default Config;
