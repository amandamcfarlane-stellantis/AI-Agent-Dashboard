import { useEffect, useMemo, useState } from "react";
import CodeBlock from "./components/CodeBlock";
import InfoBox from "./components/InfoBox";

type PageId = "dashboard" | "oidc" | "docs" | "auth" | "migration";
type DocTab = "All" | "Migration" | "Configuration" | "Reference";

type QuickCard = {
  id: number;
  title: string;
  tag: string;
  description: string;
  eta: string;
  icon: string;
  target: PageId;
};

type DocSection = {
  id: number;
  title: string;
  category: Exclude<DocTab, "All">;
  summary: string;
};

const COLORS = {
  bg: "#f4f6fa",
  sidebar: "#0d1117",
  primary: "#0052cc",
  success: "#00875a",
  warning: "#ff8b00",
  danger: "#de350b",
  purple: "#6554c0",
  text: "#0d1117",
  muted: "#5a6478"
};

const NAV_ITEMS: { id: PageId; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "◉" },
  { id: "oidc", label: "OIDC Quick Start Kit", icon: "◎" },
  { id: "docs", label: "Documentation Hub", icon: "◌" },
  { id: "auth", label: "Auth Flow Visualization", icon: "◈" },
  { id: "migration", label: "Migration Guide", icon: "◍" }
];

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: "Dashboard",
  oidc: "OIDC Quick Start Kit",
  docs: "Documentation Hub",
  auth: "Authentication Flow Visualization",
  migration: "Migration Guide"
};

const QUICK_CARDS: QuickCard[] = [
  {
    id: 1,
    title: "OIDC Quick Start",
    tag: "Configuration",
    description: "Register your app, request tokens, and validate JWT claims in under 20 minutes.",
    eta: "15 min",
    icon: "OIDC",
    target: "oidc"
  },
  {
    id: 2,
    title: "Migration Guide",
    tag: "Migration",
    description: "Move from SiteMinder headers to standards-based JWT propagation with minimal risk.",
    eta: "25 min",
    icon: "MIG",
    target: "migration"
  },
  {
    id: 3,
    title: "Orchestrator Docs",
    tag: "Reference",
    description: "Understand request orchestration, policy enforcement, and downstream token decisions.",
    eta: "18 min",
    icon: "ORC",
    target: "docs"
  },
  {
    id: 4,
    title: "Auth Flows",
    tag: "Configuration",
    description: "Explore sequence-level interaction details between user, app, federation, and APIs.",
    eta: "12 min",
    icon: "FLW",
    target: "auth"
  }
];

const DOC_SECTIONS: DocSection[] = [
  {
    id: 1,
    title: "SiteMinder to PingFederate Migration Guide",
    category: "Migration",
    summary: "Map trusted headers to signed claims and standardize identity propagation."
  },
  {
    id: 2,
    title: "Orchestrator Setup & Workflow",
    category: "Configuration",
    summary: "Configure policy routing and conditional authentication controls."
  },
  {
    id: 3,
    title: "Authentication Flow Documentation",
    category: "Reference",
    summary: "Endpoint catalog for authorization, token, introspection, and discovery."
  }
];

