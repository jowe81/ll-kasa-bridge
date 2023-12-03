import { getDynformsServiceRecords } from "../../../dynformsHelpers";
import constants from "../../../constants.ts";
import './scripture.css';

function Scripture() {
    const records = getDynformsServiceRecords(constants.scripture.scripturesServiceChannel);
    
    const record = Array.isArray(records) && records.length ? records[0] : null;

    let jsx;
    
    if (record) {
      const { text, reference, translation } = record;

      // Adjust the font size if needed.
      let fontSizePx = 15;

      if (text.length < 200) {
        fontSizePx = 17;
      }

      if (text.length > 300) {
        fontSizePx = 13;
      }

      if (text.length > 400) {
        fontSizePx = 12;
      }

      const style = {
        fontSize: fontSizePx + 'px',
      }

      jsx = (
          <div className="scripture-container">
              {/* <div className="scripture-header">Verse of the Day</div> */}
              <div className="scripture-text" style={style}>{ record.text }</div>
              <div className="scripture-reference">{ record.reference } ({record.translation.toUpperCase()})</div>
          </div>
      );
    }

    return jsx;
}

export default Scripture;
