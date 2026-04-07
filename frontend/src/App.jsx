import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import Sidebar from './components/Sidebar'
import DashboardCard from './components/DashboardCard'
import TransactionsTab from './components/TransactionsTab'
import ObjectsTab from './components/ObjectsTab'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expenses, setExpenses] = useState([])
  const [objects, setObjects] = useState([])

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/expenses/')
      .then(response => {
        console.log("Data Recieved from SQL", response.data)
        setExpenses(response.data)
      })
      .catch(error => { console.log("Error while getting data from backend", error) })

    axios.get('http://127.0.0.1:8000/api/objects/')
      .then(response => {
        console.log("Data recieved from MongoDB", response.data)
        setObjects(response.data)
      })
      .catch(error => { console.log("Error while fetching data from MongoDB", error) })

  }, [])

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <h1 className="header-title">
            {activeTab === 'dashboard' && 'Overview'}
            {activeTab === 'transactions' && 'All Transactions'}
            {activeTab === 'objects' && 'MongoDB Collection'}
            {activeTab === 'settings' && 'Account Settings'}
          </h1>

          <div className="header-actions">
            <button className="user-profile">
              <div className="avatar">U</div>
              <span>User</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="dashboard-container">
          <DashboardCard activeTab={activeTab} expenses={expenses} objects={objects} />
          <TransactionsTab activeTab={activeTab} expenses={expenses} setExpenses={setExpenses} />
          <ObjectsTab activeTab={activeTab} objects={objects} setObjects={setObjects} />
        </div>
      </main>
    </div>
  )
}

export default App
