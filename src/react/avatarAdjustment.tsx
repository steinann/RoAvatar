import { useEffect, useRef, useState } from "react";
import { AccessoryAdjustment, type AdjustType } from "./accessoryAdjustment";
import OrderAdjustment from "./orderAdjustment";
import Icon from "./generic/icon";
import ThumbnailAdjustment from "./thumbnailAdjustment";
import { cleanString } from "roavatar-renderer";
import { Tooltip } from "react-tooltip";

type ButtonType = "adjust" | "order" | "thumbnail"

function MenuIcon({title, open, buttonOpen, type, icon, toggleButton}: {title: string, open: boolean, buttonOpen: boolean, type: ButtonType, icon: string, toggleButton: (a: ButtonType) => void}): React.JSX.Element {
    return <>
        <button
            /*title={title}*/
            data-tooltip-id={"adjust-" + cleanString(title)}
            data-tooltip-content={title}
            className={`menu-icon menu-adjust${open ? " menu-icon-active" : ""}${buttonOpen && !open ? " menu-icon-inactive":""}`}
            onClick={() => {toggleButton(type)}}>
            <Icon>{icon}</Icon>
        </button>
        <Tooltip id={"adjust-" + cleanString(title)}/>
    </>
}

export function AvatarAdjustment(): React.JSX.Element {
    const [open, setOpen] = useState(false)
    const [buttonOpen, setButtonOpen] = useState(false)
    const [currentButton, setCurrentButton] = useState<ButtonType>("adjust")

    const [adjustType, setAdjustType] = useState<AdjustType>("position")

    const menuRef = useRef<HTMLUListElement>(null)

    function toggleButton(type: ButtonType) {
        if (currentButton === type && buttonOpen) {
            setButtonOpen(false)
        } else {
            setButtonOpen(true)
            setCurrentButton(type)
        }
    }

    //close when click outside preview
    useEffect(() => {
        const menuElement = menuRef.current

        const mouseUpListener = (e: MouseEvent) => {
            if (menuElement && !menuElement.contains(e.target as HTMLElement) && !buttonOpen) {
                setOpen(false)
            }
        }

        document.addEventListener("mouseup", mouseUpListener)
        
        return () => {
            document.removeEventListener("mouseup", mouseUpListener)
        }
    })

    const adjustOpen = buttonOpen && currentButton === "adjust"
    const orderOpen = buttonOpen && currentButton === "order"
    const thumbnailOpen = buttonOpen && currentButton === "thumbnail"

    return <>
        <ul ref={menuRef} className='menu-icons'>
            {/*Hamburger menu*/}
            <ul className='inner-menu-icons first-menu-icons'>
                <button data-tooltip-id={"adjust-menu"}
                    data-tooltip-content={open ? "Close Menu" : "Open Menu"}
                    className={`menu-icon menu-open${buttonOpen ? " menu-icon-inactive":""}`}
                    onClick={() => {setOpen(!open)}}>
                    <Icon>{open ? "close" : "menu"}</Icon>
                </button>
                <Tooltip id="adjust-menu"/>
                <ul className={`small-menu-icons${open ? "" : " icons-collapsed"}`}>
                    <MenuIcon title="Accessory Adjustment" type="adjust" icon="eyeglasses_2" open={adjustOpen} buttonOpen={buttonOpen} toggleButton={toggleButton}/>
                    <MenuIcon title="Layered Clothing Order" type="order" icon="apparel" open={orderOpen} buttonOpen={buttonOpen} toggleButton={toggleButton}/>
                    <MenuIcon title="Profile Picture" type="thumbnail" icon="account_circle" open={thumbnailOpen} buttonOpen={buttonOpen} toggleButton={toggleButton}/>
                </ul>
            </ul>
            {/*Accessory adjustment buttons*/}
            <ul className={`inner-menu-icons adjust-menu-icons${adjustOpen ? "" : " icons-collapsed"}`}>
                <button title="Move" className={`menu-icon menu-adjust-move${adjustType === "position" ? " menu-icon-active" : ""}`} onClick={() => {setAdjustType("position")}}><Icon>drag_pan</Icon></button>
                <button title="Rotate" className={`menu-icon menu-adjust-rotate${adjustType === "rotation" ? " menu-icon-active" : ""}`} onClick={() => {setAdjustType("rotation")}}><Icon>autorenew</Icon></button>
                <button title="Scale" className={`menu-icon menu-adjust-scale${adjustType === "scale" ? " menu-icon-active" : ""}`} onClick={() => {setAdjustType("scale")}}><Icon>expand_content</Icon></button>
            </ul>
        </ul>

        {/*Adjustment menus*/}
        <AccessoryAdjustment isOpen={adjustOpen} adjustType={adjustType}/>
        <OrderAdjustment isOpen={orderOpen}/>
        <ThumbnailAdjustment isOpen={thumbnailOpen}/>
    </>
}