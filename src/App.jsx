import { useState } from 'react'
import { BoardMap } from './components/BoardMap'
import { SummaryMap } from './components/SummaryMap'
import { VoteMap } from './components/VoteMap'
import { MAP_VIEWS } from './types/map'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState(MAP_VIEWS.BOARD)

  const renderActiveMap = () => {
    switch (activeView) {
      case MAP_VIEWS.BOARD:
        return <BoardMap />
      case MAP_VIEWS.SUMMARY:
        return <SummaryMap />
      case MAP_VIEWS.VOTE:
        return <VoteMap />
      default:
        return <BoardMap />
    }
  }

  return (
    <div className="app">
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeView === MAP_VIEWS.BOARD ? 'active' : ''}`}
          onClick={() => setActiveView(MAP_VIEWS.BOARD)}
        >
          ポスター掲示板
        </button>
        <button
          className={`nav-tab ${activeView === MAP_VIEWS.SUMMARY ? 'active' : ''}`}
          onClick={() => setActiveView(MAP_VIEWS.SUMMARY)}
        >
          進捗サマリー
        </button>
        <button
          className={`nav-tab ${activeView === MAP_VIEWS.VOTE ? 'active' : ''}`}
          onClick={() => setActiveView(MAP_VIEWS.VOTE)}
        >
          期日前投票所
        </button>
      </nav>
      
      <main className="map-content">
        {renderActiveMap()}
      </main>
    </div>
  )
}

export default App
