import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { API, Authentication } from './code/api'
import { AuthContext } from './react/context/auth-context'
import { Outfit } from './code/avatar/outfit'
import { OutfitContext } from './react/context/outfit-context'
import AvatarPreview from './react/avatarPreview'
import BarCategory from './react/barCategory'
import ItemCategory from './react/itemCategory'
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
import { HAIR_IS_BODYPART } from './code/misc/flags'
import BarButton from './react/barButton'
import RadialButton from './react/generic/radialButton'

const outfitHistory: Outfit[] = []

function App() {
  const [auth, setAuth] = useState<Authentication | undefined>(undefined)
  const [outfit, _setOutfit] = useState<Outfit>(new Outfit())
  const [navigationMenuItems, setNavigationMenuItems] = useState<NavigationMenuItems | undefined>(undefined)

  const [currentAnimName, _setCurrentAnimName] = useState<string>("idle")

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

  const [addAssetOpen, setAddAssetOpen] = useState<boolean>(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const addAssetDialogRef = useRef<HTMLDialogElement>(null)
  const addAssetInputRef = useRef<HTMLInputElement>(null)

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
    if (outfit.playerAvatarType === AvatarType.R6 && (name === "swim" || name === "run")) {
      name = "walk"
    } else if (outfit.playerAvatarType === AvatarType.R6 && name === "jump") {
      name = "fall"
    } else if (outfit.playerAvatarType === AvatarType.R6 && name.startsWith("emote.")) {
      const emoteId = Number(name.split(".")[1])
      const danceName = `dance${emoteId % 3 + 1}`
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

    //update animation based on subcategory
    _setSubCategoryType(newSubCategoryType)
    switch (newSubCategoryType) {
      case "Idle": 
        setCurrentAnimName("idle")
        break
      case "Walk":
        setCurrentAnimName("walk")
        break
      case "Run":
        setCurrentAnimName("run")
        break
      case "Fall":
        setCurrentAnimName("fall")
        break
      case "Jump":
        setCurrentAnimName("jump")
        break
      case "Swim":
        setCurrentAnimName("swim")
        break
      case "Climb":
        setCurrentAnimName("climb")
        break
      default:
        setCurrentAnimName("idle")
        break
    }
  }

  useEffect(() => {
    //create auth
    if (!auth) {
      const newAuth = new Authentication()

      setAuth(newAuth)
      window.saveOutfit = (a: Outfit) => {
        API.Avatar.SaveOutfit(newAuth, a)
      }
      window.getMesh = (a: string) => {
        return API.Asset.GetMesh(a, undefined)
      }
      window.getRBX = (a: string) => {
        return API.Asset.GetRBX(a, undefined)
      }
    }

    //create outfit
    if (!outfit) {
      setOutfit(new Outfit())
    }

    //create marketplace data
    if (auth && !navigationMenuItems) {
      API.Catalog.GetNavigationMenuItems().then((result) => {
        if (result instanceof Response) {
          setAlertEnabled(true)
          setAlertText("Failed to load Marketplace")
        } else {
          setNavigationMenuItems(result)

          const marketplaceSource: {[k in string]: {[k in string]: SpecialInfo}} = {}

          //move hair to accessories
          if (!HAIR_IS_BODYPART) {
            //find body category
            let bodyCategory = undefined
            for (const category of result.categories) {
              if (category.category === "Body") { //.category is always english, only .name is translated
                bodyCategory = category
              }
            }

            if (bodyCategory) {
              //find hair subcategory
              let hairSubcategory = undefined
              for (const subcategory of bodyCategory.subcategories) {
                if (subcategory.subcategory === "HairAccessories") {
                  hairSubcategory = subcategory
                }
              }

              if (hairSubcategory) {
                //find accessories subcategory and move hair to there
                for (const category of result.categories) {
                  if (category.category === "Accessories") {
                    category.subcategories.unshift(hairSubcategory)
                    
                    const hairIndex = bodyCategory.subcategories.indexOf(hairSubcategory)
                    if (hairIndex >= 0) {
                      bodyCategory.subcategories.splice(hairIndex, 1)
                    }
                  }
                }
              }
            }
          }

          //remove redundant "Accessory" from names of subcategories in Accessories
          //find accessories subcategory and move hair to there
          for (const category of result.categories) {
            if (category.category === "Accessories") {
              for (const subcategory of category.subcategories) {
                if (subcategory.name.endsWith(" Accessory")) {
                  subcategory.name = subcategory.name.replace(" Accessory","")
                }
              }
            }
          }

          for (const category of result.categories) {
            //flip order so classic clothing is first
            if (category.name === "Clothing") {
              category.subcategories = category.subcategories.reverse()
            }

            //create category data in sorts.ts
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

  //update searchData to match selected filters
  useEffect(() => {
    let marketplaceCategoryData: NavigationMenuItems["categories"][0] | undefined = undefined
    let marketplaceSubcategoryData: NavigationMenuItems["categories"][0]["subcategories"][0] | undefined = undefined

    //get appropriate categorydata and subcategorydata based on selection
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

    //get taxonomy
    let taxonomy = ""
    if (marketplaceCategoryData) {
      taxonomy = marketplaceCategoryData.taxonomy
    }
    if (marketplaceSubcategoryData) {
      taxonomy = marketplaceSubcategoryData.taxonomy
    }

    //create search data
    const newSearchData: Search_Payload = {
      taxonomy: taxonomy,
      salesTypeFilter: 1,
      keyword: searchKeyword,
    }

    //this makes the All category more personalized but only works if there are no filters
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

            <dialog style={addAssetOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={addAssetDialogRef} onCancel={() => {setAddAssetOpen(false)}}>
              <span className="dialog-title roboto-700">Add Item</span>
              <input ref={addAssetInputRef} className="dialog-text-input roboto-300" placeholder="Item URL"></input>
              <div className="dialog-actions">
                <RadialButton className="dialog-cancel roboto-600" onClick={() => {
                  setAddAssetOpen(false)
                }}>Cancel</RadialButton>
                <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                  setAddAssetOpen(false)

                  const idValue = addAssetInputRef.current?.value || ""
                  const ids = idValue.match(/^\d+|\d+\b|\d+(?=\w)/g)
                  let id = null
                  if (ids) {
                    id = Number(ids[0])
                  }

                  let isBundle = false
                  if (addAssetInputRef.current?.value.includes("/bundles/")) {
                    isBundle = true
                  }

                  if (id && !isNaN(id) && id > 0 && auth) {
                    const newOutfit = outfit.clone()
                    if (!isBundle) {
                      newOutfit.addAssetId(id).then((success) => {
                        if (success) {
                          if (addAssetInputRef.current) {
                            addAssetInputRef.current.value = ""
                          }

                          setOutfit(newOutfit)
                        } else {
                          setAlertEnabled(true)
                          setAlertText(`Failed to add asset with id ${id}`)
                          setTimeout(() => {
                            setAlertEnabled(false)
                          }, 3000)
                        }
                      })
                    } else {
                      newOutfit.addBundleId(id).then((success) => {
                        if (success) {
                          if (addAssetInputRef.current) {
                            addAssetInputRef.current.value = ""
                          }

                          setOutfit(newOutfit)
                        } else {
                          setAlertEnabled(true)
                          setAlertText(`Failed to add bundle with id ${id}`)
                          setTimeout(() => {
                            setAlertEnabled(false)
                          }, 3000)
                        }
                      })
                    }
                  }
                }}>Add</RadialButton>
              </div>
          </dialog>

            {/*LEFT SIDE*/}
            <div className='main-left division-down'>
              <BarCategory className="background-transparent bar-double-margin"><BarButton category='|' setCategory={(a) => {return a}}></BarButton></BarCategory>

              {/*avatar preview*/}
              <AvatarPreview setOutfit={setOutfit} animName={currentAnimName}>
                <AvatarAdjustment setOutfit={setOutfit} _setOutfit={_setOutfit}/>
              </AvatarPreview>

              {/*save and undo*/}
              <div className="save-and-history">
                <SaveButton historyIndex={historyIndex} historyLength={outfitHistory.length} setAlertEnabled={setAlertEnabled} setAlertText={setAlertText}/>
                <UndoRedo undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}/>
              </div>

              {/*worn items list*/}
              <div className='worn-items dark-scrollbar'>
                {outfit.assets.map(asset => {
                  return <ItemCard auth={auth} key={asset.id} className='worn-list-item' showViewButton={true} includeName={false} itemInfo={new ItemInfo("Asset", asset.assetType.name, asset.id, asset.name)} onClick={() => {
                    const newOutfit = outfit.clone()
                    newOutfit.removeAsset(asset.id)
                    setOutfit(newOutfit)
                  }}/>
                })}
                <ItemCard auth={auth} forceImage='../assets/newnewoutfit.png' className='worn-list-item' showViewButton={false} includeName={false} itemInfo={new ItemInfo("None", "", -1, "Add Asset")} onClick={() => {
                  setAddAssetOpen(true)
                }}></ItemCard>
              </div>
            </div>

            {/*RIGHT SIDE*/}
            <div className='main-right division-down'>
              {/*category source (inventory/marketplace)*/}
              <BarCategory className="align-center" source={CategoryDictionary} currentCategory={categorySource} setCurrentCategory={setCategorySource}/>

              {/*category picker*/}
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
                  <button type="submit" className='search-button'><span className='material-symbols-outlined'>search</span></button>
                </form>
                 : null
                 /*<SearchFilter tempSearchKeyword={tempSearchKeyword} setSearchKeyword={setSearchKeyword} setTempSearchKeyword={setTempSearchKeyword}/>*/
                 }
              </BarCategory>

              {/*subcategorycategory picker*/}
              <BarCategory className='width-fill-available' source={CategoryDictionary[categorySource][categoryType]} currentCategory={subCategoryType} setCurrentCategory={setSubCategoryType}/>
              {/*old subcategory picker Unused <SubCategory currentCategory={categoryType} currentSubCategory={subCategoryType} setSubCategory={setSubCategoryType}/>*/}
              {/*appropriate category element for inventory*/
              subCategoryType ? <>
                {CategoryDictionary[categorySource][categoryType][subCategoryType] instanceof SortInfo ?
                (<ItemCategory categoryType={categoryType} subCategoryType={subCategoryType} setOutfit={setOutfit} setAnimName={setCurrentAnimName} setAlertText={setAlertText} setAlertEnabled={setAlertEnabled}>

                </ItemCategory>)
                :
                <SpecialCategory specialInfo={CategoryDictionary[categorySource][categoryType][subCategoryType]} categoryType={categoryType} setOutfit={setOutfit} setAnimName={setCurrentAnimName} _setOutfit={_setOutfit}/>
                }
              </> : null}
              {/*Marketplace category element*/
              categorySource === "Marketplace" && taxonomy.length > 0 ? <>
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
        getMesh: (a: string) => void;
        getRBX: (a: string) => void;
    }
}

window.arrayBufferToBase64 = arrayBufferToBase64
window.base64ToArrayBuffer = base64ToArrayBuffer

export default App