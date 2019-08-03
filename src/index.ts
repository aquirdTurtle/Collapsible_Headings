import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette
} from '@jupyterlab/apputils';

import {
  INotebookTracker, NotebookActions
} from '@jupyterlab/notebook';

import {
  Cell
} from '@jupyterlab/cells';
//import { CodeEditor } from '@jupyterlab/codeeditor';
//import { cloneElement } from 'react';


const plugin: JupyterFrontEndPlugin<void> = {
  activate,
  requires: [INotebookTracker, ICommandPalette],
  id: 'Colappsible_Headings:buttonPlugin',
  autoStart: true
};

function activate(
  app: JupyterFrontEnd,
  nbTrack: INotebookTracker,
  palette: ICommandPalette
){
  
  console.log('Collapsible_Headings Extension Active!');
  // Add 3 commands to the command palette
  const command1: string = 'Collapsible_Headings:Toggle_Collapse';
  app.commands.addCommand(command1, {
    label: 'Toggle Collapse',
    execute: () => { toggleCurrentCellCollapse(nbTrack); }
  });
  const command2: string = 'Collapsible_Headings:Manually_Update_Collapse_Buttons';
  app.commands.addCommand(command2, {
    label: 'Refresh Update Collapse Buttons',
    execute: () => { updateButtons(nbTrack); }
  });
  const command3: string = 'Collapsible_Headings:Manually_Update_Notebook_Collapse_State';
  app.commands.addCommand(command3, {
    label: 'Refresh Notebook Collapse State',
    execute: () => { updateNotebookCollapsedState(nbTrack); }
  });

  app.commands.addKeyBinding({
    command: command1,
    args: {},
    keys: ['Accel Q'],
    selector: '.jp-Notebook'
  });
  //let test : IPaletteItem = {command, category: 'Collapsible Headings'};
  palette.addItem({command:command1, category: 'Collapsible Headings Extension'});
  palette.addItem({command:command2, category: 'Collapsible Headings Extension'});
  palette.addItem({command:command3, category: 'Collapsible Headings Extension'});

  nbTrack.currentChanged.connect(()=>{
    nbTrack.currentWidget.content.model.stateChanged.connect(()=>{
      console.log('notebook model state change detected.', nbTrack.currentWidget.content.widgets.length);
      if (nbTrack.currentWidget.content.widgets.length > 1){
      // this is a signal that I found that gets called after the cell list has been populated, so possible
      // to initialize these things now.
      updateButtons(nbTrack);
      // if I call this direclty then the collapsed input areas don't seem to render properly after uncollapsing.
      // this seems to allow the input areas to render before being initially collapsed. 
      setTimeout(()=>{updateNotebookCollapsedState(nbTrack)},10);
      }
    });
  });
  NotebookActions.executed.connect(() => {
    console.log('cell executed. Updating buttons.');
    updateButtons(nbTrack);
  })
  nbTrack.widgetAdded.connect(()=>{
    console.log('nbtrack widget added message seen!',nbTrack.currentWidget.content.widgets.length);
    /*
    nbTrack.currentWidget.content.model.contentChanged.connect(
      ()=>{console.log('nbTrack.currentWidget.content.model.contentChanged')}
      );
    nbTrack.currentWidget.content.model.cells.changed.connect(
      ()=>{console.log('nbTrack.currentWidget.content.model.cells.changed')}
      );
    nbTrack.currentWidget.content.model.stateChanged.connect(
      ()=>{console.log('nbTrack.currentWidget.content.model.cells.changed')}
    );
    */
  });
  nbTrack.currentChanged.connect(()=>{console.log('nbtrack current changed message seen!',nbTrack.currentWidget.content.widgets.length)});
  //nbTrack.currentWidget.content.activeCellChanged.connect(() => {
  nbTrack.activeCellChanged.connect(() => {
    // the code is configured to uncollapse cells when they are selected. This both deals with the case that the user 
    // arrows into a collapsed area and when the user adds a new cell in a collapsed area. 
    console.log('active cell changed.', nbTrack.activeCell.isHidden );    
    let parentLoc = findNearestParentHeader(nbTrack.currentWidget.content.activeCellIndex, nbTrack);
    console.log('nearest parent: ', parentLoc)
    if (parentLoc == -1) {
      // no parent, can't be collapsed so nothing to do. 
      return;
    }
    let cell = nbTrack.currentWidget.content.widgets[parentLoc];
    console.log(cell.inputArea.model.value);
    if (getCollapsedMetadata(cell)){
      console.log('parent needs uncollapsing...');
      // then uncollapse. 
      setCellCollapse(nbTrack, parentLoc, false );
    }
  });
};


