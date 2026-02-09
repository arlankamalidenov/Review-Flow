import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Image as ImageIcon, Sparkles, Sliders } from 'lucide-react';
import { toPng } from 'html-to-image';
import ColorThief from 'colorthief';

interface CoverData {
    title: string;
    description: string;
    image: string | null;
    accentColor: string;
    subtitleBottom: number;
    titleSpacing: number;
    desktopTitleBottom: number;
    storyTitleFontSize: number;
    desktopTitleFontSize: number;
    imagePosition: string;
    imagePositionX: number;
    imagePositionY: number;
}

export const CoverLab: React.FC = () => {
    const [coverData, setCoverData] = useState<CoverData>({
        title: 'НАВИГАЦИЯ - ПОСТОЯННЫЙ КОНТРОЛЬ',
        description: '3-й помощник капитана Leo о работе на контейнеровозе',
        image: null,
        accentColor: '#BA0C2F',
        subtitleBottom: 190,
        titleSpacing: 130,
        desktopTitleBottom: 150,
        storyTitleFontSize: 115,
        desktopTitleFontSize: 140,
        imagePosition: 'center center',
        imagePositionX: 50,
        imagePositionY: 50
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const storyRef = useRef<HTMLDivElement>(null);
    const desktopRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load custom fonts
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/fonts/cover-fonts.css';
        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link);
        };
    }, []);

    const extractColor = useCallback(async (imageUrl: string) => {
        return new Promise<string>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = imageUrl;

            img.onload = () => {
                const colorThief = new ColorThief();
                try {
                    const color = colorThief.getColor(img);
                    const hexColor = `#${color.map((c: number) => c.toString(16).padStart(2, '0')).join('')}`;
                    resolve(hexColor);
                } catch (error) {
                    console.error('Color extraction failed:', error);
                    resolve('#BA0C2F');
                }
            };

            img.onerror = () => {
                resolve('#BA0C2F');
            };
        });
    }, []);

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = async (event) => {
            const imageUrl = event.target?.result as string;
            const accentColor = await extractColor(imageUrl);

            setCoverData(prev => ({
                ...prev,
                image: imageUrl,
                accentColor
            }));

            setIsProcessing(false);
        };

        reader.readAsDataURL(file);
    }, [extractColor]);

    const handleDownload = useCallback(async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
        if (!ref.current) return;

        try {
            setIsProcessing(true);

            // Store original transform
            const originalTransform = ref.current.style.transform;
            const originalTransformOrigin = ref.current.style.transformOrigin;

            // Temporarily remove scaling for full-size capture
            ref.current.style.transform = 'none';
            ref.current.style.transformOrigin = 'initial';

            // Get the actual dimensions
            const width = parseInt(ref.current.style.width || '1920');
            const height = parseInt(ref.current.style.height || '1080');

            const dataUrl = await toPng(ref.current, {
                quality: 1.0,
                pixelRatio: 1,
                cacheBust: true,
                width,
                height
            });

            // Restore original transform
            ref.current.style.transform = originalTransform;
            ref.current.style.transformOrigin = originalTransformOrigin;

            // Ensure filename has .png extension
            const finalFilename = filename.endsWith('.png') ? filename : `${filename}.png`;

            console.log('🎨 Initiating cover download:', finalFilename);

            // Create download link
            const link = document.createElement('a');
            link.style.display = 'none'; // Hide the link
            link.href = dataUrl;
            link.download = finalFilename;

            // Step 1: Add to DOM (critical for macOS)
            document.body.appendChild(link);

            console.log('⬇️ Download command sent to browser...');

            // Step 2: Trigger download
            link.click();

            // Step 3: Cleanup with delay
            setTimeout(() => {
                document.body.removeChild(link);
                console.log('✅ Cover successfully transferred to system download manager');
            }, 100);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to generate image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 md:ml-64">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
            >
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cover Lab</h1>
                    </div>
                    <p className="text-slate-500 font-medium">Create stunning social media covers with auto-extracted colors</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6 space-y-6">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5" />
                                Cover Settings
                            </h2>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Hero Image</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessing}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-600">
                                        {coverData.image ? 'Change Image' : 'Upload Image'}
                                    </span>
                                </button>
                                {coverData.image && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-3 rounded-lg overflow-hidden border border-slate-200"
                                    >
                                        <img src={coverData.image} alt="Preview" className="w-full h-32 object-cover" />
                                    </motion.div>
                                )}
                            </div>

                            {/* Title Input */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                                <textarea
                                    value={coverData.title}
                                    onChange={(e) => setCoverData(prev => ({ ...prev, title: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                                    placeholder="Enter cover title..."
                                />
                            </div>

                            {/* Description Input */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                <textarea
                                    value={coverData.description}
                                    onChange={(e) => setCoverData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                                    placeholder="Enter description..."
                                />
                            </div>

                            {/* Accent Color Control */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Accent Color</label>
                                <div className="space-y-2">
                                    {/* Color Picker */}
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={coverData.accentColor}
                                            onChange={(e) => setCoverData(prev => ({ ...prev, accentColor: e.target.value }))}
                                            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-200 hover:border-[#BA0C2F] transition-colors"
                                            title="Choose accent color"
                                        />
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={coverData.accentColor}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Allow typing # and hex characters
                                                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                                                        setCoverData(prev => ({ ...prev, accentColor: value }));
                                                    }
                                                }}
                                                placeholder="#BA0C2F"
                                                className="w-full px-3 py-2 font-mono text-sm text-slate-700 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#BA0C2F] focus:border-transparent outline-none"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">Auto-extracted from image or choose manually</p>
                                </div>
                            </div>

                            {/* Image Position Control */}
                            {coverData.image && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Image Position</label>
                                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        {[
                                            { label: 'Left Top', value: 'left top', x: 0, y: 0 },
                                            { label: 'Center Top', value: 'center top', x: 50, y: 0 },
                                            { label: 'Right Top', value: 'right top', x: 100, y: 0 },
                                            { label: 'Left Center', value: 'left center', x: 0, y: 50 },
                                            { label: 'Center Center', value: 'center center', x: 50, y: 50 },
                                            { label: 'Right Center', value: 'right center', x: 100, y: 50 },
                                            { label: 'Left Bottom', value: 'left bottom', x: 0, y: 100 },
                                            { label: 'Center Bottom', value: 'center bottom', x: 50, y: 100 },
                                            { label: 'Right Bottom', value: 'right bottom', x: 100, y: 100 }
                                        ].map((position) => (
                                            <button
                                                key={position.value}
                                                onClick={() => setCoverData(prev => ({
                                                    ...prev,
                                                    imagePosition: position.value,
                                                    imagePositionX: position.x,
                                                    imagePositionY: position.y
                                                }))}
                                                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${coverData.imagePosition === position.value
                                                    ? 'bg-[#BA0C2F] text-white shadow-sm'
                                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                    }`}
                                            >
                                                {position.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Adjust image focal point</p>

                                    {/* Fine-tune Position with Sliders */}
                                    <div className="mt-4 space-y-3">
                                        <p className="text-xs font-medium text-slate-600">Fine-tune Position:</p>

                                        {/* X Position Slider */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs font-medium text-slate-600">Horizontal (X):</label>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={coverData.imagePositionX}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            setCoverData(prev => ({
                                                                ...prev,
                                                                imagePositionX: Math.min(100, Math.max(0, val)),
                                                                imagePosition: 'custom'
                                                            }));
                                                        }}
                                                        className="w-14 px-2 py-1 text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#BA0C2F] focus:border-transparent outline-none text-center"
                                                    />
                                                    <span className="text-xs text-slate-500">%</span>
                                                </div>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={coverData.imagePositionX}
                                                onChange={(e) => setCoverData(prev => ({
                                                    ...prev,
                                                    imagePositionX: parseInt(e.target.value),
                                                    imagePosition: 'custom'
                                                }))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#BA0C2F]"
                                            />
                                        </div>

                                        {/* Y Position Slider */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs font-medium text-slate-600">Vertical (Y):</label>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={coverData.imagePositionY}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            setCoverData(prev => ({
                                                                ...prev,
                                                                imagePositionY: Math.min(100, Math.max(0, val)),
                                                                imagePosition: 'custom'
                                                            }));
                                                        }}
                                                        className="w-14 px-2 py-1 text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#BA0C2F] focus:border-transparent outline-none text-center"
                                                    />
                                                    <span className="text-xs text-slate-500">%</span>
                                                </div>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={coverData.imagePositionY}
                                                onChange={(e) => setCoverData(prev => ({
                                                    ...prev,
                                                    imagePositionY: parseInt(e.target.value),
                                                    imagePosition: 'custom'
                                                }))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#BA0C2F]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Layout Controls */}
                            <div className="pt-4 border-t border-slate-200">
                                <h3 className="text-sm font-bold text-slate-700 mb-4">Layout Controls</h3>

                                {/* Subtitle Bottom Spacing */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-slate-600">
                                            Subtitle Bottom Spacing:
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min="50"
                                                max="400"
                                                value={coverData.subtitleBottom}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 50;
                                                    setCoverData(prev => ({
                                                        ...prev,
                                                        subtitleBottom: Math.min(400, Math.max(50, val))
                                                    }));
                                                }}
                                                className="w-16 px-2 py-1 text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#BA0C2F] focus:border-transparent outline-none text-center"
                                            />
                                            <span className="text-xs text-slate-500">px</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="400"
                                        value={coverData.subtitleBottom}
                                        onChange={(e) => setCoverData(prev => ({ ...prev, subtitleBottom: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#BA0C2F]"
                                    />
                                </div>

                                {/* Title Spacing */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-slate-600">
                                            Title Spacing (Stories):
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min="50"
                                                max="300"
                                                value={coverData.titleSpacing}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 50;
                                                    setCoverData(prev => ({
                                                        ...prev,
                                                        titleSpacing: Math.min(300, Math.max(50, val))
                                                    }));
                                                }}
                                                className="w-16 px-2 py-1 text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#BA0C2F] focus:border-transparent outline-none text-center"
                                            />
                                            <span className="text-xs text-slate-500">px</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="300"
                                        value={coverData.titleSpacing}
                                        onChange={(e) => setCoverData(prev => ({ ...prev, titleSpacing: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#BA0C2F]"
                                    />
                                </div>

                                {/* Desktop Title Bottom Spacing */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-slate-600">
                                            Title Bottom (Desktop):
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min="50"
                                                max="400"
                                                value={coverData.desktopTitleBottom}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 50;
                                                    setCoverData(prev => ({
                                                        ...prev,
                                                        desktopTitleBottom: Math.min(400, Math.max(50, val))
                                                    }));
                                                }}
                                                className="w-16 px-2 py-1 text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#BA0C2F] focus:border-transparent outline-none text-center"
                                            />
                                            <span className="text-xs text-slate-500">px</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="400"
                                        value={coverData.desktopTitleBottom}
                                        onChange={(e) => setCoverData(prev => ({ ...prev, desktopTitleBottom: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#BA0C2F]"
                                    />
                                </div>

                                {/* Story Title Font Size */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-slate-600">
                                            Title Font Size (Stories):
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min="60"
                                                max="200"
                                                value={coverData.storyTitleFontSize}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 60;
                                                    setCoverData(prev => ({
                                                        ...prev,
                                                        storyTitleFontSize: Math.min(200, Math.max(60, val))
                                                    }));
                                                }}
                                                className="w-16 px-2 py-1 text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#BA0C2F] focus:border-transparent outline-none text-center"
                                            />
                                            <span className="text-xs text-slate-500">px</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="60"
                                        max="200"
                                        value={coverData.storyTitleFontSize}
                                        onChange={(e) => setCoverData(prev => ({ ...prev, storyTitleFontSize: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#BA0C2F]"
                                    />
                                </div>

                                {/* Desktop Title Font Size */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-slate-600">
                                            Title Font Size (Desktop):
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min="80"
                                                max="250"
                                                value={coverData.desktopTitleFontSize}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 80;
                                                    setCoverData(prev => ({
                                                        ...prev,
                                                        desktopTitleFontSize: Math.min(250, Math.max(80, val))
                                                    }));
                                                }}
                                                className="w-16 px-2 py-1 text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#BA0C2F] focus:border-transparent outline-none text-center"
                                            />
                                            <span className="text-xs text-slate-500">px</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="80"
                                        max="250"
                                        value={coverData.desktopTitleFontSize}
                                        onChange={(e) => setCoverData(prev => ({ ...prev, desktopTitleFontSize: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#BA0C2F]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="lg:col-span-2">
                        <div className="space-y-8">
                            {/* Instagram Story Preview */}
                            <AnimatePresence>
                                {coverData.image && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Instagram Story</h3>
                                                <p className="text-sm text-slate-500">1080 × 1920 px</p>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(storyRef, 'instagram-story.png')}
                                                disabled={isProcessing}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#BA0C2F] text-white rounded-xl hover:bg-[#9A0A26] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span className="text-sm font-medium">Download</span>
                                            </button>
                                        </div>

                                        <div className="flex justify-center">
                                            <div className="relative" style={{ width: '270px', height: '480px' }}>
                                                <StoryTemplate ref={storyRef} data={coverData} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Desktop Cover Preview */}
                            <AnimatePresence>
                                {coverData.image && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Desktop Cover</h3>
                                                <p className="text-sm text-slate-500">1680 × 1288 px</p>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(desktopRef, 'desktop-cover.png')}
                                                disabled={isProcessing}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#BA0C2F] text-white rounded-xl hover:bg-[#9A0A26] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span className="text-sm font-medium">Download</span>
                                            </button>
                                        </div>

                                        <div className="w-full">
                                            <DesktopTemplate ref={desktopRef} data={coverData} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Empty State */}
                            {!coverData.image && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center"
                                >
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <ImageIcon className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Upload an image to get started</h3>
                                    <p className="text-slate-500">Your cover previews will appear here</p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// Helper function to get image position
const getImagePosition = (data: CoverData): string => {
    // If using custom position (sliders), use percentage values
    if (data.imagePosition === 'custom') {
        return `${data.imagePositionX}% ${data.imagePositionY}%`;
    }
    // Otherwise use preset position
    return data.imagePosition;
};

// Story Template Component (1080x1920)
const StoryTemplate = React.forwardRef<HTMLDivElement, { data: CoverData }>(({ data }, ref) => {
    return (
        <div
            ref={ref}
            className="relative w-full h-full overflow-hidden rounded-lg shadow-lg"
            style={{
                width: '1080px',
                height: '1920px',
                transform: 'scale(0.25)',
                transformOrigin: 'top left'
            }}
        >
            {/* Background Image */}
            {data.image && (
                <img
                    src={data.image}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: getImagePosition(data) }}
                />
            )}

            {/* Gradient Overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 50%, ${data.accentColor}dd 100%)`
                }}
            />

            {/* Content Container - Flexbox Layout */}
            <div
                className="absolute inset-0 flex flex-col justify-end items-center"
                style={{ paddingBottom: `${data.subtitleBottom}px` }}
            >
                {/* Title - Now First (Top) */}
                <div
                    className="cover-title"
                    style={{
                        paddingLeft: '40px',
                        paddingRight: '40px',
                        textAlign: 'center'
                    }}
                >
                    <h1
                        style={{
                            fontFamily: "'TT Lakes Neue', sans-serif",
                            fontStyle: 'italic',
                            fontWeight: 400,
                            fontSize: `${data.storyTitleFontSize}px`,
                            lineHeight: '100%',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            color: '#FFFFFF',
                            textShadow: '0px 5.1px 0px #BA0C2F',
                            margin: 0,
                            whiteSpace: 'pre-line'
                        }}
                    >
                        {data.title}
                    </h1>
                </div>

                {/* Subtitle Box - Now Second (Bottom) */}
                <div
                    className="cover-subtitle"
                    style={{
                        background: '#BA0C2F',
                        borderRadius: '22.11px',
                        boxShadow: 'inset 0px 4.42px 8.07px #FF0033, inset 0px -11.05px 10.5px rgba(0, 0, 0, 0.25)',
                        padding: '20px 40px',
                        marginLeft: '40px',
                        marginRight: '40px',
                        marginTop: `${data.titleSpacing}px`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                    }}
                >
                    <p
                        style={{
                            fontFamily: "'Sudo Var', monospace",
                            fontSize: '42px',
                            color: '#FFFFFF',
                            margin: 0,
                            flex: 1,
                            maxWidth: '660px',
                            whiteSpace: 'pre-line'
                        }}
                    >
                        {data.description}
                    </p>
                    <svg
                        width="60"
                        height="60"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                </div>
            </div>
        </div>
    );
});

StoryTemplate.displayName = 'StoryTemplate';

// Desktop Template Component (1680x1288)
const DesktopTemplate = React.forwardRef<HTMLDivElement, { data: CoverData }>(({ data }, ref) => {
    return (
        <div
            ref={ref}
            className="relative w-full overflow-hidden rounded-lg shadow-lg"
            style={{
                width: '1680px',
                height: '1288px',
                transform: 'scale(0.4)',
                transformOrigin: 'top left'
            }}
        >
            {/* Background Image */}
            {data.image && (
                <img
                    src={data.image}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: getImagePosition(data) }}
                />
            )}

            {/* Gradient Overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 50%, ${data.accentColor}dd 100%)`
                }}
            />

            {/* Content Container - Flexbox Layout */}
            <div
                className="absolute inset-0 flex flex-col justify-end items-center"
                style={{ paddingBottom: `${data.desktopTitleBottom}px` }}
            >
                {/* Title Only for Desktop */}
                <div
                    className="cover-title"
                    style={{
                        paddingLeft: '80px',
                        paddingRight: '80px',
                        textAlign: 'center',
                        maxWidth: '1600px'
                    }}
                >
                    <h1
                        style={{
                            fontFamily: "'TT Lakes Neue', sans-serif",
                            fontStyle: 'italic',
                            fontWeight: 400,
                            fontSize: `${data.desktopTitleFontSize}px`,
                            lineHeight: '100%',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            color: '#FFFFFF',
                            textShadow: '0px 5.08px 0px #BA0C2F',
                            margin: 0,
                            whiteSpace: 'pre-line'
                        }}
                    >
                        {data.title}
                    </h1>
                </div>
            </div>
        </div>
    );
});

DesktopTemplate.displayName = 'DesktopTemplate';
