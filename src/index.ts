import {
  JupyterFrontEnd, 
  //JupyterLabPlugin,
  JupyterFrontEndPlugin
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

import { ISettingRegistry } from '@jupyterlab/coreutils';

//const plugin: JupyterFrontEndPlugin<void> = {
const plugin: JupyterFrontEndPlugin<void> = {
  activate,
  requires: [INotebookTracker, ICommandPalette, ISettingRegistry],
  //id: 'Colappsible_Headings:buttonPlugin',
  id: '@aquirdturtle/collapsible_headings:plugin',
  autoStart: true
};

function activate (
  app: JupyterFrontEnd,
  nbTrack: INotebookTracker,
  palette: ICommandPalette,
  settings: ISettingRegistry
){
  console.log('1');
  //let res = settings.load(plugin.id);
  console.log('SETTINGS REGISTRY:   ', settings)
  settings.load(plugin.id)
  .then(resSettings => console.log('LOAD SETTINGS: ', resSettings));
  //console.log('LOAD RESULT: ', res)
  console.log('Collapsible_Headings Extension Active!');
  // Add 3 commands to the command palette
  const command1: string = 'Collapsible_Headings:Toggle_Collapse';
  app.commands.addCommand(command1, {
    label: 'Toggle Collapse',
    execute: () => { toggleCurrentCellCollapse(nbTrack); }
  });
  const command2: string = 'Collapsible_Headings:Manually_Update_Collapse_Buttons';
  app.commands.addCommand(command2, {
    label: 'Refresh Collapse Buttons',
    execute: () => { updateButtons(nbTrack); }
  });
  const command3: string = 'Collapsible_Headings:Manually_Update_Notebook_Collapse_State';
  app.commands.addCommand(command3, {
    label: 'Refresh Notebook Collapse State',
    execute: () => { updateNotebookCollapsedState(nbTrack); }
  });
  const command4: string = 'Collapsible_Headings:Collapse_All';
  app.commands.addCommand(command4, {
    label: 'Collapse All Cells',
    execute: () => { collapseAll(nbTrack); }
  });
  const command5: string = 'Collapsible_Headings:UnCollapse_All';
  app.commands.addCommand(command5, {
    label: 'Un-Collapse All Cells',
    execute: () => { uncollapseAll(nbTrack); }
  });
  const command6: string = 'Collapsible_Headings:Add_Header_Above';
  app.commands.addCommand(command6, {
    label: 'Add Header Above',
    execute: () => { addHeaderAbove(nbTrack); }
  });
  const command7: string = 'Collapsible_Headings:Add_Header_Below';
  app.commands.addCommand(command7, {
    label: 'Add Header Below',
    execute: () => { addHeaderBelow(nbTrack); }
  });
  const command8: string = 'Collapsible_Headings:Uncollapse_Header';
  app.commands.addCommand(command8, {
    label: 'Add Header Below',
    execute: () => { uncollapseCell(nbTrack); }
  });
  const command9: string = 'Collapsible_Headings:Collapse_Header';
  app.commands.addCommand(command9, {
    label: 'Add Header Below',
    execute: () => { collapseCell(nbTrack); }
  });
  //let test : IPaletteItem = {command, category: 'Collapsible Headings'};
  palette.addItem({command:command1, category: 'Collapsible Headings Extension'});
  palette.addItem({command:command2, category: 'Collapsible Headings Extension'});
  palette.addItem({command:command3, category: 'Collapsible Headings Extension'});
  palette.addItem({command:command4, category: 'Collapsible Headings Extension'});
  palette.addItem({command:command5, category: 'Collapsible Headings Extension'});
  palette.addItem({command:command6, category: 'Collapsible Headings Extension'});
  palette.addItem({command:command7, category: 'Collapsible Headings Extension'});

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
  nbTrack.currentChanged.connect(()=>{console.log('nbtrack current changed message seen!',
                                 nbTrack.currentWidget.content.widgets.length)});
  //nbTrack.currentWidget.content.activeCellChanged.connect(() => {
  nbTrack.activeCellChanged.connect(() => {
    // the code is configured to uncollapse cells when they are selected. This both deals with the case that the user 
    // arrows into a collapsed area and when the user adds a new cell in a collapsed area. 
    console.log('active cell changed.');    
    let parentLoc = findNearestParentHeader(nbTrack.currentWidget.content.activeCellIndex, nbTrack);
    if (parentLoc == -1) {
      // no parent, can't be collapsed so nothing to do. 
      return;
    }
    let cell = nbTrack.currentWidget.content.widgets[parentLoc];
    if (getCollapsedMetadata(cell)){
      console.log('parent needs uncollapsing...');
      // then uncollapse. 
      setCellCollapse(nbTrack, parentLoc, false );
    }
  });
};


function collapseAll(nbTrack : INotebookTracker){
  console.log('Collapsing all header cells!');
  if (nbTrack.currentWidget){
    for (let cellI = 0; cellI < nbTrack.currentWidget.content.widgets.length; cellI++){
      let cell = nbTrack.currentWidget.content.widgets[cellI];
      if (getHeaderInfo(cell).isHeader){
        setCellCollapse(nbTrack, cellI, true );
        // setCellCollapse tries to be smart and not change metadata of hidden cells.
        // that's not the desired behavior of this function though, which wants to act
        // as if the user clicked collapse on every level. 
        setCollapsedMetadata(cell, true);
        let button = getOrCreateCollapseButton(cell, nbTrack);
        let headerLevel = getHeaderInfo(cell).headerLevel;
        setButtonIcon(button as HTMLElement, true, headerLevel);
      }
    }
  }
  updateNotebookCollapsedState(nbTrack);
}

function uncollapseAll(nbTrack : INotebookTracker){
  console.log('Un-Collapsing all header cells!');
  if (nbTrack.currentWidget){
    for (let cellI = 0; cellI < nbTrack.currentWidget.content.widgets.length; cellI++){
      let cell = nbTrack.currentWidget.content.widgets[cellI];
      if (getHeaderInfo(cell).isHeader){
        setCellCollapse(nbTrack, cellI, false );
        // similar to collapseAll.
        setCollapsedMetadata(cell, false);
        let button = getOrCreateCollapseButton(cell, nbTrack);
        let headerLevel = getHeaderInfo(cell).headerLevel;
        setButtonIcon(button as HTMLElement, false, headerLevel);
      }
    }
  }
  updateNotebookCollapsedState(nbTrack);
}


function findNextParentHeader(index : number, nbTrack : INotebookTracker){
  if (index >= nbTrack.currentWidget.content.widgets.length){
    return -1;
  }
  let childHeaderInfo = getHeaderInfo(nbTrack.currentWidget.content.widgets[index]);
  console.log('child', childHeaderInfo)
  for (let cellN = index+1; cellN < nbTrack.currentWidget.content.widgets.length; cellN++ ){
    let hInfo = getHeaderInfo(nbTrack.currentWidget.content.widgets[cellN]);
    console.log(hInfo)
    if (hInfo.isHeader && hInfo.headerLevel <= childHeaderInfo.headerLevel ){
      return cellN;
    }
  }
  // else no parent header found. return the index of the last cell
  return nbTrack.currentWidget.content.widgets.length-1;
}


function findNearestParentHeader(index : number, nbTrack : INotebookTracker) : number {
  // Finds the nearest header above the given cell. If the cell is a header itself, it does not return itself; 
  // this can be checked directly by calling functions. 
  if (index >= nbTrack.currentWidget.content.widgets.length){
    return -1;
  }
  let childHeaderInfo = getHeaderInfo(nbTrack.currentWidget.content.widgets[index]);
  for (let cellN = index-1; cellN >= 0; cellN-- ){
    if (cellN < nbTrack.currentWidget.content.widgets.length){
      let hInfo = getHeaderInfo(nbTrack.currentWidget.content.widgets[cellN]);
      if (hInfo.isHeader && hInfo.headerLevel < childHeaderInfo.headerLevel ){
        return cellN;
      };
    }
  }
  // else no parent header found.
  return -1;
}


function updateNotebookCollapsedState(nbTrack: INotebookTracker){
  console.log('Updating Notebook Collapse State...!');
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
  console.log('(fin)');
}

function updateButtons(nbTrack: INotebookTracker){
  console.log('Updating Collapsible Heading Buttons');
  let allWidgets = nbTrack.currentWidget.content.widgets;
  for (let widgetNum = 0; widgetNum < allWidgets.length; widgetNum++) {
    let subCell = allWidgets[widgetNum];
    let subCellHeaderInfo = getHeaderInfo(subCell);
    if ( subCellHeaderInfo.isHeader ) {
      addButton(subCell, nbTrack); 
    }
    else{
      removeButton(subCell);
    }
  }
}

function setButtonIcon(button: HTMLElement, collapsed: boolean, headerLevel: number) {
  console.log('Adding Button!');
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

function removeButton(cell: Cell) {
  if (cell.promptNode.getElementsByClassName("toc-button").length != 0){
    console.log('Removing Button.')
    cell.promptNode.removeChild(cell.promptNode.getElementsByClassName("toc-button")[0]);
  }
}

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
    return which+1;
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
    if (parentLoc == -1) {
      // no parent, can't be collapsed so nothing to do. 
      return;
    }
    setCellCollapse(nbTrack, parentLoc, 
      !getCollapsedMetadata(nbTrack.currentWidget.content.widgets[parentLoc]) );
    // otherwise the active cell will still be the now (usually) hidden cell
    nbTrack.currentWidget.content.activeCellIndex = parentLoc;
  }
}

