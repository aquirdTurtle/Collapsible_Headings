import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the @aquirdturtle/collapsible_headings extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: '@aquirdturtle/collapsible_headings',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension @aquirdturtle/collapsible_headings is activated!');
  }
};

export default extension;
