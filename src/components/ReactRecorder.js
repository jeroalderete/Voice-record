import React, { useRef } from "react";
import AudioTimer from "./AudioTimer";
import { ReactMic } from "react-mic";

import "./recorder.css";

const ReactRecorder = () => {
   const [isRunning, setIsRunning] = React.useState(false); // Estado para saber si la grabación está en curso
   const [elapsedTime, setElapsedTime] = React.useState(0); // Estado para almacenar el tiempo transcurrido de la grabación
   const [voice, setVoice] = React.useState(false); // Estado para saber si se está grabando o no
   const [recordedBlobs, setRecordedBlobs] = React.useState([]); // Estado para almacenar las URLs de los audios grabados
   const [volumeLevels, setVolumeLevels] = React.useState([]); // Estado para almacenar los niveles de volumen de cada grabación
   const audioRef = useRef(null); // Referencia al audio principal que se reproduce
   const multiAudioRefs = useRef([]); // Referencia a múltiples elementos de audio para reproducir en paralelo

   // Función llamada cuando se detiene la grabación

   const onStop = (recordedBlob) => {
      setRecordedBlobs((prevBlobs) => [...prevBlobs, recordedBlob.blobURL]);
      setVolumeLevels((prevVolumes) => [...prevVolumes, 1]); // Default volume 1 (100%)
      setIsRunning(false);
   };

   // Función para cambiar el volumen de un audio específico

   const handleVolumeChange = (index, volume) => {
      setVolumeLevels((prevVolumes) => {
         const newVolumes = [...prevVolumes];
         newVolumes[index] = volume;
         return newVolumes;
      });
   };

   // Función para comenzar la grabación

   const startHandle = () => {
      // Verifica si la grabación ya está en curso
      if (isRunning) {
         return;
      }
      setElapsedTime(0);
      setIsRunning(true);
      setVoice(true);

      // Reproducir el último audio grabado si existe
      if (recordedBlobs.length > 0) {
         const lastAudioUrl = recordedBlobs[recordedBlobs.length - 1];
         if (audioRef.current) {
            audioRef.current.src = lastAudioUrl;
            audioRef.current.play();
         }
      }
   };
   const startHandle2 = () => {
      // Verifica si la grabación ya está en curso
      if (isRunning) {
         return;
      }
      setElapsedTime(0);
      setIsRunning(true);
      setVoice(true);

      // Reproducir el último audio grabado si existe
      if (recordedBlobs.length > 0) {
         const lastAudioUrl = recordedBlobs[recordedBlobs.length - 1];
         if (audioRef.current) {
            audioRef.current.src = lastAudioUrl;
            audioRef.current.play();
         }
      }
   };
   // Función para detener la grabación

   const stopHandle = () => {
      setIsRunning(false);
      setVoice(false);
   };

   const stopHandle2 = () => {
      setIsRunning(false);
      setVoice(false);
   };

   // Función para limpiar todos los audios grabados y reiniciar el estado

   const clearHandle = () => {
      setIsRunning(false);
      setVoice(false);
      setRecordedBlobs([]);
      setVolumeLevels([]);
      setElapsedTime(0);
      if (audioRef.current) {
         audioRef.current.pause();
         audioRef.current.src = "";
      }
   };

   // Función para reproducir todos los audios grabados

   const playAllHandle = () => {
      const delayBetweenAudios = 100; // Retraso de 100 milisegundos entre audios
      const startTime = performance.now(); // Hora de inicio en milisegundos

      // Array para almacenar los tiempos de inicio y fin
      const audioStartTimes = [];
      const audioEndTimes = [];

      multiAudioRefs.current.forEach((audio, index) => {
         const delay = 0; // Retraso en milisegundos
         const scheduledStartTime = startTime + delay; // Tiempo absoluto de inicio

         setTimeout(() => {
            if (audio) {
               const playStartTime = performance.now(); // Tiempo en que comienza la reproducción
               audio.currentTime = 0; // Asegúrate de que todos comiencen desde el principio
               audio
                  .play()
                  .then(() => {
                     audioStartTimes[index] = playStartTime;
                     console.log(
                        `Audio ${
                           index + 1
                        } comenzó a reproducirse a ${playStartTime.toFixed(
                           3
                        )} ms`
                     );
                  })
                  .catch((error) => {
                     console.error("Error al reproducir el audio:", error);
                  });

               // Medir el tiempo exacto de finalización
               audio.onended = () => {
                  const endTime = performance.now();
                  audioEndTimes[index] = endTime;
                  const timeDifference = endTime - (startTime + delay); // Diferencia en milisegundos
                  console.log(
                     `Audio ${
                        index + 1
                     } terminó con una diferencia de ${timeDifference.toFixed(
                        3
                     )} ms`
                  );
               };
            }
         }, delay);
      });

      // Verificar la sincronización después de que todos los audios hayan terminado
      setTimeout(() => {
         // Asegúrate de que todos los audios hayan terminado antes de verificar
         if (audioEndTimes.length === multiAudioRefs.current.length) {
            const differences = audioEndTimes.map((endTime, index) => {
               const expectedEndTime =
                  startTime +
                  delayBetweenAudios * index +
                  multiAudioRefs.current[index].duration * 1000;
               return endTime - expectedEndTime;
            });
            console.log(
               "Diferencias de tiempo:",
               differences.map((diff) => diff.toFixed(3) + " ms")
            );
         }
      }, 10000); // Ajusta el tiempo de espera según la duración de tus audios
   };

   // Función para exportar todos los audios combinados como un archivo WAV

   const exportCombinedAudio = async () => {
      const audioContext = new (window.AudioContext ||
         window.webkitAudioContext)();
      const sources = await Promise.all(
         recordedBlobs.map(async (blobUrl) => {
            const response = await fetch(blobUrl);
            const arrayBuffer = await response.arrayBuffer();
            return audioContext.decodeAudioData(arrayBuffer);
         })
      );

      const maxLength = Math.max(...sources.map((source) => source.length));
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

         writeUTFBytes(view, pos, "RIFF");
         pos += 4;
         view.setUint32(pos, length - 8, true);
         pos += 4;
         writeUTFBytes(view, pos, "WAVE");
         pos += 4;
         writeUTFBytes(view, pos, "fmt ");
         pos += 4;
         view.setUint32(pos, 16, true);
         pos += 4;
         view.setUint16(pos, 1, true);
         pos += 2;
         view.setUint16(pos, numOfChan, true);
         pos += 2;
         view.setUint32(pos, audioBuffer.sampleRate, true);
         pos += 4;
         view.setUint32(pos, audioBuffer.sampleRate * 4, true);
         pos += 4;
         view.setUint16(pos, numOfChan * 2, true);
         pos += 2;
         view.setUint16(pos, 16, true);
         pos += 2;
         writeUTFBytes(view, pos, "data");
         pos += 4;
         view.setUint32(pos, length - pos - 4, true);
         pos += 4;

         for (let i = 0; i < audioBuffer.length; i++) {
            for (let channel = 0; channel < numOfChan; channel++) {
               channels[channel] = audioBuffer.getChannelData(channel);
            }
            for (let channel = 0; channel < numOfChan; channel++) {
               const sample = Math.max(-1, Math.min(1, channels[channel][i]));
               view.setInt16(
                  pos,
                  sample < 0 ? sample * 0x8000 : sample * 0x7fff,
                  true
               );
               pos += 2;
            }
         }

         return new Blob([view], { type: "audio/wav" });
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

   // Función para borrar un audio específico
   const removeAudio = (index) => {
      setRecordedBlobs((prevBlobs) => prevBlobs.filter((_, i) => i !== index));
      setVolumeLevels((prevVolumes) =>
         prevVolumes.filter((_, i) => i !== index)
      );
   };

   return (
      <div>
         <section>
            <div className="app-container">
               <header className="header ">
                  <div className="flex flex-wrap md:justify-center gap-10 md:gap-40">
                     <div className="hidden md:flex ">Tracklist</div>
                     {recordedBlobs.length > 0 && (
                        <div>
                           <button
                              onClick={clearHandle}
                              className="bg-[#fff] text-[#111] rounded-md py-1 px-3 font-semibold text-[16px]"
                           >
                              Clear
                           </button>
                        </div>
                     )}

                     <div>
                        {!voice ? (
                           <button
                              onClick={startHandle}
                              className="bg-[#fff] text-[#111] rounded-md py-1 px-3 font-semibold text-[16px]"
                           >
                              Start
                           </button>
                        ) : (
                           <button
                              onClick={stopHandle}
                              className="bg-[#fff] text-[#111] rounded-md py-1 px-3 font-semibold text-[16px]"
                           >
                              Stop
                           </button>
                        )}
                     </div>

                     {recordedBlobs.length > 0 && (
                        <div>
                           <button
                              onClick={playAllHandle}
                              className="bg-[#fff] text-[#111] rounded-md py-1 px-3 font-semibold text-[16px]"
                           >
                              Play All
                           </button>
                        </div>
                     )}
                     <div className="bg-[#fff] text-[#111] rounded-md  px-3 font-semibold ] mb-4 hidden md:flex">
                        <button className="bg-[#fff] text-[#111] rounded-md py-1 px-3 font-semibold text-[16px] ">
                           <AudioTimer
                              isRunning={isRunning}
                              elapsedTime={elapsedTime}
                              setElapsedTime={setElapsedTime}
                           />
                        </button>
                     </div>
                  </div>
                  <div className="w-full flex gap-20 mt-10 md:mt-0">
                     <div className="flex flex-col justify-center align-middle text-[1.3rem] w-[5%]">
                        Track 1
                     </div>
                     <ReactMic
                        record={voice}
                        className="sound-wave w-full"
                        onStop={onStop}
                        strokeColor="#000000"
                     />
                  </div>
               </header>

               {recordedBlobs.map((blobURL, index) => (
                  <div className="pt-10 md:pt-0" key={index}>
                     <audio
                        ref={(ref) => (multiAudioRefs.current[index] = ref)}
                        src={blobURL}
                        controls
                     />
                     <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volumeLevels[index]}
                        onChange={(e) =>
                           handleVolumeChange(index, parseFloat(e.target.value))
                        }
                     />
                     <button onClick={() => removeAudio(index)}>Remove</button>
                  </div>
               ))}

               <audio ref={audioRef} style={{ display: "none" }} />
            </div>
         </section>

         {/* asdaptar */}
      </div>
   );
};

export default ReactRecorder;
