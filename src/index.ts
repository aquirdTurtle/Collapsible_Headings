import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  ICommandPalette, MainAreaWidget
} from '@jupyterlab/apputils';
import{
  Widget
} from '@phosphor/widgets'

interface APODResponse {
  copyright: string;
  date: string;
  explanation: string;
  media_type: 'video' | 'image';
  title: string;
  url: string;
}

/**
 * Initialization data for the Collapsible_Headings extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'Collapsible_Headings',
  autoStart: true,
  requires: [ICommandPalette],
  activate: async (app: JupyterFrontEnd, palette: ICommandPalette) => {
    console.log('JupyterLab extension Collapsible_Headings is activated! v3');
    const content = new Widget();
    // add an image element to the content
    let img = document.createElement('img');
    content.node.appendChild(img);
    // get a random date string in YYYY-MM-DD format
    function randomDate() {
      const start = new Date(2010,1,1);
      const end = new Date();
      const randomDate = new Date(start.getTime()
      + Math.random() * (end.getTime() - start.getTime()));
      return randomDate.toISOString().slice(0,10);
    }

    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${randomDate()}`);
    const data = await response.json() as APODResponse;

    if (data.media_type === 'image') {
      // Populate the image
      img.src = data.url;
      img.title = data.title;
    } else {
      console.log('Random APOD was not a picture');
    }

    const command: string = 'Collapsible_Headings:open'
    app.commands.addCommand(command, {
      label: 'Random Astronomy Picture',
      execute: () => {
        //console.log(widget.id, widget.title.label, widget.title.closable, widget);
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
