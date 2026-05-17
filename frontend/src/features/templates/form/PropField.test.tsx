import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PropField } from "./PropField";

describe("PropField", () => {
  it("renders a switch when name is background and value is light/dark", () => {
    const onChange = vi.fn();
    render(<PropField name="background" value="light" onChange={onChange} />);
    const sw = screen.getByRole("switch");
    expect(sw).toBeDefined();
    expect(sw.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("treats theme + mode same as background", () => {
    const onChange = vi.fn();
    render(<PropField name="theme" value="dark" onChange={onChange} />);
    const sw = screen.getByRole("switch");
    expect(sw.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith("light");
  });

  it("renders a switch for boolean values", () => {
    const onChange = vi.fn();
    render(<PropField name="enabled" value={false} onChange={onChange} />);
    const sw = screen.getByRole("switch");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders a text input for short string values", () => {
    const onChange = vi.fn();
    render(<PropField name="title" value="hi" onChange={onChange} />);
    const input = screen.getByDisplayValue("hi") as HTMLInputElement;
    expect(input.type).toBe("text");
    fireEvent.change(input, { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledWith("hello");
  });

  it("renders a color input for hex values", () => {
    const onChange = vi.fn();
    render(<PropField name="accent" value="#10b981" onChange={onChange} />);
    const input = screen.getByDisplayValue("#10b981") as HTMLInputElement;
    expect(input.type).toBe("color");
  });
});
