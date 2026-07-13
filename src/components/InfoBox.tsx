import type { ReactNode } from "react";

export type InfoVariant = "tip" | "warning" | "danger" | "info";

type InfoBoxProps = {
  variant: InfoVariant;
  title: string;
  children: ReactNode;
};

const variantStyles: Record<InfoVariant, { accent: string; bg: string }> = {
  tip: { accent: "#00875a", bg: "#e8f6f0" },
  warning: { accent: "#ff8b00", bg: "#fff3e4" },
  danger: { accent: "#de350b", bg: "#feece7" },
  info: { accent: "#0052cc", bg: "#e8f0ff" }
};

function InfoBox({ variant, title, children }: InfoBoxProps) {
  const style = variantStyles[variant];

  return (
    <div
      style={{
        borderLeft: `4px solid ${style.accent}`,
        background: style.bg,
        padding: "12px 14px",
        borderRadius: 10,
        marginBottom: 14
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ color: "#5a6478", fontSize: 13, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

export default InfoBox;
