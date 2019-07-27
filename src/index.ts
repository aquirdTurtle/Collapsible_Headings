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
  NotebookActions, NotebookPanel, INotebookModel
} from '@jupyterlab/notebook';

const plugin: JupyterFrontEndPlugin<void> = {
  activate,
  id: 'Colappsible_Headings:buttonPlugin',
  autoStart: true
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
      tooltip: 'Run All Motherfucker'
    })

    panel.toolbar.insertItem(0, 'runAll', button);
    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}

function activate(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
  console.log('Colappsible_Headings Extension V1');
};

export default plugin;