function findNearestParentHeader(index : number, nbTrack : INotebookTracker) : number {
  // Finds the nearest header above the given cell. If the cell is a header itself, it does not return itself; 
  // this can be checked directly by calling functions. 
  if (index >= nbTrack.currentWidget.content.widgets.length){
    return -1;
  }
  let childHeaderInfo = getHeaderInfo(nbTrack.currentWidget.content.widgets[index]);
  console.log(childHeaderInfo);
  for (let cellN = index-1; cellN >= 0; cellN-- ){
    if (cellN < nbTrack.currentWidget.content.widgets.length){
      let hInfo = getHeaderInfo(nbTrack.currentWidget.content.widgets[cellN]);
      if (hInfo.isHeader && hInfo.headerLevel < childHeaderInfo.headerLevel ){
        return cellN;
      };
    }
  }
  // no parent header found.
  return -1;
}


function updateNotebookCollapsedState(nbTrack: INotebookTracker){
  console.log('Updating Notebook Collapse State...!');
  console.log(nbTrack);
  let nextCellIndex = 0;
  let count = 0;
  if (nbTrack.currentWidget){
    // increment through all the potentially collapsible blocks. 
    // Put in this 1e6 limit in case sometihng goes wrong to prevent permanent freeze in the while loop.
    while (nextCellIndex < nbTrack.currentWidget.content.widgets.length && count < 1e6){
      nextCellIndex = setCellCollapse(
        nbTrack, nextCellIndex, 
        getCollapsedMetadata(nbTrack.currentWidget.content.widgets[nextCellIndex]));
      count += 1;
    }
  }

}

function updateButtons(nbTrack: INotebookTracker){
  console.log('Updating Collapsible Heading Buttons');
  let allWidgets = nbTrack.currentWidget.content.widgets;
  for (let widgetNum = 0; widgetNum < allWidgets.length; widgetNum++) {
    let subCell = allWidgets[widgetNum];
    let subCellHeaderInfo = getHeaderInfo(subCell);
    if ( subCellHeaderInfo.isHeader ) {
      addButton(subCell, nbTrack); 
      console.log('added button.');
    }
  }
}

function setButtonIcon(button: HTMLElement, collapsed: boolean, headerLevel: number) {
  if (collapsed) {
    button.style.background = "var(--jp-icon-caretright) no-repeat center";
  } else {
    button.style.background = "var(--jp-icon-caretdown) no-repeat center";
  }
  // center the icons better.
  button.style.position = "relative";
  // found this offset & multiplier by trial and error. There's probably a better way to do this.
  let offset = -15 + headerLevel * 4;
  button.style.bottom = offset.toString()+"px";
}

function getOrCreateCollapseButton(cell: Cell, nbTrack: INotebookTracker) {
  if (cell.promptNode.getElementsByClassName("toc-button").length == 0) {
    let collapseButton = cell.promptNode.appendChild(document.createElement("button"));
    collapseButton.className = "bp3-button bp3-minimal jp-Button minimal toc-button";
    collapseButton.onclick = () => { toggleCurrentCellCollapse(nbTrack); };
    return collapseButton
  } else {
    return cell.promptNode.getElementsByClassName("toc-button")[0];
  }
}

function addButton(cell: Cell, nbTrack: INotebookTracker) {
  let button = getOrCreateCollapseButton(cell, nbTrack);
  let collapsed = getCollapsedMetadata(cell);
  let headerLevel = getHeaderInfo(cell).headerLevel;
  setButtonIcon(button as HTMLElement, collapsed, headerLevel);
};

