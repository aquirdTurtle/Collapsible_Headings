import {
  JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer
} from '@jupyterlab/application';
import {
  ICommandPalette, MainAreaWidget, WidgetTracker
} from '@jupyterlab/apputils';
import{
  Widget
} from '@phosphor/widgets';
import {
  Message
} from '@phosphor/messaging';

class APODWidget extends Widget {
  // Construct a new APOD widget.
  constructor() {
    super();
    this.addClass('my-apodWidget');
    // add an image element to the panel
    this.img = document.createElement('img');
    this.node.appendChild(this.img);
    // add a summary element to the panel
    this.summary = document.createElement('p');
    this.node.appendChild(this.summary);
  }
  // the image elmement associated with the widgets
  readonly img: HTMLImageElement;
  // the summary text element associated with the widget.
  readonly summary: HTMLParagraphElement;
  // Handle update requests for the widget.
  async onUpdateRequest(msg: Message): Promise<void> {
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${this.randomDate()}`);
    if (!response.ok) {
      const data = await response.json();
      if (data.error) {
        this.summary.innerText = data.error.message;
      } else {
        this.summary.innerText = response.statusText;
      }
    } else {
      const data = await response.json() as APODResponse;

      if (data.media_type === 'image') {
        // Populate the image
        this.img.src = data.url;
        this.img.title = data.title;
        this.summary.innerText = data.title;
        if (data.copyright) {
          this.summary.innerText += ' (Copyright ${data.copyright})';
        }
      } else {
        //console.log('Random APOD was not a picture');
        this.summary.innerText = 'Random APOD fetched was not an image.';
      }
    }
  }
  randomDate(): string {
    const start = new Date(2010,1,1);
    const end = new Date();
    const randomDate = new Date(start.getTime()
    + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString().slice(0,10);
  }
}

function activate(app: JupyterFrontEnd, palette: ICommandPalette,
                  restorer: ILayoutRestorer) {
  console.log('JupyterLab extension Collapsible_Headings is activated! v8');
  let widget: MainAreaWidget<APODWidget>;
  //const content = new APODWidget();
  //content.addClass('my-apodWidget');
  const command: string = 'Collapsible_Headings:open'
  app.commands.addCommand(command, {
    label: 'Random Astronomy Picture',
    execute: () => {
      if (!widget){
        const content = new APODWidget();
        widget = new MainAreaWidget({content});
        widget.id = 'Collapsible_Headings';
        widget.title.label = 'Astronomy Picture';
        widget.title.closable = true;
      }
      if (widget.disposed)
      {
        const content = new APODWidget();
        widget = new MainAreaWidget({content});
        widget.id = 'Collapsible_Headings';
        widget.title.label = 'Astronomy Picture';
        widget.title.closable = true;
      }

      if (!tracker.has(widget)){
        // track the state of the widget for later restoration
        tracker.add(widget);
      }
      if (!widget.isAttached) {
        // attach the widget to the main work area if it's not already there
        app.shell.add(widget, 'main');
      }
      widget.content.update();
      app.shell.activateById(widget.id);
    }
  });
  palette.addItem({command, category:'Tutorial'});
  let tracker = new WidgetTracker<MainAreaWidget<APODWidget>>({
    namespace: 'apod'
  });
  restorer.restore(tracker, {
    command,
    name: () => 'apod'
  });
  console.log('For Artorias!');
}


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
  requires: [ICommandPalette, ILayoutRestorer],
  activate: activate
};

export default extension;
