import React, { useEffect } from 'react';

// ✅ SharedArrayBuffer Diagnostic Component
export const SharedArrayBufferCheck: React.FC = () => {
    useEffect(() => {
        const isAvailable = typeof SharedArrayBuffer !== 'undefined';

        console.log('=== SharedArrayBuffer Diagnostic ===');
        console.log('Available:', isAvailable);

        if (isAvailable) {
            console.log('✅ SharedArrayBuffer is active');
            console.log('✅ FFmpeg.wasm will work correctly');
            console.log('✅ Remotion is compatible');
        } else {
            console.error('❌ SharedArrayBuffer is NOT available');
            console.error('❌ Check COOP/COEP headers in vite.config.ts');
            console.error('Required headers:');
            console.error('  Cross-Origin-Opener-Policy: same-origin');
            console.error('  Cross-Origin-Embedder-Policy: require-corp');
        }

        console.log('====================================');
    }, []);

    const isAvailable = typeof SharedArrayBuffer !== 'undefined';

    return (
        <div className={`p-4 rounded-lg border-2 ${isAvailable
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                <div>
                    <h3 className="font-bold text-sm">
                        SharedArrayBuffer Status
                    </h3>
                    <p className={`text-xs ${isAvailable ? 'text-green-700' : 'text-red-700'
                        }`}>
                        {isAvailable
                            ? '✅ Active - FFmpeg & Remotion compatible'
                            : '❌ Not available - Check COOP/COEP headers'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};
