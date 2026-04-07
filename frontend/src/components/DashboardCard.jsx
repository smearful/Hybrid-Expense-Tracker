function DashboardCard({ activeTab, expenses, objects }) {
    if (activeTab !== 'dashboard')
        return null;
    const totalAmount = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0)
    const totalObjects = objects.length
    return (
        <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Welcome to your hybrid SQL/NoSQL expense tracker.
            </p>

            <div className="dashboard-grid">
                <div className="metric-card">
                    <span className="metric-title">Total Expenses</span>
                    <span className="metric-value">₹{totalAmount.toFixed(2)}</span>
                    <div className="metric-trend trend-up">
                        <span>↗</span> 0% from last month
                    </div>
                </div>

                <div className="metric-card">
                    <span className="metric-title">NoSQL Objects</span>
                    <span className="metric-value">{totalObjects}</span>
                    <div className="metric-trend">
                        Stored in MongoDB
                    </div>
                </div>

                <div className="metric-card" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'linear-gradient(145deg, var(--bg-tertiary), rgba(16,185,129,0.05))' }}>
                    <span className="metric-title">Quick Action</span>
                    <span className="metric-value" style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>+ New Expense</span>
                </div>
            </div>
        </>
    )
}

export default DashboardCard