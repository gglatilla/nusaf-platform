import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";

// Create mock functions
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockUpdateSession = jest.fn();
const mockSignIn = jest.fn();
const mockGetSearchParam = jest.fn();

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: mockGetSearchParam,
  }),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: null,
    status: "unauthenticated",
    update: mockUpdateSession,
  }),
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: jest.fn(),
}));

// Mock the auth helper
jest.mock("@/lib/auth", () => ({
  getRedirectUrl: (userType: string) => (userType === "staff" ? "/internal" : "/portal"),
}));

describe("Login Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no callback URL
    mockGetSearchParam.mockReturnValue(null);
  });

  it("renders the login form", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    // Password field - use test id or get by id since there's a button with "password" in aria-label
    expect(document.getElementById("password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("redirects staff user to /internal after successful login", async () => {
    // Mock successful sign in
    mockSignIn.mockResolvedValue({ error: undefined, ok: true });

    // Mock session update returning staff user
    mockUpdateSession.mockResolvedValue({
      user: {
        id: "1",
        email: "staff@nusaf.co.za",
        name: "Staff User",
        role: "ADMIN",
        userType: "staff",
        mustChangePassword: false,
      },
    });

    render(<LoginPage />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "staff@nusaf.co.za" },
    });
    fireEvent.change(document.getElementById("password")!, {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/internal");
    });
  });

  it("redirects customer user to /portal after successful login", async () => {
    // Mock successful sign in
    mockSignIn.mockResolvedValue({ error: undefined, ok: true });

    // Mock session update returning customer user
    mockUpdateSession.mockResolvedValue({
      user: {
        id: "2",
        email: "customer@example.com",
        name: "Customer User",
        role: "USER",
        userType: "customer",
        customerId: "cust-123",
        mustChangePassword: false,
      },
    });

    render(<LoginPage />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "customer@example.com" },
    });
    fireEvent.change(document.getElementById("password")!, {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/portal");
    });
  });

  it("redirects to /change-password when mustChangePassword is true", async () => {
    // Mock successful sign in
    mockSignIn.mockResolvedValue({ error: undefined, ok: true });

    // Mock session update returning user who must change password
    mockUpdateSession.mockResolvedValue({
      user: {
        id: "3",
        email: "newuser@example.com",
        name: "New User",
        role: "USER",
        userType: "customer",
        mustChangePassword: true,
      },
    });

    render(<LoginPage />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "newuser@example.com" },
    });
    fireEvent.change(document.getElementById("password")!, {
      target: { value: "temppass123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Wait for redirect to change password page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/change-password");
    });
  });

  it("uses callbackUrl when provided", async () => {
    // Mock search params with callback URL
    mockGetSearchParam.mockReturnValue("/internal/quotes");

    // Mock successful sign in
    mockSignIn.mockResolvedValue({ error: undefined, ok: true });

    // Mock session update
    mockUpdateSession.mockResolvedValue({
      user: {
        id: "1",
        email: "staff@nusaf.co.za",
        name: "Staff User",
        role: "ADMIN",
        userType: "staff",
        mustChangePassword: false,
      },
    });

    render(<LoginPage />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "staff@nusaf.co.za" },
    });
    fireEvent.change(document.getElementById("password")!, {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Wait for redirect to callback URL
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/internal/quotes");
    });
  });

  it("displays error message for invalid credentials", async () => {
    // Mock failed sign in
    mockSignIn.mockResolvedValue({ error: "Invalid email or password", ok: false });

    render(<LoginPage />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(document.getElementById("password")!, {
      target: { value: "wrongpassword" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    // Should NOT redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("displays account locked message when rate limited", async () => {
    // Mock rate limited response
    mockSignIn.mockResolvedValue({ error: "ACCOUNT_LOCKED", ok: false });

    render(<LoginPage />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "locked@example.com" },
    });
    fireEvent.change(document.getElementById("password")!, {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/temporarily locked/i)).toBeInTheDocument();
    });
  });

  it("displays pending account message", async () => {
    // Mock pending account response
    mockSignIn.mockResolvedValue({ error: "ACCOUNT_PENDING", ok: false });

    render(<LoginPage />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "pending@example.com" },
    });
    fireEvent.change(document.getElementById("password")!, {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/pending approval/i)).toBeInTheDocument();
    });
  });

  it("shows loading state while submitting", async () => {
    // Mock slow sign in that never resolves during test
    mockSignIn.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 5000))
    );

    render(<LoginPage />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(document.getElementById("password")!, {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Check loading state appears
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /signing in/i })).toBeInTheDocument();
    });
  });
});
