import React from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import AudioPlayer from './components/AudioPlayer';

const App: React.FC = () => {
  const manifestUri = 'https://videotranscodeprod.s3.ap-south-1.amazonaws.com/audios/Guru+Randhawa+-+SIRRA+(+Official+Video+)/master.mpd';
  const captionUri  = 'https://videotranscodeprod.s3.ap-south-1.amazonaws.com/audios/Guru+Randhawa+-+SIRRA+(+Official+Video+)/caption.json';
  const posterUrl   = 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2070&auto=format&fit=crop';

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <div className="content-wrapper">
          <AudioPlayer
            src={manifestUri}
            captionUri={captionUri}
            poster={posterUrl}
            title="Main Agar Saamne"
            artist="Bollywood Classic"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;