import { useEffect } from "react"

export default function UndoRedo({undo,redo,canUndo,canRedo}: {undo: () => void, redo: () => void, canUndo: boolean, canRedo: boolean}): React.JSX.Element {
    useEffect(() => {
        const keyDownListener = (e: KeyboardEvent) => {
            if (e.ctrlKey && !e.shiftKey) {
                if (e.key === "z") {
                    undo()
                } else if (e.key === "y") {
                    redo()
                }
            } else if (e.ctrlKey && e.shiftKey) {
                if (e.key === "Z") {
                    redo()
                }
            }
        }

        document.addEventListener("keydown", keyDownListener)
        
        return () => {
            document.removeEventListener("keydown", keyDownListener)
        }
    })
    
    return <div className="undo-redo">
        <button title="Undo" className={`history-button undo${canUndo ? "" : " history-button-inactive"}`} onClick={undo}>
            <span className="material-symbols-outlined">undo</span>
        </button>
        <button title="Redo" className={`history-button redo${canRedo ? "" : " history-button-inactive"}`} onClick={redo}>
            <span className="material-symbols-outlined">redo</span>
        </button>
    </div>
}