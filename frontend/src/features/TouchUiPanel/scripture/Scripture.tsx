import { getDynformsServiceRecords } from "../../../dynformsHelpers";
import constants from "../../../constants.ts";
import './scripture.css';

function Scripture() {
    const records = getDynformsServiceRecords(constants.scripture.scripturesServiceChannel);
    
    const record = Array.isArray(records) && records.length ? records[0] : null;

    if (!record) {
      return;
    }

    let addedJsx;

    // See about adding user info
    if (record.__user?.name && record.created_at) {
      const options: any = {
        month: "short",
        day: "numeric",
        year: "numeric",
      };
      const addedAt = new Date(record.created_at).toLocaleDateString("en-CA", options);
      const addedBy = <>by <span className="scripture-user-name">{record.__user?.name}</span></>

      addedJsx = <>Added { addedAt } {addedBy}</>
    }

    let jsx;
    
    if (record) {
      const { text, reference, translation } = record;

      // Adjust the font size if needed.
      let fontSizePx = 16;

      if (text.length < 200) {
        fontSizePx = 18;
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
          <div className="touch-ui-panel-item">
              <div className="scripture-container">
                  {/* <div className="scripture-header">Verse of the Day</div> */}
                  <div className="scripture-text-container">
                      <div className="scripture-text" style={style}>
                          {record.text}
                      </div>
                  </div>
                  <div className="scripture-bottom">
                      <div className="scripture-user">
                          {addedJsx && addedJsx}
                      </div>
                      <div className="scripture-reference">
                          {record.reference} ({record.translation.toUpperCase()}
                          )
                      </div>
                  </div>
              </div>
          </div>
      );
    }

    return jsx;
}

export default Scripture;
