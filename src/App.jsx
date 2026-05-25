import { useEffect, useRef, useState } from "react";

const PHASE_ONE_API =
  "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseOne";
const PHASE_TWO_API =
  "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo";

const steps = {
  intro: "intro",
  identify: "identify",
  capture: "capture",
  camera: "camera",
  loading: "loading",
  summary: "summary",
  demographics: "demographics",
};

const emptyDemographics = {
  race: {
    "east asian": 0.96,
    white: 0.06,
    black: 0.03,
    "south asian": 0.02,
    "latino hispanic": 0,
    "southeast asian": 0,
    "middle eastern": 0,
  },
  age: {
    "20-29": 0.96,
    "30-39": 0.02,
    "10-19": 0.04,
    "40-49": 0,
    "50-59": 0,
    "60-69": 0,
    "70+": 0,
  },
  gender: {
    female: 0.96,
    male: 0.04,
  },
};

const formatLabel = (value) =>
  value
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");

const scoreRows = (scores = {}) =>
  Object.entries(scores)
    .map(([label, value]) => ({
      label,
      displayLabel: formatLabel(label),
      value: Number(value) * 100,
    }))
    .sort((a, b) => b.value - a.value);

const getTop = (scores = {}) =>
  scoreRows(scores)[0]?.label || "";

const isValidText = (value) =>
  /^[A-Za-z][A-Za-z\s'-]{1,}$/.test(value.trim());

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function Header({ label = "Intro", showButton = true }) {
  return (
    <header className="header">
      <div className="brand">
        <span>Skinstric</span>
        <span className="crumb">[ {label} ]</span>
      </div>

      {showButton && (
        <button className="simple-button">
          Take test
        </button>
      )}
    </header>
  );
}

function DiamondStack({ children, className = "" }) {
  return (
    <div className={`diamond-stack ${className}`}>
      <div className="diamond diamond--outer" />
      <div className="diamond diamond--middle" />
      <div className="diamond diamond--inner" />
      <div className="diamond-content">
        {children}
      </div>
    </div>
  );
}

function NavButton({
  children,
  direction = "next",
  onClick,
  disabled = false,
}) {
  return (
    <button
      className={`nav-button nav-button--${direction}`}
      onClick={onClick}
      disabled={disabled}
    >
      {direction === "back" && (
        <span className="nav-icon">{"<"}</span>
      )}
      <span>{children}</span>
      {direction !== "back" && (
        <span className="nav-icon">{">"}</span>
      )}
    </button>
  );
}

function Landing({ onStart }) {
  useEffect(() => {
    const handleEnter = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onStart();
      }
    };

    window.addEventListener("keydown", handleEnter);

    return () => {
      window.removeEventListener("keydown", handleEnter);
    };
  }, [onStart]);

  return (
    <main className="screen home-screen">
      <Header />

      <div className="side-diamond side-diamond--left" />
      <div className="side-diamond side-diamond--right" />

      <section className="hero">
        <h1>
          Sophisticated
          <br />
          skincare
        </h1>
      </section>

      <p className="intro-copy">
        Skinstric developed an A.I. that creates
        <br />
        a highly-personalised routine tailored to
        <br />
        what your skin needs.
      </p>

      <NavButton direction="back">
        Discover A.I.
      </NavButton>

      <NavButton onClick={onStart}>
        Take test
      </NavButton>
    </main>
  );
}

function Identify({
  onBack,
  onNext,
  customer,
  setCustomer,
}) {
  const [field, setField] = useState("name");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const value = customer[field];

  const handleProceed = async () => {
    if (!isValidText(value)) {
      setError(
        `${field === "name" ? "Name" : "Location"} must be letters only.`
      );
      return;
    }

    if (field === "name") {
      setField("location");
      setError("");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(PHASE_ONE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customer),
      });

      const data = await res.json();
      localStorage.setItem(
        "skinstricCustomer",
        JSON.stringify({
          ...customer,
          phaseOne: data,
        })
      );

      onNext();
    } catch (phaseError) {
      console.error(phaseError);
      setError(
        "Could not submit your details. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleProceed();
  };

  return (
    <main className="screen">
      <Header />

      <p className="eyebrow">
        To start analysis
      </p>

      <DiamondStack className="center-stage">
        <form
          className="type-prompt"
          onSubmit={handleSubmit}
        >
          <span>
            {field === "name"
              ? "click to type"
              : "where are you from?"}
          </span>
          <input
            value={value}
            placeholder={
              field === "name"
                ? "Introduce Yourself"
                : "Your Location"
            }
            onChange={(event) =>
              setCustomer((current) => ({
                ...current,
                [field]: event.target.value,
              }))
            }
          />
          {error && (
            <small className="form-error">
              {error}
            </small>
          )}
          <button
            className="sr-only"
            type="submit"
            disabled={submitting}
          >
            Continue
          </button>
        </form>
      </DiamondStack>

      <NavButton
        direction="back"
        onClick={
          field === "name"
            ? onBack
            : () => {
                setField("name");
                setError("");
              }
        }
      >
        Back
      </NavButton>

      <NavButton
        onClick={handleProceed}
        disabled={submitting}
      >
        {submitting ? "Saving" : "Proceed"}
      </NavButton>
    </main>
  );
}