function setCellCollapse(
  nbTrack: INotebookTracker, 
  which: number, 
  collapsing: boolean) 
  : number {
  if (!nbTrack){
    return which+1;
  }
  if (which >= nbTrack.currentWidget.content.widgets.length){
    console.log(which, 'tried to collapse non-existing cell!');
  }
  let cell = nbTrack.currentWidget.content.widgets[which];
  if (!cell) {
    console.log(which, 'cell invalid?!');
    return which+1;
  }
  let selectedHeaderInfo = getHeaderInfo(cell);
  if (cell.isHidden || cell.constructor.name !== "MarkdownCell" || !selectedHeaderInfo.isHeader){
    // otherwise collapsing and uncollapsing already hidden stuff can 
    // cause some funny looking bugs.
    console.log(which, 'cell hidden or not markdown or not a header markdown cell.');
    /*
    // in this case, find the nearest parent header and set the collapsed state of that cell. 
    let parentLoc = findNearestParentHeader(which, nbTrack);
    if (parentLoc == -1){
      // no parents
      return which+1;
    } else {
      return setCellCollapse(nbTrack, parentLoc, collapsing);
    }
    */
  }  
  setCollapsedMetadata(cell, collapsing);
  let button = getOrCreateCollapseButton(cell, nbTrack);
  let headerLevel = getHeaderInfo(cell).headerLevel;
  setButtonIcon(button as HTMLElement, collapsing, headerLevel);
  console.log(which, collapsing ? "Collapsing cells." : "Uncollapsing Cells.");
  let localCollapsed = false;
  let localCollapsedLevel = 0;
  // iterate through all cells after the active cell.
  let cellNum = which+1
  for (
    cellNum = which+1;
    cellNum < nbTrack.currentWidget.content.widgets.length;
    cellNum++
  ) {
    let subCell = nbTrack.currentWidget.content.widgets[cellNum];
    let subCellHeaderInfo = getHeaderInfo(subCell);
    if (
      subCellHeaderInfo.isHeader
      && subCellHeaderInfo.headerLevel <= selectedHeaderInfo.headerLevel
    ){
      // then reached an equivalent or higher header level than the
      // original the end of the collapse.
      console.log(cellNum, 'Reached end of Collapse Section. Break.')
      cellNum -= 1;
      break;
    }
    if (
      localCollapsed
      && subCellHeaderInfo.isHeader
      && subCellHeaderInfo.headerLevel <= localCollapsedLevel
    ) {
      // then reached the end of the local collapsed, so unset this.
      console.log(cellNum, 'Reached End of local collapse.')
      localCollapsed = false;
    }
    if (collapsing || localCollapsed) {
      // then no extra handling is needed for further locally collapsed
      // headers.
      console.log(cellNum, 'Collapsing Normally.');
      subCell.setHidden(true);
      continue;
    }
    if (getCollapsedMetadata(subCell) && subCellHeaderInfo.isHeader) {
      console.log(cellNum, 'Found locally collapsed section.');
      localCollapsed = true;
      localCollapsedLevel = subCellHeaderInfo.headerLevel;
      // but don't collapse the locally collapsed header, so continue to
      // uncollapse the header. This will get noticed in the next round.
    }
    console.log(cellNum, 'Uncollapsing Normally.');
    subCell.setHidden(false);
  }
  return cellNum + 1;
}


function toggleCurrentCellCollapse(nbTrack: INotebookTracker) {
  if (!nbTrack.activeCell) {
    return;
  }
  if (getHeaderInfo(nbTrack.activeCell).isHeader){
    // Then toggle!
    let collapsing = !getCollapsedMetadata(nbTrack.activeCell);
    setCellCollapse(nbTrack, nbTrack.currentWidget.content.activeCellIndex, collapsing );
  } else {
    // then toggle parent!
    let parentLoc = findNearestParentHeader(nbTrack.currentWidget.content.activeCellIndex, nbTrack);
    console.log('nearest parent: ', parentLoc)
    if (parentLoc == -1) {
      // no parent, can't be collapsed so nothing to do. 
      return;
    }
    setCellCollapse(nbTrack, parentLoc, 
      !getCollapsedMetadata(nbTrack.currentWidget.content.widgets[parentLoc]) );
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
    return {isHeader:false, headerLevel:7};
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
  let isHeader = (match !== null) || (match2 !== undefined && match2 !== null) || (match3 !== null);
  // There are only 6 levels of markdown headers so this gives one past that. 
  let level = 7;
  if (match){
    level = match[1].length;
  } else if (match2) {
    level = match2[1][0] === '=' ? 1 : 2;
  } else if (match3) {
    level = parseInt(match3[1], 10);
  }
  return {isHeader:isHeader, headerLevel:level};
}

export default plugin;