const FLOW_STEPS = [
  {
    id: 0,
    name: "User",
    detail: "User initiates login by clicking Sign In in the application.",
    request: "GET /login -> 302 to /authorize",
    code: `GET /authorize?client_id=dev-portal\n  &response_type=code\n  &scope=openid profile email\n  &redirect_uri=https://app.stellantis.dev/callback`
  },
  {
    id: 1,
    name: "Application",
    detail: "Application starts OIDC code flow and stores nonce/state for replay protection.",
    request: "302 Redirect to PingFederate /authorize",
    code: `const state = crypto.randomUUID();\nconst nonce = crypto.randomUUID();\nres.redirect(buildAuthorizeUrl({ state, nonce }));`
  },
  {
    id: 2,
    name: "PingFederate",
    detail: "Federation handles authentication and policy evaluation, then returns authorization code.",
    request: "302 callback?code=abc123&state=<state>",
    code: `POST /as/token.oauth2\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code&code=abc123`
  },
  {
    id: 3,
    name: "Token Exchange",
    detail: "Backend exchanges code for token set and validates signature, issuer, and audience.",
    request: "POST /token",
    code: `const token = await fetch(tokenEndpoint, { method: "POST", body });\nconst claims = verifyJwt(token.access_token, jwks);`
  },
  {
    id: 4,
    name: "API",
    detail: "Application calls internal APIs with access token in bearer header.",
    request: "GET /vehicle-profile with Authorization: Bearer <token>",
    code: `curl -H "Authorization: Bearer $ACCESS_TOKEN" \\\n  https://api.internal.stellantis.dev/vehicle-profile`
  }
] as const;

const sequenceArrows = [
  { row: 1, from: 1, to: 2, label: "1. Sign In" },
  { row: 2, from: 2, to: 3, label: "2. /authorize" },
  { row: 3, from: 3, to: 1, label: "3. Login Challenge" },
  { row: 4, from: 1, to: 3, label: "4. Credentials + MFA" },
  { row: 5, from: 3, to: 2, label: "5. auth code" },
  { row: 6, from: 2, to: 4, label: "6. /token" },
  { row: 7, from: 4, to: 2, label: "7. access token" },
  { row: 8, from: 2, to: 5, label: "8. API call" }
];

const mappingRows = [
  ["SM_USER", "sub"],
  ["SMGOV_DEPT", "stellantis_dept"],
  ["SM_EMAIL", "email"],
  ["SM_FIRSTNAME", "given_name"],
  ["SM_LASTNAME", "family_name"],
  ["SM_SESSIONID", "sid"]
];

