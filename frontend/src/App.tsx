import React from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import AudioPlayer from './components/AudioPlayer';

const App: React.FC = () => {
  const manifestUri = 'https://videotranscodeprod.s3.ap-south-1.amazonaws.com/audios/t_eaab2e5b95aa4681bb4875de74bf97f1.c949e0e6531af568e4574db6141fec9ad379c0705f04f82d0433e968235520d8/master.mpd';
  const captionUri  = 'https://videotranscodeprod.s3.ap-south-1.amazonaws.com/audios/t_eaab2e5b95aa4681bb4875de74bf97f1.c949e0e6531af568e4574db6141fec9ad379c0705f04f82d0433e968235520d8/caption.json';
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