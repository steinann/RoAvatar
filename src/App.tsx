import { useEffect, useState } from 'react'
import './App.css'
import { Authentication } from './code/api'
import { AuthContext } from './react/context/auth-context'
import { Outfit } from './code/avatar/outfit'
import { OutfitContext } from './react/context/outfit-context'
import AvatarPreview from './react/avatarPreview'
import BarCategory from './react/barCategory'
import BarButton from './react/barButton'
import ItemCategory from './react/category'
//import Test_AvatarPreview from './react/test-avatarPreview'

function App() {
  const [auth, setAuth] = useState<Authentication | undefined>(undefined)
  const [outfit, setOutfit] = useState<Outfit>(new Outfit())

  const [categorySource, _setCategorySource] = useState<string>("Inventory")
  const [categoryType, _setCategoryType] = useState<string>("Recent")

  function setCategorySource(categorySource: string) {
    _setCategorySource(categorySource)
    _setCategoryType("Recent")
  }

  function setCategoryType(categoryType: string) {
    _setCategoryType(categoryType)
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
              <AvatarPreview setOutfit={setOutfit}></AvatarPreview>
              {/*<Test_AvatarPreview/>*/}
            </div>
            <div className='main-right division-down'>
              <BarCategory className="align-center">
                <BarButton category='Inventory' currentCategory={categorySource} setCategory={setCategorySource}/>
                <BarButton category='Marketplace' currentCategory={categorySource} setCategory={setCategorySource}/>
              </BarCategory>
              <BarCategory className='width-fill-available'>
                <BarButton category='Recent' currentCategory={categoryType} setCategory={setCategoryType}/>
                <BarButton category='Characters' currentCategory={categoryType} setCategory={setCategoryType}/>
                <BarButton category='Clothing' currentCategory={categoryType} setCategory={setCategoryType}/>
                <BarButton category='Accessories' currentCategory={categoryType} setCategory={setCategoryType}/>
                <BarButton category='Head & Body' currentCategory={categoryType} setCategory={setCategoryType}/>
                <BarButton category='Animations' currentCategory={categoryType} setCategory={setCategoryType}/>
              </BarCategory>
              <ItemCategory categoryType={categoryType} setOutfit={setOutfit}>

              </ItemCategory>
            </div>
          </div>
        </OutfitContext>
      </AuthContext>
    </>
  )
}

export default App
