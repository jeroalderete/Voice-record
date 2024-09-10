import React, { useRef } from 'react';

const AudioSynchronizer = () => {
    const audioContext = useRef(new (window.AudioContext || window.webkitAudioContext)());
    const sourceNodes = useRef([]);

    const playAudios = async () => {
        try {
            const urls = [
                './1.wav',
                './1.wav'
            ]; // URLs de los audios locales

            // Carga los audios
            const buffers = await Promise.all(urls.map(url => fetchAudio(url)));

            // Configura los nodos de audio
            sourceNodes.current = buffers.map(buffer => {
                const source = audioContext.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.current.destination);
                return source;
            });

            // Obtén el tiempo de inicio
            const startTime = audioContext.current.currentTime + 0.1; // Añadir un pequeño retraso para sincronización

            // Reproduce ambos audios al mismo tiempo
            sourceNodes.current.forEach(source => source.start(startTime));
        } catch (error) {
            console.error('Error playing audios:', error);
        }
    };

    const fetchAudio = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('Content-Type');
            if (!contentType || !contentType.startsWith('audio/')) {
                throw new Error(`Expected audio content type, but got ${contentType}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return await audioContext.current.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Error fetching audio:', error);
            throw error;
        }
    };

    return (
        <div>
          <audio controls src="/1.wav">
    Your browser does not support the <code>audio</code> element.
</audio>
            <button onClick={playAudios}>Play Synchronize Audios</button>
        </div>
    );
};

export default AudioSynchronizer;
