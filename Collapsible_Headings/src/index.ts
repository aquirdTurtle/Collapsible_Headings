import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';


/**
 * Initialization data for the Collapsible_Headings extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'Collapsible_Headings',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension Collapsible_Headings is activated!');
  }
};

export default extension;
