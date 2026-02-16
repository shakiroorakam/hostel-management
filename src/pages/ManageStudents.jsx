import { useState, useEffect, useRef } from 'react';
import {
    subscribeStudents,
    subscribeClasses,
    addClass,
    updateClass,
    deleteClass,
    addStudent,
    addStudentsBatch,
    updateStudent,
    deleteStudent
} from '../firebaseService';
import { Plus, Pencil, Trash2, Users, Upload, ArrowLeft, Search, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ManageStudents({ showToast }) {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedClass, setSelectedClass] = useState(null);
    const [showClassModal, setShowClassModal] = useState(false);
    const [classForm, setClassForm] = useState('');
    const [editClassId, setEditClassId] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [studentForm, setStudentForm] = useState({ name: '', room: '' });
    const [editStudentId, setEditStudentId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmDeleteClass, setConfirmDeleteClass] = useState(null);
    const fileRef = useRef(null);

    useEffect(() => {
        const unsub1 = subscribeClasses(setClasses);
        const unsub2 = subscribeStudents(setStudents);
        return () => { unsub1(); unsub2(); };
    }, []);

    const classStudents = selectedClass
        ? students.filter(s => s.classId === selectedClass.id)
        : [];

    const filteredClassStudents = classStudents.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    // ─── Class handlers ───
    const handleAddClass = async () => {
        if (!classForm.trim()) return;
        try {
            if (editClassId) {
                await updateClass(editClassId, classForm);
                showToast('Class updated', 'success');
            } else {
                await addClass(classForm);
                showToast('Class created', 'success');
            }
            setClassForm('');
            setEditClassId(null);
            setShowClassModal(false);
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    };

    const handleDeleteClass = async (cls) => {
        try {
            await deleteClass(cls.id);
            if (selectedClass?.id === cls.id) setSelectedClass(null);
            showToast('Class deleted', 'success');
            setConfirmDeleteClass(null);
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    };

    // ─── Student handlers ───
    const resetStudentForm = () => {
        setStudentForm({ name: '', room: '' });
        setEditStudentId(null);
        setShowStudentModal(false);
    };

    const handleAddStudent = async () => {
        if (!studentForm.name.trim()) {
            showToast('Student name is required', 'error');
            return;
        }
        try {
            if (editStudentId) {
                await updateStudent(editStudentId, {
                    name: studentForm.name.trim(),
                    room: studentForm.room.trim()
                });
                showToast('Student updated', 'success');
            } else {
                await addStudent({
                    name: studentForm.name.trim(),
                    room: studentForm.room.trim(),
                    class: selectedClass.name,
                    classId: selectedClass.id
                });
                showToast('Student added', 'success');
            }
            resetStudentForm();
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    };

    const handleDeleteStudent = async (id) => {
        try {
            await deleteStudent(id);
            showToast('Student deleted', 'success');
            setConfirmDelete(null);
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    };

    // ─── Excel import ───
    const handleExcelImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);

                if (rows.length === 0) {
                    showToast('No data found in file', 'error');
                    return;
                }

                const studentsToAdd = rows
                    .filter(r => r.Name || r.name || r.NAME)
                    .map(r => ({
                        name: (r.Name || r.name || r.NAME || '').toString().trim(),
                        room: (r.Room || r.room || r.ROOM || '').toString().trim()
                    }))
                    .filter(s => s.name.length > 0);

                if (studentsToAdd.length === 0) {
                    showToast('No valid student names found. Use "Name" column header.', 'error');
                    return;
                }

                await addStudentsBatch(studentsToAdd, selectedClass.id, selectedClass.name);
                showToast(`${studentsToAdd.length} students imported`, 'success');
            } catch (err) {
                showToast('Error reading file: ' + err.message, 'error');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    // ─── Class list view ───
    if (!selectedClass) {
        return (
            <>
                <div className="header">
                    <h1>Students</h1>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => { setClassForm(''); setEditClassId(null); setShowClassModal(true); }}
                    style={{ marginBottom: 16 }}
                >
                    <Plus size={16} strokeWidth={2} /> Create Class
                </button>

                {classes.length === 0 ? (
                    <div className="empty-state">
                        <Users size={36} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 8 }} />
                        <p>No classes created yet</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Create a class to start adding students</p>
                    </div>
                ) : (
                    <div className="class-grid">
                        {classes.map(cls => {
                            const count = students.filter(s => s.classId === cls.id).length;
                            return (
                                <div key={cls.id} className="class-card" onClick={() => setSelectedClass(cls)}>
                                    <div className="class-card-header">
                                        <h3>{cls.name}</h3>
                                        <div className="class-card-actions" onClick={e => e.stopPropagation()}>
                                            <button
                                                className="btn-icon-sm"
                                                onClick={() => {
                                                    setClassForm(cls.name);
                                                    setEditClassId(cls.id);
                                                    setShowClassModal(true);
                                                }}
                                            >
                                                <Pencil size={14} strokeWidth={1.5} />
                                            </button>
                                            <button
                                                className="btn-icon-sm"
                                                onClick={() => setConfirmDeleteClass(cls)}
                                            >
                                                <Trash2 size={14} strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="class-card-count">
                                        <Users size={14} strokeWidth={1.5} />
                                        <span>{count} student{count !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Create/Edit Class Modal */}
                {showClassModal && (
                    <div className="modal-overlay" onClick={() => setShowClassModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h3>{editClassId ? 'Edit Class' : 'Create Class'}</h3>
                            <div className="form-group">
                                <label>Class Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. 10th A"
                                    value={classForm}
                                    onChange={e => setClassForm(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleAddClass()}
                                />
                            </div>
                            <div className="btn-row">
                                <button className="btn btn-outline btn-sm" onClick={() => setShowClassModal(false)}>Cancel</button>
                                <button className="btn btn-primary btn-sm" onClick={handleAddClass}>
                                    {editClassId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Class Confirm */}
                {confirmDeleteClass && (
                    <div className="modal-overlay" onClick={() => setConfirmDeleteClass(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h3>Delete Class?</h3>
                            <p className="confirm-text">
                                This will permanently delete <strong>{confirmDeleteClass.name}</strong> and all students in it.
                            </p>
                            <div className="btn-row">
                                <button className="btn btn-outline btn-sm" onClick={() => setConfirmDeleteClass(null)}>Cancel</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClass(confirmDeleteClass)}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // ─── Students inside a class ───
    return (
        <>
            <div className="header">
                <button className="back-btn" onClick={() => { setSelectedClass(null); setSearch(''); }}>
                    <ArrowLeft size={16} strokeWidth={1.5} /> Classes
                </button>
            </div>

            <p className="section-title" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
                {selectedClass.name}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                {classStudents.length} student{classStudents.length !== 1 ? 's' : ''}
            </p>

            {/* Action buttons */}
            <div className="action-bar">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { resetStudentForm(); setShowStudentModal(true); }}
                >
                    <Plus size={14} strokeWidth={2} /> Add
                </button>
                <button
                    className="btn btn-outline btn-sm"
                    onClick={() => fileRef.current?.click()}
                >
                    <Upload size={14} strokeWidth={1.5} /> Import Excel
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={handleExcelImport}
                />
            </div>

            {/* Search */}
            {classStudents.length > 0 && (
                <div className="search-box">
                    <Search size={16} strokeWidth={1.5} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            )}

            {/* Student list */}
            <div className="student-list">
                {filteredClassStudents.length === 0 ? (
                    <div className="empty-state">
                        <Users size={36} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 8 }} />
                        <p>{classStudents.length === 0 ? 'No students in this class' : 'No matches'}</p>
                    </div>
                ) : (
                    filteredClassStudents.map(s => (
                        <div key={s.id} className="student-item" style={{ cursor: 'default' }}>
                            <div className="student-info">
                                <h4>{s.name}</h4>
                                <p>{s.room || 'No room'}</p>
                            </div>
                            <div className="btn-row">
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => {
                                        setStudentForm({ name: s.name, room: s.room || '' });
                                        setEditStudentId(s.id);
                                        setShowStudentModal(true);
                                    }}
                                >
                                    <Pencil size={14} strokeWidth={1.5} />
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(s)}>
                                    <Trash2 size={14} strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Student Modal */}
            {showStudentModal && (
                <div className="modal-overlay" onClick={resetStudentForm}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>{editStudentId ? 'Edit Student' : 'Add Student'}</h3>

                        <div className="form-group">
                            <label>Student Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter full name"
                                value={studentForm.name}
                                onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Room No.</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. A-101"
                                value={studentForm.room}
                                onChange={e => setStudentForm({ ...studentForm, room: e.target.value })}
                            />
                        </div>

                        <div className="btn-row">
                            <button className="btn btn-outline btn-sm" onClick={resetStudentForm}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleAddStudent}>
                                {editStudentId ? 'Update' : 'Add Student'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Student Confirm */}
            {confirmDelete && (
                <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Delete Student?</h3>
                        <p className="confirm-text">
                            This will permanently delete <strong>{confirmDelete.name}</strong> and all their violation records.
                        </p>
                        <div className="btn-row">
                            <button className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStudent(confirmDelete.id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
