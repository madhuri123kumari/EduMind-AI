
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  reload,
  signOut,
} from "firebase/auth";

import { auth } from "./firebase.jsx";
import Dashboard from "./Dashboard.jsx";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState(
    window.location.hash === "#login" ? "login" : "signup"
  );

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [verificationEmail, setVerificationEmail] = useState("");

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          if (active) setAuthenticatedUser(null);
          return;
        }

        await reload(user);

        if (!active) return;

        if (user.emailVerified) {
          setAuthenticatedUser(user);
        } else {
          setAuthenticatedUser(null);
          setVerificationEmail(user.email || "");
        }
      } catch (error) {
        console.error("Authentication state check failed:", error);
        if (active) setAuthenticatedUser(null);
      } finally {
        if (active) setAuthChecking(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  function notify(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setShowPassword(false);

    const hash = nextMode === "verify" ? "#verify" : `#${nextMode}`;
    window.history.replaceState(null, "", hash);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const email = form.email.trim().toLowerCase();

    if (!email) {
      notify("Please enter your email address.", "error");
      return;
    }

    if (mode === "signup") {
      if (!form.firstName.trim()) {
        notify("Please enter your first name.", "error");
        return;
      }

      if (form.password.length < 8) {
        notify("Password must contain at least 8 characters.", "error");
        return;
      }

      if (!agree) {
        notify(
          "Please accept the Terms of Service and Privacy Policy.",
          "error"
        );
        return;
      }
    }

    if (mode === "login" && !form.password) {
      notify("Please enter your password.", "error");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          form.password
        );

        const displayName =
          `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

        await updateProfile(credential.user, { displayName });

        setVerificationEmail(email);
        setForm((previous) => ({ ...previous, password: "" }));
        changeMode("verify");

        try {
          await sendEmailVerification(credential.user);
          notify(
            "Verification email sent. Check your inbox and spam folder.",
            "success"
          );
        } catch (error) {
          console.error("Verification email failed:", error);

          notify(
            error.code === "auth/too-many-requests"
              ? "Too many requests. Please wait before trying again."
              : "Your account was created, but the verification email could not be sent. Please try resending it.",
            "error"
          );
        }
      } else if (mode === "login") {
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          form.password
        );

        await reload(credential.user);

        if (!credential.user.emailVerified) {
          setVerificationEmail(credential.user.email || email);
          setForm((previous) => ({ ...previous, password: "" }));
          changeMode("verify");

          notify(
            "Please verify your email before accessing the dashboard.",
            "info"
          );
        } else {
          setAuthenticatedUser(credential.user);
          notify("Sign in successful.", "success");
        }
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);

        notify(
          "If an account exists for this email, password reset instructions have been sent. Check your inbox and spam folder.",
          "success"
        );
      }
    } catch (error) {
      console.error("Authentication request failed:", error);

      const errors = {
        "auth/email-already-in-use":
          "This email already has an account. Please sign in.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/weak-password": "Choose a stronger password.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/user-not-found": "No matching account was found.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/too-many-requests":
          "Too many attempts. Wait a while and try again.",
        "auth/network-request-failed":
          "Network error. Check your internet connection.",
        "auth/operation-not-allowed":
          "Enable Email/Password in Firebase Authentication settings.",
        "auth/unauthorized-continue-uri":
          "Check your Firebase authorized domains and email action settings.",
        "auth/email-already-exists":
          "This email is already registered.",
      };

      notify(
        errors[error.code] ||
          "The request could not be completed. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    const user = auth.currentUser;

    if (!user) {
      notify(
        "Please sign in again to resend the verification email.",
        "error"
      );
      changeMode("login");
      return;
    }

    setLoading(true);

    try {
      await reload(user);

      if (user.emailVerified) {
        setAuthenticatedUser(user);
        notify("Email verified. Opening your dashboard.", "success");
        return;
      }

      await sendEmailVerification(user);
      notify("A new verification email has been sent.", "success");
    } catch (error) {
      console.error("Resending verification failed:", error);

      notify(
        error.code === "auth/too-many-requests"
          ? "Please wait before requesting another email."
          : "Could not send the email. Check your connection and try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkVerification() {
    const user = auth.currentUser;

    if (!user) {
      notify("Please sign in again to check verification.", "error");
      changeMode("login");
      return;
    }

    setLoading(true);

    try {
      await reload(user);

      if (user.emailVerified) {
        await signOut(auth);
        setAuthenticatedUser(null);
        setForm((previous) => ({ ...previous, password: "" }));
        changeMode("login");

        notify(
          "Email verified successfully. Please sign in to continue.",
          "success"
        );
      } else {
        notify(
          "Email is not verified yet. Open the verification link in your email first.",
          "info"
        );
      }
    } catch (error) {
      console.error("Checking email verification failed:", error);

      notify(
        "Could not check verification status. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function returnToLogin() {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (error) {
      console.error("Sign out failed:", error);
      notify("Could not sign out. Please try again.", "error");
      return;
    }

    setAuthenticatedUser(null);
    setForm((previous) => ({ ...previous, password: "" }));
    changeMode("login");
  }

  if (authChecking) {
    return (
      <main className="auth-page">
        <p role="status">Checking your secure session...</p>
      </main>
    );
  }

  if (authenticatedUser?.emailVerified) {
    return <Dashboard user={authenticatedUser} />;
  }

  const isAuthForm = ["signup", "login", "forgot"].includes(mode);

  return (
    <main className="auth-page">
      <section className="signup-panel">
        <a
          className="brand"
          href="#signup"
          onClick={(event) => {
            event.preventDefault();
            changeMode("signup");
          }}
        >
          <span className="brand-icon">E</span>
          <span className="brand-copy">
            <strong>EduMind AI</strong>
            <small>SMART EDUCATION ANALYTICS</small>
          </span>
        </a>

        <div className="signup-content">
          <p className="eyebrow">
            {mode === "signup" && "YOUR LEARNING JOURNEY STARTS HERE"}
            {mode === "login" && "WELCOME BACK TO EDUMIND AI"}
            {mode === "forgot" && "ACCOUNT RECOVERY"}
            {mode === "verify" && "ONE LAST STEP"}
          </p>

          <h1>
            {mode === "signup" && <>Student <span>sign up</span></>}
            {mode === "login" && <>Student <span>sign in</span></>}
            {mode === "forgot" && <>Reset <span>password</span></>}
            {mode === "verify" && <>Verify your <span>email</span></>}
          </h1>

          <p className="subtitle">
            {mode === "signup" &&
              "Create your account and start understanding your academic journey."}
            {mode === "login" &&
              "Sign in to continue your learning journey with EduMind AI."}
            {mode === "forgot" &&
              "Enter your registered email to receive password reset instructions."}
            {mode === "verify" &&
              `We sent a verification link to ${
                verificationEmail || "your email address"
              }.`}
          </p>

          {isAuthForm && (
            <form onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div className="name-row">
                  <label className="field">
                    First name
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      autoComplete="given-name"
                      maxLength={60}
                      required
                    />
                  </label>

                  <label className="field">
                    Last name
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      autoComplete="family-name"
                      maxLength={60}
                    />
                  </label>
                </div>
              )}

              <label className="field">
                Student email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              {mode !== "forgot" && (
                <label className="field">
                  <span className="label-row">
                    <span>Password</span>
                    {mode === "login" && (
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => changeMode("forgot")}
                      >
                        Forgot password?
                      </button>
                    )}
                  </span>

                  <div className="password-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder={
                        mode === "login"
                          ? "Your password"
                          : "At least 8 characters"
                      }
                      autoComplete={
                        mode === "login"
                          ? "current-password"
                          : "new-password"
                      }
                      minLength={mode === "signup" ? 8 : undefined}
                      maxLength={128}
                      required
                    />

                    <button
                      className="show-password"
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {mode === "signup" && (
                    <small className="hint">
                      Use at least 8 characters.
                    </small>
                  )}
                </label>
              )}

              {mode === "signup" && (
                <label className="terms">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(event) => setAgree(event.target.checked)}
                  />
                  <span>
                    I agree to the <a href="#terms">Terms of Service</a> and{" "}
                    <a href="#privacy">Privacy Policy</a>.
                  </span>
                </label>
              )}

              {message && (
                <p
                  className={`form-message ${messageType}`}
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : mode === "signup"
                    ? "Create student account"
                    : mode === "login"
                      ? "Sign in to EduMind AI"
                      : "Send password reset email"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>

              {mode === "forgot" && (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => changeMode("login")}
                >
                  Back to sign in
                </button>
              )}
            </form>
          )}

          {mode === "verify" && (
            <div className="verification-actions">
              {message && (
                <p
                  className={`form-message ${messageType}`}
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </p>
              )}

              <button
                className="primary-button"
                type="button"
                onClick={checkVerification}
                disabled={loading}
              >
                {loading ? "Checking..." : "I've verified my email"}
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={resendVerification}
                disabled={loading}
              >
                Resend verification email
              </button>

              <button
                className="text-button"
                type="button"
                onClick={returnToLogin}
                disabled={loading}
              >
                Back to sign in
              </button>
            </div>
          )}

          {isAuthForm && (
            <div className="auth-links">
              {mode !== "forgot" && (
                <p className="login-prompt">
                  {mode === "signup"
                    ? "Already have an account? "
                    : "New to EduMind AI? "}
                  <a
                    href={mode === "signup" ? "#login" : "#signup"}
                    onClick={(event) => {
                      event.preventDefault();
                      changeMode(mode === "signup" ? "login" : "signup");
                    }}
                  >
                    {mode === "signup" ? "Sign in" : "Create account"}
                  </a>
                </p>
              )}
            </div>
          )}

          <p className="security-note">
            <span aria-hidden="true">🔒</span> Authentication powered by
            Firebase.
          </p>
        </div>

        <footer className="auth-footer">
          <span>© 2026 EduMind AI</span>
          <span>Smart learning, clearer insights.</span>
        </footer>
      </section>

      <aside className="visual-panel">
        <div className="visual-nav">
          <span>LEARN</span>
          <span>ANALYZE</span>
          <span>GROW</span>
        </div>

        <div className="visual-content">
          <div className="visual-kicker">
            ✦ YOUR POTENTIAL, UNLOCKED
          </div>

          <h2>Make every learning moment count.</h2>

          <p>
            Understand your progress, set meaningful goals, and take charge
            of your academic journey.
          </p>

          <div className="student-illustration" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="planet planet-one" />
            <div className="planet planet-two" />

            <div className="student-circle">
              <div className="student-hair" />
              <div className="student-face">
                <span className="eye left-eye" />
                <span className="eye right-eye" />
                <span className="smile" />
              </div>
              <div className="student-body" />
              <div className="laptop"><span>E</span></div>
            </div>

            <span className="star star-one">✦</span>
            <span className="star star-two">✧</span>
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">↗</span>
              <div>
                <strong>Track progress</strong>
                <small>See your growth</small>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">◎</span>
              <div>
                <strong>Set goals</strong>
                <small>Stay focused</small>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">✦</span>
              <div>
                <strong>Learn smarter</strong>
                <small>Build better habits</small>
              </div>
            </div>
          </div>
        </div>

        <div className="visual-footer">
          <span>BUILT FOR STUDENT GROWTH</span>
          <span>LEARN · EXPLORE · ACHIEVE</span>
        </div>
      </aside>
    </main>
  );
}
