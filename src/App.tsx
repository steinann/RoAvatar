import { useEffect, useState } from 'react'
import './App.css'
import { Authentication } from './code/api'
import { AuthContext } from './react/auth-context'
import Test from './react/test'

function App() {
  const [auth, setAuth] = useState<Authentication | undefined>(undefined)

  useEffect(() => {
    if (!auth) {
      const newAuth = new Authentication()

      newAuth.fill().then(() => {
        setAuth(newAuth)
      })
    }
  })

  return (
    <>
      <AuthContext value={auth}>
        <Test/>
      </AuthContext>
    </>
  )
}

export default App
