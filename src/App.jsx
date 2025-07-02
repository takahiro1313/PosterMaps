import { useState } from 'react'
import { BoardMap } from './components/BoardMap'
import { SummaryMap } from './components/SummaryMap'
// import { VoteMap } from './components/VoteMap'
import { MAP_VIEWS } from './types/map'
import HeatMap from './components/HeatMap'
import ProgressSummary from './components/ProgressSummary'
import './App.css'
import { GoogleSheetsDataProvider } from './contexts/GoogleSheetsDataContext'

function App() {
  const [activeView, setActiveView] = useState(MAP_VIEWS.BOARD)

  const renderActiveMap = () => {
    switch (activeView) {
      case MAP_VIEWS.BOARD:
        return <BoardMap />
      case MAP_VIEWS.SUMMARY:
        return <ProgressSummary />
      // case MAP_VIEWS.VOTE:
      //   return <VoteMap />
      case MAP_VIEWS.DASHBOARD:
        return <HeatMap />
      default:
        return <BoardMap />
    }
  }

  return (
    <GoogleSheetsDataProvider>
      <div className="app">
        <nav className="nav-tabs nav-tabs-fixed">
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
            ダッシュボード
          </button>
          {/*
          <button
            className={`nav-tab ${activeView === MAP_VIEWS.REGION ? 'active' : ''}`}
            onClick={() => setActiveView(MAP_VIEWS.REGION)}
          >
            地域別マップ
          </button>
          */}
          <button
            className={`nav-tab ${activeView === MAP_VIEWS.DASHBOARD ? 'active' : ''}`}
            onClick={() => setActiveView(MAP_VIEWS.DASHBOARD)}
          >
            ヒートマップ
          </button>
        </nav>
        <main className="map-content">
          {renderActiveMap()}
        </main>
      </div>
    </GoogleSheetsDataProvider>
  )
}

export default App
