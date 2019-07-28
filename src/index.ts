import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  IDisposable, DisposableDelegate
} from '@phosphor/disposable';

import {
  ToolbarButton
} from '@jupyterlab/apputils';

import {
  DocumentRegistry
} from '@jupyterlab/docregistry';

import {
  NotebookActions, NotebookPanel, INotebookModel, INotebookTracker
} from '@jupyterlab/notebook';

const plugin: JupyterFrontEndPlugin<void> = {
  activate,
  requires: [INotebookTracker],
  id: 'Colappsible_Headings:buttonPlugin',
  autoStart: true
};

function activate(
  app: JupyterFrontEnd,
  nbTrack: INotebookTracker ){
  app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
  console.log('Colappsible_Headings Extension V10');
  nbTrack.currentChanged.connect(()=>{
    console.log('current notebook changed');
  })
  nbTrack.activeCellChanged.connect(() => {
    if (nbTrack.activeCell){
      if (nbTrack.activeCell.constructor.name === "MarkdownCell"){
        console.log("Detected Markdown Cell!");
        console.log(nbTrack.currentWidget);
        for (let i = 0; i < nbTrack.currentWidget.content.widgets.length; i++) {
          console.log('logging cell number: ', i);
        }
      }
    }
  })
  NotebookActions.executed.connect(() => {
    console.log('cell executed.');
  })

  /*
  labShell.currentChanged.connect(() => {
    // this seems to happen near beginning of runtime but after the activate
    // function is originally called.
    console.log('detected labs shell current change');
    let cw = app.shell.currentWidget;
    console.log(cw);
    console.log('ishidden',cw.isHidden);
    let mwid : mWidget = {cw};
    //mwidget = app.shell.currentWidget;
    console.log('content',mwid.widget.content);
    //for (let i = 0; i < app.shell.currentWidget.content.widgets.length; i++) {
    //  console.log('logging cell number: ', i);
    //}
  });
  */
};


export
class ButtonExtension
implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  // Create a new extension object
  createNew(panel: NotebookPanel,
            context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    let callback = () => {
      NotebookActions.runAll(panel.content, context.session);
    };
    let button = new ToolbarButton({
      className: 'myButton',
      iconClassName: 'fa fa-fast-forward',
      onClick: callback,
      tooltip: 'Run All'
    })

    panel.toolbar.insertItem(0, 'runAll', button);
    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}


export default plugin;
