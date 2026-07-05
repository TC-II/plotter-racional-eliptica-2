# Rational Elliptic Function Plotter

An interactive web-based visualization tool for exploring rational elliptic functions with a LaTeX-style interface.

## Features

- **Interactive Plotting**: Visualize rational elliptic functions in real-time
- **LaTeX-style Interface**: Clean, academic typography inspired by LaTeX documents
- **Responsive Design**: Works on desktop and mobile devices
- **Lightweight**: Pure HTML/CSS/JavaScript, no build tools required

## Usage

Open `index.html` in your web browser to start plotting and visualizing rational elliptic functions.

## Project Structure

```
.
├── index.html           # Entry point — UI markup, loads external CSS/JS
├── css/
│   └── style.css        # All styles (LaTeX-inspired typography, layout)
├── js/
│   ├── elliptic.js      # Core math: elliptic integrals, Jacobi sn, rational evaluation
│   ├── canvas.js        # Canvas helpers: hatching, arrows, high-DPI, region overlay
│   ├── drawTemplate.js  # Fig. 1: Filter template + magnitude response overlay
│   ├── drawPlot.js      # Fig. 2: Linear R_N(w) plot
│   ├── drawSymlog.js    # Fig. 3: Symlog R_N(w) plot
│   ├── ui.js            # UI element references, formatting, slider alignment
│   └── main.js          # Computation pipeline, orchestration, event listeners
├── README.md            # This file
└── .gitignore           # Git ignore rules
```

## How to Use

1. Clone the repository
2. Open `index.html` in your web browser
3. Interact with the plotter controls to visualize different rational elliptic functions
4. Adjust parameters to explore mathematical properties

## Hosting

This project is hosted on GitHub Pages and is publicly accessible at:
- https://tc2.github.io/plotter-racional-eliptica-2

## License

This project is provided as-is for educational and research purposes.

## Author

Created by javierpetrucci@gmail.com