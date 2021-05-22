import {
  JupyterFrontEnd, 
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

import { ElementExt } from '@phosphor/domutils';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { ITableOfContentsRegistry } from '@jupyterlab/toc';

const plugin: JupyterFrontEndPlugin<void> = {
  activate,
  requires: [INotebookTracker, ICommandPalette, ISettingRegistry, ITableOfContentsRegistry],
  id: '@aquirdturtle/collapsible_headings:plugin',
  autoStart: true
};

function debugLog(message?: any, ...optionalParams: any[]){
  // a simple wrapper which makes it very easy to turn logging off. 
  if (false) {
    console.log(message,optionalParams);
  }
}

function activate (
  app: JupyterFrontEnd,
  nbTrack: INotebookTracker,
  palette: ICommandPalette,
  settings: ISettingRegistry,
  toc_registry: ITableOfContentsRegistry
){
  console.log('JupyterLab extension @aquirdturtle/collapsible_headings is activated!!');

  settings.load(plugin.id).then(resSettings => debugLog('LOAD SETTINGS: ', resSettings));
  
  const toggleCollapseCmd:        string = 'Collapsible_Headings:Toggle_Collapse';  
  const manuallyUpdateCmd:        string = 'Collapsible_Headings:Manually_Update_Collapse_Buttons';
  const manuallyUpdateStateCmd:   string = 'Collapsible_Headings:Manually_Update_Notebook_Collapse_State';
  const collapseAllCmd:           string = 'Collapsible_Headings:Collapse_All';
  const uncollapseAllCmd:         string = 'Collapsible_Headings:UnCollapse_All';
  const addHeaderAboveCmd:        string = 'Collapsible_Headings:Add_Header_Above'; 
  const addHeaderBelowCmd:        string = 'Collapsible_Headings:Add_Header_Below'; 
  const uncollapseHeaderCmd:      string = 'Collapsible_Headings:Uncollapse_Header';
  const collapseCmd:              string = 'Collapsible_Headings:Collapse_Header';
  const handleUpCmd:              string = 'Collapsible_Headings:HandleUp';
  const handleDownCmd:            string = 'Collapsible_Headings:HandleDown';

  app.commands.addCommand(toggleCollapseCmd,      { label: 'Toggle Collapse', execute: () => { toggleCurrentCellCollapse(nbTrack); }});
  app.commands.addCommand(manuallyUpdateCmd,      { label: 'Refresh Collapse Buttons', execute: () => { updateButtons(nbTrack); } });
  app.commands.addCommand(manuallyUpdateStateCmd, { label: 'Refresh Notebook Collapse State', execute: () => { updateNotebookCollapsedState(nbTrack); }});
  app.commands.addCommand(collapseAllCmd,         { label: 'Collapse All Cells', execute: () => { collapseAll(nbTrack); }});
  app.commands.addCommand(uncollapseAllCmd,       { label: 'Un-Collapse All Cells', execute: () => { uncollapseAll(nbTrack); }});
  app.commands.addCommand(addHeaderAboveCmd,      { label: 'Add Header Above', execute: () => { addHeaderAbove(nbTrack); } });
  app.commands.addCommand(addHeaderBelowCmd,      { label: 'Add Header Below', execute: () => { addHeaderBelow(nbTrack); } });
  app.commands.addCommand(uncollapseHeaderCmd,    { label: 'Un-Collapse Header', execute: () => { uncollapseCell(nbTrack); } });
  app.commands.addCommand(collapseCmd,            { label: 'Collapse Header', execute: () => { collapseCell(nbTrack); }});
  app.commands.addCommand(handleUpCmd,            { label: 'Handle Up Arrow', execute: () => { handleUp(nbTrack); }});
  app.commands.addCommand(handleDownCmd,          { label: 'Handle Down Arrow',  execute: () => { handleDown(nbTrack); } });

  palette.addItem({command:toggleCollapseCmd,       category: 'Collapsible Headings Extension'});
  palette.addItem({command:manuallyUpdateCmd,       category: 'Collapsible Headings Extension'});
  palette.addItem({command:manuallyUpdateStateCmd,  category: 'Collapsible Headings Extension'});
  palette.addItem({command:collapseAllCmd,          category: 'Collapsible Headings Extension'});
  palette.addItem({command:uncollapseAllCmd,        category: 'Collapsible Headings Extension'});
  palette.addItem({command:addHeaderAboveCmd,       category: 'Collapsible Headings Extension'});
  palette.addItem({command:addHeaderBelowCmd,       category: 'Collapsible Headings Extension'});
  palette.addItem({command:uncollapseHeaderCmd,     category: 'Collapsible Headings Extension'});
  palette.addItem({command:collapseCmd,             category: 'Collapsible Headings Extension'});
  palette.addItem({command:handleUpCmd,             category: 'Collapsible Headings Extension'});
  palette.addItem({command:handleDownCmd,           category: 'Collapsible Headings Extension'});

  nbTrack.currentChanged.connect(() => {
    nbTrack.currentWidget.content.model.stateChanged.connect(() => {
      if (nbTrack.currentWidget.content.widgets.length > 1) {
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
    debugLog('Cell executed. Updating buttons.');
    updateButtons(nbTrack);
  })

  // for some reason if I don't do this with a timeout, setting these bindings seems to fail *sometimes* 
  // and the arrows invoke these commands

  // I believe these bindings being here just makes them non-optional. 
  setTimeout(()=>{ app.commands.addKeyBinding({
    command: handleUpCmd,
    args: {},
    keys: ['ArrowUp'],
    selector: '.jp-Notebook:focus'
  });}, 2000)
  setTimeout(()=>{ app.commands.addKeyBinding({
    command: handleUpCmd,
    args: {},
    keys: ['K'],
    selector: '.jp-Notebook:focus'
  });}, 2000)

  setTimeout(()=>{ app.commands.addKeyBinding({
    command: handleDownCmd,
    args: {},
    keys: ['ArrowDown'],
    selector: '.jp-Notebook:focus'
  });}, 2000);
  setTimeout(()=>{ app.commands.addKeyBinding({
    command: handleDownCmd,
    args: {},
    keys: ['J'],
    selector: '.jp-Notebook:focus'
  });}, 2000);
  nbTrack.activeCellChanged.connect(() => {handleCellChange(nbTrack)});
  toc_registry.collapseChanged.connect(() => {
      setTimeout(()=>{updateNotebookCollapsedState(nbTrack)},10);
  });
  };

function handleCellChange(nbTrack : INotebookTracker){
  //let activeCell = nbTrack.currentWidget.content.activeCell;
  uncollapseParent(nbTrack.currentWidget.content.activeCellIndex, nbTrack);
  //if (getHeaderInfo(activeCell).isHeader && getCollapsedMetadata(activeCell)) {
    // debugLog("Selecting a hidden cell...");
    // nbTrack.currentWidget.content.select(nbTrack.currentWidget.content.widgets[nbTrack.currentWidget.content.activeCellIndex]);
    // nbTrack.currentWidget.content.select(nbTrack.currentWidget.content.widgets[nbTrack.currentWidget.content.activeCellIndex+1]);
  //}
}

function uncollapseParent(which : number, nbTrack : INotebookTracker){
  let nearestParentLoc = findNearestParentHeader(which, nbTrack);
  if (nearestParentLoc == -1) {
    // no parent, can't be collapsed so nothing to do. 
    return;
  }
  let cell = nbTrack.currentWidget.content.widgets[nearestParentLoc]
  if (!getCollapsedMetadata(cell) && !cell.isHidden){
    // no uncollapsing needed.
    return;
  }
  if (cell.isHidden){
    // recursively uncollapse this cell's parent then.
    uncollapseParent(nearestParentLoc, nbTrack);
  }
  if (getCollapsedMetadata(cell)){
    // then uncollapse. 
    setCellCollapse(nbTrack, nearestParentLoc, false );
  }
}

function handleUp(nbTrack : INotebookTracker){
  debugLog('Handling Up Arrow!');
  if (nbTrack.currentWidget.content.activeCellIndex == 0){
    return;
  }
  nbTrack.currentWidget.content.deselectAll()
  let newIndex = nbTrack.currentWidget.content.activeCellIndex - 1;
  let newPotentialActiveCell = nbTrack.currentWidget.content.widgets[newIndex];
  let isHidden = newPotentialActiveCell.isHidden;
  if (isHidden){
    let parentLoc = findNearestUncollapsedUpwards(newIndex, nbTrack);
    if (parentLoc == -1) {
      // no parent, can't be collapsed so nothing to do. 
      return;
    }
    debugLog('jumping up to nearest non-hidden cell...');
    nbTrack.currentWidget.content.activeCellIndex = parentLoc;  
  }
  else{
    // normal operation.
    debugLog('normal up.')
    nbTrack.currentWidget.content.activeCellIndex -= 1;
  }
  ElementExt.scrollIntoViewIfNeeded(nbTrack.currentWidget.content.node, nbTrack.activeCell.node)
}

function handleDown(nbTrack : INotebookTracker){
  debugLog('Handling Down Arrow!');
  nbTrack.currentWidget.content.deselectAll()
  let newIndex = nbTrack.currentWidget.content.activeCellIndex + 1;
  if (newIndex >= nbTrack.currentWidget.content.widgets.length){
    return;
  }
  let newPotentialActiveCell = nbTrack.currentWidget.content.widgets[newIndex];
  let isHidden = newPotentialActiveCell.isHidden;
  if (isHidden){
    let parentLoc = findNearestUncollapsedDownwards(newIndex, nbTrack);
    if (parentLoc == -1) {
      // no parent, can't be collapsed so nothing to do. 
      return;
    }
    debugLog('jumping down to nearest non-hidden cell...');
    nbTrack.currentWidget.content.activeCellIndex = parentLoc;
  }
  else{
    // normal operation.
    debugLog('normal down.')
    nbTrack.currentWidget.content.activeCellIndex += 1;
  }
  ElementExt.scrollIntoViewIfNeeded(nbTrack.currentWidget.content.node, nbTrack.activeCell.node)
}

function findNearestUncollapsedUpwards(index : number, nbTrack : INotebookTracker) : number {
  // Finds the nearest header above the given cell. If the cell is a header itself, it does not return itself; 
  // this can be checked directly by calling functions. 
  if (index >= nbTrack.currentWidget.content.widgets.length){
    return -1;
  }
  while (index > 0){
    index -= 1;
    let cell = nbTrack.currentWidget.content.widgets[index];
    if (!cell.isHidden){
      return index;
    }
  }
  return -1; // else no unhidden found above.
}

function findNearestUncollapsedDownwards(index : number, nbTrack : INotebookTracker) : number {
  // Finds the nearest header above the given cell. If the cell is a header itself, it does not return itself; 
  // this can be checked directly by calling functions. 
  if (index >= nbTrack.currentWidget.content.widgets.length || index < 0){
    return -1;
  }
  while (index < nbTrack.currentWidget.content.widgets.length-1){
    index += 1;
    let cell = nbTrack.currentWidget.content.widgets[index];
    if (!cell.isHidden){
      return index;
    }
  }
  return -1; // else no unhidden found above.
}

function collapseAll(nbTrack : INotebookTracker){
  debugLog('Collapsing all header cells!');
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
  debugLog('Un-Collapsing all header cells!');
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
  //debugLog('child'+ childHeaderInfo)
  for (let cellN = index+1; cellN < nbTrack.currentWidget.content.widgets.length; cellN++ ){
    let hInfo = getHeaderInfo(nbTrack.currentWidget.content.widgets[cellN]);
    //debugLog(hInfo)
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
    return -1; // strange...
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
  debugLog('Updating Notebook Collapse State...!');
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
  debugLog('Updating Collapsible Heading Buttons');
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
  if (collapsed) {
    // I used to use my own local files but for some reason this stopped working at jupyterlab 3.
    button.style.background = "var(--jp-icon-caret-right) no-repeat center"
    //button.style.background = "var(--jp-myicon-caretright) no-repeat center";
  } else {
    button.style.background = "var(--jp-icon-caret-down) no-repeat center"
    //button.style.background = "var(--jp-myicon-caretdown) no-repeat center";
  }
  // center the icons better.
  button.style.position = "relative";
  button.style.backgroundSize = "30px 30px"
  // found this offset & multiplier by trial and error. There's probably a better way to do this.
  let offset = -15 + headerLevel * 4;
  button.style.bottom = offset.toString()+"px";
  debugLog('Adding Button!', button);
}

function getOrCreateCollapseButton(cell: Cell, nbTrack: INotebookTracker) {
  if (cell.promptNode.getElementsByClassName("ch-button").length == 0) {
    let collapseButton = cell.promptNode.appendChild(document.createElement("button"));
    collapseButton.className = "bp3-button bp3-minimal jp-Button minimal ch-button";
    collapseButton.onclick = () => { toggleCurrentCellCollapse(nbTrack); };
    return collapseButton
  } else {
    return cell.promptNode.getElementsByClassName("ch-button")[0];
  }
}

function addButton(cell: Cell, nbTrack: INotebookTracker) {
  let button = getOrCreateCollapseButton(cell, nbTrack);
  let collapsed = getCollapsedMetadata(cell);
  let headerLevel = getHeaderInfo(cell).headerLevel;
  setButtonIcon(button as HTMLElement, collapsed, headerLevel);
};

function removeButton(cell: Cell) {
  if (cell.promptNode.getElementsByClassName("ch-button").length != 0){
    debugLog('Removing Button.')
    cell.promptNode.removeChild(cell.promptNode.getElementsByClassName("ch-button")[0]);
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
    //debugLog(which, 'tried to collapse non-existing cell!');
  }
  let cell = nbTrack.currentWidget.content.widgets[which];
  if (!cell) {
    //debugLog(which, 'cell invalid?!');
    return which+1;
  }
  let selectedHeaderInfo = getHeaderInfo(cell);
  let isMarkdown = false;
  if (cell == undefined)
  {
    return;
  }
  for (let classInc=0; classInc < cell.node.classList.length; classInc++){
    if (cell.node.classList[classInc] == 'jp-MarkdownCell'){
      isMarkdown = true;
    } 
  }
  if (cell.isHidden || !isMarkdown || !selectedHeaderInfo.isHeader){
    // otherwise collapsing and uncollapsing already hidden stuff can 
    // cause some funny looking bugs.
    //debugLog( which, 'cell hidden or not markdown or not a header markdown cell.', 
    //          cell.isHidden, isMarkdown, selectedHeaderInfo.isHeader );
    return which+1;
  }  
  setCollapsedMetadata(cell, collapsing);
  let button = getOrCreateCollapseButton(cell, nbTrack);
  let headerLevel = getHeaderInfo(cell).headerLevel;
  setButtonIcon(button as HTMLElement, collapsing, headerLevel);
  //debugLog(which, collapsing ? "Collapsing cells." : "Uncollapsing Cells.");
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
      //debugLog(cellNum, 'Reached end of Collapse Section. Break.')
      cellNum -= 1;
      break;
    }
    if (
      localCollapsed
      && subCellHeaderInfo.isHeader
      && subCellHeaderInfo.headerLevel <= localCollapsedLevel
    ) {
      // then reached the end of the local collapsed, so unset this.
      //debugLog(cellNum, 'Reached End of local collapse.')
      localCollapsed = false;
    }
    if (collapsing || localCollapsed) {
      // then no extra handling is needed for further locally collapsed
      // headers.
      //debugLog(cellNum, 'Collapsing Normally.');
      subCell.setHidden(true);
      continue;
    }
    if (getCollapsedMetadata(subCell) && subCellHeaderInfo.isHeader) {
      //debugLog(cellNum, 'Found locally collapsed section.');
      localCollapsed = true;
      localCollapsedLevel = subCellHeaderInfo.headerLevel;
      // but don't collapse the locally collapsed header, so continue to
      // uncollapse the header. This will get noticed in the next round.
    }
    //debugLog(cellNum, 'Uncollapsing Normally.');
    if (subCellHeaderInfo.isHeader) {
      let button = getOrCreateCollapseButton(subCell, nbTrack);
      setButtonIcon(button as HTMLElement, localCollapsed, localCollapsedLevel)
      // update button on header to reflect collapsed state if collapsed from toc
    }
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
  ElementExt.scrollIntoViewIfNeeded(nbTrack.currentWidget.content.node, nbTrack.activeCell.node)
}

function collapseCell(nbTrack: INotebookTracker) {
  if (!nbTrack.activeCell) {
    return;
  }
  if (getHeaderInfo(nbTrack.activeCell).isHeader){
    if (getCollapsedMetadata(nbTrack.activeCell)){
      // Then move to nearest parent. Same behavior as the old nb extension. 
      // Allows quick collapsing up the chain by <- <- <- presses if <- is a hotkey for this cmd.
      let parentLoc = findNearestParentHeader(nbTrack.currentWidget.content.activeCellIndex, nbTrack);
      if (parentLoc == -1) {
        // no parent, stop going up the chain.
        return;
      }
      nbTrack.currentWidget.content.activeCellIndex = parentLoc;  
    }
    else{
      // Then Collapse!
      setCellCollapse(nbTrack, nbTrack.currentWidget.content.activeCellIndex, true );
    }
  } else {
    // then jump to previous parent.
    let parentLoc = findNearestParentHeader(nbTrack.currentWidget.content.activeCellIndex, nbTrack);
    if (parentLoc == -1) {
      // no parent, can't be collapsed so nothing to do. 
      return;
    }
    nbTrack.currentWidget.content.activeCellIndex = parentLoc;
  }
  ElementExt.scrollIntoViewIfNeeded(nbTrack.currentWidget.content.node, nbTrack.activeCell.node)
}

function uncollapseCell(nbTrack: INotebookTracker) {
  if (!nbTrack.activeCell) {
    return;
  }
  if (getHeaderInfo(nbTrack.activeCell).isHeader){
    // Then uncollapse!
    setCellCollapse(nbTrack, nbTrack.currentWidget.content.activeCellIndex, false );
  } else {
    // then jump to next parent
    let parentLoc = findNextParentHeader(nbTrack.currentWidget.content.activeCellIndex, nbTrack);
    if (parentLoc == -1) {
      return;
    }
    nbTrack.currentWidget.content.activeCellIndex = parentLoc; 
  }
  ElementExt.scrollIntoViewIfNeeded(nbTrack.currentWidget.content.node, nbTrack.activeCell.node)
}

function getCollapsedMetadata(cell: Cell) : boolean {
  let metadata = cell.model.metadata;
  let collapsedData = false;
  if (metadata.has('toc-hr-collapsed')) {
    collapsedData = metadata.get('toc-hr-collapsed') === true;
  } else {
    // default is false, not collapsed.
  }
  return collapsedData;
}

function setCollapsedMetadata(cell: Cell, data: boolean) {
  let metadata = cell.model.metadata;
  if (data) {
    metadata.set('toc-hr-collapsed', true);
  }
  else {
    metadata.delete("toc-hr-collapsed");
  }
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
    debugLog('Finding nearest parent header failed!');
  }
  nbTrack.currentWidget.content.activeCellIndex = res;
  NotebookActions.insertAbove(nbTrack.currentWidget.content);
  NotebookActions.setMarkdownHeader(nbTrack.currentWidget.content, headerInfo.headerLevel);
  NotebookActions.changeCellType(nbTrack.currentWidget.content, "markdown");
  nbTrack.activeCell.editor.setSelection({start: {line: 0, column: headerInfo.headerLevel+1}, end: {line: 0, column: 10}})
  nbTrack.activeCell.editor.focus()
  debugLog('Added Header Cell Below Current Selection.');
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
    debugLog('Finding nearest parent header failed!');
  }
  NotebookActions.insertAbove(nbTrack.currentWidget.content);
  NotebookActions.setMarkdownHeader(nbTrack.currentWidget.content, headerInfo.headerLevel);
  NotebookActions.changeCellType(nbTrack.currentWidget.content, "markdown");
  debugLog(nbTrack.activeCell)
  nbTrack.activeCell.editor.setSelection({start: {line: 0, column: headerInfo.headerLevel+1}, end: {line: 0, column: 10}})
  nbTrack.activeCell.editor.focus()
  debugLog('Added Header Cell Above Current Selection.');
}

function getHeaderInfo(cell: Cell) : {isHeader: boolean, headerLevel: number} {
  let isMarkdown = false;
  if (cell == undefined)
  {
    return;
  }
  for (let classInc=0; classInc < cell.node.classList.length; classInc++){
    if (cell.node.classList[classInc] == 'jp-MarkdownCell'){
      isMarkdown = true;
    } 
  }
  if (!isMarkdown){
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
  //debugLog(line, match, match2, match3)
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
