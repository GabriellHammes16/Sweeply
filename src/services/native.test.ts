import { expect, it } from "vitest";
import { bytes } from "./native";
import { loadPreferences } from "../features/settings/Settings";
it("formata bytes e trata dados inválidos", () => {
  expect(bytes(1024)).toBe("1 KB");
  expect(bytes(1024 ** 3)).toBe("1 GB");
  expect(bytes(NaN)).toBe("0 B");
  expect(bytes(-1)).toBe("0 B");
});
it("restaura preferências seguras para JSON inválido ou valores incorretos", () => {
  localStorage.setItem("sweeply.preferences", "{");
  expect(loadPreferences().theme).toBe("dark");
  localStorage.setItem(
    "sweeply.preferences",
    JSON.stringify({ theme: "neon", motion: "false", collapsed: 1 }),
  );
  expect(loadPreferences()).toEqual({
    theme: "dark",
    motion: true,
    collapsed: false,
    autoUpdates: true,
  });
});
