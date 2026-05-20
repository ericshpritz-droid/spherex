import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaitingCard } from "./WaitingCard";

describe("WaitingCard", () => {
  it("renders the slot index, name, and subtitle", () => {
    render(<WaitingCard index={1} name="Alex P." onSendCompliment={() => {}} />);
    expect(screen.getByRole("heading", { name: "Alex P." })).toBeInTheDocument();
    expect(screen.getByText(/first in your sphere/i)).toBeInTheDocument();
    expect(screen.getByText(/01/)).toBeInTheDocument();
    expect(
      screen.getByText(/they'll see your compliment the moment they add you back/i),
    ).toBeInTheDocument();
  });

  it("zero-pads index >= 10 and uses generic eyebrow past slot 1", () => {
    render(<WaitingCard index={2} name="Jordan" onSendCompliment={() => {}} />);
    expect(screen.getByText(/02/)).toBeInTheDocument();
    expect(screen.getByText(/in your sphere/i)).toBeInTheDocument();
    expect(screen.queryByText(/first in your sphere/i)).not.toBeInTheDocument();
  });

  it("fires onSendCompliment when the gold pill is clicked", async () => {
    const onSend = vi.fn();
    render(<WaitingCard index={1} name="Alex P." onSendCompliment={onSend} />);
    await userEvent.click(screen.getByRole("button", { name: /send a compliment/i }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});
