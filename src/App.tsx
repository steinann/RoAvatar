import { useEffect, useState } from 'react'
import './App.css'
import { Authentication } from './code/api'
import { AuthContext } from './react/context/auth-context'
import { Outfit } from './code/avatar/outfit'
import { OutfitContext } from './react/context/outfit-context'
import AvatarPreview from './react/avatarPreview'
import BarCategory from './react/barCategory'
import BarButton from './react/barButton'
import Category from './react/category'
//import Test_AvatarPreview from './react/test-avatarPreview'

function App() {
  const [auth, setAuth] = useState<Authentication | undefined>(undefined)
  const [outfit, setOutfit] = useState<Outfit>(new Outfit())
  const [categoryType, setCategoryType] = useState<string>("Recent")

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
                <BarButton>Inventory</BarButton>
                <BarButton>Marketplace</BarButton>
              </BarCategory>
              <BarCategory>
                <BarButton onClick={() => {setCategoryType("Recent")}}>Recent</BarButton>
                <BarButton>Characters</BarButton>
                <BarButton>Clothing</BarButton>
                <BarButton>Accessories</BarButton>
                <BarButton>Head & Body</BarButton>
                <BarButton>Animations</BarButton>
              </BarCategory>
              <Category categoryType={categoryType} setOutfit={setOutfit}>

              </Category>
            </div>
          </div>
        </OutfitContext>
      </AuthContext>
    </>
  )
}

export default App
