import './notes.scss'

function Notes() {
    return (
        <div className="touch-ui-panel-item">
            <div className={`notes-container`}>
                POST-IT
                <div className="notes-image-container">
                    <img src="/TestNote.png" />
                </div>
            </div>
        </div>
    );
}

export default Notes