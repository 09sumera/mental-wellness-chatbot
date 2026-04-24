import { useState } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────
const CRISIS_LINES = [
    { name: "iCall", number: "9152987821", region: "🇮🇳 India", desc: "Free psychological counselling by TISS-trained professionals." },
    { name: "Vandrevala Foundation", number: "1860-2662-345", region: "🇮🇳 India", desc: "24/7 mental health helpline — call or WhatsApp." },
    { name: "AASRA", number: "9820466627", region: "🇮🇳 India", desc: "24/7 crisis intervention for suicidal ideation." },
    { name: "Snehi", number: "044-24640050", region: "🇮🇳 India", desc: "Emotional support for those in distress." },
    { name: "International Association", number: "findahelpline.com", region: "🌍 Global", desc: "Directory of crisis lines worldwide.", isLink: true },
];

const RESOURCE_CATEGORIES = [
    {
        icon: "🧘",
        title: "Mindfulness & Meditation",
        color: "#4ecdc4",
        items: [
            { label: "Headspace", url: "https://www.headspace.com", desc: "Guided meditations and sleep tools." },
            { label: "Insight Timer", url: "https://insighttimer.com", desc: "Largest free library of meditations." },
            { label: "Calm", url: "https://www.calm.com", desc: "Sleep stories, breathing, and meditation." },
        ],
    },
    {
        icon: "📚",
        title: "Self-Help & Learning",
        color: "#f2c97e",
        items: [
            { label: "Mind.org.uk", url: "https://www.mind.org.uk", desc: "Practical mental health information and guides." },
            { label: "MentalHealth.gov", url: "https://www.mentalhealth.gov", desc: "US government mental health resource hub." },
            { label: "iCall Resources", url: "https://icallhelpline.org", desc: "Indian counselling articles and self-help tools." },
        ],
    },
    {
        icon: "🤝",
        title: "Community & Peer Support",
        color: "#d4a8f2",
        items: [
            { label: "7 Cups", url: "https://www.7cups.com", desc: "Free online chat with trained listeners." },
            { label: "Reddit r/mentalhealth", url: "https://reddit.com/r/mentalhealth", desc: "Community discussion and peer support." },
            { label: "TalkLife", url: "https://www.talklife.com", desc: "Safe peer-to-peer support network." },
        ],
    },
    {
        icon: "🧠",
        title: "Therapy & Professional Help",
        color: "#82a8f2",
        items: [
            { label: "BetterHelp", url: "https://www.betterhelp.com", desc: "Online therapy with licensed counsellors." },
            { label: "Practo", url: "https://www.practo.com", desc: "Find psychiatrists and therapists in India." },
            { label: "Wysa", url: "https://www.wysa.io", desc: "AI + human therapist mental wellness app." },
        ],
    },
];

const COPING_TECHNIQUES = [
    { icon: "🌬️", title: "Box Breathing", desc: "Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 4 times to calm the nervous system." },
    { icon: "👁️", title: "5-4-3-2-1 Grounding", desc: "Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste." },
    { icon: "📓", title: "Journaling", desc: "Write freely for 5 minutes without editing. Let your unfiltered thoughts flow onto the page." },
    { icon: "🚶", title: "Mindful Walking", desc: "Take a 10-min walk focusing entirely on the sensation of each step and your surroundings." },
    { icon: "💪", title: "Progressive Relaxation", desc: "Tense each muscle group for 5 seconds then release, working from toes to forehead." },
    { icon: "🎵", title: "Music Therapy", desc: "Listen to a curated calm playlist. Music at 60 BPM syncs with resting heart rate." },
];

function CrisisCard({ line }) {
    return (
        <div style={styles.crisisCard} className="card">
            <div style={styles.crisisLeft}>
                <span style={styles.crisisRegion}>{line.region}</span>
                <span style={styles.crisisName}>{line.name}</span>
                <span style={styles.crisisDesc}>{line.desc}</span>
            </div>
            {line.isLink ? (
                <a href={`https://${line.number}`} target="_blank" rel="noreferrer" className="btn btn-danger" style={styles.crisisBtn}>
                    Visit ↗
                </a>
            ) : (
                <a href={`tel:${line.number}`} className="btn btn-danger" style={styles.crisisBtn}>
                    📞 {line.number}
                </a>
            )}
        </div>
    );
}

