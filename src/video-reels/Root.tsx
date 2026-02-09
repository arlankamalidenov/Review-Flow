import { Composition } from 'remotion';
import { VideoReelComposition, VideoReelSchema } from './Composition';

// ✅ Remotion Root - Video Manifest
export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="VideoReel"
                component={VideoReelComposition}
                durationInFrames={300} // 10 seconds at 30fps (will be dynamic)
                fps={30}
                width={1080}
                height={1920}
                schema={VideoReelSchema}
                defaultProps={{
                    videoUrl: '',
                    subtitles: [
                        {
                            start: 1,
                            end: 3,
                            text: 'Hello World',
                        },
                    ],
                    styleConfig: {
                        fontFamily: 'Inter',
                        fontSize: 40,
                        color: '#FFFFFF',
                        strokeColor: '#BA0C2F',
                        strokeWidth: 2,
                    },
                }}
            />
        </>
    );
};
