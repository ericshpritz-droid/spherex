import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpgradeSheet } from "./UpgradeSheet";

function setup(props: Partial<React.ComponentProps<typeof UpgradeSheet>> = {}) {
  const onClose = vi.fn();
  const onConfirmUpgrade = vi.fn();
  render(
    <UpgradeSheet
      open
      onClose={onClose}
      filled={1}
      onConfirmUpgrade={onConfirmUpgrade}
      {...props}
    />,
  );
  return { onClose, onConfirmUpgrade };
}

describe("UpgradeSheet", () => {
  it("renders the headline and slot tiles", () => {
    setup({ filled: 1 });
    expect(screen.getByText(/your sphere can hold/i)).toBeInTheDocument();
    expect(screen.getByText(/up to 3/i)).toBeInTheDocument();
    expect(screen.getByText(/01/)).toBeInTheDocument(); // filled
    expect(screen.getAllByText(/open/i).length).toBeGreaterThanOrEqual(2);
  });

  it("eyebrow reflects remaining slots", () => {
    const { unmount } = render(
      <UpgradeSheet open onClose={() => {}} filled={1} onConfirmUpgrade={() => {}} />,
    );
    expect(screen.getByText(/room for two more/i)).toBeInTheDocument();
    unmount();

    render(<UpgradeSheet open onClose={() => {}} filled={2} onConfirmUpgrade={() => {}} />);
    expect(screen.getByText(/room for one more/i)).toBeInTheDocument();
  });

  it("does NOT show a $9.99 price anywhere", () => {
    setup();
    expect(screen.queryByText(/\$9\.99/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/ ?mo/i)).not.toBeInTheDocument();
  });

  it("tapping the gold pill reveals the slide-to-confirm slider", async () => {
    setup();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /unlock sphere\+/i }));
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("close button fires onClose", async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("'not now' fires onClose", async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole("button", { name: /not now/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
