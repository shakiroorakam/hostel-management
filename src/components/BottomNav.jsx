import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, ClipboardList, Users } from 'lucide-react';

function NavItem({ to, end, icon: Icon, label }) {
    return (
        <NavLink to={to} end={end} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            {({ isActive }) => (
                <>
                    <Icon
                        size={22}
                        strokeWidth={isActive ? 2 : 1.5}
                        fill={isActive ? 'currentColor' : 'none'}
                    />
                    <span className="bottom-nav-label">{label}</span>
                </>
            )}
        </NavLink>
    );
}

export default function BottomNav() {
    return (
        <nav className="bottom-nav">
            <NavItem to="/" end icon={LayoutDashboard} label="Home" />
            <NavItem to="/mark" icon={AlertTriangle} label="Mark" />
            <NavItem to="/records" icon={ClipboardList} label="Records" />
            <NavItem to="/students" icon={Users} label="Students" />
        </nav>
    );
}
