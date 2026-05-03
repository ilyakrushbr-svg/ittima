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

// --- Types ---

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

const N_QUESTIONS = 10;

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 };

export default function App() {
  const [gruzim, setGruzim] = useState(true), [progres_bar, setProgresBar] = useState(0), [pokazat_yaz, setPokazatYaz] = useState(false);
  const [okno_podtverzdeniya, setOknoPodtverzdeniya] = useState<{ show: boolean; title: string; onConfirm: () => void } | null>(null);
  const [okno_vnimanie, setOknoVnimanie] = useState<{ show: boolean; title: string; message: string } | null>(null);
  const [onbording_viden, setOnbordingViden] = useState(false), [okno_nika, setOknoNika] = useState(false), [vremennyi_nik, setVremennyiNik] = useState('');
  
  const [ekran, setEkran] = useState<'loading' | 'welcome' | 'intro' | 'game' | 'final' | 'hub' | 'onboarding'>('loading'), [tabik, setTabik] = useState<'home' | 'profile'>('home');

  const [yaz, setYaz] = useState<'be' | 'ru'>(() => localStorage.getItem('scamlab_lang') as any || 'ru');
  const [nik, setNik] = useState(() => localStorage.getItem('scamlab_nickname') || 'Ананім'), [ava, setAva] = useState(() => localStorage.getItem('scamlab_photo') || '');
  const [vkl_zvuk, setVklZvuk] = useState(() => localStorage.getItem('scamlab_sound') !== 'false'), [vkl_muzlo, setVklMuzlo] = useState(() => localStorage.getItem('scamlab_music') !== 'false');
  const [opyt, setOpyt] = useState(() => parseInt(localStorage.getItem('scamlab_xp') || '0')), [lvl, setLvl] = useState(() => parseInt(localStorage.getItem('scamlab_level') || '1'));
  const [seriya, setSeriya] = useState(() => parseInt(localStorage.getItem('scamlab_streak') || '0')), [max_kombo_vsego, setMaxKomboVsego] = useState(() => parseInt(localStorage.getItem('scamlab_max_combo') || '0'));
  const [vse_verno, setVseVerno] = useState(() => parseInt(localStorage.getItem('scamlab_total_correct') || '0')), [vsego_otvetov, setVsegoOtvetov] = useState(() => parseInt(localStorage.getItem('scamlab_total_answered') || '0'));
  const [proydeno, setProydeno] = useState<number[]>(() => JSON.parse(localStorage.getItem('scamlab_completed') || '[]'));
  
  const [vybran_shar, setVybranShar] = useState<string | null>(null), [sloznost, setSloznost] = useState('all');

  const vse_scenarii = [...scenariosData];

  useEffect(() => {
    localStorage.setItem('scamlab_lang', yaz);
    localStorage.setItem('scamlab_nickname', nik);
    localStorage.setItem('scamlab_photo', ava);
    localStorage.setItem('scamlab_sound', String(vkl_zvuk));
    localStorage.setItem('scamlab_music', String(vkl_muzlo));
    localStorage.setItem('scamlab_xp', String(opyt));
    localStorage.setItem('scamlab_level', String(lvl));
    localStorage.setItem('scamlab_streak', String(seriya));
    localStorage.setItem('scamlab_max_combo', String(max_kombo_vsego));
    localStorage.setItem('scamlab_total_correct', String(vse_verno));
    localStorage.setItem('scamlab_total_answered', String(vsego_otvetov));
    localStorage.setItem('scamlab_completed', JSON.stringify(proydeno));
  }, [yaz, nik, ava, vkl_zvuk, vkl_muzlo, opyt, lvl, seriya, max_kombo_vsego, vse_verno, vsego_otvetov, proydeno]);

  const pishim_uvedomlenie = (m: string) => console.log('Uvedomlenie:', m);

  useEffect(() => { (ekran !== 'loading' && ekran !== 'game') && igraem_sfx('transition'); }, [ekran]);
  
  useEffect(() => {
    // Analytics/Session tracking logic could go here
  }, []);

  // --- Components ---

  const Statistika = ({ variant = 'default' }: { variant?: 'default' | 'profile' }) => {
    const tochnost = vsego_otvetov > 0 ? Math.round((vse_verno / vsego_otvetov) * 100) : 0;
    const nyneshniy_rang = RANKS.filter(r => lvl >= r.min).pop();
    return variant === 'profile' ? (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="glass p-5 rounded-[28px]"><div className="flex items-center gap-2 mb-2"><Award className="w-4 h-4 text-yellow-500" /><span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{p('Узровень', 'Уровень')}</span></div><div className="text-2xl font-black">{lvl}</div></div>
          <div className="glass p-5 rounded-[28px]"><div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-orange-500" /><span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{p('Вопыт', 'Опыт')}</span></div><div className="text-2xl font-black">{opyt} XP</div></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-[28px] bg-white/5 border border-white/5"><div className="text-[10px] font-bold text-white/30 uppercase mb-1">{p('Серыя', 'Серия')}</div><div className="text-xl font-black text-yellow-400">{seriya} 🔥</div></div>
          <div className="p-5 rounded-[28px] bg-white/5 border border-white/5"><div className="text-[10px] font-bold text-white/30 uppercase mb-1">{p('Лепшая комба', 'Лучшее комбо')}</div><div className="text-xl font-black text-orange-500">{max_kombo_vsego} 🎯</div></div>
        </div>
        <div className="space-y-5">
          <div><div className="flex justify-between items-center mb-2"><span className="text-xs font-bold">{p('Пройдзена тэстаў', 'Пройдено тестов')}</span><span className="text-xs font-black">{proydeno.length} / {vse_scenarii.length}</span></div><div className="w-full h-2 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (proydeno.length / Math.max(1, vse_scenarii.length)) * 100)}%` }} className="h-full bg-blue-500" /></div></div>
          <div><div className="flex justify-between items-center mb-2"><span className="text-xs font-bold">{p('Дакладнасць', 'Точность')}</span><span className="text-xs font-black">{tochnost}%</span></div><div className="w-full h-2 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${tochnost}%` }} className="h-full bg-green-500" /></div></div>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4 rounded-[24px] text-center"><div className="text-2xl font-black text-yellow-400">{opyt}</div><div className="text-[9px] font-bold text-white/50 uppercase">XP</div></div>
        <div className="glass p-4 rounded-[24px] text-center border-blue-500/30 bg-blue-500/5"><div className="text-2xl font-black text-blue-500">{lvl}</div><div className="text-[9px] font-bold text-white/50 uppercase">{p('узровень', 'уровень')}</div></div>
        <div className="glass p-4 rounded-[24px] text-center border-yellow-500/20 bg-yellow-500/5 relative overflow-hidden"><div className="absolute top-1 right-1 opacity-20"><Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /></div><div className="text-2xl font-black text-yellow-400">{seriya}</div><div className="text-[9px] font-bold text-white/50 uppercase">{p('серыя', 'серия')}</div></div>
        <div className="glass p-4 rounded-[24px] text-center border-green-500/20 bg-green-500/5"><div className="text-2xl font-black text-green-500">{tochnost}%</div><div className="text-[9px] font-bold text-white/50 uppercase">{p('дакладнасць', 'точность')}</div></div>
      </div>
    );
  };
  const [ezednevka_gotova, setEzednevkaGotova] = useState(() => localStorage.getItem('lastDailyDate') === new Date().toDateString());

  const nachat_ezednevku = async () => {
    if (ezednevka_gotova) return alert(p('Вы ўжо прайшлі сённяшні тэст!', 'Вы уже прошли сегодняшний тест!'));
    igraem_sfx('click');
    const vybrannie = [...vse_scenarii].sort(() => 0.5 - Math.random()).slice(0, 10).map(q => ({...q, options: [...q.options].sort(() => 0.5 - Math.random())}));
    setVoprosi(vybrannie); setNomer(0); setOchki(0); setVsegoPrav(0); setVsegoOshib(0); setKomboShas(0); setMaxKomboIgra(0); setOtvecheno(false); setVybraniyVariant(null); setPokazatOtvet(false); setEkran('game');
    localStorage.setItem('lastDailyDate', new Date().toDateString()); setEzednevkaGotova(true); vibraciya('success');
  };

  const muzlo_fon = useRef<Howl | null>(null), zvuki_sfx = useRef<{ [key: string]: Howl }>({});

  useEffect(() => {
    muzlo_fon.current = new Howl({ src: ['https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3'], loop: true, volume: 0.2, autoplay: vkl_muzlo });
    zvuki_sfx.current = {
      click: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-modern-technology-select-3124.mp3'], volume: 0.5 }),
      success: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-reward-952.mp3'], volume: 0.5 }),
      error: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3'], volume: 0.5 }),
      transition: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-digital-quick-sweep-2342.mp3'], volume: 0.3 }),
    };
    return () => { muzlo_fon.current?.stop(); };
  }, []);

  useEffect(() => { vkl_muzlo ? muzlo_fon.current?.play() : muzlo_fon.current?.pause(); }, [vkl_muzlo]);

  const igraem_sfx = (n: string) => vkl_zvuk && zvuki_sfx.current[n]?.play();

  const [voprosi, setVoprosi] = useState<Scenario[]>([]), [nomer, setNomer] = useState(0), [ochki, setOchki] = useState(0), [vsego_prav, setVsegoPrav] = useState(0), [vsego_oshib, setVsegoOshib] = useState(0), [kombo_shas, setKomboShas] = useState(0), [max_kombo_igra, setMaxKomboIgra] = useState(0), [otvecheno, setOtvecheno] = useState(false), [vybraniy_variant, setVybraniyVariant] = useState<number | null>(null), [pokazat_otvet, setPokazatOtvet] = useState(false), [tryasuchka, setTryasuchka] = useState(false);

  useEffect(() => {}, []);
  useEffect(() => {}, [ekran]);

  const nachat_igru = useCallback(() => {
    igraem_sfx('transition');
    let pul = Array.isArray(vse_scenarii) ? [...vse_scenarii] : [];
    if (pul.length === 0) return (vibraciya('error'), setOknoVnimanie({ show: true, title: p('Памылка', 'Ошибка'), message: p('Памылка: Сцэнарыі не загружаны. Калі ласка, перазагрузіце старонку.', 'Ошибка: Сценарии не загружены. Пожалуйста, перезагрузите страницу.') }));
    if (vybran_shar) pul = pul.filter(s => s.sphere === vybran_shar);
    if (sloznost !== 'all') pul = pul.filter(s => s.difficulty === sloznost);
    const vybrannie = pul.sort(() => 0.5 - Math.random()).slice(0, Math.min(N_QUESTIONS, pul.length)).map(q => ({...q, options: [...q.options].sort(() => 0.5 - Math.random())}));
    setVoprosi(vybrannie); setNomer(0); setOchki(0); setVsegoPrav(0); setVsegoOshib(0); setKomboShas(0); setMaxKomboIgra(0); setOtvecheno(false); setVybraniyVariant(null); setPokazatOtvet(false); setEkran('game'); vibraciya('medium');
  }, [vybran_shar, sloznost]);

  useEffect(() => {
    const tiktak = setInterval(() => {
      setProgresBar(p => {
        if (p >= 100) { clearInterval(tiktak); setTimeout(() => { setGruzim(false); setEkran('welcome'); setPokazatYaz(true); }, 500); return 100; }
        return p + 2;
      });
    }, 50);
    return () => clearInterval(tiktak);
  }, []);

  const vibraciya = useCallback((t: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      t === 'light' ? navigator.vibrate(10) : t === 'medium' ? navigator.vibrate(20) : t === 'heavy' ? navigator.vibrate(40) : t === 'success' ? navigator.vibrate([10, 30, 10]) : t === 'warning' ? navigator.vibrate([15, 50, 15]) : navigator.vibrate([20, 100, 20]);
    }
  }, []);

  const tyknut_otvet = useCallback((i: number) => {
    if (otvecheno) return; setOtvecheno(true); setVybraniyVariant(i);
    const q = voprosi[nomer], o = q.options[i], m = Math.max(...q.options.map(x => x.points)) || 1, e = o.points >= m * 0.4, p_ochki = o.points;
    setOchki(v => v + p_ochki); const n_o = opyt + p_ochki * 2; setOpyt(n_o);
    e ? setSeriya(0) : setSeriya(v => v + 1);
    const n_l = Math.floor(Math.sqrt(n_o / 10)) + 1;
    if (n_l > lvl) { setLvl(n_l); vibraciya('success'); }
    if (e) {
      igraem_sfx('success'); const n_k = kombo_shas + 1; setKomboShas(n_k); (n_k > max_kombo_igra) && setMaxKomboIgra(n_k); (n_k > max_kombo_vsego) && setMaxKomboVsego(n_k); setVsegoPrav(v => v + 1); setVse_verno(v => v + 1);
      (n_k % 5 === 0) ? vibraciya('heavy') : vibraciya('success');
    } else {
      igraem_sfx('error'); setKomboShas(0); setVsegoOshib(v => v + 1); setTryasuchka(true); setTimeout(() => setTryasuchka(false), 500); vibraciya('error');
    }
    setVsegoOtvetov(v => v + 1); setPokazatOtvet(true);
  }, [otvecheno, voprosi, nomer, opyt, lvl, kombo_shas, max_kombo_igra, max_kombo_vsego, vibraciya, igraem_sfx]);

  const sled_vopros = useCallback(() => {
    if (nomer + 1 < voprosi.length) { setNomer(v => v + 1); setOtvecheno(false); setVybraniyVariant(null); setPokazatOtvet(false); }
    else {
      setEkran('final');
      if (ochki >= 80) { igraem_sfx('success'); pishim_uvedomlenie(p(`🏆 Выдатны вынік! Вы набралі ${ochki} балаў.`, `🏆 Отличный результат! Вы набрали ${ochki} баллов.`)); vibraciya('success'); }
      else if (ochki < 30) { igraem_sfx('error'); vibraciya('error'); }
      const n_p = [...proydeno]; let izm = false; voprosi.forEach(q => (!n_p.includes(q.id)) && (n_p.push(q.id), izm = true));
      izm && setProydeno(n_p);
    }
  }, [nomer, voprosi, ochki, igraem_sfx, proydeno]);

  // --- Vibration Logic ---
  useEffect(() => {
    // Vibrations only if enabled/supported
  }, []);

  // Handle MainButton for Game replaced by on-screen button
  useEffect(() => {
    // No TG MainButton
  }, []);

  // --- Helper Components ---
  const Zhdun = () => (
    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="screen flex flex-col items-center justify-center p-8 bg-[#000] z-[999]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div><div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div></div>
      <div className="relative mb-12"><div className="w-32 h-32 rounded-[40px] glass-bright flex items-center justify-center relative z-10"><Shield className="w-14 h-14 text-blue-500" /><motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="absolute inset-[-12px] rounded-[48px] border border-blue-500/20"></motion.div></div><div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"></div></div>
      <div className="w-full max-w-[240px] relative z-10">
        <div className="flex justify-between mb-3 px-1"><span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{p('Загрузка сістэмы...', 'Загрузка системы...')}</span><span className="text-[10px] font-black text-blue-500 tabular-nums">{progres_bar}%</span></div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progres_bar}%` }} className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></motion.div></div>
        <p className="text-[8px] text-center mt-4 text-white/20 font-bold uppercase tracking-widest animate-pulse">{p('Ініцыялізацыя пратаколаў бяспекі', 'Инициализация протоколов безопасности')}</p>
      </div>
      <div className="mt-12 text-center relative z-10"><p className="text-[10px] text-white/20 font-medium uppercase tracking-[0.3em]">ScamLab Protocol v2.6</p></div>
    </motion.div>
  );

  const Klichka_Okno = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-8 rounded-[40px] w-full max-w-sm">
        <h3 className="text-xl font-black mb-6 text-center">{p('Змяніць нікнейм', 'Изменить никнейм')}</h3>
        <input type="text" value={vremennyi_nik} onChange={(e) => setVremennyiNik(e.target.value)} placeholder={p('Увядзіце новы нікнейм', 'Введите новый никнейм')} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white mb-6 outline-none focus:border-blue-500/50 transition-all font-bold" autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setOknoNika(false)} className="w-full py-4 rounded-[24px] glass border-white/10 font-bold text-sm">{p('Адмена', 'Отмена')}</button>
          <button onClick={() => { if (vremennyi_nik.trim()) { setNik(vremennyi_nik.trim()); setOknoNika(false); vibraciya('success'); } }} className="w-full py-4 rounded-[24px] bg-blue-500 text-white font-bold text-sm">{p('Захаваць', 'Сохранить')}</button>
        </div>
      </motion.div>
    </motion.div>
  );

  const Yazyk_Okno = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="suspended-panel w-full max-w-sm flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl glass-bright flex items-center justify-center mb-6"><Languages className="w-8 h-8 text-blue-500" /></div>
        <h2 className="text-2xl font-black mb-2">Выберыце мову / Выберите язык</h2>
        <p className="text-white/60 text-sm mb-8">На якой мове вам зручней праходзіць навучанне? / На каком языке вам удобнее проходить обучение?</p>
        <div className="grid grid-cols-1 gap-4 w-full">
          <button onClick={() => { setPokazatYaz(false); if (ekran === 'welcome') { setOnbordingViden(true); setEkran('onboarding'); } igraem_sfx('click'); vibraciya('medium'); }} className="btn-primary w-full py-5 rounded-[24px]">🇧🇾 Беларуская</button>
          <button onClick={() => { setYaz('ru'); setPokazatYaz(false); if (ekran === 'welcome') { setOnbordingViden(true); setEkran('onboarding'); } igraem_sfx('click'); vibraciya('medium'); }} className="btn-primary w-full py-5 rounded-[24px]">🇷🇺 Русский</button>
        </div>
      </motion.div>
    </motion.div>
  );

  const p = (val: string | { be: string; ru: string } | any, ruVal?: string) => {
    if (!val) return '';
    if (typeof val === 'string') return ruVal ? (yaz === 'be' ? val : ruVal) : val;
    return val[yaz] || val.be || val.ru || '';
  };

  const Bravzer_Okno = ({ c }: { c: any }) => {
    if (!c) return null;
    return (
      <div className="ui-safari rounded-2xl overflow-hidden bg-[#1c1c1e]">
        <div className="safari-chrome p-3 border-b border-white/10"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/60">←</div><div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/60">→</div><div className="flex-1 bg-white/10 rounded-lg py-1.5 px-3 flex items-center gap-2 min-w-0"><span className="text-[10px] text-green-500">🔒</span><span className="text-xs text-white/60 truncate">{c.url}</span></div></div></div>
        {c.warning && <div className="bg-red-500/15 border border-red-500/30 m-2 p-2 rounded-lg text-xs text-red-400">⚠️ {p(c.warning)}</div>}
        <div className="p-4"><div className="text-base font-bold mb-2">{p(c.page_title)}</div><p className="text-sm text-white/60 leading-relaxed mb-4">{p(c.description)}</p>
          {c.input_label && <div className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-sm text-white/30 mb-3">{p(c.input_label)}</div>}
          {c.page_cta && <div className="w-full bg-blue-500/80 p-3 rounded-xl text-center font-semibold text-sm">{p(c.page_cta)}</div>}
        </div>
      </div>
    );
  };

  const Telega_Okno = ({ c }: { c: any }) => {
    if (!c) return null;
    return (
      <div className="ui-telegram bg-[#0d1117] rounded-2xl overflow-hidden">
        <div className="bg-[#14141e]/95 p-3 border-b border-white/10 flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm">{(p(c.bot_name || c.sender) || '??').slice(0, 2).toUpperCase()}</div><div><div className="text-sm font-semibold flex items-center gap-1">{p(c.bot_name || c.sender)}{c.bot_verified && <span className="text-blue-500 text-xs">✓</span>}</div><div className="text-[10px] text-green-500">{p('у сетцы', 'в сети')}</div></div></div>
        <div className="p-4 flex flex-col gap-2">{c.messages?.map((m: any, i: number) => <div key={i} className="tg-bubble tg-bubble-in p-3 rounded-2xl text-sm max-w-[85%] self-start">{p(m)}<div className="text-[10px] text-white/30 text-right mt-1">21:09</div></div>)}</div>
        {c.buttons && <div className="flex flex-wrap gap-2 p-4 pt-0">{c.buttons.map((b: any, i: number) => <div key={i} className="flex-1 min-w-[100px] p-2 rounded-lg bg-blue-500/15 text-blue-500 border border-blue-500/20 text-center text-xs font-medium">{p(b)}</div>)}</div>}
      </div>
    );
  };

  const Zvonok_Okno = ({ c }: { c: any }) => {
    if (!c) return null;
    return (
      <div className="ui-phone bg-gradient-to-b from-[#1a1a2e] to-[#0d0d1a] p-7 rounded-2xl flex flex-col items-center gap-3"><div className="text-5xl mb-1">📞</div><div className="text-xl font-bold">{p(c.caller)}</div><div className="text-sm text-white/30">{c.number}</div><div className="text-xs text-white/60">{c.duration === 'incoming' ? p('📲 Уваходны выклік...', '📲 Входящий вызов...') : p('📞 Ідзе выклік...', '📞 Идет вызов...')}</div>{c.script && <div className="bg-white/5 border border-white/10 rounded-xl p-3 my-2 w-full text-xs text-white/60 italic leading-relaxed">"{p(c.script)}"</div>}<div className="flex gap-10 mt-2"><div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-2xl shadow-lg shadow-green-500/30">📞</div><div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-2xl shadow-lg shadow-red-500/30">📵</div></div></div>
    );
  };

  const Vatnik_Okno = ({ c }: { c: any }) => {
    if (!c) return null;
    const msgs = c.messages || (c.message ? [c.message] : []);
    return (
      <div className="ui-whatsapp rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col w-full bg-[#efe7de] transition-all duration-500">
        <div className="bg-[#008069] p-3 pl-4 flex items-center gap-3 shrink-0 shadow-md z-10"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg overflow-hidden border border-white/10 shadow-inner">{c.avatar ? <img src={c.avatar} alt="" className="w-full h-full object-cover" /> : '👤'}</div><div className="flex-1 min-w-0"><div className="text-sm font-bold text-white truncate leading-tight">{p(c.sender || c.from || 'WhatsApp')}</div><div className="text-[11px] text-white/80 flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#46d362] animate-pulse"></span>{p('у сетцы', 'в сети')}</div></div><div className="flex items-center gap-4 text-white pr-2"><Video className="w-5 h-5 opacity-90 hover:opacity-100 cursor-pointer transition-opacity" />
            <Phone className="w-4 h-4 opacity-90 hover:opacity-100 cursor-pointer transition-opacity" />
            <MoreVertical className="w-5 h-5 opacity-90 hover:opacity-100 cursor-pointer transition-opacity" />
          </div>
        </div>

        <div className="flex-1 wa-chat-bg p-4 flex flex-col gap-2 min-h-[300px] max-h-[450px] overflow-y-auto scrollbar-hide">
          {msgs.length > 0 ? msgs.map((m: any, i: number) => {
            const vylet = m.from === 'me'; const tekst = p(m.text || m);
            return (
              <div key={i} className={`flex ${vylet ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`} style={{ animationDelay: `${i * 150}ms` }}>
                <div className={`wa-bubble ${vylet ? 'wa-bubble-out' : 'wa-bubble-in'} relative max-w-[85%] px-3 py-1.5 shadow-sm`}><div className="text-[14.5px] leading-[1.4] text-[#111b21] break-words">{tekst}</div><div className="flex items-center justify-end gap-1 mt-0.5 h-3"><span className="text-[10px] text-[#667781]">14:20</span>{vylet && <CheckCircle2 className="w-3 h-3 text-[#53bdeb]" />}</div></div>
              </div>
            );
          }) : <div className="text-center text-gray-500 text-xs italic mt-10">{p('Няма паведамленняў', 'Нет сообщений')}</div>}
        </div>
        <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 shrink-0 border-t border-[#e9edef]"><div className="flex gap-3 px-2 text-[#54656f]"><Smile className="w-6 h-6" /><Paperclip className="w-6 h-6" /></div><div className="flex-1 bg-white rounded-xl px-4 py-2.5 flex items-center justify-between text-[#8696a0] shadow-sm border border-transparent focus-within:border-[#008069] transition-colors"><span className="text-[15px]">{p('Паведамленне', 'Сообщение')}</span></div><div className="w-11 h-11 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"><Mic className="w-6 h-6" /></div></div>
      </div>
    );
  };

  const Diskord_Okno = ({ c }: { c: any }) => {
    if (!c) return null;
    return (
      <div className="ui-discord bg-[#36393f] rounded-2xl overflow-hidden p-4"><div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2"><div className="w-6 h-6 bg-[#5865f2] rounded-lg flex items-center justify-center text-[10px]">#</div><span className="text-sm font-bold text-white/80">{p(c.channel || 'general')}</span></div><div className="space-y-4">{c.messages?.map((msg: any, i: number) => (<div key={i} className="flex gap-3"><div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-xs font-bold">{p(msg.from)?.slice(0, 1)}</div><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-white">{p(msg.from)}</span>{msg.role && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 uppercase">{p(msg.role)}</span>}<span className="text-[10px] text-white/20">{p('Сёння а 14:22', 'Сегодня в 14:22')}</span></div><p className="text-sm text-white/80 leading-relaxed">{p(msg.text)}</p></div></div>))}</div></div>
    );
  };

  const Insta_Okno = ({ c }: { c: any }) => {
    if (!c) return null;
    return (
      <div className="ui-instagram bg-black rounded-2xl overflow-hidden border border-white/10"><div className="p-3 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]"><div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px]">👤</div></div><div className="flex-1"><div className="text-xs font-bold flex items-center gap-1">{p(c.post_author)}{c.verified && <span className="text-blue-500 text-[10px]">✓</span>}</div><div className="text-[10px] text-white/60">{p(c.location)}</div></div></div><div className="aspect-square bg-white/5 flex items-center justify-center text-4xl">🖼️</div><div className="p-3"><div className="flex gap-3 mb-2"><span>❤️</span> <span>💬</span> <span>✈️</span></div><p className="text-xs leading-relaxed"><span className="font-bold mr-2">{p(c.post_author)}</span><span className="text-white/80">{p(c.caption)}</span></p><div className="text-[10px] text-blue-400 mt-2">{c.link}</div></div></div>
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

  const Okno_Podtverzdeniya = () => {
    if (!okno_podtverzdeniya) return null;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass w-full max-w-sm p-8 rounded-[40px] text-center"><div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6"><AlertCircle className="w-8 h-8 text-red-500" /></div><h2 className="text-xl font-black mb-6">{okno_podtverzdeniya.title}</h2><div className="grid grid-cols-2 gap-3"><button onClick={() => { setOknoPodtverzdeniya(null); igraem_sfx('click'); }} className="w-full py-4 rounded-[24px] glass border-white/10 font-bold text-sm">{p('Адмена', 'Отмена')}</button><button onClick={() => { okno_podtverzdeniya.onConfirm(); igraem_sfx('click'); }} className="w-full py-4 rounded-[24px] bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/20">{p('Так', 'Да')}</button></div></motion.div>
      </motion.div>
    );
  };

  const Okno_Vnimanie = () => {
    if (!okno_vnimanie) return null;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-8 rounded-[40px] w-full max-w-sm text-center"><div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 mx-auto"><AlertCircle size={32} /></div><h3 className="text-xl font-black mb-2">{p(okno_vnimanie.title)}</h3><p className="text-white/85 mb-8 leading-relaxed">{p(okno_vnimanie.message)}</p><button onClick={() => { setOknoVnimanie(null); igraem_sfx('click'); }} className="w-full py-4 rounded-[24px] bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20">{p('Зразумела', 'Понятно')}</button></motion.div>
      </motion.div>
    );
  };

  const Onbording_Ekran = () => {
    const [stadiya, setStadiya] = useState(0);
    const shagi = [{ title: { be: "Сардэчна запрашаем!", ru: "Добро пожаловать!" }, desc: { be: "SCAMLAB — гэта ваш асабісты трэнажор па кібербяспецы. Тут вы навучыцеся распазнаваць махляроў у рэальных сітуацыях.", ru: "SCAMLAB — это ваш личный тренажер по кибербезопасности. Здесь вы научитесь распознавать мошенников в реальных ситуациях." }, icon: <Shield className="w-16 h-16 text-blue-500" /> }, { title: { be: "Рэальныя кейсы", ru: "Реальные кейсы" }, desc: { be: "Мы выкарыстоўваем інтэрфейсы папулярных месенджараў і сацыяльных сетак, каб навучанне было максімальна набліжаным да жыцця.", ru: "Мы используем интерфейсы популярных мессенджеров и социальных сетей, чтобы обучение было максимально приближенным к жизни." }, icon: <Smartphone className="w-16 h-16 text-purple-500" /> }];
    const dalee = () => { if (stadiya < shagi.length - 1) { setStadiya(stadiya + 1); igraem_sfx('click'); vibraciya('light'); } else { setEkran('intro'); setOnbordingViden(false); igraem_sfx('transition'); vibraciya('medium'); } };
    return (
      <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="screen p-8 flex flex-col items-center justify-between"><div className="flex-1 flex flex-col items-center justify-center text-center w-full"><div className="suspended-panel w-full max-w-sm"><motion.div key={stadiya} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8 flex justify-center">{shagi[stadiya].icon}</motion.div><motion.h2 key={`title-${stadiya}`} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-2xl font-black mb-4">{p(shagi[stadiya].title)}</motion.h2><motion.p key={`desc-${stadiya}`} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-white/85 leading-relaxed">{p(shagi[stadiya].desc)}</motion.p></div></div><div className="w-full space-y-6"><div className="flex justify-center gap-2">{shagi.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i === stadiya ? 'w-8 bg-blue-500' : 'w-2 bg-white/10'}`}></div>)}</div><button onClick={dalee} className="btn-primary w-full py-5 rounded-[24px] text-lg font-bold">{stadiya === shagi.length - 1 ? p('Пачаць', 'Начать') : p('Далей', 'Далее')}</button></div></motion.div>
    );
  };

  const Risovat_Tabbar = () => {
    if (gruzim || ekran === 'loading' || ekran === 'welcome' || ekran === 'game' || ekran === 'final' || ekran === 'onboarding') return null;
    return (
      <div className="tab-bar">
        <button onClick={() => { setEkran('intro'); setTabik('home'); igraem_sfx('click'); vibraciya('light'); }} className={`tab-item ${tabik === 'home' ? 'active' : ''}`}><Layout className="w-5 h-5" /><span className="text-[9px] font-medium">{p('Галоўная', 'Главная')}</span></button>
        <button onClick={() => { setEkran('hub'); setTabik('profile'); igraem_sfx('click'); vibraciya('light'); }} className={`tab-item ${tabik === 'profile' ? 'active' : ''}`}><User className="w-5 h-5" /><span className="text-[9px] font-medium">{p('Профіль', 'Профиль')}</span></button>
      </div>
    );
  };

  return (
    <div className="app h-full w-full relative bg-black">
      <div className="ambient"><div className="orb orb-a"></div><div className="orb orb-b"></div></div>
      {pokazat_yaz && <Yazyk_Okno />}
      {okno_nika && <Klichka_Okno />}
      {okno_podtverzdeniya && <Okno_Podtverzdeniya />}
      {okno_vnimanie && <Okno_Vnimanie />}
      <AnimatePresence mode="wait">
        {ekran === 'loading' && <Zhdun key="loading" />}
        {ekran === 'onboarding' && <Onbording_Ekran />}
        {ekran === 'welcome' && (
          <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={SPRING} className="screen p-4 flex flex-col items-center justify-center">
            <div className="suspended-panel w-full max-w-sm flex flex-col items-center">
              <div className="text-center mb-8"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, ...SPRING }} className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center"><div className="absolute inset-[-15px] rounded-full bg-blue-500/20 blur-xl animate-pulse"></div><div className="w-full h-full glass-bright rounded-[32px] flex items-center justify-center shadow-2xl"><Shield className="w-14 h-14 text-white" /></div></motion.div><h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">SCAMLAB</h1><p className="text-white/60 font-medium tracking-tight mb-6">{p('Трэнажор лічбавай бяспекі', 'Тренажер цифровой безопасности')}</p><div className="glass p-6 rounded-[32px] border border-white/5 text-left"><p className="text-xs text-white/85 leading-relaxed">{p('Сардэчна запрашаем у SCAMLAB! Гэта інтэрактыўная платформа, дзе вы навучыцеся абараняць сябе ад сучасных кіберпагроз. Мы сабралі рэальныя кейсы махлярства, каб вы маглі патрэніравацца ў бяспечным асяроддзі.','Добро пожаловать в SCAMLAB! Это интерактивная платформа, где вы научитесь защищать себя от современных киберугроз. Мы собрали реальные кейсы мошенничества, чтобы вы могли потренироваться в безопасной среде.')}</p></div></div>
              <div className="w-full space-y-3 mb-8"><div className="grid grid-cols-2 gap-3"><div className="glass p-4 rounded-[24px] flex flex-col gap-2"><Layout className="w-5 h-5 text-blue-400" /><span className="text-xs font-bold leading-tight">{p('Рэальныя кейсы', 'Реальные кейсы')}</span></div><div className="glass p-4 rounded-[24px] flex flex-col gap-2"><Smartphone className="w-5 h-5 text-purple-400" /><span className="text-xs font-bold leading-tight">{p('iOS інтэрфейс', 'iOS интерфейс')}</span></div></div></div>
              <div className="w-full"><button onClick={() => { setEkran('intro'); igraem_sfx('transition'); if (vkl_muzlo) muzlo_fon.current?.play(); vibraciya('success'); }} className="btn-primary w-full py-6 rounded-[28px] text-xl font-black flex items-center justify-center gap-3"><span>{p('Пачаць', 'Начать')}</span><ChevronRight className="w-7 h-7" /></button><p className="text-[11px] text-white/20 mt-4 text-center font-medium">{p('Беларуская рэдакцыя', 'Русская редакция')} · 2026</p></div>
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
                    const isCorrect = opt.points >= maxPts * 0.4;
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
                    const isCorrect = selectedOpt ? selectedOpt.points >= maxPts * 0.4 : false;

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
                </div>

                <div className="grid grid-cols-1 gap-3 mb-6">
                  <button 
                    onClick={() => {
                      setTempNickname(nickname);
                      setShowNicknameModal(true);
                      haptic('light');
                    }}
                    className="glass p-5 rounded-[28px] flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('Нік', 'Ник')}</span>
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
