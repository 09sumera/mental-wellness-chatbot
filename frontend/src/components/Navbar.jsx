import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
    { to: "/", label: "Chat", icon: "💬" },
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/resources", label: "Resources", icon: "📚" },
];

export default function Navbar() {
    const { pathname } = useLocation();

    return (
        <nav className="glass-panel" style={styles.nav}>
            {/* Brand */}
            <Link to="/" style={styles.brand}>
                <img src="/logo.png" alt="Serenova" style={{ height: "24px" }} />
                <span style={styles.brandText}>Serenova</span>
            </Link>

            {/* Links */}
            <div style={styles.links}>
                {NAV_LINKS.map(({ to, label, icon }) => (
                    <Link
                        key={to}
                        to={to}
                        style={pathname === to ? {...styles.link, ...styles.linkActive} : styles.link}
                    >
                        <span>{icon}</span>
                        <span>{label}</span>
                    </Link>
                ))}
            </div>

            {/* Right side placeholder */}
            <div style={styles.right}>
            </div>
        </nav>
    );
}

const styles = {
    nav: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        height: "64px",
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        borderRadius: 0,
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(10, 16, 21, 0.4)",
    },
    brand: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        textDecoration: "none",
    },
    brandIcon: { fontSize: "24px" },
    brandText: {
        fontFamily: "var(--font-display)",
        fontSize: "22px",
        color: "var(--teal)",
        letterSpacing: "-0.5px",
    },
    links: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    link: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        borderRadius: "var(--radius-xl)",
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--text-secondary)",
        textDecoration: "none",
        transition: "all var(--transition)",
    },
    linkActive: {
        background: "var(--teal-glow)",
        color: "var(--teal)",
        boxShadow: "0 0 10px rgba(78, 205, 196, 0.1)",
    },
    right: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
};