import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { generateTts } from '../services/geminiService';
import { decode, createWavBlob } from '../utils/helpers';
import { ParsedAnswer, AudioSegment } from '../types';

const ReviewPage: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();

  const [editableAnswers, setEditableAnswers] = useState<ParsedAnswer[]>([]);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
  if (!context) return null;
  const { 
      ocrResult, 
      settings,
      isLoading,
      setIsLoading,
      setError,
      error,
      setAudioSegments,
      audioSegments,
      playSegment, // Use centralized play function
      updateSetting,
  } = context;

  useEffect(() => {
    // If there's no OCR result, redirect to the upload page.
    if (!ocrResult) {
      navigate('/');
    } else {
      setEditableAnswers([...ocrResult.questions].sort((a,b) => a.q - b.q));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrResult, navigate]);

  const handleAnswerChange = (index: number, newAnswer: string) => {
    const updated = [...editableAnswers];
    updated[index].answer = newAnswer.toUpperCase();
    setEditableAnswers(updated);
  };

  const generateAudio = useCallback(async () => {
    if (!editableAnswers || editableAnswers.length === 0) return;
    setIsLoading(true);
    setError(null);
    setAudioSegments([]);
    setGenerationProgress(0);

    const { questionsPerSegment, answerFormat, voice, ttsBackend } = settings;
    const segments: Omit<AudioSegment, 'url' | 'blob'>[] = [];

    // 1. Create text segments (this is synchronous and fast)
    for (let i = 0; i < editableAnswers.length; i += questionsPerSegment) {
        const chunk = editableAnswers.slice(i, i + questionsPerSegment);
        if (chunk.length === 0) continue;
        let text = '';
        if (answerFormat === 'full') {
            text = chunk.map(q => `السؤال رقم ${q.q}، الإجابة ${q.answer}`).join('. <break time="400ms"/> ');
        } else if (answerFormat === 'compact') {
            text = chunk.map(q => `${q.q}${q.answer}`).join('. <break time="300ms"/> ');
        } else { // 'answer_only'
            text = chunk.map(q => q.answer).join('. <break time="300ms"/> ');
        }
        segments.push({
            id: `segment-${i}`,
            label: `أسئلة ${chunk[0].q}–${chunk[chunk.length - 1].q}`,
            text: text,
        });
    }

    const totalSegments = segments.length;
    if (totalSegments === 0) {
        setIsLoading(false);
        return;
    }
    
    // 2. Create an array of promises to generate audio in parallel
    let completedCount = 0;
    const audioGenerationPromises = segments.map((segment) => {
        return (async (): Promise<AudioSegment> => {
            if (ttsBackend === 'gemini') {
                const audioBase64 = await generateTts(segment.text, voice);
                const pcmBytes = decode(audioBase64);
                const pcmInt16 = new Int16Array(pcmBytes.buffer);
                const blob = createWavBlob(pcmInt16, 24000);
                const url = URL.createObjectURL(blob);
                
                // Update progress after each promise resolves
                completedCount++;
                setGenerationProgress(Math.round((completedCount / totalSegments) * 100));

                return { ...segment, url, blob };
            } else {
                // Fallback for browser TTS (simulated async)
                completedCount++;
                setGenerationProgress(Math.round((completedCount / totalSegments) * 100));
                // We can't easily get a blob, so we'll leave it empty.
                const utterance = new SpeechSynthesisUtterance(segment.text.replace(/<break.*?>/g, ' '));
                window.speechSynthesis.speak(utterance); // Speak for immediate feedback
                return { ...segment, url: '#browser', blob: new Blob() };
            }
        })();
    });

    // 3. Execute all promises and handle results
    try {
        const generatedAudioSegments = await Promise.all(audioGenerationPromises);
        setAudioSegments(generatedAudioSegments);
    } catch (err: any) {
        setError(err.message || "حدث خطأ غير متوقع أثناء إنشاء الصوت.");
        setGenerationProgress(0);
    } finally {
        setIsLoading(false);
    }
}, [editableAnswers, settings, setIsLoading, setError, setAudioSegments]);
  
  if (!ocrResult) {
    return null; // Or a loading spinner, since we redirect in useEffect
  }

  const downloadSegment = (segment: AudioSegment) => {
     if (segment.url === '#browser' || !segment.blob.size) {
        alert("التنزيل غير مدعوم في وضع TTS للمتصفح.");
        return;
    }
    const link = document.createElement('a');
    link.href = segment.url;
    link.download = `DrCorrector_${segment.label}.wav`; // Changed to .wav
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">عرض النتائج وتوليد الصوت</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* OCR Results Table */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-2xl font-semibold mb-4">الإجابات المستخرجة</h3>
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-center">
              <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-3">رقم السؤال</th>
                  <th className="p-3">الإجابة</th>
                  <th className="p-3">ثقة OCR</th>
                </tr>
              </thead>
              <tbody>
                {editableAnswers.map((item, index) => (
                  <tr key={item.q} className="border-b dark:border-gray-700">
                    <td className="p-2">{item.q}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.answer}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        className="w-16 text-center bg-gray-100 dark:bg-gray-600 rounded p-1"
                      />
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-sm ${item.confidence > 0.9 ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audio Generation and Player */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold">المقاطع الصوتية</h3>
              <div className="flex items-center gap-3">
                <label htmlFor="autoplay-toggle" className="font-medium text-sm sm:text-base">التشغيل التلقائي</label>
                <button
                    id="autoplay-toggle"
                    onClick={() => updateSetting('autoplay', !settings.autoplay)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                        settings.autoplay ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                >
                    <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            settings.autoplay ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
              </div>
          </div>
          <button
            onClick={generateAudio}
            disabled={isLoading}
            className="w-full px-8 py-3 bg-blue-600 text-white font-bold rounded-xl text-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 mb-6"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>جاري إنشاء الصوت...</span>
              </>
            ) : (
              <>
                <i className="fas fa-volume-up"></i>
                <span>إنشاء الصوت</span>
              </>
            )}
          </button>

          {isLoading && (
            <div className="my-4">
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                جاري الإنشاء... {generationProgress}%
              </p>
            </div>
          )}
          
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}

          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {audioSegments.map(segment => (
              <div key={segment.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="font-semibold">{segment.label}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => playSegment(segment)} className="text-xl text-blue-500 hover:text-blue-400">
                    <i className="fas fa-play-circle"></i>
                  </button>
                   <button onClick={() => downloadSegment(segment)} className="text-xl text-green-500 hover:text-green-400">
                    <i className="fas fa-download"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;