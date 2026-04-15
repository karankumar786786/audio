import React from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import AudioPlayer from './components/AudioPlayer';

const App: React.FC = () => {
  const manifestUri = 'https://videotranscodeprod.s3.ap-south-1.amazonaws.com/audios/t_d94a3abea90c4815ae15076fa405da58.f838bd915aa7f1ccf4067991bb28b438fad5912a4801fb7d9a643bf6dff62081/master.mpd';
  const captionUri  = 'https://videotranscodeprod.s3.ap-south-1.amazonaws.com/audios/t_d94a3abea90c4815ae15076fa405da58.f838bd915aa7f1ccf4067991bb28b438fad5912a4801fb7d9a643bf6dff62081/caption.vtt';
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