function ResourceCategory({ cat }) {
    const [open, setOpen] = useState(false);

    return (
        <div style={{ ...styles.catCard, borderColor: open ? cat.color : "var(--border)" }} className="card">
            <button style={styles.catHeader} onClick={() => setOpen((o) => !o)}>
                <div style={styles.catLeft}>
                    <span style={{ ...styles.catIcon, background: `${cat.color}20`, color: cat.color }}>
                        {cat.icon}
                    </span>
                    <span style={styles.catTitle}>{cat.title}</span>
                </div>
                <span style={{ ...styles.chevron, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
                    ▾
                </span>
            </button>

            {open && (
                <div style={styles.catBody} className="fade-in">
                    {cat.items.map((item) => (
                        <a
                            key={item.label}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.resourceLink}
                            className="resource-item"
                        >
                            <div style={{ flex: 1 }}>
                                <p style={styles.resourceLabel}>{item.label} ↗</p>
                                <p style={styles.resourceDesc}>{item.desc}</p>
                            </div>
                            <span style={{ ...styles.resourceDot, background: cat.color }} />
                        </a>
                    ))}
                </div>
            )}
            <style>{`
                .resource-item:hover { background: rgba(255,255,255,0.03); }
            `}</style>
        </div>
    );
}

function CopingCard({ tech }) {
    return (
        <div style={styles.copingCard} className="card">
            <span style={styles.copingIcon}>{tech.icon}</span>
            <h4 style={styles.copingTitle}>{tech.title}</h4>
            <p style={styles.copingDesc}>{tech.desc}</p>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResourcesPage() {
    return (
        <div style={styles.page}>
            <div style={styles.inner}>

                {/* Header */}
                <div style={styles.header} className="fade-up">
                    <h1 style={styles.pageTitle}>Resources & Support</h1>
                    <p style={styles.pageSub}>
                        You don't have to face this alone. Here are trusted tools, communities, and helplines.
                    </p>
                </div>

                {/* Crisis section */}
                <section style={styles.section} className="fade-up delay-100">
                    <div style={styles.sectionHeader}>
                        <span style={styles.sectionIcon}>🚨</span>
                        <div>
                            <h2 style={styles.sectionTitle}>Crisis Helplines</h2>
                            <p style={styles.sectionSub}>If you are in immediate distress, please reach out right now.</p>
                        </div>
                    </div>
                    <div style={styles.crisisGrid}>
                        {CRISIS_LINES.map((line) => (
                            <CrisisCard key={line.name} line={line} />
                        ))}
                    </div>
                </section>

                {/* Coping techniques */}
                <section style={styles.section} className="fade-up delay-200">
                    <div style={styles.sectionHeader}>
                        <span style={styles.sectionIcon}>🌿</span>
                        <div>
                            <h2 style={styles.sectionTitle}>Quick Coping Techniques</h2>
                            <p style={styles.sectionSub}>Immediate grounding strategies you can use right now.</p>
                        </div>
                    </div>
                    <div style={styles.copingGrid}>
                        {COPING_TECHNIQUES.map((t) => (
                            <CopingCard key={t.title} tech={t} />
                        ))}
                    </div>
                </section>

                {/* Resource categories */}
                <section style={styles.section} className="fade-up delay-300">
                    <div style={styles.sectionHeader}>
                        <span style={styles.sectionIcon}>📖</span>
                        <div>
                            <h2 style={styles.sectionTitle}>Explore by Topic</h2>
                            <p style={styles.sectionSub}>Curated links to apps, communities, and professional services.</p>
                        </div>
                    </div>
                    <div style={styles.catGrid}>
                        {RESOURCE_CATEGORIES.map((cat) => (
                            <ResourceCategory key={cat.title} cat={cat} />
                        ))}
                    </div>
                </section>

                {/* Disclaimer */}
                <div style={styles.disclaimer} className="glass-panel fade-up delay-300">
                    <p>
                        <strong>Disclaimer:</strong> Serenova is a wellness companion, not a substitute for
                        professional mental health care. If you are experiencing a mental health crisis, please
                        contact a licensed professional or one of the helplines above.
                    </p>
                </div>

            </div>
        </div>
    );
}

const styles = {
    page: { flex: 1, padding: "32px 24px", overflowY: "auto" },
    inner: { maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "40px" },

    header: {},
    pageTitle: { color: "var(--text-primary)", marginBottom: "8px" },
    pageSub: { fontSize: "15px", color: "var(--text-secondary)", maxWidth: "600px" },

    section: { display: "flex", flexDirection: "column", gap: "20px" },
    sectionHeader: { display: "flex", alignItems: "flex-start", gap: "16px" },
    sectionIcon: { fontSize: "32px", marginTop: "2px", background: "var(--teal-glow)", padding: "10px", borderRadius: "12px", width: "52px", height: "52px", display: "flex", alignItems: "center", justifyContent: "center" },
    sectionTitle: { fontSize: "22px", color: "var(--text-primary)", marginBottom: "4px" },
    sectionSub: { fontSize: "14px", color: "var(--text-muted)" },

    crisisGrid: { display: "flex", flexDirection: "column", gap: "12px" },
    crisisCard: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px", gap: "20px",
        borderLeft: "4px solid var(--rose)"
    },
    crisisLeft: { display: "flex", flexDirection: "column", gap: "4px" },
    crisisRegion: { fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: "bold" },
    crisisName: { fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" },
    crisisDesc: { fontSize: "14px", color: "var(--text-secondary)" },
    crisisBtn: { padding: "10px 20px" },

    copingGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" },
    copingCard: { padding: "24px", display: "flex", flexDirection: "column", gap: "12px" },
    copingIcon: { fontSize: "32px" },
    copingTitle: { fontSize: "18px", color: "var(--text-primary)", fontWeight: "600" },
    copingDesc: { fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 },

    catGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" },
    catCard: { overflow: "hidden" },
    catHeader: {
        width: "100%", background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px", color: "var(--text-primary)",
    },
    catLeft: { display: "flex", alignItems: "center", gap: "16px" },
    catIcon: { width: 44, height: 44, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 },
    catTitle: { fontSize: "18px", color: "var(--text-primary)", fontWeight: "600" },
    chevron: { color: "var(--text-muted)", fontSize: "16px", transition: "transform var(--transition)" },
    catBody: { borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column" },
    resourceLink: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px", textDecoration: "none", gap: "12px",
        borderBottom: "1px solid var(--border)", transition: "background var(--transition)",
    },
    resourceLabel: { fontSize: "15px", fontWeight: 600, color: "var(--teal)", marginBottom: "4px" },
    resourceDesc: { fontSize: "13px", color: "var(--text-muted)" },
    resourceDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },

    disclaimer: {
        padding: "20px 24px",
        fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.7,
        borderLeft: "4px solid var(--teal)"
    },
};