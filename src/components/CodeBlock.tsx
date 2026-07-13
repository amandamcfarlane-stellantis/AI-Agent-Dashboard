import { useState } from "react";

type CodeBlockProps = {
  language: string;
  code: string;
};

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      style={{
        background: "#0d1117",
        borderRadius: 12,
        color: "#d4dde9",
        border: "1px solid #1f2833",
        overflow: "hidden",
        marginTop: 10
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 12px",
          borderBottom: "1px solid #1f2833",
          background: "#111826"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: "#ff5f57", display: "inline-block" }} />
            <span style={{ width: 9, height: 9, borderRadius: 99, background: "#febc2e", display: "inline-block" }} />
            <span style={{ width: 9, height: 9, borderRadius: 99, background: "#28c840", display: "inline-block" }} />
          </div>
          <span
            style={{
              fontSize: 11,
              letterSpacing: 0.5,
              fontWeight: 700,
              background: "#263244",
              border: "1px solid #33455f",
              borderRadius: 999,
              padding: "3px 9px",
              textTransform: "uppercase"
            }}
          >
            {language}
          </span>
        </div>
        <button
          onClick={onCopy}
          style={{
            border: "1px solid #384b65",
            borderRadius: 8,
            background: copied ? "#1f4d3f" : "#1a2433",
            color: "#dce7f8",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 10px"
          }}
        >
          {copied ? "✓ Check" : "⧉ Copy"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: 14,
          overflowX: "auto",
          fontSize: 12,
          lineHeight: 1.5,
          fontFamily: "JetBrains Mono, monospace"
        }}
      >
        {code}
      </pre>
    </div>
  );
}

export default CodeBlock;
