import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Play, StopCircle, Users, Radio, Send, AlertTriangle, ChevronDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock Web APIs (manteniendo los originales y añadiendo soporte para usuarios conectados)
const mockBackground = {
  start: () => console.log('Servicio en segundo plano iniciado'),
  stop: () => console.log('Servicio en segundo plano detenido'),
  on: (event: string, callback: (...args: any[]) => void) => {
    console.log(`Escuchando evento en segundo plano: ${event}`);
    if (event === 'audio') {
      mockBackground.audioCallback = callback;
    }
    if (event === 'message') {
      mockBackground.messageCallback = callback;
    }
  },
  audioCallback: null as ((data: any) => void) | null,
  emitAudio: (data: any) => {
    if (mockBackground.audioCallback) {
      mockBackground.audioCallback(data);
    }
  },
  messageCallback: null as ((data: any) => void) | null,
  emitMessage: (data: any) => {
    if (mockBackground.messageCallback) {
      mockBackground.messageCallback(data);
    }
  },
  getConnectedUsers: () => ['Usuario1', 'Usuario2', 'Usuario3', 'Usuario' + Math.floor(Math.random() * 100)], // Simula usuarios conectados
};

const mockRNFS = {
  writeFile: (filepath: string, content: string, encoding: string) => {
    console.log(`Escribiendo en el archivo: ${filepath} con contenido: ${content} y encoding: ${encoding}`);
    return Promise.resolve(true);
  },
  readDir: (dirpath: string) => {
    console.log(`Leyendo directorio: ${dirpath}`);
    return Promise.resolve([]);
  },
  mkdir: (dirpath: string) => {
    console.log(`Creando directorio: ${dirpath}`);
    return Promise.resolve(true);
  },
  exists: (filepath: string) => {
    console.log(`Verificando existencia del archivo: ${filepath}`);
    return Promise.resolve(false);
  },
  unlink: (filepath: string) => {
    console.log(`Eliminando archivo: ${filepath}`);
    return Promise.resolve(true);
  },
  CachesDirectoryPath: 'mocked/cache/directory',
  DocumentDirectoryPath: 'mocked/documents/directory',
};

const mockSound = {
  play: (filepath: string) => {
    console.log(`Reproduciendo sonido desde: ${filepath}`);
    return Promise.resolve();
  },
  stop: () => {
    console.log('Deteniendo sonido');
    return Promise.resolve();
  },
  release: () => {
    console.log('Liberando recursos de sonido');
    return Promise.resolve();
  },
};

const mockAudioRecorder = {
  start: (filepath: string, options: any) => {
    console.log(`Iniciando grabación en: ${filepath} con opciones:`, options);
    mockAudioRecorder.isRecording = true;
    mockAudioRecorder.recordingPath = filepath;
    return Promise.resolve();
  },
  stop: () => {
    console.log('Deteniendo grabación');
    mockAudioRecorder.isRecording = false;
    if (mockBackground.audioCallback && mockAudioRecorder.recordingPath) {
      const audioData = {
        uri: mockAudioRecorder.recordingPath,
        duration: 2.5,
        base64: 'base64_encoded_audio_data',
      };
      mockBackground.emitAudio(audioData);
    }
    return Promise.resolve({ base64: 'mocked_base64_audio_data' });
  },
  pause: () => {
    console.log('Pausando grabación');
    return Promise.resolve();
  },
  resume: () => {
    console.log('Reanudando grabación');
    return Promise.resolve();
  },
  isRecording: false,
  recordingPath: '',
};

const mockNetInfo = {
  fetch: () => {
    console.log('Obteniendo información de la red');
    return Promise.resolve({
      isConnected: true,
      type: 'wifi',
      details: null,
    });
  },
  addEventListener: (callback: (state: any) => void) => {
    console.log('Escuchando cambios en el estado de la red');
    mockNetInfo.currentCallback = callback;
    callback({ isConnected: true, type: 'wifi', details: null });
    return () => {
      mockNetInfo.currentCallback = null;
      console.log('Dejando de escuchar cambios en el estado de la red');
    };
  },
  currentCallback: null as ((state: any) => void) | null,
  simulateNetworkChange: (isConnected: boolean, type: string) => {
    if (mockNetInfo.currentCallback) {
      mockNetInfo.currentCallback({ isConnected, type, details: null });
    }
  },
};

