# Collapsible_Headings

Make headings collapsible like the old Jupyter notebook extension and like Mathematica notebooks.

A selected header cell (i.e. markdown cell starting with some number of "#") can be collapsed / uncollapsed by clicking on the caret icon created to the left of header cells or by using a shortcut.

In emulating the original extension, this extension now supports the following shortcuts:
- "T" or "Accel Q" shortcuts to toggle Collapse
- "Left-Arrow" to collapse the selected current header section
- "Right-Arrow" to *uncollapse* the selected current header section
- "Shift-A" to add a header above the current cell
- "Shift-B" to add a header below the current header section
All shortcuts only work in command mode and are editable by the user by going to Settings -> Advanced Settings Editor -> Keyboard Shortcuts and editing the shortcuts there.

![Alt Text](Demo2.gif)

## Prerequisites
* JupyterLab

## Installation

```bash
jupyter labextension install @aquirdturtle/collapsible_headings
```

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```
