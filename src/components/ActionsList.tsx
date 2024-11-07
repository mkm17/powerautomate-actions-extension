import { useCallback } from "react";
import { IActionsListProps } from "./IActionsListProps";
import { IActionModel } from "../models";
import { Checkbox, Icon } from "@fluentui/react";

const ActionsList: React.FC<IActionsListProps> = (props) => {
    const renderAction = useCallback((action: IActionModel) => {
        return <div className='App-Action-Row' title={action.url}>
            {props.showButton ?
                <Icon className='App-Action-Select' iconName='SingleBookmark' onClick={() => { props.changeSelectionFunc(action) }} title="Select Action To Copy"></Icon>
                :
                <Checkbox className='App-Action-Checkbox' checked={action.isSelected} defaultChecked={action.isSelected} onChange={() => { props.changeSelectionFunc(action) }}></Checkbox>}
            <img src={action.icon} className='App-Action-Icon' alt={action.title}></img>
            <span className='App-Action-Element'>{action.title}</span>
            <span className='App-Action-Element'>{action.method}</span>
            <Icon className='App-Action-Delete' iconName='Delete' onClick={() => { props.deleteActionFunc(action) }}></Icon>
        </div>;
    }, [props])

    const renderActions = useCallback(() => {
        return props.actions && props.actions.length > 0 && props.actions.map(renderAction)
    }, [props.actions, renderAction])

    const renderHeader = useCallback(() => {
        return <div className='App-Action-Header'>
            <span>Select</span>
            <span></span>
            <span>Title</span>
            <span>Method</span>
            <span></span>
        </div>;
    }, [])

    return <>
        <div>{renderHeader()}</div>
        <div className="App-Actions">{renderActions()}</div>
    </>;
}

export default ActionsList;