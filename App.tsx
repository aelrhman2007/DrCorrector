
import React, { useContext, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppContext } from './context/AppContext';

import Header from './components/Header';
import UploadPage from './pages/UploadPage';
import PreferencesPage from './pages/PreferencesPage';
import ReviewPage from './pages/ReviewPage';
import BottomAudioBar from './components/BottomAudioBar';

const App: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    return <div>Loading...</div>;
  }
  const { theme, currentPlaying } = context;

  // Effect to apply the theme class to the html element
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={`min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300 flex flex-col ${currentPlaying ? 'pb-28' : ''}`}>
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="/review" element={<ReviewPage />} />
        </Routes>
      </main>
      {currentPlaying && <BottomAudioBar />}
    </div>
  );
};

export default App;
