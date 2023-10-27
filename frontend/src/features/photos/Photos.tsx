import axios from 'axios';
import { useEffect, useState } from 'react';
import './photos.css';
import constants from '../../constants';

function Photos() {

  const [imageUrl, setImageUrl] = useState<string>('');
  const [meta, setMeta] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [remaining, setRemaining] = useState<number>(0);

  const nextBtnClick = () => {
    refreshPicture()
  }

  const refreshPicture = () => {
    axios
    .get(constants.photos.url)
    .then(data => {
      console.log(data);
      const photoRecord = data.data;
      setImageUrl(photoRecord?.url)
      setMeta(photoRecord?.description);
    })
    .catch(err => {
      console.warn('Failed to fetch image url from photos server.', err);
    });
  }

  useEffect(() => {
    if (!imageUrl) { 
      // Initial load.
      refreshPicture();
      setStartTime(Date.now())
    }

    const handler = setInterval(() => {
        if (Date.now() - startTime > constants.photos.refreshInterval) {
          setStartTime(Date.now());
          refreshPicture()
        }

        setRemaining(Math.abs(Date.now() - (startTime + constants.photos.refreshInterval)));
      },
      1000
    );

    return () => clearInterval(handler);
  }, [remaining, imageUrl]);

  return (<div className="photo-container">        
    <div className='background' style={{ backgroundImage: `url(${imageUrl})`}}/>
    <div className='photo' style={{ backgroundImage: `url(${imageUrl})`}}/>
    <div className='photo-meta'>
      <div>{meta}</div>      
      <div className='photos-time-controls'>
        <div className='photos-remaining-time'>
          {millisecondsToHMS(remaining)}
        </div>
        <div>
          <button onClick={nextBtnClick}>Skip</button>
        </div>
      </div>
    </div>
  </div>);
}

// ChatGPT
function millisecondsToHMS(milliseconds) {
  // Calculate hours, minutes, and seconds
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  // Format the time components with leading zeros if necessary
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

export default Photos;