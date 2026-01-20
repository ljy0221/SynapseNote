import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/electron-vite.animate.svg'
import synapseLogo1 from '/public/synapse_logo_1.png'
import synapseLogo2 from '/public/synapse_logo_2.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a target="_blank">
          <img src={synapseLogo1} className="logo" alt="Synapse logo 1" />
        </a>
        <a target="_blank">
          <img src={synapseLogo2} className="logo react" alt="Synapse logo 2" />
        </a>
      </div>
      <h1>대머리 쫀득 쿠키</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
