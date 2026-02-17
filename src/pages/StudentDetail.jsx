import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    subscribeStudents,
    subscribeViolations,
    deleteViolation,
    clearStudentViolations
} from '../firebaseService';
import { ArrowLeft, FileText, Trash2, X, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function StudentDetail({ showToast }) {
    const { studentId } = useParams();
    const [student, setStudent] = useState(null);
    const [violations, setViolations] = useState([]);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const unsub1 = subscribeStudents((students) => {
            const found = students.find(s => s.id === studentId);
            setStudent(found || null);
        });
        const unsub2 = subscribeViolations((all) => {
            setViolations(all.filter(v => v.studentId === studentId));
        });
        return () => { unsub1(); unsub2(); };
    }, [studentId]);

    const handleDelete = async (v) => {
        try {
            await deleteViolation(v.id, v.studentId, v.fine);
            showToast('Violation removed', 'success');
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    };

    const handleClearAll = async () => {
        try {
            await clearStudentViolations(studentId);
            showToast('All violations cleared', 'success');
            setShowConfirm(false);
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    };

    const exportPDF = () => {
        if (!student) return;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`Violation Report — ${student.name}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Room: ${student.room || '-'}  |  Class: ${student.class || '-'}`, 14, 28);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

        const rows = violations.map((v, i) => [i + 1, v.date, v.prayer, v.type, v.fine]);

        autoTable(doc, {
            startY: 40,
            head: [['#', 'Date', 'Prayer', 'Violation', 'Fine']],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [17, 17, 17] },
            styles: { fontSize: 9 }
        });

        doc.setFontSize(12);
        doc.text(`Total Fine: ${student.totalFine || 0}`, 14, doc.lastAutoTable.finalY + 12);

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showToast('PDF exported', 'success');
    };

    if (!student) {
        return (
            <>
                <div className="header">
                    <Link to="/records" className="back-btn"><ArrowLeft size={16} strokeWidth={1.5} /> Records</Link>
                </div>
                <div className="loader"><div className="spinner"></div></div>
            </>
        );
    }

    return (
        <>
            <div className="header">
                <Link to="/records" className="back-btn"><ArrowLeft size={16} strokeWidth={1.5} /> Records</Link>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{student.name}</h2>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {[student.room, student.class].filter(Boolean).join(' · ') || 'No details'}
                        </p>
                    </div>
                    <span className="fine-badge fine-badge-gold" style={{ fontSize: '1rem', padding: '6px 16px' }}>
                        {student.totalFine || 0}
                    </span>
                </div>
            </div>

            <div className="action-bar">
                <button className="btn btn-outline btn-sm" onClick={exportPDF}>
                    <FileText size={14} strokeWidth={1.5} /> Export PDF
                </button>
                <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setShowConfirm(true)}
                    disabled={violations.length === 0}
                >
                    <Trash2 size={14} strokeWidth={1.5} /> Clear All
                </button>
            </div>

            <p className="section-title">Violation History ({violations.length})</p>

            {violations.length === 0 ? (
                <div className="empty-state">
                    <CheckCircle size={36} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p>No violations recorded</p>
                </div>
            ) : (
                violations.map(v => (
                    <div key={v.id} className="violation-item">
                        <div className="violation-info">
                            <div className="date">{v.date}</div>
                            <div className="details">
                                {v.prayer !== 'N/A' && <span className="prayer-tag">{v.prayer}</span>}
                                <span className="type-tag">{v.type}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className="fine-badge fine-badge-red">{v.fine}</span>
                            <button
                                className="btn btn-outline btn-icon"
                                onClick={() => handleDelete(v)}
                                title="Delete"
                                style={{ color: 'var(--danger)' }}
                            >
                                <X size={14} strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                ))
            )}

            {showConfirm && (
                <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Clear All Violations?</h3>
                        <p className="confirm-text">
                            This will delete all violations for <strong>{student.name}</strong> and reset their fine to 0.
                        </p>
                        <div className="btn-row">
                            <button className="btn btn-outline btn-sm" onClick={() => setShowConfirm(false)}>Cancel</button>
                            <button className="btn btn-danger btn-sm" onClick={handleClearAll}>Yes, Clear</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
