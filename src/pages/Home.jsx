import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <>
            <div className="header">
                <h1>🕌 Managea</h1>
            </div>

            <nav className="nav-grid">
                <Link to="/mark" className="nav-card">
                    <div className="nav-card-icon">⚠️</div>
                    <div className="nav-card-text">
                        <h3>Mark Violation</h3>
                        <p>Record prayer & school violations</p>
                    </div>
                </Link>

                <Link to="/records" className="nav-card">
                    <div className="nav-card-icon">📋</div>
                    <div className="nav-card-text">
                        <h3>Records</h3>
                        <p>View all student fines & history</p>
                    </div>
                </Link>

                <Link to="/students" className="nav-card">
                    <div className="nav-card-icon">👥</div>
                    <div className="nav-card-text">
                        <h3>Add / Edit Students</h3>
                        <p>Manage student database</p>
                    </div>
                </Link>

                <Link to="/dashboard" className="nav-card">
                    <div className="nav-card-icon">📊</div>
                    <div className="nav-card-text">
                        <h3>Dashboard</h3>
                        <p>Live stats & analytics</p>
                    </div>
                </Link>
            </nav>
        </>
    );
}
