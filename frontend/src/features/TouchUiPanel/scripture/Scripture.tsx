import { ReactNode } from "react";
import { getFirstDynformsServiceRecord } from "../../../dynformsHelpers";
import constants from "../../../constants.ts";
import './scripture.css';

function Scripture({renderForMainViewingArea}) {
    const record = getFirstDynformsServiceRecord(constants.scripture?.serviceChannel);

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
      let fontSizePx = renderForMainViewingArea ? 40 : 19;

      if (text.length < 200) {
        fontSizePx = renderForMainViewingArea ? 50 : 24;
      }

      if (text.length > 300) {
        fontSizePx = renderForMainViewingArea ? 32 : 20;
      }

      if (text.length > 400) {
        fontSizePx = renderForMainViewingArea ? 30 : 16;
      }

      const style = {
        fontSize: fontSizePx + 'px',
      }

      jsx = (
          <div className="scripture-outer-container">
              <div className={renderForMainViewingArea ? "large-scripture-container" : "scripture-container"}>
                  {/* <div className="scripture-header">Verse of the Day</div> */}
                  <div
                      className={
                          renderForMainViewingArea ? "large-scripture-text-container" : "scripture-text-container"
                      }
                  >
                      <div
                          className={renderForMainViewingArea ? "large-scripture-text" : "scripture-text"}
                          style={style}
                      >
                          {processRawText(record.text, renderForMainViewingArea)}
                      </div>
                  </div>
                  <div className={renderForMainViewingArea ? "large-scripture-bottom" : "scripture-bottom"}>
                      <div className={renderForMainViewingArea ? "large-scripture-user" : "scripture-user"}>
                          {addedJsx && addedJsx}
                      </div>
                      <div className="scripture-reference">
                          {reference} ({translation.toUpperCase()})
                      </div>
                  </div>
              </div>
          </div>
      );
    }

    return jsx;
}

function processRawText(raw, renderForMainViewingArea) {
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
          <span key={index}>
              <sup className={renderForMainViewingArea ? "large-scripture-text-verse-number" : "scripture-text-verse-number"}>{verseNo}</sup>
              <span className="">{lineText}</span>
          </span>
      );
    } else {
      jsxLine = (
          <span key={index}>
              <span className="">{lineText}</span>
          </span>
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
