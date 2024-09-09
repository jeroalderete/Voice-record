import React, { useEffect, useRef } from "react";
import AudioTimer from "./AudioTimer";
import { ReactMic } from "react-mic";

const ReactRecorder = () => {
    const [isRunning, setIsRunning] = React.useState(false);
    const [elapsedTime, setElapsedTime] = React.useState(0);
    const [voice, setVoice] = React.useState(false);
    const [recordedBlobs, setRecordedBlobs] = React.useState([]);
    const [volumeLevels, setVolumeLevels] = React.useState([]);
    const audioRef = useRef(null); 
    const multiAudioRefs = useRef([]);

    const onStop = (recordedBlob) => {
        setRecordedBlobs((prevBlobs) => [...prevBlobs, recordedBlob.blobURL]);
        setVolumeLevels((prevVolumes) => [...prevVolumes, 1]); // Default volume 1 (100%)
        setIsRunning(false);
    };

    const handleVolumeChange = (index, volume) => {
        setVolumeLevels((prevVolumes) => {
            const newVolumes = [...prevVolumes];
            newVolumes[index] = volume;
            return newVolumes;
        });
    };

    const startHandle = () => {
        setElapsedTime(0);
        setIsRunning(true);
        setVoice(true);

        if (recordedBlobs.length > 0) {
            const lastAudioUrl = recordedBlobs[recordedBlobs.length - 1];
            if (audioRef.current) {
                audioRef.current.src = lastAudioUrl;
                audioRef.current.play();
            }
        }
    };

    const stopHandle = () => {
        setIsRunning(false);
        setVoice(false);
    };

    const clearHandle = () => {
        setIsRunning(false);
        setVoice(false);
        setRecordedBlobs([]); 
        setVolumeLevels([]); 
        setElapsedTime(0);
    };

    const playAllHandle = () => {
        multiAudioRefs.current.forEach(audio => {
            if (audio) {
                audio.currentTime = 0; 
                audio.play();
            }
        });
    };

    const exportCombinedAudio = async () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const sources = await Promise.all(recordedBlobs.map(async (blobUrl) => {
            const response = await fetch(blobUrl);
            const arrayBuffer = await response.arrayBuffer();
            return audioContext.decodeAudioData(arrayBuffer);
        }));

        const maxLength = Math.max(...sources.map(source => source.length));
        const combined = audioContext.createBuffer(
            sources[0].numberOfChannels,
            maxLength,
            audioContext.sampleRate
        );

        sources.forEach((source, index) => {
            const volume = volumeLevels[index]; 
            for (let channel = 0; channel < source.numberOfChannels; channel++) {
                const channelData = combined.getChannelData(channel);
                const sourceData = source.getChannelData(channel);
                for (let i = 0; i < sourceData.length; i++) {
                    channelData[i] += sourceData[i] * volume; 
                }
            }
        });

        const exportWAV = (audioBuffer) => {
            const numOfChan = audioBuffer.numberOfChannels;
            const length = audioBuffer.length * numOfChan * 2 + 44;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            const channels = [];
            let pos = 0;

            writeUTFBytes(view, pos, 'RIFF'); pos += 4;
            view.setUint32(pos, length - 8, true); pos += 4;
            writeUTFBytes(view, pos, 'WAVE'); pos += 4;
            writeUTFBytes(view, pos, 'fmt '); pos += 4;
            view.setUint32(pos, 16, true); pos += 4;
            view.setUint16(pos, 1, true); pos += 2;
            view.setUint16(pos, numOfChan, true); pos += 2;
            view.setUint32(pos, audioBuffer.sampleRate, true); pos += 4;
            view.setUint32(pos, audioBuffer.sampleRate * 4, true); pos += 4;
            view.setUint16(pos, numOfChan * 2, true); pos += 2;
            view.setUint16(pos, 16, true); pos += 2;
            writeUTFBytes(view, pos, 'data'); pos += 4;
            view.setUint32(pos, length - pos - 4, true); pos += 4;

            for (let i = 0; i < audioBuffer.length; i++) {
                for (let channel = 0; channel < numOfChan; channel++) {
                    channels[channel] = audioBuffer.getChannelData(channel);
                }
                for (let channel = 0; channel < numOfChan; channel++) {
                    const sample = Math.max(-1, Math.min(1, channels[channel][i]));
                    view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                    pos += 2;
                }
            }

            return new Blob([view], { type: 'audio/wav' });
        };

        const writeUTFBytes = (view, offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        const wavBlob = exportWAV(combined);
        const url = window.URL.createObjectURL(wavBlob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "combined-audio.wav";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div className="max-w-sm border py-4 px-6 mx-auto bg-black">
                <h2 className="text-[22px] font-semibold">Audio Recorder</h2>
                <AudioTimer 
                    isRunning={isRunning}
                    elapsedTime={elapsedTime}
                    setElapsedTime={setElapsedTime} 
                />

                <ReactMic
                    record={voice}
                    className="sound-wave w-full"
                    onStop={onStop}
                    strokeColor="#000000"
                />

                <div className="">
                    {recordedBlobs.length > 0 && (
                        <button onClick={clearHandle} className="text-[#fff] font-medium text-[16px]">Clear</button>
                    )}
                </div>

                <div className="mt-2">
                    {!voice ? (
                        <button onClick={startHandle} className="bg-[#fff] text-[#111] rounded-md py-1 px-3 font-semibold text-[16px]">Start</button>
                    ) : (
                        <button onClick={stopHandle} className="bg-[#fff] text-[#111] rounded-md py-1 px-3 font-semibold text-[16px]">Stop</button>
                    )}
                </div>

                <div className="">
                    {recordedBlobs.length > 0 && (
                        <div className="mt-6">
                            {recordedBlobs.map((blobUrl, index) => (
                                <div key={index} className="mb-4">
                                    <audio
                                        controls
                                        src={blobUrl}
                                        ref={el => (multiAudioRefs.current[index] = el)} 
                                        className="w-full mb-2"
                                        onVolumeChange={(e) => handleVolumeChange(index, e.target.volume)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {recordedBlobs.length > 0 && (
                    <div className="mt-4">
                        <button onClick={playAllHandle} className="bg-[#fff] text-[#111] rounded-md py-1 px-3 font-semibold text-[16px]">
                            Play All
                        </button>
                    </div>
                )}

                {recordedBlobs.length > 0 && (
                    <div className="mt-4">
                        <button onClick={exportCombinedAudio} className="bg-[#fff] text-[#111] rounded-md py-1 px-3 font-semibold text-[16px]">
                            Export Combined Audio as WAV
                        </button>
                    </div>
                )}

                <audio ref={audioRef} hidden />
            </div>
        </div>
    );
};

export default ReactRecorder;
