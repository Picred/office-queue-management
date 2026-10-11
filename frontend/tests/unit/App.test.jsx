import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";
import { getUserInfo, login, logout } from "../../src/API/api";

// Replace the whole api.js, so no WebSocket or request to the backend is opened
vi.mock("../../src/API/api", () => ({
    getUserInfo: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getServices: vi.fn(),
    createTicket: vi.fn(),
    nextTicket: vi.fn(),
}));

const user = { id: 1, username: "counter1", role: "officer", cId: 1 };

beforeEach(() => {
    vi.mocked(getUserInfo).mockReset();
    vi.mocked(login).mockReset();
    vi.mocked(logout).mockReset().mockResolvedValue();
});

afterEach(cleanup);

// Opens the app at the given address, like typing it in the browser
function openAt(path) {
    window.history.pushState({}, "", path);
    render(<App />);
}

describe("officer page", () => {
    it("asks to log in first, then shows the page of the logged in officer", async () => {
        vi.mocked(getUserInfo).mockResolvedValue(null);
        vi.mocked(login).mockResolvedValue(user);
        openAt("/officer");

        await userEvent.type(await screen.findByLabelText("Username"), "counter1");
        await userEvent.type(screen.getByLabelText("Password"), "password");
        await userEvent.click(screen.getByRole("button", { name: "Login" }));

        expect(login).toHaveBeenCalledWith({ username: "counter1", password: "password" });
        expect(await screen.findByText("Logged in as counter1")).toBeTruthy();
        expect(window.location.pathname).toBe("/officer");
    });

    it("keeps the officer logged in after a reload, until the logout", async () => {
        // getUserInfo finds the session cookie: no need to log in again
        vi.mocked(getUserInfo).mockResolvedValue(user);
        openAt("/officer");

        expect(await screen.findByText("Logged in as counter1")).toBeTruthy();

        await userEvent.click(screen.getByRole("button", { name: "Logout" }));

        expect(logout).toHaveBeenCalled();
        expect(await screen.findByLabelText("Username")).toBeTruthy();
    });
});