function collapseCell(nbTrack: INotebookTracker) {
  if (!nbTrack.activeCell) {
    return;
  }
  if (getHeaderInfo(nbTrack.activeCell).isHeader){
    // Then Collapse!
    setCellCollapse(nbTrack, nbTrack.currentWidget.content.activeCellIndex, true );
  } else {
    // then Collapse parent!
    let parentLoc = findNearestParentHeader(nbTrack.currentWidget.content.activeCellIndex, nbTrack);
    if (parentLoc == -1) {
      // no parent, can't be collapsed so nothing to do. 
      return;
    }
    setCellCollapse(nbTrack, parentLoc, true );
    // otherwise the active cell will still be the now (usually) hidden cell
    nbTrack.currentWidget.content.activeCellIndex = parentLoc;
  }
}


function uncollapseCell(nbTrack: INotebookTracker) {
  if (!nbTrack.activeCell) {
    return;
  }
  if (getHeaderInfo(nbTrack.activeCell).isHeader){
    // Then uncollapse!
    setCellCollapse(nbTrack, nbTrack.currentWidget.content.activeCellIndex, false );
  } else {
    // then uncollapse parent!
    let parentLoc = findNearestParentHeader(nbTrack.currentWidget.content.activeCellIndex, nbTrack);
    if (parentLoc == -1) {
      // no parent, can't be collapsed so nothing to do. 
      return;
    }
    setCellCollapse(nbTrack, parentLoc, false );
    // otherwise the active cell will still be the now (usually) hidden cell
    nbTrack.currentWidget.content.activeCellIndex = parentLoc;
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

function addHeaderBelow(nbTrack : INotebookTracker){
  if (!nbTrack.activeCell){
    return;
  }
  let headerInfo = getHeaderInfo(nbTrack.activeCell);
  if (!headerInfo.isHeader){
    let parentHeaderIndex = findNearestParentHeader(nbTrack.currentWidget.content.activeCellIndex, nbTrack)
    headerInfo = getHeaderInfo(nbTrack.currentWidget.content.widgets[parentHeaderIndex]);  
  }
  let res = findNextParentHeader(nbTrack.currentWidget.content.activeCellIndex, nbTrack)
  if (headerInfo.isHeader == false) {
    console.log('Finding nearest parent header failed!');
  }
  nbTrack.currentWidget.content.activeCellIndex = res;
  NotebookActions.insertAbove(nbTrack.currentWidget.content);
  NotebookActions.setMarkdownHeader(nbTrack.currentWidget.content, headerInfo.headerLevel);
  NotebookActions.changeCellType(nbTrack.currentWidget.content, "markdown");
  nbTrack.activeCell.editor.setSelection({start: {line: 0, column: headerInfo.headerLevel+1}, end: {line: 0, column: 10}})
  nbTrack.activeCell.editor.focus()
  console.log('Added Header Cell Below Current Selection.');
}

function addHeaderAbove(nbTrack : INotebookTracker)  {
  if (!nbTrack.activeCell)
  {
    return;
  }
  let headerInfo = getHeaderInfo(nbTrack.activeCell);
  if (!headerInfo.isHeader){
    let res = findNearestParentHeader(nbTrack.currentWidget.content.activeCellIndex, nbTrack)
    headerInfo = getHeaderInfo(nbTrack.currentWidget.content.widgets[res]);
  }
  if (headerInfo.isHeader == false) {
    console.log('Finding nearest parent header failed!');
  }
  NotebookActions.insertAbove(nbTrack.currentWidget.content);
  NotebookActions.setMarkdownHeader(nbTrack.currentWidget.content, headerInfo.headerLevel);
  NotebookActions.changeCellType(nbTrack.currentWidget.content, "markdown");
  console.log(nbTrack.activeCell)
  nbTrack.activeCell.editor.setSelection({start: {line: 0, column: headerInfo.headerLevel+1}, end: {line: 0, column: 10}})
  nbTrack.activeCell.editor.focus()
  console.log('Added Header Cell Above Current Selection.');
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
  //let match3 = line.match(/<h([1-6])>(.*)<\/h\1>/i);
  let match3 = line.match(/<h([1-6])(.*)>(.*)<\/h\1>/i);
  //console.log(line, match, match2, match3)
  let isHeader = ((match !== null) || (match2 !== undefined && match2 !== null && Boolean(match2) !== false) 
                || (match3 !== null));
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
