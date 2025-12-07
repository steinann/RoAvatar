import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { API, Authentication } from './code/api'
import { AuthContext } from './react/context/auth-context'
import { Outfit } from './code/avatar/outfit'
import { OutfitContext } from './react/context/outfit-context'
import AvatarPreview from './react/avatarPreview'
import BarCategory from './react/barCategory'
import ItemCategory from './react/itemCategory'
//import SubCategory from './react/subCategory'
import { CategoryDictionary, SortInfo } from './code/avatar/sorts'
import SaveButton from './react/saveButton'
import UndoRedo from './react/undoRedo'
import SpecialCategory from './react/specialCategory'
import { AvatarType } from './code/avatar/constant'
import ItemCard from './react/itemCard'
import { ItemInfo } from './code/avatar/asset'
import { arrayBufferToBase64, base64ToArrayBuffer } from './code/misc/misc'
import AvatarAdjustment from './react/avatarAdjustment'
//import { arrayBufferToBase64 } from './code/misc/misc'
//import Test_AvatarPreview from './react/test-avatarPreview'

const outfitHistory: Outfit[] = []

function App() {
  const [auth, setAuth] = useState<Authentication | undefined>(undefined)
  const [outfit, _setOutfit] = useState<Outfit>(new Outfit())
  const [currentAnimName, _setCurrentAnimName] = useState<string>("idle.Animation1")

  const [canUndo, setCanUndo] = useState<boolean>(false)
  const [canRedo, setCanRedo] = useState<boolean>(false)
  const [historyIndex, setHistoryIndex] = useState<number>(-1)

  const [categorySource, _setCategorySource] = useState<string>("Inventory")
  const [categoryType, _setCategoryType] = useState<string>("Recent") //Recent
  const [subCategoryType, _setSubCategoryType] = useState<string>("All") //All

  function undo() {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      _setOutfit(outfitHistory[historyIndex - 1])

      setCanUndo(historyIndex - 1 > 0)
      setCanRedo(historyIndex - 1 < outfitHistory.length - 1)
    }
    //console.log(outfitHistory, outfitHistoryIndex)
    
  }

  function redo() {
    if (historyIndex < outfitHistory.length - 1) {
      setHistoryIndex(historyIndex + 1)
      _setOutfit(outfitHistory[historyIndex + 1])

      setCanUndo(historyIndex + 1 > 0)
      setCanRedo(historyIndex + 1 < outfitHistory.length - 1)
    }
    //console.log(outfitHistory, outfitHistoryIndex)
  }

  const setOutfit = useCallback((newOutfit: Outfit) => {
    window.outfit = newOutfit

    //if (!auth) return
    /*const outfitBuffer = newOutfit.toBuffer()
    new Outfit().fromBuffer(outfitBuffer, auth).then((fromBufferOutfit) => {
      console.log(outfitBuffer)
      console.log(arrayBufferToBase64(outfitBuffer))
      console.log(newOutfit)
      console.log(fromBufferOutfit)
      console.log("compare them!")
    })*/

    if (outfitHistory.length > historyIndex + 1) {
      outfitHistory.splice(historyIndex + 1)
    }

    outfitHistory.push(newOutfit)
    setHistoryIndex(historyIndex + 1)
    
    _setOutfit(newOutfit)
    setCanUndo(historyIndex + 1 > 0)
    setCanRedo(historyIndex + 1 < outfitHistory.length - 1)
    //console.log(outfitHistory, outfitHistoryIndex)
    console.log(newOutfit.toBuffer())
  }, [historyIndex])

  window.setOutfit = setOutfit

  function setCurrentAnimName(name: string) {
    //switch to compatible animation if avatar is r6
    if (outfit.playerAvatarType === AvatarType.R6 && name === "swim.Swim") {
      name = "walk.WalkAnim"
    } else if (outfit.playerAvatarType === AvatarType.R6 && name === "jump.JumpAnim") {
      name = "fall.FallAnim"
    } else if (outfit.playerAvatarType === AvatarType.R6 && name.startsWith("emote.")) {
      const emoteId = Number(name.split(".")[1])
      const danceName = `dance${emoteId % 3 + 1}.2`
      name = danceName
    }

    _setCurrentAnimName(name)
  }

  function setCategorySource(categorySource: string) {
    _setCategorySource(categorySource)
    setCategoryType("Recent")
  }

  function setCategoryType(categoryType: string) {
    _setCategoryType(categoryType)
    const firstSubCategory = Object.keys(CategoryDictionary[categorySource][categoryType])[0]
    setSubCategoryType(firstSubCategory)
  }

  function setSubCategoryType(newSubCategoryType: string) {
    if (newSubCategoryType === subCategoryType) {
      return
    }

    _setSubCategoryType(newSubCategoryType)
    switch (newSubCategoryType) {
      case "Idle": 
        setCurrentAnimName("idle.Animation1")
        break
      case "Walk":
        setCurrentAnimName("walk.WalkAnim")
        break
      case "Run":
        setCurrentAnimName("run.RunAnim")
        break
      case "Fall":
        setCurrentAnimName("fall.FallAnim")
        break
      case "Jump":
        setCurrentAnimName("jump.JumpAnim")
        break
      case "Swim":
        setCurrentAnimName("swim.Swim")
        break
      case "Climb":
        setCurrentAnimName("climb.ClimbAnim")
        break
      default:
        setCurrentAnimName("idle.Animation1")
        break
    }
  }

  useEffect(() => {
    if (!auth) {
      const newAuth = new Authentication()

      newAuth.fill().then(() => {
        setAuth(newAuth)
        window.saveOutfit = (a: Outfit) => {
          API.Avatar.SaveOutfit(newAuth, a)
        }
      })
    }

    if (!outfit) {
      setOutfit(new Outfit())
    }
  }, [auth, outfit, setOutfit])

  return (
    <>
      <AuthContext value={auth}>
        <OutfitContext value={outfit}>
          <div className='main'>
            <div className='main-left division-down'>
              <BarCategory className="background-transparent bar-double-margin"></BarCategory>
              <AvatarPreview setOutfit={setOutfit} animName={currentAnimName}>
                <AvatarAdjustment setOutfit={setOutfit} _setOutfit={_setOutfit}/>
              </AvatarPreview>
              <div className="save-and-history">
                <SaveButton historyIndex={historyIndex} historyLength={outfitHistory.length}/>
                <UndoRedo undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}/>
              </div>
              <div className='worn-items dark-scrollbar'>
                {outfit.assets.map(asset => {
                  return <ItemCard auth={auth} key={asset.id} className='worn-list-item' includeName={false} itemInfo={new ItemInfo("Asset", asset.assetType.name, asset.id, asset.name)} onClick={() => {
                    const newOutfit = outfit.clone()
                    newOutfit.removeAsset(asset.id)
                    setOutfit(newOutfit)
                  }}/>
                })}
              </div>
              {/*<Test_AvatarPreview/>*/}
            </div>
            <div className='main-right division-down'>
              <BarCategory className="align-center" source={CategoryDictionary} currentCategory={categorySource} setCurrentCategory={setCategorySource}/>
              <BarCategory className='width-fill-available' source={CategoryDictionary[categorySource]} currentCategory={categoryType} setCurrentCategory={setCategoryType}/>
              <BarCategory className='width-fill-available' source={CategoryDictionary[categorySource][categoryType]} currentCategory={subCategoryType} setCurrentCategory={setSubCategoryType}/>
              {/*<SubCategory currentCategory={categoryType} currentSubCategory={subCategoryType} setSubCategory={setSubCategoryType}/>*/}
              {CategoryDictionary[categorySource][categoryType][subCategoryType] instanceof SortInfo ?
              (<ItemCategory categoryType={categoryType} subCategoryType={subCategoryType} setOutfit={setOutfit} setAnimName={setCurrentAnimName}>

              </ItemCategory>)
              :
              <SpecialCategory categoryType={categoryType} subCategoryType={subCategoryType} setOutfit={setOutfit} setAnimName={setCurrentAnimName} _setOutfit={_setOutfit}/>
              }
            </div>
          </div>
        </OutfitContext>
      </AuthContext>
    </>
  )
}

declare global {
    interface Window {
        outfit: Outfit;
        setOutfit: (a: Outfit) => void;
        arrayBufferToBase64: (a: ArrayBuffer) => string;
        base64ToArrayBuffer: (a: string) => ArrayBuffer;
        saveOutfit: (a: Outfit) => void;
    }
}

window.arrayBufferToBase64 = arrayBufferToBase64
window.base64ToArrayBuffer = base64ToArrayBuffer

export default App
