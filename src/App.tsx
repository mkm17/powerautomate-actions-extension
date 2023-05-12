import { useEffect, useState } from 'react';
import './App.css';
import { ActionType, IDataChromeMessage, AppElement, ICommunicationChromeMessage } from './models';
import { IActionModel } from './models/IActionModel';
import { StorageService } from './services/StorageService';
import { ExtensionCommunicationService } from './services';
import { Checkbox, Icon, Pivot, PivotItem, initializeIcons } from '@fluentui/react';

const enum Mode {
  CopiedActions,
  Requests,
}

function App() {
  const storageService = new StorageService();
  const communicationService = new ExtensionCommunicationService();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPowerAutomatePage, setIsPowerAutomatePage] = useState<boolean>(false);
  const [isSharePointPage, setIsSharePointPage] = useState<boolean>(false);
  const [hasActionsOnPageToCopy, setHasActionsOnPageToCopy] = useState<boolean>(false);
  const [actions, setActions] = useState<IActionModel[]>([]);
  const [myClipboardActions, setMyClipboardActions] = useState<IActionModel[]>([]);
  const [currentMode, setCurrentMode] = useState<Mode>(Mode.Requests);

  const listenToMessage = (message: ICommunicationChromeMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.to !== AppElement.ReactApp) { return console.log('Incorrect message destination'); }
    switch (message.actionType) {
      case ActionType.ActionUpdated:
        message.message && setActions(message.message);
        break;
      case ActionType.MyClipboardActionsUpdated:
        message.message && setMyClipboardActions(message.message);
        break;
    }
  }

  const initData = () => {
    initializeIcons();
    communicationService.sendRequest({ actionType: ActionType.CheckSharePointPage, message: "Check SharePoint Page" }, AppElement.ReactApp, AppElement.Content, (response) => {
      setIsSharePointPage(response)
    });
    communicationService.sendRequest({ actionType: ActionType.CheckPowerAutomatePage, message: "Check PowerAutomate Page" }, AppElement.ReactApp, AppElement.Content, (response) => {
      setIsPowerAutomatePage(response)
    });
    communicationService.sendRequest({ actionType: ActionType.CheckIfPageHasActionsToCopy, message: "Check If Page has actions to copy" }, AppElement.ReactApp, AppElement.Content, (response) => {
      setHasActionsOnPageToCopy(response)
    });
    storageService.getActions().then((actions) => {
      setActions(actions);
    });
    storageService.getMyClipboardActions().then((actions) => {
      setMyClipboardActions(actions);
    });

    storageService.getIsRecordingValue().then((isRecording) => {
      setIsRecording(isRecording);
    });
    chrome.runtime.onMessage.addListener(listenToMessage);
  }

  useEffect(initData, []);

  const sendRecordingStatus = () => {
    const message: IDataChromeMessage = isRecording
      ? { actionType: ActionType.StopRecording, message: "Stop recording" }
      : { actionType: ActionType.StartRecording, message: "Start recording" };
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, setIsRecording);
  };

  const copyAllActionsFromPage = () => {
    const message = {
      actionType: ActionType.CopyAllActionsFromPage,
      message: "Copy All Actions From Page",
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Content);
  }

  const clearRecordings = () => {
    if (currentMode === Mode.Requests) {
      storageService.clearActions();
      setActions([]);
    } else {
      storageService.clearMyClipboardActions();
      setMyClipboardActions([]);
    }
  }

  const copyItems = () => {
    const selectedActions = currentMode === Mode.Requests ? actions.filter(a => a.isSelected) : myClipboardActions.filter(a => a.isSelected);
    const message: IDataChromeMessage = {
      actionType: ActionType.CopyAction,
      message: selectedActions,
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Content);
  }

  const deleteAction = (action: IActionModel, oldActions: IActionModel[], setActionsFunc: (value: React.SetStateAction<IActionModel[]>) => void, actionType: ActionType) => {
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
  }

  const deleteRecordedAction = (action: IActionModel) => {
    deleteAction(action, actions, setActions, ActionType.DeleteAction);
  }

  const deleteMyClipboardAction = (action: IActionModel) => {
    deleteAction(action, myClipboardActions, setMyClipboardActions, ActionType.DeleteMyClipboardAction);
  }

  const getMyClipboardActions = () => {
    const message: IDataChromeMessage = {
      actionType: ActionType.GetElementsFromMyClipboard,
      message: "Get My Clipboard Actions",
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Content);
  }

  const renderRecordButton = () => {
    return isSharePointPage && <>{isRecording ?
      <Icon className="App-icon" iconName='CircleStopSolid' title="Stop Recording" onClick={sendRecordingStatus}></Icon> :
      <Icon className="App-icon" iconName='Record2' title="Start Recording" onClick={sendRecordingStatus}></Icon>
    }</>
  }

  const renderClearButton = () => {
    return <Icon className="App-icon" iconName='Clear' title="Clear Items" onClick={clearRecordings}></Icon>;
  }

  const renderCopyAllActionsFromPage = () => {
    return hasActionsOnPageToCopy && <Icon className="App-icon" iconName='SetAction' title="Copy All Actions From Page" onClick={copyAllActionsFromPage}></Icon>;
  }

  const renderCopyButton = () => {
    return isPowerAutomatePage && <Icon className="App-icon" iconName='Copy' title="Copy Items" onClick={copyItems}></Icon>;
  }

  const renderGetClipboardActions = () => {
    return isPowerAutomatePage && <Icon className="App-icon" iconName='DoubleChevronDown12' title="Get 'My Clipboard Actions'" onClick={getMyClipboardActions}></Icon>;
  }

  const changeSelection = (action: IActionModel, oldActions: IActionModel[], setActionsFunc: (value: React.SetStateAction<IActionModel[]>) => void) => {
    const allActions = [...(oldActions || [])];
    const index = allActions.findIndex(a => a.id === action.id);
    allActions[index].isSelected = !action.isSelected;

    setActionsFunc(allActions);
  }

  const renderRequestAction = (action: IActionModel, changeSelectionFunc: (action: IActionModel) => void, deleteActionFunc: (action: IActionModel) => void) => {
    return <div className='App-Action-Row' title={action.url}>
      <Checkbox className='App-Action-Checkbox' checked={action.isSelected} onChange={() => { changeSelectionFunc(action) }}></Checkbox>
      <img src={action.icon} className='App-Action-Icon' alt={action.title}></img>
      <span className='App-Action-Element'>{action.title}</span>
      <span className='App-Action-Element'>{action.method}</span>
      <Icon className='App-Action-Delete' iconName='Delete' onClick={() => { deleteActionFunc(action) }}></Icon>
    </div>;
  }

  const changeSelectionRecordedAction = (action: IActionModel) => {
    changeSelection(action, actions, setActions);
  }

  const renderRecordedAction = (action: IActionModel) => {
    return renderRequestAction(action, changeSelectionRecordedAction, deleteRecordedAction);
  }

  const renderRecordedActions = () => {
    return actions && actions.map(renderRecordedAction)
  }

  const changeCopiedActionSelection = (action: IActionModel) => {
    changeSelection(action, myClipboardActions, setMyClipboardActions);
  }

  const renderCopiedAction = (action: IActionModel) => {
    return renderRequestAction(action, changeCopiedActionSelection, deleteMyClipboardAction);
  }

  const renderCopiedActions = () => {
    return myClipboardActions && myClipboardActions.map(renderCopiedAction)
  }

  const renderHeader = () => {
    return <div className='App-Action-Header'>
      <span>Select</span>
      <span></span>
      <span>Title</span>
      <span>Method</span>
      <span></span>
    </div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        {renderRecordButton()}
        {renderClearButton()}
        {renderCopyButton()}
        {renderGetClipboardActions()}
        {renderCopyAllActionsFromPage()}
      </header>
      <Pivot onLinkClick={(item: PivotItem | undefined) => {
        if (item?.props.headerText === "Recorded Requests") {
          setCurrentMode(Mode.Requests);
        }
        else {
          setCurrentMode(Mode.CopiedActions);
        }
      }}>
        <PivotItem
          headerText="Recorded Requests"
        >
          <div>{renderHeader()}</div>
          <div>{renderRecordedActions()}</div>
        </PivotItem>
        <PivotItem
          headerText="Copied Actions"
        >
          <div>{renderHeader()}</div>
          <div>{renderCopiedActions()}</div>
        </PivotItem>
      </Pivot>

    </div >
  );
}

export default App;
