export default function UndoRedo({undo,redo,canUndo,canRedo}: {undo: () => void, redo: () => void, canUndo: boolean, canRedo: boolean}): React.JSX.Element {
    return <div className="undo-redo">
        <button className={`history-button undo${canUndo ? "" : " history-button-inactive"}`} onClick={undo}><span className="material-symbols-outlined">undo</span></button>
        <button className={`history-button redo${canRedo ? "" : " history-button-inactive"}`} onClick={redo}><span className="material-symbols-outlined">redo</span></button>
    </div>
}