function Capture({
  onBack,
  onUpload,
  onCamera,
  error,
  uploading,
}) {
  const fileInputRef = useRef(null);

  return (
    <main className="screen">
      <Header />

      <p className="eyebrow">
        To start analysis
      </p>

      <input
        ref={fileInputRef}
        className="hidden-input"
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
        }}
      />

      <section className="capture-grid">
        <button
          className="capture-choice"
          onClick={onCamera}
          disabled={uploading}
        >
          <DiamondStack>
            <span className="choice-icon">()</span>
            <span className="choice-label choice-label--right">
              Allow A.I.
              <br />
              to Scan Your Face
            </span>
          </DiamondStack>
        </button>

        <button
          className="capture-choice"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <DiamondStack>
            <span className="choice-icon">[]</span>
            <span className="choice-label choice-label--left">
              Allow A.I.
              <br />
              access Gallery
            </span>
          </DiamondStack>
        </button>
      </section>

      <p className="hint">
        {uploading
          ? "Uploading image"
          : "Select preferred way"}
      </p>

      {error && (
        <p className="floating-error">
          {error}
        </p>
      )}

      <NavButton
        direction="back"
        onClick={onBack}
      >
        Back
      </NavButton>
    </main>
  );
}

function CameraCapture({
  onBack,
  onCapture,
  error,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
            },
          });

        if (!mounted) return;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (cameraError) {
        console.error(cameraError);
      }
    };

    startCamera();

    return () => {
      mounted = false;
      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const context = canvas.getContext("2d");
    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const base64 = canvas
      .toDataURL("image/jpeg")
      .split(",")[1];

    onCapture(base64);
  };

  return (
    <main className="screen camera-screen">
      <Header />

      <p className="eyebrow">
        To start analysis
      </p>

      <div className="camera-frame">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />
      </div>

      <p className="camera-guidance">
        To get better results make sure to have
        neutral expression, frontal pose, and
        adequate lighting.
      </p>

      {error && (
        <p className="floating-error">
          {error}
        </p>
      )}

      <NavButton
        direction="back"
        onClick={onBack}
      >
        Back
      </NavButton>

      <NavButton onClick={capture}>
        Capture
      </NavButton>
    </main>
  );
}

function Loading({ onDone }) {
  const messages = [
    "Setting up camera ...",
    "Preparing your analysis ...",
    "Preparing your summary ...",
    "Preparing your formula ...",
    "Preparing your products ...",
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((current) => {
        if (current === messages.length - 1) {
          clearInterval(interval);
          setTimeout(onDone, 500);
          return current;
        }

        return current + 1;
      });
    }, 650);

    return () => clearInterval(interval);
  }, [messages.length, onDone]);

  return (
    <main className="screen loading-screen">
      <DiamondStack className="loading-diamond">
        <div className="loader-mark" />
        <p>{messages[index]}</p>
      </DiamondStack>
    </main>
  );
}

function Summary({ onBack, onNext }) {
  const cards = [
    "Demographics",
    "Skin Type Details",
    "Cosmetic concerns",
    "Weather",
  ];

  return (
    <main className="screen">
      <Header label="Analysis" />

      <p className="eyebrow">
        A. I. Analysis
      </p>

      <p className="analysis-copy">
        A. I. has estimated the following.
        Fix estimated information if needed.
      </p>

      <section className="summary-diamonds">
        {cards.map((card) => (
          <button
            key={card}
            className="summary-tile"
            onClick={
              card === "Demographics"
                ? onNext
                : undefined
            }
          >
            {card}
          </button>
        ))}
      </section>

      <NavButton
        direction="back"
        onClick={onBack}
      >
        Back
      </NavButton>

      <NavButton onClick={onNext}>
        Get Summary
      </NavButton>
    </main>
  );
}

