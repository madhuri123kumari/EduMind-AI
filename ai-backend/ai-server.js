import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 8787);
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || "http://localhost:5173";

// --------------------------------------------------
// Environment validation
// --------------------------------------------------

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in .env");
  process.exit(1);
}

if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  console.error(
    "❌ FIREBASE_SERVICE_ACCOUNT_PATH is missing in .env"
  );
  process.exit(1);
}

// --------------------------------------------------
// Firebase Admin SDK
// --------------------------------------------------

const serviceAccountPath = path.resolve(
  process.cwd(),
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH
);

if (!fs.existsSync(serviceAccountPath)) {
  console.error(
    `❌ Firebase service account file not found: ${serviceAccountPath}`
  );
  process.exit(1);
}

let serviceAccount;

try {
  serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );
} catch (error) {
  console.error(
    "❌ Unable to read or parse Firebase service account JSON."
  );

  console.error(
    error instanceof Error ? error.message : error
  );

  process.exit(1);
}

let firebaseAuth;

try {
  const firebaseApp = initializeApp({
    credential: cert(serviceAccount),
  });

  firebaseAuth = getAuth(firebaseApp);

  console.log("✅ Firebase Admin SDK initialized.");
} catch (error) {
  console.error(
    "❌ Firebase Admin SDK initialization failed."
  );

  console.error(
    error instanceof Error ? error.message : error
  );

  process.exit(1);
}

// --------------------------------------------------
// Gemini AI
// --------------------------------------------------

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

const configuredFallbackModels = (
  process.env.GEMINI_FALLBACK_MODELS ||
  "gemini-3.8-flash,gemini-3.5-flash-lite,gemini-2.5-flash-lite"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

const AI_MODELS = [
  GEMINI_MODEL,
  ...configuredFallbackModels,
].filter(
  (model, index, list) =>
    model && list.indexOf(model) === index
);

// --------------------------------------------------
// Middleware
// --------------------------------------------------

const allowedOrigins = CLIENT_ORIGIN
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests such as curl/Postman.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS origin is not allowed.")
      );
    },

    methods: ["GET", "POST", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

// --------------------------------------------------
// Utility helpers
// --------------------------------------------------

function getErrorStatus(error) {
  const status =
    error?.status ??
    error?.statusCode ??
    error?.response?.status ??
    error?.error?.code;

  const numericStatus = Number(status);

  return Number.isFinite(numericStatus)
    ? numericStatus
    : null;
}

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown AI service error.";
  }
}

