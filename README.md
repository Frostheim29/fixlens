## 🚀 Live Demo

[**Open FixLens→**]   
https://fixlens-c4z3.onrender.com

## 💡 About FixLens

FixLens is a web-based laptop troubleshooting platform that helps users identify possible causes of common laptop problems and follow step-by-step solutions.

It uses predefined, rule-based logic to analyze user responses and suggest troubleshooting steps.

## Run locally

1. Download or clone this project.
2. Open the `fixlens` folder in VS Code.
3. Open `index.html` in a browser, or use the **Live Server** extension and click **Go Live**.
4. Choose an issue (Slow laptop, Wi-Fi issues, or App keeps crashing), answer all questions, and click **Run diagnosis**.
5. Mark steps complete and try **Copy report**.

No Node.js, Python, API key, package installation, or server is required. Google Fonts are optional; a system-font fallback is included.

## Suggested demo flow

- Slow laptop → “Mostly during startup” → “Many apps/tabs are open” → “No”
- Wi-Fi → “All devices on this Wi-Fi” → “Connected, but very slow” → “Yes, suddenly”
- App keeps crashing → “Just one app” → “As soon as it opens” → “App or Windows update”

## Project structure

- `index.html` — page structure and accessible controls
- `styles.css` — responsive dark dashboard UI
- `app.js` — questions, rule-based diagnostic paths, report and checklist interactions

## Important limitations

- This is a demo, not a certified diagnostic product.
- Confidence labels describe how well the selected answers match a rule path; they are not statistically calibrated probabilities.
- No user answers are sent to a server or stored persistently.
- Always back up important data and use official support guidance. Do not run commands or change system settings you do not understand.

## Git setup

```bash
git init
git add index.html styles.css app.js README.md .gitignore
git commit -m "Build FixLens troubleshooting prototype"
```

Create an empty private repository on GitHub named `fixlens`, then follow GitHub's instructions to add the remote and push the branch.
