import React from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import AudioPlayer from './components/AudioPlayer';

const App: React.FC = () => {
  const manifestUri = 'https://videotranscodetemp.s3.ap-south-1.amazonaws.com/audios/Main_Agar_Saamne/master.mpd';
  const captionUri  = 'https://videotranscodetemp.s3.ap-south-1.amazonaws.com/audios/Main_Agar_Saamne/caption.json';
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