function isTemporaryAIError(error) {
  const status = getErrorStatus(error);

  return (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

function isModelUnavailableError(error) {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error).toLowerCase();

  return (
    status === 404 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    message.includes(
      "model is currently experiencing high demand"
    ) ||
    message.includes("model is overloaded") ||
    message.includes("model is unavailable") ||
    message.includes("resource exhausted") ||
    message.includes("unavailable")
  );
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

// --------------------------------------------------
// Gemini generation with model fallback
// --------------------------------------------------

async function generateAIContent(prompt) {
  let lastError = null;

  for (
    let modelIndex = 0;
    modelIndex < AI_MODELS.length;
    modelIndex += 1
  ) {
    const model = AI_MODELS[modelIndex];

    // Primary model gets one retry.
    // Fallback models get one request each.
    const maxAttempts =
      modelIndex === 0 ? 2 : 1;

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt += 1
    ) {
      try {
        console.log(
          `🤖 Gemini request: model=${model}, attempt=${attempt}/${maxAttempts}`
        );

        const result =
          await ai.models.generateContent({
            model,
            contents: prompt,
          });

        const text =
          typeof result?.text === "string"
            ? result.text.trim()
            : "";

        if (!text) {
          throw new Error(
            `Gemini model "${model}" returned an empty response.`
          );
        }

        return {
          text,
          model,
        };
      } catch (error) {
        lastError = error;

        const status = getErrorStatus(error);
        const message = getErrorMessage(error);

        console.error(
          `❌ Gemini failed: model=${model}, status=${
            status ?? "unknown"
          }`
        );

        console.error(message);

        const canRetry =
          attempt < maxAttempts &&
          isTemporaryAIError(error);

        if (canRetry) {
          console.log(
            "⏳ Temporary Gemini error. Retrying in 2 seconds..."
          );

          await sleep(2000);

          continue;
        }

        const canUseNextModel =
          modelIndex < AI_MODELS.length - 1 &&
          isModelUnavailableError(error);

        if (canUseNextModel) {
          console.log(
            `↪️ Switching from ${model} to ${
              AI_MODELS[modelIndex + 1]
            }...`
          );
        }

        break;
      }
    }
  }

  throw (
    lastError ||
    new Error("All configured AI models failed.")
  );
}

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "EduMind AI Backend",
    status: "healthy",

    primaryModel: GEMINI_MODEL,

    fallbackModels: AI_MODELS.filter(
      (model) => model !== GEMINI_MODEL
    ),

    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------------------
// Firebase authentication middleware
// --------------------------------------------------

async function verifyFirebaseToken(
  req,
  res,
  next
) {
  try {
    const authorization =
      req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error:
          "Missing Firebase authentication token.",
      });
    }

    const idToken = authorization
      .substring("Bearer ".length)
      .trim();

    if (!idToken) {
      return res.status(401).json({
        error:
          "Firebase authentication token is empty.",
      });
    }

    const decodedToken =
      await firebaseAuth.verifyIdToken(idToken);

    if (!decodedToken.email_verified) {
      return res.status(403).json({
        error:
          "Please verify your email address before using AI Insights.",
      });
    }

    req.user = decodedToken;

    next();
  } catch (error) {
    console.error(
      "❌ Firebase token verification failed:",
      getErrorMessage(error)
    );

    return res.status(401).json({
      error:
        "Your Firebase session is invalid or expired. Please sign in again.",
    });
  }
}

// --------------------------------------------------
// AI Insights
// --------------------------------------------------

