import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    onSnapshot,
    orderBy,
    serverTimestamp,
    increment,
    writeBatch
} from 'firebase/firestore';

// ─── Fine structure ───
export const FINE_MAP = {
    'Absent': 50,
    'Masbooq': 25,
    'No Cap': 25,
    'Late to School': 25
};

export const PRAYERS = ['Subh', 'Luhar', 'Asar', 'Magrib', 'Isha'];

// ─── Classes ───

export function subscribeClasses(callback) {
    const q = query(collection(db, 'classes'), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
        const classes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(classes);
    });
}

export async function addClass(name) {
    return addDoc(collection(db, 'classes'), {
        name: name.trim(),
        createdAt: serverTimestamp()
    });
}

export async function updateClass(id, name) {
    return updateDoc(doc(db, 'classes', id), { name: name.trim() });
}

export async function deleteClass(id) {
    // Delete all students in this class and their violations
    const studentsQ = query(collection(db, 'students'), where('classId', '==', id));
    const studentsSnap = await getDocs(studentsQ);
    const batch = writeBatch(db);

    for (const studentDoc of studentsSnap.docs) {
        const violationsQ = query(collection(db, 'violations'), where('studentId', '==', studentDoc.id));
        const violationsSnap = await getDocs(violationsQ);
        violationsSnap.docs.forEach(d => batch.delete(d.ref));
        batch.delete(studentDoc.ref);
    }

    batch.delete(doc(db, 'classes', id));
    return batch.commit();
}

// ─── Students ───

export function subscribeStudents(callback) {
    const q = query(collection(db, 'students'), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
        const students = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(students);
    });
}

export async function addStudent(student) {
    return addDoc(collection(db, 'students'), {
        name: student.name.trim(),
        room: student.room?.trim() || '',
        class: student.class?.trim() || '',
        classId: student.classId || '',
        totalFine: 0,
        createdAt: serverTimestamp()
    });
}

export async function addStudentsBatch(studentsArray, classId, className) {
    const batch = writeBatch(db);
    studentsArray.forEach(s => {
        const ref = doc(collection(db, 'students'));
        batch.set(ref, {
            name: s.name.trim(),
            room: s.room?.trim() || '',
            class: className || '',
            classId: classId || '',
            totalFine: 0,
            createdAt: serverTimestamp()
        });
    });
    return batch.commit();
}

export async function updateStudent(id, data) {
    return updateDoc(doc(db, 'students', id), data);
}

export async function deleteStudent(id) {
    const q = query(collection(db, 'violations'), where('studentId', '==', id));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'students', id));
    return batch.commit();
}

// ─── Violations ───

export function subscribeViolations(callback) {
    const q = query(collection(db, 'violations'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const violations = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(violations);
    });
}

export async function checkDuplicate(studentId, date, prayer, type) {
    // For Late to School, prayer is N/A — check student+date+type
    const q = query(
        collection(db, 'violations'),
        where('studentId', '==', studentId),
        where('date', '==', date),
        where('prayer', '==', prayer),
        where('type', '==', type)
    );
    const snap = await getDocs(q);
    return !snap.empty;
}

export async function addViolation(violation) {
    const fine = FINE_MAP[violation.type] || 0;

    // Check for duplicate
    const isDup = await checkDuplicate(
        violation.studentId,
        violation.date,
        violation.prayer,
        violation.type
    );
    if (isDup) {
        throw new Error('Duplicate: This violation has already been recorded for this student on this date.');
    }

    // Add violation
    await addDoc(collection(db, 'violations'), {
        studentId: violation.studentId,
        studentName: violation.studentName,
        date: violation.date,
        prayer: violation.prayer,
        type: violation.type,
        fine: fine,
        createdAt: serverTimestamp()
    });

    // Update student total fine
    await updateDoc(doc(db, 'students', violation.studentId), {
        totalFine: increment(fine)
    });

    return fine;
}

export async function deleteViolation(violationId, studentId, fine) {
    await deleteDoc(doc(db, 'violations', violationId));
    await updateDoc(doc(db, 'students', studentId), {
        totalFine: increment(-fine)
    });
}

export async function clearStudentViolations(studentId) {
    const q = query(collection(db, 'violations'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    let totalFine = 0;
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
        totalFine += d.data().fine || 0;
        batch.delete(d.ref);
    });
    batch.update(doc(db, 'students', studentId), { totalFine: 0 });
    return batch.commit();
}

export async function clearAllViolations(students) {
    // Delete all violations and reset all student fines
    const vSnap = await getDocs(collection(db, 'violations'));
    const batch = writeBatch(db);
    vSnap.docs.forEach(d => batch.delete(d.ref));
    students.forEach(s => {
        batch.update(doc(db, 'students', s.id), { totalFine: 0 });
    });
    return batch.commit();
}
