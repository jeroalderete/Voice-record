import React, { useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from './wavesurfer.js/dist/plugin/regions';

const AudioEditor = ({ audioUrl, onRegionChange }) => {
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);

    useEffect(() => {
        if (audioUrl) {
            wavesurferRef.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#d9dcff',
                progressColor: '#4353ff',
                plugins: [
                    RegionsPlugin.create({
                        regions: [
                            {
                                start: 0, // inicio de la región (en segundos)
                                end: 5, // fin de la región (en segundos)
                                loop: false,
                                color: 'rgba(0, 123, 255, 0.1)',
                            },
                        ],
                        dragSelection: true, // Permite crear nuevas regiones arrastrando
                    }),
                ],
            });

            wavesurferRef.current.load(audioUrl);

            // Escuchar cuando cambian las regiones
            wavesurferRef.current.on('region-update-end', (region) => {
                if (onRegionChange) {
                    onRegionChange(region.start, region.end);
                }
            });

            return () => wavesurferRef.current.destroy();
        }
    }, [audioUrl]);

    return <div ref={waveformRef} />;
};

export default AudioEditor;
