import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { ActionType, IDataChromeMessage, AppElement, ICommunicationChromeMessage, IInitialState, Mode } from './models';
import { IActionModel } from './models/IActionModel';
import { StorageService } from './services/StorageService';
import { ExtensionCommunicationService } from './services';
import { Icon, Pivot, PivotItem, initializeIcons } from '@fluentui/react';
import ActionsList from './components/ActionsList';

function App(initialState?: IInitialState | undefined) {
  const storageService = useMemo(() => { return new StorageService(); }, []);
  const communicationService = useMemo(() => { return new ExtensionCommunicationService(); }, []);
  const [isRecording, setIsRecording] = useState<boolean>(initialState?.isRecording || false);
  const [isPowerAutomatePage, setIsPowerAutomatePage] = useState<boolean>(initialState?.isPowerAutomatePage || false);
  const [isSharePointPage, setIsSharePointPage] = useState<boolean>(initialState?.isSharePointPage || false);
  const [hasActionsOnPageToCopy, setHasActionsOnPageToCopy] = useState<boolean>(initialState?.hasActionsOnPageToCopy || false);
  const [actions, setActions] = useState<IActionModel[]>(initialState?.actions || []);
  const [myClipboardActions, setMyClipboardActions] = useState<IActionModel[]>(initialState?.myClipboardActions || []);
  const [currentMode, setCurrentMode] = useState<Mode>(initialState?.currentMode || Mode.Requests);
  const [myCopiedActionsV3, setMyCopiedActionsV3] = useState<IActionModel[]>(initialState?.myCopiedActionsV3 || []);
  const [currentCopiedValueV3, setCurrentCopiedValueV3] = useState<IActionModel>();
  const [isV3PowerAutomateEditor, setIsV3PowerAutomateEditor] = useState<boolean>(false);

  const listenToMessage = (message: ICommunicationChromeMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.to !== AppElement.ReactApp) { return console.log('Incorrect message destination'); }
    switch (message.actionType) {
      case ActionType.ActionUpdated:
        message.message && setActions(message.message);
        break;
      case ActionType.MyClipboardActionsUpdated:
        message.message && setMyClipboardActions(message.message);
        break;
      case ActionType.MyCopiedActionsV3Updated:
        message.message && setMyCopiedActionsV3(message.message);
        break;
    }
  }

  const initData = useCallback(() => {
    initializeIcons();
    communicationService.sendRequest({ actionType: ActionType.CheckSharePointPage, message: "Check SharePoint Page" }, AppElement.ReactApp, AppElement.Content, (response) => {
      setIsSharePointPage(response);
    });
    communicationService.sendRequest({ actionType: ActionType.CheckPowerAutomatePage, message: "Check PowerAutomate Page" }, AppElement.ReactApp, AppElement.Content, (response) => {
      setIsPowerAutomatePage(response)
    });
    communicationService.sendRequest({ actionType: ActionType.CheckIfPageHasActionsToCopy, message: "Check If Page has actions to copy" }, AppElement.ReactApp, AppElement.Content, (response) => {
      setHasActionsOnPageToCopy(response)
    });
    communicationService.sendRequest({ actionType: ActionType.CheckIsNewPowerAutomateEditorV3, message: "Check If Page is a new Power Automate editor" }, AppElement.ReactApp, AppElement.Content, (response) => {
      setIsV3PowerAutomateEditor(response);
      if (response) {
        setCurrentMode(Mode.CopiedActionsV3);
        communicationService.sendRequest({ actionType: ActionType.SetCurrentCopiedActionFromStorageV3, message: "Get Copied Value V3" }, AppElement.ReactApp, AppElement.Content, (response) => {
          setCurrentCopiedValueV3(response);
        });
      }
    });

    storageService.getRecordedActions().then((actions) => {
      setActions(actions);
    });
    storageService.getMyClipboardActions().then((actions) => {
      setMyClipboardActions(actions);
    });
    storageService.getCopiedActionsV3().then((actions) => {
      setMyCopiedActionsV3(actions);
    });

    storageService.getIsRecordingValue().then((isRecording) => {
      setIsRecording(isRecording);
    });
    chrome.runtime.onMessage.addListener(listenToMessage);
  }, [communicationService, storageService]);

  useEffect(initData, []);

  const sendRecordingStatus = useCallback(() => {
    const message: IDataChromeMessage = isRecording
      ? { actionType: ActionType.StopRecording, message: "Stop recording" }
      : { actionType: ActionType.StartRecording, message: "Start recording" };
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, setIsRecording);
  }, [communicationService, isRecording]);

  const copyAllActionsFromPage = useCallback(() => {
    const message = {
      actionType: ActionType.CopyAllActionsFromPage,
      message: "Copy All Actions From Page",
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Content);
  }, [communicationService])

  const clearActionList = useCallback(() => {
    switch (currentMode) {
      case Mode.Requests:
        storageService.clearRecordedActions();
        setActions([]);
        break;
      case Mode.CopiedActions:
        storageService.clearMyClipboardActions();
        setMyClipboardActions([]);
        break;
      case Mode.CopiedActionsV3:
        storageService.clearCopiedActionsV3();
        setMyCopiedActionsV3([]);
        break;
    }
  }, [currentMode, storageService])

  const copyItems = useCallback(() => {
    const selectedActions = currentMode === Mode.Requests ? actions.filter(a => a.isSelected) : myClipboardActions.filter(a => a.isSelected);
    const message: IDataChromeMessage = {
      actionType: ActionType.CopyAction,
      message: selectedActions,
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Content);
  }, [actions, myClipboardActions, currentMode, communicationService])

  const deleteAction = useCallback((action: IActionModel, oldActions: IActionModel[], setActionsFunc: (value: React.SetStateAction<IActionModel[]>)
    => void, actionType: ActionType) => {
    const message: IDataChromeMessage = {
      actionType: actionType,
      message: action,
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, (response) => {
      const myArray = [...(oldActions || [])];
      const index = myArray.findIndex((a) => a.id === action.id);
      myArray.splice(index, 1);
      setActionsFunc(myArray);
    });
  }, [communicationService])

  const deleteRecordedAction = useCallback((action: IActionModel) => {
    deleteAction(action, actions, setActions, ActionType.DeleteAction);
  }, [actions, setActions, deleteAction])

  const deleteMyClipboardAction = useCallback((action: IActionModel) => {
    deleteAction(action, myClipboardActions, setMyClipboardActions, ActionType.DeleteMyClipboardAction);
  }, [myClipboardActions, setMyClipboardActions, deleteAction])

  const deleteCopiedActionV3 = useCallback((action: IActionModel) => {
    deleteAction(action, myCopiedActionsV3, setMyCopiedActionsV3, ActionType.DeleteMyCopiedActionV3);
  }, [myCopiedActionsV3, setMyCopiedActionsV3, deleteAction])

  const getMyClipboardActions = useCallback(() => {
    const message: IDataChromeMessage = {
      actionType: ActionType.GetElementsFromMyClipboard,
      message: "Get My Clipboard Actions",
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Content);
  }, [communicationService])

  const removeCurrentAction = useCallback(() => {
    storageService.clearCurrentCopiedActionV3();
    setCurrentCopiedValueV3(undefined);
    communicationService.sendRequest({ actionType: ActionType.ClearCurrentCopiedActionV3, message: {} }, AppElement.ReactApp, AppElement.Content);
  }, [communicationService, storageService])

  const changeSelection = useCallback((action: IActionModel, oldActions: IActionModel[], setActionsFunc: (value: React.SetStateAction<IActionModel[]>) => void) => {
    const allActions = [...(oldActions || [])];
    const index = allActions.findIndex(a => a.id === action.id);
    allActions[index].isSelected = !action.isSelected;
    setActionsFunc(allActions);
  }, [])

  const changeSelectionRecordedAction = useCallback((action: IActionModel) => {
    changeSelection(action, actions, setActions);
  }, [actions, changeSelection])

  const changeCopiedActionSelection = useCallback((action: IActionModel) => {
    changeSelection(action, myClipboardActions, setMyClipboardActions);
  }, [changeSelection, myClipboardActions])

  const changeCopiedActionSelectionV3 = useCallback((action: IActionModel) => {
    const allCurrentActions = [...(myCopiedActionsV3 || [])];
    for (let i = 0; i < allCurrentActions.length; i++) {
      if (allCurrentActions[i].id === action.id) { continue; }
      allCurrentActions[i].isSelected = false;
    }
    storageService.setCurrentCopiedActionV3(action);
    setCurrentCopiedValueV3(action);
    setMyCopiedActionsV3(allCurrentActions);
    communicationService.sendRequest({ actionType: ActionType.SetCurrentCopiedActionV3, message: action.actionJson }, AppElement.ReactApp, AppElement.Content);
  }, [communicationService, myCopiedActionsV3, storageService])

  const renderRecordButton = useCallback(() => {
    return isSharePointPage && <>{isRecording ?
      <Icon className="App-icon" iconName='CircleStopSolid' title="Stop Recording" onClick={sendRecordingStatus}></Icon> :
      <Icon className="App-icon" iconName='Record2' title="Start Recording" onClick={sendRecordingStatus}></Icon>
    }</>
  }, [isRecording, isSharePointPage, sendRecordingStatus])

  const renderClearButton = useCallback(() => {
    return (isSharePointPage || isPowerAutomatePage || hasActionsOnPageToCopy) && <Icon className="App-icon" iconName='Clear' title="Clear Items" onClick={clearActionList}></Icon>;
  }, [clearActionList, isPowerAutomatePage, isSharePointPage, hasActionsOnPageToCopy])

  const renderCopyButton = useCallback(() => {
    return isPowerAutomatePage && !isV3PowerAutomateEditor && <Icon className="App-icon" iconName='Copy' title="Copy Items" onClick={copyItems}></Icon>;
  }, [copyItems, isPowerAutomatePage, isV3PowerAutomateEditor])

  const renderGetClipboardActions = useCallback(() => {
    return isPowerAutomatePage && !isV3PowerAutomateEditor && <Icon className="App-icon" iconName='DoubleChevronDown12' title="Get 'My Clipboard Actions'" onClick={getMyClipboardActions}></Icon>;
  }, [getMyClipboardActions, isPowerAutomatePage, isV3PowerAutomateEditor])

  const renderCopyAllActionsFromPage = useCallback(() => {
    return hasActionsOnPageToCopy && !isPowerAutomatePage && <Icon className="App-icon" iconName='SetAction' title="Copy All Actions From Page" onClick={copyAllActionsFromPage}></Icon>;
  }, [copyAllActionsFromPage, hasActionsOnPageToCopy, isPowerAutomatePage])

  const renderV3CopiedAction = useCallback(() => {
    return isV3PowerAutomateEditor && currentCopiedValueV3 && <div className='Current-Action-Row' title={currentCopiedValueV3?.url}>
      <img src={currentCopiedValueV3?.icon} className='Current-Action-Icon' alt={currentCopiedValueV3?.title}></img>
      <span className='Current-Action-Element' title="Currently Copied Action">{currentCopiedValueV3?.title}</span>
      <Icon className='Current-Action-Delete' iconName='Delete' onClick={removeCurrentAction} title="Clear Current Copied Action"></Icon>
    </div>;
  }, [currentCopiedValueV3, isV3PowerAutomateEditor, removeCurrentAction])

  return (
    <div className="App">
      <header className="App-header">
        {renderRecordButton()}
        {renderClearButton()}
        {renderCopyButton()}
        {renderGetClipboardActions()}
        {renderCopyAllActionsFromPage()}
        {renderV3CopiedAction()}
      </header>
      <Pivot onLinkClick={(item: PivotItem | undefined) => {
        switch (item?.props.headerText) {
          case "Recorded Requests":
            setCurrentMode(Mode.Requests);
            break;
          case "Copied Actions":
            setCurrentMode(Mode.CopiedActions);
            break;
          case "Copied Actions in the new editor":
            setCurrentMode(Mode.CopiedActionsV3);
            break;
        }
      }}>
        {!isV3PowerAutomateEditor &&
          <PivotItem
            headerText="Recorded Requests"
          >
            <ActionsList
              actions={actions}
              mode={Mode.Requests}
              changeSelectionFunc={changeSelectionRecordedAction}
              deleteActionFunc={deleteRecordedAction}
              showButton={false}
            />
          </PivotItem>}
        {!isV3PowerAutomateEditor &&
          <PivotItem
            headerText="Copied Actions"
          >
            <ActionsList
              actions={myClipboardActions}
              mode={Mode.CopiedActions}
              changeSelectionFunc={changeCopiedActionSelection}
              deleteActionFunc={deleteMyClipboardAction}
              showButton={false}
            />
          </PivotItem>}
        {isV3PowerAutomateEditor && <PivotItem
          headerText="Copied Actions in the new editor"
        >
          <ActionsList
            actions={myCopiedActionsV3}
            mode={Mode.CopiedActionsV3}
            changeSelectionFunc={changeCopiedActionSelectionV3}
            deleteActionFunc={deleteCopiedActionV3}
            showButton={true}
          />
        </PivotItem>}
      </Pivot>
    </div >
  );
}

export default App;
