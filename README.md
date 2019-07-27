# Collapsible_Headings

Make headings collapsible like the old Jupyter notebook extension and like mathematica notebooks.


## Prerequisites

* JupyterLab

## Installation

```bash
jupyter labextension install Collapsible_Headings
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

