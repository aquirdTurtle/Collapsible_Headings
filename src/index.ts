import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  IDisposable, DisposableDelegate
} from '@phosphor/disposable';

import {
  ToolbarButton, ICommandPalette
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
  requires: [INotebookTracker, ICommandPalette],
  id: 'Colappsible_Headings:buttonPlugin',
  autoStart: true
};

function activate(
  app: JupyterFrontEnd,
  nbTrack: INotebookTracker,
  //requires: [INotebookTracker],
  palette: ICommandPalette
){
  app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
  console.log('Collapsible_Headings Extension');

  const command: string = 'Collapsible_Headings:Toggle_Collapse';
  app.commands.addCommand(command, {
    label: 'Toggle Collapse',
    execute: () => { collapseCells(nbTrack); }
  });
  app.commands.addKeyBinding({
    command: command,
    args: {},
    keys: ['Accel Q'],
    selector: '.jp-Notebook'
  });
  palette.addItem({command, category: 'Collapsible Headings'});
};

function collapseCells(nbTrack: INotebookTracker) {
  if (!nbTrack.activeCell) {
    return;
  }
  console.log(nbTrack);
  if (nbTrack.activeCell.constructor.name === "MarkdownCell"){
    let actIndex = nbTrack.currentWidget.content.activeCellIndex;
    let cell = nbTrack.currentWidget.content.widgets[actIndex];
    //cell.layout.addWidget();
    let selectedHeaderInfo = getHeaderInfo(cell);
    if (selectedHeaderInfo.isHeader){
      // toggle
      let collapsing = !getCollapsedMetadata(cell);
      setCollapsedMetadata(cell, collapsing);
      console.log(collapsing ? "Collapsing cells." : "Uncollapsing Cells.");
      let localCollapsed = false;
      let localCollapsedLevel = 0;
      // iterate through all cells after the active cell.
      for (
        let i = nbTrack.currentWidget.content.activeCellIndex+1;
        i < nbTrack.currentWidget.content.widgets.length;
        i++
      ) {
        console.log('Cell #', i);
        let subCell = nbTrack.currentWidget.content.widgets[i];
        let subCellHeaderInfo = getHeaderInfo(subCell);
        if (
          subCellHeaderInfo.isHeader
          && subCellHeaderInfo.headerLevel <= selectedHeaderInfo.headerLevel
        ){
          // then reached an equivalent or higher header level than the
          // original the end of the collapse.
          console.log('Reached end of Collapse Section. Break.')
          break;
        }
        if (
          localCollapsed
          && subCellHeaderInfo.isHeader
          && subCellHeaderInfo.headerLevel <= localCollapsedLevel
        ) {
          // then reached the end of the local collapsed, so unset this.
          console.log('Reached End of local collapse.')
          localCollapsed = false;
        }
        if (collapsing || localCollapsed) {
          // then no extra handling is needed for further locally collapsed
          // headers.
          console.log('Collapsing Normally.');
          subCell.setHidden(true);
          continue;
        }
        if (getCollapsedMetadata(subCell) && subCellHeaderInfo.isHeader) {
          console.log('Found locally collapsed section.');
          localCollapsed = true;
          localCollapsedLevel = subCellHeaderInfo.headerLevel;
          // but don't collapse the locally collapsed header, so continue to
          // uncollapse the header. This will get noticed in the next round.
        }
        console.log('Uncollapsing Normally.');
        subCell.setHidden(false);
      }
    }
  }
}


function getCollapsedMetadata(cell: Cell) : boolean {
  let metadata = cell.model.metadata;
  let collapsedData = false;
  if (metadata.has('Collapsed')){
    collapsedData = metadata.get('Collapsed') === 'true' ? true : false;
  } else {
    // default is false, not collapsed. Since the function will report false,
    // Go ahead and add the corresponding metadata.
    metadata.set('Collapsed', 'false');
  }
  return collapsedData;
}

function setCollapsedMetadata(cell: Cell, data: boolean) {
  let metadata = cell.model.metadata;
  metadata.set('Collapsed', data ? 'true' : 'false');
}


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
