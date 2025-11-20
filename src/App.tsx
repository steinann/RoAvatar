import { useEffect, useState } from 'react'
import './App.css'
import { Authentication } from './code/api'
import { AuthContext } from './react/context/auth-context'
import { Outfit } from './code/avatar/outfit'
import { OutfitContext } from './react/context/outfit-context'
import AvatarPreview from './react/avatarPreview'
import BarCategory from './react/barCategory'
import ItemCategory from './react/itemCategory'
//import SubCategory from './react/subCategory'
import { CategoryDictionary } from './code/avatar/sorts'
import SaveButton from './react/saveButton'
import UndoRedo from './react/undoRedo'
//import Test_AvatarPreview from './react/test-avatarPreview'

const outfitHistory: Outfit[] = []
let outfitHistoryIndex = -1

function App() {
  const [auth, setAuth] = useState<Authentication | undefined>(undefined)
  const [outfit, _setOutfit] = useState<Outfit>(new Outfit())
  const [currentAnimName, setCurrentAnimName] = useState<string>("idle.Animation1")

  const [categorySource, _setCategorySource] = useState<string>("Inventory")
  const [categoryType, _setCategoryType] = useState<string>("Recent")
  const [subCategoryType, _setSubCategoryType] = useState<string>("All")

  function setOutfit(outfit: Outfit) {
    if (outfitHistory.length > outfitHistoryIndex) {
      outfitHistory.splice(outfitHistoryIndex)
    }

    outfitHistory.push(outfit)
    outfitHistoryIndex++
    _setOutfit(outfit)
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

  function setSubCategoryType(subCategoryType: string) {
    _setSubCategoryType(subCategoryType)
    switch (subCategoryType) {
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
      })
    }

    if (!outfit) {
      setOutfit(new Outfit())
    }
  }, [auth, outfit])

  return (
    <>
      <AuthContext value={auth}>
        <OutfitContext value={outfit}>
          <div className='main'>
            <div className='main-left division-down'>
              <BarCategory className="background-transparent bar-double-margin"></BarCategory>
              <AvatarPreview setOutfit={setOutfit} animName={currentAnimName}></AvatarPreview>
              <div className="save-and-history">
                <SaveButton/>
                <UndoRedo/>
              </div>
              {/*<Test_AvatarPreview/>*/}
            </div>
            <div className='main-right division-down'>
              <BarCategory className="align-center" source={CategoryDictionary} currentCategory={categorySource} setCurrentCategory={setCategorySource}/>
              <BarCategory className='width-fill-available' source={CategoryDictionary[categorySource]} currentCategory={categoryType} setCurrentCategory={setCategoryType}/>
              <BarCategory className='width-fill-available' source={CategoryDictionary[categorySource][categoryType]} currentCategory={subCategoryType} setCurrentCategory={setSubCategoryType}/>
              {/*<SubCategory currentCategory={categoryType} currentSubCategory={subCategoryType} setSubCategory={setSubCategoryType}/>*/}
              <ItemCategory categoryType={categoryType} subCategoryType={subCategoryType} setOutfit={setOutfit} setAnimName={setCurrentAnimName}>

              </ItemCategory>
            </div>
          </div>
        </OutfitContext>
      </AuthContext>
    </>
  )
}

export default App