app.post(
  "/api/ai-insights",
  verifyFirebaseToken,

  async (req, res) => {
    try {
      const { students } = req.body;

      // ----------------------------------------------
      // Validate request
      // ----------------------------------------------

      if (!Array.isArray(students)) {
        return res.status(400).json({
          error:
            "Students must be provided as an array.",
        });
      }

      if (students.length === 0) {
        return res.status(400).json({
          error:
            "At least one student record is required.",
        });
      }

      if (students.length > 500) {
        return res.status(400).json({
          error:
            "A maximum of 500 student records can be analyzed at once.",
        });
      }

      // ----------------------------------------------
      // Validate and clean student data
      // ----------------------------------------------

      const cleanedStudents =
        students.map((student, index) => {
          const name = String(
            student?.name ?? ""
          ).trim();

          const className = String(
            student?.className ?? ""
          ).trim();

          const attendance = Number(
            student?.attendance
          );

          const performance = Number(
            student?.performance
          );

          if (!name) {
            throw new Error(
              `Student ${index + 1} is missing a name.`
            );
          }

          if (!className) {
            throw new Error(
              `Student ${index + 1} is missing a class/course.`
            );
          }

          if (
            !Number.isFinite(attendance) ||
            attendance < 0 ||
            attendance > 100
          ) {
            throw new Error(
              `Attendance for ${name} must be between 0 and 100.`
            );
          }

          if (
            !Number.isFinite(performance) ||
            performance < 0 ||
            performance > 100
          ) {
            throw new Error(
              `Performance for ${name} must be between 0 and 100.`
            );
          }

          return {
            name,
            className,
            attendance,
            performance,
          };
        });

      // ----------------------------------------------
      // Prepare student data
      // ----------------------------------------------

      const studentData =
        cleanedStudents
          .map(
            (student, index) =>
              `${index + 1}. Name: ${student.name}; ` +
              `Class/Course: ${student.className}; ` +
              `Attendance: ${student.attendance}%; ` +
              `Performance: ${student.performance}%`
          )
          .join("\n");

      // ----------------------------------------------
      // AI prompt
      // ----------------------------------------------

      const prompt = `
You are EduMind AI, an academic analytics assistant.

Analyze only the student performance data supplied below.

STUDENT DATA:
${studentData}

Generate a professional academic analysis for a teacher,
mentor, or academic administrator.

Your response must contain exactly these sections:

1. Overall Summary
- Explain the overall attendance and performance situation.
- Mention important patterns visible in the supplied data.

2. Students Needing Attention
- Identify students whose attendance is below 75%
  OR performance is below 40%.
- Explain the measurable reason each student appears in this section.
- Do not invent the cause of poor attendance or performance.
- If nobody needs attention, clearly say so.

3. Strong Performers
- Identify students with attendance of at least 75%
  AND performance of at least 80%.
- Mention their measurable strengths.
- If there are no strong performers, clearly say so.

4. Recommended Actions
- Give practical actions a teacher or mentor can take.
- Recommendations must be based only on the supplied data.

5. Priority Level
Classify the overall situation as exactly one of:
- Low
- Medium
- High

Important rules:
- Do not invent marks.
- Do not invent attendance.
- Do not invent subjects.
- Do not invent medical information.
- Do not invent family information.
- Do not invent reasons for poor performance.
- Do not make claims that are not supported by the supplied data.
- Use only the supplied student records.
- Keep the analysis concise, professional, and actionable.
`;

      // ----------------------------------------------
      // Generate AI response
      // ----------------------------------------------

      const {
        text: insights,
        model,
      } = await generateAIContent(prompt);

      // ----------------------------------------------
      // Successful response
      // ----------------------------------------------

      return res.status(200).json({
        success: true,
        insights,
        model,
        analyzedStudents:
          cleanedStudents.length,
      });
    } catch (error) {
      console.error(
        "❌ AI insights generation failed:",
        error
      );

      const status = getErrorStatus(error);
      const message = getErrorMessage(error);

      // ----------------------------------------------
      // Validation errors
      // ----------------------------------------------

      if (
        status === null &&
        (
          message.includes("Student ") ||
          message.includes("Attendance for ") ||
          message.includes("Performance for ")
        )
      ) {
        return res.status(400).json({
          error: message,
        });
      }

      // ----------------------------------------------
      // Gemini temporary/unavailable errors
      // ----------------------------------------------

      if (
        status === 408 ||
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504
      ) {
        return res.status(503).json({
          error:
            "AI service is temporarily unavailable. Please try again in a few moments.",

          details: message,
        });
      }

      // ----------------------------------------------
      // Other server errors
      // ----------------------------------------------

      return res.status(500).json({
        error:
          "Unable to generate AI insights. Please check the backend logs.",

        details: message,
      });
    }
  }
);

// --------------------------------------------------
// 404 handler
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found.",
    path: req.originalUrl,
  });
});

// --------------------------------------------------
// Global error handler
// --------------------------------------------------

app.use((error, req, res, next) => {
  console.error(
    "❌ Unhandled server error:",
    error
  );

  res.status(500).json({
    error: "Internal server error.",
  });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log("");

  console.log(
    "=========================================="
  );

  console.log(
    "        EduMind AI Backend"
  );

  console.log(
    "=========================================="
  );

  console.log(
    `Server : http://localhost:${PORT}`
  );

  console.log(
    `Health : http://localhost:${PORT}/api/health`
  );

  console.log(
    `AI     : http://localhost:${PORT}/api/ai-insights`
  );

  console.log(
    `Client : ${CLIENT_ORIGIN}`
  );

  console.log(
    `Primary: ${GEMINI_MODEL}`
  );

  console.log(
    `Fallbacks: ${
      AI_MODELS
        .filter(
          (model) => model !== GEMINI_MODEL
        )
        .join(", ") || "none"
    }`
  );

  console.log(
    "=========================================="
  );

  console.log("");
});