import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { VoiceOption, Settings } from '../types';

const PreferencesPage: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    return <div>Loading...</div>;
  }

  const { settings, updateSetting } = context;
  // Updated voice IDs to match the supported voices from the Gemini API error log.
  const voices: { id: VoiceOption, name: string }[] = [
    { id: 'Kore', name: 'عربي - صوت 1 (أنثى - هادئ)'},
    { id: 'Zephyr', name: 'عربي - صوت 2 (أنثى - واضح)'},
    { id: 'vindemiatrix', name: 'عربي - صوت 3 (أنثى - احترافي)'},
    { id: 'autonoe', name: 'عربي - صوت 4 (أنثى - شبابي)'},
    { id: 'Puck', name: 'عربي - صوت 5 (ذكر - عميق)'},
    { id: 'Charon', name: 'عربي - صوت 6 (ذكر - رسمي)'},
    { id: 'Fenrir', name: 'عربي - صوت 7 (ذكر - قوي)'},
    { id: 'orus', name: 'عربي - صوت 8 (ذكر - ودود)'},
  ];

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | number = value;

    if (type === 'number') {
      finalValue = parseInt(value, 10);
    }
    
    updateSetting(name as keyof Settings, finalValue);
  };
  
  const playSample = (voice: VoiceOption) => {
    // This uses the Web Speech API for a quick sample.
    // The actual generation uses Gemini TTS.
    const utterance = new SpeechSynthesisUtterance("هذا مثال على الصوت المختار.");
    // Find a suitable Arabic voice from the browser's available voices
    const browserVoices = window.speechSynthesis.getVoices();
    const arabicVoice = browserVoices.find(v => v.lang.startsWith('ar-'));
    if(arabicVoice) {
      utterance.voice = arabicVoice;
    }
    utterance.lang = "ar-SA";
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">إعدادات الصوت والتطبيق</h2>
      <div className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
        {/* Answer Format */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border dark:border-gray-700 rounded-xl">
          <label className="font-semibold text-lg mb-2 sm:mb-0">تنسيق قراءة الإجابة</label>
          <div className="flex flex-wrap gap-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => updateSetting('answerFormat', 'full')}
              className={`px-3 py-2 text-sm rounded-md transition ${settings.answerFormat === 'full' ? 'bg-blue-600 text-white' : ''}`}
            >
              رقم السؤال + الإجابة
            </button>
             <button
              onClick={() => updateSetting('answerFormat', 'compact')}
              className={`px-3 py-2 text-sm rounded-md transition ${settings.answerFormat === 'compact' ? 'bg-blue-600 text-white' : ''}`}
            >
              رقم السؤال + الإجابة (مختصر)
            </button>
            <button
              onClick={() => updateSetting('answerFormat', 'answer_only')}
              className={`px-3 py-2 text-sm rounded-md transition ${settings.answerFormat === 'answer_only' ? 'bg-blue-600 text-white' : ''}`}
            >
              الإجابة فقط
            </button>
          </div>
        </div>
        
        {/* Questions per Segment */}
        <div className="p-4 border dark:border-gray-700 rounded-xl">
          <label htmlFor="questionsPerSegment" className="block font-semibold text-lg mb-2">
            عدد الأسئلة في كل مقطع صوتي
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              id="questionsPerSegment"
              name="questionsPerSegment"
              min="1"
              max="50"
              value={settings.questionsPerSegment}
              onChange={handleSettingChange}
              className="w-full"
            />
            <span className="font-bold text-lg w-12 text-center">{settings.questionsPerSegment}</span>
          </div>
        </div>

        {/* Voice Selection */}
        <div className="p-4 border dark:border-gray-700 rounded-xl">
           <label htmlFor="voice" className="block font-semibold text-lg mb-2">
            اختيار الصوت
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {voices.map(v => (
              <div key={v.id} className={`flex items-center p-3 rounded-lg border-2 ${settings.voice === v.id ? 'border-blue-500 bg-blue-500/10' : 'border-transparent'}`}>
                <input
                  type="radio"
                  id={`voice-${v.id}`}
                  name="voice"
                  value={v.id}
                  checked={settings.voice === v.id}
                  onChange={handleSettingChange}
                  className="w-5 h-5 text-blue-600 form-radio"
                />
                <label htmlFor={`voice-${v.id}`} className="flex-grow mr-3 cursor-pointer">{v.name}</label>
                 <button onClick={() => playSample(v.id)} className="text-gray-500 hover:text-blue-500 transition">
                  <i className="fas fa-play-circle text-xl"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* TTS Backend */}
        <div className="p-4 border dark:border-gray-700 rounded-xl">
          <label htmlFor="ttsBackend" className="block font-semibold text-lg mb-2">
            محرك تحويل النص إلى كلام (TTS)
          </label>
          <select
            id="ttsBackend"
            name="ttsBackend"
            value={settings.ttsBackend}
            onChange={handleSettingChange}
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            <option value="gemini">Gemini Text-to-Speech (موصى به)</option>
            <option value="browser">Web SpeechSynthesis (احتياطي)</option>
          </select>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Gemini يوفر أصواتًا بجودة عالية. الخيار الاحتياطي يستخدم الأصوات المدمجة في متصفحك وقد تختلف جودتها.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;