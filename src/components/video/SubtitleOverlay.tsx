import React from 'react';
import { SubtitleStyle } from '../../types/video';

interface SubtitleOverlayProps {
    text: string;
    style: SubtitleStyle;
    videoWidth: number;
    videoHeight: number;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
    text,
    style,
    videoWidth,
    videoHeight,
}) => {
    const getPositionStyle = () => {
        switch (style.position) {
            case 'top':
                return { top: '10%' };
            case 'bottom':
                return { bottom: '10%' };
            case 'center':
            default:
                return { top: '50%', transform: 'translateY(-50%)' };
        }
    };

    return (
        <div
            className="absolute left-0 right-0 flex items-center justify-center px-8 pointer-events-none z-10"
            style={getPositionStyle()}
        >
            <div
                className="text-center max-w-[90%] leading-tight"
                style={{
                    fontFamily: style.fontFamily,
                    fontSize: `${style.fontSize}px`,
                    color: style.color,
                    textShadow: `
            -${style.strokeWidth}px -${style.strokeWidth}px 0 ${style.strokeColor},
            ${style.strokeWidth}px -${style.strokeWidth}px 0 ${style.strokeColor},
            -${style.strokeWidth}px ${style.strokeWidth}px 0 ${style.strokeColor},
            ${style.strokeWidth}px ${style.strokeWidth}px 0 ${style.strokeColor},
            0 0 ${style.strokeWidth * 2}px ${style.strokeColor}
          `,
                    backgroundColor: style.backgroundColor || 'transparent',
                    padding: style.backgroundColor ? '8px 16px' : '0',
                    borderRadius: style.backgroundColor ? '8px' : '0',
                }}
            >
                {text}
            </div>
        </div>
    );
};
