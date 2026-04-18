// Global banner shown when test mode is on. DELETE WITH FOLDER TO REMOVE.
import { useTestMode } from "./useTestMode";

export function TestModeBanner() {
  const { enabled } = useTestMode();
  if (!enabled) return null;
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] text-center text-[11px] font-semibold tracking-wide"
      style={{
        background: "linear-gradient(90deg, #f59e0b, #ef4444)",
        color: "white",
        padding: "4px 8px",
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      Test mode — synthetic accounts active
    </div>
  );
}
