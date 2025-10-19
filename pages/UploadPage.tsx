
import React, { useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { performOcr } from '../services/geminiService';

const UploadPage: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();

  if (!context) {
    return <div>Loading context...</div>;
  }

  const {
    imageFile,
    setImageFile,
    imagePreviewUrl,
    imageRotation,
    setImageRotation,
    setOcrResult,
    setIsLoading,
    setError,
    isLoading,
    error
  } = context;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Clear previous results when a new file is selected
      setError(null);
      setOcrResult(null);
      setImageFile(e.target.files[0]);
    }
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (!imageFile) {
      setError("الرجاء اختيار صورة أولاً.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await performOcr(imageFile);
      setOcrResult(result);
      navigate('/review');
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, setOcrResult, setIsLoading, setError, navigate]);

  const rotateImage = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">رفع ورقة الإجابات</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          اختر صورة واضحة لورقة الإجابات الخاصة بك لتحليلها.
        </p>

        <div className="mb-6">
          <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition-transform transform hover:scale-105">
            <i className="fas fa-upload mr-3"></i>
            <span>اختر ملف الصورة</span>
          </label>
          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
        </div>

        {imagePreviewUrl && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">معاينة الصورة</h3>
            <div className="relative inline-block border-4 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <img
                src={imagePreviewUrl}
                alt="معاينة ورقة الإجابات"
                className="max-w-full h-auto max-h-96 transition-transform duration-300"
                style={{ transform: `rotate(${imageRotation}deg)` }}
              />
            </div>
            <div className="mt-4 flex justify-center gap-4">
               <button onClick={rotateImage} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                <i className="fas fa-sync-alt mr-2"></i> تدوير
              </button>
              {/* NOTE: Crop functionality is complex and omitted for this version as per guidelines. */}
            </div>
          </div>
        )}

        {imageFile && (
           <button
            onClick={handleAnalyzeClick}
            disabled={isLoading}
            className="w-full md:w-auto px-12 py-4 bg-green-600 text-white font-bold rounded-2xl text-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>جاري التحليل...</span>
              </>
            ) : (
              <>
                <i className="fas fa-cogs"></i>
                <span>تحليل</span>
              </>
            )}
          </button>
        )}
        
        {error && (
          <div className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/50 border border-red-500 p-3 rounded-lg">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
