import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  ICommandPalette, MainAreaWidget
} from '@jupyterlab/apputils';
import{
  Widget
} from '@phosphor/widgets'
/**
 * Initialization data for the Collapsible_Headings extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'Collapsible_Headings',
  autoStart: true,
  requires: [ICommandPalette],

  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
    console.log('JupyterLab extension Collapsible_Headings is activated! v1');
    const command: string = 'Collapsible_Headings:open'
    app.commands.addCommand(command, {
      label: 'Random Astronomy Picture',
      execute: () => {
        //console.log(widget.id, widget.title.label, widget.title.closable, widget);
        const content = new Widget();
        const widget = new MainAreaWidget({content});
        widget.id = 'Collapsible_Headings';
        widget.title.label = 'Astronomy Picture';
        widget.title.closable = true;
        if (!widget.isAttached) {
          console.log('Widget was Unattached, attaching.');
          // attach the widget to the main work area if it's not already there
          app.shell.add(widget, 'main');
        }
        console.log('Activating Widget');
        app.shell.activateById(widget.id);
      }
    });
    palette.addItem({command, category:'Tutorial'});
    console.log('Artorias!');
  }

};

export default extension;
