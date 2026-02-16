import { useState, useEffect } from 'react';
import { subscribeStudents, addViolation, FINE_MAP, PRAYERS } from '../firebaseService';
import { Search, X, Save, Loader } from 'lucide-react';

const VIOLATION_TYPES = ['Absent', 'Masbooq', 'No Cap'];

export default function MarkViolation({ showToast }) {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLateToSchool, setIsLateToSchool] = useState(false);
    const [prayer, setPrayer] = useState('');
    const [violationType, setViolationType] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsub = subscribeStudents(setStudents);
        return () => unsub();
    }, []);

    const searchResults = search.trim().length > 0
        ? students.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) &&
            !selectedStudents.includes(s.id)
        )
        : [];

    const currentFine = isLateToSchool
        ? FINE_MAP['Late to School']
        : (violationType ? FINE_MAP[violationType] : 0);

    const showStudentPicker = date && (
        isLateToSchool || (prayer && violationType)
    );

    const canSave = showStudentPicker && selectedStudents.length > 0;

    const addStudent = (id) => {
        setSelectedStudents(prev => [...prev, id]);
        setSearch('');
    };

    const removeStudent = (id) => {
        setSelectedStudents(prev => prev.filter(s => s !== id));
    };

    const handleSave = async () => {
        if (!canSave || saving) return;
        setSaving(true);

        let successCount = 0;
        let duplicateCount = 0;

        for (const studentId of selectedStudents) {
            const student = students.find(s => s.id === studentId);
            if (!student) continue;

            try {
                await addViolation({
                    studentId,
                    studentName: student.name,
                    date,
                    prayer: isLateToSchool ? 'N/A' : prayer,
                    type: isLateToSchool ? 'Late to School' : violationType
                });
                successCount++;
            } catch (err) {
                if (err.message.includes('Duplicate')) {
                    duplicateCount++;
                } else {
                    showToast(`Error for ${student.name}: ${err.message}`, 'error');
                }
            }
        }

        if (successCount > 0) {
            showToast(`Fine added for ${successCount} student${successCount > 1 ? 's' : ''}${duplicateCount > 0 ? ` (${duplicateCount} skipped)` : ''}`, 'success');
        } else if (duplicateCount > 0) {
            showToast(`All ${duplicateCount} entries were duplicates`, 'error');
        }

        setSelectedStudents([]);
        setSaving(false);
    };

    return (
        <>
            <div className="header">
                <h1>Mark Violation</h1>
            </div>

            {/* Step 1: Date */}
            <div className="form-group">
                <label>Date</label>
                <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />
            </div>

            {/* Step 2: Category */}
            <div className="form-group">
                <label>Category</label>
                <div className="pill-group">
                    <button
                        className={`pill ${!isLateToSchool ? 'active' : ''}`}
                        onClick={() => { setIsLateToSchool(false); setSelectedStudents([]); }}
                    >
                        Prayer Violation
                    </button>
                    <button
                        className={`pill pill-danger ${isLateToSchool ? 'active' : ''}`}
                        onClick={() => { setIsLateToSchool(true); setPrayer(''); setViolationType(''); setSelectedStudents([]); }}
                    >
                        Late to School
                    </button>
                </div>
            </div>

            {/* Step 3: Prayer */}
            {!isLateToSchool && (
                <div className="form-group">
                    <label>Prayer</label>
                    <div className="pill-group">
                        {PRAYERS.map(p => (
                            <button
                                key={p}
                                className={`pill ${prayer === p ? 'active' : ''}`}
                                onClick={() => { setPrayer(p); setSelectedStudents([]); }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 4: Type */}
            {!isLateToSchool && (
                <div className="form-group">
                    <label>Violation Type</label>
                    <div className="pill-group">
                        {VIOLATION_TYPES.map(v => (
                            <button
                                key={v}
                                className={`pill ${violationType === v ? 'active' : ''}`}
                                onClick={() => { setViolationType(v); setSelectedStudents([]); }}
                            >
                                {v} — {FINE_MAP[v]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Fine */}
            {(violationType || isLateToSchool) && (
                <div className="fine-display">
                    <span className="label">
                        {isLateToSchool ? 'Late to School (After 7:30)' : 'Fine Amount'}
                    </span>
                    <span className="rupee">{currentFine}</span>
                </div>
            )}

            {/* Step 5: Students */}
            {showStudentPicker && (
                <div className="form-group">
                    <label>Add Students ({selectedStudents.length} selected)</label>

                    {selectedStudents.length > 0 && (
                        <div className="selected-chips">
                            {selectedStudents.map(id => {
                                const s = students.find(st => st.id === id);
                                if (!s) return null;
                                return (
                                    <span key={id} className="chip">
                                        {s.name}
                                        <button className="chip-remove" onClick={() => removeStudent(id)}>
                                            <X size={12} strokeWidth={2} />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    <div className="search-box">
                        <Search size={16} strokeWidth={1.5} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Type student name to add..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {searchResults.length > 0 && (
                        <div className="search-results">
                            {searchResults.map(s => (
                                <div
                                    key={s.id}
                                    className="search-result-item"
                                    onClick={() => addStudent(s.id)}
                                >
                                    <span>{s.name}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {[s.room, s.class].filter(Boolean).join(' · ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {search.trim().length > 0 && searchResults.length === 0 && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
                            No matching students
                        </p>
                    )}
                </div>
            )}

            {/* Save */}
            {showStudentPicker && (
                <button
                    className="btn btn-primary"
                    disabled={!canSave || saving}
                    onClick={handleSave}
                    style={{ marginTop: 8 }}
                >
                    {saving
                        ? <><Loader size={16} strokeWidth={1.5} className="spin" /> Saving...</>
                        : <><Save size={16} strokeWidth={1.5} /> Save for {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}</>
                    }
                </button>
            )}
        </>
    );
}
