import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpdateAction } from "./Updates";

afterEach(cleanup);
it("exige confirmação depois do aviso e permite adiar sem instalar", async () => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  const install = vi.fn();
  render(
    <UpdateAction
      updates={{
        available: {
          currentVersion: "0.1.0",
          version: "0.2.0",
          notes: "Correções",
          published: true,
        },
        checking: false,
        installing: false,
        progress: null,
        status: "",
        error: "",
        check: vi.fn(),
        install,
      }}
    />,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Atualizar" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(install).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Agora não" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(install).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Atualizar" }));
  await user.click(
    screen.getByRole("button", { name: "Instalar atualização" }),
  );
  expect(install).toHaveBeenCalledOnce();
});
