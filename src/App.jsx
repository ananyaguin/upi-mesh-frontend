
import React from "react";
import { useEffect, useMemo, useState } from "react";
const API_URL = "http://localhost:8080/api";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Cpu,
  History,
  Home,
  KeyRound,
  Menu,
  Network,
  Radio,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Wallet,
  Wifi,
  X,
  Zap
} from "lucide-react";
import { api } from "./api";

const fallbackAccounts = [
  { vpa: "alice@demo", holderName: "Alice", balance: 1000 },
  { vpa: "bob@demo", holderName: "Bob", balance: 1000 },
  { vpa: "charlie@demo", holderName: "Charlie", balance: 1000 },
  { vpa: "david@demo", holderName: "David", balance: 1000 }
];

function money(value) {
  const n = Number(value || 0);
  return `₹ ${n.toLocaleString("en-IN")}`;
}

function normalizeAccount(a) {
  return {
    vpa: a.vpa ?? a.virtualPaymentAddress ?? "unknown@demo",
    holderName: a.holderName ?? a.name ?? "Account",
    balance: Number(a.balance ?? 0)
  };
}

function App() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [mesh, setMesh] = useState({ devices: [], idempotencyCacheSize: 0 });
  const [serverOnline, setServerOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [active, setActive] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [from, setFrom] = useState("alice@demo");
  const [to, setTo] = useState("bob@demo");
  const [amount, setAmount] = useState("100");
  const [pin, setPin] = useState("1234");
  const [ttl, setTtl] = useState("5");

  async function refresh() {
    setLoading(true);
    try {
      const [a, t, m] = await Promise.all([
        api.getAccounts(),
        api.getTransactions(),
        api.getMeshState()
      ]);
      setAccounts(Array.isArray(a) ? a.map(normalizeAccount) : []);
      setTransactions(Array.isArray(t) ? t : []);
      setMesh(m || { devices: [], idempotencyCacheSize: 0 });
      setServerOnline(true);
    } catch (e) {
      console.error(e);
      setServerOnline(false);
      setMessage("Backend is not reachable. Start Spring Boot on port 8080.");
      setAccounts(fallbackAccounts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0),
    [accounts]
  );

  const deviceCount = mesh.devices?.length || 0;

  async function sendPayment(e) {
    e.preventDefault();

    if (!from || !to || from === to || Number(amount) <= 0 || !pin) {
      setMessage("Choose different sender/receiver and enter a valid amount and PIN.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const result = await api.sendPayment({
        senderVpa: from,
        receiverVpa: to,
        amount: Number(amount),
        pin,
        ttl: Number(ttl),
        startDevice: "phone-alice"
      });

      setMessage(`Payment packet created: ${result.packetId}`);
      await refresh();
    } catch (e) {
      setMessage(`Payment failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function runMeshAction(action, label) {
    setBusy(true);
    setMessage("");
    try {
      const result = await action();
      setMessage(`${label} completed.`);
      console.log(result);
      await refresh();
    } catch (e) {
      setMessage(`${label} failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  const nav = [
    { name: "Dashboard", icon: Home },
    { name: "Accounts", icon: Wallet },
    { name: "Send Money", icon: Send },
    { name: "Transactions", icon: History },
    { name: "Mesh Network", icon: Network },
    { name: "Settings", icon: Settings }
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><Radio size={30} /></div>
          <div>
            <div className="brand-name">UPI Mesh</div>
            <div className="brand-sub">Payments Without Internet</div>
          </div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="nav">
          {nav.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${active === name ? "active" : ""}`}
              onClick={() => {
                setActive(name);
                setMobileOpen(false);
              }}
            >
              <Icon size={20} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="tower">
            <Radio size={48} />
          </div>
          <div className="offline-copy">
            <strong>Offline today,</strong>
            <span>Connected tomorrow ♥</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMobileOpen(true)}>
            <Menu />
          </button>

          <div className="connection">
            <span className={`status-dot ${serverOnline ? "online" : ""}`} />
            {serverOnline ? "Backend Connected" : "Backend Offline"}
          </div>

          <button className="icon-button" onClick={refresh} title="Refresh">
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>

          <div className="profile">
            <div className="avatar">A</div>
            <span>alice@demo</span>
            <ChevronDown size={16} />
          </div>
        </header>

        <div className="content">
          <section className="hero">
            <div>
              <div className="eyebrow">UPI MESH NETWORK</div>
              <h1>Good morning, Ananya <span>☀️</span></h1>
              <p>Your UPI mesh network is active. Make payments even without internet.</p>
            </div>
            <div className="hero-actions">
              <button className="secondary-btn" onClick={() => runMeshAction(api.gossip, "Gossip")}>
                <Network size={17} /> Gossip
              </button>
              <button className="primary-btn small" onClick={() => runMeshAction(api.flush, "Flush")}>
                <Wifi size={17} /> Flush
              </button>
            </div>
          </section>

          {message && (
            <div className={`toast ${message.includes("failed") || message.includes("not reachable") ? "error" : ""}`}>
              <CheckCircle2 size={18} />
              <span>{message}</span>
              <button onClick={() => setMessage("")}>×</button>
            </div>
          )}

          {active === "Dashboard" && (
            <>
              <section className="stats-grid">
                <StatCard icon={<Wallet />} title="Total Balance" value={money(totalBalance)} note={`Across ${accounts.length} accounts`} />
                <StatCard icon={<CircleDollarSign />} title="Total Accounts" value={accounts.length} note="Demo accounts seeded" green />
                <StatCard icon={<Network />} title="Mesh Devices" value={deviceCount} note="Online / Offline nodes" />
                <StatCard icon={<History />} title="Transactions" value={transactions.length} note="Latest records" purple />
              </section>

              <section className="dashboard-grid">
                <SendMoney
                  accounts={accounts.length ? accounts : fallbackAccounts}
                  from={from}
                  to={to}
                  amount={amount}
                  pin={pin}
                  ttl={ttl}
                  setFrom={setFrom}
                  setTo={setTo}
                  setAmount={setAmount}
                  setPin={setPin}
                  setTtl={setTtl}
                  onSubmit={sendPayment}
                  busy={busy}
                />

                <MeshCard mesh={mesh} />

                <AccountsCard accounts={accounts.length ? accounts : fallbackAccounts} />
              </section>

              <section className="bottom-grid">
                <TransactionsCard transactions={transactions} />
                <ActivityCard mesh={mesh} />
              </section>
            </>
          )}

          {active === "Accounts" && (
            <FullSection title="My Accounts" icon={<Wallet />}>
              <div className="account-list large">
                {(accounts.length ? accounts : fallbackAccounts).map((a, i) => (
                  <AccountRow key={a.vpa} account={a} index={i} />
                ))}
              </div>
            </FullSection>
          )}

          {active === "Send Money" && (
            <div className="single-page">
              <SendMoney
                accounts={accounts.length ? accounts : fallbackAccounts}
                from={from}
                to={to}
                amount={amount}
                pin={pin}
                ttl={ttl}
                setFrom={setFrom}
                setTo={setTo}
                setAmount={setAmount}
                setPin={setPin}
                setTtl={setTtl}
                onSubmit={sendPayment}
                busy={busy}
                full
              />
            </div>
          )}

          {active === "Transactions" && (
            <FullSection title="Transaction History" icon={<History />}>
              <TransactionsCard transactions={transactions} full />
            </FullSection>
          )}

          {active === "Mesh Network" && (
            <FullSection title="Mesh Network" icon={<Network />}>
              <div className="mesh-page-grid">
                <MeshCard mesh={mesh} large />
                <div className="action-card">
                  <div className="card-heading">
                    <div className="heading-icon"><Zap size={20} /></div>
                    <div>
                      <h3>Simulator Controls</h3>
                      <p>Move packets through the offline mesh.</p>
                    </div>
                  </div>
                  <div className="action-stack">
                    <button className="primary-btn" onClick={() => runMeshAction(api.gossip, "Gossip")}>
                      <Network size={18} /> Run Mesh Gossip
                    </button>
                    <button className="secondary-btn wide" onClick={() => runMeshAction(api.flush, "Flush")}>
                      <Wifi size={18} /> Flush to Bridge
                    </button>
                    <button className="danger-btn" onClick={() => runMeshAction(api.reset, "Reset")}>
                      Reset Mesh
                    </button>
                  </div>
                </div>
              </div>
            </FullSection>
          )}

          {active === "Settings" && (
            <FullSection title="Settings" icon={<Settings />}>
              <div className="settings-card">
                <div className="setting-row">
                  <div>
                    <strong>Backend API</strong>
                    <span>http://localhost:8080/api</span>
                  </div>
                  <span className={serverOnline ? "pill success" : "pill danger"}>{serverOnline ? "Connected" : "Offline"}</span>
                </div>
                <div className="setting-row">
                  <div>
                    <strong>Security</strong>
                    <span>RSA-2048 + AES-256-GCM</span>
                  </div>
                  <ShieldCheck size={22} />
                </div>
                <div className="setting-row">
                  <div>
                    <strong>Idempotency cache</strong>
                    <span>Duplicate payment protection</span>
                  </div>
                  <span className="pill">{mesh.idempotencyCacheSize ?? 0}</span>
                </div>
              </div>
            </FullSection>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, note, green, purple }) {
  return (
    <div className={`stat-card ${green ? "green" : ""} ${purple ? "purple" : ""}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <span className="stat-title">{title}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}

function SendMoney({ accounts, from, to, amount, pin, ttl, setFrom, setTo, setAmount, setPin, setTtl, onSubmit, busy, full }) {
  return (
    <div className={`panel send-panel ${full ? "full-panel" : ""}`}>
      <div className="card-heading">
        <div className="heading-icon blue"><Send size={20} /></div>
        <div>
          <h3>Send Money</h3>
          <p>Make a payment through the UPI mesh network.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <label>From</label>
        <select value={from} onChange={e => setFrom(e.target.value)}>
          {accounts.map(a => <option key={a.vpa} value={a.vpa}>{a.vpa} ({money(a.balance)})</option>)}
        </select>

        <label>To</label>
        <select value={to} onChange={e => setTo(e.target.value)}>
          {accounts.filter(a => a.vpa !== from).map(a => <option key={a.vpa} value={a.vpa}>{a.vpa} ({money(a.balance)})</option>)}
        </select>

        <label>Amount</label>
        <div className="input-prefix">
          <span>₹</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="1" />
        </div>

        <label>PIN</label>
        <div className="input-prefix">
          <KeyRound size={17} />
          <input value={pin} onChange={e => setPin(e.target.value)} type="password" maxLength="8" />
        </div>

        <label>TTL (minutes)</label>
        <select value={ttl} onChange={e => setTtl(e.target.value)}>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="15">15</option>
        </select>

        <button className="primary-btn submit" disabled={busy}>
          {busy ? <RefreshCw className="spin" size={18} /> : <Send size={18} />}
          {busy ? "Processing..." : "Send Payment"}
        </button>
      </form>
    </div>
  );
}

function MeshCard({ mesh, large }) {
  const devices = mesh.devices || [];
  const positions = [
    { x: 50, y: 22 },
    { x: 23, y: 65 },
    { x: 77, y: 65 },
    { x: 50, y: 84 }
  ];

  return (
    <div className={`panel mesh-panel ${large ? "large-panel" : ""}`}>
      <div className="card-heading">
        <div className="heading-icon blue"><Network size={20} /></div>
        <div>
          <h3>Mesh Network</h3>
          <p>{devices.length || 0} devices</p>
        </div>
        <span className="pill success">Live</span>
      </div>

      <div className="mesh-visual">
        <svg className="mesh-lines" viewBox="0 0 100 100">
          <line x1="50" y1="22" x2="23" y2="65" />
          <line x1="50" y1="22" x2="77" y2="65" />
          <line x1="23" y1="65" x2="50" y2="84" />
          <line x1="77" y1="65" x2="50" y2="84" />
          <line x1="50" y1="22" x2="50" y2="84" />
        </svg>

        {positions.map((pos, i) => {
          const d = devices[i];
          return (
            <div
              key={i}
              className="mesh-node"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className={`node-circle node-${i}`}>
                {i === 3 ? <Radio size={25} /> : <Smartphone size={25} />}
              </div>
              <strong>{d?.deviceId || ["phone-alice", "phone-bob", "phone-charlie", "bridge-node"][i]}</strong>
              <small>● Packets: {d?.packetCount ?? 0}</small>
            </div>
          );
        })}
      </div>

      <div className="info-strip">
        <ShieldCheck size={18} />
        <span>Packets are shared between devices through mesh gossip and reach the bridge when internet is available.</span>
      </div>
    </div>
  );
}

function AccountsCard({ accounts }) {
  return (
    <div className="panel accounts-panel">
      <div className="card-heading">
        <div className="heading-icon purple-icon"><Wallet size={20} /></div>
        <div><h3>My Accounts</h3><p>Demo wallet accounts</p></div>
        <ArrowRight size={18} />
      </div>
      <div className="account-list">
        {accounts.map((a, i) => <AccountRow key={a.vpa} account={a} index={i} />)}
      </div>
      <div className="security-note">
        <ShieldCheck size={19} />
        <span>Your payments are encrypted with RSA + AES-256-GCM for secure transmission across the mesh.</span>
      </div>
    </div>
  );
}

function AccountRow({ account, index }) {
  return (
    <div className="account-row">
      <div className={`account-avatar av-${index % 4}`}>{account.holderName?.[0] || "A"}</div>
      <div className="account-meta">
        <strong>{account.holderName}</strong>
        <span>{account.vpa}</span>
      </div>
      <strong className="balance">{money(account.balance)}</strong>
    </div>
  );
}

function TransactionsCard({ transactions, full }) {
  return (
    <div className={`panel transactions-panel ${full ? "full-panel" : ""}`}>
      <div className="card-heading">
        <div className="heading-icon green-icon"><History size={20} /></div>
        <div><h3>Recent Transactions</h3><p>{transactions.length} records from backend</p></div>
      </div>

      {transactions.length === 0 ? (
        <div className="empty">No transactions yet. Send a demo payment to create one.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>From → To</th><th>Amount</th><th>Status</th><th>Time</th></tr>
            </thead>
            <tbody>
              {transactions.slice(0, 20).map((t, i) => (
                <tr key={t.id ?? i}>
                  <td>#{t.id ?? `TX${String(i + 1).padStart(4, "0")}`}</td>
                  <td>{t.senderVpa ?? t.fromVpa ?? t.sender ?? "—"} → {t.receiverVpa ?? t.toVpa ?? t.receiver ?? "—"}</td>
                  <td>{money(t.amount)}</td>
                  <td><span className="status-pill"><CheckCircle2 size={13} /> SUCCESS</span></td>
                  <td>{t.createdAt ? new Date(t.createdAt).toLocaleString() : "Recent"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ActivityCard({ mesh }) {
  const packetTotal = (mesh.devices || []).reduce((sum, d) => sum + Number(d.packetCount || 0), 0);
  return (
    <div className="panel activity-panel">
      <div className="card-heading">
        <div className="heading-icon orange-icon"><Activity size={20} /></div>
        <div><h3>Mesh Activity</h3><p>Current simulator state</p></div>
      </div>
      <div className="timeline">
        <TimelineItem color="green" title="Backend connected" text="Spring Boot API is available on port 8080." />
        <TimelineItem color="blue" title="Mesh state loaded" text={`${mesh.devices?.length || 0} devices detected.`} />
        <TimelineItem color="purple" title="Packets in mesh" text={`${packetTotal} packets currently held by devices.`} />
        <TimelineItem color="orange" title="Idempotency cache" text={`${mesh.idempotencyCacheSize ?? 0} packet keys cached.`} />
      </div>
    </div>
  );
}

function TimelineItem({ color, title, text }) {
  return (
    <div className="timeline-item">
      <span className={`timeline-dot ${color}`} />
      <div><strong>{title}</strong><p>{text}</p></div>
    </div>
  );
}

function FullSection({ title, icon, children }) {
  return (
    <section className="full-section">
      <div className="page-title"><div className="heading-icon blue">{icon}</div><div><h2>{title}</h2><p>Powered by your Spring Boot backend</p></div></div>
      {children}
    </section>
  );
}

export default App;