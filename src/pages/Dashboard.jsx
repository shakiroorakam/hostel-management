import { useState, useEffect } from 'react';
import { subscribeStudents, subscribeViolations, PRAYERS } from '../firebaseService';
import { Users, IndianRupee, AlertTriangle, Clock, TrendingUp, Trophy } from 'lucide-react';

export default function Dashboard() {
    const [students, setStudents] = useState([]);
    const [violations, setViolations] = useState([]);

    useEffect(() => {
        const unsub1 = subscribeStudents(setStudents);
        const unsub2 = subscribeViolations(setViolations);
        return () => { unsub1(); unsub2(); };
    }, []);

    const totalFines = students.reduce((sum, s) => sum + (s.totalFine || 0), 0);

    const today = new Date().toISOString().split('T')[0];
    const todayViolations = violations.filter(v => v.date === today);

    const prayerCounts = {};
    PRAYERS.forEach(p => { prayerCounts[p] = 0; });
    violations.forEach(v => {
        if (v.prayer && v.prayer !== 'N/A' && prayerCounts[v.prayer] !== undefined) {
            prayerCounts[v.prayer]++;
        }
    });
    const maxPrayerCount = Math.max(...Object.values(prayerCounts), 1);

    const lateCount = violations.filter(v => v.type === 'Late to School').length;

    const typeCounts = {};
    violations.forEach(v => {
        typeCounts[v.type] = (typeCounts[v.type] || 0) + 1;
    });

    return (
        <>
            <div className="header">
                <h1>Managea</h1>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <Users size={20} strokeWidth={1.5} style={{ marginBottom: 6, opacity: 0.5 }} />
                    <div className="stat-value">{students.length}</div>
                    <div className="stat-label">Students</div>
                </div>
                <div className="stat-card">
                    <IndianRupee size={20} strokeWidth={1.5} style={{ marginBottom: 6, opacity: 0.5 }} />
                    <div className="stat-value">{totalFines}</div>
                    <div className="stat-label">Total Fines</div>
                </div>
                <div className="stat-card">
                    <AlertTriangle size={20} strokeWidth={1.5} style={{ marginBottom: 6, opacity: 0.5 }} />
                    <div className="stat-value">{todayViolations.length}</div>
                    <div className="stat-label">Today</div>
                </div>
                <div className="stat-card">
                    <Clock size={20} strokeWidth={1.5} style={{ marginBottom: 6, opacity: 0.5 }} />
                    <div className="stat-value">{lateCount}</div>
                    <div className="stat-label">Late</div>
                </div>
            </div>

            <p className="section-title">Prayer-wise Violations</p>
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="prayer-chart">
                    {PRAYERS.map(p => (
                        <div key={p} className="chart-bar-row">
                            <span className="chart-label">{p}</span>
                            <div className="chart-bar-track">
                                <div
                                    className={`chart-bar-fill ${p.toLowerCase()}`}
                                    style={{ width: `${(prayerCounts[p] / maxPrayerCount) * 100}%` }}
                                >
                                    {prayerCounts[p] > 0 ? prayerCounts[p] : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="section-title">Violation Breakdown</p>
            <div className="card" style={{ marginBottom: 16 }}>
                {Object.entries(typeCounts).length === 0 ? (
                    <div className="empty-state">
                        <p>No violations yet</p>
                    </div>
                ) : (
                    Object.entries(typeCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                            <div key={type} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 0',
                                borderBottom: '1px solid var(--border-light)'
                            }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{type}</span>
                                <span className="fine-badge fine-badge-gold">{count}</span>
                            </div>
                        ))
                )}
            </div>

            <p className="section-title">Top Fines</p>
            <div className="student-list">
                {students
                    .filter(s => s.totalFine > 0)
                    .sort((a, b) => b.totalFine - a.totalFine)
                    .slice(0, 5)
                    .map((s, i) => (
                        <div key={s.id} className="student-item" style={{ cursor: 'default' }}>
                            <div className="student-info">
                                <h4>{i + 1}. {s.name}</h4>
                                <p>{s.room || '-'}</p>
                            </div>
                            <span className="fine-badge fine-badge-red">{s.totalFine}</span>
                        </div>
                    ))}
                {students.filter(s => s.totalFine > 0).length === 0 && (
                    <div className="empty-state">
                        <Trophy size={32} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 8 }} />
                        <p>No fines recorded yet</p>
                    </div>
                )}
            </div>
        </>
    );
}
