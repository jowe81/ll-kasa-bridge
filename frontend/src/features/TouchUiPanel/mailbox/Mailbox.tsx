import { socket } from '../../websockets/socket';
import constants from '../../../constants';
import { getDeviceByChannel } from '../../../devicesHelpers';
import './mailbox.css'

function Mailbox() {

  const handleClick = (e) => {
      const channel = constants.touchPanel.mailboxChannel;
      if (channel) {
          socket.emit("auto/command/macro", {
              targetType: "channel",
              targetId: parseInt(channel),
              macroName: "toggleChannel",
          });
      }
  };

  const mailbox = getDeviceByChannel(constants.touchPanel?.mailboxChannel);

  const imageContainerClassName = mailbox?.powerState
      ? "mailbox-image-container"
      : "mailbox-image-container mailbox-desaturate";
  const mailboxImageClassName = mailbox?.powerState
      ? "mailbox-image"
      : "mailbox-image mailbox-desaturate";

  return (
      <div className="touch-ui-panel-item">
          <div className="touch-ui-panel-mailbox">
              <div className="mailbox-label">Mailbox</div>
              <div className={imageContainerClassName} onClick={handleClick}>
                  <img
                      className={mailboxImageClassName}
                      src="icons/mailbox-large.png"
                  />
              </div>
          </div>
      </div>
  );
}


export default Mailbox