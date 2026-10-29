import { useState, useEffect } from 'react';
import type { Room, Player, Role, RoomSettings, ChatMessage, GameAction } from './types/werewolf';
import { gameService } from './services/gameService';
import type { BackendMode } from './services/gameService';
import { getSavedPlayerName, savePlayerName, getOrCreateSessionId } from './services/supabaseClient';
import { Header } from './components/Header';
import { BackgroundAmbience } from './components/BackgroundAmbience';
import { RulesModal } from './components/RulesModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { InstallPWAModal } from './components/InstallPWAModal';
import { HomeScreen } from './screens/HomeScreen';
import { CreateRoomScreen } from './screens/CreateRoomScreen';
import { JoinRoomScreen } from './screens/JoinRoomScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { RoleRevealScreen } from './screens/RoleRevealScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen } from './screens/GameOverScreen';

type ScreenState = 'HOME' | 'CREATE_ROOM' | 'JOIN_ROOM' | 'LOBBY' | 'ROLE_REVEAL' | 'GAME' | 'GAME_OVER';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('HOME');
  const [playerName, setPlayerName] = useState<string>(getSavedPlayerName() || 'Dân Làng');
  const [room, setRoom] = useState<Room | null>(null);
  const [myPlayer, setMyPlayer] = useState<Player | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [backendMode, setBackendMode] = useState<BackendMode>(gameService.getMode());
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Initialize session & PWA prompt listener
  useEffect(() => {
    getOrCreateSessionId();

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Auto reconnect if room code in URL or localStorage
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('room') || window.location.hash.replace('#', '');
    const savedCode = localStorage.getItem('langsoi_active_room_code');

    const codeToTry = urlCode || savedCode;
    if (codeToTry && codeToTry.length >= 4) {
      gameService.reconnectRoom(codeToTry).then((res) => {
        if (res) {
          setRoom(res.room);
          setMyPlayer(res.player);
          navigateByRoomPhase(res.room);
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Subscribe to realtime updates whenever room changes
  useEffect(() => {
    if (!room?.id) return;

    localStorage.setItem('langsoi_active_room_code', room.code);

    const unsubscribe = gameService.subscribeToRoom(room.id, {
      onRoomUpdate: (updatedRoom) => {
        setRoom(updatedRoom);
        const myId = getOrCreateSessionId();
        const me = updatedRoom.players.find((p) => p.id === myId);
        setMyPlayer(me);
        navigateByRoomPhase(updatedRoom);
      },
      onMessage: (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      },
      onAction: () => {},
    });

    return () => unsubscribe();
  }, [room?.id]);

  const navigateByRoomPhase = (targetRoom: Room) => {
    if (targetRoom.phase === 'LOBBY') {
      setCurrentScreen('LOBBY');
    } else if (targetRoom.phase === 'ROLE_REVEAL') {
      setCurrentScreen('ROLE_REVEAL');
    } else if (targetRoom.phase === 'GAME_OVER') {
      setCurrentScreen('GAME_OVER');
    } else {
      setCurrentScreen('GAME');
    }
  };

  // Actions
  const handleCreateRoomSubmit = async (
    settings: RoomSettings,
    roleDistribution: Record<Role, number>
  ) => {
    setIsLoading(true);
    try {
      savePlayerName(playerName);
      const newRoom = await gameService.createRoom(playerName, settings, roleDistribution);
      setRoom(newRoom);
      setMyPlayer(newRoom.players[0]);
      setCurrentScreen('LOBBY');
    } catch (err: any) {
      alert(`Lỗi tạo phòng: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoomSubmit = async (code: string) => {
    setIsLoading(true);
    try {
      savePlayerName(playerName);
      const res = await gameService.joinRoom(code, playerName);
      setRoom(res.room);
      setMyPlayer(res.player);
      navigateByRoomPhase(res.room);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!room) return;
    await gameService.startGame(room.id);
  };

  const handleLeaveRoom = async () => {
    if (room) {
      await gameService.leaveRoom(room.id);
    }
    localStorage.removeItem('langsoi_active_room_code');
    setRoom(null);
    setMyPlayer(undefined);
    setMessages([]);
    setCurrentScreen('HOME');
  };

  const handleAddBot = async () => {
    if (!room) return;
    await gameService.addTestBot(room.id);
  };

  const handleAdvancePhase = async () => {
    if (!room) return;
    await gameService.advancePhase(room.id);
  };

  const handleSubmitNightAction = async (
    actionType: GameAction['actionType'],
    targetId?: string | null,
    extraData?: any
  ) => {
    if (!room) throw new Error('Không tìm thấy phòng.');
    return gameService.submitNightAction(room.id, actionType, targetId, extraData);
  };

  const handleSubmitVote = async (targetId: string | null) => {
    if (!room) throw new Error('Không tìm thấy phòng.');
    await gameService.submitVote(room.id, targetId);
  };

  const handleSendMessage = async (content: string, channel: ChatMessage['channel']) => {
    if (!room) return;
    await gameService.sendMessage(room.id, content, channel);
  };

  const handlePlayAgain = async () => {
    if (!room) return;
    await gameService.startGame(room.id);
  };

  return (
    <div className="relative min-h-screen min-h-[100dvh] flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Ambience Stars & Fog */}
      <BackgroundAmbience phase={room?.phase} />

      {/* Persistent Header */}
      <Header
        backendMode={backendMode}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenInstall={() => setIsInstallOpen(true)}
        deferredPrompt={deferredPrompt}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-center">
        {currentScreen === 'HOME' && (
          <HomeScreen
            onCreateRoom={(name) => {
              setPlayerName(name);
              setCurrentScreen('CREATE_ROOM');
            }}
            onJoinRoom={(name) => {
              setPlayerName(name);
              setCurrentScreen('JOIN_ROOM');
            }}
            onOpenRules={() => setIsRulesOpen(true)}
            onOpenConfig={() => setIsConfigOpen(true)}
            backendMode={backendMode}
          />
        )}

        {currentScreen === 'CREATE_ROOM' && (
          <CreateRoomScreen
            playerName={playerName}
            onBack={() => setCurrentScreen('HOME')}
            onSubmitCreate={handleCreateRoomSubmit}
            isLoading={isLoading}
          />
        )}

        {currentScreen === 'JOIN_ROOM' && (
          <JoinRoomScreen
            onBack={() => setCurrentScreen('HOME')}
            onSubmitJoin={handleJoinRoomSubmit}
            isLoading={isLoading}
          />
        )}

        {currentScreen === 'LOBBY' && room && (
          <LobbyScreen
            room={room}
            myPlayer={myPlayer}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onAddBot={handleAddBot}
          />
        )}

        {currentScreen === 'ROLE_REVEAL' && (
          <RoleRevealScreen
            myPlayer={myPlayer}
            onProceed={handleAdvancePhase}
          />
        )}

        {currentScreen === 'GAME' && room && (
          <GameScreen
            room={room}
            myPlayer={myPlayer}
            messages={messages}
            onSubmitNightAction={handleSubmitNightAction}
            onSubmitVote={handleSubmitVote}
            onAdvancePhase={handleAdvancePhase}
            onSendMessage={handleSendMessage}
          />
        )}

        {currentScreen === 'GAME_OVER' && room && (
          <GameOverScreen
            room={room}
            myPlayer={myPlayer}
            onPlayAgain={handlePlayAgain}
            onBackToLobby={() => setCurrentScreen('LOBBY')}
            onBackToHome={() => {
              localStorage.removeItem('langsoi_active_room_code');
              setRoom(null);
              setCurrentScreen('HOME');
            }}
          />
        )}
      </main>

      {/* Modals */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigSaved={() => setBackendMode(gameService.getMode())}
      />

      <InstallPWAModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
        deferredPrompt={deferredPrompt}
      />
    </div>
  );
}

export default App;