function App() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [openOidcSteps, setOpenOidcSteps] = useState<Set<number>>(new Set([1]));
  const [docTab, setDocTab] = useState<DocTab>("All");
  const [docSearch, setDocSearch] = useState("");
  const [openDocs, setOpenDocs] = useState<Set<number>>(new Set([1]));
  const [activeFlow, setActiveFlow] = useState<number>(0);

  useEffect(() => {
    const onResize = () => {
      const nextIsMobile = window.innerWidth < 1024;
      setIsMobile(nextIsMobile);
      if (!nextIsMobile) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileNavOpen(false);
    }
  }, [isMobile]);

  const filteredQuickCards = useMemo(() => {
    const q = dashboardSearch.trim().toLowerCase();
    if (!q) return QUICK_CARDS;

    return QUICK_CARDS.filter((card) => {
      const haystack = `${card.title} ${card.tag} ${card.description} ${card.eta}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [dashboardSearch]);

  const filteredDocSections = useMemo(() => {
    const q = docSearch.trim().toLowerCase();

    return DOC_SECTIONS.filter((sec) => {
      const tabMatch = docTab === "All" ? true : sec.category === docTab;
      const textMatch = `${sec.title} ${sec.summary} ${sec.category}`.toLowerCase().includes(q);
      return tabMatch && textMatch;
    });
  }, [docSearch, docTab]);

  const completedCount = doneSteps.size;
  const progress = (completedCount / 4) * 100;

  const toggleDone = (step: number) => {
    setDoneSteps((prev) => {
      const next = new Set(prev);
      if (next.has(step)) {
        next.delete(step);
      } else {
        next.add(step);
      }
      return next;
    });
  };

  const toggleOpenOidc = (step: number) => {
    setOpenOidcSteps((prev) => {
      const next = new Set(prev);
      if (next.has(step)) {
        next.delete(step);
      } else {
        next.add(step);
      }
      return next;
    });
  };

  const toggleDocSection = (id: number) => {
    setOpenDocs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderDashboard = () => (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 18 }}>
      <div>
        <div
          style={{
            borderRadius: 16,
            padding: 24,
            color: "#f7faff",
            marginBottom: 16,
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(145deg, #0d1117 0%, #132339 42%, #1b2f4d 100%)"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.28,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)",
              backgroundSize: "24px 24px"
            }}
          />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>Stellantis Identity Developer Portal</div>
            <div style={{ opacity: 0.88, marginTop: 8, marginBottom: 16, maxWidth: 680 }}>
              Internal workspace for OIDC onboarding, policy orchestration, and SiteMinder migration execution.
            </div>
            <input
              value={dashboardSearch}
              onChange={(e) => setDashboardSearch(e.target.value)}
              placeholder="Search quick starts, docs, and guides..."
              style={{
                width: "100%",
                maxWidth: 520,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                borderRadius: 10,
                outline: "none",
                padding: "11px 12px"
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
            marginBottom: 16
          }}
        >
          {[
            { label: "Registered Apps", value: "147", accent: COLORS.primary },
            { label: "Active Tokens", value: "23.4K", accent: COLORS.success },
            { label: "Migrated Services", value: "38 / 52", accent: COLORS.warning },
            { label: "Dev Teams", value: "29", accent: COLORS.purple }
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #dde5f1",
                padding: 14,
                boxShadow: "0 6px 20px rgba(13,17,23,0.05)"
              }}
            >
              <div style={{ color: COLORS.muted, fontSize: 12 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: stat.accent }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12
          }}
        >
          {filteredQuickCards.map((card) => (
            <button
              key={card.id}
              onClick={() => setPage(card.target)}
              style={{
                textAlign: "left",
                cursor: "pointer",
                border: "1px solid #d9e3f0",
                borderRadius: 14,
                background: "#fff",
                padding: 14,
                boxShadow: "0 8px 18px rgba(13,17,23,0.04)",
                transition: "transform 0.15s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLORS.primary,
                    background: "#e8f0ff",
                    borderRadius: 999,
                    padding: "4px 8px"
                  }}
                >
                  {card.tag}
                </span>
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontWeight: 700,
                    fontSize: 12,
                    color: COLORS.purple
                  }}
                >
                  {card.icon}
                </span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 10 }}>{card.title}</div>
              <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 7, lineHeight: 1.45 }}>{card.description}</div>
              <div style={{ marginTop: 10, color: COLORS.success, fontWeight: 700, fontSize: 12 }}>Est. time: {card.eta}</div>
            </button>
          ))}
          {filteredQuickCards.length === 0 && (
            <div
              style={{
                borderRadius: 12,
                border: "1px dashed #c6d2e5",
                background: "#fff",
                padding: 16,
                color: COLORS.muted
              }}
            >
              No quick starts match your search.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <div style={{ border: "1px solid #dce4ef", background: "#fff", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent Updates</div>
          {[
            "Policy Engine v2.8 deployed to pre-prod",
            "Token introspection latency reduced by 22%",
            "New Java OIDC starter template published",
            "MFA provider failover policy validated"
          ].map((update) => (
            <div key={update} style={{ fontSize: 13, color: COLORS.muted, marginBottom: 8, lineHeight: 1.45 }}>
              • {update}
            </div>
          ))}
        </div>

        <div style={{ border: "1px solid #dce4ef", background: "#fff", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick Links</div>
          {["PingFederate Admin", "JWKS Endpoint", "Token Playground", "IAM On-call Runbook"].map((link) => (
            <button
              key={link}
              style={{
                width: "100%",
                marginBottom: 8,
                border: "1px solid #dde6f2",
                borderRadius: 8,
                background: "#f8faff",
                padding: "9px 10px",
                textAlign: "left",
                color: COLORS.primary,
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              {link}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOidc = () => {
    const scopes = ["openid", "profile", "email", "offline_access", "stellantis.vehicle.read", "stellantis.policy.execute"];

    return (
      <div>
        <div style={{ background: "#fff", border: "1px solid #dbe4f1", borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>Progress</div>
            <div style={{ color: COLORS.muted, fontSize: 13 }}>{completedCount} of 4 completed</div>
          </div>
          <div style={{ width: "100%", height: 10, borderRadius: 999, background: "#e4eaf4", overflow: "hidden" }}>
            <div
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.purple})`,
                height: "100%",
                transition: "width 260ms ease"
              }}
            />
          </div>
        </div>

        {[1, 2, 3, 4].map((step) => {
          const open = openOidcSteps.has(step);
          const done = doneSteps.has(step);

          return (
            <div key={step} style={{ background: "#fff", borderRadius: 12, border: "1px solid #dbe4f1", marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 14,
                  cursor: "pointer"
                }}
                onClick={() => toggleOpenOidc(step)}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {step}. {step === 1 && "Register app in PingFederate"}
                    {step === 2 && "Configure redirect URIs & scopes"}
                    {step === 3 && "Obtain access token"}
                    {step === 4 && "Validate JWT"}
                  </div>
                  <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                    {done ? "Completed" : "Pending"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDone(step);
                    }}
                    style={{
                      border: "1px solid #d1dceb",
                      borderRadius: 8,
                      padding: "7px 10px",
                      cursor: "pointer",
                      background: done ? "#e8f6f0" : "#f6f9fc",
                      color: done ? COLORS.success : COLORS.muted,
                      fontWeight: 700,
                      fontSize: 12
                    }}
                  >
                    {done ? "✓ Done" : "Mark done"}
                  </button>
                  <span style={{ color: COLORS.primary, fontWeight: 700 }}>{open ? "−" : "+"}</span>
                </div>
              </div>

              {open && (
                <div style={{ padding: "0 14px 14px" }}>
                  {step === 1 && (
                    <CodeBlock
                      language="json"
                      code={`{
  "client_id": "stellantis-dev-portal",
  "grant_types": ["authorization_code", "refresh_token"],
  "redirect_uris": ["https://dev.stellantis.internal/callback"],
  "token_endpoint_auth_method": "client_secret_post"
}`}
                    />
                  )}

                  {step === 2 && (
                    <>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: 10,
                          marginTop: 10
                        }}
                      >
                        {scopes.map((scope) => (
                          <div
                            key={scope}
                            style={{
                              border: "1px solid #dbe4f0",
                              borderRadius: 10,
                              padding: "10px 12px",
                              background: "#f9fbff",
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: 12
                            }}
                          >
                            {scope}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                      <CodeBlock
                        language="node"
                        code={`import axios from "axios";

const body = new URLSearchParams({
  grant_type: "authorization_code",
  code,
  redirect_uri: "https://dev.stellantis.internal/callback",
  client_id: process.env.CLIENT_ID!,
  client_secret: process.env.CLIENT_SECRET!
});

const { data } = await axios.post(tokenEndpoint, body);`}
                      />
                      <CodeBlock
                        language="java"
                        code={`HttpRequest request = HttpRequest.newBuilder()
  .uri(URI.create(tokenEndpoint))
  .header("Content-Type", "application/x-www-form-urlencoded")
  .POST(BodyPublishers.ofString(payload))
  .build();

HttpResponse<String> response = client.send(request, BodyHandlers.ofString());`}
                      />
                    </div>
                  )}

                  {step === 4 && (
                    <>
                      <CodeBlock
                        language="typescript"
                        code={`import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(new URL("https://pf.example.com/pf/JWKS"));
const { payload } = await jwtVerify(accessToken, JWKS, {
  issuer: "https://pf.example.com",
  audience: "stellantis-api"
});`}
                      />
                      <div
                        style={{
                          marginTop: 10,
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: 9
                        }}
                      >
                        {[
                          ["sub", "u-19231"],
                          ["iss", "https://pf.stellantis.internal"],
                          ["aud", "stellantis-api"],
                          ["exp", "1720055400"],
                          ["iat", "1720051800"],
                          ["email", "dev@stellantis.com"],
                          ["given_name", "Alex"],
                          ["stellantis_dept", "Powertrain Engineering"]
                        ].map(([k, v]) => (
                          <div
                            key={k}
                            style={{ border: "1px solid #dce4f1", borderRadius: 10, padding: 10, background: "#fbfdff" }}
                          >
                            <div style={{ color: COLORS.muted, fontSize: 11 }}>{k}</div>
                            <div
                              style={{
                                marginTop: 4,
                                fontFamily: "JetBrains Mono, monospace",
                                fontSize: 12,
                                wordBreak: "break-all"
                              }}
                            >
                              {v}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDocs = () => (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <input
          value={docSearch}
          onChange={(e) => setDocSearch(e.target.value)}
          placeholder="Search documentation..."
          style={{
            flex: 1,
            minWidth: 240,
            border: "1px solid #d7e2f0",
            borderRadius: 10,
            padding: "10px 12px",
            background: "#fff"
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["All", "Migration", "Configuration", "Reference"] as DocTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setDocTab(tab)}
              style={{
                border: `1px solid ${docTab === tab ? COLORS.primary : "#d8e3f1"}`,
                background: docTab === tab ? "#e8f0ff" : "#fff",
                color: docTab === tab ? COLORS.primary : COLORS.muted,
                borderRadius: 999,
                padding: "8px 12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredDocSections.map((section) => {
        const open = openDocs.has(section.id);

        return (
          <div key={section.id} style={{ border: "1px solid #dbe5f2", background: "#fff", borderRadius: 12, marginBottom: 12 }}>
            <button
              onClick={() => toggleDocSection(section.id)}
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{section.title}</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>{section.summary}</div>
              </div>
              <span style={{ color: COLORS.primary, fontWeight: 700 }}>{open ? "−" : "+"}</span>
            </button>

            {open && section.id === 1 && (
              <div style={{ padding: "0 14px 14px" }}>
                <div style={{ overflowX: "auto", border: "1px solid #dbe5f2", borderRadius: 10, marginBottom: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", background: "#fcfdff" }}>
                    <thead>
                      <tr style={{ background: "#f1f6ff" }}>
                        <th style={{ textAlign: "left", padding: 10, fontSize: 12 }}>SiteMinder Header</th>
                        <th style={{ textAlign: "left", padding: 10, fontSize: 12 }}>JWT Claim</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappingRows.map(([header, claim]) => (
                        <tr key={header}>
                          <td style={{ padding: 10, borderTop: "1px solid #e2e9f3", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
                            {header}
                          </td>
                          <td style={{ padding: 10, borderTop: "1px solid #e2e9f3", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
                            {claim}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <CodeBlock
                  language="typescript"
                  code={`const legacyToJwt: Record<string, string> = {
  SM_USER: "sub",
  SMGOV_DEPT: "stellantis_dept",
  SM_EMAIL: "email",
  SM_FIRSTNAME: "given_name"
};

export function mapHeadersToClaims(headers: Record<string, string>) {
  return Object.entries(legacyToJwt).reduce((acc, [header, claim]) => {
    if (headers[header]) acc[claim] = headers[header];
    return acc;
  }, {} as Record<string, string>);
}`}
                />
              </div>
            )}

            {open && section.id === 2 && (
              <div style={{ padding: "0 14px 14px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {["Application", "Orchestrator", "Policy Engine", "PingFederate", "MFA Provider", "Token"].map((item, idx) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          background: "#eef3ff",
                          color: COLORS.primary,
                          border: "1px solid #d6e2ff",
                          borderRadius: 999,
                          padding: "6px 10px",
                          fontWeight: 700,
                          fontSize: 12
                        }}
                      >
                        {item}
                      </span>
                      {idx < 5 && <span style={{ color: COLORS.muted }}>→</span>}
                    </div>
                  ))}
                </div>

                <CodeBlock
                  language="yaml"
                  code={`policy:
  id: stellantis-default
  routes:
    - when: path.startsWith('/vehicle')
      require:
        - scope: stellantis.vehicle.read
        - claim: stellantis_dept
    - when: risk_score > 70
      action: require_mfa
federation:
  provider: pingfederate
  issuer: https://pf.stellantis.internal`}
                />
              </div>
            )}

            {open && section.id === 3 && (
              <div style={{ padding: "0 14px 14px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 10
                  }}
                >
                  {[
                    ["Authorization", "GET /as/authorization.oauth2"],
                    ["Token", "POST /as/token.oauth2"],
                    ["UserInfo", "GET /idp/userinfo.openid"],
                    ["Introspection", "POST /as/introspect.oauth2"],
                    ["Revocation", "POST /as/revoke_token.oauth2"],
                    ["JWKS", "GET /pf/JWKS"],
                    ["Discovery", "GET /.well-known/openid-configuration"],
                    ["Session Check", "GET /as/check_session" ]
                  ].map(([name, endpoint]) => (
                    <div key={name} style={{ border: "1px solid #dce4f1", borderRadius: 10, padding: 10, background: "#fbfdff" }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: COLORS.muted, marginTop: 6 }}>
                        {endpoint}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {filteredDocSections.length === 0 && (
        <div style={{ background: "#fff", border: "1px dashed #ccd9ea", borderRadius: 12, padding: 16, color: COLORS.muted }}>
          No documentation matched your search and tab combination.
        </div>
      )}
    </div>
  );

  const renderAuth = () => {
    const selected = FLOW_STEPS[activeFlow];

    return (
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FLOW_STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveFlow(step.id)}
              style={{
                borderRadius: 999,
                border: `1px solid ${activeFlow === step.id ? COLORS.primary : "#d7e2f0"}`,
                background: activeFlow === step.id ? "#e8f0ff" : "#fff",
                color: activeFlow === step.id ? COLORS.primary : COLORS.muted,
                padding: "8px 12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {step.name}
            </button>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid #dbe4f1", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{selected.name}</div>
          <div style={{ color: COLORS.muted, marginBottom: 8 }}>{selected.detail}</div>
          <InfoBox variant="info" title="HTTP Request Detail">
            {selected.request}
          </InfoBox>
          <CodeBlock language="http" code={selected.code} />
        </div>

        <div style={{ background: "#fff", border: "1px solid #dbe4f1", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Sequence Diagram</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(120px, 1fr))",
              gap: 10,
              alignItems: "start",
              marginBottom: 12
            }}
          >
            {["User", "Application", "PingFederate", "Token Exchange", "API"].map((name) => (
              <div key={name} style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{name}</div>
                <div style={{ margin: "8px auto 0", width: 2, height: 190, background: "#d2dceb" }} />
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            {sequenceArrows.map((arrow) => {
              const isForward = arrow.to > arrow.from;
              const colStart = Math.min(arrow.from, arrow.to);
              const colEnd = Math.max(arrow.from, arrow.to) + 1;

              return (
                <div
                  key={arrow.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(120px, 1fr))",
                    alignItems: "center"
                  }}
                >
                  <div
                    style={{
                      gridColumn: `${colStart} / ${colEnd}`,
                      position: "relative",
                      borderTop: `2px solid ${COLORS.primary}`,
                      height: 18
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: -9,
                        left: isForward ? "auto" : -1,
                        right: isForward ? -1 : "auto",
                        color: COLORS.primary,
                        fontWeight: 700
                      }}
                    >
                      {isForward ? ">" : "<"}
                    </span>
                    <span style={{ position: "absolute", top: -17, left: 6, fontSize: 11, color: COLORS.muted }}>
                      {arrow.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10
          }}
        >
          {[
            ["Auth Code", "60s", COLORS.warning],
            ["Access Token", "1h", COLORS.success],
            ["Refresh Token", "24h", COLORS.purple]
          ].map(([label, ttl, accent]) => (
            <div key={label} style={{ border: "1px solid #dce5f2", background: "#fff", borderRadius: 12, padding: 12 }}>
              <div style={{ color: COLORS.muted, fontSize: 12 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: accent as string }}>{ttl}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMigration = () => {
    const compareRows = [
      ["Authentication Type", "Proprietary SiteMinder", "OIDC/OAuth2"],
      ["User Identity", "SM_USER Header", "JWT sub claim"],
      ["Session Management", "Gateway session", "Token lifecycle"],
      ["Token Format", "No standard token", "Signed JWT"],
      ["Expiry Control", "Implicit", "exp + refresh"],
      ["API Security", "Header trust", "Bearer + signature"],
      ["Multi-App SSO", "Limited", "Standard OIDC SSO"],
      ["Mobile Support", "Custom", "Native OIDC support"],
      ["Standards", "Vendor specific", "Open standard"],
      ["Audit Logging", "Fragmented", "Centralized claims logging"]
    ];

    return (
      <div>
        <InfoBox variant="warning" title="Migration Deadline">
          Legacy header-based auth support is scheduled for deprecation on 31 Dec 2026. Prioritize high-traffic services in Phase 2.
        </InfoBox>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div style={{ border: "1px solid #f0c9be", borderRadius: 12, background: "#fff5f2" }}>
            <div
              style={{
                background: COLORS.danger,
                color: "#fff",
                fontWeight: 800,
                padding: "10px 12px",
                borderRadius: "12px 12px 0 0"
              }}
            >
              BEFORE
            </div>
            {compareRows.map(([topic, before]) => (
              <div key={topic} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #f4dbd4" }}>
                <div style={{ padding: 9, fontSize: 12, color: COLORS.muted }}>{topic}</div>
                <div style={{ padding: 9, fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>{before}</div>
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid #bddfcf", borderRadius: 12, background: "#effaf4" }}>
            <div
              style={{
                background: COLORS.success,
                color: "#fff",
                fontWeight: 800,
                padding: "10px 12px",
                borderRadius: "12px 12px 0 0"
              }}
            >
              AFTER
            </div>
            {compareRows.map(([topic, _before, after]) => (
              <div key={topic} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #d7efe3" }}>
                <div style={{ padding: 9, fontSize: 12, color: COLORS.muted }}>{topic}</div>
                <div style={{ padding: 9, fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>{after}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
            marginBottom: 14
          }}
        >
          {[
            ["Client registration complete", true],
            ["Token validation middleware added", true],
            ["Legacy header fallback removed", false],
            ["JWKS rotation automation enabled", true],
            ["All services migrated", false],
            ["Runbook updated for on-call", true]
          ].map(([label, ok]) => (
            <div
              key={label as string}
              style={{
                background: "#fff",
                border: "1px solid #dce5f2",
                borderRadius: 10,
                padding: 10,
                color: COLORS.text,
                fontSize: 13
              }}
            >
              <span style={{ color: ok ? COLORS.success : COLORS.warning, fontWeight: 800 }}>
                {ok ? "✓" : "!"}
              </span>{" "}
              {label}
            </div>
          ))}
        </div>

        <div style={{ border: "1px solid #dbe5f2", background: "#fff", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Phased Migration Timeline</div>
          {[
            ["1. Discovery & inventory", "complete", COLORS.success],
            ["2. Claim mapping + adapter", "complete", COLORS.success],
            ["3. Dual-run with shadow validation", "in-progress", COLORS.warning],
            ["4. Cutover + monitor", "pending", COLORS.muted],
            ["5. Decommission legacy path", "pending", COLORS.muted]
          ].map(([label, status, color]) => (
            <div key={label as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
              <div>{label}</div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: color as string,
                  textTransform: "uppercase",
                  letterSpacing: 0.4
                }}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.text,
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
        boxSizing: "border-box"
      }}
    >
      <aside
        style={{
          position: isMobile ? "relative" : "fixed",
          left: 0,
          top: 0,
          bottom: isMobile ? "auto" : 0,
          width: isMobile ? "100%" : 240,
          background: COLORS.sidebar,
          color: "#dce6f5",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #1f2937"
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  color: "#fff",
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.purple})`
                }}
              >
                S
              </div>
              <div>
                <div style={{ fontWeight: 800, color: "#f1f6ff", fontSize: 14 }}>Stellantis IAM</div>
                <div style={{ color: "#8ea2be", fontSize: 11 }}>Developer Portal</div>
              </div>
            </div>

            {isMobile ? (
              <button
                onClick={() => setMobileNavOpen((prev) => !prev)}
                aria-label="Toggle navigation"
                style={{
                  border: "1px solid #2d3a4a",
                  background: "#111826",
                  color: "#dce6f5",
                  borderRadius: 8,
                  width: 34,
                  height: 34,
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1
                }}
              >
                {mobileNavOpen ? "✕" : "☰"}
              </button>
            ) : null}
          </div>
        </div>

        <nav
          style={{
            display: !isMobile || mobileNavOpen ? "grid" : "none",
            gap: 6,
            gridTemplateColumns: isMobile ? "repeat(auto-fit, minmax(150px, 1fr))" : "1fr"
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = item.id === page;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  if (isMobile) {
                    setMobileNavOpen(false);
                  }
                }}
                style={{
                  border: "none",
                  textAlign: "left",
                  color: active ? "#f3f8ff" : "#9fb2cc",
                  background: active ? "rgba(0,82,204,0.28)" : "transparent",
                  borderRadius: 10,
                  padding: "10px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontWeight: active ? 700 : 500,
                  borderLeft: active ? `3px solid ${COLORS.primary}` : "3px solid transparent"
                }}
              >
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12 }}>{item.icon}</span>
                  <span style={{ fontSize: 13 }}>{item.label}</span>
                </span>
                {active ? <span style={{ color: "#8db6ff" }}>›</span> : null}
              </button>
            );
          })}
        </nav>

        {(!isMobile || mobileNavOpen) && (
          <div style={{ marginTop: isMobile ? 12 : "auto", color: "#7f93ae", fontSize: 11 }}>Portal v2.4.1 • PingFederate 12.2</div>
        )}
      </aside>

      <main style={{ marginLeft: isMobile ? 0 : 240, height: isMobile ? "auto" : "100vh", display: "flex", flexDirection: "column" }}>
        <header
          style={{
            minHeight: 64,
            background: "#fff",
            borderBottom: "1px solid #dbe4f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: isMobile ? "wrap" : "nowrap",
            gap: isMobile ? 8 : 0,
            padding: "0 18px",
            position: "sticky",
            top: 0,
            zIndex: 15
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800 }}>{PAGE_TITLES[page]}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                background: "#e8f6f0",
                color: COLORS.success,
                border: "1px solid #b9dfce",
                borderRadius: 999,
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 700
              }}
            >
              PingFederate • Healthy
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: "linear-gradient(120deg, #477cd6, #88b2f2)",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 13
              }}
            >
              DK
            </div>
          </div>
        </header>

        <section style={{ overflowY: isMobile ? "visible" : "auto", padding: isMobile ? 12 : 18 }}>
          {page === "dashboard" && renderDashboard()}
          {page === "oidc" && renderOidc()}
          {page === "docs" && renderDocs()}
          {page === "auth" && renderAuth()}
          {page === "migration" && renderMigration()}
        </section>
      </main>
    </div>
  );
}

export default App;
