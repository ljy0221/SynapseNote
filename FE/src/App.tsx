import { Header } from './components/layout/header/Header';
import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* Layout Layer의 헤더 적용 */}
      <Header />

      <main className="main-content">
        <h1>대머리 쫀득 쿠키</h1>
        <p>테마 토글 기능을 테스트해보세요.</p>
      </main>
    </div>
  )
}

export default App
