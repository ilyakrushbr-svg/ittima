/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Howl } from 'howler';
import ReactMarkdown from 'react-markdown';
import { 
  Shield, 
  ChevronRight, 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  User, 
  Trophy, 
  X, 
  Plus,
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Smartphone,
  Layout,
  Zap,
  Award,
  Check,
  Phone,
  Instagram,
  Info,
  Loader2,
  Languages,
  Settings,
  Users,
  Music,
  Music2,
  ExternalLink,
  RefreshCw,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic
} from 'lucide-react';
import scenariosData from './data/scenarios';
import { Scenario, Option } from './types';
import { 
  auth, 
  handleFirestoreError, 
  OperationType,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  onAuthStateChanged
} from './firebase';

// --- Types ---

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

const SPHERES = [
  { id: 'phishing', name_be: 'Фішынг', name_ru: 'Фишинг', icon: '🎣' },
  { id: 'social_engineering', name_be: 'Соц. інжынерыя', name_ru: 'Соц. инженерия', icon: '🎭' },
  { id: 'online_games', name_be: 'Гульні', name_ru: 'Игры', icon: '🎮' },
  { id: 'finance', name_be: 'Фінансы', name_ru: 'Финансы', icon: '💰' },
  { id: 'privacy', name_be: 'Прыватнасць', name_ru: 'Приватность', icon: '🔒' },
  { id: 'malware', name_be: 'Вірусы', name_ru: 'Вирусы', icon: '🦠' },
  { id: 'child_safety', name_be: 'Дзеці', name_ru: 'Дети', icon: '👶' },
  { id: 'passwords', name_be: 'Паролі', name_ru: 'Пароли', icon: '🔑' },
  { id: 'work_safety', name_be: 'Работа', name_ru: 'Работа', icon: '💼' },
  { id: 'deepfakes', name_be: 'Дыпфейкі', name_ru: 'Дипфейки', icon: '🤖' },
  { id: 'cyber_fraud', name_be: 'Кібер-махлярства', name_ru: 'Кибер-мошенничество', icon: '🕵️' },
];

const RANKS = [
  { min: 0, name_be: '🌱 Навічок', name_ru: '🌱 Новичок', color: '#30D158' },
  { min: 20, name_be: '👤 Карыстач', name_ru: '👤 Пользователь', color: '#0A84FF' },
  { min: 40, name_be: '⚡ Прасунуты', name_ru: '⚡ Продвинутый', color: '#FF9F0A' },
  { min: 60, name_be: '🛡️ Абаронца', name_ru: '🛡️ Защитник', color: '#BF5AF2' },
  { min: 80, name_be: '🔰 Эксперт', name_ru: '🔰 Эксперт', color: '#FF453A' },
  { min: 95, name_be: '💎 Кібершчыт', name_ru: '💎 Киберщит', color: '#FFD60A' },
];

const TIMER_SECS = 15;
const N_QUESTIONS = 10;

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 };

