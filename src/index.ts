import {
  JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer
} from '@jupyterlab/application';
import {
  ICommandPalette//, MainAreaWidget, WidgetTracker
} from '@jupyterlab/apputils';
import{
  //Widget
} from '@phosphor/widgets';
import {
  //Message
} from '@phosphor/messaging';

function activate(app: JupyterFrontEnd, palette: ICommandPalette,
                  restorer: ILayoutRestorer) {
  console.log('Colappsible_Headings Extension V0');
}

/**
 * Initialization data for the Collapsible_Headings extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'Collapsible_Headings',
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer],
  activate: activate
};

export default extension;
