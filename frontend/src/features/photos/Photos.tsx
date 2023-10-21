import axios from 'axios';
import { useEffect, useState } from 'react';
import './photos.css';
import constants from '../../constants';
import { url } from 'inspector';


function Photos(props) {

  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const handler = setInterval(() => {

      axios
        .get(`http://johannes-mb.wnet.wn:3020/db/randomUrl`)
        .then(data => {
          setImageUrl(data.data?.url)
        })
        .catch(err => {
          console.warn('Failed to fetch image url from photos server.', err);
        });
      
    }, constants.photos.refreshInterval ?? 5000);

    return () => clearInterval(handler);
  }, [imageUrl]);

  return (<div className="photo-container">        
    <div className='background' style={{ backgroundImage: `url(${imageUrl})`}}/>
    <div className='photo' style={{ backgroundImage: `url(${imageUrl})`}}/>
    <div className='photo-meta'></div>

  </div>);
}

export default Photos;