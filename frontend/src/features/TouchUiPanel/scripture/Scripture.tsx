import { ReactNode } from "react";
import { getDynformsServiceRecords } from "../../../dynformsHelpers";
import constants from "../../../constants.ts";
import './scripture.css';
import { text } from "node:stream/consumers";
import { inflate } from "node:zlib";

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
                          {processRawText(record.text)}
                      </div>
                  </div>
                  <div className="scripture-bottom">
                      <div className="scripture-user">
                          {addedJsx && addedJsx}
                      </div>
                      <div className="scripture-reference">
                          {reference} ({translation.toUpperCase()}
                          )
                      </div>
                  </div>
              </div>
          </div>
      );
    }

    return jsx;
}

function processRawText(raw) {
  // Split on anything that indicates a break: .,;
  let lines = raw.trim().split(/(\r|\r\n|\n|\, |\. |\; )/);

  let newLines: any = []; //This should be an array of ReactNodes but TS complains...
  
  lines.forEach((line: string, index) => {
    // Get rid of annotations that may have been in copied text, such as: [a]
    line = removeExtra(line);

    const verseNo = getVerseNoFromLine(line);
    const lineText = getTextFromLine(line);
    
    let jsxLine: ReactNode;

    if (verseNo) {
      jsxLine = (
          <>
              <sup className="scripture-text-verse-number">{verseNo}</sup>
              <span className="">{lineText}</span>
          </>
      );
    } else {
      jsxLine = (
          <>
              <span className="">{lineText}</span>
          </>
      );
    }

    newLines.push(jsxLine);
  })
  
  return [].concat(newLines);
}


function removeExtra(line) {
  // Get rid of anything in square brackets
  line = line.replace(/\[.*?\]/g, '');

  return line;
}

// Returns a number if the line starts with one.
function getVerseNoFromLine(line) {
  const words = line.split(' ');
  if (words[0] > 0) {
    return words[0];
  }
  
  return null;
}

function getTextFromLine(line) {
  const words = line.split(' ');
  const startIndex = (words && words[0] > 0) ? 1 : 0;

  return words.slice(startIndex).join(' ');

}


export default Scripture;
