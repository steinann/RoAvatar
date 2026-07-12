import { useEffect, useState } from "react";
import Icon from "./generic/icon";
import { API, LocalOutfit, type RoAvatarBrowser } from "roavatar-renderer";
import { getSetting, setSetting } from "./generic/settings";

export default function ReviewReminder(): React.JSX.Element {
    const [shouldShow, setShouldShow] = useState(false)

    const browser: RoAvatarBrowser = API.Generic.GetBrowser()

    useEffect(() => {
        API.LocalOutfit.GetLocalOutfits().then((localOutfits: LocalOutfit[]) => {
            if (localOutfits.length > 1) {
                getSetting("shown-review-reminder", false).then((hasShownAlready) => {
                    if (!hasShownAlready) {
                        if (browser === "Chrome" || browser === "Dev" || browser === "Edge") {
                            setSetting("shown-review-reminder", true)
                            setShouldShow(true)
                        }
                    }
                })
            }
        })
    })

    function close() {
        setShouldShow(false)
    }

    const extensionURL = browser === "Chrome" ? 
    "https://chromewebstore.google.com/detail/RoAvatar%20-%20Roblox%20Avatar%20Editor%20Improved/ifjleokejkklabhcfhppncfdbkmakhdp" :
    "https://microsoftedge.microsoft.com/addons/detail/roavatar-roblox-avatar-/mienanddicehclnklbnhjefcoimifipd"

    let body = <></>
    switch (browser) {
        case "Chrome":
        case "Edge":
            body = <>
                <span>Help us by giving a </span>
                <a href={extensionURL} target="_blank">review</a>
                <span> or reporting issues on </span>
                <a href="https://github.com/steinann/RoAvatar/issues" target="_blank">GitHub</a>
                <span>!</span>
                <br></br>
            </>
            break
        case "Dev":
            body = <>
                <span>Help us by giving a star or reporting issues on </span>
                <a href="https://github.com/steinann/RoAvatar" target="_blank">GitHub</a>
                <span>!</span>
                <br></br>
            </>
            break
    }

    return shouldShow ? <div className="corner-dialog">
            <div className="corner-dialog-top roboto-700">
                <span>Enjoying RoAvatar?</span>
                <button className="exit-button icon-button" style={{height: "3em"}} onClick={close}><Icon>close</Icon></button>
            </div>
            <div className="dialog-line"></div>
            <div className="corner-dialog-body roboto-400">
                {body}
            </div>
            <div className="dialog-line"></div>
        </div> : <></>
}