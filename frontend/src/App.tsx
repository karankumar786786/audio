import React from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import AudioPlayer from './components/AudioPlayer';

const App: React.FC = () => {
  const manifestUri = 'https://videotranscodeprod.s3.ap-south-1.amazonaws.com/audios/t_715fab027f6f454f8040eb1933889e5d.f3381497a432f366c092ed1be3d21efc65cd9e742806c1af3fed35abf33d5c92/master.mpd';
  const captionUri  = 'https://videotranscodeprod.s3.ap-south-1.amazonaws.com/audios/t_715fab027f6f454f8040eb1933889e5d.f3381497a432f366c092ed1be3d21efc65cd9e742806c1af3fed35abf33d5c92/caption.json';
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