import { useEffect, useRef, useState } from "react"
import ToggleButton from "./generic/toggleButton"

declare const browser: typeof chrome;

function SettingsToggle({text, storage}: {text: string, storage: string}): React.JSX.Element {
    const [value, _setValue] = useState(false)

    useEffect(() => {
        (chrome || browser).storage.local.get([storage]).then((result) => {
            _setValue(result[storage])
        })
    })

    function setValue(newValue: boolean) {
        _setValue(newValue);
        (chrome || browser).storage.local.set({[storage]: newValue})
    }

    return <div className="setting-row">
            <span className="setting-name">{text}</span>
            <ToggleButton value={value} setValue={setValue}></ToggleButton>
        </div>
}

export default function SettingsButton(): React.JSX.Element {
    const [settingsOpen, setSettingsOpen] = useState(false)

    const settingsDialogRef = useRef<HTMLDialogElement>(null)

    //update dialog
    useEffect(() => {
        if (settingsOpen) {
            settingsDialogRef.current?.showModal()
        } else {
            settingsDialogRef.current?.close()
        }
    }, [settingsOpen])

    //exit when click outside
    useEffect(() => {
        const mouseUpListener = (e: MouseEvent) => {
            if (!settingsDialogRef.current?.contains(e.target as HTMLElement)) {
                setSettingsOpen(false)
            }
        }

        document.addEventListener("mouseup", mouseUpListener)
        
        return () => {
            document.removeEventListener("mouseup", mouseUpListener)
        }
    })

    return <>
        {/*Settings button*/}
        <button className="left-top-button icon-button" title="Settings" onClick={() => {setSettingsOpen(true)}}>
            <span className="material-symbols-outlined">settings</span>
        </button>

        {/*Settings menu*/}
        <dialog style={settingsOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={settingsDialogRef} onCancel={() => {setSettingsOpen(false)}}>
            {/*Title and exit button*/}
            <div className="dialog-top">
                <span className="dialog-title roboto-700" style={{margin:0}}>Settings</span>
                <button style={{height: "3em"}} className="exit-button icon-button" onClick={() => {setSettingsOpen(false)}}>
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            
            {/*Actual settings*/}
            <SettingsToggle text={"Make RoAvatar default avatar editor"} storage="s-default"/>
        </dialog>
    </>
}