import React, { useState, useEffect, useRef } from 'react';
import { Heart, Zap, Shield, Star, Volume2, VolumeX } from 'lucide-react';

export default function KisikSite() {
  const [gameState, setGameState] = useState('intro');
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);
  const [playerPos, setPlayerPos] = useState({ x: 275, y: 360 });
  const [hearts, setHearts] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [particles, setParticles] = useState([]);
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const [muted, setMuted] = useState(false);

  // Initialize game
  useEffect(() => {
    if (gameState === 'game') {
      setScore(0);
      setHealth(3);
      setPlayerPos({ x: 275, y: 360 });
      initializeGameElements();
    }
  }, [gameState]);

  const initializeGameElements = () => {
    const newHearts = Array.from({ length: 8 }, () => ({
      id: Math.random(),
      x: Math.random() * 520,
      y: Math.random() * 300,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 2 + 1
    }));
    const newEnemies = Array.from({ length: 3 }, () => ({
      id: Math.random(),
      x: Math.random() * 520,
      y: Math.random() * 200,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 2 + 1
    }));
    setHearts(newHearts);
    setEnemies(newEnemies);
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'game') return;

    gameLoopRef.current = setInterval(() => {
      setHearts(prev => {
        const updated = prev.map(h => {
          let nx = h.x + h.vx;
          let ny = h.y + h.vy;
          let nvx = h.vx;
          let nvy = h.vy;

          if (nx < 0 || nx > 550) nvx *= -1;
          if (ny < 0 || ny > 400) nvy *= -1;

          return { ...h, x: nx, y: ny, vx: nvx, vy: nvy };
        });

        // Check collisions with player
        updated.forEach((heart, idx) => {
          setPlayerPos(pos => {
            const dist = Math.hypot(heart.x - pos.x, heart.y - pos.y);
            if (dist < 30) {
              createParticleEffect(heart.x, heart.y);
              setScore(s => {
                const newScore = s + 1;
                if (newScore >= 15) {
                  setGameState('result');
                }
                return newScore;
              });
              updated.splice(idx, 1);
            }
            return pos;
          });
        });

        if (updated.length < 3) {
          updated.push({
            id: Math.random(),
            x: Math.random() * 520,
            y: Math.random() * 300,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 2 + 1
          });
        }

        return updated;
      });

      setEnemies(prev => {
        const updated = prev.map(e => {
          let nx = e.x + e.vx;
          let ny = e.y + e.vy;
          let nvx = e.vx;
          let nvy = e.vy;

          if (nx < 0 || nx > 550) nvx *= -1;
          if (ny < 0 || ny > 400) nvy *= -1;

          return { ...e, x: nx, y: ny, vx: nvx, vy: nvy };
        });

        // Check collisions with player
        setPlayerPos(pos => {
          updated.forEach(enemy => {
            const dist = Math.hypot(enemy.x - pos.x, enemy.y - pos.y);
            if (dist < 40) {
              setHealth(h => {
                if (h <= 1) {
                  setGameState('intro');
                  alert('Game Over! You lost all your health. Try again!');
                  return 3;
                }
                return h - 1;
              });
              setPlayerPos({ x: 275, y: 360 });
            }
          });
          return pos;
        });

        return updated;
      });
    }, 50);

    return () => clearInterval(gameLoopRef.current);
  }, [gameState]);

  // Mouse control
  useEffect(() => {
    if (gameState !== 'game' || !canvasRef.current) return;

    const handleMouseMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      setPlayerPos({
        x: Math.max(25, Math.min(525, e.clientX - rect.left)),
        y: Math.max(25, Math.min(375, e.clientY - rect.top))
      });
    };

    canvasRef.current.addEventListener('mousemove', handleMouseMove);
    return () => canvasRef.current?.removeEventListener('mousemove', handleMouseMove);
  }, [gameState]);

  const createParticleEffect = (x, y) => {
    const newParticles = Array.from({ length: 10 }, () => ({
      id: Math.random(),
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 2,
      life: 1,
      emoji: ['✨', '💫', '⭐'][Math.floor(Math.random() * 3)]
    }));

    setParticles(prev => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.life > 0.1));
    }, 500);
  };

  // Particle animation
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.1
          }))
          .filter(p => p.life > 0)
      );
    }, 30);
    return () => clearInterval(timer);
  }, [particles.length]);

  const playSound = () => {
    if (!muted) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-500 to-blue-500 flex items-center justify-center overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Particles display */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="fixed text-2xl"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              opacity: p.life,
              transform: `scale(${p.life})`
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Intro Screen */}
      {gameState === 'intro' && (
        <div className="relative z-10 text-center px-4">
          <div className="mb-8 animate-bounce">
            <Heart className="w-24 h-24 mx-auto text-white drop-shadow-lg" fill="white" />
          </div>
          <h1 className="text-6xl font-black text-white mb-6 drop-shadow-lg animate-pulse">
            Hey Kisik ✨
          </h1>
          <div className="text-2xl text-white mb-4 drop-shadow-md">
            There's a special message waiting for you...
          </div>
          <div className="text-xl text-white mb-8 drop-shadow-md opacity-90">
            But first, you need to complete a challenge! 💫
          </div>
          <button
            onClick={() => setGameState('game')}
            className="px-8 py-4 bg-white text-pink-600 font-bold text-lg rounded-full hover:scale-110 hover:shadow-2xl transition-all duration-300 mb-6 drop-shadow-lg animate-pulse"
          >
            Start the Quest 🚀
          </button>
          <button
            onClick={() => setMuted(!muted)}
            className="fixed top-6 right-6 p-3 bg-white/20 backdrop-blur hover:bg-white/40 rounded-full transition-all z-50"
          >
            {muted ? <VolumeX className="text-white" /> : <Volume2 className="text-white" />}
          </button>
        </div>
      )}

      {/* Game Screen */}
      {gameState === 'game' && (
        <div className="relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
              🎮 Catch the Hearts! ❤️
            </h2>
            <p className="text-xl text-white/90 drop-shadow-md">Collect 15 hearts to reveal your message</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border-4 border-white rounded-2xl p-6 shadow-2xl">
            <svg
              ref={canvasRef}
              width={550}
              height={400}
              className="bg-black/30 rounded-xl border-2 border-white/50 cursor-none mx-auto"
            >
              {/* Player */}
              <circle
                cx={playerPos.x}
                cy={playerPos.y}
                r={20}
                fill="#ffeb3b"
                stroke="white"
                strokeWidth="2"
                className="drop-shadow-lg"
              />
              <circle
                cx={playerPos.x}
                cy={playerPos.y}
                r={20}
                fill="none"
                stroke="white"
                strokeWidth="2"
                opacity="0.5"
                className="animate-pulse"
              />

              {/* Hearts */}
              {hearts.map(heart => (
                <text
                  key={heart.id}
                  x={heart.x}
                  y={heart.y}
                  fontSize="24"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="cursor-pointer animate-bounce drop-shadow-lg"
                >
                  ❤️
                </text>
              ))}

              {/* Enemies */}
              {enemies.map(enemy => (
                <g key={enemy.id}>
                  <circle
                    cx={enemy.x}
                    cy={enemy.y}
                    r={15}
                    fill="rgba(0, 0, 0, 0.7)"
                    stroke="#ff6b6b"
                    strokeWidth="2"
                  />
                  <circle
                    cx={enemy.x}
                    cy={enemy.y}
                    r={15}
                    fill="none"
                    stroke="#ff6b6b"
                    strokeWidth="1"
                    opacity="0.5"
                    className="animate-pulse"
                  />
                </g>
              ))}
            </svg>

            {/* Stats */}
            <div className="flex justify-around mt-6 gap-4">
              <div className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-lg backdrop-blur">
                <Heart className="text-red-400" size={24} />
                <span className="text-white font-bold text-xl">{score}/15</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-lg backdrop-blur">
                <Shield className="text-blue-400" size={24} />
                <span className="text-white font-bold text-xl">{health}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-lg backdrop-blur">
                <Zap className="text-yellow-400" size={24} />
                <span className="text-white font-bold text-xl">{Math.floor(score * 6)}%</span>
              </div>
            </div>

            <p className="text-white text-sm text-center mt-4 opacity-80">
              Use MOUSE to move • Avoid the dark circles! ⚠️
            </p>
          </div>
        </div>
      )}

      {/* Result Screen */}
      {gameState === 'result' && (
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-md border-4 border-white rounded-3xl p-12 text-center shadow-2xl animate-in fade-in zoom-in">
            <div className="mb-6 animate-bounce">
              <Star className="w-20 h-20 mx-auto text-yellow-300 drop-shadow-lg" fill="yellow" />
            </div>

            <h2 className="text-5xl font-black text-white mb-8 drop-shadow-lg">
              🎉 You Did It! 🎉
            </h2>

            <p className="text-2xl text-white mb-8 drop-shadow-md font-semibold">
              Kisik, I need you to know something...
            </p>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-8 border-2 border-yellow-300">
              <p className="text-xl text-yellow-200 font-bold mb-6 leading-relaxed drop-shadow-lg">
                You make every day brighter just by being you. Your kindness, your strength, your amazing spirit—it all matters so much to me. 💛
              </p>

              <div className="space-y-3 text-white text-lg mb-8">
                <p><span className="font-bold text-yellow-300">K</span> - Keep shining bright ⭐</p>
                <p><span className="font-bold text-yellow-300">I</span> - Incredibly special ✨</p>
                <p><span className="font-bold text-yellow-300">S</span> - Strong and beautiful 💪</p>
                <p><span className="font-bold text-yellow-300">I</span> - Inspiring everyone around you 🌟</p>
                <p><span className="font-bold text-yellow-300">K</span> - Kind-hearted always 💝</p>
              </div>

              <div className="text-4xl mb-6 animate-bounce flex justify-center gap-4">
                <span>❤️</span>
                <span>💫</span>
                <span>❤️</span>
              </div>
            </div>

            <p className="text-white text-lg mb-8 opacity-90">
              Thank you for being amazing. You deserve all the love in the world. 🌍💕
            </p>

            <button
              onClick={() => {
                setGameState('intro');
                playSound();
              }}
              className="px-8 py-4 bg-white text-pink-600 font-bold text-lg rounded-full hover:scale-110 hover:shadow-2xl transition-all duration-300 drop-shadow-lg"
            >
              Play Again 🎮
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}