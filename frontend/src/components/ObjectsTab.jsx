import { useState } from 'react';
import axios from 'axios';

function ObjectsTab({ activeTab, objects, setObjects }) {
    const [name, setName] = useState('')
    const [dynamicFields, setDynamicFields] = useState([{ key: '', value: '' }]);

    const handleFieldChange = (index, event) => {
        const newFields = [...dynamicFields];
        newFields[index][event.target.name] = event.target.value;
        setDynamicFields(newFields);
    };

    const addField = () => {
        setDynamicFields([...dynamicFields, { key: '', value: '' }]);
    };

    const removeField = (index) => {
        const newFields = [...dynamicFields];
        newFields.splice(index, 1);
        setDynamicFields(newFields);
    };

    const onSubmit = (e) => {
        e.preventDefault();

        const detailsObject = {};
        dynamicFields.forEach(field => {
            if (field.key.trim() !== "") {
                detailsObject[field.key] = field.value;
            }
        });

        const newObject = {
            name: name,
            details: detailsObject
        };

        axios.post('http://127.0.0.1:8000/api/objects/', newObject)
            .then(response => {
                console.log("Object stored in DB", response.data)
                setName('')
                setDynamicFields([{ key: '', value: '' }]);

                axios.get('http://127.0.0.1:8000/api/objects/')
                    .then(res => setObjects(res.data))
                    .catch(err => console.log("Error while refreshing Objects", err))

            })
            .catch(error => {
                console.log("Error while storing Object", error)
            })
    }


    if (activeTab !== 'objects')
        return null;
    return (
        <div className="metric-card">
            <h2 style={{ marginBottom: '1rem' }}>MongoDB Objects</h2>
            {objects.map((obj, index) => {
                let parsedDetails = {};
                try {
                    parsedDetails = typeof obj.details === 'string' ? JSON.parse(obj.details) : obj.details;
                } catch (e) {
                    parsedDetails = { "Error": "Corrupted Data Format" };
                }

                // Safely render any value — arrays/objects get stringified
                const renderValue = (val) => {
                    if (val === null || val === undefined) return '—'
                    if (typeof val === 'object') return JSON.stringify(val)
                    return String(val)
                }

                return (
                    <div key={obj._id || obj.id || index} style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'var(--glass-bg)', borderRadius: '12px', marginBottom: '1rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{obj.name}</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {Object.entries(parsedDetails).map(([key, value]) => (
                                <div key={key} style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1.25rem', borderRadius: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{key}</span>
                                    <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', wordBreak: 'break-word', maxWidth: '300px' }}>
                                        {renderValue(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <p>Object's Name</p>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                />

                <hr />

                <p>Dynamic Details</p>
                {dynamicFields.map((field, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                            name="key"
                            value={(field.key)}
                            onChange={(e) => handleFieldChange(index, e)}
                            placeholder="Property (e.g. ISO, place, city, etc)"
                        />
                        <input
                            name="value"
                            value={(field.value)}
                            onChange={(e) => handleFieldChange(index, e)}
                            placeholder="Value (e.g. 400, hyd, etc)"
                        />
                        <button type="button" onClick={() => removeField(index)}>
                            Remove Field
                        </button>
                    </div>
                ))}
                {/* Styled Buttons inside a Flex Container with gap */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={addField} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0.75rem 1.5rem', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        + Add Property
                    </button>
                    <button type="submit" style={{ background: 'var(--accent-primary)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                        Save Object
                    </button>
                </div>
            </form>
        </div >
    )
}

export default ObjectsTab