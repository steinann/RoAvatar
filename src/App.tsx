import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { API, Authentication } from './code/api'
import { AuthContext } from './react/context/auth-context'
import { Outfit } from './code/avatar/outfit'
import { OutfitContext } from './react/context/outfit-context'
import AvatarPreview from './react/avatarPreview'
import BarCategory from './react/barCategory'
import ItemCategory from './react/itemCategory'
//import SubCategory from './react/subCategory'
import { CategoryDictionary, SortInfo, SpecialInfo } from './code/avatar/sorts'
import SaveButton from './react/saveButton'
import UndoRedo from './react/undoRedo'
import SpecialCategory from './react/specialCategory'
import { AvatarType } from './code/avatar/constant'
import ItemCard from './react/itemCard'
import { ItemInfo } from './code/avatar/asset'
import { arrayBufferToBase64, base64ToArrayBuffer } from './code/misc/misc'
import AvatarAdjustment from './react/avatarAdjustment'
import { type NavigationMenuItems, type Search_Payload } from './code/api-constant'
import MarketplaceCategory from './react/marketplaceCategory'
//import { arrayBufferToBase64 } from './code/misc/misc'
//import Test_AvatarPreview from './react/test-avatarPreview'

const outfitHistory: Outfit[] = []

function App() {
  const [auth, setAuth] = useState<Authentication | undefined>(undefined)
  const [outfit, _setOutfit] = useState<Outfit>(new Outfit())
  const [navigationMenuItems, setNavigationMenuItems] = useState<NavigationMenuItems | undefined>(undefined)

  const [currentAnimName, _setCurrentAnimName] = useState<string>("idle.Animation1")

  const [canUndo, setCanUndo] = useState<boolean>(false)
  const [canRedo, setCanRedo] = useState<boolean>(false)
  const [historyIndex, setHistoryIndex] = useState<number>(-1)

  const [categorySource, _setCategorySource] = useState<string>("Inventory")
  const [categoryType, _setCategoryType] = useState<string>("Recent") //Recent
  const [subCategoryType, _setSubCategoryType] = useState<string | undefined>("All") //All
  const [searchData, setSearchData] = useState<Search_Payload>({taxonomy: "", salesTypeFilter: 1})
  const [searchKeyword, setSearchKeyword] = useState<string | undefined>(undefined)
  const [tempSearchKeyword, setTempSearchKeyword] = useState<string>("")

  const [alertText, setAlertText] = useState<string>("")
  const [alertEnabled, setAlertEnabled] = useState<boolean>(false)

  const searchRef = useRef<HTMLInputElement>(null)

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
    if (categorySource === "Inventory") {
      setCategoryType("Recent", categorySource)
    } else {
      setCategoryType("All", categorySource)
    }
  }

  function setCategoryType(categoryType: string, newCategorySource?: string) {
    const realCategorySource = newCategorySource || categorySource

    _setCategoryType(categoryType)
    if (realCategorySource === "Inventory") {
      const firstSubCategory = Object.keys(CategoryDictionary[realCategorySource][categoryType])[0]
      setSubCategoryType(firstSubCategory)
    } else {
      setSubCategoryType(undefined)
    }
    
  }

  function setSubCategoryType(newSubCategoryType: string | undefined) {
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

    if (auth && !navigationMenuItems) {
      API.Catalog.GetNavigationMenuItems(auth).then((result) => {
        if (result instanceof Response) {
          setAlertEnabled(true)
          setAlertText("Failed to load Marketplace")
        } else {
          setNavigationMenuItems(result)

          const marketplaceSource: {[k in string]: {[k in string]: SpecialInfo}} = {}

          for (const category of result.categories) {
            const categoryData: {[k in string]: SpecialInfo} = {}
            for (const subCategory of category.subcategories) {
              categoryData[subCategory.name] = new SpecialInfo("Marketplace")
            }
            marketplaceSource[category.name] = categoryData
          }

          CategoryDictionary.Marketplace = marketplaceSource
        }
      })
    }
  }, [auth, outfit, setOutfit, navigationMenuItems])

  useEffect(() => {
    let marketplaceCategoryData: NavigationMenuItems["categories"][0] | undefined = undefined
    let marketplaceSubcategoryData: NavigationMenuItems["categories"][0]["subcategories"][0] | undefined = undefined

    if (navigationMenuItems) {
      for (const category of navigationMenuItems.categories) {
        if (category.name === categoryType) {
          marketplaceCategoryData = category

          for (const subCategory of category.subcategories) {
            if (subCategory.name === subCategoryType) {
              marketplaceSubcategoryData = subCategory
              break
            }
          }
          break
        }
      }
    }

    let taxonomy = ""
    if (marketplaceCategoryData) {
      taxonomy = marketplaceCategoryData.taxonomy
    }
    if (marketplaceSubcategoryData) {
      taxonomy = marketplaceSubcategoryData.taxonomy
    }
    const newSearchData: Search_Payload = {
      taxonomy: taxonomy,
      salesTypeFilter: 1,
      keyword: searchKeyword,
    }

    if (categoryType === "All" && !searchKeyword) {
      newSearchData.categoryFilter = 6
    }

    setSearchData(newSearchData)
  }, [navigationMenuItems, categorySource, categoryType, subCategoryType, searchKeyword])

  const taxonomy = searchData.taxonomy

  return (
    <>
      <AuthContext value={auth}>
        <OutfitContext value={outfit}>
          <div className='main'>
            <div id="alert" className={`errorAlert${alertEnabled ? " alertOn":""}`} onMouseEnter={() => {setAlertEnabled(false)}}>
              {alertText}
            </div>
            <div className='main-left division-down'>
              <BarCategory className="background-transparent bar-double-margin"></BarCategory>
              <AvatarPreview setOutfit={setOutfit} animName={currentAnimName}>
                <AvatarAdjustment setOutfit={setOutfit} _setOutfit={_setOutfit}/>
              </AvatarPreview>
              <div className="save-and-history">
                <SaveButton historyIndex={historyIndex} historyLength={outfitHistory.length} setAlertEnabled={setAlertEnabled} setAlertText={setAlertText}/>
                <UndoRedo undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}/>
              </div>
              <div className='worn-items dark-scrollbar'>
                {outfit.assets.map(asset => {
                  return <ItemCard auth={auth} key={asset.id} className='worn-list-item' showViewButton={true} includeName={false} itemInfo={new ItemInfo("Asset", asset.assetType.name, asset.id, asset.name)} onClick={() => {
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
              <BarCategory className='width-fill-available' source={CategoryDictionary[categorySource]} currentCategory={categoryType} setCurrentCategory={setCategoryType}>
                {categorySource === "Marketplace" ? 
                <form onChange={() => {
                  setTempSearchKeyword(searchRef.current?.value || "")
                }} onSubmit={(e) => {
                  e.preventDefault()

                  const newValue = searchRef.current?.value

                  setSearchKeyword(newValue && newValue.length > 0 ? newValue : undefined)
                }}>
                  <input value={tempSearchKeyword} ref={searchRef} className='marketplace-search' placeholder='Search'></input>
                </form>
                 : null}
              </BarCategory>
              <BarCategory className='width-fill-available' source={CategoryDictionary[categorySource][categoryType]} currentCategory={subCategoryType} setCurrentCategory={setSubCategoryType}/>
              {/*<SubCategory currentCategory={categoryType} currentSubCategory={subCategoryType} setSubCategory={setSubCategoryType}/>*/}
              {subCategoryType ? <>
                {CategoryDictionary[categorySource][categoryType][subCategoryType] instanceof SortInfo ?
                (<ItemCategory categoryType={categoryType} subCategoryType={subCategoryType} setOutfit={setOutfit} setAnimName={setCurrentAnimName} setAlertText={setAlertText} setAlertEnabled={setAlertEnabled}>

                </ItemCategory>)
                :
                <SpecialCategory specialInfo={CategoryDictionary[categorySource][categoryType][subCategoryType]} categoryType={categoryType} setOutfit={setOutfit} setAnimName={setCurrentAnimName} _setOutfit={_setOutfit}/>
                }
              </> : null}
              {categorySource === "Marketplace" && taxonomy.length > 0 ? <>
                <MarketplaceCategory searchData={searchData} setOutfit={setOutfit} setAnimName={setCurrentAnimName} setAlertText={setAlertText} setAlertEnabled={setAlertEnabled}/>
              </> : null}
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
