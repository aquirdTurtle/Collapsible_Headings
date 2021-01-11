# aquirdturtle_collapsible_headings

![Github Actions Status](https://github.com/aquirdTurtle/Collapsible_Headings.git/workflows/Build/badge.svg)

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

## Requirements

* JupyterLab >= 3.0

## Install

You should be able to install the extension either using the jupyterlab extension manager (drawing from my npm repository) or by using pip, which draws from pypi. Both should be update to date. Conda not yet supported.

```bash
pip install aquirdturtle_collapsible_headings
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the aquirdturtle_collapsible_headings directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm run build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm run build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Uninstall

```bash
pip uninstall aquirdturtle_collapsible_headings
```
