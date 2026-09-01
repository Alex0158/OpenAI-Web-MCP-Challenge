type StatusBannerProps = {
  tone: "info" | "success" | "error";
  message: string;
};

export default function StatusBanner({ tone, message }: StatusBannerProps) {
  return (
    <div
      className={`status-banner status-banner-${tone}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <span className="status-banner-marker" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