function Demographics({
  onBack,
  data,
  actual,
  setActual,
  activeCategory,
  setActiveCategory,
}) {
  const rows = scoreRows(data[activeCategory]);
  const selected = actual[activeCategory];
  const selectedScore =
    rows.find((row) => row.label === selected)
      ?.value || 0;

  return (
    <main className="screen results-screen">
      <Header label="Analysis" />

      <p className="eyebrow">
        A. I. Analysis
      </p>

      <h2 className="page-title">
        Demographics
      </h2>

      <p className="subeyebrow">
        Predicted Race & Age
      </p>

      <section className="results-layout">
        <div className="result-tabs">
          {["race", "age", "gender"].map(
            (category) => (
              <button
                key={category}
                className={`result-tab ${
                  activeCategory === category
                    ? "result-tab--active"
                    : ""
                }`}
                onClick={() =>
                  setActiveCategory(category)
                }
              >
                <span>
                  {formatLabel(actual[category])}
                </span>
                <small>{category}</small>
              </button>
            )
          )}
        </div>

        <div className="confidence-panel">
          <h3>{formatLabel(selected)}</h3>
          <div
            className="confidence-ring"
            style={{
              "--score": `${selectedScore}%`,
            }}
          >
            <span>{selectedScore.toFixed(0)}</span>
            <small>%</small>
          </div>
        </div>

        <div className="race-list">
          <div className="race-list__header">
            <span>{activeCategory}</span>
            <span>a. i. confidence</span>
          </div>

          {rows.map((row) => (
            <label
              key={row.label}
              className={
                row.label === selected ? "active" : ""
              }
            >
              <span>
                <input
                  type="radio"
                  name={activeCategory}
                  checked={row.label === selected}
                  onChange={() =>
                    setActual((current) => ({
                      ...current,
                      [activeCategory]: row.label,
                    }))
                  }
                />
                {row.displayLabel}
              </span>
              <span>{row.value.toFixed(2)} %</span>
            </label>
          ))}
        </div>
      </section>

      <p className="correction-note">
        If A.I. estimate is wrong, select the correct one.
      </p>

      <NavButton
        direction="back"
        onClick={onBack}
      >
        Back
      </NavButton>
    </main>
  );
}

function App() {
  const [step, setStep] = useState(steps.intro);
  const [customer, setCustomer] = useState({
    name: "",
    location: "",
  });
  const [demographics, setDemographics] =
    useState(emptyDemographics);
  const [actual, setActual] = useState({
    race: getTop(emptyDemographics.race),
    age: getTop(emptyDemographics.age),
    gender: getTop(emptyDemographics.gender),
  });
  const [
    activeCategory,
    setActiveCategory,
  ] = useState("race");
  const [uploading, setUploading] =
    useState(false);
  const [error, setError] = useState("");

  const submitImage = async (base64) => {
    setUploading(true);
    setError("");

    try {
      const res = await fetch(PHASE_TWO_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Image: base64,
        }),
      });

      const response = await res.json();
      const nextData =
        response.data || emptyDemographics;

      setDemographics(nextData);
      setActual({
        race: getTop(nextData.race),
        age: getTop(nextData.age),
        gender: getTop(nextData.gender),
      });
      setStep(steps.loading);
    } catch (apiError) {
      console.error(apiError);
      setError(
        "Could not analyze that image. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (file) => {
    try {
      const base64 = await fileToBase64(file);
      await submitImage(base64);
    } catch (fileError) {
      console.error(fileError);
      setError(
        "Please choose a valid image file."
      );
    }
  };

  if (step === steps.intro) {
    return (
      <Landing
        onStart={() => setStep(steps.identify)}
      />
    );
  }

  if (step === steps.identify) {
    return (
      <Identify
        customer={customer}
        setCustomer={setCustomer}
        onBack={() => setStep(steps.intro)}
        onNext={() => setStep(steps.capture)}
      />
    );
  }

  if (step === steps.capture) {
    return (
      <Capture
        onBack={() => setStep(steps.identify)}
        onUpload={handleUpload}
        onCamera={() => setStep(steps.camera)}
        error={error}
        uploading={uploading}
      />
    );
  }

  if (step === steps.camera) {
    return (
      <CameraCapture
        onBack={() => setStep(steps.capture)}
        onCapture={submitImage}
        error={error}
      />
    );
  }

  if (step === steps.loading) {
    return (
      <Loading
        onDone={() => setStep(steps.summary)}
      />
    );
  }

  if (step === steps.summary) {
    return (
      <Summary
        onBack={() => setStep(steps.capture)}
        onNext={() => setStep(steps.demographics)}
      />
    );
  }

  return (
    <Demographics
      onBack={() => setStep(steps.summary)}
      data={demographics}
      actual={actual}
      setActual={setActual}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
    />
  );
}

export default App;