const mockAlert = {
  alert: (title: string, message?: string, buttons?: any[]) => {
    console.log(`Alerta: ${title}, Mensaje: ${message}, Botones:`, buttons);
    if (buttons) {
      const defaultButton = buttons.find(b => b.text === 'OK') || buttons[0];
      if (defaultButton && defaultButton.onPress) {
        setTimeout(defaultButton.onPress, 0);
      }
    }
  },
};

const mockVibration = {
  vibrate: (pattern: number | number[] | 'long' | 'short') => {
    console.log('Vibrando con patrón:', pattern);
    if ('vibrate' in navigator) {
      if (pattern === 'long') {
        navigator.vibrate(200);
      } else if (pattern === 'short') {
        navigator.vibrate(50);
      } else {
        navigator.vibrate(pattern);
      }
    }
  },
};

const mockAppState = {
  currentState: 'active',
  addEventListener: (type: 'change', handler: (state: string) => void) => {
    console.log(`Escuchando cambios en el estado de la aplicación (${type})`);
    mockAppState.eventHandler = handler;
    handler(mockAppState.currentState);
    return {
      remove: () => {
        mockAppState.eventHandler = null;
        console.log(`Dejando de escuchar cambios en el estado de la aplicación (${type})`);
      },
    };
  },
  eventHandler: null as ((state: string) => void) | null,
  simulateAppStateChange: (newState: string) => {
    mockAppState.currentState = newState;
    if (mockAppState.eventHandler) {
      mockAppState.eventHandler(newState);
    }
  },
};

const mockDeviceEventEmitter = {
  addListener: (event: string, callback: (...args: any[]) => void) => {
    console.log(`Escuchando evento nativo: ${event}`);
    if (event === 'proximity') {
      mockDeviceEventEmitter.proximityCallback = callback;
    }
    return {
      remove: () => {
        console.log(`Dejando de escuchar evento nativo: ${event}`);
        if (event === 'proximity') {
          mockDeviceEventEmitter.proximityCallback = null;
        }
      },
    };
  },
  emit: (event: string, data: any) => {
    console.log(`Emisión de evento nativo: ${event} con datos:`, data);
    if (event === 'proximity' && mockDeviceEventEmitter.proximityCallback) {
      mockDeviceEventEmitter.proximityCallback(data);
    }
  },
  proximityCallback: null as ((data: any) => void) | null,
};

const mockPlatform = {
  OS: 'android',
  Version: '12',
};

const mockPermissions = {
  request: async (permission: string) => {
    console.log(`Solicitando permiso: ${permission}`);
    return Promise.resolve('granted');
  },
  check: async (permission: string) => {
    console.log(`Verificando permiso: ${permission}`);
    return Promise.resolve('granted');
  },
};

const mockSpeech = {
  startSpeech: (options: any, callback: (result: string) => void) => {
    console.log('Iniciando reconocimiento de voz con opciones:', options);
    mockSpeech.isListening = true;
    mockSpeech.currentCallback = callback;
    mockSpeech.timeoutId = setTimeout(() => {
      mockSpeech.isListening = false;
      const simulatedResult = 'Hola, ¿cómo estás?';
      console.log('Resultado de la transcripción:', simulatedResult);
      callback(simulatedResult);
      mockSpeech.currentCallback = null;
    }, 3000);
    return Promise.resolve();
  },
  stopSpeech: () => {
    console.log('Deteniendo reconocimiento de voz');
    mockSpeech.isListening = false;
    clearTimeout(mockSpeech.timeoutId);
    mockSpeech.currentCallback = null;
    return Promise.resolve();
  },
  isListening: false,
  currentCallback: null as ((result: string) => void) | null,
  timeoutId: null as NodeJS.Timeout | null,
};

// Constantes y tipos
const AUDIO_FORMATS = {
  MP3: 'mp3',
  PCM: 'pcm',
};

const SAMPLE_RATES = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000];

const CHANNELS = ['Canal 1', 'Canal 2', 'Canal 3'];

