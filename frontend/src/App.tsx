import React from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import AudioPlayer from './components/AudioPlayer';

const App: React.FC = () => {
  const manifestUri = 'https://videotranscodeprod.s3.ap-south-1.amazonaws.com/audios/t_d6fe682ed8214450b4300c754d2941d3.1409d1ad6d64b944f31142aca6c485e7b03a2c63693d85af4c2056f0066ba89f/master.mpd';
  const captionUri  = 'https://videotranscodeprod.s3.ap-south-1.amazonaws.com/audios/t_d6fe682ed8214450b4300c754d2941d3.1409d1ad6d64b944f31142aca6c485e7b03a2c63693d85af4c2056f0066ba89f/caption.json';
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