export default function App() {
  const tg = window.Telegram?.WebApp;
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{ show: boolean; title: string; onConfirm: () => void } | null>(null);
  const [showAlertModal, setShowAlertModal] = useState<{ show: boolean; title: string; message: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [screen, setScreen] = useState<'loading' | 'welcome' | 'intro' | 'game' | 'final' | 'hub' | 'leaderboard' | 'news' | 'onboarding' | 'admin'>('loading');
  const [activeTab, setActiveTab] = useState<'home' | 'news' | 'leaderboard' | 'profile'>('home');

  const isAdmin = auth.currentUser?.email === 'ilya.krush.br@gmail.com';

  // Persistence
  const [lang, setLang] = useState<'be' | 'ru'>(() => {
    const saved = localStorage.getItem('scamlab_lang');
    if (saved) return saved as 'be' | 'ru';
    const tgLang = tg?.initDataUnsafe?.user?.language_code;
    if (tgLang === 'be') return 'be';
    return 'ru'; // Default to RU for others or if not specified
  });
  const [nickname, setNickname] = useState(() => localStorage.getItem('scamlab_nickname') || tg?.initDataUnsafe?.user?.first_name || 'Ананім');
  const [photoURL, setPhotoURL] = useState(() => localStorage.getItem('scamlab_photo') || tg?.initDataUnsafe?.user?.photo_url || '');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('scamlab_sound') !== 'false');
  const [musicEnabled, setMusicEnabled] = useState(() => localStorage.getItem('scamlab_music') !== 'false');
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('scamlab_xp') || '0'));
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem('scamlab_level') || '1'));
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('scamlab_streak') || '0'));
  const [maxComboOverall, setMaxComboOverall] = useState(() => parseInt(localStorage.getItem('scamlab_max_combo') || '0'));
  const [totalCorrect, setTotalCorrect] = useState(() => parseInt(localStorage.getItem('scamlab_total_correct') || '0'));
  const [totalAnswered, setTotalAnswered] = useState(() => parseInt(localStorage.getItem('scamlab_total_answered') || '0'));
  const [completedScenarios, setCompletedScenarios] = useState<number[]>(() => {
    const saved = localStorage.getItem('scamlab_completed');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  
  const [selectedSphere, setSelectedSphere] = useState<string | null>(null);
  const [selectedDiff, setSelectedDiff] = useState('all');

  // Firebase state
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [dynamicScenarios, setDynamicScenarios] = useState<Scenario[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const allScenarios = [...scenariosData, ...dynamicScenarios];

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase Auth State:', user ? 'Authenticated' : 'Unauthenticated');
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Leaderboard from Firestore
  useEffect(() => {
    if (!isAuthReady) return;
    
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(players);
      
      // Calculate user rank if tg user exists
      const tgUser = tg?.initDataUnsafe?.user;
      if (tgUser?.id) {
        const rank = players.findIndex(p => p.id === tgUser.id.toString());
        if (rank !== -1) setUserRank(rank + 1);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [isAuthReady, tg]);
  const [introView, setIntroView] = useState<'training' | 'news'>('training');
  const [isSyncing, setIsSyncing] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);

  // Sync user data to SQLite Backend
  const syncUserWithBackend = useCallback(async (userId: any, data: any) => {
    if (!userId || userId === 'local-user') return;
    setIsSyncing(true);
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          username: tg?.initDataUnsafe?.user?.username,
          firstName: tg?.initDataUnsafe?.user?.first_name,
          xp: data.xp ?? xp,
          level: data.level ?? level,
          lang: data.lang ?? lang,
          streak: data.streak ?? streak,
          maxCombo: data.maxCombo ?? maxComboOverall,
          totalAnswered: data.totalAnswered ?? totalAnswered,
          totalCorrect: data.totalCorrect ?? totalCorrect
        })
      });
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [xp, level, lang, tg]);

  // Sync persistence
  useEffect(() => { localStorage.setItem('scamlab_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('scamlab_nickname', nickname); }, [nickname]);
  useEffect(() => { localStorage.setItem('scamlab_photo', photoURL); }, [photoURL]);
  useEffect(() => { localStorage.setItem('scamlab_sound', String(soundEnabled)); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('scamlab_music', String(musicEnabled)); }, [musicEnabled]);
  useEffect(() => { localStorage.setItem('scamlab_xp', String(xp)); }, [xp]);
  useEffect(() => { localStorage.setItem('scamlab_level', String(level)); }, [level]);
  useEffect(() => { localStorage.setItem('scamlab_streak', String(streak)); }, [streak]);
  useEffect(() => { localStorage.setItem('scamlab_max_combo', String(maxComboOverall)); }, [maxComboOverall]);
  useEffect(() => { localStorage.setItem('scamlab_total_correct', String(totalCorrect)); }, [totalCorrect]);
  useEffect(() => { localStorage.setItem('scamlab_total_answered', String(totalAnswered)); }, [totalAnswered]);
  useEffect(() => { localStorage.setItem('scamlab_completed', JSON.stringify(completedScenarios)); }, [completedScenarios]);

  // Persistence logic and Initial Data Load
  useEffect(() => {
    const fetchUserData = async () => {
      const tgUser = tg?.initDataUnsafe?.user;
      if (!tgUser?.id) {
        setIsAuthReady(true);
        return;
      }

      // Automatically set telegramId if we are in TG
      setTelegramId(tgUser.id.toString());

      try {
        const res = await fetch(`/api/user/${tgUser.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.lang) setLang(data.lang);
          if (data.nickname) setNickname(data.nickname);
          if (data.xp) setXp(data.xp);
          if (data.level) setLevel(data.level);
          if (data.streak) setStreak(data.streak);
          if (data.maxCombo) setMaxComboOverall(data.maxCombo);
          if (data.totalCorrect) setTotalCorrect(data.totalCorrect);
          if (data.totalAnswered) setTotalAnswered(data.totalAnswered);
          // Potential completed scenarios sync
        } else {
          // New user or not found, sync initial info
          await syncUserWithBackend(tgUser.id, {
            id: tgUser.id,
            username: tgUser.username,
            firstName: tgUser.first_name,
            lang: lang,
            xp: xp,
            level: 1
          });
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      } finally {
        setIsAuthReady(true);
      }
    };

    fetchUserData();
  }, [tg, syncUserWithBackend]);

  // Sync Telegram data if it changes
  useEffect(() => {
    if (tg?.initDataUnsafe?.user) {
      const tgUser = tg.initDataUnsafe.user;
      if (tgUser.first_name && tgUser.first_name !== nickname) {
        setNickname(tgUser.first_name);
      }
      if (tgUser.photo_url && tgUser.photo_url !== photoURL) {
        setPhotoURL(tgUser.photo_url);
      }
    }
  }, [tg]);

  // Trigger sync on important changes
  const sendNotification = async (message: string) => {
    if (!telegramId || !auth.currentUser) return;
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: auth.currentUser.uid, message })
      });
    } catch (err) {
      console.error('Notification failed:', err);
    }
  };

  const triggerSync = useCallback(() => {
    if (auth.currentUser && isAuthReady) {
      syncUserWithBackend(auth.currentUser.uid, {
        nickname,
        lang,
        xp,
        level,
        photoURL,
        completedScenarios,
        scenariosCompleted: completedScenarios.length,
        telegramId,
        linkCode
      });
    }
  }, [nickname, lang, xp, level, photoURL, completedScenarios, isAuthReady, telegramId, linkCode]);

  const generateLinkCode = async () => {
    if (!auth.currentUser) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setLinkCode(code);
    // await updateDoc(doc(db, 'users', auth.currentUser.uid), { linkCode: code });
  };

  // Screen transition sound
  useEffect(() => {
    if (screen !== 'loading' && screen !== 'game') {
      playSfx('transition');
    }
  }, [screen]);

  // Auto-sync on data changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      triggerSync();
    }, 1000); // Debounce sync
    return () => clearTimeout(timeout);
  }, [nickname, lang, xp, photoURL, completedScenarios, triggerSync]);

  const shareApp = () => {
    if (tg) {
      const shareUrl = `https://t.me/share/url?url=https://t.me/scamlabbot/app&text=${encodeURIComponent(t('Правер свае веды ў кібербяспецы ў SCAMLAB! 🛡️', 'Проверь свои знания в кибербезопасности в SCAMLAB! 🛡️'))}`;
      tg.openTelegramLink(shareUrl);
    }
  };

  useEffect(() => {
    // Analytics/Session tracking logic could go here
  }, []);

  // --- Components ---

  const StatsOverview = ({ variant = 'default' }: { variant?: 'default' | 'profile' }) => {
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const currentRank = RANKS.filter(r => level >= r.min).pop();
    
    if (variant === 'profile') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="glass p-5 rounded-[28px]">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('Рэйтынг', 'Рейтинг')}</span>
              </div>
              <div className="text-2xl font-black">#{userRank || '---'}</div>
            </div>
            <div className="glass p-5 rounded-[28px]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('Вопыт', 'Опыт')}</span>
              </div>
              <div className="text-2xl font-black">{xp} XP</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-[28px] bg-white/5 border border-white/5">
              <div className="text-[10px] font-bold text-white/30 uppercase mb-1">{t('Серыя', 'Серия')}</div>
              <div className="text-xl font-black text-yellow-400">{streak} 🔥</div>
            </div>
            <div className="p-5 rounded-[28px] bg-white/5 border border-white/5">
              <div className="text-[10px] font-bold text-white/30 uppercase mb-1">{t('Лепшая комба', 'Лучшее комбо')}</div>
              <div className="text-xl font-black text-orange-500">{maxComboOverall} 🎯</div>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold">{t('Пройдзена тэстаў', 'Пройдено тестов')}</span>
                <span className="text-xs font-black">{completedScenarios.length} / {allScenarios.length}</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (completedScenarios.length / Math.max(1, allScenarios.length)) * 100)}%` }}
                  className="h-full bg-blue-500" 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold">{t('Дакладнасць', 'Точность')}</span>
                <span className="text-xs font-black">{accuracy}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${accuracy}%` }}
                  className="h-full bg-green-500" 
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4 rounded-[24px] text-center">
          <div className="text-2xl font-black text-yellow-400">{xp}</div>
          <div className="text-[9px] font-bold text-white/50 uppercase">XP</div>
        </div>
        <div className="glass p-4 rounded-[24px] text-center border-blue-500/30 bg-blue-500/5">
          <div className="text-2xl font-black text-blue-500">{level}</div>
          <div className="text-[9px] font-bold text-white/50 uppercase">{t('узровень', 'уровень')}</div>
        </div>
        <div className="glass p-4 rounded-[24px] text-center border-yellow-500/20 bg-yellow-500/5 relative overflow-hidden">
          <div className="absolute top-1 right-1 opacity-20"><Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /></div>
          <div className="text-2xl font-black text-yellow-400">{streak}</div>
          <div className="text-[9px] font-bold text-white/50 uppercase">{t('серыя', 'серия')}</div>
        </div>
        <div className="glass p-4 rounded-[24px] text-center border-green-500/20 bg-green-500/5">
          <div className="text-2xl font-black text-green-500">{accuracy}%</div>
          <div className="text-[9px] font-bold text-white/50 uppercase">{t('дакладнасць', 'точность')}</div>
        </div>
      </div>
    );
  };
  const [dailyCompleted, setDailyCompleted] = useState(() => {
    const lastDaily = localStorage.getItem('lastDailyDate');
    return lastDaily === new Date().toDateString();
  });

  const startDailyChallenge = async () => {
    if (dailyCompleted) {
      alert(t('Вы ўжо прайшлі сённяшні тэст!', 'Вы уже прошли сегодняшний тест!'));
      return;
    }
    
    playSfx('click');
    
    // Pick 10 random scenarios for daily challenge
    const shuffled = [...allScenarios].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(10, shuffled.length)).map(q => ({
      ...q,
      options: [...q.options].sort(() => 0.5 - Math.random())
    }));

    setGameQuestions(selected);
    setCurrentQIdx(0);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setCombo(0);
    setMaxCombo(0);
    setAnswered(false);
    setSelectedOptionIdx(null);
    setShowFeedback(false);
    setScreen('game');
    startTimer();
    
    localStorage.setItem('lastDailyDate', new Date().toDateString());
    setDailyCompleted(true);
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  };

  const bgMusic = useRef<Howl | null>(null);
  const sfx = useRef<{ [key: string]: Howl }>({});

  // --- Sound Init ---
  useEffect(() => {
    bgMusic.current = new Howl({
      src: ['https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3'],
      loop: true,
      volume: 0.2,
      autoplay: musicEnabled,
    });

    sfx.current = {
      click: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-modern-technology-select-3124.mp3'], volume: 0.5 }),
      success: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-reward-952.mp3'], volume: 0.5 }),
      error: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3'], volume: 0.5 }),
      transition: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-digital-quick-sweep-2342.mp3'], volume: 0.3 }),
    };

    return () => {
      bgMusic.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (musicEnabled) {
      bgMusic.current?.play();
    } else {
      bgMusic.current?.pause();
    }
  }, [musicEnabled]);

  const playSfx = (name: string) => {
    if (soundEnabled) {
      sfx.current[name]?.play();
    }
  };

  // Game State
  const [gameQuestions, setGameQuestions] = useState<Scenario[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timer, setTimer] = useState(TIMER_SECS);
  const [answered, setAnswered] = useState(false);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Telegram Init ---
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      tg.setHeaderColor('#000000');
      tg.setBackgroundColor('#000000');
      if (tg.initDataUnsafe?.user?.first_name) {
        setNickname(tg.initDataUnsafe.user.first_name);
      }
    }
  }, [tg]);

  // --- Back Button Handling ---
  useEffect(() => {
    if (tg) {
      if (screen === 'welcome' || screen === 'intro') {
        tg.BackButton.hide();
      } else {
        tg.BackButton.show();
        tg.BackButton.offClick();
        tg.BackButton.onClick(() => {
          if (screen === 'game') {
            setShowConfirmModal({
              show: true,
              title: t('Выйсці? Прагрэс будзе страчаны.', 'Выйти? Прогресс будет потерян.'),
              onConfirm: () => {
                setScreen('intro');
                setShowConfirmModal(null);
              }
            });
          } else {
            setScreen('intro');
            setActiveTab('home');
          }
        });
      }
    }
  }, [screen, tg]);

  // --- Game Logic ---
  const handleAutoFail = useCallback(() => {
    setAnswered(true);
    setCombo(0);
    setWrongCount(prev => prev + 1);
    setShowFeedback(true);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
  }, [tg]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(TIMER_SECS);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoFail();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleAutoFail]);

  const startGame = useCallback(() => {
    playSfx('transition');
    const data = allScenarios;
    let pool = Array.isArray(data) ? [...data] : [] as Scenario[];
    
    if (pool.length === 0) {
      console.error('Scenarios data is empty or invalid');
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
      setShowAlertModal({
        show: true,
        title: t('Памылка', 'Ошибка'),
        message: t('Памылка: Сцэнарыі не загружаны. Калі ласка, перазагрузіце старонку.', 'Ошибка: Сценарии не загружены. Пожалуйста, перезагрузите страницу.')
      });
      return;
    }

    if (selectedSphere) {
      const filtered = pool.filter(s => s.sphere === selectedSphere);
      if (filtered.length > 0) pool = filtered;
    }
    
    if (selectedDiff !== 'all') {
      const filtered = pool.filter(s => s.difficulty === selectedDiff);
      if (filtered.length > 0) pool = filtered;
    }

    const shuffled = pool.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(N_QUESTIONS, pool.length)).map(q => ({
      ...q,
      options: [...q.options].sort(() => 0.5 - Math.random())
    }));

    setGameQuestions(selected);
    setCurrentQIdx(0);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setCombo(0);
    setMaxCombo(0);
    setAnswered(false);
    setSelectedOptionIdx(null);
    setShowFeedback(false);
    setScreen('game');
    startTimer();
    
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
  }, [selectedSphere, selectedDiff, tg, startTimer]);

  // --- Loading Logic ---
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            
            // Deep Linking Check
            const startParam = tg?.initDataUnsafe?.start_param;
            if (startParam && startParam.startsWith('scenario_')) {
              const scenarioId = parseInt(startParam.replace('scenario_', ''));
              const scenario = allScenarios.find(s => s.id === scenarioId);
              
              if (scenario) {
                const preparedScenario = {
                  ...scenario,
                  options: [...scenario.options].sort(() => 0.5 - Math.random())
                };
                setGameQuestions([preparedScenario]);
                setCurrentQIdx(0);
                setScore(0);
                setCorrectCount(0);
                setWrongCount(0);
                setCombo(0);
                setMaxCombo(0);
                setAnswered(false);
                setSelectedOptionIdx(null);
                setShowFeedback(false);
                setScreen('game');
                startTimer();
                return 100;
              }
            }

            setScreen('welcome');
            setShowLangModal(true);
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [tg, startTimer]);

  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (!tg?.HapticFeedback) {
      // Fallback for non-telegram environments
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch(type) {
          case 'light': navigator.vibrate(10); break;
          case 'medium': navigator.vibrate(20); break;
          case 'heavy': navigator.vibrate(40); break;
          case 'success': navigator.vibrate([10, 30, 10]); break;
          case 'warning': navigator.vibrate([15, 50, 15]); break;
          case 'error': navigator.vibrate([20, 100, 20]); break;
        }
      }
      return;
    }
    
    if (type === 'success' || type === 'warning' || type === 'error') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  }, [tg]);

  const startAiGame = async () => {
    startGame();
  };

  const selectOption = useCallback((idx: number) => {
    if (answered) return;
    setAnswered(true);
    setSelectedOptionIdx(idx);
    if (timerRef.current) clearInterval(timerRef.current);

    const q = gameQuestions[currentQIdx];
    const opt = q.options[idx];
    const maxPts = Math.max(...q.options.map(o => o.points)) || 1;
    // An answer is considered correct if it has at least 80% of the maximum possible points
    const isCorrect = opt.points >= maxPts * 0.8;

    const timeBonus = (isCorrect && timer > 10) ? 2 : (isCorrect && timer > 5) ? 1 : 0;
    const pts = opt.points + timeBonus;
    
    setScore(prev => prev + pts);
    const newXp = xp + pts * 2;
    setXp(newXp); 

    // Update Streak: increment on incorrect, reset on correct
    if (!isCorrect) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    // Level calculation logic
    const newLevel = Math.floor(Math.sqrt(newXp / 10)) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      haptic('success');
    }

    if (isCorrect) {
      playSfx('success');
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      if (newCombo > maxComboOverall) setMaxComboOverall(newCombo);
      setCorrectCount(prev => prev + 1);
      setTotalCorrect(prev => prev + 1);
      
      if (newCombo % 5 === 0) {
        haptic('heavy');
      } else {
        haptic('success');
      }
    } else {
      playSfx('error');
      setCombo(0);
      setWrongCount(prev => prev + 1);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      haptic('error');
    }

    setTotalAnswered(prev => prev + 1);
    setShowFeedback(true);
  }, [answered, gameQuestions, currentQIdx, timer, tg, xp, level, combo, maxCombo, maxComboOverall, haptic, playSfx]);

  const nextQuestion = useCallback(() => {
    if (currentQIdx + 1 < gameQuestions.length) {
      setCurrentQIdx(prev => prev + 1);
      setAnswered(false);
      setSelectedOptionIdx(null);
      setShowFeedback(false);
      startTimer();
    } else {
      setScreen('final');
      if (score >= 80) {
        playSfx('success');
        sendNotification(t(`🏆 Выдатны вынік! Вы набралі ${score} балаў.`, `🏆 Отличный результат! Вы набрали ${score} баллов.`));
        haptic('success');
      } else if (score < 30) {
        playSfx('error');
        haptic('error');
      }
      
      // Mark scenarios as completed
      const newCompleted = [...completedScenarios];
      let changed = false;
      gameQuestions.forEach(q => {
        if (!newCompleted.includes(q.id)) {
          newCompleted.push(q.id);
          changed = true;
        }
      });
      
      if (changed) {
        setCompletedScenarios(newCompleted);
      } else {
        // Even if no new scenarios, sync the score
        triggerSync();
      }
    }
  }, [currentQIdx, gameQuestions, startTimer, score, playSfx, triggerSync, completedScenarios]);

  // --- Telegram WebApp Lifecycle ---
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      
      // Set header color
      tg.setHeaderColor('#000000');
      tg.setBackgroundColor('#000000');
    }
  }, [tg]);

  // Handle BackButton
  useEffect(() => {
    if (!tg) return;
    
    const handleBack = () => {
      if (screen === 'game') {
        setScreen('intro');
      } else if (screen === 'final') {
        setScreen('intro');
      } else if (screen === 'leaderboard' || screen === 'news' || screen === 'hub' || screen === 'admin') {
        setScreen('intro');
        setActiveTab('home');
      } else if (screen === 'intro') {
        setScreen('welcome');
      }
    };

    if (screen !== 'welcome' && screen !== 'loading' && screen !== 'onboarding') {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }

    return () => {
      tg.BackButton.offClick(handleBack);
    };
  }, [tg, screen]);

  // Handle MainButton for Game
  useEffect(() => {
    if (!tg) return;

    const handleMainClick = () => {
      if (screen === 'game' && answered) {
        nextQuestion();
      }
    };

    if (screen === 'game' && answered) {
      tg.MainButton.setText(t('ДАЛЕЙ', 'ДАЛЕЕ'));
      tg.MainButton.show();
      tg.MainButton.onClick(handleMainClick);
    } else {
      tg.MainButton.hide();
    }

    return () => {
      tg.MainButton.offClick(handleMainClick);
    };
  }, [tg, screen, answered, nextQuestion]);

  // --- Helper Components ---
  const LoadingScreen = () => (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="screen flex flex-col items-center justify-center p-8 bg-[#000] z-[999]"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative mb-12">
        <div className="w-32 h-32 rounded-[40px] glass-bright flex items-center justify-center relative z-10">
          <Shield className="w-14 h-14 text-blue-500" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-12px] rounded-[48px] border border-blue-500/20"
          ></motion.div>
        </div>
        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"></div>
      </div>
      
      <div className="w-full max-w-[240px] relative z-10">
        <div className="flex justify-between mb-3 px-1">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{t('Загрузка сістэмы...', 'Загрузка системы...')}</span>
          <span className="text-[10px] font-black text-blue-500 tabular-nums">{loadingProgress}%</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${loadingProgress}%` }}
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          ></motion.div>
        </div>
        <p className="text-[8px] text-center mt-4 text-white/20 font-bold uppercase tracking-widest animate-pulse">
          {t('Ініцыялізацыя пратаколаў бяспекі', 'Инициализация протоколов безопасности')}
        </p>
      </div>
      
      <div className="mt-12 text-center relative z-10">
        <p className="text-[10px] text-white/20 font-medium uppercase tracking-[0.3em]">ScamLab Protocol v2.6</p>
      </div>
    </motion.div>
  );

  const LanguageModal = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="suspended-panel w-full max-w-sm flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 rounded-2xl glass-bright flex items-center justify-center mb-6">
          <Languages className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-black mb-2">Выберыце мову / Выберите язык</h2>
        <p className="text-white/60 text-sm mb-8">На якой мове вам зручней праходзіць навучанне? / На каком языке вам удобнее проходить обучение?</p>
        
        <div className="grid grid-cols-1 gap-4 w-full">
          <button 
            onClick={() => {
              setLang('be');
              setShowLangModal(false);
              if (screen === 'welcome') {
                setShowOnboarding(true);
                setScreen('onboarding');
              }
              playSfx('click');
              haptic('medium');
              // Sync if already logged in
              if (auth.currentUser && isAuthReady) {
                syncUserWithBackend(auth.currentUser.uid, {
                  nickname,
                  lang: 'be',
                  xp,
                  photoURL
                });
              }
            }}
            className="btn-primary w-full py-5 rounded-[24px]"
          >
            🇧🇾 Беларуская
          </button>
          <button 
            onClick={() => {
              setLang('ru');
              setShowLangModal(false);
              if (screen === 'welcome') {
                setShowOnboarding(true);
                setScreen('onboarding');
              }
              playSfx('click');
              haptic('medium');
              // Sync if already logged in
              if (auth.currentUser && isAuthReady) {
                syncUserWithBackend(auth.currentUser.uid, {
                  nickname,
                  lang: 'ru',
                  xp,
                  photoURL
                });
              }
            }}
            className="btn-primary w-full py-5 rounded-[24px]"
          >
            🇷🇺 Русский
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  const t = (val: string | { be: string; ru: string } | any, ruVal?: string) => {
    if (!val) return '';
    if (typeof val === 'string') {
      if (ruVal) return lang === 'be' ? val : ruVal;
      return val;
    }
    if (val[lang]) return val[lang];
    return val.be || val.ru || '';
  };
  const SafariUI = ({ content }: { content: any }) => {
    if (!content) return null;
    return (
      <div className="ui-safari rounded-2xl overflow-hidden bg-[#1c1c1e]">
        <div className="safari-chrome p-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/60">←</div>
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/60">→</div>
            <div className="flex-1 bg-white/10 rounded-lg py-1.5 px-3 flex items-center gap-2 min-w-0">
              <span className="text-[10px] text-green-500">🔒</span>
              <span className="text-xs text-white/60 truncate">{content.url}</span>
            </div>
          </div>
        </div>
        {content.warning && (
          <div className="bg-red-500/15 border border-red-500/30 m-2 p-2 rounded-lg text-xs text-red-400">
            ⚠️ {t(content.warning)}
          </div>
        )}
        <div className="p-4">
          <div className="text-base font-bold mb-2">{t(content.page_title)}</div>
          <p className="text-sm text-white/60 leading-relaxed mb-4">{t(content.description)}</p>
          {content.input_label && (
            <div className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-sm text-white/30 mb-3">
              {t(content.input_label)}
            </div>
          )}
          {content.page_cta && (
            <div className="w-full bg-blue-500/80 p-3 rounded-xl text-center font-semibold text-sm">
              {t(content.page_cta)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TelegramUI = ({ content }: { content: any }) => {
    if (!content) return null;
    return (
      <div className="ui-telegram bg-[#0d1117] rounded-2xl overflow-hidden">
        <div className="bg-[#14141e]/95 p-3 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm">
            {(t(content.bot_name || content.sender) || '??').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold flex items-center gap-1">
              {t(content.bot_name || content.sender)}
              {content.bot_verified && <span className="text-blue-500 text-xs">✓</span>}
            </div>
            <div className="text-[10px] text-green-500">{t('у сетцы', 'в сети')}</div>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {content.messages?.map((msg: any, i: number) => (
            <div key={i} className="tg-bubble tg-bubble-in p-3 rounded-2xl text-sm max-w-[85%] self-start">
              {t(msg)}
              <div className="text-[10px] text-white/30 text-right mt-1">21:09</div>
            </div>
          ))}
        </div>
        {content.buttons && (
          <div className="flex flex-wrap gap-2 p-4 pt-0">
            {content.buttons.map((b: any, i: number) => (
              <div key={i} className="flex-1 min-w-[100px] p-2 rounded-lg bg-blue-500/15 text-blue-500 border border-blue-500/20 text-center text-xs font-medium">
                {t(b)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const PhoneUI = ({ content }: { content: any }) => {
    if (!content) return null;
    return (
      <div className="ui-phone bg-gradient-to-b from-[#1a1a2e] to-[#0d0d1a] p-7 rounded-2xl flex flex-col items-center gap-3">
        <div className="text-5xl mb-1">📞</div>
        <div className="text-xl font-bold">{t(content.caller)}</div>
        <div className="text-sm text-white/30">{content.number}</div>
        <div className="text-xs text-white/60">{content.duration === 'incoming' ? t('📲 Уваходны выклік...', '📲 Входящий вызов...') : t('📞 Ідзе выклік...', '📞 Идет вызов...')}</div>
        {content.script && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 my-2 w-full text-xs text-white/60 italic leading-relaxed">
            "{t(content.script)}"
          </div>
        )}
        <div className="flex gap-10 mt-2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-2xl shadow-lg shadow-green-500/30">📞</div>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-2xl shadow-lg shadow-red-500/30">📵</div>
        </div>
      </div>
    );
  };

  const WhatsappUI = ({ content }: { content: any }) => {
    if (!content) return null;
    const messages = content.messages || (content.message ? [content.message] : []);
    
    return (
      <div className="ui-whatsapp rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col w-full bg-[#efe7de] transition-all duration-500">
        {/* Sub-Header / Chat Header */}
        <div className="bg-[#008069] p-3 pl-4 flex items-center gap-3 shrink-0 shadow-md z-10">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg overflow-hidden border border-white/10 shadow-inner">
            {content.avatar ? <img src={content.avatar} alt="" className="w-full h-full object-cover" /> : '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate leading-tight">{t(content.sender || content.from || 'WhatsApp')}</div>
            <div className="text-[11px] text-white/80 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#46d362] animate-pulse"></span>
              {t('у сетцы', 'в сети')}
            </div>
          </div>
          <div className="flex items-center gap-4 text-white pr-2">
            <Video className="w-5 h-5 opacity-90 hover:opacity-100 cursor-pointer transition-opacity" />
            <Phone className="w-4 h-4 opacity-90 hover:opacity-100 cursor-pointer transition-opacity" />
            <MoreVertical className="w-5 h-5 opacity-90 hover:opacity-100 cursor-pointer transition-opacity" />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 wa-chat-bg p-4 flex flex-col gap-2 min-h-[300px] max-h-[450px] overflow-y-auto scrollbar-hide">
          {messages.length > 0 ? messages.map((msg: any, i: number) => {
            const isOut = msg.from === 'me';
            const text = t(msg.text || msg);
            return (
              <div 
                key={i} 
                className={`flex ${isOut ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className={`wa-bubble ${isOut ? 'wa-bubble-out' : 'wa-bubble-in'} relative max-w-[85%] px-3 py-1.5 shadow-sm`}>
                  <div className="text-[14.5px] leading-[1.4] text-[#111b21] break-words">
                    {text}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-0.5 h-3">
                    <span className="text-[10px] text-[#667781]">14:20</span>
                    {isOut && <CheckCircle2 className="w-3 h-3 text-[#53bdeb]" />}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="text-center text-gray-500 text-xs italic mt-10">
              {t('Няма паведамленняў', 'Нет сообщений')}
            </div>
          )}
        </div>

        {/* Fake Input Area */}
        <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 shrink-0 border-t border-[#e9edef]">
          <div className="flex gap-3 px-2 text-[#54656f]">
             <Smile className="w-6 h-6" />
             <Paperclip className="w-6 h-6" />
          </div>
          <div className="flex-1 bg-white rounded-xl px-4 py-2.5 flex items-center justify-between text-[#8696a0] shadow-sm border border-transparent focus-within:border-[#008069] transition-colors">
            <span className="text-[15px]">{t('Паведамленне', 'Сообщение')}</span>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
            <Mic className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  const DiscordUI = ({ content }: { content: any }) => {
    if (!content) return null;
    return (
      <div className="ui-discord bg-[#36393f] rounded-2xl overflow-hidden p-4">
        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
          <div className="w-6 h-6 bg-[#5865f2] rounded-lg flex items-center justify-center text-[10px]">#</div>
          <span className="text-sm font-bold text-white/80">{t(content.channel || 'general')}</span>
        </div>
        <div className="space-y-4">
          {content.messages?.map((msg: any, i: number) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-xs font-bold">
                {t(msg.from)?.slice(0, 1)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-white">{t(msg.from)}</span>
                  {msg.role && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 uppercase">{t(msg.role)}</span>}
                  <span className="text-[10px] text-white/20">{t('Сёння а 14:22', 'Сегодня в 14:22')}</span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{t(msg.text)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const InstagramUI = ({ content }: { content: any }) => {
    if (!content) return null;
    return (
      <div className="ui-instagram bg-black rounded-2xl overflow-hidden border border-white/10">
        <div className="p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px]">👤</div>
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold flex items-center gap-1">
              {t(content.post_author)}
              {content.verified && <span className="text-blue-500 text-[10px]">✓</span>}
            </div>
            <div className="text-[10px] text-white/60">{t(content.location)}</div>
          </div>
        </div>
        <div className="aspect-square bg-white/5 flex items-center justify-center text-4xl">🖼️</div>
        <div className="p-3">
          <div className="flex gap-3 mb-2">
            <span>❤️</span> <span>💬</span> <span>✈️</span>
          </div>
          <p className="text-xs leading-relaxed">
            <span className="font-bold mr-2">{t(content.post_author)}</span>
            <span className="text-white/80">{t(content.caption)}</span>
          </p>
          <div className="text-[10px] text-blue-400 mt-2">{content.link}</div>
        </div>
      </div>
    );
  };

  const AdminPanel = () => {
    const [adminTab, setAdminTab] = useState<'news' | 'users' | 'logs'>('news');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [isAddingNews, setIsAddingNews] = useState(false);
    const [newNews, setNewNews] = useState({
      title_be: '', title_ru: '',
      content_be: '', content_ru: '',
      imageUrl: '', telegraphUrl: ''
    });

    useEffect(() => {
      if (adminTab === 'users') {
        const q = query(collection(db, 'users'), orderBy('totalPoints', 'desc'), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
      }
    }, [adminTab]);

    const handleAddNews = async () => {
      if (!newNews.title_ru || !newNews.content_ru) return;
      try {
        const newsRef = doc(collection(db, 'news'));
        await setDoc(newsRef, {
          ...newNews,
          createdAt: serverTimestamp()
        });
        
        // Log action
        await setDoc(doc(collection(db, 'logs')), {
          userId: auth.currentUser?.uid,
          action: 'create_news_web',
          details: { title: newNews.title_ru },
          timestamp: serverTimestamp()
        });

        setIsAddingNews(false);
        setNewNews({ title_be: '', title_ru: '', content_be: '', content_ru: '', imageUrl: '', telegraphUrl: '' });
        playSfx('correct');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'news');
      }
    };

    return (
      <div className="screen flex flex-col">
        <div className="nav-bar glass-nav">
          <button onClick={() => setScreen('hub')} className="w-10 flex items-center justify-center">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold">ADMIN PANEL</span>
          <div className="w-10"></div>
        </div>

        <div className="flex p-1 glass mx-4 mt-4 rounded-2xl overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setAdminTab('news')}
            className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${adminTab === 'news' ? 'bg-blue-500 text-white' : 'text-white/40'}`}
          >
            {t('Навіны', 'Новости')}
          </button>
          <button 
            onClick={() => setAdminTab('users')}
            className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${adminTab === 'users' ? 'bg-blue-500 text-white' : 'text-white/40'}`}
          >
            {t('Карыстальнікі', 'Пользователи')}
          </button>
          <button 
            onClick={() => setAdminTab('logs')}
            className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${adminTab === 'logs' ? 'bg-blue-500 text-white' : 'text-white/40'}`}
          >
            {t('Логі', 'Логи')}
          </button>
        </div>

        <div className="screen-scroll pb-24">
          {adminTab === 'news' && (
            <div className="space-y-4">
              <button 
                onClick={() => setIsAddingNews(!isAddingNews)}
                className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                {isAddingNews ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                <span>{isAddingNews ? t('Адмяніць', 'Отменить') : t('Дадаць навіну', 'Добавить новость')}</span>
              </button>

              {isAddingNews && (
                <div className="glass p-6 rounded-[32px] space-y-4">
                  <input 
                    type="text" placeholder="Title (RU)" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
                    value={newNews.title_ru} onChange={e => setNewNews({...newNews, title_ru: e.target.value})}
                  />
                  <input 
                    type="text" placeholder="Title (BE)" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
                    value={newNews.title_be} onChange={e => setNewNews({...newNews, title_be: e.target.value})}
                  />
                  <textarea 
                    placeholder="Content (RU)" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm h-32"
                    value={newNews.content_ru} onChange={e => setNewNews({...newNews, content_ru: e.target.value})}
                  />
                  <textarea 
                    placeholder="Content (BE)" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm h-32"
                    value={newNews.content_be} onChange={e => setNewNews({...newNews, content_be: e.target.value})}
                  />
                  <input 
                    type="text" placeholder="Image URL" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
                    value={newNews.imageUrl} onChange={e => setNewNews({...newNews, imageUrl: e.target.value})}
                  />
                  <input 
                    type="text" placeholder="Telegraph URL" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
                    value={newNews.telegraphUrl} onChange={e => setNewNews({...newNews, telegraphUrl: e.target.value})}
                  />
                  <button onClick={handleAddNews} className="btn-primary w-full py-4 rounded-2xl font-bold">
                    {t('Апублікаваць', 'Опубликовать')}
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {news.map(item => (
                  <div key={item.id} className="glass p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex-1 mr-4">
                      <div className="text-sm font-bold truncate">{t(item.title_be, item.title_ru)}</div>
                      <div className="text-[10px] text-white/40">{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : '...'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === 'users' && (
            <div className="space-y-2">
              {allUsers.map((u, i) => (
                <div key={u.id} className="glass p-4 rounded-2xl flex items-center gap-3">
                  <span className="text-xs font-bold text-white/20 w-6">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden">
                    {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <User className="w-4 h-4 m-2 text-white/20" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold">{u.nickname}</div>
                    <div className="text-[9px] text-white/40">{u.totalPoints} XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {adminTab === 'logs' && (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="glass p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-blue-400 uppercase">{log.action}</span>
                    <span className="text-[9px] text-white/20">{log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : '...'}</span>
                  </div>
                  <div className="text-[10px] text-white/60 font-mono break-all">
                    {JSON.stringify(log.details)}
                  </div>
                  <div className="text-[9px] text-white/30 mt-1">User ID: {log.userId}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const BankingUI = ({ content }: { content: any }) => {
    if (!content) return null;
    return (
      <div className="ui-banking bg-[#f4f4f7] rounded-2xl overflow-hidden text-black shadow-xl">
        <div className="bg-white p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">B</div>
            <span className="font-black text-sm tracking-tight">{t(content.bank_name || 'MyBank')}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">👤</div>
        </div>
        <div className="p-5">
          <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-50">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t('Даступны баланс', 'Доступный баланс')}</div>
            <div className="text-2xl font-black">{content.balance || '****.** BYN'}</div>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t(content.section_title || 'Апавяшчэнні', 'Уведомления')}</div>
            <div className="bg-white p-4 rounded-2xl border border-blue-100 flex gap-3 items-start">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex-shrink-0 flex items-center justify-center text-blue-600">
                <Shield size={20} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold mb-1">{t(content.alert_title)}</div>
                <p className="text-xs text-gray-500 leading-relaxed">{t(content.alert_text)}</p>
              </div>
            </div>
          </div>
          {content.action_label && (
            <div className="mt-6 w-full bg-blue-600 p-4 rounded-2xl text-center text-white font-bold text-sm shadow-lg shadow-blue-600/20">
              {t(content.action_label)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const GovUI = ({ content }: { content: any }) => {
    if (!content) return null;
    return (
      <div className="ui-gov bg-white rounded-2xl overflow-hidden text-black border border-gray-200 shadow-lg">
        <div className="bg-[#004a99] p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">🏛️</div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] leading-none mb-1">{t('Дзяржаўныя паслугі', 'Государственные услуги')}</div>
            <div className="text-sm font-black text-white tracking-tight">{t(content.portal_name || 'Адзіны партал')}</div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-2xl">👤</div>
            <div>
              <div className="text-xs font-bold text-gray-500">{t('Асабісты кабінет', 'Личный кабинет')}</div>
              <div className="text-sm font-black">{nickname || t('Карыстальнік', 'Пользователь')}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex gap-3">
              <div className="text-orange-500 flex-shrink-0 mt-0.5">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-orange-900 mb-1">{t(content.notice_title)}</div>
                <p className="text-xs text-orange-800/70 leading-relaxed">{t(content.notice_text)}</p>
              </div>
            </div>
            {content.fields?.map((f: any, i: number) => (
              <div key={i} className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">{t(f.label)}</label>
                <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-500">
                  {t(f.placeholder)}
                </div>
              </div>
            ))}
            {content.cta_label && (
              <button className="w-full py-4 bg-[#004a99] text-white rounded-2xl font-bold text-sm mt-2 shadow-lg shadow-blue-900/20">
                {t(content.cta_label)}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ConfirmModal = () => {
    if (!showConfirmModal) return null;
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="glass w-full max-w-sm p-8 rounded-[40px] text-center"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black mb-6">{showConfirmModal.title}</h2>
          
            <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                setShowConfirmModal(null);
                playSfx('click');
              }}
              className="w-full py-4 rounded-[24px] glass border-white/10 font-bold text-sm"
            >
              {t('Адмена', 'Отмена')}
            </button>
            <button 
              onClick={() => {
                showConfirmModal.onConfirm();
                playSfx('click');
              }}
              className="w-full py-4 rounded-[24px] bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/20"
            >
              {t('Так', 'Да')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const AlertModal = () => {
    if (!showAlertModal) return null;
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass p-8 rounded-[40px] w-full max-w-sm text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 mx-auto">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-black mb-2">{t(showAlertModal.title)}</h3>
          <p className="text-white/85 mb-8 leading-relaxed">{t(showAlertModal.message)}</p>
          <button 
            onClick={() => {
              setShowAlertModal(null);
              playSfx('click');
            }}
            className="w-full py-4 rounded-[24px] bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20"
          >
            {t('Зразумела', 'Понятно')}
          </button>
        </motion.div>
      </motion.div>
    );
  };

  const LeaderboardScreen = () => {
    return (
      <motion.div 
        key="leaderboard"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="screen"
      >
        <div className="nav-bar glass-nav">
          <div className="w-10"></div>
          <span className="text-lg font-bold tracking-tight">{t('Лідары', 'Лидеры')}</span>
          <div className="w-10"></div>
        </div>

        <div className="screen-scroll pb-24">
          <div className="suspended-panel mt-4">
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{t('Загрузка...', 'Загрузка...')}</span>
                </div>
              ) : (
                leaderboard.map((l, i) => (
                  <motion.div 
                    key={l.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`glass p-4 rounded-[24px] flex items-center justify-between border ${l.id === auth.currentUser?.uid ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-orange-500 text-black' : 'glass text-white/40'}`}>
                        {i + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full glass overflow-hidden flex items-center justify-center">
                        {l.photoURL ? (
                          <img src={l.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-5 h-5 text-white/20" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-2">
                          {l.nickname}
                          {l.id === auth.currentUser?.uid && <span className="text-[8px] bg-blue-500 px-1.5 py-0.5 rounded text-white uppercase">{t('Вы', 'Вы')}</span>}
                        </div>
                        <div className="text-[10px] text-white/50 uppercase font-bold tracking-widest">
                          {(() => {
                            const rank = RANKS.filter(r => (l.totalPoints / 10) >= r.min).pop();
                            return t(rank?.name_be || '', rank?.name_ru || '');
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-blue-400">{l.totalPoints} XP</div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const NewsScreen = () => {
    return (
      <motion.div 
        key="news"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={SPRING}
        className="screen"
      >
        <div className="nav-bar glass-nav">
          <div className="w-10"></div>
          <span className="text-lg font-bold tracking-tight">{t('Навіны', 'Новости')}</span>
          <div className="w-10"></div>
        </div>

        <div className="screen-scroll pb-24">
          <div className="suspended-panel mt-4">
            <div className="space-y-4">
              {news.length === 0 ? (
                <div className="glass p-8 rounded-[32px] text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
                    <Info className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-sm font-bold text-white/40">{t('Навін пакуль няма', 'Новостей пока нет')}</p>
                </div>
              ) : (
                news.map(item => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass overflow-hidden rounded-[32px] border border-white/5"
                  >
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt="" 
                        className="w-full h-40 object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-black leading-tight flex-1 mr-2">{t(item.title_be, item.title_ru)}</h3>
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap mt-1">
                          {new Date(item.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed mb-4 line-clamp-3">
                        {t(item.content_be, item.content_ru)}
                      </p>
                      {item.telegraphUrl && (
                        <button 
                          onClick={() => tg?.openTelegramLink(item.telegraphUrl)}
                          className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                          <span>{t('Чытаць цалкам', 'Читать полностью')}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              <div className="p-4 text-center">
                <p className="text-[10px] font-medium text-white/20">
                  {t('Навіны публікуюцца праз афіцыйны канал', 'Новости публикуются через официальный канал')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const OnboardingScreen = () => {
    const [step, setStep] = useState(0);
    const steps = [
      {
        title: { be: "Сардэчна запрашаем!", ru: "Добро пожаловать!" },
        desc: { be: "SCAMLAB — гэта ваш асабісты трэнажор па кібербяспецы. Тут вы навучыцеся распазнаваць махляроў у рэальных сітуацыях.", ru: "SCAMLAB — это ваш личный тренажер по кибербезопасности. Здесь вы научитесь распознавать мошенников в реальных ситуациях." },
        icon: <Shield className="w-16 h-16 text-blue-500" />
      },
      {
        title: { be: "Рэальныя кейсы", ru: "Реальные кейсы" },
        desc: { be: "Мы выкарыстоўваем інтэрфейсы папулярных месенджараў і сацыяльных сетак, каб навучанне было максімальна набліжаным да жыцця.", ru: "Мы используем интерфейсы популярных мессенджеров и социальных сетей, чтобы обучение было максимально приближенным к жизни." },
        icon: <Smartphone className="w-16 h-16 text-purple-500" />
      }
    ];

    const nextStep = () => {
      if (step < steps.length - 1) {
        setStep(step + 1);
        playSfx('click');
        haptic('light');
      } else {
        setScreen('intro');
        setShowOnboarding(false);
        playSfx('transition');
        haptic('medium');
      }
    };

    return (
      <motion.div 
        key="onboarding"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="screen p-8 flex flex-col items-center justify-between"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
          <div className="suspended-panel w-full max-w-sm">
            <motion.div 
              key={step}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-8 flex justify-center"
            >
              {steps[step].icon}
            </motion.div>
            <motion.h2 
              key={`title-${step}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-black mb-4"
            >
              {t(steps[step].title)}
            </motion.h2>
            <motion.p 
              key={`desc-${step}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white/85 leading-relaxed"
            >
              {t(steps[step].desc)}
            </motion.p>
          </div>
        </div>

        <div className="w-full space-y-6">
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-white/10'}`}></div>
            ))}
          </div>
          <button 
            onClick={nextStep}
            className="btn-primary w-full py-5 rounded-[24px] text-lg font-bold"
          >
            {step === steps.length - 1 ? t('Пачаць', 'Начать') : t('Далей', 'Далее')}
          </button>
        </div>
      </motion.div>
    );
  };

  const renderTabBar = () => {
    if (isLoading || screen === 'loading' || screen === 'welcome' || screen === 'game' || screen === 'final' || screen === 'onboarding') return null;
    return (
      <div className="tab-bar">
        <button 
          onClick={() => {
            setScreen('intro');
            setActiveTab('home');
            playSfx('click');
            haptic('light');
          }}
          className={`tab-item ${activeTab === 'home' ? 'active' : ''}`}
        >
          <Layout className="w-5 h-5" />
          <span className="text-[9px] font-medium">{t('Галоўная', 'Главная')}</span>
        </button>
        <button 
          onClick={() => {
            setScreen('news');
            setActiveTab('news');
            playSfx('click');
            haptic('light');
          }}
          className={`tab-item ${activeTab === 'news' ? 'active' : ''}`}
        >
          <Smartphone className="w-5 h-5" />
          <span className="text-[9px] font-medium">{t('Навіны', 'Новости')}</span>
        </button>
        <button 
          onClick={() => {
            setScreen('leaderboard');
            setActiveTab('leaderboard');
            playSfx('click');
            haptic('light');
          }}
          className={`tab-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[9px] font-medium">{t('Лідары', 'Лидеры')}</span>
        </button>
        <button 
          onClick={() => {
            setScreen('hub');
            setActiveTab('profile');
            playSfx('click');
            haptic('light');
          }}
          className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-medium">{t('Профіль', 'Профиль')}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="app h-full w-full relative bg-black">
      <div className="ambient">
        <div className="orb orb-a"></div>
        <div className="orb orb-b"></div>
      </div>

      {showLangModal && <LanguageModal />}
      {showConfirmModal && <ConfirmModal />}
      {showAlertModal && <AlertModal />}

      <AnimatePresence mode="wait">
        {screen === 'loading' && <LoadingScreen key="loading" />}
        {screen === 'onboarding' && <OnboardingScreen />}

        {screen === 'leaderboard' && <LeaderboardScreen />}
        {screen === 'news' && <NewsScreen />}

        {screen === 'admin' && <AdminPanel />}

        {screen === 'welcome' && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={SPRING}
            className="screen p-4 flex flex-col items-center justify-center"
          >
            <div className="suspended-panel w-full max-w-sm flex flex-col items-center">
              <div className="text-center mb-8">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, ...SPRING }}
                  className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center"
                >
                  <div className="absolute inset-[-15px] rounded-full bg-blue-500/20 blur-xl animate-pulse"></div>
                  <div className="w-full h-full glass-bright rounded-[32px] flex items-center justify-center shadow-2xl">
                    <Shield className="w-14 h-14 text-white" />
                  </div>
                </motion.div>
                <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">SCAMLAB</h1>
                <p className="text-white/60 font-medium tracking-tight mb-6">{t('Трэнажор лічбавай бяспекі', 'Тренажер цифровой безопасности')}</p>
                
                <div className="glass p-6 rounded-[32px] border border-white/5 text-left">
                  <p className="text-xs text-white/85 leading-relaxed">
                    {t(
                      'Сардэчна запрашаем у SCAMLAB! Гэта інтэрактыўная платформа, дзе вы навучыцеся абараняць сябе ад сучасных кіберпагроз. Мы сабралі рэальныя кейсы махлярства, каб вы маглі патрэніравацца ў бяспечным асяроддзі.',
                      'Добро пожаловать в SCAMLAB! Это интерактивная платформа, где вы научитесь защищать себя от современных киберугроз. Мы собрали реальные кейсы мошенничества, чтобы вы могли потренироваться в безопасной среде.'
                    )}
                  </p>
                </div>
              </div>

              <div className="w-full space-y-3 mb-8">
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass p-4 rounded-[24px] flex flex-col gap-2">
                    <Layout className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-bold leading-tight">{t('Рэальныя кейсы', 'Реальные кейсы')}</span>
                  </div>
                  <div className="glass p-4 rounded-[24px] flex flex-col gap-2">
                    <Smartphone className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-bold leading-tight">{t('iOS інтэрфейс', 'iOS интерфейс')}</span>
                  </div>
                </div>
              </div>

              <div className="w-full">
                <button 
                  onClick={() => {
                    setScreen('intro');
                    playSfx('transition');
                    if (musicEnabled) bgMusic.current?.play();
                    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                  }}
                  className="btn-primary w-full py-6 rounded-[28px] text-xl font-black flex items-center justify-center gap-3"
                >
                  <span>{t('Пачаць', 'Начать')}</span>
                  <ChevronRight className="w-7 h-7" />
                </button>
                <p className="text-[11px] text-white/20 mt-4 text-center font-medium">{t('Беларуская рэдакцыя', 'Русская редакция')} · 2026</p>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={SPRING}
            className="screen"
          >
            <div className="nav-bar glass-nav">
              <div className="w-10"></div>
              <span className="text-lg font-bold tracking-tight">SCAMLAB</span>
              <div className="w-10"></div>
            </div>

            <div className="screen-scroll pb-24">
              <div className="suspended-panel mt-4">
                <div className="flex justify-between items-center mb-6 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-white/5 overflow-hidden">
                      {photoURL ? (
                        <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white/80">{nickname}</span>
                      <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                        {(() => {
                          const rank = RANKS.filter(r => level >= r.min).pop();
                          return t(rank?.name_be || '', rank?.name_ru || '');
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                    <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-black text-yellow-400">{streak}</span>
                  </div>
                </div>

                <StatsOverview />

                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">{t('Штодзённы выклік', 'Ежедневный вызов')}</label>
                    {dailyCompleted && <span className="text-[10px] font-bold text-green-500 uppercase">{t('Выканана', 'Выполнено')}</span>}
                  </div>
                  <button 
                    onClick={() => {
                      startDailyChallenge();
                      playSfx('click');
                      haptic('medium');
                    }}
                    disabled={dailyCompleted}
                    className={`w-full p-6 rounded-[32px] flex items-center justify-between transition-all ${dailyCompleted ? 'bg-green-500/10 border border-green-500/20 opacity-50' : 'btn-primary shadow-xl shadow-blue-500/20'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                        📅
                      </div>
                      <div className="text-left">
                        <div className="font-black text-lg leading-none mb-1">{t('Тэст дня', 'Тест дня')}</div>
                        <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{t('Абнаўляецца кожныя 24г', 'Обновляется каждые 24ч')}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-8">
                  <div className="flex justify-between items-baseline mb-3 px-1">
                    <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">{t('Выберыце тэму', 'Выберите тему')}</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {SPHERES.map(s => (
                      <motion.div 
                        key={s.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedSphere(selectedSphere === s.id ? null : s.id);
                          playSfx('click');
                          haptic('light');
                        }}
                        className={`sphere-card h-24 ${selectedSphere === s.id ? 'selected' : ''}`}
                      >
                        <span className="text-3xl mb-2">{s.icon}</span>
                        <span className="text-xs font-bold text-center leading-tight">{t(s.name_be, s.name_ru)}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mb-10">
                  <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-3 block ml-1">{t('Складанасць', 'Сложность')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['easy', 'medium', 'hard', 'all'].map(d => (
                      <button 
                        key={d}
                        onClick={() => {
                          setSelectedDiff(d);
                          playSfx('click');
                          haptic('light');
                        }}
                        className={`py-4 rounded-[20px] border-1.5 transition-all text-sm font-bold ${selectedDiff === d ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'glass border-white/5 text-white/60'}`}
                      >
                        {d === 'easy' ? t('😌 Проста', '😌 Просто') : d === 'medium' ? t('😤 Сярэдне', '😤 Средне') : d === 'hard' ? t('😰 Складана', '😰 Сложно') : t('🎲 Усё', '🎲 Всё')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      startGame();
                      playSfx('click');
                      haptic('medium');
                    }}
                    className="btn-primary w-full py-5 rounded-[28px] text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <span>{t('Пачаць гульню', 'Начать игру')}</span>
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'game' && gameQuestions.length > 0 && (
          <motion.div 
            key="game"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={SPRING}
            className="screen flex flex-col"
          >
            <div className="nav-bar glass-nav">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                  {currentQIdx + 1}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('Пытанне', 'Вопрос')}</span>
                  <span className="text-xs font-bold leading-none">{currentQIdx + 1} {t('з', 'из')} {gameQuestions.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('Рахунак', 'Счет')}</span>
                  <span className="text-xs font-bold leading-none text-blue-400">{score}</span>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-colors ${timer < 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-white/10 text-white'}`}>
                  {timer}
                </div>
              </div>
            </div>

            <div className="screen-scroll pb-24">
              <div className="suspended-panel mt-4">
                <div className="mb-6">
                  {gameQuestions[currentQIdx].ui_type === 'safari' && <SafariUI content={gameQuestions[currentQIdx].content} />}
                  {gameQuestions[currentQIdx].ui_type === 'telegram' && <TelegramUI content={gameQuestions[currentQIdx].content} />}
                  {gameQuestions[currentQIdx].ui_type === 'phone' && <PhoneUI content={gameQuestions[currentQIdx].content} />}
                  {gameQuestions[currentQIdx].ui_type === 'whatsapp' && <WhatsappUI content={gameQuestions[currentQIdx].content} />}
                  {gameQuestions[currentQIdx].ui_type === 'discord' && <DiscordUI content={gameQuestions[currentQIdx].content} />}
                  {gameQuestions[currentQIdx].ui_type === 'instagram' && <InstagramUI content={gameQuestions[currentQIdx].content} />}
                  {gameQuestions[currentQIdx].ui_type === 'banking' && <BankingUI content={gameQuestions[currentQIdx].content} />}
                  {gameQuestions[currentQIdx].ui_type === 'gov' && <GovUI content={gameQuestions[currentQIdx].content} />}
                  {(!gameQuestions[currentQIdx].ui_type || !['safari', 'telegram', 'phone', 'whatsapp', 'discord', 'instagram', 'banking', 'gov'].includes(gameQuestions[currentQIdx].ui_type)) && (
                    <div className="glass p-6 rounded-[24px]">
                      <p className="text-sm text-white/80 leading-relaxed font-medium">
                        {gameQuestions[currentQIdx].content?.message || gameQuestions[currentQIdx].content?.description || "Уважліва вывучыце сітуацыю і абярыце правільны адказ."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="glass-bright p-6 rounded-[32px] mb-6">
                  <h2 className="text-xl font-bold leading-tight mb-2">{t(gameQuestions[currentQIdx].title)}</h2>
                  <p className="text-white/40 text-sm font-medium">{t('Што будзеце рабіць?', 'Что будете делать?')}</p>
                </div>

                <div className="space-y-3">
                  {gameQuestions[currentQIdx].options.map((opt, i) => {
                    const maxPts = Math.max(...gameQuestions[currentQIdx].options.map(o => o.points)) || 1;
                    const isCorrect = opt.points >= maxPts * 0.8;
                    const isSelected = selectedOptionIdx === i;
                    
                    return (
                      <motion.button 
                        key={i}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectOption(i)}
                        disabled={answered}
                        className={`option-btn w-full p-5 rounded-[24px] text-left relative overflow-hidden transition-all ${
                          answered 
                            ? (isCorrect ? 'bg-green-500/20 border-green-500/50' : (isSelected ? 'bg-red-500/20 border-red-500/50' : 'opacity-40'))
                            : 'glass hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                            answered 
                              ? (isCorrect ? 'bg-green-500 text-white' : (isSelected ? 'bg-red-500 text-white' : 'glass text-white/40'))
                              : 'glass text-white/40'
                          }`}>
                            {answered ? (
                              isCorrect ? <Check className="w-4 h-4" /> : (isSelected ? <X className="w-4 h-4" /> : String.fromCharCode(65 + i))
                            ) : String.fromCharCode(65 + i)}
                          </div>
                          <div className="flex-1">
                            <span className={`block font-semibold text-sm leading-snug ${answered && isCorrect ? 'text-green-400' : (answered && isSelected ? 'text-red-400' : '')}`}>
                              {t(opt.text)}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showFeedback && (
                <motion.div 
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  transition={SPRING}
                  className="fixed bottom-0 left-0 right-0 p-6 z-50 backdrop-blur-md bg-black/40"
                >
                  {(() => {
                    const q = gameQuestions[currentQIdx];
                    const selectedOpt = selectedOptionIdx !== null ? q.options[selectedOptionIdx] : null;
                    const maxPts = Math.max(...q.options.map(o => o.points)) || 1;
                    const isCorrect = selectedOpt ? selectedOpt.points >= maxPts * 0.8 : false;

                    return (
                      <div className={`bg-[#121212] p-6 rounded-[32px] shadow-2xl border-t-2 ${isCorrect ? 'border-green-500/50' : 'border-red-500/50'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                            {isCorrect ? <Check className="w-6 h-6 text-white" /> : <X className="w-6 h-6 text-white" />}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-sm font-black uppercase tracking-widest ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                              {isCorrect ? t('Верна!', 'Верно!') : t('Памылка!', 'Ошибка!')}
                            </span>
                            {combo > 1 && isCorrect && <span className="text-[10px] font-bold text-orange-400 uppercase">{t('Комба', 'Комбо')} x{combo}!</span>}
                          </div>
                        </div>
                        
                        {selectedOptionIdx !== null && q.options[selectedOptionIdx].feedback && (
                          <p className="text-sm text-white/80 leading-relaxed mb-6 font-medium">
                            {t(q.options[selectedOptionIdx].feedback)}
                          </p>
                        )}
                        
                        {selectedOptionIdx === null && (
                          <p className="text-sm text-white/80 leading-relaxed mb-6 font-medium">
                            {t('Час выйшаў! Вы не паспелі абраць адказ.', 'Время вышло! Вы не успели выбрать ответ.')}
                          </p>
                        )}

                        <button 
                          onClick={() => {
                            nextQuestion();
                            playSfx('click');
                            haptic('light');
                          }}
                          className="btn-primary w-full py-4 rounded-[20px] font-bold flex items-center justify-center gap-2"
                        >
                          <span>{t('Далей', 'Далее')}</span>
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {screen === 'final' && (
          <motion.div 
            key="final"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={SPRING}
            className="screen p-4 flex flex-col items-center justify-center"
          >
            <div className="suspended-panel w-full max-w-sm flex flex-col items-center">
              <div className="text-center mb-8">
                <div className="text-8xl mb-6 drop-shadow-2xl">
                  {score >= 80 ? '🏆' : score >= 50 ? '🥈' : '🥉'}
                </div>
                <h2 className="text-3xl font-black mb-2">
                  {(() => {
                    const rank = RANKS.filter(r => score >= r.min).pop();
                    return t(rank?.name_be || '', rank?.name_ru || '');
                  })()}
                </h2>
                <p className="text-white/40 font-medium">
                  {score >= 80 ? t('Выдатны вынік! Вы ў бяспецы.', 'Отличный результат! Вы в безопасности.') : score >= 50 ? t('Добрая праца, але ёсць рызыкі.', 'Хорошая работа, но есть риски.') : t('Трэба больш трэніравацца!', 'Нужно больше тренироваться!')}
                </p>
              </div>

              <div className="w-full space-y-4 mb-8">
                <div className="glass-bright p-8 rounded-[40px] text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
                  <div className="text-6xl font-black mb-1 text-blue-500">{score}</div>
                  <div className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">{t('выніковы рахунак', 'итоговый счет')}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="glass p-5 rounded-[28px] text-center">
                    <div className="text-2xl font-black text-green-500">{correctCount}</div>
                    <div className="text-[9px] font-bold text-white/30 uppercase">{t('верна', 'верно')}</div>
                  </div>
                  <div className="glass p-5 rounded-[28px] text-center">
                    <div className="text-2xl font-black text-red-500">{wrongCount}</div>
                    <div className="text-[9px] font-bold text-white/30 uppercase">{t('памылак', 'ошибок')}</div>
                  </div>
                </div>
              </div>

              <div className="w-full space-y-3">
                <button 
                  onClick={() => {
                    setScreen('intro');
                    playSfx('click');
                    haptic('medium');
                  }} 
                  className="btn-primary w-full py-5 rounded-[28px] text-lg font-bold"
                >
                  {t('Паспрабаваць зноў', 'Попробовать снова')}
                </button>
                <button 
                  onClick={() => {
                    setScreen('hub');
                    setActiveTab('profile');
                    playSfx('click');
                    haptic('light');
                  }} 
                  className="w-full py-4 glass rounded-[24px] text-sm font-bold text-white/60"
                >
                  {t('Перайсці ў профіль', 'Перейти в профиль')}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'hub' && (
          <motion.div 
            key="hub"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={SPRING}
            className="screen"
          >
            <div className="nav-bar glass-nav">
              <div className="w-10"></div>
              <span className="text-lg font-bold tracking-tight">{t('Профіль', 'Профиль')}</span>
              <div className="w-10"></div>
            </div>

            <div className="screen-scroll pb-24">
              <div className="suspended-panel mt-4">
                <div className="glass-bright p-8 rounded-[40px] text-center mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  <div className="w-24 h-24 rounded-full glass mx-auto mb-4 flex items-center justify-center relative overflow-hidden">
                    {photoURL ? (
                      <img src={photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-12 h-12 text-blue-500" />
                    )}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-500 border-4 border-black flex items-center justify-center text-[10px] font-black">{level}</div>
                  </div>
                  <h2 className="text-2xl font-black mb-1">{nickname || t('Гулец', 'Игрок')}</h2>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
                    {(() => {
                      const rank = RANKS.filter(r => level >= r.min).pop();
                      return t(rank?.name_be || '', rank?.name_ru || '');
                    })()}
                  </p>
                  
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        setScreen('admin');
                        haptic('light');
                      }}
                      className="absolute top-4 right-4 w-10 h-10 glass rounded-full flex items-center justify-center text-blue-400 active:scale-90 transition-all shadow-lg"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button 
                    onClick={() => {
                      shareApp();
                      haptic('light');
                    }}
                    className="glass p-5 rounded-[28px] flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('Запрасіць', 'Пригласить')}</span>
                  </button>
                  <button 
                    onClick={() => {
                      tg?.openTelegramLink('https://t.me/scamlab_by');
                      haptic('light');
                    }}
                    className="glass p-5 rounded-[28px] flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('Канал', 'Канал')}</span>
                  </button>
                </div>

                <div className="glass p-5 rounded-[28px] border border-white/5 mb-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-4">{t('Налады', 'Настройки')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <Languages className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold">{t('Мова', 'Язык')}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setShowLangModal(true);
                          playSfx('click');
                          haptic('light');
                        }}
                        className="text-xs font-black text-blue-400 uppercase tracking-widest"
                      >
                        {lang === 'be' ? 'Беларуская' : 'Русский'}
                      </button>
                    </div>

                  </div>
                </div>

                <StatsOverview variant="profile" />

                <div className="glass p-6 rounded-[32px] mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/30">{t('Дасягненні', 'Достижения')}</h3>
                    <Award className="w-4 h-4 text-blue-400 opacity-50" />
                  </div>
                  <div className="space-y-4">
                    {[
                      { id: 'first_win', icon: '🎯', title_be: 'Першаадкрывальнік', title_ru: 'Первооткрыватель', desc_be: 'Пройдзена першая сімуляцыя', desc_ru: 'Пройдена первая симуляция', unlocked: completedScenarios.length > 0 },
                      { id: 'streak_3', icon: '💀', title_be: 'Няўдачлівы', title_ru: 'Неудачливый', desc_be: 'Серыя з 3 няправільных адказаў запар', desc_ru: 'Серия из 3 неправильных ответов подряд', unlocked: streak >= 3 },
                      { id: 'xp_1000', icon: '💎', title_be: 'Эксперт', title_ru: 'Эксперт', desc_be: 'Набрана 1000 XP', desc_ru: 'Набрано 1000 XP', unlocked: xp >= 1000 },
                      { id: 'master', icon: '🛡️', title_be: 'Майстар бяспекі', title_ru: 'Мастер безопасности', desc_be: 'Дасягнуты 10 узровень', desc_ru: 'Достигнут 10 уровень', unlocked: level >= 10 }
                    ].map(ach => (
                      <div 
                        key={ach.id} 
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${ach.unlocked ? 'bg-white/5 border border-white/5' : 'opacity-40 grayscale blur-[0.5px]'}`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${ach.unlocked ? 'glass-bright text-blue-400' : 'glass text-white/10'}`}>
                          {ach.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-black mb-0.5">{t(ach.title_be, ach.title_ru)}</div>
                          <div className="text-[10px] font-medium text-white/40">{t(ach.desc_be, ach.desc_ru)}</div>
                        </div>
                        {ach.unlocked && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {renderTabBar()}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <filter id="liquid-glass">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="liquid" />
          <feComposite in="SourceGraphic" in2="liquid" operator="atop" />
        </filter>
      </svg>
    </div>
  );
}