interface AudioData {
  uri: string;
  duration: number;
  base64?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text?: string;
  audioUri?: string;
  timestamp: number;
  channel: string;
}

// Componente principal
const AndroidWalkieTalkie = () => {
  // Estados
  const [isServiceRunning, setIsServiceRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioFormat, setAudioFormat] = useState<keyof typeof AUDIO_FORMATS>(AUDIO_FORMATS.MP3);
  const [sampleRate, setSampleRate] = useState(16000);
  const [pttMode, setPttMode] = useState<'hold' | 'toggle'>('hold');
  const [proximity, setProximity] = useState<boolean | null>(null);
  const [outputVolume, setOutputVolume] = useState(1);
  const [networkInfo, setNetworkInfo] = useState<{ isConnected: boolean; type: string; details: any } | null>(null);
  const [appState, setAppState] = useState<'active' | 'background' | 'inactive'>('active');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('walkieMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentMessage, setCurrentMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentChannel, setCurrentChannel] = useState(CHANNELS[0]);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  // Refs
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  let audioFilePath: string;
  let userName = 'Usuario' + Math.floor(Math.random() * 100);

  // Guardar mensajes en localStorage
  useEffect(() => {
    localStorage.setItem('walkieMessages', JSON.stringify(messages));
  }, [messages]);

  // Inicialización del servicio y usuarios conectados
  useEffect(() => {
    mockBackground.start();
    setIsServiceRunning(true);
    setConnectedUsers(mockBackground.getConnectedUsers());

    mockBackground.on('audio', (data: AudioData) => {
      console.log('Audio recibido:', data);
      const audioMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'Otro usuario',
        audioUri: data.uri,
        timestamp: Date.now(),
        channel: currentChannel,
      };
      setMessages(prev => [...prev, audioMessage]);
      playSound(data.uri);
    });

    mockBackground.on('message', (data: ChatMessage) => {
      console.log('Mensaje recibido:', data);
      setMessages(prev => [...prev, data]);
    });

    return () => {
      mockBackground.stop();
      setIsServiceRunning(false);
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, [currentChannel]);

  // Información de red
  useEffect(() => {
    const fetchNetworkInfo = async () => {
      const info = await mockNetInfo.fetch();
      setNetworkInfo(info);
    };

    fetchNetworkInfo();
    const unsubscribe = mockNetInfo.addEventListener(state => {
      setNetworkInfo(state);
    });

    return () => unsubscribe();
  }, []);

  // Estado de la aplicación
  useEffect(() => {
    const subscription = mockAppState.addEventListener('change', newState => {
      setAppState(newState);
      console.log('Estado de la aplicación:', newState);
    });

    return () => subscription.remove();
  }, []);

  // Sensor de proximidad
  useEffect(() => {
    const proximityListener = mockDeviceEventEmitter.addListener('proximity', (data: { isNear: boolean }) => {
      setProximity(data.isNear);
      if (audioPlayer.current) {
        audioPlayer.current.muted = data.isNear;
      }
    });

    return () => proximityListener.remove();
  }, []);

  // Auto-ajuste del textarea
  useEffect(() => {
    const textarea = chatInputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [currentMessage]);

  // Scroll al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Funciones
  const playSound = useCallback(async (filePath: string) => {
    try {
      if (audioPlayer.current) {
        await mockSound.stop();
        await mockSound.release();
        audioPlayer.current = null;
      }
      audioPlayer.current = new Audio(filePath);
      audioPlayer.current.volume = outputVolume;
      await mockSound.play(filePath);
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
      toast.error('No se pudo reproducir el audio');
    }
  }, [outputVolume]);

  const startRecording = async () => {
    try {
      const audioPermission = await mockPermissions.request('android.permission.RECORD_AUDIO');
      if (audioPermission !== 'granted') {
        toast.error('Se requiere permiso para grabar audio');
        return;
      }

      if (!networkInfo?.isConnected) {
        toast.error('No hay conexión de red');
        return;
      }

      const fileName = `audio-${Date.now()}.${audioFormat.toLowerCase()}`;
      audioFilePath = `${mockRNFS.CachesDirectoryPath}/${fileName}`;

      await mockAudioRecorder.start(audioFilePath, {
        sampleRate,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        outputFormat: audioFormat === AUDIO_FORMATS.MP3 ? 1 : 3,
        encoder: audioFormat === AUDIO_FORMATS.MP3 ? 4 : 2,
      });
      setIsRecording(true);
      mockVibration.vibrate('short');
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      toast.error('No se pudo iniciar la grabación');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      const audioData = await mockAudioRecorder.stop();
      setIsRecording(false);
      mockVibration.vibrate('short');
      const audioMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: userName,
        audioUri: audioFilePath,
        timestamp: Date.now(),
        channel: currentChannel,
      };
      setMessages(prev => [...prev, audioMessage]);
      mockBackground.emitMessage(audioMessage);
      playSound(audioFilePath);
    } catch (error) {
      console.error('Error al detener grabación:', error);
      toast.error('No se pudo detener la grabación');
    }
  };

  const handlePTT = () => {
    if (pttMode === 'hold') {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  const sendMessage = () => {
    if (currentMessage.trim()) {
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: userName,
        text: currentMessage,
        timestamp: Date.now(),
        channel: currentChannel,
      };
      setMessages(prev => [...prev, newMessage]);
      mockBackground.emitMessage(newMessage);
      setCurrentMessage('');
      if (chatInputRef.current) {
        chatInputRef.current.style.height = 'auto';
      }
    } else {
      toast.error('El mensaje no puede estar vacío');
    }
  };

  const playChatAudio = (uri: string) => {
    playSound(uri).catch(() => toast.error('Error al reproducir el audio'));
  };

  const startPrivateChat = (recipient: string) => {
    toast.success(`Iniciando chat privado con ${recipient}`);
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      mockSpeech.stopSpeech();
      setIsListening(false);
    } else {
      setIsListening(true);
      mockSpeech
        .startSpeech({ language: 'es-ES' }, result => {
          setCurrentMessage(result);
          setIsListening(false);
        })
        .catch(error => {
          console.error('Error en reconocimiento de voz:', error);
          toast.error('No se pudo iniciar el reconocimiento de voz');
          setIsListening(false);
        });
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const simulateNetworkChange = (isConnected: boolean, type: string) => {
    mockNetInfo.simulateNetworkChange(isConnected, type);
  };

  const simulateAppStateChange = (newState: string) => {
    mockAppState.simulateAppStateChange(newState);
  };

  const simulateProximityEvent = (isNear: boolean) => {
    mockDeviceEventEmitter.emit('proximity', { isNear });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Toaster position="top-center" />
      {/* Encabezado */}
      <header className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Radio className="w-6 h-6 text-red-500" />
          <h1 className="text-xl font-bold">Android Walkie Talkie</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {isServiceRunning ? 'Servicio Activo' : 'Servicio Inactivo'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Users className="w-6 h-6 text-gray-400" />
                <span>{connectedUsers.length}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 text-white border-gray-700">
              {connectedUsers.map(user => (
                <DropdownMenuItem
                  key={user}
                  onClick={() => startPrivateChat(user)}
                  className="hover:bg-gray-700"
                >
                  {user}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 p-6 space-y-8">
        {/* Selector de canal */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold mb-2">Canal de Comunicación</h2>
          <Select value={currentChannel} onValueChange={setCurrentChannel}>
            <SelectTrigger className="bg-gray-700 text-white border-gray-600">
              <SelectValue placeholder="Selecciona un canal" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              {CHANNELS.map(channel => (
                <SelectItem key={channel} value={channel} className="hover:bg-gray-700">
                  {channel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estado de la conexión */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold">Estado de la Red:</span>
            {networkInfo ? (
              <span
                className={cn('text-lg', networkInfo.isConnected ? 'text-green-500' : 'text-red-500')}
              >
                {networkInfo.isConnected ? 'Conectado' : 'Desconectado'} ({networkInfo.type})
              </span>
            ) : (
              <span className="text-gray-400">Cargando...</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => simulateNetworkChange(true, 'wifi')}
              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 border-green-500/30"
            >
              Simular Wifi
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => simulateNetworkChange(false, 'none')}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border-red-500/30"
            >
              Simular Sin Conexión
            </Button>
          </div>
        </div>

        {/* Control de PTT */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-6">Pulsar para Hablar</h2>
          <motion.button
            whileTap={{ scale: isRecording ? 0.9 : 1.1 }}
            onMouseDown={handlePTT}
            onMouseUp={pttMode === 'hold' ? handlePTT : undefined}
            onTouchStart={handlePTT}
            onTouchEnd={pttMode === 'hold' ? handlePTT : undefined}
            className={cn(
              'w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative',
              isRecording ? 'bg-red-600' : 'bg-green-600 hover:bg-green-700'
            )}
            style={{ boxShadow: isRecording ? '0 0 20px rgba(255, 0, 0, 0.7)' : '0 0 20px rgba(0, 255, 0, 0.7)' }}
            aria-label="Pulsar para Hablar"
          >
            {isRecording ? (
              <>
                <StopCircle className="w-12 h-12" />
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-red-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </>
            ) : (
              <Mic className="w-12 h-12" />
            )}
          </motion.button>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-lg">Modo PTT:</span>
            <Button
              variant={pttMode === 'hold' ? 'default' : 'outline'}
              onClick={() => setPttMode('hold')}
              className={cn(
                pttMode === 'hold' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              )}
            >
              Mantener
            </Button>
            <Button
              variant={pttMode === 'toggle' ? 'default' : 'outline'}
              onClick={() => setPttMode('toggle')}
              className={cn(
                pttMode === 'toggle' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              )}
            >
              Alternar
            </Button>
          </div>
          <div className="mt-6 w-full">
            <span className="text-lg block mb-2">Volumen de Salida: {Math.round(outputVolume * 100)}%</span>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[outputVolume]}
              onValueChange={value => setOutputVolume(value[0])}
              className="w-full"
            />
          </div>
        </div>

        {/* Chat Global */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col">
          <h2 className="text-2xl font-bold mb-4">Chat Global - {currentChannel}</h2>
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] pr-2">
            <AnimatePresence>
              {messages
                .filter(msg => msg.channel === currentChannel)
                .map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn(
                      'p-3 rounded-lg flex flex-col',
                      msg.sender === userName ? 'bg-blue-500/20 ml-auto' : 'bg-gray-700 mr-auto',
                      'max-w-[80%]'
                    )}
                  >
                    <div className="flex items-end gap-1">
                      <span className="font-semibold text-sm">{msg.sender}:</span>
                      {msg.text ? (
                        <span className="text-base">{msg.text}</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playChatAudio(msg.audioUri!)}
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                        >
                          <Play className="w-4 h-4" /> Audio
                        </Button>
                      )}
                    </div>
                    <span className="text-xs text-right opacity-70">{formatTimestamp(msg.timestamp)}</span>
                  </motion.div>
                ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Textarea
              ref={chatInputRef}
              value={currentMessage}
              onChange={e => setCurrentMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-gray-700 text-white rounded-md p-3 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
            />
            <Button
              onClick={sendMessage}
              className="bg-blue-500 text-white rounded-md p-3 hover:bg-blue-600"
              disabled={!currentMessage.trim()}
              aria-label="Enviar Mensaje"
            >
              <Send className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Speech to Text */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Dictado de Voz</h2>
          <div className="flex items-center gap-4">
            <Button
              onClick={toggleSpeechRecognition}
              className={cn(
                'rounded-full p-4 transition-colors',
                isListening ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
              aria-label={isListening ? 'Detener Dictado' : 'Iniciar Dictado'}
            >
              {isListening ? <StopCircle className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </Button>
            <div className="flex-1">
              <Textarea
                value={currentMessage}
                onChange={e => setCurrentMessage(e.target.value)}
                placeholder="Habla para escribir..."
                className="w-full bg-gray-700 text-white rounded-md p-3 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={1}
                ref={chatInputRef}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
            </div>
            {isListening && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                className="animate-pulse text-red-500"
              >
                Escuchando...
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-yellow-800 text-black p-4 text-center border-t border-yellow-700 flex items-center justify-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        <span className="text-sm">
          Esta aplicación es una simulación y no es para uso en producción real. El audio se reproduce a través del
          altavoz del dispositivo.
        </span>
      </footer>
    </div>
  );
};

export default AndroidWalkieTalkie;
