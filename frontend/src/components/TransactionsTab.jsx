import { useState } from 'react'
import axios from 'axios'

function TransactionsTab({ activeTab, expenses, setExpenses }) {
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')

    const handleSubmit = (e) => {

        e.preventDefault()

        const newExpense = {
            category: category,
            amount: amount,
            description: description
        }
        axios.post('http://127.0.0.1:8000/api/expenses/', newExpense)
            .then(response => {
                console.log("Saved to SQL database", response.data)
                setCategory('')
                setAmount('')
                setDescription('')

                axios.get('http://127.0.0.1:8000/api/expenses/')
                    .then(res => setExpenses(res.data))
                    .catch(err => console.error("Error refreshing expenses", err))
            })
            .catch(err => {
                console.error("Error saving to SQL database", err)
            })
    }

    if (activeTab !== 'transactions')
        return null;
    return (
        <div className="metric-card">
            <h2 style={{ marginBottom: '1rem' }}>SQL Data (Expenses)</h2>
            {expenses.map((item) => (
                <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderBottom: '1px solid var(--glass-border)'
                }}>
                    <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{item.category}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.description}</div>
                    </div>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: '700', fontSize: '1.25rem' }}>₹{item.amount}</div>
                </div>
            ))}

            {expenses.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', }}>No Expenses found in the database</p>
            )}

            <form style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }} onSubmit={handleSubmit} >
                <input
                    type='text'
                    placeholder='Category (e.g. Food)'
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                />

                <input
                    type='number'
                    placeholder='Amount'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />

                <input
                    type='text'
                    placeholder='Notes, Description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <button type='submit' style={{ background: 'var(--accent-primary)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                    Add Expense
                </button>
            </form>
        </div>
    )
}

export default TransactionsTab