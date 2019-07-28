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

import {
  Cell
} from '@jupyterlab/cells';

const plugin: JupyterFrontEndPlugin<void> = {
  activate,
  requires: [INotebookTracker],
  id: 'Colappsible_Headings:buttonPlugin',
  autoStart: true
};

function activate(app: JupyterFrontEnd,  nbTrack: INotebookTracker){
  app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
  console.log('Collapsible_Headings Extension');
  nbTrack.currentChanged.connect(()=>{
    //console.log('current notebook changed');
  })
  nbTrack.activeCellChanged.connect(() => {
    if (nbTrack.activeCell){
      if (nbTrack.activeCell.constructor.name === "MarkdownCell"){
        let actIndex = nbTrack.currentWidget.content.activeCellIndex;
        let cell = nbTrack.currentWidget.content.widgets[actIndex];
        console.log(cell);
        let selectedHeaderInfo = getHeaderInfo(cell);
        if (selectedHeaderInfo.isHeader)
        {
          let activeMetadata = cell.model.metadata;
          console.log(activeMetadata);
          let collapsing = true;
          if (activeMetadata.has('Collapsed')){
            // i.e. get the opposite of the current value.
            collapsing = activeMetadata.get('Collapsed') === 'true' ? false : true;
          }
          activeMetadata.set('Collapsed', collapsing ? 'true' : 'false');
          // then toggle collapsed. Determine whether colappsing or uncolappsing
          // based on the next cell's status.
          //let nextCell = nbTrack.currentWidget.content.widgets[actIndex+1];
          //let collapsing = nextCell.isHidden ? false : true;
          console.log(collapsing ? "Collapsing cells." : "Uncollapsing Cells.");
          for (
            let i = nbTrack.currentWidget.content.activeCellIndex+1;
            i < nbTrack.currentWidget.content.widgets.length;
            i++
          ) {
            let subCell = nbTrack.currentWidget.content.widgets[i];
            let subCellHeaderInfo = getHeaderInfo(subCell);
            console.log(subCellHeaderInfo);
            if (
              !subCellHeaderInfo.isHeader
              || subCellHeaderInfo.headerLevel > selectedHeaderInfo.headerLevel
            ){
              subCell.setHidden(collapsing);
            } else {
              break;
            }
          }
        }
      }
    }
  })
  NotebookActions.executed.connect(() => {
    //console.log('cell executed.');
  })
};

function getHeaderInfo(cell: Cell) : {isHeader: boolean, headerLevel: number} {
  if (cell.constructor.name !== "MarkdownCell"){
    return {isHeader:false, headerLevel:0};
  }
  let text = cell.model.value.text;
  const lines = text.split('\n');
  const line = lines[0];
  const line2 = lines.length > 1 ? lines[1] : undefined;
  // logic here for determining if header and what level of header was stolen
  // from the wonderful existing table of contents extension <3
  let match = line.match(/^([#]{1,6}) (.*)/);
  let match2 = line2 && line2.match(/^([=]{2,}|[-]{2,})/);
  let match3 = line.match(/<h([1-6])>(.*)<\/h\1>/i);
  let isHeader = (match !== null) || (match2 !== undefined) || (match3 !== null);
  let level = 0;
  if (match){
    level = match[1].length;
  } else if (match2) {
    level = match2[1][0] === '=' ? 1 : 2;
  } else if (match3) {
    level = parseInt(match3[1], 10);
  }
  return {isHeader:isHeader, headerLevel:level};
}

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
