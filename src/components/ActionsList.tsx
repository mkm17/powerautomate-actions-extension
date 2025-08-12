import { useCallback } from "react";
import { Checkbox, Icon } from "@fluentui/react";
import { IActionModel, Mode } from "../models";

export interface IActionsListProps {
    actions: IActionModel[];
    mode: Mode;
    changeSelectionFunc: (action: IActionModel) => void;
    deleteActionFunc: (action: IActionModel) => void;
    showButton: boolean;
    toggleFavoriteFunc?: (action: IActionModel) => void;
}

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
            {props.toggleFavoriteFunc && (
                <Icon 
                    className='App-Action-Favorite' 
                    iconName={action.isFavorite ? 'FavoriteStarFill' : 'FavoriteStar'} 
                    onClick={() => { props.toggleFavoriteFunc!(action) }} 
                    title={action.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                ></Icon>
            )}
            <Icon className='App-Action-Delete' iconName='Delete' onClick={() => { props.deleteActionFunc(action) }}></Icon>
        </div>;
    }, [props])

    const renderActions = useCallback(() => {
        return props.actions && props.actions.length > 0 && props.actions.map(renderAction)
    }, [props.actions, renderAction])

    const renderHeader = useCallback(() => {
        const columns = props.toggleFavoriteFunc ? 6 : 5;
        return <div className='App-Action-Header' style={{ gridTemplateColumns: props.toggleFavoriteFunc ? '100px 30px 1fr repeat(3, 100px)' : '100px 30px 1fr repeat(2, 100px)' }}>
            <span>Select</span>
            <span></span>
            <span>Title</span>
            <span>Method</span>
            {props.toggleFavoriteFunc && <span>Favorite</span>}
            <span></span>
        </div>;
    }, [props.toggleFavoriteFunc])

    return <>
        <div>{renderHeader()}</div>
        <div className="App-Actions">{renderActions()}</div>
    </>;
}

export default ActionsList;