export interface IActionModel {
    id: string;
    url: string;
    icon: string;
    title: string;
    actionJson: string;
    method: string;
    isSPAction: boolean;
    isSelected?: boolean;
    body?: any;
}