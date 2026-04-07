function Sidebar({ activeTab, setActiveTab }) {
    return (
        <aside className="sidebar">
            <div className="logo-container">
                <div className="logo-icon">E</div>
                <span className="logo-text">ExpensePro</span>
            </div>

            <nav className="nav-menu">
                <button
                    className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <span className="nav-icon">📊</span>
                    Dashboard
                </button>
                <button
                    className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transactions')}
                >
                    <span className="nav-icon">💳</span>
                    Transactions
                </button>
                <button
                    className={`nav-item ${activeTab === 'objects' ? 'active' : ''}`}
                    onClick={() => setActiveTab('objects')}
                >
                    <span className="nav-icon">📸</span>
                    Object Gallery
                </button>
                <button
                    className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <span className="nav-icon">⚙️</span>
                    Settings
                </button>
            </nav>
        </aside>
    )
}

export default Sidebar

