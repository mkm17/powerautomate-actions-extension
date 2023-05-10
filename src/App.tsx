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
    let message: IDataChromeMessage | null = null;
    if (isRecording) {
      message = {
        actionType: ActionType.StopRecording,
        message: "Stop recording",
      }
    }
    else {
      message = {
        actionType: ActionType.StartRecording,
        message: "Start recording",
      }
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, (response) => {
      setIsRecording(response)
    });
  };

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

  const deleteAction = (action: IActionModel) => {
    const message: IDataChromeMessage = {
      actionType: ActionType.DeleteAction,
      message: action,
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, (response) => {
      const myArray = [...(actions || [])];
      const index = myArray.findIndex((a) => a.id === action.id);
      myArray.splice(index, 1);
      setActions(myArray);
    });
  }

  const deleteMyClipboardAction = (action: IActionModel) => {
    const message: IDataChromeMessage = {
      actionType: ActionType.DeleteMyClipboardAction,
      message: action,
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, (response) => {
      const myArray = [...(myClipboardActions || [])];
      const index = myArray.findIndex((a) => a.id === action.id);
      myArray.splice(index, 1);
      setMyClipboardActions(myArray);
    });
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

  const renderCopyButton = () => {
    return isPowerAutomatePage && <Icon className="App-icon" iconName='Copy' title="Copy Items" onClick={copyItems}></Icon>;
  }

  const renderGetClipboardActions = () => {
    return isPowerAutomatePage && <Icon className="App-icon" iconName='DoubleChevronDown12' title="Get 'My Clipboard Actions'" onClick={getMyClipboardActions}></Icon>;
  }

  const changeSelection = (action: IActionModel) => {
    const allActions = [...(actions || [])];
    const index = allActions.findIndex(a => a.id === action.id);
    allActions[index].isSelected = !action.isSelected;

    setActions(allActions);
  }

  const renderRequest = (action: IActionModel) => {
    return <div className='App-Action-Row' title={action.url}>
      <Checkbox className='App-Action-Checkbox' checked={action.isSelected} onChange={() => { changeSelection(action) }}></Checkbox>
      <img src={action.icon} className='App-Action-Icon' alt={action.title}></img>
      <span className='App-Action-Element'>{action.title}</span>
      <span className='App-Action-Element'>{action.method}</span>
      <Icon className='App-Action-Delete' iconName='Delete' onClick={() => { deleteAction(action) }}></Icon>
    </div>;
  }

  const renderRequests = () => {
    return actions && actions.map(renderRequest)
  }

  const changeCopiedActionSelection = (action: IActionModel) => {
    const allActions = [...(myClipboardActions || [])];
    const index = allActions.findIndex(a => a.id === action.id);
    allActions[index].isSelected = !action.isSelected;

    setMyClipboardActions(allActions);
  }

  const renderCopiedAction = (action: IActionModel) => {
    return <div className='App-Action-Row' title={action.url}>
      <Checkbox className='App-Action-Checkbox' checked={action.isSelected} onChange={() => { changeCopiedActionSelection(action) }}></Checkbox>
      <img src={action.icon} className='App-Action-Icon' alt={action.title}></img>
      <span className='App-Action-Element'>{action.title}</span>
      <span className='App-Action-Element'>{action.method}</span>
      <Icon className='App-Action-Delete' iconName='Delete' onClick={() => { deleteMyClipboardAction(action) }}></Icon>
    </div>;
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
          <div>{renderRequests()}</div>
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
