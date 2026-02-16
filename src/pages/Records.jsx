import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeStudents, subscribeViolations, clearAllViolations } from '../firebaseService';
import { Search, FileText, Trash2, Inbox } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Records({ showToast }) {
    const [students, setStudents] = useState([]);
    const [violations, setViolations] = useState([]);
    const [search, setSearch] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const unsub1 = subscribeStudents(setStudents);
        const unsub2 = subscribeViolations(setViolations);
        return () => { unsub1(); unsub2(); };
    }, []);

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleClearAll = async () => {
        try {
            await clearAllViolations(students);
            showToast('All violations cleared', 'success');
            setShowConfirm(false);
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    };

    const exportAllPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Managea — All Student Fines', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

        const rows = students
            .filter(s => s.totalFine > 0)
            .sort((a, b) => b.totalFine - a.totalFine)
            .map((s, i) => [i + 1, s.name, s.room || '-', s.class || '-', s.totalFine]);

        doc.autoTable({
            startY: 34,
            head: [['#', 'Name', 'Room', 'Class', 'Total Fine']],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 9 }
        });

        const totalFine = students.reduce((sum, s) => sum + (s.totalFine || 0), 0);
        doc.setFontSize(12);
        doc.text(`Total Fines: ${totalFine}`, 14, doc.lastAutoTable.finalY + 12);

        doc.save('managea-fines.pdf');
        showToast('PDF exported', 'success');
    };

    return (
        <>
            <div className="header">
                <h1>Records</h1>
            </div>

            <div className="search-box">
                <Search size={16} strokeWidth={1.5} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="action-bar">
                <button className="btn btn-outline btn-sm" onClick={exportAllPDF}>
                    <FileText size={14} strokeWidth={1.5} /> Export PDF
                </button>
                <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setShowConfirm(true)}
                >
                    <Trash2 size={14} strokeWidth={1.5} /> Clear All
                </button>
            </div>

            <div className="student-list">
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <Inbox size={36} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 8 }} />
                        <p>No students found</p>
                    </div>
                ) : (
                    filtered.map(s => (
                        <Link key={s.id} to={`/records/${s.id}`} className="student-item">
                            <div className="student-info">
                                <h4>{s.name}</h4>
                                <p>{[s.room, s.class].filter(Boolean).join(' · ') || 'No details'}</p>
                            </div>
                            <span className={`fine-badge ${s.totalFine > 0 ? 'fine-badge-red' : 'fine-badge-green'}`}>
                                {s.totalFine || 0}
                            </span>
                        </Link>
                    ))
                )}
            </div>

            {showConfirm && (
                <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Clear All Violations?</h3>
                        <p className="confirm-text">
                            This will permanently delete all violation records and reset all student fines to 0. This action cannot be undone.
                        </p>
                        <div className="btn-row">
                            <button className="btn btn-outline btn-sm" onClick={() => setShowConfirm(false)}>Cancel</button>
                            <button className="btn btn-danger btn-sm" onClick={handleClearAll}>Yes, Clear All</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
