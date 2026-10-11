import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "../../src/pages/LoginPage";
import { login } from "../../src/API/api";

// The page talks to the backend only through api.js: replace it, so no request is sent
vi.mock("../../src/API/api", () => ({ login: vi.fn() }));

afterEach(cleanup);

// The successful login is tested in App.test.jsx, together with the officer page
describe("LoginPage", () => {
    it("shows the error of the server and doesn't log in when the credentials are wrong", async () => {
        vi.mocked(login).mockRejectedValue(new Error("Incorrect username or password."));
        const onLogin = vi.fn();
        render(<LoginPage onLogin={onLogin} />);

        await userEvent.type(screen.getByLabelText("Username"), "counter1");
        await userEvent.type(screen.getByLabelText("Password"), "wrong");
        await userEvent.click(screen.getByRole("button", { name: "Login" }));

        expect(await screen.findByText("Incorrect username or password.")).toBeTruthy();
        expect(onLogin).not.toHaveBeenCalled();
    });
});
