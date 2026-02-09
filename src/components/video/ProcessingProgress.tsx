import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProcessingProgressProps {
    status: 'idle' | 'loading' | 'trimming' | 'cropping' | 'transcribing' | 'rendering' | 'complete' | 'error';
    progress: number;
    message?: string;
    error?: string;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
    status,
    progress,
    message,
    error,
}) => {
    const getStatusInfo = () => {
        switch (status) {
            case 'loading':
                return { label: 'Initializing FFmpeg...', color: 'indigo' };
            case 'trimming':
                return { label: 'Trimming video...', color: 'blue' };
            case 'cropping':
                return { label: 'Cropping to 9:16...', color: 'purple' };
            case 'transcribing':
                return { label: 'Generating subtitles with AI...', color: 'pink' };
            case 'rendering':
                return { label: 'Rendering final video...', color: 'violet' };
            case 'complete':
                return { label: 'Complete!', color: 'green' };
            case 'error':
                return { label: 'Error occurred', color: 'red' };
            default:
                return { label: 'Ready', color: 'slate' };
        }
    };

    const statusInfo = getStatusInfo();
    const isProcessing = ['loading', 'trimming', 'cropping', 'transcribing', 'rendering'].includes(status);

    if (status === 'idle') return null;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {isProcessing && (
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                    )}
                    {status === 'complete' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <h3 className="text-lg font-bold text-slate-900">{statusInfo.label}</h3>
                </div>
                <span className="text-2xl font-bold text-slate-900">{progress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r from-${statusInfo.color}-500 to-${statusInfo.color}-600 rounded-full transition-all duration-300 ease-out`}
                    style={{ width: `${progress}%` }}
                >
                    {isProcessing && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    )}
                </div>
            </div>

            {/* Message or Error */}
            {message && (
                <p className="text-sm text-slate-600 mt-2">{message}</p>
            )}
            {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            {/* Processing Steps */}
            {isProcessing && (
                <div className="mt-4 space-y-2">
                    {status === 'transcribing' ? (
                        <>
                            <ProcessingStep label="Extract Audio" isComplete={progress > 20} isActive={progress <= 20} />
                            <ProcessingStep label="AI Transcription" isComplete={progress > 60} isActive={progress > 20 && progress <= 60} />
                            <ProcessingStep label="Optimize Subtitles" isComplete={progress > 80} isActive={progress > 60 && progress <= 80} />
                        </>
                    ) : status === 'rendering' ? (
                        <>
                            <ProcessingStep label="Preparing Player" isComplete={progress > 10} isActive={progress <= 10} />
                            <ProcessingStep label="Capturing Video" isComplete={progress > 70} isActive={progress > 10 && progress <= 70} />
                            <ProcessingStep label="Converting to MP4" isComplete={progress > 90} isActive={progress > 70 && progress <= 90} />
                            <ProcessingStep label="Downloading" isComplete={progress >= 100} isActive={progress > 90 && progress < 100} />
                        </>
                    ) : (
                        <>
                            <ProcessingStep label="Initialize" isComplete={progress > 0} isActive={status === 'loading'} />
                            <ProcessingStep label="Processing" isComplete={progress > 50} isActive={true} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

interface ProcessingStepProps {
    label: string;
    isComplete: boolean;
    isActive: boolean;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({ label, isComplete, isActive }) => {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full transition-all ${isComplete ? 'bg-green-500' : isActive ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'
                }`} />
            <span className={`text-sm font-medium ${isComplete ? 'text-green-700' : isActive ? 'text-indigo-700' : 'text-slate-400'
                }`}>
                {label}
            </span>
        </div>
    );
};
